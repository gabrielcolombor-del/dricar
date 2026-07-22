const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--> Sincronizando veículos 'Disponível' do ERP com o 'Catálogo Ativo' do site...");

  // Buscar todos os veículos com status "Disponível" no ERP
  const veiculosDisponiveis = await prisma.veiculo.findMany({
    where: { status: "Disponível" }
  });

  console.log(`Total de Veículos com status 'Disponível' no ERP: ${veiculosDisponiveis.length}`);

  let ativados = 0;

  for (const v of veiculosDisponiveis) {
    const existingCar = await prisma.car.findFirst({
      where: { veiculoId: v.id }
    });

    const yearString = `${v.anoFab}/${v.anoMod}`;
    const priceNumber = parseFloat(v.valorCompra.toString());
    const suggestedPrice = priceNumber > 0 
      ? ('R$ ' + Number(priceNumber * 1.15).toLocaleString('pt-BR', { maximumFractionDigits: 0 }))
      : 'Sob Consulta';

    if (existingCar) {
      await prisma.car.update({
        where: { id: existingCar.id },
        data: { status: "active", brand: v.marca, model: v.modelo, year: yearString }
      });
      ativados++;
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
          price: suggestedPrice,
          category: "Hatch",
          images: [],
          veiculoId: v.id,
        }
      });
      ativados++;
    }
  }

  console.log(`\n✅ Sucesso! Total de ${ativados} carros marcados como 'active' / 'Disponível' no Catálogo do Site!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
