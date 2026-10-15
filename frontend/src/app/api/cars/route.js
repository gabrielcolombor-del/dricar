import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCarSlug } from "@/lib/slug";

// Força dynamic para suportar query parameter ?all=true com cache via headers CDN/Edge
export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    // Filtro executado diretamente no PostgreSQL para não trafegar carros descartados
    const whereClause = showAll
      ? {}
      : {
          status: "active",
          images: { isEmpty: false },
        };

    // Projeção seletiva de colunas para reduzir tráfego no pooler
    const dbCars = await prisma.car.findMany({
      where: whereClause,
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        mileage: true,
        transmission: true,
        price: true,
        category: true,
        description: true,
        accessories: true,
        images: true,
        status: true,
        isOffer: true,
        promoPrice: true,
        buyerName: showAll,
        salePrice: showAll,
        saleDate: showAll,
      },
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

        // Trata o array de fotos no Supabase Storage. imageUrl aponta para a primeira foto
        const primaryImage = car.images && car.images.length > 0 
          ? car.images[0] 
          : "/images/ford ka.png"; // Fallback caso esteja sem imagem

        // Traduz o status do banco para compatibilidade da listagem administrativa em português
        const statusPt = car.status === "sold" ? "Vendido" : "Ativo";
        const title = `${car.brand} ${car.model}`;
        const subtitle = car.description || "";
        const slug = getCarSlug({ id: car.id, title, subtitle, brand: car.brand, model: car.model, description: car.description });

        return {
          id: car.id,
          slug,
          brand: car.brand,
          model: car.model,
          title,
          subtitle,
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
      // Garante que apenas carros com pelo menos 1 imagem apareçam no catálogo público
      .filter((car) => {
        if (showAll) return true;
        return car.status.toLowerCase() === "ativo" && car.images && car.images.length > 0;
      });

    return NextResponse.json(formattedCars, {
      headers: {
        "Cache-Control": showAll ? "no-store" : "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Erro na leitura de veículos (GET /api/cars):", error);
    return NextResponse.json({ error: "Falha ao carregar catálogo do banco PostgreSQL." }, { status: 500 });
  }
}
