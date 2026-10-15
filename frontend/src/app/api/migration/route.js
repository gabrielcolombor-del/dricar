import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Garante tempo suficiente para dumps completos na Vercel

// Configuração dos headers de CORS para permitir acesso de qualquer origem/sistema
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, apikey",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function validateApiKey(request) {
  const configuredKey = process.env.MIGRATION_API_KEY || "dricar_migration_key_2026_sec";

  const headerKey =
    request.headers.get("x-api-key") ||
    request.headers.get("apikey") ||
    request.headers.get("x-api-token");
  const authHeader = request.headers.get("authorization");
  const bearerKey = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : null;
  const { searchParams } = new URL(request.url);
  const queryKey =
    searchParams.get("api_key") ||
    searchParams.get("apiKey") ||
    searchParams.get("key") ||
    searchParams.get("token");

  const providedKey = headerKey || bearerKey || queryKey;
  return Boolean(providedKey && providedKey === configuredKey);
}

export async function GET(request) {
  // 1. Validar autenticação via API Key
  if (!validateApiKey(request)) {
    return NextResponse.json(
      {
        error: "Não autorizado",
        message: "Chave de API inválida ou ausente. Forneça a chave no header 'x-api-key', 'Authorization: Bearer <token>' ou no parâmetro '?api_key=<token>'.",
      },
      {
        status: 401,
        headers: corsHeaders,
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "resumo").toLowerCase();
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");
    const includeRelations = searchParams.get("include_relations") === "true";

    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined;
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const skip = limit ? (page - 1) * limit : undefined;

    // Resumo / Contagem de todas as tabelas (Health check de migração)
    if (type === "resumo" || type === "summary") {
      const [veiculos, cars, clientes, vendas, despesas, custosFixos, custosRecorrentes, users] = await Promise.all([
        prisma.veiculo.count(),
        prisma.car.count(),
        prisma.clienteCrm.count(),
        prisma.venda.count(),
        prisma.despesaVeiculo.count(),
        prisma.custoFixo.count(),
        prisma.custoRecorrente.count(),
        prisma.user.count(),
      ]);

      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: "pronto_para_migracao",
          total_registros: {
            veiculos_erp: veiculos,
            cars_catalogo: cars,
            clientes_crm: clientes,
            vendas: vendas,
            despesas_veiculos: despesas,
            custos_fixos: custosFixos,
            custos_recorrentes: custosRecorrentes,
            usuarios: users,
          },
        },
        { headers: corsHeaders }
      );
    }

    // 2. Exportação de Veículos (ERP)
    if (type === "veiculos" || type === "veiculo") {
      const data = await prisma.veiculo.findMany({
        take: limit,
        skip: skip,
        include: includeRelations
          ? {
              despesas: true,
              vendas: true,
              car: true,
            }
          : undefined,
        orderBy: { dataEntrada: "desc" },
      });

      return NextResponse.json(
        {
          tipo: "veiculos",
          pagina: page,
          limite: limit || data.length,
          total_retornado: data.length,
          data,
        },
        { headers: corsHeaders }
      );
    }

    // 3. Exportação do Catálogo do Site (Cars)
    if (type === "cars" || type === "carros") {
      const data = await prisma.car.findMany({
        take: limit,
        skip: skip,
        include: includeRelations ? { veiculo: true } : undefined,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(
        {
          tipo: "cars",
          pagina: page,
          limite: limit || data.length,
          total_retornado: data.length,
          data,
        },
        { headers: corsHeaders }
      );
    }

    // 4. Exportação de Clientes (CRM)
    if (type === "clientes" || type === "clientes_crm") {
      const data = await prisma.clienteCrm.findMany({
        take: limit,
        skip: skip,
        include: includeRelations
          ? {
              vendas: {
                include: {
                  veiculo: true,
                },
              },
              veiculoInteresse: true,
            }
          : undefined,
        orderBy: { nome: "asc" },
      });

      return NextResponse.json(
        {
          tipo: "clientes_crm",
          pagina: page,
          limite: limit || data.length,
          total_retornado: data.length,
          data,
        },
        { headers: corsHeaders }
      );
    }

    // 5. Exportação de Vendas
    if (type === "vendas" || type === "venda") {
      const data = await prisma.venda.findMany({
        take: limit,
        skip: skip,
        include: includeRelations
          ? {
              veiculo: true,
              cliente: true,
            }
          : undefined,
        orderBy: { dataVenda: "desc" },
      });

      return NextResponse.json(
        {
          tipo: "vendas",
          pagina: page,
          limite: limit || data.length,
          total_retornado: data.length,
          data,
        },
        { headers: corsHeaders }
      );
    }

    // 6. Exportação de Despesas de Veículos
    if (type === "despesas" || type === "despesas_veiculos") {
      const data = await prisma.despesaVeiculo.findMany({
        take: limit,
        skip: skip,
        include: includeRelations ? { veiculo: true } : undefined,
        orderBy: { dataDespesa: "desc" },
      });

      return NextResponse.json(
        {
          tipo: "despesas_veiculos",
          pagina: page,
          limite: limit || data.length,
          total_retornado: data.length,
          data,
        },
        { headers: corsHeaders }
      );
    }

    // 7. Exportação de Financeiro / Custos
    if (type === "financeiro" || type === "custos") {
      const [fixos, recorrentes] = await Promise.all([
        prisma.custoFixo.findMany({
          take: limit,
          skip: skip,
          orderBy: { dataVencimento: "desc" },
        }),
        prisma.custoRecorrente.findMany({
          orderBy: { diaVencimento: "asc" },
        }),
      ]);

      return NextResponse.json(
        {
          tipo: "financeiro",
          custos_fixos: fixos,
          custos_recorrentes: recorrentes,
        },
        { headers: corsHeaders }
      );
    }

    // 8. Exportação de Usuários
    if (type === "usuarios" || type === "users") {
      const includePasswords = searchParams.get("include_passwords") === "true";
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          password: includePasswords ? true : false,
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json(
        {
          tipo: "usuarios",
          total: users.length,
          data: users,
        },
        { headers: corsHeaders }
      );
    }

    // 9. EXPORTAÇÃO COMPLETA (type=all) - Retorna todas as tabelas em um único dump JSON
    if (type === "all") {
      const [veiculos, cars, clientes, vendas, despesas, custosFixos, custosRecorrentes, users] = await Promise.all([
        prisma.veiculo.findMany({ orderBy: { dataEntrada: "desc" } }),
        prisma.car.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.clienteCrm.findMany({ orderBy: { nome: "asc" } }),
        prisma.venda.findMany({ orderBy: { dataVenda: "desc" } }),
        prisma.despesaVeiculo.findMany({ orderBy: { dataDespesa: "desc" } }),
        prisma.custoFixo.findMany({ orderBy: { dataVencimento: "desc" } }),
        prisma.custoRecorrente.findMany({ orderBy: { diaVencimento: "asc" } }),
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            password: searchParams.get("include_passwords") === "true" ? true : false,
          },
        }),
      ]);

      return NextResponse.json(
        {
          metadados: {
            origem: "Dricar Veículos - API de Migração",
            versao_api: "1.0.0",
            exportado_em: new Date().toISOString(),
            total_tabelas: 8,
            contadores: {
              veiculos: veiculos.length,
              cars: cars.length,
              clientes_crm: clientes.length,
              vendas: vendas.length,
              despesas_veiculos: despesas.length,
              custos_fixos: custosFixos.length,
              custos_recorrentes: custosRecorrentes.length,
              usuarios: users.length,
            },
          },
          dados: {
            veiculos,
            cars,
            clientes_crm: clientes,
            vendas,
            despesas_veiculos: despesas,
            custos_fixos: custosFixos,
            custos_recorrentes: custosRecorrentes,
            usuarios: users,
          },
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        error: "Tipo de exportação desconhecido",
        tipos_disponiveis: [
          "all",
          "resumo",
          "veiculos",
          "cars",
          "clientes",
          "vendas",
          "despesas",
          "financeiro",
          "usuarios",
        ],
      },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    console.error("Erro na API de migração:", err);
    return NextResponse.json(
      {
        error: "Erro interno no servidor ao exportar os dados",
        detalhes: err.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
