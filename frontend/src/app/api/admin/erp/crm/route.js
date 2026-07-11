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

    const leads = await prisma.clienteCrm.findMany({
      include: {
        veiculoInteresse: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads do CRM:", error);
    return NextResponse.json({ error: "Erro ao carregar CRM." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, nome, telefone, cpfCnpj, statusFunil, veiculoInteresseId } = body;

    if (action === "delete") {
      const role = session.user.role?.toLowerCase();
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json({ error: "Apenas administradores ou gerentes podem excluir leads." }, { status: 403 });
      }
      await prisma.clienteCrm.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "updateStatus") {
      const updated = await prisma.clienteCrm.update({
        where: { id },
        data: {
          statusFunil,
        },
      });
      return NextResponse.json({ success: true, lead: updated });
    }

    if (id) {
      // Editar
      const updated = await prisma.clienteCrm.update({
        where: { id },
        data: {
          nome: nome.trim(),
          telefone: telefone.trim(),
          cpfCnpj: cpfCnpj.trim(),
          statusFunil: statusFunil || "Novo Lead",
          veiculoInteresseId: veiculoInteresseId || null,
        },
      });
      return NextResponse.json({ success: true, lead: updated });
    } else {
      // Criar
      const newLead = await prisma.clienteCrm.create({
        data: {
          nome: nome.trim(),
          telefone: telefone.trim(),
          cpfCnpj: cpfCnpj.trim(),
          statusFunil: statusFunil || "Novo Lead",
          veiculoInteresseId: veiculoInteresseId || null,
        },
      });
      return NextResponse.json({ success: true, lead: newLead });
    }
  } catch (error) {
    console.error("Erro ao salvar lead no CRM:", error);
    return NextResponse.json({ error: `Erro ao processar lead: ${error.message}` }, { status: 500 });
  }
}
