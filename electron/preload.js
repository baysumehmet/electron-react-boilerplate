// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  connectBot: (options) => ipcRenderer.send('connect-bot', options),

  startAntiAFK: (username, interval) => ipcRenderer.send('start-anti-afk', { username, interval }),

  stopAntiAFK: (username) => ipcRenderer.send('stop-anti-afk', username),

  sendChatMessage: (username, message) => ipcRenderer.send('send-chat', { username, message }),

  disconnectBot: (username) => ipcRenderer.send('disconnect-bot', username),

  getInventory: (username) => ipcRenderer.invoke('get-inventory', username),

  moveItem: (options) => ipcRenderer.send('move-item', options),

  tossItemStack: (options) => ipcRenderer.send('toss-item-stack', options),
  clearInventory: (username) => ipcRenderer.send('clear-inventory', username),

  setActiveHotbar: (options) => ipcRenderer.send('set-active-hotbar', options),

  openNearestChest: (username) => ipcRenderer.send('open-nearest-chest', username),
  openChestAt: (username, x, y, z) => ipcRenderer.invoke('open-chest-at', { username, x, y, z }),
  breakBlock: (username, x, y, z) => ipcRenderer.invoke('break-block', { username, x, y, z }),
  moveTo: (username, x, y, z) => ipcRenderer.invoke('move-to', { username, x, y, z }),

  closeWindow: (username) => ipcRenderer.send('close-window', username),

  depositItem: (options) => ipcRenderer.send('deposit-item', options),
  withdrawItem: (options) => ipcRenderer.send('withdraw-item', options),

  depositAll: (username) => ipcRenderer.send('deposit-all', username),
  withdrawAll: (username) => ipcRenderer.send('withdraw-all', username),

  // Depolama
  loadAccounts: () => ipcRenderer.invoke('load-accounts'),
  saveAccounts: (accounts) => ipcRenderer.send('save-accounts', accounts),
  loadServerInfo: () => ipcRenderer.invoke('load-server-info'),
  saveServerInfo: (serverInfo) => ipcRenderer.send('save-server-info', serverInfo),
  loadScripts: () => ipcRenderer.invoke('load-scripts'),
  saveScripts: (scripts) => ipcRenderer.send('save-scripts', scripts),

  // Bot Actions
  connectBot: (options) => ipcRenderer.send('connect-bot', options),
  disconnectBot: (username) => ipcRenderer.send('disconnect-bot', username),

  getSupportedVersions: () => ipcRenderer.invoke('get-supported-versions'),

  onBotEvent: (callback) => {
    console.log('PRELOAD: onBotEvent was called. Subscribing to bot-event.');
    const subscription = (event, ...args) => {
      console.log('PRELOAD: Received bot-event in preload:', ...args);
      callback(...args);
    };
    ipcRenderer.on('bot-event', subscription);
    
    // Temizleme fonksiyonu döndür
    return () => {
      console.log('PRELOAD: Cleaning up bot-event listener.');
      ipcRenderer.removeListener('bot-event', subscription);
    };
  },
});
