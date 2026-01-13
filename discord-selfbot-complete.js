const Discord = require('discord.js-selfbot-v13');
const client = new Discord.Client({
  checkUpdate: false,
  ws: { properties: { browser: "Discord Client" }}
});

// ============================================
// CONFIGURATION GLOBALE
// ============================================
const CONFIG = {
  PREFIXES: {
    VOCAL: '!av',
    RPC: '!rpc',
    GENERAL: '!sb'
  },
  AUTOVOC: {
    MUTE: true,
    DEAF: true,
    VIDEO: false,
    CHECK_INTERVAL: 60000, // 60 secondes
    RECONNECT_DELAY: 10000, // 10 secondes
    MAX_ATTEMPTS: 5
  }
};

// ============================================
// VARIABLES D'ÉTAT AUTO-VOCAL
// ============================================
let autoVocState = {
  enabled: false,
  guildId: null,
  channelId: null,
  connection: null,
  checkInterval: null,
  reconnectAttempts: 0
};

// ============================================
// VARIABLES D'ÉTAT RPC
// ============================================
let rpcState = {
  enabled: false,
  status: 'online',
  type: 'PLAYING',
  name: '',
  details: '',
  state: '',
  timestamps: null,
  party: null,
  streamUrl: '',
  applicationId: null,
  largeImageKey: '',
  largeImageText: '',
  smallImageKey: '',
  smallImageText: ''
};

// Base de données d'Application IDs Discord populaires
const DISCORD_APPS = {
  'valorant': '700136079562375258',
  'league': '401518684763586560',
  'minecraft': '406204023935148032',
  'fortnite': '432980957394370572',
  'apex': '438122941302046720',
  'gta5': '382624125287399424',
  'csgo': '379370609741914112',
  'roblox': '363416024800927754',
  'osu': '367827983903490050',
  'spotify': '463151177836658699',
  'vscode': '383226320970055681',
  'youtube': '463097721130188830',
  'twitch': '463097721148841984'
};

// ============================================
// ÉVÉNEMENT: BOT PRÊT
// ============================================
client.on('ready', async () => {
  console.log('╔════════════════════════════════════════╗');
  console.log(`║ ✅ Connecté: ${client.user.tag.padEnd(23)} ║`);
  console.log('╠════════════════════════════════════════╣');
  console.log('║  🎤 Auto-Vocal: !av help               ║');
  console.log('║  🎨 RPC Custom: !rpc help              ║');
  console.log('║  ⚙️  Général: !sb help                  ║');
  console.log('║  📦 Backup : !sb backup                ║');
  console.log('╚════════════════════════════════════════╝');
});

// ============================================
// ÉVÉNEMENT: MESSAGES
// ============================================
client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return;

  try {
    // Router vers le bon gestionnaire de commandes
    if (message.content.startsWith(CONFIG.PREFIXES.VOCAL)) {
      await handleVocalCommands(message);
    } else if (message.content.startsWith(CONFIG.PREFIXES.RPC)) {
      await handleRPCCommands(message);
    } else if (message.content.startsWith(CONFIG.PREFIXES.GENERAL)) {
      await handleGeneralCommands(message);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    await message.edit('❌ Une erreur est survenue').catch(() => {});
    setTimeout(() => message.delete().catch(() => {}), 3000);
  }
});

