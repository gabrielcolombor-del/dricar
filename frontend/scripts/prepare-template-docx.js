const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const inputPath = path.join(__dirname, "../public/Contrato_Compra_e_Venda_DRI-CAR.docx");
const outputPath = path.join(__dirname, "../public/modelo_contrato_dricar.docx");

const content = fs.readFileSync(inputPath);
const zip = new PizZip(content);

let xml = zip.file("word/document.xml").asText();

// Substituir os textos mantendo toda a estrutura de tags XML intacta
xml = xml.replace(/JOACY CARNEIRO DA SILVA/g, "{NOME_COMPRADOR}");
xml = xml.replace(/851\.881\.827-34/g, "{CPF_COMPRADOR}");
xml = xml.replace(/071418826/g, "{RG_COMPRADOR}");
xml = xml.replace(/Casado/g, "{ESTADO_CIVIL}");
xml = xml.replace(/\(27\) 99826-5665/g, "{TELEFONE_COMPRADOR}");
xml = xml.replace(/Rua Manaus, 10 - Camurugi/g, "{ENDERECO_COMPRADOR}");
xml = xml.replace(/29\.210-390/g, "{CEP_COMPRADOR}");

// Valores e Pagamento
xml = xml.replace(/54\.900,00/g, "{VALOR_NUMERICO}");
xml = xml.replace(/\(cinquenta e quatro mil e novecentos reais\)/g, "{VALOR_EXTENSO}");

// Substituir o bloco de parágrafos de Entrada, Saldo e Observações por {@CONDICOES_XML}
const idxEntrada = xml.indexOf("Entrada em veículo");
if (idxEntrada !== -1) {
  const idxStart = xml.lastIndexOf("<w:p", idxEntrada);
  const idxObs = xml.indexOf("Observação:", idxEntrada);
  const idxEnd = xml.indexOf("</w:p>", idxObs) + 6;
  if (idxStart !== -1 && idxObs !== -1 && idxEnd > idxStart) {
    const targetBlock = xml.substring(idxStart, idxEnd);
    xml = xml.replace(targetBlock, '<w:p><w:pPr><w:spacing w:after="20" w:line="200" w:lineRule="exact"/><w:jc w:val="both"/><w:rPr><w:lang w:val="pt-BR"/></w:rPr></w:pPr>{@CONDICOES_XML}</w:p>');
  }
}

xml = xml.replace(/SEGURO PROTEÇÃO FINANCEIRA e SEGURO AUTO RCF/g, "{SEGUROS_LISTA}");
xml = xml.replace(/1\.817,35/g, "{SEGUROS_VALOR}");
xml = xml.replace(/14 de junho de 2026/g, "{DATA_CONTRATO_EXTENSO}");

// Veículo
xml = xml.replace(/RENAULT/g, "{MARCA}");
xml = xml.replace(/DUSTER 1\.6 4X2/g, "{MODELO}");
xml = xml.replace(/2012\/2013/g, "{ANO_FAB_MOD}");
xml = xml.replace(/FLEX/g, "{COMBUSTIVEL}");
xml = xml.replace(/VERMELHA/g, "{COR}");
xml = xml.replace(/109\.821 km/g, "{QUILOMETRAGEM}");
xml = xml.replace(/ODJ7F72/g, "{PLACA}");
xml = xml.replace(/00471325023/g, "{RENAVAM}");
xml = xml.replace(/93YHSR6P5DJ312025/g, "{CHASSI}");
xml = xml.replace(/AUTOMÓVEL/g, "{TIPO_VEICULO}");

zip.file("word/document.xml", xml);

const outBuffer = zip.generate({ type: "nodebuffer" });
fs.writeFileSync(outputPath, outBuffer);

console.log("SUCCESSFULLY GENERATED MODELO CONTRATO DRICAR AT:", outputPath);
