import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request) {
  try {
    // 1. Validação de sessão NextAuth no backend (RBAC)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const user = session.user;
    const userRole = user.role ? user.role.toLowerCase() : "seller";

    const body = await request.json();
    const { action, id, car, status } = body;

    // 2. Proteção baseada em cargo (Role-Based Access Control)
    // Vendedores (seller) só podem marcar carros como vendidos (updateStatus -> Vendido)
    if (userRole === "seller") {
      const isMarkingAsSold = action === "updateStatus" && status?.toLowerCase() === "vendido";
      if (!isMarkingAsSold) {
        return NextResponse.json(
          { error: "Acesso negado. Vendedores só possuem permissão para registrar vendas." },
          { status: 403 }
        );
      }
    }

    // Apenas Administradores (admin) podem excluir registros permanentemente
    if (action === "delete" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Permissão insuficiente. Apenas Administradores podem deletar registros permanentemente." },
        { status: 403 }
      );
    }

    // 3. Execução das operações no banco de dados Supabase via Prisma

    // AÇÃO: CADASTRAR CARRO
    if (action === "create") {
      const parts = car.title.trim().split(" ");
      const brand = parts[0] || "Sem Marca";
      const model = parts.slice(1).join(" ") || "Sem Modelo";

      const newCar = await prisma.car.create({
        data: {
          brand,
          model,
          year: car.year,
          mileage: car.mileage,
          transmission: car.transmission,
          price: car.price,
          category: car.category,
          description: car.subtitle || "",
          accessories: car.accessories || "",
          images: car.imageUrl ? [car.imageUrl] : [],
          status: "active",
        },
      });

      // Limpa os caches estáticos do Next.js
      revalidatePath("/veiculos");
      revalidatePath("/");

      return NextResponse.json({ success: true, id: newCar.id });
    }

    // AÇÃO: EDITAR CARRO
    if (action === "update") {
      const parts = car.title.trim().split(" ");
      const brand = parts[0] || "Sem Marca";
      const model = parts.slice(1).join(" ") || "Sem Modelo";

      const updateData = {
        brand,
        model,
        year: car.year,
        mileage: car.mileage,
        transmission: car.transmission,
        price: car.price,
        category: car.category,
        description: car.subtitle || "",
        accessories: car.accessories || "",
      };

      // Se enviou uma nova imagem, substitui a atual
      if (car.imageUrl) {
        updateData.images = [car.imageUrl];
      }

      await prisma.car.update({
        where: { id },
        data: updateData,
      });

      // Revalida caches estáticos das páginas públicas
      revalidatePath("/veiculos");
      revalidatePath(`/veiculos/${id}`);
      revalidatePath("/");

      return NextResponse.json({ success: true });
    }

    // AÇÃO: EXCLUIR CARRO
    if (action === "delete") {
      await prisma.car.delete({
        where: { id },
      });

      revalidatePath("/veiculos");
      revalidatePath(`/veiculos/${id}`);
      revalidatePath("/");

      return NextResponse.json({ success: true });
    }

    // AÇÃO: ATUALIZAR STATUS (VENDIDO OU ATIVO)
    if (action === "updateStatus") {
      const isSold = status.toLowerCase() === "vendido";
      
      await prisma.car.update({
        where: { id },
        data: {
          status: isSold ? "sold" : "active",
          // Se for vendido, insere dados do CRM, senão zera
          buyerName: isSold ? body.buyerName : null,
          salePrice: isSold ? body.salePrice : null,
          saleDate: isSold ? body.saleDate : null,
        },
      });

      // Limpa os caches das páginas estáticas do site
      revalidatePath("/veiculos");
      revalidatePath(`/veiculos/${id}`);
      revalidatePath("/");

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Ação não suportada." }, { status: 400 });

  } catch (error) {
    console.error("Erro na API administrativa de carros:", error);
    return NextResponse.json({ error: `Erro na gravação: ${error.message}` }, { status: 500 });
  }
}
