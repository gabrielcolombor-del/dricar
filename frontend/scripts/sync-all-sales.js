const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const Papa = require('papaparse');

const prisma = new PrismaClient();

function parseDecimal(value) {
  if (value === undefined || value === null || value === '') return 0;
  let clean = String(value).replace('R$', '').replace(/\s/g, '').trim();
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function parseDate(value) {
  if (!value) return null;
  const clean = String(value).trim();

  // Formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/');
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00Z`);
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getFieldValue(row, possibleNames) {
  for (const key of Object.keys(row)) {
    const normalized = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const name of possibleNames) {
      if (normalized === name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()) {
        return row[key];
      }
    }
  }
  return null;
}

async function main() {
  console.log("--> Iniciando Sincronização Total e Garantida de Vendas (2020 a 2026)...");

  const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  // Carregar dados em memória
  const [allVeiculos, allClientes, allVendas] = await Promise.all([
    prisma.veiculo.findMany(),
    prisma.clienteCrm.findMany(),
    prisma.venda.findMany(),
  ]);

  const veiculoMap = new Map();
  allVeiculos.forEach(v => veiculoMap.set(v.placa.toUpperCase().replace(/[^A-Z0-9]/g, ""), v));

  const clienteMap = new Map();
  allClientes.forEach(c => clienteMap.set(c.nome.toUpperCase().trim(), c));

  const vendaMap = new Map();
  allVendas.forEach(v => vendaMap.set(v.veiculoId, v));

  let vendasCriadas = 0;
  let vendasAtualizadas = 0;
  let erros = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const rawPlaca = getFieldValue(row, ['PLACA']);
    const rawDataVenda = getFieldValue(row, ['DATA DA VENDA', 'DATA DE VENDA', 'DATA VENDA', 'DATA']);
    const rawValorVenda = getFieldValue(row, ['VALOR DE VENDA', 'VALOR DE VENDA R$', 'VALOR VENDA', 'VALOR']);
    const rawComprador = getFieldValue(row, ['COMPRADOR', 'CLIENTE', 'DONO', 'NOME']);
    const rawVeiculo = getFieldValue(row, ['VEICULO', 'CARRO', 'MODELO']);

    const cleanPlaca = (rawPlaca || '').toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanPlaca) continue;

    const dataVendaParsed = parseDate(rawDataVenda);
    const valorVenda = parseDecimal(rawValorVenda);
    const compradorNome = (rawComprador || 'Cliente Histórico Dricar').trim();

    if (!dataVendaParsed) continue;

    try {
      // 1. Procurar ou criar Veiculo no ERP
      let veiculo = veiculoMap.get(cleanPlaca);
      if (!veiculo) {
        veiculo = await prisma.veiculo.create({
          data: {
            placa: cleanPlaca,
            marca: 'Outra',
            modelo: (rawVeiculo || 'Veículo Importado').trim(),
            anoFab: dataVendaParsed.getFullYear(),
            anoMod: dataVendaParsed.getFullYear(),
            valorCompra: valorVenda > 0 ? valorVenda * 0.85 : 0,
            dataEntrada: dataVendaParsed,
            status: 'Vendido',
          }
        });
        veiculoMap.set(cleanPlaca, veiculo);
      } else {
        // Garantir status Vendido e dataEntrada ajustada
        await prisma.veiculo.update({
          where: { id: veiculo.id },
          data: { status: 'Vendido', dataEntrada: dataVendaParsed }
        });
      }

      // 2. Procurar ou criar Cliente no CRM
      let cliente = clienteMap.get(compradorNome.toUpperCase());
      if (!cliente) {
        cliente = await prisma.clienteCrm.create({
          data: {
            nome: compradorNome,
            telefone: '(00) 00000-0000',
            cpfCnpj: '000.000.000-00',
            statusFunil: 'Fechado',
            veiculoInteresseId: veiculo.id,
          }
        });
        clienteMap.set(compradorNome.toUpperCase(), cliente);
      }

      // 3. Procurar ou criar Venda
      const existingVenda = vendaMap.get(veiculo.id);

      const finalValor = valorVenda > 0 ? valorVenda : (parseFloat(veiculo.valorCompra.toString()) || 30000);

      if (existingVenda) {
        await prisma.venda.update({
          where: { id: existingVenda.id },
          data: {
            dataVenda: dataVendaParsed,
            valorVendaVeiculo: finalValor,
            clienteId: cliente.id,
          }
        });
        vendasAtualizadas++;
      } else {
        const newVenda = await prisma.venda.create({
          data: {
            veiculoId: veiculo.id,
            clienteId: cliente.id,
            valorVendaVeiculo: finalValor,
            valorRetornoBancario: 0,
            dataVenda: dataVendaParsed,
          }
        });
        vendaMap.set(veiculo.id, newVenda);
        vendasCriadas++;
      }

    } catch (err) {
      console.error(`Erro na linha ${i+2} (Placa ${cleanPlaca}):`, err.message);
      erros++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`✅ SINCRONIZAÇÃO TOTAL CONCLUÍDA!`);
  console.log(`- Vendas Criadas: ${vendasCriadas}`);
  console.log(`- Vendas Atualizadas: ${vendasAtualizadas}`);
  console.log(`- Erros: ${erros}`);
  console.log(`==================================================\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
