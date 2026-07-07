import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { login, password } = await request.json();
    const googleScriptUrl = process.env.GOOGLE_SCRIPT_API_URL;

    if (!googleScriptUrl) {
      // Fallback para desenvolvimento local inicial caso a planilha não esteja vinculada ainda
      if (login === "admin" && password === "admin123") {
        const fallbackUser = { nome: "Administrador Provisório", cargo: "Admin", login: "admin" };
        const sessionData = Buffer.from(JSON.stringify(fallbackUser)).toString("base64");
        
        const cookieStore = await cookies();
        cookieStore.set("admin_session", sessionData, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24, // 24 horas
          path: "/",
        });
        return NextResponse.json({ success: true, user: fallbackUser });
      }

      return NextResponse.json(
        { error: "API do Google Sheets não configurada no servidor (variável GOOGLE_SCRIPT_API_URL ausente)." },
        { status: 500 }
      );
    }

    // Valida credenciais com a planilha via Google Apps Script
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", login, password }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script respondeu com status ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.user) {
      const sessionData = Buffer.from(JSON.stringify(result.user)).toString("base64");
      
      const cookieStore = await cookies();
      cookieStore.set("admin_session", sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 horas
        path: "/",
      });

      return NextResponse.json({ success: true, user: result.user });
    }

    return NextResponse.json(
      { success: false, error: result.error || "Usuário ou senha incorretos." },
      { status: 401 }
    );

  } catch (error) {
    console.error("Erro na validação de login por cargo:", error);
    return NextResponse.json({ success: false, error: "Erro na autenticação de funcionários." }, { status: 500 });
  }
}

// Verifica se há sessão ativa e decodifica os dados do usuário
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    
    if (session?.value) {
      const decodedUser = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
      return NextResponse.json({ isAuthenticated: true, user: decodedUser });
    }
    
    return NextResponse.json({ isAuthenticated: false });
  } catch (error) {
    console.error("Erro ao decodificar sessão:", error);
    return NextResponse.json({ isAuthenticated: false });
  }
}

// Realiza o logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
