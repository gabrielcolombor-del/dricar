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
    const { veiculoId, clienteId, valorVendaVeiculo, valorRetornoBancario, dataVenda } = body;

    // Verificar se o veículo e o cliente existem
    const veiculo = await prisma.veiculo.findUnique({ where: { id: veiculoId } });
    if (!veiculo) {
      return NextResponse.json({ error: "Veículo não encontrado." }, { status: 400 });
    }
    if (veiculo.status === "Vendido") {
      return NextResponse.json({ error: "Este veículo já foi vendido." }, { status: 400 });
    }

    const cliente = await prisma.clienteCrm.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 400 });
    }

    // Criar a venda
    const newVenda = await prisma.venda.create({
      data: {
        veiculoId,
        clienteId,
        valorVendaVeiculo: parseFloat(valorVendaVeiculo),
        valorRetornoBancario: parseFloat(valorRetornoBancario || 0),
        dataVenda: new Date(dataVenda),
      },
    });

    // Atualizar o status do lead no CRM para "Fechado"
    await prisma.clienteCrm.update({
      where: { id: clienteId },
      data: { statusFunil: "Fechado" },
    });

    // Atualizar o status do carro no catálogo para vendido
    await prisma.car.updateMany({
      where: { veiculoId },
      data: { status: "sold" },
    });

    return NextResponse.json({ success: true, venda: newVenda });
  } catch (error) {
    console.error("Erro ao registrar venda no ERP:", error);
    return NextResponse.json({ error: `Erro ao registrar venda: ${error.message}` }, { status: 500 });
  }
}
