import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

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

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateSalePdf(saleData) {
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
    condicoesList,
    entryTradeText,
    financedSaldoText,
    notes,
    segurosValue,
    segurosLista,
    saleDate,
    combustivel,
    cor,
    quilometragem,
    tipoVeiculo,
  } = saleData;

  let numPrice = 0;
  if (typeof salePrice === "number") {
    numPrice = salePrice;
  } else if (typeof salePrice === "string") {
    const cleanStr = salePrice.trim();
    if (cleanStr.includes(",") && /,\d{2}$/.test(cleanStr)) {
      numPrice = parseFloat(cleanStr.replace(/\./g, "").replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
    } else {
      numPrice = parseFloat(cleanStr.replace(/\D/g, "")) || 0;
    }
  }
  const formattedPrice = "R$ " + numPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const finalExtenso = salePriceExtenso || numeroParaExtenso(numPrice);

  // Build CONDICOES_TEXT
  let activeCondicoes = [];
  if (Array.isArray(condicoesList) && condicoesList.length > 0) {
    activeCondicoes = condicoesList.filter(Boolean);
  } else {
    if (entryTradeText && entryTradeText.trim()) {
      activeCondicoes.push({ label: "Entrada em veículo:", text: entryTradeText.trim() });
    }
    if (financedSaldoText && financedSaldoText.trim()) {
      activeCondicoes.push({ label: "Saldo financiado:", text: financedSaldoText.trim() });
    }
    if (notes && notes.trim()) {
      activeCondicoes.push({ label: "Observação:", text: notes.trim() });
    }
  }

  let condicoesText = "";
  let condicoesListaFormatted = [];

  if (activeCondicoes.length > 0) {
    condicoesListaFormatted = activeCondicoes
      .map((c, index) => {
        let labelStr = "";
        let textStr = "";
        if (typeof c === "string") {
          textStr = c.trim();
        } else if (c && typeof c === "object") {
          labelStr = (c.label || c.docLabel || c.nome || c.title || "").toString().trim();
          textStr = (c.text || c.value || c.valor || c.descricao || "").toString().trim();
        }

        if (labelStr === "undefined") labelStr = "";
        if (textStr === "undefined") textStr = "";

        if (!labelStr && !textStr) return null;

        if (!textStr && labelStr.endsWith(":")) {
          labelStr = labelStr.replace(/:$/, "");
        }
        if (labelStr && !labelStr.endsWith(":")) {
          labelStr += ":";
        }

        const isLast = index === activeCondicoes.length - 1;
        const sep = isLast ? "." : ";";

        return {
          label: labelStr || "",
          text: textStr || "",
          sep: sep,
        };
      })
      .filter(Boolean);

    const formatted = condicoesListaFormatted.map(item => {
      if (item.label && item.text) {
        return `${item.label} ${item.text}${item.sep}`;
      } else if (item.label) {
        return `${item.label}${item.sep}`;
      } else if (item.text) {
        return `${item.text}${item.sep}`;
      }
      return "";
    }).filter(Boolean);

    condicoesText = formatted.join(" ");
  }

  if (!condicoesText || condicoesText.includes("undefined")) {
    condicoesText = "À vista.";
  }
  if (condicoesListaFormatted.length === 0) {
    condicoesListaFormatted.push({
      label: "Valor pago à vista:",
      text: formattedPrice || "R$ 0,00",
      sep: ".",
    });
  }

  let segurosListaText = "";
  if (Array.isArray(segurosLista) && segurosLista.length > 0) {
    if (segurosLista.length === 1) {
      segurosListaText = segurosLista[0];
    } else {
      segurosListaText = segurosLista.slice(0, -1).join(", ") + " e " + segurosLista[segurosLista.length - 1];
    }
  } else if (typeof segurosLista === "string" && segurosLista.trim()) {
    segurosListaText = segurosLista.trim();
  } else {
    segurosListaText = "NENHUM";
  }

  const hasSeguro = Array.isArray(segurosLista) && segurosLista.length > 0 && segurosLista.some(s => s && s.trim() !== "" && s.trim().toUpperCase() !== "NENHUM");
  const clausulaDisposicoesNum = hasSeguro ? "Cláusula 9ª" : "Cláusula 8ª";

  const rawSegurosVal = (segurosValue || "0,00").trim();
  const segurosValorClean = rawSegurosVal ? rawSegurosVal.replace(/^R\$\s*/i, "") : "0,00";

  const dateObj = saleDate ? new Date(saleDate + "T12:00:00Z") : new Date();
  const dia = dateObj.getDate();
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesExtenso = meses[dateObj.getMonth()];
  const ano = dateObj.getFullYear();
  const dataExtenso = `${dia} de ${mesExtenso} de ${ano}`;

  try {
    // Carregar a matriz do modelo .docx original idêntica ao documento enviado
    const response = await fetch("/modelo_contrato_dricar.docx");
    const arrayBuffer = await response.arrayBuffer();

    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Renderizar o documento preenchendo as tags exatamente no modelo original
    doc.render({
      NOME_COMPRADOR: (buyerName || "NÃO INFORMADO").toUpperCase(),
      CPF_COMPRADOR: buyerCpfCnpj || "NÃO INFORMADO",
      RG_COMPRADOR: buyerRg || "NÃO INFORMADO",
      ESTADO_CIVIL: buyerEstadoCivil || "Solteiro(a)",
      TELEFONE_COMPRADOR: buyerPhone || "NÃO INFORMADO",
      ENDERECO_COMPRADOR: buyerAddress || "NÃO INFORMADO",
      CIDADE_UF_COMPRADOR: buyerCidadeUf || "Guarapari / ES",
      CEP_COMPRADOR: buyerCep || "29.200-000",

      MARCA: (veiculo?.marca || "").toUpperCase(),
      MODELO: (veiculo?.modelo || "").toUpperCase(),
      ANO_FAB_MOD: `${veiculo?.anoFab || ""}/${veiculo?.anoMod || ""}`,
      COMBUSTIVEL: (combustivel || "FLEX").toUpperCase(),
      COR: (cor || "NÃO INFORMADA").toUpperCase(),
      QUILOMETRAGEM: quilometragem ? `${quilometragem} km` : "Não informada",
      PLACA: (veiculo?.placa || "").toUpperCase(),
      RENAVAM: veiculo?.renavam || "NÃO INFORMADO",
      CHASSI: veiculo?.chassi || "NÃO INFORMADO",
      TIPO_VEICULO: (tipoVeiculo || "AUTOMÓVEL").toUpperCase(),

      VALOR_NUMERICO: formattedPrice,
      VALOR_EXTENSO: finalExtenso,
      CONDICOES_TEXT: condicoesText,
      CONDICOES_LISTA: condicoesListaFormatted,
      HAS_SEGURO: hasSeguro,
      CLAUSULA_DISPOSICOES_NUM: clausulaDisposicoesNum,
      SEGUROS_LISTA: segurosListaText,
      SEGUROS_VALOR: segurosValorClean,
      DATA_CONTRATO_EXTENSO: dataExtenso,
    });

    const out = doc.getZip().generate({
      type: "arraybuffer",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const safeName = (buyerName || "Cliente").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Contrato_Venda_Dricar_${veiculo?.placa || "Placa"}_${safeName}.docx`;
    saveAs(blob, filename);
  } catch (error) {
    console.error("Erro ao preencher contrato modelo Word:", error);
    alert("Ocorreu um erro ao gerar o documento do contrato. Por favor, tente novamente.");
  }
}
