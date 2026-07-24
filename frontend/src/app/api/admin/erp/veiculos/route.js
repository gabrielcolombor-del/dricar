import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const veiculo = await prisma.veiculo.findUnique({
        where: { id },
        include: {
          despesas: {
            orderBy: { dataDespesa: "desc" },
          },
          vendas: true,
        },
      });
      return NextResponse.json(veiculo);
    }

    const veiculos = await prisma.veiculo.findMany({
      include: {
        despesas: true,
        vendas: true,
      },
      orderBy: {
        dataEntrada: "desc",
      },
    });

    return NextResponse.json(veiculos);
  } catch (error) {
    console.error("Erro ao carregar veículos do ERP:", error);
    return NextResponse.json({ error: "Erro ao carregar veículos." }, { status: 500 });
  }
}

async function syncVeiculoToCar(veiculo, catalogData = null) {
  try {
    const isSoldOrTransferred = veiculo.status === "Vendido" || veiculo.status === "Transferido";
    const carStatus = isSoldOrTransferred ? "sold" : "active";
    const yearString = `${veiculo.anoFab}/${veiculo.anoMod}`;
    
    // Procura por carro já existente atrelado a este veículo do ERP
    const existingCar = await prisma.car.findFirst({
      where: { veiculoId: veiculo.id },
    });

    if (existingCar) {
      const updateData = {
        brand: veiculo.marca,
        model: veiculo.modelo,
        year: yearString,
        status: carStatus,
      };

      if (catalogData && typeof catalogData === "object") {
        if (catalogData.description !== undefined && catalogData.description !== null) {
          updateData.description = catalogData.description;
        }
        if (catalogData.mileage !== undefined && catalogData.mileage !== null) {
          updateData.mileage = catalogData.mileage;
        }
        if (catalogData.transmission !== undefined && catalogData.transmission !== null) {
          updateData.transmission = catalogData.transmission;
        }
        if (catalogData.price !== undefined && catalogData.price !== null) {
          updateData.price = catalogData.price;
        }
        if (catalogData.category !== undefined && catalogData.category !== null) {
          updateData.category = catalogData.category;
        }
        if (catalogData.accessories !== undefined && catalogData.accessories !== null) {
          updateData.accessories = Array.isArray(catalogData.accessories) 
            ? catalogData.accessories.join(", ") 
            : catalogData.accessories;
        }
        if (catalogData.images !== undefined && catalogData.images !== null) {
          updateData.images = catalogData.images;
        }
        if (catalogData.isOffer !== undefined && catalogData.isOffer !== null) {
          updateData.isOffer = !!catalogData.isOffer;
        }
        if (catalogData.promoPrice !== undefined && catalogData.promoPrice !== null) {
          updateData.promoPrice = catalogData.promoPrice;
        }
      }

      await prisma.car.update({
        where: { id: existingCar.id },
        data: updateData,
      });
    } else {
      // Se não existe, cria com valores padrão
      const accessoriesString = (catalogData && Array.isArray(catalogData.accessories))
        ? catalogData.accessories.join(", ")
        : (catalogData?.accessories || "");

      await prisma.car.create({
        data: {
          brand: veiculo.marca,
          model: veiculo.modelo,
          year: yearString,
          status: carStatus,
          description: catalogData?.description || "",
          mileage: catalogData?.mileage || "0 km",
          transmission: catalogData?.transmission || "Manual",
          price: catalogData?.price || ("R$ " + Number(parseFloat(veiculo.valorCompra.toString()) * 1.15).toLocaleString("pt-BR", { maximumFractionDigits: 0 })),
          category: catalogData?.category || "Hatch",
          accessories: accessoriesString,
          images: catalogData?.images || [],
          isOffer: !!catalogData?.isOffer,
          promoPrice: catalogData?.promoPrice || null,
          veiculoId: veiculo.id,
        },
      });
    }
  } catch (err) {
    console.error("Erro na sincronização Veículo -> Car:", err);
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, id, placa, marca, modelo, anoFab, anoMod, valorCompra, dataEntrada, status, documentoPendente, renavam, chassi,
      // catalog fields
      description, mileage, transmission, price, category, accessories, images, isOffer, promoPrice
    } = body;

    const catalogData = {};
    if (description !== undefined) catalogData.description = description;
    if (mileage !== undefined) catalogData.mileage = mileage;
    if (transmission !== undefined) catalogData.transmission = transmission;
    if (price !== undefined) catalogData.price = price;
    if (category !== undefined) catalogData.category = category;
    if (accessories !== undefined) catalogData.accessories = accessories;
    if (images !== undefined) catalogData.images = images;
    if (isOffer !== undefined) catalogData.isOffer = isOffer;
    if (promoPrice !== undefined) catalogData.promoPrice = promoPrice;

    const role = session.user.role?.toLowerCase();
    if (role === "seller" && action !== "updateStatus") {
      return NextResponse.json({ error: "Apenas gerentes e administradores podem criar ou editar veículos." }, { status: 403 });
    }

    if (action === "delete") {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json({ error: "Não autorizado a excluir veículos." }, { status: 403 });
      }
      // Deleta primeiro do catálogo para não quebrar FK
      await prisma.car.deleteMany({
        where: { veiculoId: id },
      });
      await prisma.veiculo.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "updateStatus") {
      const existingVeiculo = await prisma.veiculo.findUnique({
        where: { id },
        include: { vendas: true },
      });

      if (existingVeiculo && existingVeiculo.status === "Vendido" && status !== "Vendido") {
        await prisma.venda.deleteMany({
          where: { veiculoId: id },
        });
      }

      const updated = await prisma.veiculo.update({
        where: { id },
        data: { status },
      });
      await syncVeiculoToCar(updated, { status });
      return NextResponse.json({ success: true, veiculo: updated });
    }

    if (id) {
      const existingVeiculo = await prisma.veiculo.findUnique({
        where: { id },
        include: { vendas: true },
      });

      const newStatus = status || "Disponível";

      if (existingVeiculo && existingVeiculo.status === "Vendido" && newStatus !== "Vendido") {
        await prisma.venda.deleteMany({
          where: { veiculoId: id },
        });
      }

      // Editar
      const updated = await prisma.veiculo.update({
        where: { id },
        data: {
          placa: placa.toUpperCase().trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          anoFab: parseInt(anoFab),
          anoMod: parseInt(anoMod),
          valorCompra: parseFloat(valorCompra),
          dataEntrada: new Date(dataEntrada),
          status: newStatus,
          documentoPendente: !!documentoPendente,
          renavam: renavam || null,
          chassi: chassi || null,
        },
      });
      await syncVeiculoToCar(updated, catalogData);
      return NextResponse.json({ success: true, veiculo: updated });
    } else {
      // Criar novo veículo
      const cleanPlaca = placa.toUpperCase().trim();

      // Verificar se existe um veículo ativo com essa placa no pátio
      const activeInStock = await prisma.veiculo.findFirst({
        where: {
          placa: cleanPlaca,
          status: { notIn: ["Vendido", "Transferido"] },
        },
      });

      if (activeInStock) {
        return NextResponse.json({ error: "Este veículo já está ativo no pátio/estoque com esta placa." }, { status: 400 });
      }

      // Cria um registro de veículo NOVO e independente para o novo ciclo na loja
      const newVeiculo = await prisma.veiculo.create({
        data: {
          placa: cleanPlaca,
          marca: marca.trim(),
          modelo: modelo.trim(),
          anoFab: parseInt(anoFab),
          anoMod: parseInt(anoMod),
          valorCompra: parseFloat(valorCompra),
          dataEntrada: new Date(dataEntrada),
          status: status || "Disponível",
          documentoPendente: !!documentoPendente,
          renavam: renavam || null,
          chassi: chassi || null,
        },
      });
      await syncVeiculoToCar(newVeiculo, catalogData);
      return NextResponse.json({ success: true, veiculo: newVeiculo });
    }
  } catch (error) {
    console.error("Erro ao salvar veículo no ERP:", error);
    return NextResponse.json({ error: `Erro ao processar requisição: ${error.message}` }, { status: 500 });
  }
}
