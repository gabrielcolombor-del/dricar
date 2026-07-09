const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando a limpeza dos acessórios de todos os carros...");
  const result = await prisma.car.updateMany({
    data: {
      accessories: ""
    }
  });
  console.log(`Sucesso! ${result.count} carros foram limpos de acessórios.`);
}

main()
  .catch((e) => {
    console.error("Erro ao limpar acessórios:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