// ============================================
// GESTIONNAIRE: COMMANDES AUTO-VOCAL
// ============================================
async function handleVocalCommands(message) {
  const args = message.content.slice(CONFIG.PREFIXES.VOCAL.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  switch(cmd) {
    case 'start':
      if (autoVocState.enabled) {
        return reply(message, '⚠️ Auto-vocal déjà actif !');
      }

      const member = message.guild?.members?.cache?.get(client.user.id);
      if (!member?.voice?.channel) {
        return reply(message, '❌ Connectez-vous d\'abord à un vocal !');
      }

      autoVocState.guildId = message.guild.id;
      autoVocState.channelId = member.voice.channelId;
      autoVocState.enabled = true;

      await reply(message, `✅ Auto-vocal activé: **${member.voice.channel.name}**`);
      startAutoVocal();
      break;

    case 'join':
      if (!args[0]) {
        return reply(message, '❌ Usage: `!av join <ID_salon>`');
      }

      const channelId = args[0];
      let channel = null;
      let guild = null;

      // Chercher le salon
      if (message.guild) {
        channel = message.guild.channels.cache.get(channelId);
        if (channel) guild = message.guild;
      }

      if (!channel) {
        for (const g of client.guilds.cache.values()) {
          const c = g.channels.cache.get(channelId);
          if (c) {
            channel = c;
            guild = g;
            break;
          }
        }
      }

      if (!channel) {
        return reply(message, '❌ Salon introuvable !');
      }

      if (channel.type !== 'GUILD_VOICE' && channel.type !== 'GUILD_STAGE_VOICE') {
        return reply(message, '❌ Ce n\'est pas un salon vocal !');
      }

      autoVocState.guildId = guild.id;
      autoVocState.channelId = channelId;
      autoVocState.enabled = true;

      await reply(message, `🔌 Connexion à **${channel.name}**...`, 1000);
      startAutoVocal();
      setTimeout(() => {
        reply(message, `✅ Connecté à **${channel.name}**`);
      }, 3000);
      break;

    case 'stop':
      if (!autoVocState.enabled) {
        return reply(message, '⚠️ Auto-vocal déjà arrêté !');
      }
      stopAutoVocal();
      await reply(message, '🛑 Auto-vocal désactivé');
      break;

    case 'leave':
      if (autoVocState.connection) {
        try {
          autoVocState.connection.disconnect();
          autoVocState.connection = null;
        } catch (e) {}
      }
      
      if (autoVocState.enabled) {
        stopAutoVocal();
        await reply(message, '👋 Déconnecté et auto-vocal désactivé');
      } else {
        await reply(message, '👋 Déconnecté du vocal');
      }
      break;

    case 'mute':
      CONFIG.AUTOVOC.MUTE = !CONFIG.AUTOVOC.MUTE;
      await reply(message, `🔇 Muet: **${CONFIG.AUTOVOC.MUTE ? 'ON' : 'OFF'}**`);
      if (autoVocState.enabled && autoVocState.connection) {
        reconnectVocal();
      }
      break;

    case 'deaf':
      CONFIG.AUTOVOC.DEAF = !CONFIG.AUTOVOC.DEAF;
      await reply(message, `🔇 Sourd: **${CONFIG.AUTOVOC.DEAF ? 'ON' : 'OFF'}**`);
      if (autoVocState.enabled && autoVocState.connection) {
        reconnectVocal();
      }
      break;

    case 'status':
      let status = '**📊 Statut Auto-Vocal**\n\n';
      status += `État: ${autoVocState.enabled ? '✅ Actif' : '❌ Inactif'}\n`;
      status += `Muet: ${CONFIG.AUTOVOC.MUTE ? '✅' : '❌'}\n`;
      status += `Sourd: ${CONFIG.AUTOVOC.DEAF ? '✅' : '❌'}\n`;
      
      if (autoVocState.enabled && autoVocState.guildId && autoVocState.channelId) {
        const g = client.guilds.cache.get(autoVocState.guildId);
        const c = g?.channels?.cache?.get(autoVocState.channelId);
        if (c) {
          status += `\nServeur: **${g.name}**\n`;
          status += `Salon: **${c.name}**`;
        }
      }
      
      await reply(message, status, 10000);
      break;

    case 'help':
      let help = '**📖 Commandes Auto-Vocal**\n\n';
      help += '**Connexion:**\n';
      help += '`!av start` - Démarre depuis vocal actuel\n';
      help += '`!av join <ID>` - Rejoint un vocal par ID\n';
      help += '`!av stop` - Arrête l\'auto-vocal\n';
      help += '`!av leave` - Quitte le vocal\n\n';
      help += '**Paramètres:**\n';
      help += '`!av mute` - Toggle muet\n';
      help += '`!av deaf` - Toggle sourd\n';
      help += '`!av status` - Affiche le statut\n';
      help += '`!av help` - Cette aide';
      
      await reply(message, help, 15000);
      break;

    case 'backup':
      if (!args[0]) {
        return reply(message, '❌ Usage: `!sb backup <server|list|load> [id]`\n\n' +
          '`!sb backup server` - Backup du serveur actuel\n' +
          '`!sb backup list` - Liste des backups\n' +
          '`!sb backup load <id>` - Charger un backup');
      }

      const backupCmd = args[0].toLowerCase();

      if (backupCmd === 'server') {
        if (!message.guild) {
          return reply(message, '❌ Cette commande doit être utilisée dans un serveur');
        }

        await reply(message, '⏳ Création du backup...', 10000);
        
        try {
          const backup = await createGuildBackup(message.guild);
          const backupId = Date.now();
          
          // Sauvegarder dans un fichier
          const fs = require('fs');
          if (!fs.existsSync('./backups')) {
            fs.mkdirSync('./backups');
          }
          
          fs.writeFileSync(
            `./backups/backup-${backupId}.json`,
            JSON.stringify(backup, null, 2)
          );
          
          await reply(message, `✅ Backup créé !\n\nID: \`${backupId}\`\n` +
            `Serveur: **${backup.name}**\n` +
            `Salons: ${backup.channels.length}\n` +
            `Rôles: ${backup.roles.length}\n` +
            `Emojis: ${backup.emojis.length}`, 15000);
        } catch (error) {
          await reply(message, `❌ Erreur: ${error.message}`);
        }
      } else if (backupCmd === 'list') {
        const fs = require('fs');
        if (!fs.existsSync('./backups')) {
          return reply(message, '❌ Aucun backup trouvé');
        }

        const files = fs.readdirSync('./backups').filter(f => f.endsWith('.json'));
        
        if (files.length === 0) {
          return reply(message, '❌ Aucun backup trouvé');
        }

        let list = '**📦 Liste des backups**\n\n';
        files.forEach(file => {
          const backup = JSON.parse(fs.readFileSync(`./backups/${file}`));
          const id = file.replace('backup-', '').replace('.json', '');
          list += `\`${id}\` - **${backup.name}** (${new Date(parseInt(id)).toLocaleString()})\n`;
        });

        await reply(message, list, 20000);
      } else if (backupCmd === 'load') {
        const backupId = args[1];
        if (!backupId) {
          return reply(message, '❌ Usage: `!sb backup load <id>`');
        }

        if (!message.guild) {
          return reply(message, '❌ Cette commande doit être utilisée dans un serveur');
        }

        await reply(message, '⏳ Chargement du backup...', 10000);

        try {
          const fs = require('fs');
          const backupPath = `./backups/backup-${backupId}.json`;
          
          if (!fs.existsSync(backupPath)) {
            return reply(message, '❌ Backup introuvable');
          }

          const backup = JSON.parse(fs.readFileSync(backupPath));
          await loadGuildBackup(message.guild, backup);
          
          await reply(message, `✅ Backup chargé !\n\nServeur restauré: **${backup.name}**`);
        } catch (error) {
          await reply(message, `❌ Erreur: ${error.message}`);
        }
      }
      break;

    default:
      await reply(message, '❌ Commande inconnue. `!av help`');
  }
}

// ============================================
// GESTIONNAIRE: COMMANDES RPC
// ============================================
async function handleRPCCommands(message) {
  const args = message.content.slice(CONFIG.PREFIXES.RPC.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  switch(cmd) {
    case 'set':
      rpcState.name = args.join(' ');
      rpcState.enabled = true;
      await updateRPC();
      await reply(message, `✅ RPC: **${rpcState.name}**`);
      break;

    case 'details':
      rpcState.details = args.join(' ');
      if (rpcState.enabled) await updateRPC();
      await reply(message, `✅ Details: **${rpcState.details}**`);
      break;

    case 'state':
      rpcState.state = args.join(' ');
      if (rpcState.enabled) await updateRPC();
      await reply(message, `✅ State: **${rpcState.state}**`);
      break;

    case 'type':
      const type = args[0]?.toUpperCase();
      const validTypes = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];
      
      if (!validTypes.includes(type)) {
        return reply(message, `❌ Types: ${validTypes.join(', ')}`);
      }

      rpcState.type = type;
      if (rpcState.enabled) await updateRPC();
      await reply(message, `✅ Type: **${type}**`);
      break;

    case 'status':
      const status = args[0]?.toLowerCase();
      const validStatus = ['online', 'idle', 'dnd', 'invisible'];
      
      if (!validStatus.includes(status)) {
        return reply(message, `❌ Status: ${validStatus.join(', ')}`);
      }

      rpcState.status = status;
      await updateRPC();
      
      const emoji = {online: '🟢', idle: '🟡', dnd: '🔴', invisible: '⚫'};
      await reply(message, `${emoji[status]} Status: **${status}**`);
      break;

    case 'timestamp':
      const tsType = args[0]?.toLowerCase();
      
      if (tsType === 'start') {
        rpcState.timestamps = { start: Date.now() };
        await reply(message, '✅ Timestamp démarré');
      } else if (tsType === 'end') {
        const mins = parseInt(args[1]) || 60;
        rpcState.timestamps = { end: Date.now() + (mins * 60000) };
        await reply(message, `✅ Fin dans ${mins} min`);
      } else if (tsType === 'off') {
        rpcState.timestamps = null;
        await reply(message, '✅ Timestamp OFF');
      } else {
        return reply(message, '❌ Usage: `!rpc timestamp start|end <min>|off`');
      }

      if (rpcState.enabled) await updateRPC();
      break;

    case 'party':
      if (args[0]?.toLowerCase() === 'off') {
        rpcState.party = null;
        await reply(message, '✅ Party OFF');
      } else {
        const current = parseInt(args[0]) || 1;
        const max = parseInt(args[1]) || 5;
        rpcState.party = { size: [current, max] };
        await reply(message, `✅ Party: ${current}/${max}`);
      }

      if (rpcState.enabled) await updateRPC();
      break;

    case 'streaming':
      const url = args[0];
      const name = args.slice(1).join(' ');
      
      if (!url || !name) {
        return reply(message, '❌ Usage: `!rpc streaming <url> <nom>`');
      }

      rpcState.type = 'STREAMING';
      rpcState.name = name;
      rpcState.streamUrl = url;
      rpcState.enabled = true;
      await updateRPC();
      await reply(message, `🎥 Stream: **${name}**`);
      break;

    case 'app':
      const appName = args[0]?.toLowerCase();
      
      if (!appName) {
        let list = '**📱 Applications disponibles:**\n\n';
        for (const [name, id] of Object.entries(DISCORD_APPS)) {
          list += `\`${name}\` - ${id}\n`;
        }
        list += '\n**Usage:** `!rpc app <nom>` ou `!rpc app <ID_custom>`';
        return reply(message, list, 15000);
      }

      // Vérifier si c'est un nom d'app connu
      if (DISCORD_APPS[appName]) {
        rpcState.applicationId = DISCORD_APPS[appName];
        await reply(message, `✅ App: **${appName}** (${rpcState.applicationId})`);
      }
      // Ou un ID personnalisé
      else if (/^\d+$/.test(appName)) {
        rpcState.applicationId = appName;
        await reply(message, `✅ App ID: **${appName}**`);
      } else {
        return reply(message, '❌ App inconnue. Utilisez `!rpc app` pour la liste');
      }

      if (rpcState.enabled) await updateRPC();
      break;

    case 'image':
      const imageKey = args[0];
      const imageText = args.slice(1).join(' ');

      if (!imageKey) {
        return reply(message, '❌ Usage: `!rpc image <key> [texte]`\n💡 La key doit correspondre à une asset de votre Application Discord');
      }

      rpcState.largeImageKey = imageKey;
      rpcState.largeImageText = imageText || '';
      
      if (rpcState.enabled) await updateRPC();
      await reply(message, `✅ Image définie: **${imageKey}**`);
      break;

    case 'smallimage':
      const smallKey = args[0];
      const smallText = args.slice(1).join(' ');

      if (!smallKey) {
        return reply(message, '❌ Usage: `!rpc smallimage <key> [texte]`');
      }

      rpcState.smallImageKey = smallKey;
      rpcState.smallImageText = smallText || '';
      
      if (rpcState.enabled) await updateRPC();
      await reply(message, `✅ Petite image: **${smallKey}**`);
      break;

    case 'preset':
      const preset = args[0]?.toLowerCase();
      const presetArgs = args.slice(1);
      await applyRPCPreset(preset, presetArgs);
      await reply(message, `✅ Preset: **${preset}**`);
      break;

    case 'clear':
      rpcState = {
        enabled: false,
        status: 'online',
        type: 'PLAYING',
        name: '',
        details: '',
        state: '',
        timestamps: null,
        party: null,
        streamUrl: '',
        applicationId: null,
        largeImageKey: '',
        largeImageText: '',
        smallImageKey: '',
        smallImageText: ''
      };
      await client.user.setPresence({ activities: [], status: 'online' });
      await reply(message, '🧹 RPC effacé');
      break;

    case 'show':
      let info = '**📊 Configuration RPC**\n\n';
      info += `État: ${rpcState.enabled ? '✅ Actif' : '❌ Inactif'}\n`;
      info += `Status: ${rpcState.status}\n`;
      info += `Type: ${rpcState.type}\n`;
      if (rpcState.name) info += `Nom: ${rpcState.name}\n`;
      if (rpcState.details) info += `Details: ${rpcState.details}\n`;
      if (rpcState.state) info += `State: ${rpcState.state}\n`;
      if (rpcState.applicationId) info += `App ID: ${rpcState.applicationId}\n`;
      if (rpcState.largeImageKey) info += `Grande image: ${rpcState.largeImageKey}\n`;
      if (rpcState.smallImageKey) info += `Petite image: ${rpcState.smallImageKey}\n`;
      if (rpcState.timestamps) info += `Timestamp: ✅\n`;
      if (rpcState.party) info += `Party: ${rpcState.party.size[0]}/${rpcState.party.size[1]}\n`;
      
      await reply(message, info, 10000);
      break;

    case 'help':
      let help = '**🎨 Commandes RPC**\n\n';
      help += '**Base:**\n';
      help += '`!rpc set <texte>` - Définit l\'activité\n';
      help += '`!rpc details <texte>` - Ligne détails\n';
      help += '`!rpc state <texte>` - Ligne état\n';
      help += '`!rpc type <type>` - Type d\'activité\n';
      help += '`!rpc status <status>` - Statut en ligne\n\n';
      help += '**Images:**\n';
      help += '`!rpc app <nom|ID>` - Définit l\'application\n';
      help += '`!rpc image <key> [texte]` - Grande image\n';
      help += '`!rpc smallimage <key> [texte]` - Petite image\n\n';
      help += '**Avancé:**\n';
      help += '`!rpc timestamp start|end|off` - Timer\n';
      help += '`!rpc party <cur> <max>` - Party size\n';
      help += '`!rpc streaming <url> <nom>` - Stream\n';
      help += '`!rpc preset <nom>` - Presets rapides\n\n';
      help += '**Gestion:**\n';
      help += '`!rpc show` - Config actuelle\n';
      help += '`!rpc clear` - Effacer RPC\n\n';
      help += '**Apps:** valorant, league, minecraft, fortnite, apex, gta5, csgo, roblox, osu, spotify, vscode';
      
      await reply(message, help, 20000);
      break;

    default:
      await reply(message, '❌ Commande inconnue. `!rpc help`');
  }
}

// ============================================
// GESTIONNAIRE: COMMANDES GÉNÉRALES
// ============================================
async function handleGeneralCommands(message) {
  const args = message.content.slice(CONFIG.PREFIXES.GENERAL.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  switch(cmd) {
    case 'ping':
      const ping = client.ws.ping;
      await reply(message, `🏓 Pong! Latence: **${ping}ms**`);
      break;

    case 'purge':
      const amount = parseInt(args[0]) || 10;
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const myMessages = messages.filter(m => m.author.id === client.user.id);
      
      let deleted = 0;
      for (const msg of myMessages.values()) {
        if (deleted >= amount) break;
        await msg.delete().catch(() => {});
        deleted++;
        await sleep(1000);
      }
      
      await reply(message, `🗑️ ${deleted} message(s) supprimé(s)`);
      break;

    case 'info':
      let info = '**ℹ️ Informations du Selfbot**\n\n';
      info += `👤 User: ${client.user.tag}\n`;
      info += `🆔 ID: ${client.user.id}\n`;
      info += `🎮 Serveurs: ${client.guilds.cache.size}\n`;
      info += `👥 Amis: ${client.user.friendsCount || 0}\n`;
      info += `🏓 Ping: ${client.ws.ping}ms\n`;
      info += `⏱️ Uptime: ${formatUptime(client.uptime)}\n`;
      info += `\n🎤 Auto-vocal: ${autoVocState.enabled ? '✅' : '❌'}\n`;
      info += `🎨 RPC: ${rpcState.enabled ? '✅' : '❌'}`;
      
      await reply(message, info, 15000);
      break;

    case 'perms':
      if (!message.guild) {
        return reply(message, '❌ Cette commande doit être utilisée dans un serveur');
      }

      const member = message.guild.members.cache.get(client.user.id);
      const perms = member.permissions;

      let permsList = '**🔐 Vos permissions sur ce serveur**\n\n';
      permsList += `Serveur: **${message.guild.name}**\n\n`;
      
      const importantPerms = [
        { name: 'ADMINISTRATOR', label: '👑 Administrateur' },
        { name: 'MANAGE_GUILD', label: '⚙️ Gérer le serveur' },
        { name: 'MANAGE_ROLES', label: '🎭 Gérer les rôles' },
        { name: 'MANAGE_CHANNELS', label: '📁 Gérer les salons' },
        { name: 'MANAGE_MESSAGES', label: '✉️ Gérer les messages' },
        { name: 'KICK_MEMBERS', label: '👢 Expulser des membres' },
        { name: 'BAN_MEMBERS', label: '🔨 Bannir des membres' }
      ];

      importantPerms.forEach(perm => {
        const has = perms.has(perm.name);
        permsList += `${has ? '✅' : '❌'} ${perm.label}\n`;
      });

      permsList += `\n💡 Pour le backup, vous avez besoin de:\n`;
      permsList += `└─ Administrateur OU\n`;
      permsList += `└─ Gérer le serveur + Gérer les rôles + Gérer les salons`;

      await reply(message, permsList, 20000);
      break;

    case 'backup':
      const backupAction = args[0]?.toLowerCase();
      
      if (!backupAction) {
        let backupHelp = '**📦 Commandes Backup**\n\n';
        backupHelp += '`!sb backup create` - Backup du serveur actuel\n';
        backupHelp += '`!sb backup list` - Liste des backups\n';
        backupHelp += '`!sb backup load <id>` - Charger un backup\n';
        backupHelp += '`!sb backup delete <id>` - Supprimer un backup\n\n';
        backupHelp += '⚠️ Le backup restaure la structure complète du serveur';
        return reply(message, backupHelp, 15000);
      }

      if (backupAction === 'create') {
        if (!message.guild) {
          return reply(message, '❌ Cette commande doit être utilisée dans un serveur');
        }

        await reply(message, '⏳ Création du backup en cours...', 20000);
        
        try {
          const backup = await createGuildBackup(message.guild);
          const backupId = Date.now();
          
          const fs = require('fs');
          if (!fs.existsSync('./backups')) {
            fs.mkdirSync('./backups');
          }
          
          fs.writeFileSync(
            `./backups/backup-${backupId}.json`,
            JSON.stringify(backup, null, 2)
          );
          
          await message.edit(`✅ **Backup créé avec succès !**\n\n` +
            `📋 ID: \`${backupId}\`\n` +
            `🏷️ Serveur: **${backup.name}**\n` +
            `📁 Salons: ${backup.channels.length}\n` +
            `🎭 Rôles: ${backup.roles.length}\n` +
            `😀 Emojis: ${backup.emojis.length}\n\n` +
            `💾 Fichier: backup-${backupId}.json`);
          
          setTimeout(() => message.delete().catch(() => {}), 20000);
        } catch (error) {
          console.error('Erreur backup:', error);
          await reply(message, `❌ Erreur lors du backup: ${error.message}`);
        }
        
      } else if (backupAction === 'list') {
        try {
          const fs = require('fs');
          if (!fs.existsSync('./backups')) {
            return reply(message, '❌ Aucun backup trouvé. Créez-en un avec `!sb backup create`');
          }

          const files = fs.readdirSync('./backups').filter(f => f.endsWith('.json'));
          
          if (files.length === 0) {
            return reply(message, '❌ Aucun backup trouvé');
          }

          let list = '**📦 Liste des backups**\n\n';
          files.forEach(file => {
            try {
              const backup = JSON.parse(fs.readFileSync(`./backups/${file}`));
              const id = file.replace('backup-', '').replace('.json', '');
              const date = new Date(parseInt(id));
              list += `\`${id}\`\n`;
              list += `└─ **${backup.name}**\n`;
              list += `└─ 📅 ${date.toLocaleString('fr-FR')}\n`;
              list += `└─ 📊 ${backup.channels.length} salons, ${backup.roles.length} rôles\n\n`;
            } catch (e) {
              console.error('Erreur lecture backup:', e);
            }
          });

          list += `\nUtilisez \`!sb backup load <id>\` pour charger`;

          await reply(message, list, 30000);
        } catch (error) {
          await reply(message, `❌ Erreur: ${error.message}`);
        }
        
      } else if (backupAction === 'load') {
        const backupId = args[1];
        if (!backupId) {
          return reply(message, '❌ Usage: `!sb backup load <id>`\nUtilisez `!sb backup list` pour voir les IDs');
        }

        if (!message.guild) {
          return reply(message, '❌ Cette commande doit être utilisée dans un serveur');
        }

        await reply(message, '⚠️ Chargement du backup en cours...\nCela peut prendre plusieurs minutes.', 60000);

        try {
          const fs = require('fs');
          const backupPath = `./backups/backup-${backupId}.json`;
          
          if (!fs.existsSync(backupPath)) {
            return reply(message, '❌ Backup introuvable. Vérifiez l\'ID avec `!sb backup list`');
          }

          const backup = JSON.parse(fs.readFileSync(backupPath));
          console.log(`Chargement du backup: ${backup.name}`);
          
          await loadGuildBackup(message.guild, backup);
          
          await message.edit(`✅ **Backup chargé avec succès !**\n\n` +
            `🏷️ Serveur restauré: **${backup.name}**\n` +
            `📁 ${backup.channels.length} salons créés\n` +
            `🎭 ${backup.roles.length} rôles créés`);
          
          setTimeout(() => message.delete().catch(() => {}), 15000);
        } catch (error) {
          console.error('Erreur chargement backup:', error);
          await reply(message, `❌ Erreur lors du chargement: ${error.message}`);
        }
        
      } else if (backupAction === 'delete') {
        const backupId = args[1];
        if (!backupId) {
          return reply(message, '❌ Usage: `!sb backup delete <id>`');
        }

        try {
          const fs = require('fs');
          const backupPath = `./backups/backup-${backupId}.json`;
          
          if (!fs.existsSync(backupPath)) {
            return reply(message, '❌ Backup introuvable');
          }

          const backup = JSON.parse(fs.readFileSync(backupPath));
          fs.unlinkSync(backupPath);
          
          await reply(message, `✅ Backup supprimé: **${backup.name}** (${backupId})`);
        } catch (error) {
          await reply(message, `❌ Erreur: ${error.message}`);
        }
        
      } else {
        await reply(message, '❌ Action inconnue. Utilisez `!sb backup` pour voir l\'aide');
      }
      break;

    case 'help':
      let help = '**⚙️ Commandes Générales**\n\n';
      help += '`!sb ping` - Latence du bot\n';
      help += '`!sb purge [nombre]` - Supprime vos messages\n';
      help += '`!sb info` - Infos du selfbot\n';
      help += '`!sb perms` - Vos permissions sur le serveur\n';
      help += '`!sb backup` - Gestion des backups serveur\n';
      help += '`!sb help` - Cette aide\n\n';
      help += '**Modules disponibles:**\n';
      help += '🎤 `!av help` - Auto-vocal\n';
      help += '🎨 `!rpc help` - RPC custom\n';
      help += '📦 `!sb backup` - Backup serveurs';
      
      await reply(message, help, 15000);
      break;

    default:
      await reply(message, '❌ Commande inconnue. `!sb help`');
  }
}

// ============================================
// FONCTIONS AUTO-VOCAL
// ============================================
function startAutoVocal() {
  console.log('🎤 Auto-vocal démarré');
  
  if (autoVocState.checkInterval) {
    clearInterval(autoVocState.checkInterval);
  }
  
  autoVocState.checkInterval = setInterval(checkVocalConnection, CONFIG.AUTOVOC.CHECK_INTERVAL);
  
  setTimeout(connectToVocal, 2000);
}

function stopAutoVocal() {
  autoVocState.enabled = false;
  autoVocState.reconnectAttempts = 0;
  
  if (autoVocState.checkInterval) {
    clearInterval(autoVocState.checkInterval);
    autoVocState.checkInterval = null;
  }
  
  if (autoVocState.connection) {
    try {
      autoVocState.connection.disconnect();
      autoVocState.connection = null;
    } catch (e) {}
  }
  
  console.log('🛑 Auto-vocal arrêté');
}

async function connectToVocal() {
  if (!autoVocState.enabled) return;

  try {
    const guild = client.guilds.cache.get(autoVocState.guildId);
    if (!guild) {
      console.error('❌ Serveur introuvable');
      return;
    }

    const channel = guild.channels.cache.get(autoVocState.channelId);
    if (!channel) {
      console.error('❌ Salon introuvable');
      return;
    }

    console.log(`🔌 Connexion: ${channel.name}`);
    
    if (autoVocState.connection) {
      try {
        autoVocState.connection.disconnect();
        autoVocState.connection = null;
      } catch (e) {}
      await sleep(2000);
    }

    autoVocState.connection = await client.voice.joinChannel(channel, {
      selfMute: CONFIG.AUTOVOC.MUTE,
      selfDeaf: CONFIG.AUTOVOC.DEAF,
      selfVideo: CONFIG.AUTOVOC.VIDEO
    });

    console.log(`✅ Connecté: ${channel.name}`);
    autoVocState.reconnectAttempts = 0;

  } catch (error) {
    console.error('❌ Erreur connexion:', error.message);
    
    if (error.message.includes('not established within')) {
      console.log('⏳ Timeout, attente 30s...');
      await sleep(30000);
    }
    
    await handleVocalReconnect();
  }
}

async function checkVocalConnection() {
  if (!autoVocState.enabled) return;

  try {
    const guild = client.guilds.cache.get(autoVocState.guildId);
    const member = guild?.members?.cache?.get(client.user.id);
    
    if (!member?.voice?.channel || member.voice.channelId !== autoVocState.channelId) {
      console.log('⚠️ Déconnecté, reconnexion dans 10s...');
      await sleep(10000);
      await connectToVocal();
    } else {
      console.log(`✅ Connecté (${new Date().toLocaleTimeString()})`);
    }
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message);
    await sleep(15000);
    await handleVocalReconnect();
  }
}

async function handleVocalReconnect() {
  if (!autoVocState.enabled) return;

  autoVocState.reconnectAttempts++;
  
  if (autoVocState.reconnectAttempts > CONFIG.AUTOVOC.MAX_ATTEMPTS) {
    console.error(`❌ ${CONFIG.AUTOVOC.MAX_ATTEMPTS} tentatives échouées, pause 5 min`);
    autoVocState.reconnectAttempts = 0;
    await sleep(300000);
  }
  
  const delay = Math.min(10000 * autoVocState.reconnectAttempts, 60000);
  console.log(`⏳ Tentative ${autoVocState.reconnectAttempts}/${CONFIG.AUTOVOC.MAX_ATTEMPTS} dans ${delay/1000}s...`);
  
  await sleep(delay);
  await connectToVocal();
}

async function reconnectVocal() {
  if (autoVocState.connection) {
    autoVocState.connection.disconnect();
  }
  await sleep(1000);
  await connectToVocal();
}

// ============================================
// FONCTIONS RPC
// ============================================
async function updateRPC() {
  try {
    if (!rpcState.enabled) {
      await client.user.setPresence({
        status: rpcState.status,
        activities: []
      });
      return;
    }

    const activity = {
      name: rpcState.name || 'Custom Status',
      type: rpcState.type
    };

    // Application ID pour les images
    if (rpcState.applicationId) {
      activity.application_id = rpcState.applicationId;
    }

    if (rpcState.details) activity.details = rpcState.details;
    if (rpcState.state) activity.state = rpcState.state;

    // Assets (images)
    if (rpcState.largeImageKey || rpcState.smallImageKey) {
      activity.assets = {};
      
      if (rpcState.largeImageKey) {
        activity.assets.large_image = rpcState.largeImageKey;
        if (rpcState.largeImageText) {
          activity.assets.large_text = rpcState.largeImageText;
        }
      }
      
      if (rpcState.smallImageKey) {
        activity.assets.small_image = rpcState.smallImageKey;
        if (rpcState.smallImageText) {
          activity.assets.small_text = rpcState.smallImageText;
        }
      }
    }

    if (rpcState.timestamps) {
      activity.timestamps = {};
      if (rpcState.timestamps.start) activity.timestamps.start = rpcState.timestamps.start;
      if (rpcState.timestamps.end) activity.timestamps.end = rpcState.timestamps.end;
    }

    if (rpcState.party) {
      activity.party = { size: rpcState.party.size };
    }

    if (rpcState.type === 'STREAMING' && rpcState.streamUrl) {
      activity.url = rpcState.streamUrl;
    }

    await client.user.setPresence({
      status: rpcState.status,
      activities: [activity]
    });

    console.log('✅ RPC mis à jour');
  } catch (error) {
    console.error('❌ Erreur RPC:', error.message);
  }
}

async function applyRPCPreset(preset, args) {
  rpcState.enabled = true;
  rpcState.timestamps = null;
  rpcState.party = null;
  rpcState.largeImageKey = '';
  rpcState.smallImageKey = '';

  switch(preset) {
    case 'gaming':
      rpcState.type = 'PLAYING';
      rpcState.name = args[0] || 'Un jeu épique';
      rpcState.details = 'En partie compétitive';
      rpcState.state = 'Victoire après victoire';
      rpcState.timestamps = { start: Date.now() };
      break;

    case 'valorant':
      rpcState.type = 'PLAYING';
      rpcState.name = 'VALORANT';
      rpcState.details = 'Ranked Competitive';
      rpcState.state = args[0] || 'Immortal 3 · 350 RR';
      rpcState.timestamps = { start: Date.now() };
      rpcState.party = { size: [3, 5] };
      rpcState.applicationId = DISCORD_APPS.valorant;
      break;

    case 'lol':
    case 'league':
      rpcState.type = 'PLAYING';
      rpcState.name = 'League of Legends';
      rpcState.details = 'Ranked Solo/Duo';
      rpcState.state = args[0] || 'Platinum II';
      rpcState.timestamps = { start: Date.now() };
      rpcState.applicationId = DISCORD_APPS.league;
      break;

    case 'minecraft':
      rpcState.type = 'PLAYING';
      rpcState.name = 'Minecraft';
      rpcState.details = args.join(' ') || 'Mode survie';
      rpcState.state = '⛏️ Minage de diamants';
      rpcState.timestamps = { start: Date.now() };
      rpcState.applicationId = DISCORD_APPS.minecraft;
      break;

    case 'fortnite':
      rpcState.type = 'PLAYING';
      rpcState.name = 'Fortnite';
      rpcState.details = 'Battle Royale';
      rpcState.state = args[0] || 'Top 10 · 5 kills';
      rpcState.timestamps = { start: Date.now() };
      rpcState.party = { size: [2, 4] };
      rpcState.applicationId = DISCORD_APPS.fortnite;
      break;

    case 'apex':
      rpcState.type = 'PLAYING';
      rpcState.name = 'Apex Legends';
      rpcState.details = 'Battle Royale';
      rpcState.state = args[0] || 'Champion Squad';
      rpcState.timestamps = { start: Date.now() };
      rpcState.party = { size: [3, 3] };
      rpcState.applicationId = DISCORD_APPS.apex;
      break;

    case 'csgo':
      rpcState.type = 'PLAYING';
      rpcState.name = 'Counter-Strike: Global Offensive';
      rpcState.details = 'Competitive Match';
      rpcState.state = args[0] || 'Global Elite';
      rpcState.timestamps = { start: Date.now() };
      rpcState.applicationId = DISCORD_APPS.csgo;
      break;

    case 'coding':
      rpcState.type = 'PLAYING';
      rpcState.name = 'Visual Studio Code';
      rpcState.details = args[0] || 'Développement en cours';
      rpcState.state = '🔥 Code de qualité';
      rpcState.timestamps = { start: Date.now() };
      rpcState.applicationId = DISCORD_APPS.vscode;
      break;

    case 'music':
    case 'spotify':
      rpcState.type = 'LISTENING';
      rpcState.name = args.join(' ') || 'Spotify';
      rpcState.details = '🎵 Ma playlist préférée';
      rpcState.state = 'Vibes musicales';
      rpcState.applicationId = DISCORD_APPS.spotify;
      break;

    case 'netflix':
      rpcState.type = 'WATCHING';
      rpcState.name = args.join(' ') || 'Netflix';
      rpcState.details = '🍿 Binge watching';
      rpcState.state = 'Saison en cours';
      break;

    case 'youtube':
      rpcState.type = 'WATCHING';
      rpcState.name = 'YouTube';
      rpcState.details = args.join(' ') || 'Vidéos intéressantes';
      rpcState.state = '📺 En visionnage';
      rpcState.applicationId = DISCORD_APPS.youtube;
      break;

    case 'twitch':
      rpcState.type = 'WATCHING';
      rpcState.name = 'Twitch';
      rpcState.details = args.join(' ') || 'Live streaming';
      rpcState.state = '🎮 Watching streams';
      rpcState.applicationId = DISCORD_APPS.twitch;
      break;

    default:
      rpcState.type = 'PLAYING';
      rpcState.name = 'Discord';
      rpcState.details = 'Custom Status';
      rpcState.applicationId = null;
  }

  await updateRPC();
}

// ============================================
// ÉVÉNEMENT: CHANGEMENT VOCAL
// ============================================
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!autoVocState.enabled || newState.id !== client.user.id) return;
  
  if (oldState.channel && !newState.channel) {
    console.log('⚠️ Déconnecté, reconnexion dans 10s...');
    await sleep(10000);
    connectToVocal();
  }
  
  if (newState.channel && newState.channelId !== autoVocState.channelId) {
    console.log('⚠️ Déplacé, retour dans 5s...');
    await sleep(5000);
    connectToVocal();
  }
});

