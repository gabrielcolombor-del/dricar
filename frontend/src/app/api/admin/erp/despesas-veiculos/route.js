import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, veiculoId, categoria, valor, dataDespesa } = body;

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

    const veiculo = await prisma.veiculo.findUnique({
      where: { id: veiculoId }
    });
    if (!veiculo) {
      return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
    }

    // Criar registro correspondente no Financeiro Geral (custos_fixos)
    const newCusto = await prisma.custoFixo.create({
      data: {
        descricao: `Despesa Placa: ${veiculo.placa} (${veiculo.marca} ${veiculo.modelo}) - ${categoria.trim()}`,
        valor: parseFloat(valor),
        dataVencimento: new Date(dataDespesa),
        statusPagamento: "Pago",
        tipo: "Variável",
      }
    });

    const newDespesa = await prisma.despesaVeiculo.create({
      data: {
        veiculoId,
        categoria: categoria.trim(),
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
