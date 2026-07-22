/**
 * Script de Importação Inteligente da Dricar
 * Todos os registros importados das planilhas históricas são salvos com status "Vendido" / "sold".
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const Papa = require('papaparse');

const prisma = new PrismaClient();

const MARCAS_CONHECIDAS = [
  { keys: ['VW', 'VOLKSWAGEN'], name: 'Volkswagen' },
  { keys: ['GM', 'CHEVROLET'], name: 'Chevrolet' },
  { keys: ['FORD'], name: 'Ford' },
  { keys: ['TOYOTA'], name: 'Toyota' },
  { keys: ['FIAT'], name: 'Fiat' },
  { keys: ['HYUNDAI'], name: 'Hyundai' },
  { keys: ['HONDA'], name: 'Honda' },
  { keys: ['RENAULT'], name: 'Renault' },
  { keys: ['PEUGEOT'], name: 'Peugeot' },
  { keys: ['CITROEN', 'CITROËN'], name: 'Citroën' },
  { keys: ['JAC'], name: 'JAC' },
  { keys: ['NISSAN'], name: 'Nissan' },
  { keys: ['MITSUBISHI'], name: 'Mitsubishi' },
  { keys: ['JEEP'], name: 'Jeep' },
  { keys: ['CHERY'], name: 'Chery' },
  { keys: ['BMW'], name: 'BMW' },
  { keys: ['AUDI'], name: 'Audi' },
  { keys: ['MB', 'MERCEDES', 'MERCEDES-BENZ'], name: 'Mercedes-Benz' },
  { keys: ['KIA'], name: 'Kia' },
  { keys: ['SUZUKI'], name: 'Suzuki' },
  { keys: ['VOLVO'], name: 'Volvo' },
  { keys: ['RAM'], name: 'RAM' }
];

function parseVeiculoString(rawString) {
  if (!rawString) {
    return { marca: 'Outra', modelo: 'Veículo Sem Nome', anoFab: 2020, anoMod: 2020, detalhes: '' };
  }

  let text = String(rawString).trim().toUpperCase();
  let marca = 'Outra';

  for (const item of MARCAS_CONHECIDAS) {
    for (const key of item.keys) {
      if (text.startsWith(key + ' ') || text === key) {
        marca = item.name;
        text = text.substring(key.length).trim();
        break;
      }
    }
    if (marca !== 'Outra') break;
  }

  let anoFab = 2020;
  let anoMod = 2020;

  const yearRangeMatch = text.match(/(\d{4})\/(\d{4})/);
  if (yearRangeMatch) {
    anoFab = parseInt(yearRangeMatch[1]);
    anoMod = parseInt(yearRangeMatch[2]);
    text = text.replace(yearRangeMatch[0], '').trim();
  } else {
    const singleYearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (singleYearMatch) {
      anoFab = parseInt(singleYearMatch[1]);
      anoMod = parseInt(singleYearMatch[1]);
      text = text.replace(singleYearMatch[0], '').trim();
    }
  }

  const tokens = text.split(/\s+/).filter(Boolean);
  const modelo = tokens.length > 0 ? tokens[0] : 'Veículo Sem Nome';
  const detalhes = tokens.slice(1).join(' ');

  return { marca, modelo, anoFab, anoMod, detalhes };
}

function parseDecimal(value) {
  if (value === undefined || value === null || value === '') return 0;
  
  let clean = String(value)
    .replace('R$', '')
    .replace(/\s/g, '')
    .trim();

  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function parseDate(value) {
  if (!value) return new Date('2020-01-01T12:00:00Z');
  const clean = String(value).trim();

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/');
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00Z`);
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? new Date('2020-01-01T12:00:00Z') : parsed;
}

async function syncVeiculoToCar(veiculo, detalhes = '') {
  const carStatus = veiculo.status === 'Disponível' ? 'active' : 'sold';
  const yearString = `${veiculo.anoFab}/${veiculo.anoMod}`;

  const existingCar = await prisma.car.findFirst({
    where: { veiculoId: veiculo.id },
  });

  if (existingCar) {
    await prisma.car.update({
      where: { id: existingCar.id },
      data: {
        brand: veiculo.marca,
        model: veiculo.modelo,
        year: yearString,
        status: carStatus,
      },
    });
  } else {
    const priceNumber = parseFloat(veiculo.valorCompra.toString());
    const suggestedPrice = priceNumber > 0 
      ? ('R$ ' + Number(priceNumber * 1.15).toLocaleString('pt-BR', { maximumFractionDigits: 0 }))
      : 'Sob Consulta';

    await prisma.car.create({
      data: {
        brand: veiculo.marca,
        model: veiculo.modelo,
        year: yearString,
        status: carStatus,
        description: detalhes,
        mileage: '0 km',
        transmission: 'Manual',
        price: suggestedPrice,
        category: 'Hatch',
        images: [],
        veiculoId: veiculo.id,
      },
    });
  }
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

async function importComprasSheet(filePath) {
  console.log(`\n==================================================`);
  console.log(`LENDO PLANILHA DE COMPRAS / ESTOQUE: ${filePath}`);
  console.log(`==================================================\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo de compras não encontrado em ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  let veiculosCriados = 0;
  let veiculosAtualizados = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const rawVeiculo = getFieldValue(row, ['VEICULOS', 'VEICULO', 'CARRO', 'DESCRICAO', 'MODELO', 'TITLE']);
    const rawPlaca = getFieldValue(row, ['PLACA']);
    const rawRenavam = getFieldValue(row, ['RENAVAM']);
    const rawObs = getFieldValue(row, ['OBSERVAÇÕES', 'OBSERVACOES', 'OBS', 'SUBTITLE']);
    const rawDataEntrada = getFieldValue(row, ['DATA', 'DATA ENTRADA', 'DATA COMPRA', 'DATA_COMPRA']);
    const rawValorCompra = getFieldValue(row, ['VALOR DE COMPRA R$', 'VALOR DE COMPRA', 'VALOR COMPRA', 'COMPRA', 'VALOR', 'PRICE']);

    let placa = (rawPlaca || '').toUpperCase().trim();
    if (!placa) {
      placa = `IMP-${String(i + 1).padStart(4, '0')}`;
    }

    const parsedVeiculo = parseVeiculoString(rawVeiculo);
    const valorCompra = parseDecimal(rawValorCompra);
    const dataEntrada = parseDate(rawDataEntrada);
    const renavam = rawRenavam ? String(rawRenavam).trim() : null;

    // TODOS os veículos importados das planilhas de histórico são "Vendido"
    const status = 'Vendido';

    try {
      const existingVeiculo = await prisma.veiculo.findUnique({ where: { placa } });

      let veiculo;
      if (existingVeiculo) {
        veiculo = await prisma.veiculo.update({
          where: { placa },
          data: {
            marca: parsedVeiculo.marca,
            modelo: parsedVeiculo.modelo,
            anoFab: parsedVeiculo.anoFab,
            anoMod: parsedVeiculo.anoMod,
            valorCompra: valorCompra > 0 ? valorCompra : existingVeiculo.valorCompra,
            dataEntrada: rawDataEntrada ? dataEntrada : existingVeiculo.dataEntrada,
            status,
            renavam: renavam || existingVeiculo.renavam,
          },
        });
        veiculosAtualizados++;
      } else {
        veiculo = await prisma.veiculo.create({
          data: {
            placa,
            marca: parsedVeiculo.marca,
            modelo: parsedVeiculo.modelo,
            anoFab: parsedVeiculo.anoFab,
            anoMod: parsedVeiculo.anoMod,
            valorCompra,
            dataEntrada,
            status,
            renavam,
          },
        });
        veiculosCriados++;
      }

      const observacoesGerais = [parsedVeiculo.detalhes, rawObs ? `Obs: ${rawObs}` : ''].filter(Boolean).join(' - ');
      await syncVeiculoToCar(veiculo, observacoesGerais);

      console.log(`[COMPRA HISTÓRICA] Linha ${i + 2}: Placa ${placa} (${parsedVeiculo.marca} ${parsedVeiculo.modelo}) -> Histórico Vendido`);
    } catch (err) {
      console.error(`[ERRO COMPRA] Linha ${i + 2} (Placa ${placa}):`, err.message);
    }
  }

  console.log(`\nResumo Compras: ${veiculosCriados} criados, ${veiculosAtualizados} atualizados.`);
}

async function importVendasSheet(filePath) {
  console.log(`\n==================================================`);
  console.log(`LENDO PLANILHA DE VENDAS: ${filePath}`);
  console.log(`==================================================\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo de vendas não encontrado em ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  let vendasRegistradas = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const rawPlaca = getFieldValue(row, ['PLACA']);
    const rawVeiculo = getFieldValue(row, ['VEICULOS', 'VEICULO', 'CARRO', 'MODELO']);
    const rawValorVenda = getFieldValue(row, ['VALOR DE VENDA R$', 'VALOR DE VENDA', 'VALOR VENDA', 'VALOR', 'VENDA']);
    const rawDataVenda = getFieldValue(row, ['DATA DE VENDA', 'DATA VENDA', 'DATA', 'DATA_VENDA']);
    const rawCliente = getFieldValue(row, ['CLIENTE', 'DONO', 'COMPRADOR', 'NOME']);
    const rawRetorno = getFieldValue(row, ['RETORNO', 'RETORNO BANCARIO', 'VALOR RETORNO']);

    let placa = (rawPlaca || '').toUpperCase().trim();
    if (!placa) {
      continue;
    }

    const valorVenda = parseDecimal(rawValorVenda);
    const valorRetorno = parseDecimal(rawRetorno);
    const dataVenda = parseDate(rawDataVenda);
    const nomeCliente = (rawCliente || 'Cliente Histórico Dricar').trim();

    try {
      let veiculo = await prisma.veiculo.findUnique({ where: { placa } });

      if (!veiculo) {
        const parsedVeiculo = parseVeiculoString(rawVeiculo);
        veiculo = await prisma.veiculo.create({
          data: {
            placa,
            marca: parsedVeiculo.marca,
            modelo: parsedVeiculo.modelo,
            anoFab: parsedVeiculo.anoFab,
            anoMod: parsedVeiculo.anoMod,
            valorCompra: 0,
            dataEntrada: dataVenda,
            status: 'Vendido',
          },
        });
        await syncVeiculoToCar(veiculo, parsedVeiculo.detalhes);
      }

      const existingVenda = await prisma.venda.findFirst({ where: { veiculoId: veiculo.id } });

      if (!existingVenda) {
        let cliente = await prisma.clienteCrm.findFirst({ where: { nome: nomeCliente } });

        if (!cliente) {
          cliente = await prisma.clienteCrm.create({
            data: {
              nome: nomeCliente,
              telefone: '(00) 00000-0000',
              cpfCnpj: '000.000.000-00',
              statusFunil: 'Fechado',
              veiculoInteresseId: veiculo.id,
            },
          });
        }

        await prisma.venda.create({
          data: {
            veiculoId: veiculo.id,
            clienteId: cliente.id,
            valorVendaVeiculo: valorVenda > 0 ? valorVenda : parseFloat(veiculo.valorCompra.toString()),
            valorRetornoBancario: valorRetorno,
            dataVenda,
          },
        });

        const updatedVeiculo = await prisma.veiculo.update({
          where: { id: veiculo.id },
          data: { status: 'Vendido' },
        });

        await syncVeiculoToCar(updatedVeiculo);
        vendasRegistradas++;
      }
    } catch (err) {
      console.error(`[ERRO VENDA] Linha ${i + 2} (Placa ${placa}):`, err.message);
    }
  }

  console.log(`\nResumo Vendas: ${vendasRegistradas} vendas associadas com sucesso.`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    process.exit(1);
  }

  try {
    if (args.length >= 2 && !['compras', 'vendas'].includes(args[0].toLowerCase())) {
      const comprasPath = path.resolve(process.cwd(), args[0]);
      const vendasPath = path.resolve(process.cwd(), args[1]);

      await importComprasSheet(comprasPath);
      await importVendasSheet(vendasPath);
    } else if (args[0].toLowerCase() === 'compras') {
      const comprasPath = path.resolve(process.cwd(), args[1]);
      await importComprasSheet(comprasPath);
    } else if (args[0].toLowerCase() === 'vendas') {
      const vendasPath = path.resolve(process.cwd(), args[1]);
      await importVendasSheet(vendasPath);
    } else {
      const filePath = path.resolve(process.cwd(), args[0]);
      await importComprasSheet(filePath);
    }
  } catch (error) {
    console.error("Erro fatal:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
