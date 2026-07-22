const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--> Restaurando a regra do pátio e catálogo:");
  console.log("1. Todos os 1.768 carros importados das planilhas históricas CSV = 'Vendido' (ERP) e 'sold' (Catálogo).");
  console.log("2. Apenas os 11 carros originais cadastrados no site (e futuros cadastros do usuário) = 'Disponível' (ERP) e 'active' (Catálogo).\n");

  // 1. Atualizar TODOS os carros vinculados às planilhas para "sold" e "Vendido"
  await prisma.car.updateMany({
    where: { veiculoId: { not: null } },
    data: { status: "sold" }
  });

  await prisma.veiculo.updateMany({
    data: { status: "Vendido" }
  });

  // 2. Buscar os 11 carros originais do site (que não possuem veiculoId da planilha importada)
  const originalCars = await prisma.car.findMany({
    where: { veiculoId: null }
  });

  console.log(`Carros originais do site encontrados: ${originalCars.length}`);

  let ativados = 0;

  for (const car of originalCars) {
    // Definir status como "active" no catálogo
    await prisma.car.update({
      where: { id: car.id },
      data: { status: "active" }
    });

    // Criar ou vincular um registro no Veiculo (ERP) com status "Disponível"
    const placaPlaceholder = `SITE-${car.model.replace(/\s/g, '').toUpperCase().slice(0, 4)}`;

    let veiculo = await prisma.veiculo.findFirst({
      where: { placa: placaPlaceholder }
    });

    if (!veiculo) {
      veiculo = await prisma.veiculo.create({
        data: {
          placa: placaPlaceholder,
          marca: car.brand || 'Outra',
          modelo: car.model || 'Veículo do Site',
          anoFab: 2024,
          anoMod: 2024,
          valorCompra: 0,
          dataEntrada: new Date(),
          status: 'Disponível',
        }
      });
    } else {
      await prisma.veiculo.update({
        where: { id: veiculo.id },
        data: { status: 'Disponível' }
      });
    }

    // Vincular veiculoId no Car
    await prisma.car.update({
      where: { id: car.id },
      data: { veiculoId: veiculo.id }
    });

    ativados++;
  }

  console.log(`\n✅ REGRA APLICADA COM SUCESSO!`);
  console.log(`- Catálogo Ativo (Site): ${ativados} carros disponíveis`);
  console.log(`- Estoque (ERP): ${ativados} carros com status 'Disponível'`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
