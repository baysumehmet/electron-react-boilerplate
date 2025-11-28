const fs = require('fs');
const path = require('path');

let accountsFilePath;
let serverInfoFilePath;

// Bu fonksiyon main.js'den app objesiyle çağrılacak
function initialize(app) {
  const userDataPath = app.getPath('userData');
  accountsFilePath = path.join(userDataPath, 'accounts.json');
  serverInfoFilePath = path.join(userDataPath, 'serverInfo.json');
  console.log('Hesapların saklanacağı dosya yolu:', accountsFilePath);
  console.log('Sunucu bilgisinin saklanacağı dosya yolu:', serverInfoFilePath);
}

function saveAccounts(accounts) {
  if (!accountsFilePath) return;
  try {
    fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error('Hesaplar kaydedilirken hata oluştu:', error);
  }
}

function loadAccounts() {
  if (!accountsFilePath) return [];
  try {
    if (fs.existsSync(accountsFilePath)) {
      const data = fs.readFileSync(accountsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Hesaplar yüklenirken hata oluştu:', error);
  }
  return []; // Dosya yoksa veya hata varsa boş liste döndür
}

function saveServerInfo(serverInfo) {
    if (!serverInfoFilePath) return;
    try {
        fs.writeFileSync(serverInfoFilePath, JSON.stringify(serverInfo, null, 2));
    } catch (error) {
        console.error('Sunucu bilgisi kaydedilirken hata oluştu:', error);
    }
}

function loadServerInfo() {
    if (!serverInfoFilePath) return null;
    try {
        if (fs.existsSync(serverInfoFilePath)) {
            const data = fs.readFileSync(serverInfoFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Sunucu bilgisi yüklenirken hata oluştu:', error);
    }
    return null; // Dosya yoksa veya hata varsa null döndür
}

module.exports = { initialize, saveAccounts, loadAccounts, saveServerInfo, loadServerInfo };
