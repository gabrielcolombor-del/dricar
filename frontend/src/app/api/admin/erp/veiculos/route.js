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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const veiculo = await prisma.veiculo.findUnique({
        where: { id },
        include: {
          despesas: {
            orderBy: { dataDespesa: "desc" },
          },
          vendas: true,
        },
      });
      return NextResponse.json(veiculo);
    }

    const veiculos = await prisma.veiculo.findMany({
      include: {
        despesas: true,
        vendas: true,
      },
      orderBy: {
        dataEntrada: "desc",
      },
    });

    return NextResponse.json(veiculos);
  } catch (error) {
    console.error("Erro ao carregar veículos do ERP:", error);
    return NextResponse.json({ error: "Erro ao carregar veículos." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, placa, marca, modelo, anoFab, anoMod, valorCompra, dataEntrada, status, documentoPendente } = body;

    const role = session.user.role?.toLowerCase();
    if (role === "seller" && action !== "updateStatus") {
      return NextResponse.json({ error: "Apenas gerentes e administradores podem criar ou editar veículos." }, { status: 403 });
    }

    if (action === "delete") {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json({ error: "Não autorizado a excluir veículos." }, { status: 403 });
      }
      await prisma.veiculo.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "updateStatus") {
      const updated = await prisma.veiculo.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, veiculo: updated });
    }

    if (id) {
      // Editar
      const updated = await prisma.veiculo.update({
        where: { id },
        data: {
          placa: placa.toUpperCase().trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          anoFab: parseInt(anoFab),
          anoMod: parseInt(anoMod),
          valorCompra: parseFloat(valorCompra),
          dataEntrada: new Date(dataEntrada),
          status: status || "Disponível",
          documentoPendente: !!documentoPendente,
        },
      });
      return NextResponse.json({ success: true, veiculo: updated });
    } else {
      // Criar
      // Verificar se a placa já existe
      const existing = await prisma.veiculo.findUnique({
        where: { placa: placa.toUpperCase().trim() },
      });

      if (existing) {
        return NextResponse.json({ error: "Já existe um veículo cadastrado com esta placa." }, { status: 400 });
      }

      const newVeiculo = await prisma.veiculo.create({
        data: {
          placa: placa.toUpperCase().trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          anoFab: parseInt(anoFab),
          anoMod: parseInt(anoMod),
          valorCompra: parseFloat(valorCompra),
          dataEntrada: new Date(dataEntrada),
          status: status || "Disponível",
          documentoPendente: !!documentoPendente,
        },
      });
      return NextResponse.json({ success: true, veiculo: newVeiculo });
    }
  } catch (error) {
    console.error("Erro ao salvar veículo no ERP:", error);
    return NextResponse.json({ error: `Erro ao processar requisição: ${error.message}` }, { status: 500 });
  }
}
