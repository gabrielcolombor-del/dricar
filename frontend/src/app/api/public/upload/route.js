import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { image, imageName } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Nenhuma imagem foi enviada." }, { status: 400 });
    }

    // Decodifica a imagem Base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const fileExtension = imageName ? imageName.split(".").pop() : "jpg";
    const uniqueFileName = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

    // Faz o upload da imagem no Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("car-images")
      .upload(uniqueFileName, buffer, {
        contentType: `image/${fileExtension === "png" ? "png" : "jpeg"}`,
        upsert: true,
      });

    if (error) {
      console.error("Erro no upload público do Supabase Storage:", error);
      return NextResponse.json({ error: `Falha ao salvar imagem no Storage: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("car-images")
      .getPublicUrl(uniqueFileName);

    return NextResponse.json({ success: true, imageUrl: publicUrl });
  } catch (error) {
    console.error("Erro na API pública de upload:", error);
    return NextResponse.json({ error: "Erro interno no servidor de upload." }, { status: 500 });
  }
}
