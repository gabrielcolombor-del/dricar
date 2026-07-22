const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vendas = await prisma.venda.findMany({
    select: { dataVenda: true, valorVendaVeiculo: true, valorRetornoBancario: true },
    orderBy: { dataVenda: 'asc' }
  });

  console.log(`Total de Vendas no Banco: ${vendas.length}`);

  if (vendas.length > 0) {
    console.log(`Primeira Venda em: ${vendas[0].dataVenda}`);
    console.log(`Última Venda em: ${vendas[vendas.length - 1].dataVenda}`);
  }

  // Agrupar por ano
  const porAno = {};
  vendas.forEach(v => {
    const ano = new Date(v.dataVenda).getFullYear();
    porAno[ano] = (porAno[ano] || 0) + 1;
  });

  console.log("\nDistribuição de Vendas por Ano:");
  console.log(porAno);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
