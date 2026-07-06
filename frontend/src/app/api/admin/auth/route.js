import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123"; // Fallback para desenvolvimento

    if (password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // Sessão válida por 24 horas
        path: "/",
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Senha incorreta" }, { status: 401 });
  } catch (error) {
    console.error("Erro na autenticação de admin:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 });
  }
}

// Verifica se o admin está autenticado
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    const isAuthenticated = session?.value === "authenticated";
    return NextResponse.json({ isAuthenticated });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json({ isAuthenticated: false });
  }
}

// Realiza o logout (limpa os cookies)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao realizar logout:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
