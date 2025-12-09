const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const botManager = require('./botManager');
const storageManager = require('./storageManager');
const mineflayer = require('mineflayer');

const isDev = !app.isPackaged;

function createWindow() {
  console.log('[1] createWindow fonksiyonu başlatıldı.');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../src/logos/afkpluslogo.png'),
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
  ipcMain.handle('get-supported-versions', () => { return mineflayer.supportedVersions; });
  ipcMain.handle('open-chest-at', (event, { username, x, y, z }) => { return botManager.openChestAt(username, { x, y, z }); });
  ipcMain.handle('move-to', (event, { username, x, y, z }) => { return botManager.moveToCoordinates(username, { x, y, z }); });
  ipcMain.handle('break-block', (event, { username, x, y, z }) => { return botManager.breakBlockAt(username, { x, y, z }); });
    ipcMain.on('save-accounts', (event, accounts) => {
      storageManager.saveAccounts(accounts);
    });
  
    ipcMain.handle('load-server-info', () => {
      return storageManager.loadServerInfo();
    });
  
    ipcMain.on('save-server-info', (event, serverInfo) => {
      storageManager.saveServerInfo(serverInfo);
    });

  ipcMain.handle('load-scripts', () => {
    return storageManager.loadScripts();
  });

  ipcMain.on('save-scripts', (event, scripts) => {
    storageManager.saveScripts(scripts);
  });
  
    ipcMain.on('disconnect-bot', (event, { username, isManual }) => {
      botManager.disconnectBot(username, isManual);
    });

  ipcMain.handle('get-inventory', (event, username) => {
    return botManager.getInventory(username);
  });

  ipcMain.on('move-item', (event, options) => {
    botManager.moveItem(options);
  });

  ipcMain.on('toss-item-stack', (event, options) => {
    botManager.tossItemStack(options);
  });

  ipcMain.on('clear-inventory', (event, username) => {
    botManager.clearInventory(username);
  });

  ipcMain.on('set-active-hotbar', (event, options) => {
    botManager.setActiveHotbar(options);
  });

  ipcMain.on('open-nearest-chest', (event, username) => {
    botManager.openNearestChest(username);
  });

  ipcMain.on('close-window', (event, username) => {
    botManager.closeWindow(username);
  });

  ipcMain.on('deposit-item', (event, options) => {
    botManager.depositItem(options);
  });

  ipcMain.on('withdraw-item', (event, options) => {
    botManager.withdrawItem(options);
  });

  ipcMain.on('deposit-all', (event, username) => {
    botManager.depositAll(username);
  });

  ipcMain.on('withdraw-all', (event, username) => {
    botManager.withdrawAll(username);
  });

  ipcMain.handle('deposit-to-chest', (event, { username, excludedItems }) => {
    return botManager.depositToChest(username, { excludedItems });
  });

  ipcMain.handle('follow-player', (event, { username, targetUsername, duration }) => {
    return botManager.followPlayer(username, targetUsername, duration);
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