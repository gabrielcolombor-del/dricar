import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

export async function POST(request) {
  try {
    // 1. Verificação de sessão (autenticação de admin)
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (session?.value !== "authenticated") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Extração dos parâmetros da requisição
    const body = await request.json();
    const googleScriptUrl = process.env.GOOGLE_SCRIPT_API_URL;

    if (!googleScriptUrl) {
      return NextResponse.json(
        { error: "API do Google Sheets não configurada no servidor (variável GOOGLE_SCRIPT_API_URL ausente)." },
        { status: 500 }
      );
    }

    // 3. Encaminha a ação para o Google Apps Script da planilha
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`O script do Google Sheets retornou erro (status ${response.status})`);
    }

    const result = await response.json();

    // 4. Se a ação na planilha foi bem-sucedida, limpa o cache de carros do Next.js
    if (result.success) {
      revalidateTag("cars");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro no processamento de carros do admin:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Falha na comunicação com o banco de dados." },
      { status: 500 }
    );
  }
}
