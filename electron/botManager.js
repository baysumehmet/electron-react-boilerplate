// electron/botManager.js
const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { SocksClient } = require('socks');

// Prevent memory leaks and state loss during hot-reloads in development
if (!global.managedBots) {
  global.managedBots = {};
}
const bots = global.managedBots;

if (!global.manuallyDisconnectedBots) {
  global.manuallyDisconnectedBots = new Set();
}
const manuallyDisconnectedBots = global.manuallyDisconnectedBots;

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

  let connectOptions = {
    host: host,
    port: parseInt(port),
    username: options.username,
    auth: options.auth || 'offline',
    version: options.version || 'auto',
    checkTimeoutInterval: 60 * 1000,
  };

  if (options.proxy && options.proxy.host && options.proxy.port) {
    const { type, host: proxyHost, port: proxyPort, username: proxyUsername, password: proxyPassword } = options.proxy;

    if (type === 'SOCKS5') {
      console.log(`[${options.username}] Connecting via SOCKS5 proxy: ${proxyHost}:${proxyPort}`);
      connectOptions.connect = (client) => {
        SocksClient.createConnection({
          proxy: {
            host: proxyHost,
            port: parseInt(proxyPort),
            type: 5, // SOCKS5
            userId: proxyUsername,
            password: proxyPassword,
          },
          command: 'connect',
          destination: {
            host: host,
            port: parseInt(port),
          },
        }).then(info => {
          client.setSocket(info.socket);
          client.emit('connect');
        }).catch(err => {
          console.error(`[${options.username}] SOCKS Proxy Error:`, err);
          webContents.send('bot-event', { type: 'error', username: options.username, message: `SOCKS Proxy Hatası: ${err.message}` });
        });
      };
    } else if (type === 'HTTP') {
      console.log(`[${options.username}] Connecting via HTTP proxy: ${proxyHost}:${proxyPort}`);
      // Note: HTTP proxy support for raw TCP is complex and often requires a CONNECT request.
      // This is a simplified example and might not work with all HTTP proxies.
      connectOptions.connect = (client) => {
        const proxyOptions = {
            method: 'CONNECT',
            host: proxyHost,
            port: proxyPort,
            path: `${host}:${port}`,
            headers: { 'Host': `${host}:${port}` }
        };
        if (proxyUsername && proxyPassword) {
            proxyOptions.headers = proxyOptions.headers || {};
            proxyOptions.headers['Proxy-Authorization'] = 'Basic ' + Buffer.from(`${proxyUsername}:${proxyPassword}`).toString('base64');
        }

        const req = require('http').request(proxyOptions);
        req.on('connect', (res, socket, head) => {
            if (res.statusCode === 200) {
                client.setSocket(socket);
                client.emit('connect');
            } else {
                client.emit('error', new Error(`Proxy connection failed: ${res.statusCode}`));
            }
        });
        req.on('error', (err) => {
            client.emit('error', err);
        });
        req.end();
      };
    }
  }


  // Log the connection options to prove the version is being used
  console.log(`[${options.username}] Connecting with options:`, {
    ...connectOptions,
    agent: connectOptions.agent ? '[Proxy Agent]' : 'none' // Don't log the entire agent object
  });

  let bot;
  try {
    // Create the bot instance directly
    bot = mineflayer.createBot(connectOptions);
  } catch (error) {
    console.error(`[${options.username}] Error creating bot:`, error);
    webContents.send('bot-event', { type: 'error', username: options.username, message: `Bot oluşturulurken hata: ${error.message}` });
    return;
  }

  // Hata Kontrolü: mineflayer.createBot başarısız olursa, bot tanımsız olabilir.
  if (!bot) {
    const errorMessage = `Bot oluşturulamadı: ${options.username}. Lütfen bağlantı ayarlarını kontrol edin (host, port, username).`;
    console.error(errorMessage);
    webContents.send('bot-event', { type: 'error', username: options.username, message: errorMessage });
    return;
  }
  
  bot.isDisconnecting = false; // Prevent multiple disconnect events

  // Store original options and webContents for reconnecting
  bot.originalOptions = options;
  bot.webContents = webContents;

  // Assign the bot instance to the bots object
  bots[options.username] = bot;

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
        { regex: /^\|d\|\s+(.+?)\s+>>\s+(.*)/ },
        // Ranked, angle brackets: [Admin] <Steve> hi
        { regex: /^\[[^\]]+\] <(.+?)> (.*)/ },
        // Simple angle brackets: <Steve> hi
        { regex: /^<(.+?)> (.*)/ },
        // Ranked, colon: [Mod] Notch: hi
        { regex: /^\['[^\\\]]+\'] ([\w\d_]{3,16}): (.*)/ },
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

  const handleDisconnect = (reason) => {
    if (bot.isDisconnecting) return;
    bot.isDisconnecting = true;

    const botUsername = options.username; // Use username from options for reliability
    console.log(`${botUsername} bağlantısı sonlandı. Sebep: ${reason}`);
    
    // Clean up the old bot instance
    if (bots[botUsername]) {
      bots[botUsername].removeAllListeners();
      delete bots[botUsername];
    }
    
    // Send disconnection event to UI
    webContents.send('bot-event', { type: 'end', username: botUsername, message: `Bağlantı sonlandı. Sebep: ${reason}` });
    
    // Check if this was a manual disconnect, if so, do not reconnect.
    if (manuallyDisconnectedBots.has(botUsername)) {
        manuallyDisconnectedBots.delete(botUsername); // Clean up the set
        console.log(`[handleDisconnect] ${botUsername} için yeniden bağlanma atlandı (manuel durdurma).`);
        return; // Exit before the reconnect logic
    }

    // Attempt to reconnect if enabled
    if (options.autoReconnect) {
      const reconnectDelay = 5000; // 5 seconds
      console.log(`${botUsername} için yeniden bağlanma denemesi ${reconnectDelay / 1000} saniye içinde yapılacak...`);
      webContents.send('bot-event', { type: 'reconnecting', username: botUsername, message: `Yeniden bağlanılıyor... (${reconnectDelay / 1000}s)` });
      
      setTimeout(() => {
        if (!bots[botUsername]) { // Double-check bot doesn't exist before reconnecting
            console.log(`${botUsername} yeniden bağlanıyor...`);
            connectBot(options, webContents); // Use original options from closure
        } else {
            console.log(`${botUsername} için yeniden bağlanma iptal edildi, bot zaten mevcut.`);
        }
      }, reconnectDelay);
    } else {
        console.log(`[handleDisconnect] ${botUsername} için yeniden bağlanma devre dışı.`);
    }
  };

  bot.on('error', (err) => {
    console.error(`${bot.username} bir hatayla karşılaştı:`, err);
    handleDisconnect(`Hata: ${err.message}`);
  });

  bot.on('end', (reason) => {
    handleDisconnect(reason);
  });

  bot.on('kicked', (reason, loggedIn) => {
     handleDisconnect(`Sunucudan atıldı: ${reason}`);
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
        const containerNames = Object.keys(bot.registry.blocksByName).filter(name =>
            name.includes('chest') || name.includes('shulker_box') || name === 'barrel'
        );
        const containerIds = containerNames.map(name => bot.registry.blocksByName[name].id);

        const containerBlock = bot.findBlock({ matching: containerIds, maxDistance: 16 });

        if (containerBlock) {
            bot.activeChest = await bot.openContainer(containerBlock);
        } else {
            const msg = 'Yakında açılabilir konteyner (sandık, varil, vb.) bulunamadı.';
            bot.webContents.send('bot-event', { type: 'info', username, message: msg });
        }
    } catch (err) {
        const errorMessage = `Konteyner açılamadı: ${err.message}`;
        bot.webContents.send('bot-event', { type: 'error', username, message: errorMessage });
    }
}


function startAntiAFK(username, intervalSeconds = 15) {
  const bot = bots[username];
  if (!bot) return;

  if (afkTimers[username]) {
    clearInterval(afkTimers[username]);
  }
  
  afkTimers[username] = setInterval(() => {
    if (bot && bot.entity) {
      bot.controlState.jump = true;
      setTimeout(() => {
        if(bot) bot.controlState.jump = false;
      }, 200);
    }
  }, intervalSeconds * 1000);
}

function stopAntiAFK(username) {
  if (afkTimers[username]) {
    clearInterval(afkTimers[username]);
    delete afkTimers[username];
  }
}

function disconnectBot(username, isManual = false) {
  const bot = bots[username];
  if (bot) {
    if (isManual) {
      manuallyDisconnectedBots.add(username);
    }
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
  if (!bot || !bot.inventory) {
    return { slots: Array(46).fill(null), version: null };
  }
  return { slots: bot.inventory.slots, version: bot.version };
}

async function moveItem({ username, sourceSlot, destinationSlot }) {
  const bot = bots[username];
  if (!bot) return;

  const window = bot.currentWindow || bot.inventory;
  const sourceItem = window.slots[sourceSlot];
  const destItem = window.slots[destinationSlot];

  if (!sourceItem) return;

  try {
    if (destItem) {
      await bot.clickWindow(sourceSlot, 0, 0);
      await bot.clickWindow(destinationSlot, 0, 0);
      await bot.clickWindow(sourceSlot, 0, 0);
    } else {
      await bot.clickWindow(sourceSlot, 0, 0);
      await bot.clickWindow(destinationSlot, 0, 0);
    }
  } catch (err) {
    const errorMessage = `Eşya taşınamadı: ${err.message}`;
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
    }
  } catch (err) {
    const errorMessage = `Eşya atılamadı: ${err.message}`;
    if (bot.webContents) {
      bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
    }
  }
}

async function clearInventory(username) {
  const bot = bots[username];
  if (!bot) return;
  
  const itemsToToss = bot.inventory.items();
  
  for (const item of itemsToToss) {
    try {
      await bot.tossStack(item);
      await new Promise(resolve => setTimeout(resolve, 50)); 
    } catch (err) {
      const errorMessage = `Envanter temizlenirken hata: ${item.name} atılamadı: ${err.message}`;
      if (bot.webContents) {
        bot.webContents.send('bot-event', { type: 'inventory-error', username, message: errorMessage });
      }
      break; 
    }
  }
}

function setActiveHotbar({ username, slot }) {
  const bot = bots[username];
  if (!bot) return;

  if (slot >= 36 && slot <= 44) {
    const hotbarIndex = slot - 36;
    bot.setQuickBarSlot(hotbarIndex);
  }
}

function closeWindow(username) {
  const bot = bots[username];
  if (!bot || !bot.currentWindow) return;
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
            if (bot.webContents) {
                bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            }
            return reject(new Error(msg));
        }

        const blockToBreak = bot.blockAt(new Vec3(numX, numY, numZ));

        if (!blockToBreak) {
            const msg = `Kırılacak blok bulunamadı: ${numX}, ${numY}, ${numZ}`;
            bot.webContents.send('bot-event', { type: 'info', username, message: msg });
            return reject(new Error(msg));
        }

        try {
            await bot.dig(blockToBreak);
            bot.webContents.send('bot-event', { type: 'info', username, message: `${blockToBreak.name} bloğu kırıldı.` });
            resolve();
        } catch (err) {
            const msg = `Blok kırılamadı: ${err.message}`;
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
            const msg = `Geçersiz sandık koordinatları: ${x},${y},${z}`;
            bot.webContents.send('bot-event', { type: 'error', username, message: msg });
            return reject(new Error(msg));
        }

        try {
            const chestBlock = bot.blockAt(new Vec3(numX, numY, numZ));
            if (chestBlock && (chestBlock.name === 'chest' || chestBlock.name === 'trapped_chest' || chestBlock.name.endsWith('_chest') || chestBlock.name === 'barrel' || chestBlock.name === 'shulker_box'|| chestBlock.name === 'ender_chest')) {
                bot.activeChest = await bot.openContainer(chestBlock);
                resolve();
            } else {
                const msg = `Koordinatta sandık bulunamadı: ${numX},${numY},${numZ}`;
                bot.webContents.send('bot-event', { type: 'info', username, message: msg });
                reject(new Error(msg));
            }
        } catch (err) {
            bot.webContents.send('bot-event', { type: 'error', username, message: `Sandık açılamadı: ${err.message}` });
            reject(err);
        }
    });
}

