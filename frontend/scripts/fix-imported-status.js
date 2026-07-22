const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--> Atualizando todos os veículos importados das planilhas históricas para 'Vendido'...");

  // 1. Atualizar todos os veículos no ERP (Veiculo)
  const veiculosResult = await prisma.veiculo.updateMany({
    data: {
      status: "Vendido",
    },
  });

  // 2. Atualizar todos os carros no catálogo (Car)
  const carsResult = await prisma.car.updateMany({
    data: {
      status: "sold",
    },
  });

  console.log(`✅ Sucesso!`);
  console.log(`- Veículos (ERP) marcados como Vendido: ${veiculosResult.count}`);
  console.log(`- Carros (Catálogo) marcados como Sold: ${carsResult.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
