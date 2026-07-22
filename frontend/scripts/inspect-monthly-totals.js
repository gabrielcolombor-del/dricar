const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

async function main() {
  const vendas = await prisma.venda.findMany({
    select: { dataVenda: true, valorVendaVeiculo: true, valorRetornoBancario: true },
    orderBy: { dataVenda: 'asc' }
  });

  const porMes2025 = Array(12).fill(0);
  const porMes2026 = Array(12).fill(0);
  const count2025 = Array(12).fill(0);
  const count2026 = Array(12).fill(0);

  vendas.forEach(v => {
    const d = new Date(v.dataVenda);
    const ano = d.getFullYear();
    const mes = d.getMonth(); // 0-11
    const valor = (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0);

    if (ano === 2025) {
      porMes2025[mes] += valor;
      count2025[mes]++;
    } else if (ano === 2026) {
      porMes2026[mes] += valor;
      count2026[mes]++;
    }
  });

  console.log("=== FATURAMENTO MENSAL 2025 ===");
  MESES.forEach((m, idx) => {
    console.log(`${m}/2025: R$ ${porMes2025[idx].toLocaleString("pt-BR", {minimumFractionDigits: 2})} (${count2025[idx]} vendas)`);
  });

  console.log("\n=== FATURAMENTO MENSAL 2026 ===");
  MESES.forEach((m, idx) => {
    console.log(`${m}/2026: R$ ${porMes2026[idx].toLocaleString("pt-BR", {minimumFractionDigits: 2})} (${count2026[idx]} vendas)`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
