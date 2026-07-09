import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Rota dinâmica devido ao uso de query parameters (?all=true)
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    // Busca os carros ordenando do mais recente para o mais antigo
    const dbCars = await prisma.car.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mapeia e traduz os campos para manter total compatibilidade com o frontend do site
    const formattedCars = dbCars
      .map((car) => {
        // Converte os acessórios em string para um array esperado pelo frontend
        const accessoriesList = car.accessories 
          ? car.accessories.split(",").map(item => item.trim()).filter(Boolean)
          : [];

        // Trata o array de fotos no Supabase Storage.imageUrl aponta para a primeira foto
        const primaryImage = car.images && car.images.length > 0 
          ? car.images[0] 
          : "/images/ford ka.png"; // Fallback caso esteja sem imagem

        // Traduz o status do banco para compatibilidade da listagem administrativa em português
        const statusPt = car.status === "sold" ? "Vendido" : "Ativo";

        return {
          id: car.id,
          brand: car.brand,
          model: car.model,
          title: `${car.brand} ${car.model}`,
          subtitle: car.description || "",
          year: car.year,
          mileage: car.mileage,
          transmission: car.transmission,
          price: car.price,
          category: car.category,
          imageUrl: primaryImage,
          images: car.images,
          accessories: accessoriesList,
          status: statusPt,
          isOffer: car.isOffer,
          promoPrice: car.promoPrice || "",
          // Logs CRM
          buyerName: car.buyerName || "",
          salePrice: car.salePrice || "",
          saleDate: car.saleDate || "",
        };
      })
      // Se showAll for falso, filtra apenas carros Ativos (esconde os vendidos do catálogo público)
      .filter((car) => showAll || car.status.toLowerCase() === "ativo");

    return NextResponse.json(formattedCars);
  } catch (error) {
    console.error("Erro na leitura de veículos (GET /api/cars):", error);
    return NextResponse.json({ error: "Falha ao carregar catálogo do banco PostgreSQL." }, { status: 500 });
  }
}
