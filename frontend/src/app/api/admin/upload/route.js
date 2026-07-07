import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request) {
  try {
    // 1. Validação de sessão do NextAuth (apenas usuários logados podem fazer upload)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { image, imageName } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Nenhuma imagem foi enviada." }, { status: 400 });
    }

    // 2. Trata e decodifica a imagem Base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Gera um nome único para o arquivo para evitar colisões
    const fileExtension = imageName ? imageName.split(".").pop() : "jpg";
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

    // 3. Faz o upload da imagem no Supabase Storage (Bucket: car-images)
    const { data, error } = await supabaseAdmin.storage
      .from("car-images")
      .upload(uniqueFileName, buffer, {
        contentType: `image/${fileExtension === "png" ? "png" : "jpeg"}`,
        upsert: true,
      });

    if (error) {
      console.error("Erro no upload do Supabase Storage:", error);
      return NextResponse.json({ error: `Falha ao salvar imagem no Storage: ${error.message}` }, { status: 500 });
    }

    // 4. Obtém a URL pública direta da imagem
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("car-images")
      .getPublicUrl(uniqueFileName);

    return NextResponse.json({ success: true, imageUrl: publicUrl });

  } catch (error) {
    console.error("Erro na API de upload:", error);
    return NextResponse.json({ error: "Erro interno no servidor de upload." }, { status: 500 });
  }
}
