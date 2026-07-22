const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const Papa = require('papaparse');

const prisma = new PrismaClient();

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

function formatPhone(val) {
  if (!val) return 'Não informado';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return String(val).trim();
}

function formatCpf(val) {
  if (!val) return 'Não informado';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  return String(val).trim();
}

async function main() {
  console.log("--> Atualizando contatos reais (Telefone e CPF) de todos os clientes no CRM...");

  const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
  const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  // Carregar todos os clientes do CRM em memória
  const allClientes = await prisma.clienteCrm.findMany();
  const clienteMap = new Map();
  allClientes.forEach(c => clienteMap.set(c.nome.toUpperCase().trim(), c));

  let atualizados = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawComprador = getFieldValue(row, ['COMPRADOR', 'CLIENTE', 'DONO', 'NOME']);
    const rawTelefone = getFieldValue(row, ['TELEFONE', 'FONE', 'TEL', 'CELULAR']);
    const rawCpf = getFieldValue(row, ['CPF', 'CPF/CNPJ', 'DOCUMENTO']);

    const compradorNome = (rawComprador || '').trim().toUpperCase();
    if (!compradorNome) continue;

    const cliente = clienteMap.get(compradorNome);
    if (!cliente) continue;

    const formattedTelefone = formatPhone(rawTelefone);
    const formattedCpf = formatCpf(rawCpf);

    const needsUpdate = 
      (formattedTelefone !== 'Não informado' && cliente.telefone !== formattedTelefone) ||
      (formattedCpf !== 'Não informado' && cliente.cpfCnpj !== formattedCpf);

    if (needsUpdate) {
      try {
        await prisma.clienteCrm.update({
          where: { id: cliente.id },
          data: {
            telefone: formattedTelefone !== 'Não informado' ? formattedTelefone : cliente.telefone,
            cpfCnpj: formattedCpf !== 'Não informado' ? formattedCpf : cliente.cpfCnpj,
          }
        });
        atualizados++;
      } catch (e) {
        // Ignorar
      }
    }
  }

  console.log(`\n✅ SUCESSO! Total de ${atualizados} clientes do CRM atualizados com telefones e CPFs reais!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
