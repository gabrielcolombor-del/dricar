const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const Papa = require('papaparse');

const prisma = new PrismaClient();

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

function parseSmartDate(cleanStr) {
  if (!cleanStr) return null;
  const s = String(cleanStr).trim();

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split('/');
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    let month = p2;
    let day = p1;

    // Se p2 > 12, p2 só pode ser o dia, então p1 é o mês! (Ex: 06/14/2026 -> Mês 6, Dia 14)
    if (p2 > 12) {
      month = p1;
      day = p2;
    } else if (p1 <= 12 && p2 <= 12 && year === 2026) {
      // Para o ano de 2026 na planilha, o formato é MM/DD/YYYY (Ex: 06/08/2026 é 08 de Junho de 2026)
      // Se o mês resultante (p1) for <= 7 (Julho), assume MM/DD/YYYY
      if (p1 <= 7) {
        month = p1;
        day = p2;
      }
    }

    const monthPadded = String(month).padStart(2, '0');
    const dayPadded = String(day).padStart(2, '0');
    return new Date(`${year}-${monthPadded}-${dayPadded}T12:00:00Z`);
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  console.log("--> Reprocessando datas de 2026 com o formato correto (MM/DD/YYYY)...");

  const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const [allVeiculos, allVendas] = await Promise.all([
    prisma.veiculo.findMany({ select: { id: true, placa: true } }),
    prisma.venda.findMany({ select: { id: true, veiculoId: true } }),
  ]);

  const veiculoMap = new Map();
  allVeiculos.forEach(v => veiculoMap.set(v.placa.toUpperCase().replace(/[^A-Z0-9]/g, ""), v));

  const vendaMap = new Map();
  allVendas.forEach(v => vendaMap.set(v.veiculoId, v));

  let reprocessadas = 0;
  let zeradasFuturo = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawPlaca = getFieldValue(row, ['PLACA']);
    const rawDataVenda = getFieldValue(row, ['DATA DA VENDA', 'DATA DE VENDA', 'DATA VENDA', 'DATA']);

    const cleanPlaca = (rawPlaca || '').toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanPlaca) continue;

    const dataVendaParsed = parseSmartDate(rawDataVenda);
    if (!dataVendaParsed) continue;

    const veiculo = veiculoMap.get(cleanPlaca);
    if (!veiculo) continue;

    const existingVenda = vendaMap.get(veiculo.id);
    if (!existingVenda) continue;

    // Se por acaso alguma data resultar em futuro (> 22 de Julho de 2026), descarta ou limita a Julho
    const limiteAtual = new Date('2026-07-22T23:59:59Z');
    let finalDate = dataVendaParsed;

    if (dataVendaParsed > limiteAtual) {
      zeradasFuturo++;
      continue; // Não importa vendas futuras do CSV histórico
    }

    const dateStr = finalDate.toISOString();

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "vendas" SET "data_venda" = '${dateStr}'::date WHERE "id" = '${existingVenda.id}'::uuid;`
      );
      await prisma.$executeRawUnsafe(
        `UPDATE "veiculos" SET "data_entrada" = '${dateStr}'::date WHERE "id" = '${veiculo.id}'::uuid;`
      );
      reprocessadas++;
    } catch (e) {
      // Ignora
    }
  }

  console.log(`\n✅ Sucesso! Total de ${reprocessadas} vendas de 2026 reprocessadas corretamente.`);
  console.log(`- Vendas com data futura removidas/ignoradas: ${zeradasFuturo}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
