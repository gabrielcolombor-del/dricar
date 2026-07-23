import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const {
      veiculoId,
      clienteId,
      buyerName,
      buyerPhone,
      buyerCpfCnpj,
      buyerAddress,
      valorVendaVeiculo,
      valorRetornoBancario,
      dataVenda,
    } = body;

    // Verificar se o veículo existe
    const veiculo = await prisma.veiculo.findUnique({ where: { id: veiculoId } });
    if (!veiculo) {
      return NextResponse.json({ error: "Veículo não encontrado." }, { status: 400 });
    }
    if (veiculo.status === "Vendido") {
      return NextResponse.json({ error: "Este veículo já foi registrado como Vendido." }, { status: 400 });
    }

    let targetClienteId = clienteId;

    // Se não passou clienteId, cria ou busca um cliente no CRM com base nos dados do comprador (Sem travar a venda)
    if (!targetClienteId && buyerName) {
      try {
        const existingCliente = await prisma.clienteCrm.findFirst({
          where: {
            OR: [
              { nome: { equals: buyerName.trim(), mode: "insensitive" } },
              ...(buyerPhone ? [{ telefone: buyerPhone.trim() }] : []),
            ],
          },
        });

        if (existingCliente) {
          targetClienteId = existingCliente.id;
          await prisma.clienteCrm.update({
            where: { id: existingCliente.id },
            data: { statusFunil: "Fechado" },
          });
        } else {
          const newCliente = await prisma.clienteCrm.create({
            data: {
              nome: buyerName.trim(),
              telefone: buyerPhone ? buyerPhone.trim() : "Não informado",
              cpfCnpj: buyerCpfCnpj ? buyerCpfCnpj.trim() : "Não informado",
              statusFunil: "Fechado",
              veiculoInteresseId: veiculoId,
            },
          });
          targetClienteId = newCliente.id;
        }
      } catch (crmError) {
        console.error("Aviso ao vincular comprador no CRM:", crmError);
      }
    }

    // Se por qualquer motivo não houver cliente no CRM, busca um cliente padrão ou cria um fallback para não impedir a venda
    if (!targetClienteId) {
      let fallbackCliente = await prisma.clienteCrm.findFirst();
      if (!fallbackCliente) {
        fallbackCliente = await prisma.clienteCrm.create({
          data: {
            nome: buyerName || "Comprador Direto",
            telefone: buyerPhone || "Não informado",
            cpfCnpj: buyerCpfCnpj || "Não informado",
            statusFunil: "Fechado",
          },
        });
      }
      targetClienteId = fallbackCliente.id;
    }

    // Criar a venda
    const newVenda = await prisma.venda.create({
      data: {
        veiculoId,
        clienteId: targetClienteId,
        valorVendaVeiculo: parseFloat(valorVendaVeiculo),
        valorRetornoBancario: parseFloat(valorRetornoBancario || 0),
        dataVenda: new Date(dataVenda),
      },
    });

    // Atualizar o status do veículo no ERP para "Vendido"
    await prisma.veiculo.update({
      where: { id: veiculoId },
      data: { status: "Vendido" },
    });

    // Atualizar o status do carro no catálogo do site para "sold"
    await prisma.car.updateMany({
      where: { veiculoId },
      data: { status: "sold" },
    });

    return NextResponse.json({ success: true, venda: newVenda });
  } catch (error) {
    console.error("Erro ao registrar venda no ERP:", error);
    return NextResponse.json({ error: `Erro ao registrar venda: ${error.message}` }, { status: 500 });
  }
}
