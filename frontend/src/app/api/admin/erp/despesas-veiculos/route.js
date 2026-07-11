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
      await prisma.despesaVeiculo.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    const newDespesa = await prisma.despesaVeiculo.create({
      data: {
        veiculoId,
        categoria: categoria.trim(),
        valor: parseFloat(valor),
        dataDespesa: new Date(dataDespesa),
      },
    });

    return NextResponse.json({ success: true, despesa: newDespesa });
  } catch (error) {
    console.error("Erro ao registrar despesa do veículo:", error);
    return NextResponse.json({ error: `Erro ao processar despesa: ${error.message}` }, { status: 500 });
  }
}
