const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [veiculos, vendas, carros, clientes] = await Promise.all([
    prisma.veiculo.count(),
    prisma.venda.count(),
    prisma.car.count(),
    prisma.clienteCrm.count(),
  ]);

  console.log("=== RELATÓRIO DO BANCO DE DADOS DA DRICAR ===");
  console.log(`- Total de Veículos no ERP: ${veiculos}`);
  console.log(`- Total de Vendas Registradas: ${vendas}`);
  console.log(`- Total de Carros no Catálogo do Site: ${carros}`);
  console.log(`- Total de Clientes no CRM: ${clientes}`);
  console.log("===============================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
