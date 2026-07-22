const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cars = await prisma.car.findMany({
    include: { veiculo: true },
    orderBy: { id: 'asc' }
  });

  console.log(`Total de Carros no Catálogo do Site: ${cars.length}`);

  const userCreated = cars.filter(c => !c.veiculoId || !c.veiculo?.placa?.startsWith('IMP-') && c.veiculo?.placa?.length === 7 && false);
  
  // Imprimir primeiros 20 carros para ver atributos e datas
  console.log("\nAmostra dos 20 primeiros carros no banco:");
  cars.slice(0, 20).forEach((c, idx) => {
    console.log(`Carro ${idx+1}: ID ${c.id.substring(0,8)}... | ${c.brand} ${c.model} (${c.year}) | Placa: ${c.veiculo?.placa || 'Sem placa ERP'} | Status: ${c.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