async function moveToCoordinates(username, { x, y, z }) {
    return new Promise((resolve, reject) => {
        const bot = bots[username];
        if (!bot || !bot.pathfinder) {
            const msg = `Bot veya pathfinder hareket için uygun değil.`;
            if (bot && bot.webContents) {
                bot.webContents.send('bot-event', { type: 'info', username, message: msg });
            }
            return reject(new Error(msg));
        }

        const numX = parseFloat(x);
        const numY = parseFloat(y);
        const numZ = parseFloat(z);

        if (isNaN(numX) || isNaN(numY) || isNaN(numZ)) {
            const msg = `Geçersiz koordinatlar: X=${x}, Y=${y}, Z=${z}`;
            if (bot.webContents) {
                bot.webContents.send('bot-event', { type: 'info', username, message: msg });
            }
            return reject(new Error(msg));
        }

        const goal = new goals.GoalBlock(numX, numY, numZ);
        bot.pathfinder.setGoal(goal, true);

        const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            bot.pathfinder.stop();
            const msg = 'Hedefe ulaşma zaman aşımına uğradı (30s).';
            bot.webContents.send('bot-event', { type: 'info', username, message: msg });
            reject(new Error(msg));
        }, 30000);

        const checkInterval = setInterval(() => {
            if (!bot.pathfinder.isMoving()) {
                const botPos = bot.entity.position;
                const distance = botPos.distanceTo(new Vec3(numX, numY, numZ));
                
                if (distance <= 1.5) {
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    resolve();
                } else {
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    const msg = 'Hedefe ulaşılamadı, bot takıldı.';
                    bot.webContents.send('bot-event', { type: 'info', username, message: msg });
                    reject(new Error(msg));
                }
            }
        }, 500);
    });
}

