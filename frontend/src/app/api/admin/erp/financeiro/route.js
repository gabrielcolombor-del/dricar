import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Sincroniza custos fixos recorrentes do mês atual caso ainda não existam no registro de custos_fixos
async function syncRecorrentesForCurrentMonth() {
  try {
    const recorrentes = await prisma.custoRecorrente.findMany({
      where: { ativo: true },
    });

    if (recorrentes.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));

    for (const rec of recorrentes) {
      // Verifica se já existe um lançamento para este custo recorrente no mês atual
      const existing = await prisma.custoFixo.findFirst({
        where: {
          recorrenteId: rec.id,
          dataVencimento: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (!existing) {
        // Define o dia de vencimento garantindo limite válido do mês
        const maxDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dueDay = Math.min(rec.diaVencimento || 5, maxDaysInMonth);
        const dataVencimento = new Date(Date.UTC(currentYear, currentMonth, dueDay));

        await prisma.custoFixo.create({
          data: {
            descricao: rec.descricao,
            valor: rec.valor,
            dataVencimento,
            statusPagamento: "Pendente",
            tipo: "Fixo",
            categoria: rec.categoria || "Geral",
            origem: "Operacional",
            recorrenteId: rec.id,
          },
        });
      }
    }
  } catch (err) {
    console.error("Erro ao sincronizar custos recorrentes mensais:", err);
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const role = session.user.role?.toLowerCase();
    const isAdmin = role === "admin";

    // Garante que custos recorrentes do mês vigente estejam gerados
    await syncRecorrentesForCurrentMonth();

    const [custos, recorrentes, vendas] = await Promise.all([
      prisma.custoFixo.findMany({
        include: {
          recorrente: true,
          despesaVeiculo: {
            include: {
              veiculo: {
                select: {
                  id: true,
                  placa: true,
                  marca: true,
                  modelo: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
          { dataVencimento: "desc" },
        ],
      }),
      isAdmin
        ? prisma.custoRecorrente.findMany({
            orderBy: [{ diaVencimento: "asc" }, { createdAt: "desc" }],
          })
        : [],
      prisma.venda.findMany({
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              marca: true,
              modelo: true,
              anoFab: true,
              anoMod: true,
              valorCompra: true,
              status: true,
            },
          },
          cliente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              cpfCnpj: true,
            },
          },
        },
        orderBy: {
          dataVenda: "desc",
        },
      }),
    ]);

    // Calcula o total mensal de custos fixos ativos apenas se for Administrador
    let totalCustosFixosMensais = 0;
    if (isAdmin) {
      const allActiveRecorrentes = await prisma.custoRecorrente.findMany({
        where: { ativo: true },
        select: { valor: true },
      });
      totalCustosFixosMensais = allActiveRecorrentes.reduce(
        (acc, r) => acc + (parseFloat(r.valor) || 0),
        0
      );
    }

    // Proteção de privacidade para Não-Administradores:
    // Salários aparecem somente como "Mão de obra" com descrições genéricas
    const sanitizedCustos = custos.map((c) => {
      const isSalary =
        c.recorrente?.isSalario ||
        c.categoria?.toLowerCase().includes("salário") ||
        c.categoria?.toLowerCase().includes("salario") ||
        c.descricao?.toLowerCase().includes("salário") ||
        c.descricao?.toLowerCase().includes("salario");

      if (!isAdmin && isSalary) {
        return {
          ...c,
          categoria: "Mão de obra",
          descricao: "Mão de obra / Folha de pagamento",
        };
      }
      return c;
    });

    return NextResponse.json({
      custos: sanitizedCustos,
      vendas: vendas || [],
      recorrentes: isAdmin ? recorrentes : [],
      totalCustosFixosMensais: isAdmin ? totalCustosFixosMensais : 0,
      isAdmin,
    });
  } catch (error) {
    console.error("Erro ao carregar finanças:", error);
    return NextResponse.json({ error: "Erro ao buscar dados financeiros." }, { status: 500 });
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
      action,
      id,
      descricao,
      valor,
      dataVencimento,
      statusPagamento,
      tipo,
      categoria,
      origem,
      diaVencimento,
      isSalario,
      isFixoRecorrente,
    } = body;

    const role = session.user.role?.toLowerCase();
    const isAdmin = role === "admin";

    if (role === "seller" || role === "posvenda") {
      return NextResponse.json({ error: "Apenas gerentes e administradores podem gerenciar custos da loja." }, { status: 403 });
    }

    // AÇÕES DE CUSTOS RECORRENTES (EXCLUSIVO PARA ADMINISTRADOR)
    if (action === "create_recorrente") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Apenas administradores podem cadastrar custos fixos recorrentes." }, { status: 403 });
      }

      const newRec = await prisma.custoRecorrente.create({
        data: {
          descricao: descricao.trim(),
          categoria: categoria ? categoria.trim() : "Geral",
          valor: parseFloat(valor),
          diaVencimento: parseInt(diaVencimento) || 5,
          isSalario: Boolean(isSalario || categoria === "Salário"),
          ativo: true,
        },
      });

      // Gera imediatamente o lançamento do mês atual
      await syncRecorrentesForCurrentMonth();

      return NextResponse.json({ success: true, recorrente: newRec });
    }

    if (action === "update_recorrente") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Apenas administradores podem alterar custos fixos recorrentes." }, { status: 403 });
      }

      const updatedRec = await prisma.custoRecorrente.update({
        where: { id },
        data: {
          descricao: descricao ? descricao.trim() : undefined,
          categoria: categoria ? categoria.trim() : undefined,
          valor: valor !== undefined ? parseFloat(valor) : undefined,
          diaVencimento: diaVencimento ? parseInt(diaVencimento) : undefined,
          isSalario: isSalario !== undefined ? Boolean(isSalario) : undefined,
        },
      });

      return NextResponse.json({ success: true, recorrente: updatedRec });
    }

    if (action === "delete_recorrente") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Apenas administradores podem excluir custos fixos recorrentes." }, { status: 403 });
      }

      await prisma.custoRecorrente.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "toggle_recorrente") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Apenas administradores podem ativar/desativar custos fixos." }, { status: 403 });
      }

      const rec = await prisma.custoRecorrente.findUnique({ where: { id } });
      if (!rec) return NextResponse.json({ error: "Custo recorrente não encontrado." }, { status: 404 });

      const updated = await prisma.custoRecorrente.update({
        where: { id },
        data: { ativo: !rec.ativo },
      });

      return NextResponse.json({ success: true, recorrente: updated });
    }

    // AÇÕES DE LANÇAMENTO INDIVIDUAL (CUSTO FIXO / VARIÁVEL)
    if (action === "delete") {
      // Deleta primeiro a despesa do veículo correspondente se existir para evitar órfãos
      await prisma.despesaVeiculo.deleteMany({
        where: { custoFixoId: id },
      });
      await prisma.custoFixo.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "toggle_status") {
      const custo = await prisma.custoFixo.findUnique({ where: { id } });
      if (!custo) return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 });

      const isRecebimento = custo.categoria === "Promissória" || custo.origem === "Venda" || custo.descricao?.toLowerCase().includes("nota promissória");
      let newStatus;
      if (isRecebimento) {
        newStatus = (custo.statusPagamento === "Recebido" || custo.statusPagamento === "Pago") ? "A Receber" : "Recebido";
      } else {
        newStatus = custo.statusPagamento === "Pago" ? "A Pagar" : "Pago";
      }

      const updated = await prisma.custoFixo.update({
        where: { id },
        data: { statusPagamento: newStatus },
      });
      return NextResponse.json({ success: true, custo: updated });
    }

    if (id) {
      // Editar lançamento existente
      const updated = await prisma.custoFixo.update({
        where: { id },
        data: {
          descricao: descricao ? descricao.trim() : undefined,
          valor: valor !== undefined ? parseFloat(valor) : undefined,
          dataVencimento: dataVencimento ? new Date(dataVencimento) : undefined,
          statusPagamento: statusPagamento || undefined,
          tipo: tipo || "Fixo",
          categoria: categoria ? categoria.trim() : "Geral",
          origem: origem ? origem.trim() : "Operacional",
        },
      });
      return NextResponse.json({ success: true, custo: updated });
    } else {
      const { parcelas } = body;

      if (parcelas && Array.isArray(parcelas) && parcelas.length > 0) {
        const createdList = [];
        for (const p of parcelas) {
          const pValor = parseFloat(p.valor);
          if (!isNaN(pValor) && pValor > 0) {
            const pVenc = p.dataVencimento ? new Date(p.dataVencimento.includes("T") ? p.dataVencimento : p.dataVencimento + "T00:00:00Z") : new Date();
            const newCusto = await prisma.custoFixo.create({
              data: {
                descricao: p.descricao ? p.descricao.trim() : descricao.trim(),
                valor: pValor,
                dataVencimento: pVenc,
                statusPagamento: p.statusPagamento || statusPagamento || "A Pagar",
                tipo: "Variável",
                categoria: categoria ? categoria.trim() : "Geral",
                origem: origem ? origem.trim() : "Operacional",
              },
            });
            createdList.push(newCusto);
          }
        }
        return NextResponse.json({ success: true, custos: createdList });
      }

      // Criar novo lançamento individual
      const valorFloat = parseFloat(valor);

      // Se marcou como Fixo Recorrente e é Admin, cria também o CustoRecorrente
      let recorrenteIdCriado = null;
      if (isFixoRecorrente && isAdmin) {
        const diaVenc = dataVencimento ? new Date(dataVencimento).getUTCDate() : 5;
        const newRec = await prisma.custoRecorrente.create({
          data: {
            descricao: descricao.trim(),
            categoria: categoria ? categoria.trim() : "Geral",
            valor: valorFloat,
            diaVencimento: diaVenc,
            isSalario: Boolean(isSalario || categoria === "Salário"),
            ativo: true,
          },
        });
        recorrenteIdCriado = newRec.id;
      }

      const newCusto = await prisma.custoFixo.create({
        data: {
          descricao: descricao.trim(),
          valor: valorFloat,
          dataVencimento: new Date(dataVencimento.includes("T") ? dataVencimento : dataVencimento + "T00:00:00Z"),
          statusPagamento: statusPagamento || "A Pagar",
          tipo: isFixoRecorrente || tipo === "Fixo" ? "Fixo" : "Variável",
          categoria: categoria ? categoria.trim() : "Geral",
          origem: origem ? origem.trim() : "Operacional",
          recorrenteId: recorrenteIdCriado,
        },
      });
      return NextResponse.json({ success: true, custo: newCusto });
    }
  } catch (error) {
    console.error("Erro ao processar custo financeiro:", error);
    return NextResponse.json({ error: `Erro ao processar custo: ${error.message}` }, { status: 500 });
  }
}
