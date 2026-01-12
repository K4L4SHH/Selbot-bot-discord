# 🤖 Discord Selfbot (Encore en dev des erreur son possible si possible me dire en mp vos erreur pr fix)

``Si besoin de plus d aide mp k4l4sh__ ``

> ⚠️ **ATTENTION** : L'utilisation de selfbots viole les [Conditions d'utilisation de Discord](https://discord.com/terms) et peut entraîner le **bannissement permanent** de votre compte. Utilisez à vos risques et périls.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Commandes](#-commandes)
- [Exemples](#-exemples)
- [FAQ](#-faq)
- [Avertissements](#-avertissements)

---

## ✨ Fonctionnalités

### 🎤 Auto-Vocal
- ✅ Connexion automatique 24/7 à un salon vocal
- ✅ Reconnexion automatique en cas de déconnexion
- ✅ Retour automatique si déplacé vers un autre salon
- ✅ Mode muet et sourd configurable
- ✅ Gestion intelligente des erreurs

### 🎨 Rich Presence (RPC) Custom
- ✅ RPC entièrement personnalisable
- ✅ Support des images avec Application IDs Discord
- ✅ Presets rapides pour jeux populaires
- ✅ Timestamps (temps écoulé/restant)
- ✅ Party size (X/Y joueurs)
- ✅ Mode streaming Twitch/YouTube
- ✅ Changement de statut (online, idle, dnd, invisible)

### ⚙️ Outils Généraux
- ✅ Purge de messages
- ✅ Informations détaillées du selfbot
- ✅ Ping et latence
- ✅ Interface claire et intuitive

---

## 🚀 Installation

### Prérequis
- [Node.js](https://nodejs.org/) version 16 ou supérieure
- Un compte Discord (avec token)

### Étapes

1. **Cloner ou télécharger le projet**
```bash
git clone https://github.com/votre-repo/discord-selfbot.git
cd discord-selfbot
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer le token** (voir section suivante)

4. **Lancer le selfbot**
```bash
node selfbot.js
```

---

## 🔧 Configuration

### Obtenir votre token Discord

1. Ouvrez Discord dans votre navigateur (web.discord.com)
2. Appuyez sur `F12` pour ouvrir les outils développeur
3. Allez dans l'onglet `Console`
4. Collez ce code :
```javascript
(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
```
5. Copiez le token (sans les guillemets)

### Configurer le token dans le selfbot

**Méthode 1 : Dans le code**
```javascript
const TOKEN = 'VOTRE_TOKEN_ICI';
```

**Méthode 2 : Variable d'environnement (recommandé)**
```bash
export DISCORD_TOKEN="votre_token_ici"
node selfbot.js
```

**Méthode 3 : Fichier .env**
```bash
# Créer un fichier .env
echo "DISCORD_TOKEN=votre_token_ici" > .env

# Installer dotenv
npm install dotenv

# Ajouter en haut du fichier selfbot.js
require('dotenv').config();
```

### Personnaliser les préfixes

Dans le code, modifiez :
```javascript
const CONFIG = {
  PREFIXES: {
    VOCAL: '!av',      // Commandes auto-vocal
    RPC: '!rpc',       // Commandes RPC
    GENERAL: '!sb'     // Commandes générales
  }
};
```

---

## 📖 Utilisation

### Démarrage rapide

1. **Lancer le selfbot**
```bash
node selfbot.js
```

2. **Activer l'auto-vocal**
```
!av start
```

3. **Définir un RPC**
```
!rpc preset valorant
```

---

## 🎮 Commandes

### 🎤 Auto-Vocal (`!av`)

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!av start` | Démarre l'auto-vocal depuis votre salon actuel | `!av start` |
| `!av join <ID>` | Rejoint un salon vocal par son ID | `!av join 123456789` |
| `!av stop` | Arrête l'auto-vocal (reste connecté) | `!av stop` |
| `!av leave` | Quitte le vocal complètement | `!av leave` |
| `!av mute` | Toggle le mode muet | `!av mute` |
| `!av deaf` | Toggle le mode sourd | `!av deaf` |
| `!av status` | Affiche le statut de l'auto-vocal | `!av status` |
| `!av help` | Affiche l'aide auto-vocal | `!av help` |

### 🎨 RPC Custom (`!rpc`)

#### Commandes de base

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!rpc set <texte>` | Définit le nom de l'activité | `!rpc set VALORANT` |
| `!rpc details <texte>` | Définit la ligne de détails | `!rpc details Ranked Competitive` |
| `!rpc state <texte>` | Définit la ligne d'état | `!rpc state Immortal 3` |
| `!rpc type <type>` | Change le type d'activité | `!rpc type PLAYING` |
| `!rpc status <status>` | Change le statut en ligne | `!rpc status dnd` |

**Types disponibles :** `PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING`  
**Status disponibles :** `online`, `idle`, `dnd`, `invisible`

#### Images

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!rpc app` | Liste les applications disponibles | `!rpc app` |
| `!rpc app <nom\|ID>` | Définit l'application | `!rpc app valorant` |
| `!rpc image <key> [texte]` | Définit la grande image | `!rpc image logo Mon jeu` |
| `!rpc smallimage <key> [texte]` | Définit la petite image | `!rpc smallimage icon` |

#### Fonctionnalités avancées

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!rpc timestamp start` | Démarre un chronomètre | `!rpc timestamp start` |
| `!rpc timestamp end <min>` | Définit un compte à rebours | `!rpc timestamp end 60` |
| `!rpc timestamp off` | Désactive le timestamp | `!rpc timestamp off` |
| `!rpc party <cur> <max>` | Définit la taille de party | `!rpc party 3 5` |
| `!rpc streaming <url> <nom>` | Active le mode streaming | `!rpc streaming https://twitch.tv/pseudo Mon stream` |

#### Presets rapides

| Commande | Description |
|----------|-------------|
| `!rpc preset valorant` | Preset VALORANT |
| `!rpc preset league` | Preset League of Legends |
| `!rpc preset minecraft` | Preset Minecraft |
| `!rpc preset fortnite` | Preset Fortnite |
| `!rpc preset apex` | Preset Apex Legends |
| `!rpc preset csgo` | Preset CS:GO |
| `!rpc preset coding` | Preset développement |
| `!rpc preset music` | Preset musique/Spotify |
| `!rpc preset netflix` | Preset Netflix |
| `!rpc preset youtube` | Preset YouTube |

#### Gestion

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!rpc show` | Affiche la configuration actuelle | `!rpc show` |
| `!rpc clear` | Efface complètement le RPC | `!rpc clear` |
| `!rpc help` | Affiche l'aide RPC | `!rpc help` |

### ⚙️ Commandes Générales (`!sb`)

| Commande | Description | Exemple |
|----------|-------------|---------|
| `!sb ping` | Affiche la latence | `!sb ping` |
| `!sb purge [nombre]` | Supprime vos messages | `!sb purge 50` |
| `!sb info` | Informations du selfbot | `!sb info` |
| `!sb help` | Aide générale | `!sb help` |

---

## 💡 Exemples

### Scénario 1 : Auto-vocal + RPC gaming

```bash
# Rejoindre un vocal
!av start

# Définir un RPC VALORANT
!rpc preset valorant Radiant
!rpc timestamp start
```

### Scénario 2 : RPC personnalisé complet

```bash
# Configuration complète
!rpc type PLAYING
!rpc set Mon Jeu Custom
!rpc details En partie ranked
!rpc state Top 10 mondial
!rpc timestamp start
!rpc party 2 4
```

### Scénario 3 : Mode streaming

```bash
# Activer le mode stream
!rpc streaming https://twitch.tv/pseudo Live Coding - Projet React
```

### Scénario 4 : RPC avec images custom

```bash
Vous pouvez directement mettre l image mais pour mettre l image faut prendre le lien de l image sur discord
!rpc image logo Mon jeu
!rpc smallimage icon En ligne
!rpc set Mon Jeu
!rpc details Développement
```

### Scénario 5 : Nettoyage

```bash
# Supprimer 100 de vos messages
!sb purge 100

# Quitter le vocal et effacer le RPC
!av leave
!rpc clear
```

---

## 📱 Applications Discord intégrées

Le selfbot inclut les Application IDs de jeux populaires :

| Jeu/App | ID | Commande |
|---------|----|---------| 
| VALORANT | 700136079562375258 | `!rpc app valorant` |
| League of Legends | 401518684763586560 | `!rpc app league` |
| Minecraft | 406204023935148032 | `!rpc app minecraft` |
| Fortnite | 432980957394370572 | `!rpc app fortnite` |
| Apex Legends | 438122941302046720 | `!rpc app apex` |
| GTA V | 382624125287399424 | `!rpc app gta5` |
| CS:GO | 379370609741914112 | `!rpc app csgo` |
| Roblox | 363416024800927754 | `!rpc app roblox` |
| osu! | 367827983903490050 | `!rpc app osu` |
| Spotify | 463151177836658699 | `!rpc app spotify` |
| VS Code | 383226320970055681 | `!rpc app vscode` |
| YouTube | 463097721130188830 | `!rpc app youtube` |
| Twitch | 463097721148841984 | `!rpc app twitch` |

---

## ❓ FAQ

### Comment obtenir l'ID d'un salon vocal ?

1. Activez le **Mode Développeur** dans Discord :
   - Paramètres → Avancés → Mode développeur
2. Clic droit sur le salon vocal → **Copier l'identifiant**

### Le RPC ne s'affiche pas ?

- Vérifiez que vous avez bien tapé `!rpc set <texte>` pour activer le RPC
- Assurez-vous que dans vos paramètres Discord, "Afficher l'activité actuelle" est activé
- Utilisez `!rpc show` pour voir la configuration actuelle

### Le bot se déconnecte constamment du vocal ?

- Vérifiez votre connexion internet
- Augmentez les délais dans la configuration :
  ```javascript
  AUTOVOC: {
    CHECK_INTERVAL: 90000,  // 90 secondes
    RECONNECT_DELAY: 15000  // 15 secondes
  }
  ```

### Comment arrêter le selfbot proprement ?

Appuyez sur `CTRL+C` dans le terminal. Le selfbot se déconnectera proprement du vocal et effacera le RPC.

---

## ⚠️ Avertissements

### Risques légaux et sécurité

- 🚫 **L'utilisation de selfbots viole les ToS de Discord**
- ⚡ **Risque de bannissement permanent** de votre compte
- 🔒 **Ne partagez JAMAIS votre token** Discord
- 📱 **N'utilisez pas sur votre compte principal**
- ⚖️ **Discord ne lève généralement pas les bannissements** de selfbot

### Bonnes pratiques

- ✅ Ne spammez pas les commandes
- ✅ Respectez les rate limits
- ✅ N'utilisez pas pour harceler ou nuire
- ✅ Gardez votre token confidentiel

### Limitations techniques

- ❌ Les URLs d'images directes ne fonctionnent pas (utilisez Application IDs)
- ⚠️ Certains RPC peuvent être détectés par Discord
- ⚠️ Les boutons RPC ne fonctionnent pas avec les selfbots
- ⚠️ La connexion vocale peut être instable selon votre connexion

---

## 🛠️ Dépannage

### Erreur "Invalid Token"
- Vérifiez que votre token est correct
- Assurez-vous qu'il n'y a pas d'espaces avant/après le token
- Le token peut avoir expiré, récupérez-en un nouveau

### Erreur "Missing Permissions" (vocal)
- Vérifiez que vous avez les permissions de vous connecter au salon
- Le salon peut être privé ou réservé à certains rôles

### Le bot ne répond pas aux commandes
- Vérifiez que vous utilisez les bons préfixes (`!av`, `!rpc`, `!sb`)
- Les commandes doivent être tapées par vous-même
- Vérifiez que le bot est bien connecté (regardez les logs)

---

## 📄 Licence

Ce projet est fourni "tel quel" sans garantie. L'auteur décline toute responsabilité en cas de bannissement ou autres conséquences liées à l'utilisation de ce selfbot.

**Utilisez à vos propres risques.**

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles fonctionnalités

---

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Créé avec ❤️ pour la communauté Discord**

⚠️ *Rappel : L'utilisation de selfbots viole les ToS Discord. Utilisez uniquement à des fins éducatives et sur des comptes de test.*
