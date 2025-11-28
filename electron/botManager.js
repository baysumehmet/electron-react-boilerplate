// electron/botManager.js
const mineflayer = require('mineflayer');

// Prevent memory leaks and state loss during hot-reloads in development
if (!global.managedBots) {
  global.managedBots = {};
}
const bots = global.managedBots;

if (!global.afkTimers) {
  global.afkTimers = {};
}
const afkTimers = global.afkTimers;

function connectBot(options, webContents) {
  if (bots[options.username]) {
    console.log(`${options.username} adlı bot zaten aktif veya bağlanıyor.`);
    return;
  }

  const host = options.host;
  const port = options.port || 25565;

  // Create the bot instance directly
  const bot = mineflayer.createBot({
    host: host,
    port: parseInt(port), // Ensure port is an integer
    username: options.username,
    auth: options.auth || 'mojang',
    version: options.version || false,
  });

  // Hata Kontrolü: mineflayer.createBot başarısız olursa, bot tanımsız olabilir.
  if (!bot) {
    const errorMessage = `Bot oluşturulamadı: ${options.username}. Lütfen bağlantı ayarlarını kontrol edin (host, port, username).`;
    console.error(errorMessage);
    webContents.send('bot-event', { type: 'error', username: options.username, message: errorMessage });
    return;
  }
  // Assign the bot instance to the bots object
  bots[options.username] = bot;
  bot.webContents = webContents; // Store webContents for later use

  // Add event listeners after ensuring the bot is fully initialized
  bot.on('login', () => {
    console.log(`${bot.username} sunucuya giriş yaptı.`);
    webContents.send('bot-event', { type: 'login', username: bot.username, message: 'Sunucuya giriş yaptı.' });
  });
  bot.on('spawn', () => {
    console.log(`${bot.username} oyuna spawn oldu.`);
    webContents.send('bot-event', { type: 'spawn', username: bot.username, message: 'Oyuna spawn oldu.' });
    webContents.send('bot-event', { type: 'health', username: bot.username, data: { health: bot.health, food: bot.food } });
    // Send initial hotbar state
    webContents.send('bot-event', { type: 'hotbar-update', username: bot.username, data: { activeSlot: bot.quickBarSlot } });

    // Gelişmiş otomatik komut sistemi
    if (options.autoLoginCommands && options.autoLoginCommands.trim() !== '') {
      const commands = options.autoLoginCommands.split('\n').filter(cmd => cmd.trim() !== '');
      const delay = (options.commandDelay || 5) * 1000;

      commands.forEach((command, index) => {
        setTimeout(() => {
          if (bots[bot.username]) {
            console.log(`'${bot.username}' otomatik komut gönderiyor: ${command}`);
            bot.chat(command);
          }
        }, index * delay);
      });
    }

    // Envanter güncellemelerini dinle
    bot.inventory.on('updateSlot', (slot, oldItem, newItem) => {
      console.log(`[${bot.username}] Envanter güncellendi, slot: ${slot}`);
      webContents.send('bot-event', {
        type: 'inventory',
        username: bot.username,
        data: { slots: [...bot.inventory.slots] } // Send a copy
      });
    });

  });
  bot.on('health', () => {
    webContents.send('bot-event', { type: 'health', username: bot.username, data: { health: bot.health, food: bot.food } });
  });
  bot.on('chat', (username, message) => {
    console.log(`[Sohbet] <${username}> ${message}`);
    webContents.send('bot-event', { type: 'chat', username: bot.username, data: { sender: username, message: message } });
  });
  bot.on('error', (err) => {
    console.error(`${bot.username} bir hatayla karşılaştı:`, err);
    webContents.send('bot-event', { type: 'error', username: bot.username, message: err.message });
    if (bots[bot.username]) delete bots[bot.username];
  });
  bot.on('end', (reason) => {
    console.log(`${bot.username} bağlantısı sonlandı. Sebep: ${reason}`);
    webContents.send('bot-event', { type: 'end', username: bot.username, message: `Bağlantı sonlandı. Sebep: ${reason}` });
    if (bots[bot.username]) delete bots[bot.username];
  });

  bot.on('heldItemChanged', (heldItem) => {
    // The heldItem object can be null. bot.quickBarSlot is the 0-8 index.
    webContents.send('bot-event', { type: 'hotbar-update', username: bot.username, data: { activeSlot: bot.quickBarSlot } });
  });

  bot.on('windowOpen', (window) => {
    const titleStr = window.title.toString();
    console.log(`[${bot.username}] Pencere açıldı: ${titleStr}`);
    try {
        // Mineflayer window titles can be ChatMessage objects (JSON strings)
        const titleJson = JSON.parse(titleStr);
        // Check for various chest types
        if (titleJson.translate && titleJson.translate.startsWith('container.chest')) {
            // Send initial state
            webContents.send('bot-event', {
                type: 'chest-open',
                username: bot.username,
                data: {
                    title: titleJson.translate,
                    slots: window.slots
                }
            });
            // Listen for changes within this specific window
            window.on('updateSlot', (slot, oldItem, newItem) => {
                console.log(`[${bot.username}] Sandık güncellendi, slot: ${slot}`);
                webContents.send('bot-event', {
                    type: 'chest-open', // Re-send the open event with updated slots
                    username: bot.username,
                    data: {
                        title: titleJson.translate,
                        slots: [...window.slots] // Send a copy
                    }
                });
            });
        }
    } catch(e) {
        // Title was not JSON, maybe a simple string. For future use.
        if (titleStr.includes('Chest')) {
             webContents.send('bot-event', {
                type: 'chest-open',
                username: bot.username,
                data: {
                    title: titleStr,
                    slots: [...window.slots] // Send a copy
                }
            });
            // Also add listener here for non-json titles
            window.on('updateSlot', (slot, oldItem, newItem) => {
                 webContents.send('bot-event', {
                    type: 'chest-open',
                    username: bot.username,
                    data: {
                        title: titleStr,
                        slots: [...window.slots] // Send a copy
                    }
                });
            });
        }
    }
  });

  bot.on('windowClose', (window) => {
    console.log(`[${bot.username}] Pencere kapandı.`);
    bot.activeChest = null; // Clear the reference
    webContents.send('bot-event', { type: 'chest-close', username: bot.username });
  });

  return bot;
}

