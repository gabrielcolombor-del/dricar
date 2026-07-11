import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth(); // 0-indexed

    // 1. Faturamento Mensal (Mês Atual)
    const inicioMes = new Date(anoAtual, mesAtual, 1);
    const fimMes = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59);

    const vendasMesAtual = await prisma.venda.findMany({
      where: {
        dataVenda: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
    });

    const faturamentoMesAtual = vendasMesAtual.reduce((acc, curr) => {
      const valorVenda = parseFloat(curr.valorVendaVeiculo.toString()) || 0;
      const valorRetorno = parseFloat(curr.valorRetornoBancario.toString()) || 0;
      return acc + valorVenda + valorRetorno;
    }, 0);

    // Faturamento Mensal (Mesmo Mês do Ano Passado)
    const inicioMesAnoPassado = new Date(anoAtual - 1, mesAtual, 1);
    const fimMesAnoPassado = new Date(anoAtual - 1, mesAtual + 1, 0, 23, 59, 59);

    const vendasMesAnoPassado = await prisma.venda.findMany({
      where: {
        dataVenda: {
          gte: inicioMesAnoPassado,
          lte: fimMesAnoPassado,
        },
      },
    });

    const faturamentoMesAnoPassado = vendasMesAnoPassado.reduce((acc, curr) => {
      const valorVenda = parseFloat(curr.valorVendaVeiculo.toString()) || 0;
      const valorRetorno = parseFloat(curr.valorRetornoBancario.toString()) || 0;
      return acc + valorVenda + valorRetorno;
    }, 0);

    // Comparativo YoY
    let comparativoYoY = 0;
    if (faturamentoMesAnoPassado > 0) {
      comparativoYoY = ((faturamentoMesAtual - faturamentoMesAnoPassado) / faturamentoMesAnoPassado) * 100;
    } else if (faturamentoMesAtual > 0) {
      comparativoYoY = 100; // Crescimento de 0 para algo
    }

    // 2. Ticket Médio
    // Calculado a partir de todas as vendas
    const todasVendas = await prisma.venda.findMany();
    const totalVendasVeiculo = todasVendas.reduce((acc, curr) => acc + parseFloat(curr.valorVendaVeiculo.toString()), 0);
    const ticketMedio = todasVendas.length > 0 ? totalVendasVeiculo / todasVendas.length : 0;

    // 3. Lucro Líquido Real (usando a View view_lucro_por_veiculo e Custos Gerais)
    // Buscamos dados da View usando raw SQL
    const lucroPorVeiculoData = await prisma.$queryRaw`
      SELECT * FROM view_lucro_por_veiculo;
    `;

    const soldStatuses = ["Vendido", "Em processo de Transf.", "Transferido", "Transferência em aberto"];
    const stockStatuses = ["Disponível", "Em Preparação"];

    // Filtramos apenas veículos vendidos para o lucro real operacional
    const lucroVeiculosVendidos = lucroPorVeiculoData
      .filter(v => soldStatuses.includes(v.status))
      .reduce((acc, curr) => acc + parseFloat(curr.lucro_liquido.toString()), 0);

    // Buscamos todas as despesas gerais da empresa
    const custosGerais = await prisma.custoFixo.findMany();
    const totalCustosGerais = custosGerais.reduce((acc, curr) => acc + parseFloat(curr.valor.toString()), 0);

    const lucroLiquidoRealFinal = lucroVeiculosVendidos - totalCustosGerais;

    // 4. Giro de Estoque (Média de dias que os carros ficam parados)
    const veiculosVendidosView = lucroPorVeiculoData.filter(v => soldStatuses.includes(v.status));
    let totalDiasGiro = 0;
    let countGiro = 0;

    veiculosVendidosView.forEach(v => {
      if (v.data_venda && v.data_entrada) {
        const diffTime = Math.abs(new Date(v.data_venda) - new Date(v.data_entrada));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDiasGiro += diffDays;
        countGiro++;
      }
    });

    let giroEstoque = 0;
    if (countGiro > 0) {
      giroEstoque = Math.round(totalDiasGiro / countGiro);
    } else {
      // Se não há vendidos, calcula média de dias em estoque dos disponíveis
      const disponiveis = lucroPorVeiculoData.filter(v => stockStatuses.includes(v.status));
      let totalDiasDisp = 0;
      disponiveis.forEach(v => {
        if (v.data_entrada) {
          const diffTime = Math.abs(hoje - new Date(v.data_entrada));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalDiasDisp += diffDays;
        }
      });
      giroEstoque = disponiveis.length > 0 ? Math.round(totalDiasDisp / disponiveis.length) : 0;
    }

    // 5. Custos Fixos vs Custos Variáveis
    const custosFixosTotal = custosGerais
      .filter(c => c.tipo === "Fixo")
      .reduce((acc, curr) => acc + parseFloat(curr.valor.toString()), 0);

    const custosVariaveisTotal = custosGerais
      .filter(c => c.tipo === "Variável")
      .reduce((acc, curr) => acc + parseFloat(curr.valor.toString()), 0);

    // 6. Alertas
    // Veículos com mais de 30 dias em estoque
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    const veiculosDisponiveis = await prisma.veiculo.findMany({
      where: {
        status: { in: stockStatuses },
      },
    });

    const maisDeTrintaDias = veiculosDisponiveis.filter(v => new Date(v.dataEntrada) < trintaDiasAtras);

    // Veículos com pendência de transferência de documentação (marcado como pendente ou nos status de transferência)
    const pendenciaDocumentacao = await prisma.veiculo.findMany({
      where: {
        OR: [
          { documentoPendente: true },
          { status: { in: ["Em processo de Transf.", "Transferência em aberto"] } }
        ]
      },
    });

    return NextResponse.json({
      kpis: {
        faturamentoMesAtual,
        comparativoYoY,
        ticketMedio,
        lucroLiquidoReal: lucroLiquidoRealFinal,
        giroEstoque,
      },
      charts: {
        custosFixos: custosFixosTotal,
        custosVariaveis: custosVariaveisTotal,
      },
      alertas: {
        maisDeTrintaDias: maisDeTrintaDias.map(v => ({
          id: v.id,
          placa: v.placa,
          marca: v.marca,
          modelo: v.modelo,
          dataEntrada: v.dataEntrada,
          diasEstoque: Math.ceil(Math.abs(hoje - new Date(v.dataEntrada)) / (1000 * 60 * 60 * 24)),
        })),
        pendenciaDocumentacao: pendenciaDocumentacao.map(v => ({
          id: v.id,
          placa: v.placa,
          marca: v.marca,
          modelo: v.modelo,
          status: v.status,
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao carregar dados do Dashboard ERP:", error);
    return NextResponse.json({ error: "Erro ao gerar indicadores." }, { status: 500 });
  }
}
