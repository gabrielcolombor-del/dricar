import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// Extrator UTC seguro para evitar distorções de fuso horário
function getIsoYearMonth(dateInput) {
  if (!dateInput) return { year: 0, monthIndex: 0 };
  const d = new Date(dateInput);
  const iso = d.toISOString();
  const year = parseInt(iso.slice(0, 4));
  const monthIndex = parseInt(iso.slice(5, 7)) - 1; // 0 a 11
  return { year, monthIndex };
}

// Classificador inteligente de categoria de veículos
function getCategoriaVeiculo(marca, modelo) {
  const m = `${marca || ''} ${modelo || ''}`.toUpperCase();
  if (/\b(YAMAHA|HONDA|BROS|TITAN|FAN|XRE|TWISTER|BIZ|CG|PCX|FAZER|NMAX|MOTO)\b/.test(m)) return "Moto";
  if (/\b(STRADA|SAVEIRO|MONTANA|S10|HILUX|RANGER|AMAROK|TORO|L200|FRONTIER|RAM)\b/.test(m)) return "Picape";
  if (/\b(ECOSPORT|DUSTER|TUCSON|HR-V|HRV|CRETA|KICKS|TRACKER|COMPASS|RENEGADE|CAPTUR|T-CROSS|TCROSS|NIVUS|PULSE|FASTBACK)\b/.test(m)) return "SUV";
  if (/\b(COROLLA|CIVIC|VOYAGE|SIENA|PRISMA|COBALT|CRONOS|VERSA|CITY|LOGAN|JETTA|SENTRA|FLUENCE|CERATO|SEDAN)\b/.test(m)) return "Sedan";
  if (/\b(GOL|PALIO|UNO|ONIX|HB20|CELTA|FOX|FIESTA|KA|SANDERO|MARCH|FIT|ETIOS|MOBI|KWID|CLIO|POLO|UP|208|C3|HATCH)\b/.test(m)) return "Hatch";
  if (/\b(KOMBI|FIORINO|MASTER|HR|DUCATO|BOXER|KANGOO|DOBLO|PARTNER)\b/.test(m)) return "Utilitário";
  return "Outros";
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

    // Buscar TODAS as vendas do banco de dados com relação ao veículo
    const todasVendas = await prisma.venda.findMany({
      include: {
        veiculo: true,
      },
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

    // Vendas do ano anterior no mesmo período para comparativo YoY
    const vendasAnoAnteriorYoY = todasVendas.filter(v => {
      const { year, monthIndex } = getIsoYearMonth(v.dataVenda);
      return year === anoAnterior && monthIndex <= mesAtualIndex;
    });
    const faturamentoAnoAnteriorYoY = vendasAnoAnteriorYoY.reduce((acc, v) => 
      acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0
    );

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

    // 5. Dados Mensais para o Gráfico (Jan a Dez)
    const comparativoMensal = MESES_ABREV.map((mesNome, index) => {
      const valAnoAtual = vendasAnoAtual
        .filter(v => getIsoYearMonth(v.dataVenda).monthIndex === index)
        .reduce((acc, v) => acc + (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0), 0);

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

    // 6. NOVO GRÁFICO: Vendas por Categoria de Veículo (Hatch, Sedan, SUV, Picape, Moto, Utilitário, Outros)
    const categoriasMap = {
      Hatch: { count: 0, revenue: 0 },
      Sedan: { count: 0, revenue: 0 },
      SUV: { count: 0, revenue: 0 },
      Picape: { count: 0, revenue: 0 },
      Moto: { count: 0, revenue: 0 },
      Utilitário: { count: 0, revenue: 0 },
      Outros: { count: 0, revenue: 0 },
    };

    todasVendas.forEach(v => {
      const cat = getCategoriaVeiculo(v.veiculo?.marca, v.veiculo?.modelo);
      const valor = (parseFloat(v.valorVendaVeiculo.toString()) || 0) + (parseFloat(v.valorRetornoBancario.toString()) || 0);
      if (categoriasMap[cat]) {
        categoriasMap[cat].count += 1;
        categoriasMap[cat].revenue += valor;
      } else {
        categoriasMap["Outros"].count += 1;
        categoriasMap["Outros"].revenue += valor;
      }
    });

    const totalVendasCat = todasVendas.length;
    const vendasPorCategoria = Object.keys(categoriasMap).map(cat => ({
      categoria: cat,
      quantidade: categoriasMap[cat].count,
      faturamento: categoriasMap[cat].revenue,
      percentual: totalVendasCat > 0 ? (categoriasMap[cat].count / totalVendasCat) * 100 : 0,
    })).sort((a, b) => b.quantidade - a.quantidade);

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
      vendasPorCategoria,
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}
