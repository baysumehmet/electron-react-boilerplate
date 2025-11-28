const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const botManager = require('./botManager');
const storageManager = require('./storageManager');

const isDev = !app.isPackaged;

function createWindow() {
  console.log('[1] createWindow fonksiyonu başlatıldı.');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  console.log('[2] Pencere objesi oluşturuldu.');

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  console.log(`[3] URL yükleniyor: ${url}`);
  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  console.log('[4] URL yükleme komutu gönderildi.');
}

app.on('ready', () => console.log('--- "ready" olayı tetiklendi ---'));

app.whenReady().then(() => {
  console.log('--- whenReady başladı ---');
  
  storageManager.initialize(app);
  
  console.log('--- Storage Manager başlatıldı. IPC dinleyicileri ayarlanıyor... ---');

  // --- IPC Dinleyicileri ---
  ipcMain.on('connect-bot', (event, options) => { botManager.connectBot(options, event.sender); });
  ipcMain.on('start-anti-afk', (event, { username, interval }) => { botManager.startAntiAFK(username, interval); });
  ipcMain.on('stop-anti-afk', (event, username) => { botManager.stopAntiAFK(username); });
  ipcMain.on('send-chat', (event, { username, message }) => { botManager.sendChatMessage(username, message); });
  ipcMain.handle('load-accounts', () => { return storageManager.loadAccounts(); });
    ipcMain.on('save-accounts', (event, accounts) => {
      storageManager.saveAccounts(accounts);
    });
  
    ipcMain.handle('load-server-info', () => {
      return storageManager.loadServerInfo();
    });
  
    ipcMain.on('save-server-info', (event, serverInfo) => {
      storageManager.saveServerInfo(serverInfo);
    });
  
    ipcMain.on('disconnect-bot', (event, username) => {
      botManager.disconnectBot(username);
    });

  console.log('--- IPC dinleyicileri ayarlandı. Pencere oluşturuluyor... ---');
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  const bots = botManager.getAllBots();
  for (const username in bots) {
    bots[username].quit();
  }
  if (process.platform !== 'darwin') app.quit();
});