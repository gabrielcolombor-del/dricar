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
  console.log("--> Priorizando atualização imediata dos anos de 2025 e 2026...");

  const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const [allVeiculos, allVendas] = await Promise.all([
    prisma.veiculo.findMany({ select: { id: true, placa: true, valorCompra: true } }),
    prisma.venda.findMany({ select: { id: true, veiculoId: true } }),
  ]);

  const veiculoMap = new Map();
  allVeiculos.forEach(v => veiculoMap.set(v.placa.toUpperCase().replace(/[^A-Z0-9]/g, ""), v));

  const vendaMap = new Map();
  allVendas.forEach(v => vendaMap.set(v.veiculoId, v));

  let count2025 = 0;
  let count2026 = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawPlaca = getFieldValue(row, ['PLACA']);
    const rawDataVenda = getFieldValue(row, ['DATA DA VENDA', 'DATA DE VENDA', 'DATA VENDA', 'DATA']);
    const rawValorVenda = getFieldValue(row, ['VALOR DE VENDA', 'VALOR DE VENDA R$', 'VALOR VENDA', 'VALOR']);

    const cleanPlaca = (rawPlaca || '').toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanPlaca) continue;

    const dataVendaParsed = parseDate(rawDataVenda);
    const valorVenda = parseDecimal(rawValorVenda);

    if (!dataVendaParsed) continue;

    const year = dataVendaParsed.getFullYear();
    // PROCESSA APENAS 2025 E 2026 NESTE SCRIPT PRIORITÁRIO
    if (year !== 2025 && year !== 2026) continue;

    const veiculo = veiculoMap.get(cleanPlaca);
    if (!veiculo) continue;

    const existingVenda = vendaMap.get(veiculo.id);
    const dateStr = dataVendaParsed.toISOString();
    const finalValor = valorVenda > 0 ? valorVenda : parseFloat(veiculo.valorCompra.toString());

    try {
      if (existingVenda) {
        await prisma.$executeRawUnsafe(
          `UPDATE "vendas" SET "data_venda" = '${dateStr}'::date, "valor_venda_veiculo" = ${finalValor} WHERE "id" = '${existingVenda.id}'::uuid;`
        );
        await prisma.$executeRawUnsafe(
          `UPDATE "veiculos" SET "data_entrada" = '${dateStr}'::date, "status" = 'Vendido' WHERE "id" = '${veiculo.id}'::uuid;`
        );
        if (year === 2025) count2025++;
        if (year === 2026) count2026++;
      }
    } catch (e) {
      console.error(`Erro ao atualizar placa ${cleanPlaca}:`, e.message);
    }
  }

  console.log(`\n🎉 SUCESSO CONCLUÍDO!`);
  console.log(`- Vendas de 2025 Atualizadas: ${count2025}`);
  console.log(`- Vendas de 2026 Atualizadas: ${count2026}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
