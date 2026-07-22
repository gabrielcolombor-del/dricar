const fs = require('fs');
const Papa = require('papaparse');

const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
const rows = parsed.data;

console.log("Amostra de contatos em vendas_dricar.csv:");
let countTelefone = 0;
let countCPF = 0;

rows.forEach((r, idx) => {
  const comprador = r['COMPRADOR'] || r['CLIENTE'];
  const telefone = r['Telefone'] || r['TELEFONE'] || r['Fone'];
  const cpf = r['CPF'] || r['CPF/CNPJ'];
  
  if (telefone && String(telefone).trim()) countTelefone++;
  if (cpf && String(cpf).trim()) countCPF++;

  if (idx < 15) {
    console.log(`Linha ${idx+1}: Comprador "${comprador}" | Fone: "${telefone}" | CPF: "${cpf}"`);
  }
});

console.log(`\nResumo de dados encontrados no CSV:`);
console.log(`- Com Telefone preenchido: ${countTelefone} de ${rows.length}`);
console.log(`- Com CPF preenchido: ${countCPF} de ${rows.length}`);
