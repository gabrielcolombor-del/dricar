const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--> Eliminando permanentemente todas as vendas registradas de 01/08/2026 em diante no PostgreSQL...");

  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM "vendas" WHERE "data_venda" >= '2026-08-01'::date;`
  );

  console.log(`\n✅ Sucesso! Eliminadas ${result} vendas com datas de Agosto a Dezembro de 2026.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
