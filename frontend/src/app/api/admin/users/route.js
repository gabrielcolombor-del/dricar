import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Helper para validar acesso de administrador
async function checkAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Não autorizado.", status: 401 };
  }
  const role = session.user.role ? session.user.role.toLowerCase() : "";
  if (role !== "admin") {
    return { error: "Acesso negado. Apenas administradores possuem acesso.", status: 403 };
  }
  return { user: session.user };
}

// GET: Retorna todos os usuários
export async function GET() {
  try {
    const auth = await checkAdminSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro na leitura de usuários:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários do banco." }, { status: 500 });
  }
}

// POST: Cria um novo usuário
export async function POST(request) {
  try {
    const auth = await checkAdminSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = role.toLowerCase().trim();

    const validRoles = ["admin", "manager", "seller"];
    if (!validRoles.includes(cleanRole)) {
      return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
    }

    // Verifica se já existe um usuário com esse email/login
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "Este login/e-mail já está sendo utilizado." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: cleanRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: `Erro na gravação: ${error.message}` }, { status: 500 });
  }
}

// DELETE: Exclui um usuário
export async function DELETE(request) {
  try {
    const auth = await checkAdminSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "O ID do usuário é obrigatório." }, { status: 400 });
    }

    // Impede o admin de deletar o seu próprio usuário logado
    if (userId === auth.user.id) {
      return NextResponse.json({ error: "Você não pode excluir o seu próprio usuário." }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json({ error: "Erro ao excluir usuário do banco." }, { status: 500 });
  }
}
