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

  // Add event listeners after ensuring the bot is fully initialized
  bot.on('login', () => {
    console.log(`${bot.username} sunucuya giriş yaptı.`);
    webContents.send('bot-event', { type: 'login', username: bot.username, message: 'Sunucuya giriş yaptı.' });
  });
  bot.on('spawn', () => {
    console.log(`${bot.username} oyuna spawn oldu.`);
    webContents.send('bot-event', { type: 'spawn', username: bot.username, message: 'Oyuna spawn oldu.' });
    webContents.send('bot-event', { type: 'health', username: bot.username, data: { health: bot.health, food: bot.food } });

    // Gelişmiş otomatik komut sistemi
    if (options.autoLoginCommands && options.autoLoginCommands.trim() !== '') {
      const commands = options.autoLoginCommands.split('\n').filter(cmd => cmd.trim() !== '');
      const delay = (options.commandDelay || 5) * 1000;

      commands.forEach((command, index) => {
        setTimeout(() => {
          // Komut göndermeden önce botun hala bağlı olduğundan emin ol
          if (bots[bot.username]) {
            console.log(`'${bot.username}' otomatik komut gönderiyor: ${command}`);
            bot.chat(command);
          }
        }, index * delay);
      });
    }

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

  return bot;
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

module.exports = {
  connectBot,
  startAntiAFK,
  stopAntiAFK,
  disconnectBot,
  sendChatMessage,
  getBot,
  getAllBots,
};
