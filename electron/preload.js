// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  connectBot: (options) => ipcRenderer.send('connect-bot', options),
  
  getInventory: (username) => ipcRenderer.invoke('get-inventory', username),

  startAntiAFK: (username, interval) => ipcRenderer.send('start-anti-afk', { username, interval }),

  stopAntiAFK: (username) => ipcRenderer.send('stop-anti-afk', username),

  sendChatMessage: (username, message) => ipcRenderer.send('send-chat', { username, message }),

  disconnectBot: (username) => ipcRenderer.send('disconnect-bot', username),

  // Envanter Yönetimi
  moveItem: (username, source, dest) => ipcRenderer.send('move-item', { username, source, dest }),
  equipItem: (username, source, dest) => ipcRenderer.send('equip-item', { username, source, dest }),
  unequipItem: (username, dest) => ipcRenderer.send('unequip-item', { username, dest }),

  // Depolama
  loadAccounts: () => ipcRenderer.invoke('load-accounts'),
  saveAccounts: (accounts) => ipcRenderer.send('save-accounts', accounts),
  loadServerInfo: () => ipcRenderer.invoke('load-server-info'),
  saveServerInfo: (serverInfo) => ipcRenderer.send('save-server-info', serverInfo),

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