async function openNearestChest(username) {
    const bot = bots[username];
    if (!bot) return;

    try {
        const chestBlock = bot.findBlock({
            matching: bot.registry.blocksByName.chest.id,
            maxDistance: 16,
        });

        if (chestBlock) {
            console.log(`[${username}] En yakın sandık bulundu:`, chestBlock.position);
            // Open the chest and store the returned Chest object
            bot.activeChest = await bot.openChest(chestBlock);
        } else {
            bot.webContents.send('bot-event', { type: 'error', username, message: 'Yakında sandık bulunamadı.' });
            console.log(`[${username}] Yakında sandık bulunamadı.`);
        }
    } catch (err) {
        const errorMessage = `Sandık açılamadı: ${err.message}`;
        console.error(`[${username}] Sandık açılırken hata:`, err.message);
        bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
    }
}


function startAntiAFK(username, intervalSeconds = 15) {
  const bot = bots[username];
  if (!bot) return;

  // Eğer zaten bir zamanlayıcı varsa, yenisini başlatmadan önce eskisini temizle
  if (afkTimers[username]) {
    clearInterval(afkTimers[username]);
  }

  console.log(`${username} için Anti-AFK başlatıldı (controlState). Interval: ${intervalSeconds} saniye.`);
  
  afkTimers[username] = setInterval(() => {
    if (bot && bot.entity) {
      // Tuşa basıp bırakma efekti için controlState kullanıyoruz.
      bot.controlState.jump = true;
      setTimeout(() => {
        if(bot) bot.controlState.jump = false;
      }, 200); // 200ms basılı tut
      
      console.log(`${username} zıpladı (Anti-AFK - controlState).`);
    }
  }, intervalSeconds * 1000);
}

function stopAntiAFK(username) {
  if (afkTimers[username]) {
    clearInterval(afkTimers[username]);
    delete afkTimers[username];
    console.log(`${username} için Anti-AFK durduruldu.`);
  }
}

function disconnectBot(username) {
  const bot = bots[username];
  if (bot) {
    console.log(`${username} bağlantısı kesiliyor...`);
    bot.quit();
  }
}

function sendChatMessage(username, message) {
  const bot = bots[username];
  if (bot) {
    bot.chat(message);
  }
}

function getBot(username) { return bots[username]; }
function getAllBots() { return bots; }

function getInventory(username) {
  const bot = bots[username];
  // Bot yoksa veya envanteri henüz yüklenmemişse boş bir yapı döndür
  if (!bot || !bot.inventory) {
    return { slots: Array(46).fill(null), version: null };
  }
  // mineflayer's bot.inventory.slots zaten render bileşeninin beklediği dizi formatındadır.
  return { slots: bot.inventory.slots, version: bot.version };
}

async function moveItem({ username, sourceSlot, destinationSlot }) {
  const bot = bots[username];
  if (!bot) return;

  const window = bot.currentWindow || bot.inventory;
  const sourceItem = window.slots[sourceSlot];
  const destItem = window.slots[destinationSlot];

  if (!sourceItem) return; // Can't move an empty slot

  try {
    console.log(`[${username}] Moving item from ${sourceSlot} to ${destinationSlot}`);
    if (destItem) {
      console.log(`[${username}] Destination not empty. Swapping items.`);
      // Perform a swap using three clicks
      await bot.clickWindow(sourceSlot, 0, 0);
      await bot.clickWindow(destinationSlot, 0, 0);
      await bot.clickWindow(sourceSlot, 0, 0);
    } else {
      console.log(`[${username}] Destination empty. Simple move.`);
      // Perform a simple move
      await bot.clickWindow(sourceSlot, 0, 0);
      await bot.clickWindow(destinationSlot, 0, 0);
    }
  } catch (err) {
    const errorMessage = `Eşya taşınamadı: ${err.message}`;
    console.error(`[${username}] Eşya taşınırken hata oluştu: ${sourceSlot} -> ${destinationSlot}`, err.message);
    if (bot.webContents) {
      bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
    }
  }
}

