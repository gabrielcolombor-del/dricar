const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Aplicando configurações de RLS (Row Level Security)...");
  
  const sqlScripts = [
    // 1. Alterar a view de segurança para INVOKER
    `ALTER VIEW public.view_lucro_por_veiculo SET (security_invoker = true);`,
    
    // 2. Ativar o RLS em todas as tabelas vulneráveis
    `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.despesas_veiculos ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.clientes_crm ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.custos_recorrentes ENABLE ROW LEVEL SECURITY;`,
    
    // 3. Políticas para a tabela 'cars'
    `DROP POLICY IF EXISTS "Leitura publica em cars" ON public.cars;`,
    `CREATE POLICY "Leitura publica em cars" ON public.cars FOR SELECT TO public USING (true);`,
    
    `DROP POLICY IF EXISTS "Acesso total para logados em cars" ON public.cars;`,
    `CREATE POLICY "Acesso total para logados em cars" ON public.cars FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    
    // 4. Políticas para tabelas de sistema interno (Acesso GLOBAL exclusivo para autenticados)
    `DROP POLICY IF EXISTS "Acesso total logados users" ON public.users;`,
    `CREATE POLICY "Acesso total logados users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Acesso total logados vendas" ON public.vendas;`,
    `CREATE POLICY "Acesso total logados vendas" ON public.vendas FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Acesso total logados despesas_veiculos" ON public.despesas_veiculos;`,
    `CREATE POLICY "Acesso total logados despesas_veiculos" ON public.despesas_veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Acesso total logados clientes_crm" ON public.clientes_crm;`,
    `CREATE POLICY "Acesso total logados clientes_crm" ON public.clientes_crm FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Acesso total logados veiculos" ON public.veiculos;`,
    `CREATE POLICY "Acesso total logados veiculos" ON public.veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Acesso total logados custos_fixos" ON public.custos_fixos;`,
    `CREATE POLICY "Acesso total logados custos_fixos" ON public.custos_fixos FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Acesso total logados custos_recorrentes" ON public.custos_recorrentes;`,
    `CREATE POLICY "Acesso total logados custos_recorrentes" ON public.custos_recorrentes FOR ALL TO authenticated USING (true) WITH CHECK (true);`
  ];

  for (const sql of sqlScripts) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ Sucesso: ${sql.substring(0, 50)}...`);
    } catch (e) {
      console.error(`❌ Erro executando: ${sql.substring(0, 50)}...`);
      console.error(e.message);
    }
  }

  console.log("Configurações de RLS aplicadas com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro fatal ao aplicar RLS:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
