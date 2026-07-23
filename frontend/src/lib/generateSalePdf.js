import { jsPDF } from "jspdf";

// Converter valor numérico para extenso simples em Reais
export function numeroParaExtenso(valor) {
  if (!valor || isNaN(valor)) return "";
  const v = Math.round(valor);
  if (v === 0) return "zero reais";

  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converteGrupo(n) {
    if (n === 100) return "cem";
    let str = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) str += centenas[c];
    if (d >= 2) {
      if (str) str += " e ";
      str += dezenas[d];
      if (u > 0) str += " e " + unidades[u];
    } else if (d === 1 || u > 0) {
      if (str) str += " e ";
      str += unidades[d * 10 + u];
    }
    return str;
  }

  const milhares = Math.floor(v / 1000);
  const resto = v % 1000;

  let extenso = "";
  if (milhares > 0) {
    if (milhares === 1) extenso += "um mil";
    else extenso += converteGrupo(milhares) + " mil";
  }
  if (resto > 0) {
    if (extenso) extenso += " e ";
    extenso += converteGrupo(resto);
  }

  return `(${extenso} reais)`;
}

export function generateSalePdf(saleData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const {
    veiculo,
    buyerName,
    buyerCpfCnpj,
    buyerRg,
    buyerEstadoCivil,
    buyerPhone,
    buyerAddress,
    buyerCidadeUf,
    buyerCep,
    salePrice,
    salePriceExtenso,
    entryTradeText,
    financedSaldoText,
    notes,
    segurosValue,
    saleDate,
    combustivel,
    cor,
    quilometragem,
    tipoVeiculo,
  } = saleData;

  const numPrice = typeof salePrice === "number" ? salePrice : parseFloat(String(salePrice).replace(/\D/g, "")) || 0;
  const formattedPrice = `R$ ${numPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const finalExtenso = salePriceExtenso || numeroParaExtenso(numPrice);

  const dateObj = saleDate ? new Date(saleDate + "T12:00:00Z") : new Date();
  const dia = dateObj.getDate();
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesExtenso = meses[dateObj.getMonth()];
  const ano = dateObj.getFullYear();

  let y = 15;

  // TÍTULO DO CONTRATO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(24, 43, 73);
  doc.text("CONTRATO PARTICULAR DE COMPRA E VENDA DE VEÍCULO", 105, y, { align: "center" });
  y += 8;

  // Função utilitária para desenhar seções com tabela
  function desenharCabecalhoSecao(titulo) {
    doc.setFillColor(24, 43, 73);
    doc.rect(14, y, 182, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, 17, y + 4.2);
    y += 8;
  }

  // SEÇÃO 1: DADOS DO VENDEDOR (FIXO DRI-CAR)
  desenharCabecalhoSecao("1. DADOS DO VENDEDOR");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);

  doc.text("RAZÃO SOCIAL:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text("R C P VEÍCULOS EIRELI", 45, y);

  doc.setFont("helvetica", "bold");
  doc.text("CNPJ:", 115, y);
  doc.setFont("helvetica", "normal");
  doc.text("24.636.780/0001-29", 130, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("TELEFONE:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text("(27) 99636-1212", 45, y);

  doc.setFont("helvetica", "bold");
  doc.text("ENDEREÇO:", 115, y);
  doc.setFont("helvetica", "normal");
  doc.text("Rua Santo Antônio, 248 - Muquiçaba", 138, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("CIDADE / UF:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text("Guarapari / ES", 45, y);

  doc.setFont("helvetica", "bold");
  doc.text("CEP:", 115, y);
  doc.setFont("helvetica", "normal");
  doc.text("29.215-030", 130, y);
  y += 8;

  // SEÇÃO 2: DADOS DO COMPRADOR
  desenharCabecalhoSecao("2. DADOS DO COMPRADOR");
  doc.setFontSize(8.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("NOME COMPLETO:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerName ? buyerName.toUpperCase() : "NÃO INFORMADO", 48, y);

  doc.setFont("helvetica", "bold");
  doc.text("CPF / CNPJ:", 135, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerCpfCnpj || "NÃO INFORMADO", 157, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("RG / INSCRIÇÃO:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerRg || "NÃO INFORMADO", 48, y);

  doc.setFont("helvetica", "bold");
  doc.text("ESTADO CIVIL:", 135, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerEstadoCivil || "Solteiro(a)", 160, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("TELEFONE:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerPhone || "NÃO INFORMADO", 48, y);

  doc.setFont("helvetica", "bold");
  doc.text("ENDEREÇO:", 135, y);
  doc.setFont("helvetica", "normal");
  const endText = doc.splitTextToSize(buyerAddress || "NÃO INFORMADO", 55);
  doc.text(endText[0], 157, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("CIDADE / UF:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerCidadeUf || "Guarapari / ES", 48, y);

  doc.setFont("helvetica", "bold");
  doc.text("CEP:", 135, y);
  doc.setFont("helvetica", "normal");
  doc.text(buyerCep || "29.210-000", 157, y);
  y += 8;

  // SEÇÃO 3: IDENTIFICAÇÃO DO VEÍCULO
  desenharCabecalhoSecao("3. IDENTIFICAÇÃO DO VEÍCULO");
  doc.setFontSize(8.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("MARCA:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text((veiculo?.marca || "").toUpperCase(), 35, y);

  doc.setFont("helvetica", "bold");
  doc.text("MODELO:", 80, y);
  doc.setFont("helvetica", "normal");
  doc.text((veiculo?.modelo || "").toUpperCase(), 98, y);

  doc.setFont("helvetica", "bold");
  doc.text("ANO / MOD:", 148, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${veiculo?.anoFab || ""}/${veiculo?.anoMod || ""}`, 168, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("COMBUSTÍVEL:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text((combustivel || "FLEX").toUpperCase(), 42, y);

  doc.setFont("helvetica", "bold");
  doc.text("COR:", 80, y);
  doc.setFont("helvetica", "normal");
  doc.text((cor || "NÃO INFORMADA").toUpperCase(), 90, y);

  doc.setFont("helvetica", "bold");
  doc.text("QUILOMETRAGEM:", 130, y);
  doc.setFont("helvetica", "normal");
  doc.text(quilometragem ? `${quilometragem} km` : "Não informada", 163, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("PLACA:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text((veiculo?.placa || "").toUpperCase(), 30, y);

  doc.setFont("helvetica", "bold");
  doc.text("RENAVAM:", 80, y);
  doc.setFont("helvetica", "normal");
  doc.text(veiculo?.renavam || "NÃO INFORMADO", 98, y);

  doc.setFont("helvetica", "bold");
  doc.text("CHASSI:", 138, y);
  doc.setFont("helvetica", "normal");
  doc.text(veiculo?.chassi || "NÃO INFORMADO", 153, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("TIPO:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.text((tipoVeiculo || "AUTOMÓVEL").toUpperCase(), 28, y);
  y += 8;

  // SEÇÃO 4: VALOR E CONDIÇÕES DE PAGAMENTO
  desenharCabecalhoSecao("4. VALOR E CONDIÇÕES DE PAGAMENTO");
  doc.setFontSize(8.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("VALOR TOTAL DA VENDA:", 16, y);
  doc.text(`${formattedPrice}   ${finalExtenso}`, 62, y);
  y += 5;

  doc.setTextColor(50, 50, 50);
  if (entryTradeText) {
    doc.setFont("helvetica", "bold");
    doc.text("Entrada em veículo:", 16, y);
    doc.setFont("helvetica", "normal");
    const entryLines = doc.splitTextToSize(entryTradeText, 140);
    doc.text(entryLines, 48, y);
    y += (entryLines.length * 4.5);
  }

  if (financedSaldoText) {
    doc.setFont("helvetica", "bold");
    doc.text("Saldo financiado:", 16, y);
    doc.setFont("helvetica", "normal");
    const finLines = doc.splitTextToSize(financedSaldoText, 140);
    doc.text(finLines, 45, y);
    y += (finLines.length * 4.5);
  }

  if (notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Observação:", 16, y);
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(notes, 145);
    doc.text(notesLines, 38, y);
    y += (notesLines.length * 4.5);
  }
  y += 4;

  // SEÇÃO 5: CLÁUSULAS CONTRATUAIS
  desenharCabecalhoSecao("5. CLÁUSULAS CONTRATUAIS");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const clausulas = [
    "Pelo presente instrumento particular de contrato de compra e venda de veículo, firmado pelas partes acima qualificadas, aqui denominadas simplesmente VENDEDOR e COMPRADOR, é justo e contratado o seguinte:",
    "Cláusula 1ª - Objeto. O VENDEDOR vende e transfere ao COMPRADOR a propriedade do bem objeto do presente instrumento, pelo preço certo e ajustado entre as partes, acima indicado.\nParágrafo Primeiro: O COMPRADOR declara neste ato que examinou criteriosamente o veículo acima indicado em todos os seus itens e componentes, verificando o motor, a lataria e o estado geral do mesmo, razão pela qual o adquire no estado em que se apresenta.",
    "Cláusula 2ª - Responsabilidade a partir da assinatura. O VENDEDOR estará isento de responder administrativa, civil ou penalmente por qualquer evento ocorrido a partir da data da assinatura do presente contrato, sendo que responde por todos aqueles anteriores.",
    "Cláusula 3ª - Entrega livre de ônus. O VENDEDOR se obriga a entregar o referido bem livre de qualquer ônus, principalmente os que se referem aos débitos de multas, IPVA, licenciamento e seguro obrigatório, devidos até a data da venda, inclusive no que diz respeito às multas que ainda não tenham sido cadastradas ou notificadas.",
    "Cláusula 4ª - Despesas de transferência e financiamento. As despesas com a transferência da propriedade e com o financiamento são de responsabilidade exclusiva do COMPRADOR.",
    "Cláusula 5ª - Informações prestadas ao comprador. O COMPRADOR foi previamente informado pelo VENDEDOR no que diz respeito ao valor dos tributos incidentes sobre a comercialização do veículo e à regularidade do veículo quanto a furto, multas e taxas anuais legalmente devidas, débitos de impostos, alienação fiduciária e quaisquer outros registros que limitem ou impeçam a circulação do veículo.",
    "Cláusula 6ª - Foro. Fica eleito o foro da Comarca de Guarapari, Estado do Espírito Santo, para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa de qualquer outro, por mais privilegiado que seja.",
    "Cláusula 7ª - Garantia. A garantia do veículo será feita conforme o Código de Defesa do Consumidor.",
    `Cláusula 8ª - Seguros vinculados ao financiamento. O contrato de financiamento deste veículo possui os seguintes seguros inclusos: SEGURO PROTEÇÃO FINANCEIRA e SEGURO AUTO RCF${segurosValue ? `, no valor total de ${segurosValue}` : ""}.\nParágrafo Único. Em caso de quitação do financiamento por parte do COMPRADOR, o mesmo se responsabiliza em quitar todas as despesas referentes ao processo de retirada do gravame.`,
    "Cláusula 9ª - Disposições finais. O veículo não possui chave reserva. A garantia só terá efeito quando o veículo for analisado por mecânicos desta empresa, perdendo-se a garantia em caso de qualquer serviço realizado por terceiros.",
    `E por estarem assim acordados, firmam o presente instrumento em 02 (duas) vias de igual teor e forma, obrigando-se as partes por si, seus herdeiros e sucessores.`,
  ];

  clausulas.forEach((cText) => {
    const splitC = doc.splitTextToSize(cText, 180);
    if (y + (splitC.length * 3.5) > 275) {
      doc.addPage();
      y = 15;
    }
    doc.text(splitC, 15, y);
    y += (splitC.length * 3.2) + 2;
  });

  y += 4;
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  // LOCAL E DATA DA ASSINATURA
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Guarapari / ES, ${dia} de ${mesExtenso} de ${ano}.`, 105, y, { align: "center" });
  y += 18;

  // LINHAS DE ASSINATURA
  doc.setLineWidth(0.4);
  doc.setDrawColor(120, 120, 120);

  // Vendedor
  doc.line(22, y, 92, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("R C P VEÍCULOS EIRELI", 57, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("VENDEDOR", 57, y + 8, { align: "center" });

  // Comprador
  doc.line(118, y, 188, y);
  doc.setFont("helvetica", "bold");
  doc.text((buyerName || "COMPRADOR").toUpperCase(), 153, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("COMPRADOR", 153, y + 8, { align: "center" });

  // NOME DO ARQUIVO PDF
  const safeName = (buyerName || "Cliente").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Contrato_Venda_Dricar_${veiculo?.placa || "Placa"}_${safeName}.pdf`;
  doc.save(filename);
}