// ============================================
// GESTION DES ERREURS
// ============================================
client.on('error', (error) => {
  console.error('❌ Erreur client:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du selfbot...');
  stopAutoVocal();
  if (rpcState.enabled) {
    await client.user.setPresence({ activities: [] });
  }
  client.destroy();
  process.exit(0);
});

// ============================================
// FONCTIONS UTILITAIRES
// ============================================
async function reply(message, content, deleteAfter = 3000) {
  try {
    await message.edit(content);
    if (deleteAfter > 0) {
      setTimeout(() => message.delete().catch(() => {}), deleteAfter);
    }
  } catch (error) {
    console.error('Erreur reply:', error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ============================================
// FONCTIONS BACKUP SERVEUR
// ============================================
async function createGuildBackup(guild) {
  console.log('📦 Création du backup...');
  
  const backup = {
    name: guild.name,
    icon: guild.iconURL({ dynamic: true, size: 1024 }),
    banner: guild.bannerURL({ dynamic: true, size: 1024 }),
    description: guild.description,
    verificationLevel: guild.verificationLevel,
    explicitContentFilter: guild.explicitContentFilter,
    defaultMessageNotifications: guild.defaultMessageNotifications,
    afkTimeout: guild.afkTimeout,
    roles: [],
    channels: [],
    emojis: [],
    createdAt: Date.now()
  };

  // Backup des rôles
  console.log('📝 Backup des rôles...');
  guild.roles.cache
    .sort((a, b) => b.position - a.position)
    .forEach(role => {
      if (role.name !== '@everyone') {
        backup.roles.push({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          permissions: role.permissions.bitfield.toString(),
          mentionable: role.mentionable,
          position: role.position
        });
      }
    });

  // Backup des salons
  console.log('📝 Backup des salons...');
  guild.channels.cache
    .sort((a, b) => a.position - b.position)
    .forEach(channel => {
      const channelData = {
        name: channel.name,
        type: channel.type,
        position: channel.position,
        topic: channel.topic,
        nsfw: channel.nsfw,
        rateLimitPerUser: channel.rateLimitPerUser,
        parent: channel.parent?.name || null
      };

      if (channel.type === 'GUILD_VOICE') {
        channelData.bitrate = channel.bitrate;
        channelData.userLimit = channel.userLimit;
      }

      backup.channels.push(channelData);
    });

  // Backup des emojis
  console.log('📝 Backup des emojis...');
  guild.emojis.cache.forEach(emoji => {
    backup.emojis.push({
      name: emoji.name,
      url: emoji.url,
      animated: emoji.animated
    });
  });

  console.log('✅ Backup créé');
  return backup;
}

async function loadGuildBackup(guild, backup) {
  console.log('📦 Chargement du backup...');

  // Supprimer les salons existants
  console.log('🗑️ Suppression des salons...');
  for (const channel of guild.channels.cache.values()) {
    try {
      await channel.delete();
      await sleep(1000);
    } catch (e) {}
  }

  // Supprimer les rôles existants
  console.log('🗑️ Suppression des rôles...');
  for (const role of guild.roles.cache.values()) {
    if (role.name !== '@everyone' && !role.managed) {
      try {
        await role.delete();
        await sleep(1000);
      } catch (e) {}
    }
  }

  // Modifier le serveur
  console.log('⚙️ Configuration du serveur...');
  try {
    await guild.edit({
      name: backup.name,
      verificationLevel: backup.verificationLevel,
      explicitContentFilter: backup.explicitContentFilter,
      defaultMessageNotifications: backup.defaultMessageNotifications,
      afkTimeout: backup.afkTimeout
    });
  } catch (e) {
    console.error('Erreur config serveur:', e.message);
  }

  // Créer les rôles
  console.log('📝 Création des rôles...');
  const roleMap = new Map();
  for (const roleData of backup.roles) {
    try {
      const role = await guild.roles.create({
        name: roleData.name,
        color: roleData.color,
        hoist: roleData.hoist,
        permissions: roleData.permissions,
        mentionable: roleData.mentionable
      });
      roleMap.set(roleData.name, role);
      await sleep(1000);
    } catch (e) {
      console.error(`Erreur création rôle ${roleData.name}:`, e.message);
    }
  }

  // Créer les catégories
  console.log('📝 Création des catégories...');
  const categoryMap = new Map();
  for (const channelData of backup.channels) {
    if (channelData.type === 'GUILD_CATEGORY') {
      try {
        const category = await guild.channels.create(channelData.name, {
          type: 'GUILD_CATEGORY',
          position: channelData.position
        });
        categoryMap.set(channelData.name, category);
        await sleep(1000);
      } catch (e) {
        console.error(`Erreur création catégorie ${channelData.name}:`, e.message);
      }
    }
  }

  // Créer les salons
  console.log('📝 Création des salons...');
  for (const channelData of backup.channels) {
    if (channelData.type !== 'GUILD_CATEGORY') {
      try {
        const options = {
          type: channelData.type,
          topic: channelData.topic,
          nsfw: channelData.nsfw,
          rateLimitPerUser: channelData.rateLimitPerUser,
          position: channelData.position,
          parent: channelData.parent ? categoryMap.get(channelData.parent) : null
        };

        if (channelData.type === 'GUILD_VOICE') {
          options.bitrate = channelData.bitrate;
          options.userLimit = channelData.userLimit;
        }

        await guild.channels.create(channelData.name, options);
        await sleep(1000);
      } catch (e) {
        console.error(`Erreur création salon ${channelData.name}:`, e.message);
      }
    }
  }

  // Créer les emojis
  console.log('📝 Création des emojis...');
  for (const emojiData of backup.emojis) {
    try {
      await guild.emojis.create(emojiData.url, emojiData.name);
      await sleep(2000);
    } catch (e) {
      console.error(`Erreur création emoji ${emojiData.name}:`, e.message);
    }
  }

  console.log('✅ Backup chargé');
}


// ============================================
const TOKEN = process.env.DISCORD_TOKEN || '';

if (TOKEN === 'Supprimez ce message pas besoin du token ici laissez vide') {
  console.error('❌ ERREUR: Token Discord non configuré !');
  console.error('Modifiez le code ou définissez DISCORD_TOKEN dans les variables d\'environnement.');
  process.exit(1);
}

client.login(TOKEN).catch(error => {
  console.error('❌ Erreur de connexion:', error.message);
  console.error('Vérifiez que votre token est valide.');
  process.exit(1);
});
