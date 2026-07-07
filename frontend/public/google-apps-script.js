/**
 * Google Apps Script - API de Integração e Autenticação por Cargos para Dricar
 * 
 * INSTRUÇÕES:
 * 1. Na sua Planilha Google, clique em Extensões -> Apps Script.
 * 2. Cole este código no editor (substituindo todo o conteúdo atual).
 * 3. Clique em "Salvar" (ícone de disquete).
 * 4. Clique em "Implantar" (Deploy) -> "Nova implantação" (New deployment).
 * 5. Selecione o tipo "App da Web" (Web App).
 * 6. Em "Executar como", selecione "Eu (seu-email@gmail.com)".
 * 7. Em "Quem tem acesso", selecione "Qualquer pessoa" (Anyone) - Necessário para o Next.js conseguir enviar os dados.
 * 8. Clique em "Implantar" e conceda as permissões de acesso à planilha se solicitado.
 * 9. Copie a URL do App da Web gerada e adicione no arquivo `.env.local` na variável `GOOGLE_SCRIPT_API_URL`.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000); // Aguarda até 15 segundos para evitar conflitos de gravação
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Nenhum dado enviado.");
    }
    
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ----------------------------------------------------
    // TRATAMENTO DA ABA DE USUÁRIOS (GERENCIAMENTO PRIVADO)
    // ----------------------------------------------------
    var usersSheet = spreadsheet.getSheetByName("Usuários");
    
    // Se a aba de usuários não existir, cria automaticamente com cabeçalhos e admin padrão
    if (!usersSheet) {
      usersSheet = spreadsheet.insertSheet("Usuários");
      var userHeaders = ["nome", "cargo", "login", "senha"];
      usersSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
      // Admin padrão: admin / admin123
      usersSheet.appendRow(["Administrador Padrão", "Admin", "admin", "admin123"]);
    }

    // ----------------------------------------------------
    // AÇÃO: REALIZAR LOGIN (SEGURO E PRIVADO)
    // ----------------------------------------------------
    if (action === "login") {
      var reqLogin = requestData.login ? requestData.login.toString().trim() : "";
      var reqPassword = requestData.password ? requestData.password.toString().trim() : "";
      
      if (!reqLogin || !reqPassword) {
        throw new Error("Login e senha são obrigatórios.");
      }
      
      var lastUserRow = usersSheet.getLastRow();
      if (lastUserRow < 2) {
        throw new Error("Nenhum usuário cadastrado no sistema.");
      }
      
      var userHeaders = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
      var nameColIdx = userHeaders.indexOf("nome") + 1;
      var roleColIdx = userHeaders.indexOf("cargo") + 1;
      var loginColIdx = userHeaders.indexOf("login") + 1;
      var passColIdx = userHeaders.indexOf("senha") + 1;
      
      if (nameColIdx === 0 || roleColIdx === 0 || loginColIdx === 0 || passColIdx === 0) {
        throw new Error("A aba 'Usuários' está desalinhada. Certifique-se de que os cabeçalhos sejam: nome, cargo, login, senha.");
      }
      
      var usersData = usersSheet.getRange(2, 1, lastUserRow - 1, usersSheet.getLastColumn()).getValues();
      
      for (var u = 0; u < usersData.length; u++) {
        var row = usersData[u];
        var dbLogin = row[loginColIdx - 1].toString().trim();
        var dbPassword = row[passColIdx - 1].toString().trim();
        
        // Validação case-insensitive para o login
        if (dbLogin.toLowerCase() === reqLogin.toLowerCase() && dbPassword === reqPassword) {
          var matchedUser = {
            nome: row[nameColIdx - 1].toString(),
            cargo: row[roleColIdx - 1].toString(),
            login: dbLogin
          };
          return createJsonResponse({ success: true, user: matchedUser });
        }
      }
      
      return createJsonResponse({ success: false, error: "Usuário ou senha incorretos." });
    }

    // ----------------------------------------------------
    // GERENCIAMENTO DE CARROS (AÇÕES DO ESTOQUE E CRM)
    // ----------------------------------------------------
    var sheet = spreadsheet.getActiveSheet();
    // Garante que não mexeremos na aba Usuários por engano ao manipular carros
    if (sheet.getName() === "Usuários") {
      // Se estiver focado na aba de usuários por padrão, pega a primeira aba de carros (geralmente a aba principal)
      sheet = spreadsheet.getSheets()[0];
    }
    
    // Obtém cabeçalhos dos veículos
    var lastCol = Math.max(1, sheet.getLastColumn());
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    function getOrAddColumn(colName) {
      var idx = headers.indexOf(colName);
      if (idx !== -1) {
        return idx + 1;
      }
      var newColIndex = lastCol + 1;
      sheet.getRange(1, newColIndex).setValue(colName);
      headers.push(colName);
      lastCol = newColIndex;
      return newColIndex;
    }
    
    var idCol = getOrAddColumn("id");
    
    // AÇÃO: CADASTRAR VEÍCULO
    if (action === "create") {
      var car = requestData.car;
      var lastRow = sheet.getLastRow();
      
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
      car.status = car.status || "Ativo";
      
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
    
    // AÇÕES DEPENDENTES DE ID
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
          rowIndex = k + 2;
          break;
        }
      }
    }
    
    if (rowIndex === -1) {
      throw new Error("Veículo com ID " + targetId + " não encontrado.");
    }
    
    // AÇÃO: EDITAR VEÍCULO
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
    
    // AÇÃO: EXCLUIR VEÍCULO
    if (action === "delete") {
      sheet.deleteRow(rowIndex);
      return createJsonResponse({ success: true });
    }
    
    // AÇÃO: ATUALIZAR STATUS (VENDIDO)
    if (action === "updateStatus") {
      var newStatus = requestData.status;
      var statusColIdx = getOrAddColumn("status");
      sheet.getRange(rowIndex, statusColIdx).setValue(newStatus);
      
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
