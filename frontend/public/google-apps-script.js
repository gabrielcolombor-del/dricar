/**
 * Google Apps Script - API de Integração para Dricar
 * 
 * INSTRUÇÕES:
 * 1. Na sua Planilha Google, clique em Extensões -> Apps Script.
 * 2. Cole este código no editor (substituindo todo o conteúdo atual).
 * 3. Clique em "Salvar" (ícone de disquete).
 * 4. Clique em "Implantar" (Deploy) -> "Nova implantação" (New deployment).
 * 5. Selecione o tipo "App da Web" (Web App).
 * 6. Em "Executar como", selecione "Eu (seu-email@gmail.com)".
 * 7. Em "Quem tem acesso", selecione "Qualquer pessoa" (Anyone) - Isso é necessário para o Next.js conseguir enviar os dados.
 * 8. Clique em "Implantar". Copie a URL do App da Web gerada e adicione no arquivo `.env.local` na variável `GOOGLE_SCRIPT_API_URL`.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000); // Aguarda até 15 segundos para evitar conflitos de gravação simultânea
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Nenhum dado enviado.");
    }
    
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Obtém cabeçalhos da primeira linha
    var lastCol = Math.max(1, sheet.getLastColumn());
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Função auxiliar para encontrar ou criar índice de coluna
    function getOrAddColumn(colName) {
      var idx = headers.indexOf(colName);
      if (idx !== -1) {
        return idx + 1;
      }
      // Se não existir, adiciona como nova coluna no final
      var newColIndex = lastCol + 1;
      sheet.getRange(1, newColIndex).setValue(colName);
      headers.push(colName);
      lastCol = newColIndex;
      return newColIndex;
    }
    
    var idCol = getOrAddColumn("id");
    
    // ----------------------------------------------------
    // AÇÃO: CADASTRAR VEÍCULO
    // ----------------------------------------------------
    if (action === "create") {
      var car = requestData.car;
      var lastRow = sheet.getLastRow();
      
      // Gera ID sequencial automático
      var nextId = 1;
      if (lastRow > 1) {
        var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
        var maxId = 0;
        for (var i = 0; i < ids.length; i++) {
          var val = Number(ids[i][0]);
          if (!isNaN(val) && val > maxId) {
            maxId = val;
          }
        }
        nextId = maxId + 1;
      }
      
      car.id = nextId.toString();
      car.status = car.status || "Ativo"; // Status padrão ativo
      
      // Monta a linha conforme a ordem atual das colunas
      var newRow = [];
      for (var j = 0; j < headers.length; j++) {
        var colName = headers[j];
        if (colName === "id") {
          newRow.push(nextId);
        } else if (car[colName] !== undefined) {
          newRow.push(car[colName]);
        } else {
          newRow.push("");
        }
      }
      
      sheet.appendRow(newRow);
      return createJsonResponse({ success: true, id: nextId, car: car });
    }
    
    // ----------------------------------------------------
    // LOCALIZAR REGISTRO POR ID
    // ----------------------------------------------------
    var targetId = requestData.id;
    if (!targetId) {
      throw new Error("ID do veículo é obrigatório para esta ação.");
    }
    
    var lastRow = sheet.getLastRow();
    var rowIndex = -1;
    if (lastRow > 1) {
      var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
      for (var k = 0; k < ids.length; k++) {
        if (ids[k][0].toString() === targetId.toString()) {
          rowIndex = k + 2; // +2 compensa cabeçalho e índice 0 do array
          break;
        }
      }
    }
    
    if (rowIndex === -1) {
      throw new Error("Veículo com ID " + targetId + " não encontrado na planilha.");
    }
    
    // ----------------------------------------------------
    // AÇÃO: EDITAR VEÍCULO (COMPLETO)
    // ----------------------------------------------------
    if (action === "update") {
      var updatedCar = requestData.car;
      for (var colIdx = 0; colIdx < headers.length; colIdx++) {
        var colName = headers[colIdx];
        if (colName !== "id" && updatedCar[colName] !== undefined) {
          sheet.getRange(rowIndex, colIdx + 1).setValue(updatedCar[colName]);
        }
      }
      return createJsonResponse({ success: true });
    }
    
    // ----------------------------------------------------
    // AÇÃO: EXCLUIR VEÍCULO
    // ----------------------------------------------------
    if (action === "delete") {
      sheet.deleteRow(rowIndex);
      return createJsonResponse({ success: true });
    }
    
    // ----------------------------------------------------
    // AÇÃO: ATUALIZAR STATUS (VENDIDO / CRM)
    // ----------------------------------------------------
    if (action === "updateStatus") {
      var newStatus = requestData.status;
      var statusColIdx = getOrAddColumn("status");
      sheet.getRange(rowIndex, statusColIdx).setValue(newStatus);
      
      // Se for vendido, registra dados de CRM se enviados
      if (newStatus === "Vendido") {
        if (requestData.buyerName !== undefined) {
          var buyerCol = getOrAddColumn("buyerName");
          sheet.getRange(rowIndex, buyerCol).setValue(requestData.buyerName);
        }
        if (requestData.salePrice !== undefined) {
          var salePriceCol = getOrAddColumn("salePrice");
          sheet.getRange(rowIndex, salePriceCol).setValue(requestData.salePrice);
        }
        if (requestData.saleDate !== undefined) {
          var saleDateCol = getOrAddColumn("saleDate");
          sheet.getRange(rowIndex, saleDateCol).setValue(requestData.saleDate);
        }
      }
      return createJsonResponse({ success: true });
    }
    
    throw new Error("Ação '" + action + "' não reconhecida.");
    
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
