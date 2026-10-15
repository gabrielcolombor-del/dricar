const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função para sanitizar e formatar telefone internacional E.164 para Meta
function cleanMetaPhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  // Se tiver 10 ou 11 dígitos (DDD + número)
  if (digits.length === 10 || digits.length === 11) {
    const ddd = digits.slice(0, 2);
    // Ignorar DDDs inválidos como 00
    if (ddd === '00' || ddd === '01') return null;
    return `55${digits}`;
  }
  // Se já tiver 55 na frente
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    if (ddd === '00' || ddd === '01') return null;
    return digits;
  }
  return null;
}

// Separar primeiro nome e sobrenome
function splitName(fullName) {
  if (!fullName) return { fn: '', ln: '' };
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  const fn = parts[0] || '';
  const ln = parts.slice(1).join(' ') || '';
  return { fn, ln };
}

async function main() {
  console.log("=== GERANDO PÚBLICOS META ADS BASEADO NOS CLIENTES DRICAR ===");

  const clientes = await prisma.clienteCrm.findMany({
    include: {
      vendas: {
        include: {
          veiculo: true
        }
      }
    }
  });

  const validMetaClients = [];
  const recompraClients = []; // Compras entre 2021 e 2024 (tempo ideal para trocar de carro)
  const recentesClients = []; // 2025 e 2026 (não ofertar compra imediata, usar para indicação ou pós-venda)
  const ticketEntrada = []; // < 35k
  const ticketMedioAlto = []; // >= 35k

  clientes.forEach(c => {
    const phone = cleanMetaPhone(c.telefone);
    if (!phone) return;

    const { fn, ln } = splitName(c.nome);
    
    // Calcular LTV total e dados do veículo
    let totalGasto = 0;
    let ultimoAnoVenda = null;
    let veiculosComprados = [];

    c.vendas.forEach(v => {
      const val = parseFloat(v.valorVendaVeiculo || 0);
      if (val > 0) totalGasto += val;

      if (v.dataVenda) {
        const ano = new Date(v.dataVenda).getFullYear();
        if (!isNaN(ano)) {
          if (!ultimoAnoVenda || ano > ultimoAnoVenda) {
            ultimoAnoVenda = ano;
          }
        }
      }

      if (v.veiculo) {
        veiculosComprados.push(`${v.veiculo.marca} ${v.veiculo.modelo}`);
      }
    });

    const clientObj = {
      phone: phone,
      fn: fn,
      ln: ln,
      country: 'br',
      st: 'es',
      value: totalGasto > 0 ? totalGasto.toFixed(2) : '',
      ultimoAno: ultimoAnoVenda,
      veiculos: veiculosComprados.join(' | ')
    };

    validMetaClients.push(clientObj);

    // Segmentos
    if (ultimoAnoVenda && ultimoAnoVenda >= 2021 && ultimoAnoVenda <= 2024) {
      recompraClients.push(clientObj);
    }
    if (ultimoAnoVenda && ultimoAnoVenda >= 2025) {
      recentesClients.push(clientObj);
    }

    if (totalGasto > 0 && totalGasto < 35000) {
      ticketEntrada.push(clientObj);
    } else if (totalGasto >= 35000) {
      ticketMedioAlto.push(clientObj);
    }
  });

  console.log(`\nClientes totais no banco: ${clientes.length}`);
  console.log(`Clientes válidos com telefone celular/fixo real (padrão Meta): ${validMetaClients.length}`);
  console.log(`- Segmento Troca de Carro (Compraram 2021-2024): ${recompraClients.length}`);
  console.log(`- Segmento Recentes (2025-2026): ${recentesClients.length}`);
  console.log(`- Segmento Econômico (< R$ 35k): ${ticketEntrada.length}`);
  console.log(`- Segmento Médio/Alto (>= R$ 35k): ${ticketMedioAlto.length}`);

  // Função para criar CSV no formato padrão do Meta Ads
  function generateMetaCsv(list, filePath) {
    const header = 'phone,fn,ln,country,st,value\n';
    const lines = list.map(item => `+${item.phone},"${item.fn}","${item.ln}",${item.country},${item.st},${item.value}`);
    fs.writeFileSync(filePath, header + lines.join('\n'), 'utf8');
  }

  // Salvar arquivos prontos para upload
  const outDir = path.resolve(__dirname, '../publico-meta');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  generateMetaCsv(validMetaClients, path.join(outDir, 'meta_clientes_dricar_completo.csv'));
  generateMetaCsv(recompraClients, path.join(outDir, 'meta_clientes_recompra_2021_2024.csv'));
  generateMetaCsv(recentesClients, path.join(outDir, 'meta_clientes_recentes_2025_2026.csv'));
  generateMetaCsv(ticketEntrada, path.join(outDir, 'meta_clientes_ticket_economico.csv'));
  generateMetaCsv(ticketMedioAlto, path.join(outDir, 'meta_clientes_ticket_medio_alto.csv'));

  console.log(`\n✅ Arquivos CSV para o Gerenciador de Anúncios da Meta salvos em: ${outDir}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
