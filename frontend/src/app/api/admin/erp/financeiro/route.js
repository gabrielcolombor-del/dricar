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

    const custos = await prisma.custoFixo.findMany({
      orderBy: {
        dataVencimento: "desc",
      },
    });

    return NextResponse.json(custos);
  } catch (error) {
    console.error("Erro ao carregar finanças:", error);
    return NextResponse.json({ error: "Erro ao buscar custos gerais." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, descricao, valor, dataVencimento, statusPagamento, tipo } = body;

    const role = session.user.role?.toLowerCase();
    if (role === "seller") {
      return NextResponse.json({ error: "Apenas gerentes e administradores podem gerenciar custos operacionais." }, { status: 403 });
    }

    if (action === "delete") {
      // Deleta primeiro a despesa do veículo correspondente se existir para evitar órfãos
      await prisma.despesaVeiculo.deleteMany({
        where: { custoFixoId: id },
      });
      await prisma.custoFixo.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      // Editar
      const updated = await prisma.custoFixo.update({
        where: { id },
        data: {
          descricao: descricao.trim(),
          valor: parseFloat(valor),
          dataVencimento: new Date(dataVencimento),
          statusPagamento,
          tipo: tipo || "Fixo",
        },
      });
      return NextResponse.json({ success: true, custo: updated });
    } else {
      // Criar
      const newCusto = await prisma.custoFixo.create({
        data: {
          descricao: descricao.trim(),
          valor: parseFloat(valor),
          dataVencimento: new Date(dataVencimento),
          statusPagamento,
          tipo: tipo || "Fixo",
        },
      });
      return NextResponse.json({ success: true, custo: newCusto });
    }
  } catch (error) {
    console.error("Erro ao salvar custo operacional:", error);
    return NextResponse.json({ error: `Erro ao processar custo: ${error.message}` }, { status: 500 });
  }
}