async function tossItemStack({ username, sourceSlot }) {
  const bot = bots[username];
  if (!bot) return;
  try {
    const item = bot.inventory.slots[sourceSlot];
    if (item) {
      await bot.tossStack(item);
      console.log(`[${username}] Eşya atıldı: ${item.name} (Slot: ${sourceSlot})`);
    } else {
      console.log(`[${username}] Eşya atılamadı: Slot ${sourceSlot} boş.`);
    }
  } catch (err) {
    const errorMessage = `Eşya atılamadı: ${err.message}`;
    console.error(`[${username}] Eşya atılırken hata:`, err.message);
    if (bot.webContents) {
      bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
    }
  }
}

async function clearInventory(username) {
  const bot = bots[username];
  if (!bot) return;
  
  console.log(`[${username}] Envanter temizleniyor...`);
  const itemsToToss = bot.inventory.items();
  
  for (const item of itemsToToss) {
    try {
      await bot.tossStack(item);
      // Sunucuyu aşırı yüklememek için küçük bir bekleme süresi ekleyelim
      await new Promise(resolve => setTimeout(resolve, 50)); 
    } catch (err) {
      const errorMessage = `Envanter temizlenirken hata: ${item.name} atılamadı: ${err.message}`;
      console.error(errorMessage);
      if (bot.webContents) {
        bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
      }
      // Bir hata oluşursa döngüden çık
      break; 
    }
  }
}

function setActiveHotbar({ username, slot }) {
  const bot = bots[username];
  if (!bot) return;

  // Hotbar slots are 36-44. The quick bar slot index is 0-8.
  if (slot >= 36 && slot <= 44) {
    const hotbarIndex = slot - 36;
    bot.setQuickBarSlot(hotbarIndex);
    console.log(`[${username}] Aktif hotbar slotu ayarlandı: ${hotbarIndex}`);
  }
}

function closeWindow(username) {
  const bot = bots[username];
  if (!bot || !bot.currentWindow) return;
  // This is a generic way to close any window the bot has open.
  bot.closeWindow(bot.currentWindow);
}

async function withdrawItem({ username, item }) {
    const bot = bots[username];
    const chestWindow = bot.currentWindow;
    if (!bot || !chestWindow || !item ) return;
    try {
        await bot.withdraw(chestWindow, item.type, item.metadata, item.count);
    } catch (err) {
        const errorMessage = `Eşya çekilemedi: ${err.message}`;
        console.error(`[${username}] Eşya çekilirken hata:`, err.message);
        bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
    }
}

async function depositItem({ username, item }) {
    const bot = bots[username];
    const chestWindow = bot.currentWindow;
    if (!bot || !chestWindow || !item ) return;
    try {
        await bot.deposit(chestWindow, item.type, item.metadata, item.count);
    } catch (err) {
        const errorMessage = `Eşya bırakılamadı: ${err.message}`;
        console.error(`[${username}] Eşya bırakılırken hata:`, err.message);
        bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
    }
}

async function withdrawAll(username) {
    const bot = bots[username];
    const chest = bot.activeChest;
    if (!bot || !chest) return;

    console.log(`[${username}] Sandıktaki tüm eşyalar alınıyor...`);
    
    for (const item of chest.containerItems()) {
        try {
            await chest.withdraw(item.type, item.metadata, item.count);
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
            console.error(`Eşya çekilirken hata: ${err.message}`);
            bot.webContents.send('bot-event', { type: 'inventory-error', username, message: `Eşya çekilemedi: ${item.name}` });
            break; 
        }
    }
}

async function depositAll(username) {
    const bot = bots[username];
    const chest = bot.activeChest;
    if (!bot || !chest) return;

    console.log(`[${username}] Envanterdeki tüm eşyalar sandığa bırakılıyor...`);
    
    for (const item of bot.inventory.items()) {
        try {
            await chest.deposit(item.type, item.metadata, item.count);
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
            console.error(`Eşya bırakılırken hata: ${err.message}`);
            bot.webContents.send('bot-event', { type: 'inventory-error', username, message: `Eşya bırakılamadı: ${item.name}` });
            break; 
        }
    }
}

module.exports = {
  connectBot,
  startAntiAFK,
  stopAntiAFK,
  disconnectBot,
  sendChatMessage,
  getBot,
  getAllBots,
  getInventory,
  moveItem,
  tossItemStack,
  clearInventory,
  setActiveHotbar,
  openNearestChest,
  closeWindow,
  depositItem,
  withdrawItem,
  depositAll,
  withdrawAll,
};
