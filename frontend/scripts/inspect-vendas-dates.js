const fs = require('fs');
const Papa = require('papaparse');

const fileContent = fs.readFileSync('../vendas_dricar.csv', 'utf8');
const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

console.log("Amostra de datas na coluna 'Data da Venda':");
const anosEncontrados = {};

parsed.data.forEach((row, i) => {
  const dataRaw = row['Data da Venda'] || row['Data'] || row['DATA'];
  if (dataRaw) {
    const clean = String(dataRaw).trim();
    if (i < 15) {
      console.log(`Linha ${i+1}: Placa ${row['PLACA']} -> Data: "${clean}", Comprador: "${row['COMPRADOR']}", Valor: "${row['VALOR DE VENDA']}"`);
    }
    // Tenta extrair ano
    const matchYear = clean.match(/\b(20\d{2})\b/);
    if (matchYear) {
      const y = matchYear[1];
      anosEncontrados[y] = (anosEncontrados[y] || 0) + 1;
    }
  }
});

console.log("\nAnos encontrados no CSV de Vendas:");
console.log(anosEncontrados);