async function withdrawAll(username, options = {}) {
    const bot = bots[username];
    if (!bot) return;

    let chest = bot.activeChest;
    if (!chest) {
        bot.webContents.send('bot-event', { type: 'info', username, message: 'Yakındaki sandık aranıyor...' });
        await openNearestChest(username);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pencerenin açılması için bekleme süresini artırdık
        chest = bot.activeChest;
        if (!chest) {
            // openNearestChest zaten hata mesajı gönderir.
            return;
        }
    }

    const itemsToWithdraw = chest.containerItems();
    if (itemsToWithdraw.length === 0) {
        bot.webContents.send('bot-event', { type: 'info', username, message: 'Sandıkta çekilecek eşya yok.' });
        return;
    }

    for (const item of itemsToWithdraw) {
        try {
            await bot.withdraw(chest, item.type, null, item.count);
            await new Promise(resolve => setTimeout(resolve, 100)); // Gecikmeyi artırdık
        } catch (err) {
            const msg = `Eşya çekilemedi: ${item.name}. Muhtemelen envanter dolu.`;
            bot.webContents.send('bot-event', { type: 'inventory-error', username, message: msg });
            break;
        }
    }
}

async function depositAll(username, options = {}) {
    const bot = bots[username];
    if (!bot) return;

    let chest = bot.activeChest;
    if (!chest) {
        bot.webContents.send('bot-event', { type: 'info', username, message: 'Yakındaki sandık aranıyor...' });
        await openNearestChest(username);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pencerenin açılması için bekleme süresini artırdık
        chest = bot.activeChest;
        if (!chest) {
            // openNearestChest zaten hata mesajı gönderir.
            return;
        }
    }

    // Sadece ana envanterdeki eşyaları bırak (zırh ve sol el hariç)
    const itemsToDeposit = bot.inventory.items().filter(item => item.slot >= bot.inventory.inventoryStart);
    if (itemsToDeposit.length === 0) {
        bot.webContents.send('bot-event', { type: 'info', username, message: 'Bırakılacak eşya yok.' });
        return;
    }

    for (const item of itemsToDeposit) {
        try {
            await bot.deposit(chest, item.type, null, item.count);
            await new Promise(resolve => setTimeout(resolve, 100)); // Gecikmeyi artırdık
        } catch (err) {
            const msg = `Eşya bırakılamadı: ${item.name}. Muhtemelen sandık dolu.`;
            bot.webContents.send('bot-event', { type: 'inventory-error', username, message: msg });
            break;
        }
    }
}

