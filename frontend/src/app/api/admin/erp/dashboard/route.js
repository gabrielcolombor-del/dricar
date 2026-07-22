import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtualIndex = hoje.getMonth(); // 0 a 11

    // Buscar TODAS as vendas do banco de dados
    const todasVendas = await prisma.venda.findMany({
      orderBy: { dataVenda: "asc" },
    });

    // 1. Mês Atual
    const vendasMesAtual = todasVendas.filter(v => {
      const d = new Date(v.dataVenda);
      return d.getFullYear() === anoAtual && d.getMonth() === mesAtualIndex;
    });

    const faturamentoMesAtual = vendasMesAtual.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );
    const carrosVendidosMes = vendasMesAtual.length;
    const ticketMedioMes = carrosVendidosMes > 0 ? faturamentoMesAtual / carrosVendidosMes : 0;

    // 2. Ano Atual (Jan 1 até Hoje)
    const vendasAnoAtual = todasVendas.filter(v => {
      const d = new Date(v.dataVenda);
      return d.getFullYear() === anoAtual;
    });

    const faturamentoAnoAtual = vendasAnoAtual.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );
    const carrosVendidosAno = vendasAnoAtual.length;
    const ticketMedioAno = carrosVendidosAno > 0 ? faturamentoAnoAtual / carrosVendidosAno : 0;

    const percentualDoTotalAno = faturamentoAnoAtual > 0 ? (faturamentoMesAtual / faturamentoAnoAtual) * 100 : 0;

    // 3. Ano Anterior (Mesmo Período: Jan 1 até Mês Atual Index no Ano Passado)
    const anoAnterior = anoAtual - 1;
    const fimMesAnoAnteriorMesmoPeriodo = new Date(anoAnterior, mesAtualIndex + 1, 0, 23, 59, 59);

    const vendasAnoAnteriorMesmoPeriodo = todasVendas.filter(v => {
      const d = new Date(v.dataVenda);
      return d.getFullYear() === anoAnterior && d <= fimMesAnoAnteriorMesmoPeriodo;
    });

    const faturamentoAnoAnteriorMesmoPeriodo = vendasAnoAnteriorMesmoPeriodo.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );

    // Comparativo YoY (%)
    let comparativoYoY = 0;
    if (faturamentoAnoAnteriorMesmoPeriodo > 0) {
      comparativoYoY = ((faturamentoAnoAtual - faturamentoAnoAnteriorMesmoPeriodo) / faturamentoAnoAnteriorMesmoPeriodo) * 100;
    } else if (faturamentoAnoAtual > 0) {
      comparativoYoY = 100;
    }

    // 4. Ticket Médio Geral
    const totalFaturamentoGeral = todasVendas.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );
    const ticketMedioGeral = todasVendas.length > 0 ? totalFaturamentoGeral / todasVendas.length : 0;

    // 5. Dados Mensais para o Gráfico (Jan a Dez para Ano Atual e Ano Anterior)
    const comparativoMensal = MESES_ABREV.map((mesNome, index) => {
      // Vendas do ano atual neste mês
      const valAnoAtual = vendasAnoAtual
        .filter(v => new Date(v.dataVenda).getMonth() === index)
        .reduce((acc, v) => acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0);

      // Vendas do ano anterior neste mês
      const valAnoAnterior = todasVendas
        .filter(v => {
          const d = new Date(v.dataVenda);
          return d.getFullYear() === anoAnterior && d.getMonth() === index;
        })
        .reduce((acc, v) => acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0);

      const isFuturo = index > mesAtualIndex;

      return {
        mes: mesNome,
        valAnoAtual: isFuturo ? 0 : valAnoAtual,
        valAnoAnterior,
        isFuturo,
      };
    });

    return NextResponse.json({
      meta: {
        mesAtualNome: MESES_FULL[mesAtualIndex],
        mesAtualAbrev: MESES_ABREV[mesAtualIndex],
        anoAtual,
        anoAnterior,
      },
      cards: {
        faturamentoMesAtual,
        percentualDoTotalAno,
        carrosVendidosMes,
        ticketMedioMes,
        faturamentoAnoAtual,
        comparativoYoY,
        faturamentoAnoAnteriorMesmoPeriodo,
        carrosVendidosAno,
        ticketMedioAno,
        ticketMedioGeral,
      },
      comparativoMensal,
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}
