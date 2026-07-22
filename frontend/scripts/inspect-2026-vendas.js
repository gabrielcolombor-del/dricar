const fs = require('fs');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

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

async function main() {
  const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  console.log("Amostra das últimas 30 linhas da planilha de vendas:");
  const ultimas = rows.slice(-30);
  ultimas.forEach((r, idx) => {
    const dataRaw = getFieldValue(r, ['DATA DA VENDA', 'DATA DE VENDA', 'DATA VENDA', 'DATA']);
    const placa = getFieldValue(r, ['PLACA']);
    const comprador = getFieldValue(r, ['COMPRADOR', 'CLIENTE']);
    const valor = getFieldValue(r, ['VALOR DE VENDA', 'VALOR']);
    console.log(`Linha ${rows.length - 30 + idx + 1}: Placa "${placa}", Data: "${dataRaw}", Comprador: "${comprador}", Valor: "${valor}"`);
  });

  // Verificar vendas no banco com ano 2026 ou 2025
  const vendas2026 = await prisma.venda.findMany({
    where: {
      dataVenda: {
        gte: new Date('2026-01-01T00:00:00Z'),
        lte: new Date('2026-12-31T23:59:59Z')
      }
    }
  });

  console.log(`\nVendas no Banco em 2026: ${vendas2026.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