async function depositToChest(username, options = {}) {
    const bot = bots[username];
    if (!bot) return;

    const { excludedItems: excludedItemsCSV } = options;

    try {
        let chest = bot.activeChest;

        // If no chest is open, try to open the nearest one.
        if (!chest) {
            bot.webContents.send('bot-event', { type: 'info', username, message: 'Yakındaki sandık aranıyor...' });
            await openNearestChest(username);
            // After openNearestChest, bot.activeChest should be set.
            // Re-check after a delay to allow window to open
            await new Promise(resolve => setTimeout(resolve, 500));
            chest = bot.activeChest;
            if (!chest) {
                // If it's still null, openNearestChest failed.
                // The error is already sent by openNearestChest, so just return.
                return;
            }
             // Add a small delay to ensure the window is fully open
            await new Promise(resolve => setTimeout(resolve, 500));
            chest = bot.activeChest; // Re-assign in case it changed
        }
        
        const excludedItems = new Set(
            (excludedItemsCSV || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean)
        );

        // We only care about the main inventory, not armor or off-hand
        const itemsToDeposit = bot.inventory.items().filter(item => item.slot >= bot.inventory.inventoryStart);

        for (const item of itemsToDeposit) {
            if (item && !excludedItems.has(item.name.toLowerCase())) {
                try {
                    // Use bot.deposit for better reliability
                    await bot.deposit(chest, item.type, null, item.count);
                    await new Promise(resolve => setTimeout(resolve, 100)); // Delay to prevent issues
                } catch (err) {
                    // It might fail if the chest is full.
                    const msg = `Eşya bırakılamadı: ${item.name}. Muhtemelen sandık dolu.`;
                    bot.webContents.send('bot-event', { type: 'inventory-error', username, message: msg });
                    // Stop trying to deposit if one fails (likely chest is full)
                    break;
                }
            }
        }
    } catch (err) {
        const errorMessage = `Eşya bırakma sırasında bir hata oluştu: ${err.message}`;
        if (bot.webContents) {
            bot.webContents.send('bot-event', { type: 'error', username, message: errorMessage });
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
  depositToChest,
};