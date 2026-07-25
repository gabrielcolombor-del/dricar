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

    const clientes = await prisma.clienteCrm.findMany({
      include: {
        veiculoInteresse: {
          include: {
            car: true,
          },
        },
        vendas: {
          include: {
            veiculo: {
              include: {
                car: true,
              },
            },
          },
          orderBy: { dataVenda: "desc" },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    // Filtra clientes com pelo menos 2 dos 3 campos cadastrados:
    // 1. Nome é obrigatório
    // 2. Telefone e CPF têm que ter pelo menos um dos dois (válido e não genérico)
    const clientesFiltrados = clientes.filter((c) => {
      const hasNome = c.nome && c.nome.trim() !== "";
      if (!hasNome) return false;

      const cleanTelefone = c.telefone ? c.telefone.trim() : "";
      const hasTelefone =
        cleanTelefone !== "" &&
        cleanTelefone !== "(00) 00000-0000" &&
        cleanTelefone !== "Não informado" &&
        cleanTelefone !== "0";

      const cleanCpf = c.cpfCnpj ? c.cpfCnpj.trim() : "";
      const hasCpf =
        cleanCpf !== "" &&
        cleanCpf !== "000.000.000-00" &&
        cleanCpf !== "Não informado" &&
        cleanCpf !== "0";

      return hasTelefone || hasCpf;
    });

    return NextResponse.json(clientesFiltrados);
  } catch (error) {
    console.error("Erro ao buscar clientes no ERP:", error);
    return NextResponse.json({ error: "Erro ao carregar lista de clientes." }, { status: 500 });
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
        return NextResponse.json({ error: "Apenas administradores ou gerentes podem excluir clientes." }, { status: 403 });
      }
      await prisma.clienteCrm.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      // Editar cliente
      const updated = await prisma.clienteCrm.update({
        where: { id },
        data: {
          nome: nome ? nome.trim() : undefined,
          telefone: telefone ? telefone.trim() : undefined,
          cpfCnpj: cpfCnpj ? cpfCnpj.trim() : undefined,
          statusFunil: statusFunil || undefined,
          veiculoInteresseId: veiculoInteresseId !== undefined ? (veiculoInteresseId || null) : undefined,
        },
      });
      return NextResponse.json({ success: true, cliente: updated });
    } else {
      // Criar novo cliente
      const newCliente = await prisma.clienteCrm.create({
        data: {
          nome: nome ? nome.trim() : "Sem Nome",
          telefone: telefone ? telefone.trim() : "(00) 00000-0000",
          cpfCnpj: cpfCnpj ? cpfCnpj.trim() : "000.000.000-00",
          statusFunil: statusFunil || "Novo Lead",
          veiculoInteresseId: veiculoInteresseId || null,
        },
      });
      return NextResponse.json({ success: true, cliente: newCliente });
    }
  } catch (error) {
    console.error("Erro ao salvar cliente no ERP:", error);
    return NextResponse.json({ error: `Erro ao processar cliente: ${error.message}` }, { status: 500 });
  }
}
