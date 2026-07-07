import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

export async function POST(request) {
  try {
    // 1. Verificação de sessão (autenticação de admin)
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (!session?.value) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Decodifica dados do usuário e obtém o cargo
    const user = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    const cargo = user.cargo ? user.cargo.toLowerCase() : "";

    // 2. Extração dos parâmetros da requisição
    const body = await request.json();
    const { action, status } = body;

    // 3. Controle de Acesso Baseado em Cargos (RBAC) no Backend
    // Vendedores possuem permissões restritas. Só podem dar baixa em carros (marcar como vendido).
    if (cargo === "vendedor") {
      const isMarkingAsSold = action === "updateStatus" && status?.toLowerCase() === "vendido";
      if (!isMarkingAsSold) {
        return NextResponse.json(
          { error: `Permissão insuficiente. O cargo 'Vendedor' não tem permissão para realizar esta operação (${action}).` },
          { status: 403 }
        );
      }
    }

    // Gerentes e Admins possuem acesso completo. Caso precise futuramente diferenciar Gerente de Admin:
    // if (cargo === "gerente") { ... }

    const googleScriptUrl = process.env.GOOGLE_SCRIPT_API_URL;

    // Se estiver em desenvolvimento local inicial sem planilha
    if (!googleScriptUrl) {
      // Simula retorno de sucesso local
      return NextResponse.json({ success: true, localDev: true });
    }

    // 4. Encaminha a ação para o Google Apps Script da planilha
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

    // 5. Se a ação na planilha foi bem-sucedida, limpa o cache de carros do Next.js
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
