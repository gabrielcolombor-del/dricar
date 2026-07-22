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

async function main() {
  const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const allVeiculos = await prisma.veiculo.findMany({ select: { id: true, placa: true } });
  const veiculoMap = new Map();
  allVeiculos.forEach(v => veiculoMap.set(v.placa.toUpperCase().replace(/[^A-Z0-9]/g, ""), v));

  let matched2025 = 0;
  let missing2025 = 0;

  rows.forEach((row, i) => {
    const dataRaw = getFieldValue(row, ['DATA DA VENDA', 'DATA DE VENDA', 'DATA VENDA', 'DATA']);
    if (dataRaw && String(dataRaw).includes('2025')) {
      const placaRaw = getFieldValue(row, ['PLACA']);
      const cleanPlaca = (placaRaw || '').toUpperCase().replace(/[^A-Z0-9]/g, "");
      const v = veiculoMap.get(cleanPlaca);
      if (v) {
        matched2025++;
      } else {
        missing2025++;
        if (missing2025 <= 10) {
          console.log(`Faltando no banco 2025 - Linha ${i+2}: Placa "${placaRaw}" (limpa: "${cleanPlaca}")`);
        }
      }
    }
  });

  console.log(`\nDiagnóstico 2025: ${matched2025} encontrados no banco, ${missing2025} faltando no banco.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
