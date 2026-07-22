import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// Extrator UTC seguro para evitar distorções de fuso horário (ex: 01/04 GMT-3 virar 31/03)
function getIsoYearMonth(dateInput) {
  if (!dateInput) return { year: 0, monthIndex: 0 };
  const d = new Date(dateInput);
  const iso = d.toISOString();
  const year = parseInt(iso.slice(0, 4));
  const monthIndex = parseInt(iso.slice(5, 7)) - 1; // 0 a 11
  return { year, monthIndex };
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const hoje = new Date();
    const { year: anoAtual, monthIndex: mesAtualIndex } = getIsoYearMonth(hoje);
    const anoAnterior = anoAtual - 1;

    // Buscar TODAS as vendas do banco de dados
    const todasVendas = await prisma.venda.findMany({
      orderBy: { dataVenda: "asc" },
    });

    // 1. Mês Atual
    const vendasMesAtual = todasVendas.filter(v => {
      const { year, monthIndex } = getIsoYearMonth(v.dataVenda);
      return year === anoAtual && monthIndex === mesAtualIndex;
    });

    const faturamentoMesAtual = vendasMesAtual.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );
    const carrosVendidosMes = vendasMesAtual.length;
    const ticketMedioMes = carrosVendidosMes > 0 ? faturamentoMesAtual / carrosVendidosMes : 0;

    // 2. Ano Atual (Jan a Dez)
    const vendasAnoAtual = todasVendas.filter(v => {
      const { year } = getIsoYearMonth(v.dataVenda);
      return year === anoAtual;
    });

    const faturamentoAnoAtual = vendasAnoAtual.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );
    const carrosVendidosAno = vendasAnoAtual.length;
    const ticketMedioAno = carrosVendidosAno > 0 ? faturamentoAnoAtual / carrosVendidosAno : 0;

    const percentualDoTotalAno = faturamentoAnoAtual > 0 ? (faturamentoMesAtual / faturamentoAnoAtual) * 100 : 0;

    // 3. Ano Anterior (Faturamento do ANO INTEIRO: Jan a Dez)
    const vendasAnoAnteriorInteiro = todasVendas.filter(v => {
      const { year } = getIsoYearMonth(v.dataVenda);
      return year === anoAnterior;
    });

    const faturamentoAnoAnteriorMesmoPeriodo = vendasAnoAnteriorInteiro.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );

    // Vendas do ano anterior no mesmo período (Jan a Jul) para o comparativo YoY
    const vendasAnoAnteriorYoY = todasVendas.filter(v => {
      const { year, monthIndex } = getIsoYearMonth(v.dataVenda);
      return year === anoAnterior && monthIndex <= mesAtualIndex;
    });
    const faturamentoAnoAnteriorYoY = vendasAnoAnteriorYoY.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );

    // Comparativo YoY (%)
    let comparativoYoY = 0;
    if (faturamentoAnoAnteriorYoY > 0) {
      comparativoYoY = ((faturamentoAnoAtual - faturamentoAnoAnteriorYoY) / faturamentoAnoAnteriorYoY) * 100;
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
        .filter(v => getIsoYearMonth(v.dataVenda).monthIndex === index)
        .reduce((acc, v) => acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0);

      // Vendas do ano anterior neste mês
      const valAnoAnterior = todasVendas
        .filter(v => {
          const { year, monthIndex } = getIsoYearMonth(v.dataVenda);
          return year === anoAnterior && monthIndex === index;
        })
        .reduce((acc, v) => acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0);

      return {
        mes: mesNome,
        valAnoAtual,
        valAnoAnterior,
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
        faturamentoAnoAnteriorMesmoPeriodo, // Agora contém o Faturamento do ANO INTEIRO (Jan-Dez)
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
