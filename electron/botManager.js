// electron/botManager.js
const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

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

  // Log the connection options to prove the version is being used
  console.log(`[${options.username}] Connecting with options:`, {
    host: host,
    port: port,
    username: options.username,
    auth: options.auth,
    version: options.version || 'auto'
  });

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

  // Load plugins
  bot.loadPlugin(pathfinder);

  bot.on('goal_reached', (goal) => {
    //console.log(`[${bot.username}] Hedefe ulaşıldı.`);
    webContents.send('bot-event', { type: 'goal_reached', username: bot.username, message: 'Hedefe ulaşıldı.' });
  });

  bot.on('path_update', (results) => {
      // Bu olay çok sık tetiklenebilir, bu yüzden sadece hata ayıklama için loglayabilir veya arayüze daha az sıklıkla gönderebilirsiniz.
      // console.log(`[${bot.username}] Yol güncellendi:`, results.status);
  });

  // Add event listeners after ensuring the bot is fully initialized
  bot.on('login', () => {
    console.log(`${bot.username} sunucuya giriş yaptı.`);
    webContents.send('bot-event', { type: 'login', username: bot.username, message: 'Sunucuya giriş yaptı.' });
  });
  bot.on('spawn', () => {
    console.log(`${bot.username} oyuna spawn oldu.`);
    // Setup pathfinder
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);

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
            //console.log(`'${bot.username}' otomatik komut gönderiyor: ${command}`);
            bot.chat(command);
          }
        }, index * delay);
      });
    }

    // Envanter güncellemelerini dinle
    bot.inventory.on('updateSlot', (slot, oldItem, newItem) => {
      //console.log(`[${bot.username}] Envanter güncellendi, slot: ${slot}`);
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
  bot.on('message', (jsonMsg, position) => {
    // This is the new, rewritten chat handler.
    // It processes all chat/system messages and uses a list of prioritized
    // regular expressions to find the sender and message.
    if (position !== 'chat' && position !== 'system') return;

    const fullMessage = jsonMsg.toString();
    if (!fullMessage.trim()) return; // Ignore empty messages

    // This list is ordered from most specific to most general.
    const patterns = [
        // User's server: |0| Rank Nickname >> message
        { regex: /^\|\d\|\s+(.+?)\s+>>\s+(.*)/ },
        // Ranked, angle brackets: [Admin] <Steve> hi
        { regex: /^\[[^\]]+\] <(.+?)> (.*)/ },
        // Simple angle brackets: <Steve> hi
        { regex: /^<(.+?)> (.*)/ },
        // Ranked, colon: [Mod] Notch: hi
        { regex: /^\[[^\]]+\] ([\w\d_]{3,16}): (.*)/ },
        // Simple, colon: Notch: hi
        { regex: /^([\w\d_]{3,16}): (.*)/ }
    ];

    let sender = 'Mesaj';
    let message = fullMessage;

    for (const p of patterns) {
        const match = fullMessage.match(p.regex);
        if (match && match[1] && match[2]) {
            sender = match[1];
            message = match[2];
            break; // Stop after the first successful match
        }
    }

    // Don't show messages sent by the bot itself.
    // Added checks for both sender and bot.username to prevent crash.
    if (sender && typeof sender === 'string' && bot.username && sender.toLowerCase() === bot.username.toLowerCase()) return;

    console.log(`[Sohbet Alındı] <${sender}> ${message}`);
    webContents.send('bot-event', { type: 'chat', username: bot.username, data: { sender, message } });
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
    let title = 'Unknown Title';

    // Handle different title formats (string, JSON string, object)
    if (typeof window.title === 'string') {
        try {
            const parsed = JSON.parse(window.title);
            // It's a JSON string, extract the meaningful part
            if (parsed.translate) {
                title = parsed.translate;
            } else {
                title = window.title; // Use as is if no translate key
            }
        } catch (e) {
            // It's just a plain string
            title = window.title;
        }
    } else if (typeof window.title === 'object' && window.title !== null) {
        // It's an object, extract the meaningful part from various known structures
        if (window.title.value && window.title.value.translate && window.title.value.translate.value) {
            // Complex object: { value: { translate: { value: 'container.chest' } } }
            title = window.title.value.translate.value;
        } else if (window.title.translate) {
            // Simpler object: { translate: 'container.chest' }
            title = window.title.translate;
        } else {
            // Fallback for other object formats
            title = JSON.stringify(window.title);
        }
    }
    
    // Define a list of container types that the UI should treat as chests
    const containerTypes = [
        'container.chest',
        'container.barrel',
        'container.shulkerBox',
        'container.dispenser',
        'container.dropper',
        'container.hopper'
    ];

    // Check if the window is a known container type or if the title includes "chest" as a fallback
    const isContainer = containerTypes.some(type => title.startsWith(type)) || title.toLowerCase().includes('chest');
    
    if (isContainer) {
        console.log(`[${bot.username}] Konteyner açıldı: ${title}`);
        const sendChestUpdate = () => {
             webContents.send('bot-event', {
                type: 'chest-open',
                username: bot.username,
                data: {
                    title: title,
                    slots: [...window.slots]
                }
            });
        };

        // Send initial state
        sendChestUpdate();

        // Listen for changes within this specific window
        window.on('updateSlot', (slot, oldItem, newItem) => {
            //console.log(`[${bot.username}] Sandık güncellendi, slot: ${slot}`);
            sendChestUpdate();
        });
    }
  });

  bot.on('windowClose', (window) => {
    //console.log(`[${bot.username}] Pencere kapandı.`);
    bot.activeChest = null; // Clear the reference
    webContents.send('bot-event', { type: 'chest-close', username: bot.username });
  });

  return bot;
}

