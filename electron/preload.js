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
