# ⚡ Tekaz Autoshop — Telegram Mini App connectée à SellAuth

Application Telegram complète (**Telegram Mini App / Web App**) connectée en temps réel à votre boutique **SellAuth** ([tekaz.xyz](https://tekaz.xyz)).

Contrairement à un bot standard avec de simples boutons textuels, cette solution offre une **véritable interface mobile moderne et fluide** intégrée nativement dans Telegram avec catalogue interactif, recherche, filtrage par catégories, sélection de formules/variantes, panier d'achat et paiement direct.

---

## 🌟 Fonctionnalités

- 🛍️ **Mini App immersive** : Développée en React 19 + TypeScript + Tailwind CSS, optimisée pour mobile et intégrée au thème de Telegram.
- 🔄 **Synchronisation SellAuth en direct** : 
  - Récupération instantanée des 69+ produits (Streaming, Discord, IA, VPN, etc.).
  - Prise en charge des variantes, des prix et des niveaux de stock.
  - Mise en cache intelligente (60s) pour une vitesse de chargement instantanée.
- 💳 **Passerelle de commande SellAuth** :
  - Création automatique des sessions de paiement sécurisées (Stripe, Crypto BTC, LTC, SOL, etc.).
  - Détection automatique et en direct du statut du paiement avec affichage des clés/accès directement dans l'application avec feux d'artifice !
- 🤖 **Bot Telegram dédié (`@tekazmarketbot`)** :
  - Commande `/start` avec message d'accueil et bouton d'ouverture.
  - Bouton de menu permanent ("🛍️ Boutique") accessible en bas à gauche de la conversation Telegram.
  - Réception de webhook SellAuth pour délivrer les clés et factures directement par message Telegram.

---

## 📁 Structure du Projet

```
tekaz-autoshop/
├── client/                     # Frontend Telegram Mini App (React + Vite)
│   ├── src/
│   │   ├── components/         # Navbar, CartDrawer, ProductModal, CheckoutModal, etc.
│   │   ├── hooks/useTelegram.ts # SDK Telegram (Haptique, User, MainButton)
│   │   ├── services/api.ts     # Client HTTP
│   │   └── App.tsx             # Application principale
│   └── dist/                   # Build de production
├── server/                     # Backend Express & Bot Telegram (TypeScript)
│   ├── src/
│   │   ├── bot.ts              # Bot Telegram Grammy & Menu Button
│   │   ├── sellauth.ts         # Intégration API SellAuth v1
│   │   ├── routes.ts           # Routes /api/products, /api/checkout, /api/webhook
│   │   └── index.ts            # Serveur Express & distribution de la Mini App
│   ├── .env                    # Vos clés SellAuth et Telegram
│   └── dist/                   # Code compilé
├── package.json                # Scripts monorepo
└── README.md                   # Ce guide
```

---

## 🚀 Démarrage Rapide en Local

### 1. Cloner ou naviguer dans le dossier
```bash
cd tekaz-autoshop
```

### 2. Démarrer le serveur et le bot
Le projet est déjà compilé et prêt à l'emploi. Pour le lancer en local :
```bash
npm start
```
Le serveur écoute sur `http://localhost:3000` et le bot Telegram `@tekazmarketbot` démarre instantanément en écoute des commandes !

### 3. Tester dans Telegram depuis votre PC (via Tunnel HTTPS)
Telegram exige une URL **HTTPS** pour les Mini Apps. Pour tester immédiatement avant de configurer votre domaine :
1. Lancez un tunnel gratuit comme Cloudflare Tunnel ou Ngrok :
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   # ou
   npx ngrok http 3000
   ```
2. Vous obtiendrez une URL du type `https://xxxx.trycloudflare.com` ou `https://xxxx.ngrok-free.app`.
3. Indiquez cette URL dans le fichier `server/.env` (`MINI_APP_URL=https://votre-url`) et redémarrez le serveur.

---

## 🌐 Configuration du Domaine chez OVH (`shop.tekaz.xyz`)

Pour que votre Mini App soit accessible sur votre propre sous-domaine (ex: `https://shop.tekaz.xyz`) :

1. Connectez-vous sur votre espace client **OVHcloud**.
2. Allez dans **Noms de domaine** > sélectionnez **tekaz.xyz** > onglet **Zone DNS**.
3. Cliquez sur **Ajouter une entrée** :
   - **Type** : `A` (ou `CNAME` selon votre hébergeur).
   - **Sous-domaine** : `shop`
   - **Cible** : L'adresse IP de votre serveur VPS (ou le nom d'hôte de votre hébergeur Render/Railway).
   - **TTL** : Par défaut.
4. Validez. La propagation DNS prend généralement entre 5 et 30 minutes.

---

## 🤖 Configuration du Bot sur `@BotFather`

Pour lier l'URL de votre application au bouton de menu du Bot Telegram :

1. Ouvrez Telegram et lancez une conversation avec **[@BotFather](https://t.me/BotFather)**.
2. Envoyez la commande :
   ```text
   /mybots
   ```
3. Sélectionnez votre bot : **@tekazmarketbot**
4. Allez dans **Bot Settings** > **Menu Button** > **Configure menu button**.
5. Envoyez l'URL HTTPS de votre boutique :
   ```text
   https://shop.tekaz.xyz
   ```
6. Envoyez le texte du bouton :
   ```text
   🛍️ Boutique
   ```
7. *(Optionnel)* Vous pouvez aussi créer une Web App dédiée avec `/newapp` :
   - Titre : `Tekaz Market`
   - Description : `Autoshop officiel Tekaz`
   - Image 640x360 et icône 100x100.
   - Web App URL : `https://shop.tekaz.xyz`
   - Short name : `shop` (ce qui permettra le lien direct `t.me/tekazmarketbot/shop`).

---

## 🔔 Configuration du Webhook SellAuth (Livraison automatique)

Pour que vos clients reçoivent une notification Telegram automatique dès que leur paiement est validé :

1. Allez sur votre dashboard **SellAuth** ([sellauth.com](https://sellauth.com)).
2. Rendez-vous dans **Settings** > **Developers** ou **Webhooks**.
3. Cliquez sur **Create Webhook** :
   - **URL** : `https://shop.tekaz.xyz/api/webhook/sellauth`
   - **Events** : Cochez `invoice.completed` (ou `all events`).
4. Sauvegardez.

---

## 🚢 Déploiement en Production

### Option 1 : Déploiement sur un VPS (Linux Ubuntu/Debian)
1. Installez Node.js 20+ et PM2 sur votre VPS :
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```
2. Copiez le dossier `tekaz-autoshop` sur votre serveur.
3. Installez et lancez l'application :
   ```bash
   npm run install:all
   npm run build
   pm2 start npm --name "tekaz-autoshop" -- start
   pm2 save
   pm2 startup
   ```
4. Configurez un reverse proxy Nginx avec certificat SSL Let's Encrypt gratuit (`certbot --nginx -d shop.tekaz.xyz`).

### Option 2 : Hébergement Cloud en 1 clic (Railway ou Render)
1. Poussez votre code sur GitHub.
2. Liez votre repo sur [Railway.app](https://railway.app) ou [Render.com](https://render.com).
3. Définissez la commande de build : `npm run install:all && npm run build`
4. Définissez la commande de démarrage : `npm start`
5. Ajoutez vos variables d'environnement (`SELLAUTH_API_KEY`, `SELLAUTH_SHOP_ID`, `TELEGRAM_BOT_TOKEN`, `MINI_APP_URL`).
6. Attribuez votre domaine personnalisé `shop.tekaz.xyz`.
