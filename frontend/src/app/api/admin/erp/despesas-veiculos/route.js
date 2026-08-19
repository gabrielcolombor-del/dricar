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

    const despesas = await prisma.despesaVeiculo.findMany({
      include: {
        veiculo: {
          select: {
            id: true,
            placa: true,
            marca: true,
            modelo: true,
            status: true,
            dataEntrada: true,
            vendas: {
              select: {
                dataVenda: true,
                valorVendaVeiculo: true,
              },
              orderBy: { dataVenda: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        dataDespesa: "desc",
      },
    });

    return NextResponse.json(despesas);
  } catch (error) {
    console.error("Erro ao carregar despesas de pós venda:", error);
    return NextResponse.json({ error: "Erro ao buscar pós venda." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, veiculoId, categoria, descricao, valor, dataDespesa, origem } = body;

    const role = session.user.role?.toLowerCase();
    if (role === "seller") {
      return NextResponse.json({ error: "Apenas gerentes e administradores podem gerenciar despesas." }, { status: 403 });
    }

    if (action === "delete") {
      const dep = await prisma.despesaVeiculo.findUnique({
        where: { id },
      });
      if (dep && dep.custoFixoId) {
        await prisma.custoFixo.deleteMany({
          where: { id: dep.custoFixoId },
        });
      }
      await prisma.despesaVeiculo.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      if (!id) {
        return NextResponse.json({ error: "ID do custo é obrigatório para edição." }, { status: 400 });
      }

      const existingDep = await prisma.despesaVeiculo.findUnique({
        where: { id },
      });

      if (!existingDep) {
        return NextResponse.json({ error: "Lançamento de despesa não encontrado." }, { status: 404 });
      }

      const veiculo = await prisma.veiculo.findUnique({
        where: { id: veiculoId }
      });
      if (!veiculo) {
        return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
      }

      const descAdicional = descricao && descricao.trim() ? ` - ${descricao.trim()}` : "";

      const updatedDespesa = await prisma.despesaVeiculo.update({
        where: { id },
        data: {
          veiculoId,
          categoria: categoria.trim(),
          descricao: descricao ? descricao.trim() : null,
          valor: parseFloat(valor),
          dataDespesa: new Date(dataDespesa),
        },
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              marca: true,
              modelo: true,
              status: true,
              dataEntrada: true,
              vendas: {
                select: {
                  dataVenda: true,
                  valorVendaVeiculo: true,
                },
                orderBy: { dataVenda: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      if (existingDep.custoFixoId) {
        await prisma.custoFixo.update({
          where: { id: existingDep.custoFixoId },
          data: {
            descricao: `Despesa Placa: ${veiculo.placa || "SEM PLACA"} (${veiculo.marca} ${veiculo.modelo}) - ${categoria.trim()}${descAdicional}`,
            valor: parseFloat(valor),
            dataVencimento: new Date(dataDespesa),
            categoria: categoria.trim(),
          },
        });
      } else {
        const newCusto = await prisma.custoFixo.create({
          data: {
            descricao: `Despesa Placa: ${veiculo.placa || "SEM PLACA"} (${veiculo.marca} ${veiculo.modelo}) - ${categoria.trim()}${descAdicional}`,
            valor: parseFloat(valor),
            dataVencimento: new Date(dataDespesa),
            statusPagamento: "Pago",
            tipo: "Variável",
            categoria: categoria.trim(),
            origem: origem || "Pós Venda",
          }
        });
        await prisma.despesaVeiculo.update({
          where: { id },
          data: { custoFixoId: newCusto.id }
        });
      }

      return NextResponse.json({ success: true, despesa: updatedDespesa });
    }

    const veiculo = await prisma.veiculo.findUnique({
      where: { id: veiculoId }
    });
    if (!veiculo) {
      return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
    }

    const descAdicional = descricao && descricao.trim() ? ` - ${descricao.trim()}` : "";
    const origemFinal = origem || "Pós Venda";

    // Criar registro correspondente no Financeiro Geral (custos_fixos)
    const newCusto = await prisma.custoFixo.create({
      data: {
        descricao: `Despesa Placa: ${veiculo.placa || "SEM PLACA"} (${veiculo.marca} ${veiculo.modelo}) - ${categoria.trim()}${descAdicional}`,
        valor: parseFloat(valor),
        dataVencimento: new Date(dataDespesa),
        statusPagamento: "Pago",
        tipo: "Variável",
        categoria: categoria.trim(),
        origem: origemFinal,
      }
    });

    const newDespesa = await prisma.despesaVeiculo.create({
      data: {
        veiculoId,
        categoria: categoria.trim(),
        descricao: descricao ? descricao.trim() : null,
        valor: parseFloat(valor),
        dataDespesa: new Date(dataDespesa),
        custoFixoId: newCusto.id,
      },
    });

    return NextResponse.json({ success: true, despesa: newDespesa });
  } catch (error) {
    console.error("Erro ao registrar despesa do veículo:", error);
    return NextResponse.json({ error: `Erro ao processar despesa: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const role = session.user.role?.toLowerCase();
    if (role === "seller") {
      return NextResponse.json({ error: "Apenas gerentes e administradores podem gerenciar despesas." }, { status: 403 });
    }

    const body = await request.json();
    const { id, veiculoId, categoria, descricao, valor, dataDespesa, origem } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do custo é obrigatório para edição." }, { status: 400 });
    }

    const existingDep = await prisma.despesaVeiculo.findUnique({
      where: { id },
    });

    if (!existingDep) {
      return NextResponse.json({ error: "Lançamento de despesa não encontrado." }, { status: 404 });
    }

    const veiculo = await prisma.veiculo.findUnique({
      where: { id: veiculoId }
    });
    if (!veiculo) {
      return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
    }

    const descAdicional = descricao && descricao.trim() ? ` - ${descricao.trim()}` : "";

    const updatedDespesa = await prisma.despesaVeiculo.update({
      where: { id },
      data: {
        veiculoId,
        categoria: categoria.trim(),
        descricao: descricao ? descricao.trim() : null,
        valor: parseFloat(valor),
        dataDespesa: new Date(dataDespesa),
      },
      include: {
        veiculo: {
          select: {
            id: true,
            placa: true,
            marca: true,
            modelo: true,
            status: true,
            dataEntrada: true,
            vendas: {
              select: {
                dataVenda: true,
                valorVendaVeiculo: true,
              },
              orderBy: { dataVenda: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (existingDep.custoFixoId) {
      await prisma.custoFixo.update({
        where: { id: existingDep.custoFixoId },
        data: {
          descricao: `Despesa Placa: ${veiculo.placa || "SEM PLACA"} (${veiculo.marca} ${veiculo.modelo}) - ${categoria.trim()}${descAdicional}`,
          valor: parseFloat(valor),
          dataVencimento: new Date(dataDespesa),
          categoria: categoria.trim(),
        },
      });
    } else {
      const newCusto = await prisma.custoFixo.create({
        data: {
          descricao: `Despesa Placa: ${veiculo.placa || "SEM PLACA"} (${veiculo.marca} ${veiculo.modelo}) - ${categoria.trim()}${descAdicional}`,
          valor: parseFloat(valor),
          dataVencimento: new Date(dataDespesa),
          statusPagamento: "Pago",
          tipo: "Variável",
          categoria: categoria.trim(),
          origem: origem || "Pós Venda",
        }
      });
      await prisma.despesaVeiculo.update({
        where: { id },
        data: { custoFixoId: newCusto.id }
      });
    }

    return NextResponse.json({ success: true, despesa: updatedDespesa });
  } catch (error) {
    console.error("Erro ao atualizar despesa do veículo:", error);
    return NextResponse.json({ error: `Erro ao processar atualização: ${error.message}` }, { status: 500 });
  }
}
