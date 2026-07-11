const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Applying View: view_lucro_por_veiculo...");
  
  // SQL to create or replace the view
  const viewSql = `
    CREATE OR REPLACE VIEW view_lucro_por_veiculo AS
    SELECT 
        v.id AS veiculo_id,
        v.placa,
        v.marca,
        v.modelo,
        v.valor_compra,
        v.data_entrada,
        v.status,
        COALESCE(vd.valor_venda_veiculo, 0) AS valor_venda_veiculo,
        COALESCE(vd.valor_retorno_bancario, 0) AS valor_retorno_bancario,
        COALESCE(vd.data_venda, NULL) AS data_venda,
        COALESCE(SUM(d.valor), 0) AS total_despesas,
        (COALESCE(vd.valor_venda_veiculo, 0) + COALESCE(vd.valor_retorno_bancario, 0)) - v.valor_compra - COALESCE(SUM(d.valor), 0) AS lucro_liquido
    FROM veiculos v
    LEFT JOIN despesas_veiculos d ON d.veiculo_id = v.id
    LEFT JOIN vendas vd ON vd.veiculo_id = v.id
    GROUP BY v.id, v.placa, v.marca, v.modelo, v.valor_compra, v.data_entrada, v.status, vd.valor_venda_veiculo, vd.valor_retorno_bancario, vd.data_venda;
  `;

  await prisma.$executeRawUnsafe(viewSql);
  console.log("View applied successfully!");

  console.log("Applying Trigger Function...");
  const triggerFunctionSql = `
    CREATE OR REPLACE FUNCTION atualizar_status_veiculo_vendido()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE veiculos
        SET status = 'Vendido'
        WHERE id = NEW.veiculo_id;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  await prisma.$executeRawUnsafe(triggerFunctionSql);
  console.log("Trigger function applied successfully!");

  console.log("Applying Trigger...");
  const dropTriggerSql = `DROP TRIGGER IF EXISTS trigger_atualizar_status_veiculo ON vendas;`;
  await prisma.$executeRawUnsafe(dropTriggerSql);

  const createTriggerSql = `
    CREATE TRIGGER trigger_atualizar_status_veiculo
    AFTER INSERT ON vendas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_veiculo_vendido();
  `;
  await prisma.$executeRawUnsafe(createTriggerSql);
  console.log("Trigger applied successfully!");

  console.log("All SQL view and triggers applied to the Supabase database successfully!");
}

main()
  .catch((e) => {
    console.error("Error applying SQL scripts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