async function openNearestChest(username) {
    const bot = bots[username];
    if (!bot) return;

    try {
        // Dynamically find IDs for all types of chests, shulker boxes, and barrels.
        const containerNames = Object.keys(bot.registry.blocksByName).filter(name =>
            name.includes('chest') ||
            name.includes('shulker_box') ||
            name === 'barrel'
        );
        const containerIds = containerNames.map(name => bot.registry.blocksByName[name].id);

        const containerBlock = bot.findBlock({
            matching: containerIds,
            maxDistance: 16,
        });

        if (containerBlock) {
            //console.log(`[${username}] En yakın konteyner (${containerBlock.name}) bulundu:`, containerBlock.position);
            // openContainer is a generic function for chests, barrels, shulkers etc.
            // It returns a Window object, which is what the rest of the code expects.
            bot.activeChest = await bot.openContainer(containerBlock);
        } else {
            const msg = 'Yakında açılabilir konteyner (sandık, varil, vb.) bulunamadı.';
            bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            //console.log(`[${username}] ${msg}`);
        }
    } catch (err) {
        const errorMessage = `Konteyner açılamadı: ${err.message}`;
        console.error(`[${username}] Konteyner açılırken hata:`, err.message);
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

  //console.log(`${username} için Anti-AFK başlatıldı (controlState). Interval: ${intervalSeconds} saniye.`);
  
  afkTimers[username] = setInterval(() => {
    if (bot && bot.entity) {
      // Tuşa basıp bırakma efekti için controlState kullanıyoruz.
      bot.controlState.jump = true;
      setTimeout(() => {
        if(bot) bot.controlState.jump = false;
      }, 200); // 200ms basılı tut
      
      //console.log(`${username} zıpladı (Anti-AFK - controlState).`);
    }
  }, intervalSeconds * 1000);
}

function stopAntiAFK(username) {
  if (afkTimers[username]) {
    clearInterval(afkTimers[username]);
    delete afkTimers[username];
    //console.log(`${username} için Anti-AFK durduruldu.`);
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
    //console.log(`[${username}] Moving item from ${sourceSlot} to ${destinationSlot}`);
    if (destItem) {
      //console.log(`[${username}] Destination not empty. Swapping items.`);
      // Perform a swap using three clicks
      await bot.clickWindow(sourceSlot, 0, 0);
      await bot.clickWindow(destinationSlot, 0, 0);
      await bot.clickWindow(sourceSlot, 0, 0);
    } else {
      //console.log(`[${username}] Destination empty. Simple move.`);
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
      //console.log(`[${username}] Eşya atıldı: ${item.name} (Slot: ${sourceSlot})`);
    } else {
      //console.log(`[${username}] Eşya atılamadı: Slot ${sourceSlot} boş.`);
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
  
  //console.log(`[${username}] Envanter temizleniyor...`);
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
    //console.log(`[${username}] Aktif hotbar slotu ayarlandı: ${hotbarIndex}`);
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

async function breakBlockAt(username, { x, y, z }) {
    return new Promise(async (resolve, reject) => {
        const bot = bots[username];
        if (!bot) return reject(new Error("Bot bağlı değil."));

        const numX = Math.floor(parseFloat(x));
        const numY = Math.floor(parseFloat(y));
        const numZ = Math.floor(parseFloat(z));

        if (isNaN(numX) || isNaN(numY) || isNaN(numZ)) {
            const msg = `Blok kırmak için geçersiz koordinatlar: X=${x}, Y=${y}, Z=${z}`;
            console.error(`[${username}] ${msg}`);
            if (bot.webContents) {
                bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            }
            return reject(new Error(msg));
        }

        const blockToBreak = bot.blockAt(new Vec3(numX, numY, numZ));

        if (!blockToBreak) {
            const msg = `Kırılacak blok bulunamadı: ${numX}, ${numY}, ${numZ}`;
            //console.log(`[${username}] ${msg}`);
            bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            return reject(new Error(msg));
        }

        try {
            //console.log(`[${username}] ${blockToBreak.name} bloğu kırılıyor...`);
            await bot.dig(blockToBreak);
            //console.log(`[${username}] Blok başarıyla kırıldı.`);
            bot.webContents.send('bot-event', { type: 'info', username, message: `${blockToBreak.name} bloğu kırıldı.` });
            resolve();
        } catch (err) {
            const msg = `Blok kırılamadı: ${err.message}`;
            console.error(`[${username}] ${msg}`);
            bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            reject(err);
        }
    });
}

async function openChestAt(username, { x, y, z }) {
    return new Promise(async (resolve, reject) => {
        const bot = bots[username];
        if (!bot) return reject(new Error("Bot bağlı değil."));

        const numX = Math.floor(parseFloat(x));
        const numY = Math.floor(parseFloat(y));
        const numZ = Math.floor(parseFloat(z));

        if (isNaN(numX) || isNaN(numY) || isNaN(numZ)) {
            return reject(new Error(`Geçersiz sandık koordinatları: ${x},${y},${z}`));
        }

        try {
            const chestBlock = bot.blockAt(new Vec3(numX, numY, numZ));
            if (chestBlock && chestBlock.name === 'chest' || chestBlock.name === 'trapped_chest' || chestBlock.name.endsWith('_chest') || chestBlock.name === 'barrel' || chestBlock.name === 'shulker_box'|| chestBlock.name === 'ender_chest') {
                bot.activeChest = await bot.openChest(chestBlock);
                resolve();
            } else {
                reject(new Error(`Koordinatta sandık bulunamadı: ${numX},${numY},${numZ}`));
            }
        } catch (err) {
            reject(err);
        }
    });
}

async function moveToCoordinates(username, { x, y, z }) {
    return new Promise((resolve, reject) => {
        const bot = bots[username];
        if (!bot || !bot.pathfinder) {
            const msg = `Bot veya pathfinder hareket için uygun değil.`;
            //console.log(`[${username}] ${msg}`);
            if (bot && bot.webContents) {
                bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            }
            return reject(new Error(msg));
        }

        const numX = parseFloat(x);
        const numY = parseFloat(y);
        const numZ = parseFloat(z);

        if (isNaN(numX) || isNaN(numY) || isNaN(numZ)) {
            const msg = `Geçersiz koordinatlar: X=${x}, Y=${y}, Z=${z}`;
            console.error(`[${username}] ${msg}`);
            if (bot.webContents) {
                bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            }
            return reject(new Error(msg));
        }

        const goal = new goals.GoalBlock(numX, numY, numZ);
        bot.pathfinder.setGoal(goal, true);
        //console.log(`[${username}] Koordinatlara gidiliyor: X=${numX}, Y=${numY}, Z=${numZ}`);

        const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            bot.pathfinder.stop();
            reject(new Error('Hedefe ulaşma zaman aşımına uğradı (30s).'));
        }, 30000); // 30 saniye timeout

        const checkInterval = setInterval(() => {
            if (!bot.pathfinder.isMoving()) {
                const botPos = bot.entity.position;
                const distance = botPos.distanceTo(new Vec3(numX, numY, numZ));
                
                // Hedefe yeterince yakınsa (1.5 blok) ve artık hareket etmiyorsa, görevi tamamlanmış say.
                if (distance <= 1.5) {
                    //console.log(`[${username}] Hedefe ulaşıldı (Mesafe: ${distance.toFixed(2)}).`);
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    resolve();
                } else {
                    // Hareket etmiyor ama hedeften uzakta, muhtemelen takıldı.
                    //console.log(`[${username}] Hedefe ulaşılamadı, bot takılmış olabilir (Mesafe: ${distance.toFixed(2)}).`);
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    reject(new Error('Hedefe ulaşılamadı, bot takıldı.'));
                }
            }
        }, 500); // Her 500ms'de bir kontrol et
    });
}

async function withdrawAll(username) {
    const bot = bots[username];
    const chest = bot.activeChest;
    if (!bot || !chest) return;

    //console.log(`[${username}] Sandıktaki tüm eşyalar alınıyor...`);
    
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

    //console.log(`[${username}] Envanterdeki tüm eşyalar sandığa bırakılıyor...`);
    
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
  openChestAt,
  breakBlockAt,
  moveToCoordinates,
  closeWindow,
  depositItem,
  withdrawItem,
  depositAll,
  withdrawAll,
};
