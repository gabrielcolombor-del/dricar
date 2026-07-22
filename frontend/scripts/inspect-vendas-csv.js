const fs = require('fs');
const Papa = require('papaparse');

const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

console.log("Exemplo de 15 primeiras linhas de vendas_dricar.csv:");
parsed.data.slice(0, 15).forEach((row, i) => {
  console.log(`Linha ${i+1}:`, {
    DATA: row['DATA'] || row['DATA VENDA'] || row['DATA DE VENDA'] || row['Data'],
    PLACA: row['PLACA'] || row['Placa'],
    CLIENTE: row['CLIENTE'] || row['CLIENTE/COMPRADOR'] || row['DONO'] || row['Nome'],
    VALOR: row['VALOR'] || row['VALOR DE VENDA R$'] || row['Valor']
  });
});

console.log("\nCabeçalhos da planilha de vendas:");
console.log(Object.keys(parsed.data[0] || {}));
