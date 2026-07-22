const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const Papa = require('papaparse');

const prisma = new PrismaClient();

function parseDecimal(value) {
  if (value === undefined || value === null || value === '') return 0;
  let clean = String(value).replace('R$', '').replace(/\s/g, '').trim();
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function parseDate(value) {
  if (!value) return null;
  const clean = String(value).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/');
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00Z`);
  }
  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getFieldValue(row, possibleNames) {
  for (const key of Object.keys(row)) {
    const normalized = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const name of possibleNames) {
      if (normalized === name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()) {
        return row[key];
      }
    }
  }
  return null;
}

async function main() {
  console.log("--> Iniciando sincronização segura de datas de 2020 a 2026...");

  const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const [allVeiculos, allVendas] = await Promise.all([
    prisma.veiculo.findMany({ select: { id: true, placa: true, valorCompra: true } }),
    prisma.venda.findMany({ select: { id: true, veiculoId: true } }),
  ]);

  const veiculoMap = new Map();
  allVeiculos.forEach(v => veiculoMap.set(v.placa.toUpperCase().trim(), v));

  const vendaMap = new Map();
  allVendas.forEach(v => vendaMap.set(v.veiculoId, v));

  let atualizadas = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawPlaca = getFieldValue(row, ['PLACA']);
    const rawDataVenda = getFieldValue(row, ['DATA DA VENDA', 'DATA DE VENDA', 'DATA VENDA', 'DATA', 'DATA_VENDA']);
    const rawValorVenda = getFieldValue(row, ['VALOR DE VENDA', 'VALOR DE VENDA R$', 'VALOR VENDA', 'VALOR', 'VENDA']);

    const placa = (rawPlaca || '').toUpperCase().trim();
    if (!placa) continue;

    const dataVendaParsed = parseDate(rawDataVenda);
    const valorVenda = parseDecimal(rawValorVenda);

    if (!dataVendaParsed) continue;

    const veiculo = veiculoMap.get(placa);
    if (!veiculo) continue;

    const existingVenda = vendaMap.get(veiculo.id);

    if (existingVenda) {
      try {
        await prisma.venda.update({
          where: { id: existingVenda.id },
          data: {
            dataVenda: dataVendaParsed,
            valorVendaVeiculo: valorVenda > 0 ? valorVenda : undefined,
          },
        });
        await prisma.veiculo.update({
          where: { id: veiculo.id },
          data: { dataEntrada: dataVendaParsed, status: "Vendido" },
        });
        atualizadas++;
      } catch (e) {
        // Ignorar erros individuais
      }
    }
  }

  console.log(`\n✅ SINCRONIZAÇÃO DE DATAS CONCLUÍDA! Total atualizadas: ${atualizadas}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
