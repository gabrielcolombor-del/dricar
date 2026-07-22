const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--> Removendo/Repaginando vendas de meses futuros (Agosto a Dezembro de 2026)...");

  // Buscar todas as vendas com dataVenda em Agosto, Setembro, Outubro, Novembro ou Dezembro de 2026
  const vendasFuturas = await prisma.venda.findMany({
    where: {
      dataVenda: {
        gte: new Date('2026-08-01T00:00:00Z'),
      }
    }
  });

  console.log(`Encontradas ${vendasFuturas.length} vendas com datas futuras de Agosto a Dezembro de 2026.`);

  let ajustadas = 0;

  for (const v of vendasFuturas) {
    // Reajustar essas vendas importadas do CSV para Junho/Julho de 2026
    const iso = new Date(v.dataVenda).toISOString();
    const day = iso.slice(8, 10);
    const newDate = new Date(`2026-06-${day.padStart(2, '0')}T12:00:00Z`);

    try {
      await prisma.venda.update({
        where: { id: v.id },
        data: { dataVenda: isNaN(newDate.getTime()) ? new Date('2026-06-15T12:00:00Z') : newDate }
      });
      ajustadas++;
    } catch (e) {
      // Ignorar
    }
  }

  console.log(`\n✅ Sucesso! Total de ${ajustadas} vendas de meses futuros foram corrigidas para Junho/Julho de 2026.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
