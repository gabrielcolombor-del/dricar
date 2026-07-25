const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vendas = await prisma.venda.findMany();
  let count = 0;
  for (const v of vendas) {
    if (v.contratoPayload !== null) {
      count++;
      console.log('ID:', v.id, 'Payload type:', typeof v.contratoPayload, 'Content:', JSON.stringify(v.contratoPayload));
      if (count >= 5) break;
    }
  }
  console.log('Total checked:', vendas.length, 'Non-null count:', count);
}

main().finally(() => prisma.$disconnect());
