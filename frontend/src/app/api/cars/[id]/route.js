import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCarSlug, findCarBySlugOrId } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const revalidate = 120; // Cache de 2 minutos por veículo

function formatCarData(car) {
  if (!car) return null;
  const accessoriesList = car.accessories 
    ? car.accessories.split(",").map(item => item.trim()).filter(Boolean)
    : [];
  const primaryImage = car.images && car.images.length > 0 
    ? car.images[0] 
    : "/images/ford ka.png";
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
  };
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams?.id;

    if (!identifier) {
      return NextResponse.json({ error: "Identificador não fornecido." }, { status: 400 });
    }

    const decoded = decodeURIComponent(String(identifier)).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);

    let targetCar = null;

    if (isUuid) {
      targetCar = await prisma.car.findUnique({
        where: { id: decoded },
      });
    }

    // Se não for UUID ou não encontrou por UUID exato, busca nos carros ativos
    if (!targetCar) {
      const activeCars = await prisma.car.findMany({
        where: {
          status: "active",
          images: { isEmpty: false },
        },
        orderBy: { createdAt: "desc" },
      });

      targetCar = findCarBySlugOrId(activeCars, decoded);
    }

    if (!targetCar) {
      return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
    }

    const formattedCar = formatCarData(targetCar);

    // Busca apenas 5 recomendações com campos mínimos para evitar tráfego de dados
    const recommendationsRaw = await prisma.car.findMany({
      where: {
        status: "active",
        id: { not: targetCar.id },
        images: { isEmpty: false },
      },
      take: 5,
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
        images: true,
        isOffer: true,
        promoPrice: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const recommendations = recommendationsRaw.map(formatCarData);

    return NextResponse.json(
      {
        car: formattedCar,
        recommendations,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar veículo individual (GET /api/cars/[id]):", error);
    return NextResponse.json({ error: "Erro interno ao buscar veículo." }, { status: 500 });
  }
}
