import { jsPDF } from "jspdf";

export function generateSalePdf(saleData) {
  const doc = new jsPDF();

  const {
    veiculo,
    buyerName,
    buyerCpfCnpj,
    buyerPhone,
    buyerAddress,
    salePrice,
    saleDate,
    paymentMethod,
    sellerName,
    notes,
  } = saleData;

  const formattedDate = saleDate
    ? new Date(saleDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : new Date().toLocaleDateString("pt-BR");

  const formattedPrice = typeof salePrice === "number"
    ? `R$ ${salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : salePrice || "R$ 0,00";

  // Configurações de cores e fontes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(24, 43, 73); // Azul da marca
  doc.text("DRICAR VEÍCULOS", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("COMPROVANTE DE VENDA E TERMO DE ENTREGA DE VEÍCULO", 105, 27, { align: "center" });

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 32, 195, 32);

  // Data e Cabeçalho do documento
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text(`DATA DA TRANSAÇÃO: ${formattedDate}`, 15, 40);
  doc.text(`PLACA: ${veiculo?.placa || "N/A"}`, 195, 40, { align: "right" });

  let y = 50;

  // Seção 1: Dados do Veículo
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, 180, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 43, 73);
  doc.text("1. DADOS DO VEÍCULO", 18, y + 5.5);
  y += 14;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);

  doc.text(`• Veículo / Modelo: ${veiculo?.marca || ""} ${veiculo?.modelo || ""}`, 18, y);
  doc.text(`• Placa: ${veiculo?.placa || "N/A"}`, 120, y);
  y += 7;

  doc.text(`• Ano Fabricação/Modelo: ${veiculo?.anoFab || "N/A"}/${veiculo?.anoMod || "N/A"}`, 18, y);
  doc.text(`• RENAVAM: ${veiculo?.renavam || "Não informado"}`, 120, y);
  y += 7;

  doc.text(`• Chassi: ${veiculo?.chassi || "Não informado"}`, 18, y);
  y += 12;

  // Seção 2: Dados do Comprador
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, 180, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 43, 73);
  doc.text("2. DADOS DO COMPRADOR / CLIENTE", 18, y + 5.5);
  y += 14;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);

  doc.text(`• Nome Completo: ${buyerName || "N/A"}`, 18, y);
  y += 7;

  doc.text(`• CPF / CNPJ: ${buyerCpfCnpj || "Não informado"}`, 18, y);
  doc.text(`• Telefone: ${buyerPhone || "Não informado"}`, 120, y);
  y += 7;

  doc.text(`• Endereço: ${buyerAddress || "Não informado"}`, 18, y);
  y += 12;

  // Seção 3: Valores e Pagamento
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, 180, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 43, 73);
  doc.text("3. CONDIÇÕES FINANCEIRAS DA VENDA", 18, y + 5.5);
  y += 14;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129); // Verde
  doc.text(`• Valor Negociado: ${formattedPrice}`, 18, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(`• Forma de Pagamento: ${paymentMethod || "A Combinar"}`, 120, y);
  y += 7;

  doc.text(`• Vendedor Responsável: ${sellerName || "Equipe Dricar"}`, 18, y);
  y += 12;

  // Seção 4: Observações e Termo de Aceite
  if (notes) {
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y, 180, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 43, 73);
    doc.text("4. OBSERVAÇÕES E TERMO DE GARANTIA", 18, y + 5.5);
    y += 14;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    const splitNotes = doc.splitTextToSize(notes, 175);
    doc.text(splitNotes, 18, y);
    y += (splitNotes.length * 5) + 8;
  } else {
    y += 5;
  }

  // Declaração de Aceite
  y = Math.max(y, 195);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  const termoTexto = "Declaro ter recebido o veículo acima discriminado nas condições acordadas, em perfeito estado de funcionamento e conservação, com a documentação necessária para transferência de propriedade.";
  const splitTermo = doc.splitTextToSize(termoTexto, 175);
  doc.text(splitTermo, 18, y);
  y += 25;

  // Assinaturas
  doc.setLineWidth(0.4);
  doc.setDrawColor(150, 150, 150);

  // Linha 1: Vendedor
  doc.line(25, y, 90, y);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("DRICAR VEÍCULOS", 57.5, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Assinatura do Vendedor", 57.5, y + 8, { align: "center" });

  // Linha 2: Comprador
  doc.line(120, y, 185, y);
  doc.setFont("helvetica", "bold");
  doc.text(buyerName ? buyerName.toUpperCase() : "COMPRADOR", 152.5, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Assinatura do Comprador", 152.5, y + 8, { align: "center" });

  // Salvar PDF com o nome do arquivo
  const filename = `Comprovante_Venda_${veiculo?.placa || "Veiculo"}_${formattedDate.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}
