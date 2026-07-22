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
  console.log("--> Identificando veículos do Estoque que não possuem registro de Venda...");

  // 1. Ler planilhas
  const vendasContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsedVendas = Papa.parse(vendasContent, { header: true, skipEmptyLines: true });
  const soldPlacas = new Set();

  parsedVendas.data.forEach(r => {
    const p = getFieldValue(r, ['PLACA']);
    if (p) {
      const clean = String(p).toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (clean) soldPlacas.add(clean);
    }
  });

  console.log(`Total de placas vendidas na planilha de vendas: ${soldPlacas.size}`);

  // 2. Buscar veículos no banco que NÃO estão em vendas ou não possuem Venda cadastrada
  const allVeiculos = await prisma.veiculo.findMany({
    include: { vendas: true }
  });

  let disponiveis = 0;

  for (const v of allVeiculos) {
    const cleanPlaca = v.placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const temVendaNoBanco = v.vendas && v.vendas.length > 0;
    const temVendaNoCsv = soldPlacas.has(cleanPlaca);

    // Se NÃO tem venda nem no banco nem no CSV, é um veículo DISPONÍVEL em estoque!
    if (!temVendaNoBanco && !temVendaNoCsv) {
      await prisma.veiculo.update({
        where: { id: v.id },
        data: { status: "Disponível" }
      });

      // Sincronizar catálogo do site
      const yearString = `${v.anoFab}/${v.anoMod}`;
      const existingCar = await prisma.car.findFirst({ where: { veiculoId: v.id } });

      if (existingCar) {
        await prisma.car.update({
          where: { id: existingCar.id },
          data: { status: "active", brand: v.marca, model: v.modelo, year: yearString }
        });
      } else {
        await prisma.car.create({
          data: {
            brand: v.marca,
            model: v.modelo,
            year: yearString,
            status: "active",
            description: `${v.marca} ${v.modelo} ${yearString}`,
            mileage: "0 km",
            transmission: "Manual",
            price: "Sob Consulta",
            category: "Hatch",
            images: [],
            veiculoId: v.id,
          }
        });
      }

      disponiveis++;
    }
  }

  console.log(`\n✅ Sucesso! Encontrados ${disponiveis} veículos realmente DISPONÍVEIS em Estoque.`);
  console.log(`Estes ${disponiveis} veículos agora estão com status 'Disponível' no ERP e 'active' no Catálogo do Site!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
