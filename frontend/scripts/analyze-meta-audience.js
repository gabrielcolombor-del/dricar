const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== ANALISANDO DADOS DOS CLIENTES DRICAR ===");

  // 1. Obter dados do Prisma (Clientes + Vendas + Veículos)
  const clientesPrisma = await prisma.clienteCrm.findMany({
    include: {
      vendas: {
        include: {
          veiculo: true
        }
      }
    }
  });

  console.log(`Total de clientes no CRM (Prisma): ${clientesPrisma.length}`);

  // 2. Obter dados brutos do CSV de vendas para cruzar dados de endereço, cidade, observações ou telefones adicionais
  let csvRows = [];
  try {
    const csvContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    csvRows = parsed.data;
  } catch (err) {
    console.error("Erro ao ler CSV:", err.message);
  }

  console.log(`Total de linhas no vendas_dricar.csv: ${csvRows.length}`);

  // Estatísticas de Contatos
  let totalComTelefone = 0;
  let dddCounts = {};
  let totalComCpf = 0;
  let valorTotalVendas = 0;
  let vendasComValor = 0;
  let valoresPorFaixa = {
    'Até 30k': 0,
    '30k a 50k': 0,
    '50k a 70k': 0,
    '70k a 100k': 0,
    'Acima de 100k': 0
  };

  let marcasCount = {};
  let modelosCount = {};
  let anosVendaCount = {};
  let categoriasVeiculoCount = {};

  // Formato preparado para exportação Meta Ads
  const metaAudienceRows = [];

  // Analisar clientes do CRM
  clientesPrisma.forEach(c => {
    let cleanPhone = (c.telefone || '').replace(/\D/g, '');
    let temTelefoneValido = false;
    let ddd = '';

    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      // Validar se DDD é plausível
      ddd = cleanPhone.slice(0, 2);
      dddCounts[ddd] = (dddCounts[ddd] || 0) + 1;
      temTelefoneValido = true;
      totalComTelefone++;
    }

    const cleanCpf = (c.cpfCnpj || '').replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      totalComCpf++;
    }

    // Dividir nome em First Name e Last Name
    const nameParts = (c.nome || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Vendas e valores
    let valorGastoCliente = 0;
    c.vendas.forEach(v => {
      const val = parseFloat(v.valorVendaVeiculo || 0);
      if (val > 0) {
        valorTotalVendas += val;
        vendasComValor++;
        valorGastoCliente += val;

        if (val < 30000) valoresPorFaixa['Até 30k']++;
        else if (val < 50000) valoresPorFaixa['30k a 50k']++;
        else if (val < 70000) valoresPorFaixa['50k a 70k']++;
        else if (val < 100000) valoresPorFaixa['70k a 100k']++;
        else valoresPorFaixa['Acima de 100k']++;
      }

      if (v.dataVenda) {
        const ano = new Date(v.dataVenda).getFullYear();
        if (!isNaN(ano)) {
          anosVendaCount[ano] = (anosVendaCount[ano] || 0) + 1;
        }
      }

      if (v.veiculo) {
        const marca = (v.veiculo.marca || '').toUpperCase().trim();
        if (marca) marcasCount[marca] = (marcasCount[marca] || 0) + 1;

        const modelo = (v.veiculo.modelo || '').toUpperCase().trim();
        if (modelo) modelosCount[modelo] = (modelosCount[modelo] || 0) + 1;
      }
    });

    if (temTelefoneValido) {
      // Meta espera telefone no padrão internacional E.164: +55... ou 55...
      const phoneE164 = `55${cleanPhone}`;
      metaAudienceRows.push({
        fn: firstName,
        ln: lastName,
        phone: phoneE164,
        value: valorGastoCliente > 0 ? valorGastoCliente.toFixed(2) : ''
      });
    }
  });

  // Também verificar cidades ou termos chave nas observações do CSV
  let obsCidades = {};
  let cidadesInteresse = ['VITORIA', 'VILA VELHA', 'SERRA', 'CARIACICA', 'LINHARES', 'COLATINA', 'GUARAPARI', 'VIANA', 'SAO MATEUS', 'ARACRUZ', 'CACHOEIRO', 'ANCHIETA', 'MARATAIZES', 'AFONSO CLAUDIO', 'VENDA NOVA', 'DOMINGOS MARTINS'];
  csvRows.forEach(r => {
    const obs = `${r['OBSERVAÇÕES'] || ''} ${r['COMPRADOR'] || ''} ${r['Veiculo'] || ''}`.toUpperCase();
    cidadesInteresse.forEach(cid => {
      if (obs.includes(cid)) {
        obsCidades[cid] = (obsCidades[cid] || 0) + 1;
      }
    });
  });

  console.log("\n--- RESULTADOS DA ANÁLISE ---");
  console.log(`Total Clientes CRM: ${clientesPrisma.length}`);
  console.log(`Clientes com Telefone Válido: ${totalComTelefone} (${((totalComTelefone/clientesPrisma.length)*100).toFixed(1)}%)`);
  console.log(`Clientes com CPF Válido: ${totalComCpf}`);
  console.log(`Distribuição de DDDs (Top):`, Object.entries(dddCounts).sort((a,b)=>b[1]-a[1]));
  console.log(`Menções a Cidades nas Observações:`, obsCidades);
  console.log(`Vendas com Valor no DB: ${vendasComValor}`);
  if (vendasComValor > 0) {
    console.log(`Ticket Médio de Venda: R$ ${(valorTotalVendas / vendasComValor).toFixed(2)}`);
  }
  console.log(`Faixas de Valor:`, valoresPorFaixa);
  console.log(`Vendas por Ano:`, anosVendaCount);
  console.log(`Top 10 Marcas Compradas:`, Object.entries(marcasCount).sort((a,b)=>b[1]-a[1]).slice(0, 10));
  console.log(`Top 10 Modelos Comprados:`, Object.entries(modelosCount).sort((a,b)=>b[1]-a[1]).slice(0, 10));

  console.log(`\nLinhas preparadas para Lista de Clientes Meta: ${metaAudienceRows.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
