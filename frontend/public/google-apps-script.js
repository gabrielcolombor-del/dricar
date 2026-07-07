/**
 * Google Apps Script - API de Integração, Autenticação e Upload de Fotos para Dricar
 * 
 * INSTRUÇÕES:
 * 1. Na sua Planilha Google, clique em Extensões -> Apps Script.
 * 2. Cole este código no editor (substituindo todo o conteúdo atual).
 * 3. Clique em "Salvar" (ícone de disquete).
 * 4. Clique em "Implantar" (Deploy) ➔ "Gerenciar implantações" (Manage deployments).
 * 5. Clique no ícone de lápis (Editar) ao lado do seu Web App ativo.
 * 6. Na opção "Versão" (Version), altere para "Nova versão" (New version).
 * 7. Clique em "Implantar" (isso atualizará o script mantendo a mesma URL na Vercel!).
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
      
      // Obtém e padroniza cabeçalhos em minúsculo e sem espaços nas pontas
      var rawUserHeaders = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
      var userHeaders = rawUserHeaders.map(function(h) {
        return h.toString().toLowerCase().trim();
      });
      
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
        var dbName = row[nameColIdx - 1].toString().trim();
        var dbRole = row[roleColIdx - 1].toString().trim();
        
        // Validação de login (case-insensitive) e senha (case-sensitive)
        if (dbLogin.toLowerCase() === reqLogin.toLowerCase() && dbPassword === reqPassword) {
          var matchedUser = {
            nome: dbName,
            cargo: dbRole,
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
    if (sheet.getName() === "Usuários") {
      sheet = spreadsheet.getSheets()[0];
    }
    
    // Obtém cabeçalhos dos veículos
    var lastCol = Math.max(1, sheet.getLastColumn());
    var rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var headers = rawHeaders.map(function(h) {
      return h.toString().toLowerCase().trim();
    });
    
    function getOrAddColumn(colName) {
      var idx = headers.indexOf(colName.toLowerCase().trim());
      if (idx !== -1) {
        return idx + 1;
      }
      var newColIndex = lastCol + 1;
      sheet.getRange(1, newColIndex).setValue(colName);
      headers.push(colName.toLowerCase().trim());
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
      
      // Se houver uma imagem em Base64 enviada, faz upload no Drive e usa o link gerado
      if (requestData.image) {
        var cleanTitle = (car.title || "veiculo").replace(/[^a-zA-Z0-9]/g, "_");
        var imgName = cleanTitle + "_" + car.id + ".jpg";
        car.imageUrl = uploadImageToDrive(requestData.image, imgName);
      }
      
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
      
      // Se houver uma nova imagem em Base64 enviada, faz upload no Drive e atualiza o link
      if (requestData.image) {
        var cleanTitle = (updatedCar.title || "veiculo").replace(/[^a-zA-Z0-9]/g, "_");
        var imgName = cleanTitle + "_" + targetId + "_edit.jpg";
        updatedCar.imageUrl = uploadImageToDrive(requestData.image, imgName);
      }

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

// Função auxiliar para decodificar e fazer upload da imagem no Google Drive
function uploadImageToDrive(base64Data, fileName) {
  try {
    var rawData = base64Data;
    // Remove o cabeçalho base64 se presente (ex: "data:image/jpeg;base64,")
    if (base64Data.indexOf(",") !== -1) {
      rawData = base64Data.split(",")[1];
    }
    
    var decoded = Utilities.base64Decode(rawData);
    
    // Cria ou busca a pasta "Imagens Dri-Car" no Drive
    var folderName = "Imagens Dri-Car";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    var blob = Utilities.newBlob(decoded, "image/jpeg", fileName || "carro.jpg");
    var file = folder.createFile(blob);
    
    // Define acesso público de leitura para o arquivo (necessário para incorporar no site)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Link direto e estático de carregamento rápido
    var fileId = file.getId();
    var imageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    return imageUrl;
  } catch (err) {
    throw new Error("Erro ao fazer upload da foto no Google Drive: " + err.toString());
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
