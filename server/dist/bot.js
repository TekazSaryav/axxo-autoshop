import { Bot, InlineKeyboard } from 'grammy';
import { config } from './config.js';
import { sellauthService } from './sellauth.js';
import { addStock, popStock, clearStock, setAdminChatId, getAdminChatId, getAllStock } from './starsStock.js';
import { getAllResellers, getReseller, isReseller, addReseller, removeReseller } from './resellerStore.js';
import { saveStarsOrder, getAllStarsOrders } from './starsOrdersStore.js';
import { recordTelegramUser, getAllTelegramUsers, getTelegramUsersCount } from './userStore.js';
export const bot = new Bot(config.telegramBotToken);
// Configure bot menu button on startup
export async function setupBot() {
    try {
        await bot.api.setChatMenuButton({
            menu_button: {
                type: 'web_app',
                text: '🛍️ Boutique',
                web_app: {
                    url: config.miniAppUrl
                }
            }
        });
        console.log(' Telegram Menu Button configured to Mini App URL:', config.miniAppUrl);
    }
    catch (err) {
        console.warn('⚠️ Could not set menu button:', err.message);
    }
}
// Convert HTML to clean Telegram Markdown
export function htmlToTelegramText(html) {
    if (!html)
        return '';
    return html
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
        .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '*$1*')
        .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '*$1*')
        .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n*$1*\n')
        .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
// Helper to detect if user is French speaking
function isFrenchUser(ctx) {
    const code = ctx.from?.language_code?.toLowerCase() || '';
    return code.startsWith('fr');
}
// Helper to escape Telegram Markdown special characters in dynamic values
function escapeMd(text) {
    if (!text)
        return '';
    return String(text).replace(/([_*`\[\]()])/g, '\\$1');
}
// Auto-detect and record admin chatId, and save all interacting users
bot.use(async (ctx, next) => {
    if (ctx.from?.id) {
        recordTelegramUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name, ctx.from.language_code);
    }
    const username = ctx.from?.username?.toLowerCase();
    if (username === 'notthatid' && ctx.chat?.id) {
        setAdminChatId(ctx.chat.id);
    }
    return next();
});
function isAdmin(ctx) {
    const username = ctx.from?.username?.toLowerCase();
    if (username === 'notthatid') {
        if (ctx.chat?.id)
            setAdminChatId(ctx.chat.id);
        return true;
    }
    const savedAdminId = getAdminChatId();
    if (savedAdminId && String(ctx.from?.id) === String(savedAdminId)) {
        return true;
    }
    if (process.env.ADMIN_TELEGRAM_ID && String(ctx.from?.id) === String(process.env.ADMIN_TELEGRAM_ID)) {
        return true;
    }
    return false;
}
// Storage for pending & completed Telegram Stars orders (in-memory cache)
export const starsOrders = new Map();
// /start command
bot.command('start', async (ctx) => {
    const isFr = isFrenchUser(ctx);
    const userName = ctx.from?.first_name || (isFr ? 'Cher client' : 'Customer');
    const userId = ctx.from?.id;
    const userIsReseller = userId ? isReseller(userId) : false;
    const resellerInfo = userId ? getReseller(userId) : undefined;
    const userIsAdmin = isAdmin(ctx);
    const keyboard = new InlineKeyboard()
        .webApp(isFr ? '🚀 Ouvrir la Boutique' : '🚀 Open Shop', config.miniAppUrl)
        .row()
        .url(isFr ? '🌐 Site Web (tekaz.xyz)' : '🌐 Website (tekaz.xyz)', `https://${config.shopDomain}`)
        .row()
        .text(isFr ? '📦 Mes Commandes' : '📦 My Orders', 'cmd_orders')
        .text(isFr ? '💬 Support' : '💬 Support', 'cmd_support');
    if (userIsAdmin) {
        keyboard.row().text('👑 Panel Administrateur', 'admin_main');
    }
    let welcomeMessage = isFr
        ? `⚡ *Bienvenue sur Tekaz Market, ${userName} !*\n\nAccédez à notre catalogue complet de comptes, abonnements, licences et boosts avec livraison instantanée 24/7.`
        : `⚡ *Welcome to Tekaz Market, ${userName}!*\n\nAccess our full catalog of accounts, subscriptions, software licenses and boosts with instant 24/7 delivery.`;
    if (userIsReseller) {
        welcomeMessage += isFr
            ? `\n\n💎 *Statut VIP Revendeur Actif :* Vous bénéficiez de *-${resellerInfo?.discountPercentage || 20}%* sur tous les articles de la boutique !`
            : `\n\n💎 *Active Reseller VIP Status:* You get *-${resellerInfo?.discountPercentage || 20}%* on all products across the store!`;
    }
    welcomeMessage += isFr
        ? `\n\n🛒 *Application intégrée :*\nCliquez ci-dessous pour lancer l'interface interactive.`
        : `\n\n🛒 *Integrated Application:*\nClick below to launch the store interface.`;
    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});
// Admin interactive menu builder
function buildAdminKeyboard() {
    return new InlineKeyboard()
        .text('📦 Stocks Stars', 'admin_stock')
        .text('📋 Commandes', 'admin_orders')
        .row()
        .text('💎 Revendeurs', 'admin_resellers')
        .text('📢 Diffusion / Users', 'admin_broadcast_info')
        .row()
        .webApp('🖥️ Ouvrir Panel Web Complet', `${config.miniAppUrl}?tab=admin`);
}
// /admin command
bot.command(['admin'], async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    const userCount = getTelegramUsersCount();
    const text = `👑 *Menu Administrateur Tekaz Market*

Bienvenue dans votre centre de gestion. Choisissez une catégorie ou ouvrez directement le panel complet dans l'application :

• 📦 *Stocks Stars :* Consulter ou alimenter le stock manuel
• 📋 *Commandes :* Historique SellAuth & Telegram Stars
• 💎 *Revendeurs :* Accorder ou révoquer les accès grossistes
• 📢 *Diffusions :* \`/broadcast <texte>\` (${userCount} utilisateurs enregistrés)
• 💬 *Message direct :* \`/say <chat_id> <texte>\`
• 🖥️ *Panel Web :* Interface graphique complète avec statistiques
`;
    await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: buildAdminKeyboard()
    });
});
// Admin callbacks
bot.callbackQuery('admin_main', async (ctx) => {
    if (!isAdmin(ctx))
        return ctx.answerCallbackQuery({ text: 'Accès refusé', show_alert: true });
    await ctx.answerCallbackQuery();
    const text = `👑 *Menu Administrateur Tekaz Market*

Choisissez une action :
`;
    await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: buildAdminKeyboard()
    });
});
bot.callbackQuery('admin_stock', async (ctx) => {
    if (!isAdmin(ctx))
        return ctx.answerCallbackQuery({ text: 'Accès refusé', show_alert: true });
    await ctx.answerCallbackQuery();
    try {
        const allStock = getAllStock();
        const stockMap = new Map();
        for (const entry of allStock) {
            const key = entry.variantId ? `${entry.productId}_${entry.variantId}` : `${entry.productId}`;
            stockMap.set(key, entry.serials.length);
        }
        const totalStockCount = allStock.reduce((sum, e) => sum + e.serials.length, 0);
        let text = `📦 *Stock Manuel Telegram Stars*\n\n`;
        text += `📊 Total articles en stock : *${totalStockCount}*\n\n`;
        if (allStock.length === 0) {
            text += `_Aucun stock manuel configuré pour le moment._\n`;
        }
        else {
            text += `*Articles approvisionnés :*\n`;
            for (const entry of allStock) {
                const pName = escapeMd(entry.productName);
                const vName = entry.variantName ? ` \\(${escapeMd(entry.variantName)}\\)` : '';
                text += `• *${pName}*${vName} : *${entry.serials.length} en stock*\n  └ ID: \`${entry.productId}\`${entry.variantId ? ` | Var: \`${entry.variantId}\`` : ''}\n`;
            }
        }
        text += `\n➕ *Ajouter du stock :*
\`/addstock <ID_PRODUIT> [ID_VARIANTE]\`
suivi de vos comptes ou clés (un par ligne).
\`/clearstock <ID_PRODUIT>\` pour vider.
`;
        const backKb = new InlineKeyboard()
            .text('⬅️ Retour Menu', 'admin_main')
            .webApp('🖥️ Gérer dans Panel Web', `${config.miniAppUrl}?tab=admin&sub=stock`);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: backKb });
    }
    catch (err) {
        await ctx.reply('❌ Erreur: ' + err.message);
    }
});
bot.callbackQuery('admin_orders', async (ctx) => {
    if (!isAdmin(ctx))
        return ctx.answerCallbackQuery({ text: 'Accès refusé', show_alert: true });
    await ctx.answerCallbackQuery();
    try {
        const starsOrdersList = getAllStarsOrders().slice(0, 5);
        const { invoices: allInvoices } = await sellauthService.getRecentInvoices(1, 5);
        const invoices = allInvoices.slice(0, 5);
        let text = `📋 *Dernières Commandes :*\n\n`;
        text += `🌟 *Telegram Stars (Dernières) :*\n`;
        if (starsOrdersList.length === 0) {
            text += `_Aucune commande Stars récente_\n`;
        }
        else {
            for (const o of starsOrdersList) {
                const orderId = escapeMd(o.orderId);
                const stars = escapeMd(o.starsAmount);
                const statusStr = o.status === 'paid' ? '✅ Payé' : '⏳ En attente';
                const emailStr = escapeMd(o.email);
                text += `• #${orderId} \\- *${stars} ⭐* \\(${statusStr}\\) \\- ${emailStr}\n`;
            }
        }
        text += `\n💳 *SellAuth (Dernières) :*\n`;
        if (invoices.length === 0) {
            text += `_Aucune commande SellAuth récente_\n`;
        }
        else {
            for (const inv of invoices) {
                const invId = escapeMd(inv.id);
                const price = escapeMd(inv.price);
                const curr = escapeMd(inv.currency);
                const status = escapeMd(inv.status);
                const email = escapeMd(inv.email);
                text += `• #${invId} \\- *${price} ${curr}* \\(${status}\\) \\- ${email}\n`;
            }
        }
        const backKb = new InlineKeyboard()
            .text('⬅️ Retour Menu', 'admin_main')
            .webApp('🖥️ Voir toutes dans Panel Web', `${config.miniAppUrl}?tab=admin&sub=orders`);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: backKb });
    }
    catch (err) {
        await ctx.reply('❌ Erreur: ' + err.message);
    }
});
bot.callbackQuery('admin_resellers', async (ctx) => {
    if (!isAdmin(ctx))
        return ctx.answerCallbackQuery({ text: 'Accès refusé', show_alert: true });
    await ctx.answerCallbackQuery();
    const resellers = getAllResellers();
    let text = `💎 *Gestion des Accès Revendeurs :*\n\n`;
    if (resellers.length === 0) {
        text += `_Aucun revendeur configuré pour le moment._\n`;
    }
    else {
        for (const r of resellers) {
            text += `• ID: \`${r.telegramId}\` ${r.name ? `(${r.name})` : ''} - Remise: *-${r.discountPercentage}%*\n`;
        }
    }
    text += `\n➕ *Ajouter un revendeur :*
\`/addreseller <USER_ID_TELEGRAM> [POURCENTAGE] [NOM]\`

Exemple :
\`/addreseller 123456789 20 JeanRevendeur\`

🗑️ *Supprimer un revendeur :*
\`/delreseller <USER_ID_TELEGRAM>\`
`;
    const backKb = new InlineKeyboard()
        .text('⬅️ Retour Menu', 'admin_main')
        .webApp('🖥️ Gérer dans Panel Web', `${config.miniAppUrl}?tab=admin&sub=resellers`);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: backKb });
});
bot.callbackQuery('admin_broadcast_info', async (ctx) => {
    if (!isAdmin(ctx))
        return ctx.answerCallbackQuery({ text: 'Accès refusé', show_alert: true });
    await ctx.answerCallbackQuery();
    const totalUsers = getTelegramUsersCount();
    const text = `📢 *Système de Diffusion & Annonces*

👥 Utilisateurs enregistrés : *${totalUsers}*

Pour diffuser une mise à jour, un patch note ou une promo à TOUS vos clients avec l'identité du bot :

\`\`\`
/broadcast Votre message ici...
\`\`\`

💬 Pour envoyer un message privé à un utilisateur spécifique :
\`\`\`
/say <USER_ID> Votre message ici...
\`\`\`

_Chaque message de diffusion inclura automatiquement le bouton "🛍️ Ouvrir la Boutique" pour inciter vos clients à visiter le shop !_
`;
    const backKb = new InlineKeyboard()
        .text('⬅️ Retour Menu', 'admin_main');
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: backKb });
});
// Admin Command: /resellers
bot.command('resellers', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Réservé à l'administrateur.");
    }
    const resellers = getAllResellers();
    let text = `💎 *Liste des Revendeurs Agréés (${resellers.length}) :*\n\n`;
    if (resellers.length === 0) {
        text += `_Aucun revendeur enregistré._\n`;
    }
    else {
        for (const r of resellers) {
            text += `• ID Telegram: \`${r.telegramId}\` ${r.name ? `(${r.name})` : ''} - *-${r.discountPercentage}%*\n`;
        }
    }
    text += `\nUtilisez \`/addreseller <ID> [REMISE%] [NOM]\` pour ajouter un accès.`;
    await ctx.reply(text, { parse_mode: 'Markdown' });
});
// Admin Command: /addreseller <id> [discount] [name]
bot.command('addreseller', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Réservé à l'administrateur.");
    }
    const parts = (ctx.message?.text || '').trim().split(/\s+/);
    const targetId = parts[1];
    const discountStr = parts[2];
    const name = parts.slice(3).join(' ') || undefined;
    if (!targetId) {
        return ctx.reply(`ℹ️ *Usage :* \`/addreseller <USER_ID_TELEGRAM> [REMISE%] [NOM]\`
Exemple : \`/addreseller 123456789 20 MonRevendeur\``, { parse_mode: 'Markdown' });
    }
    const discount = discountStr && !isNaN(Number(discountStr)) ? Number(discountStr) : undefined;
    const reseller = addReseller(targetId, name, discount);
    await ctx.reply(`✅ *Accès Revendeur accordé !*
🆔 ID Telegram : \`${reseller.telegramId}\`
🏷️ Remise appliquée : *-${reseller.discountPercentage}%*
${reseller.name ? `👤 Nom : ${reseller.name}` : ''}

Ce client bénéficie désormais automatiquement des prix grossistes dans l'application !`, { parse_mode: 'Markdown' });
});
// Admin Command: /delreseller <id>
bot.command('delreseller', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Réservé à l'administrateur.");
    }
    const parts = (ctx.message?.text || '').trim().split(/\s+/);
    const targetId = parts[1];
    if (!targetId) {
        return ctx.reply(`Usage : \`/delreseller <USER_ID_TELEGRAM>\``, { parse_mode: 'Markdown' });
    }
    const removed = removeReseller(targetId);
    if (removed) {
        await ctx.reply(`🗑️ Accès revendeur révoqué pour l'ID \`${targetId}\`.`, { parse_mode: 'Markdown' });
    }
    else {
        await ctx.reply(`ℹ️ Cet ID n'était pas dans la liste des revendeurs.`, { parse_mode: 'Markdown' });
    }
});
// Admin Command: /stock
bot.command('stock', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    try {
        const allStock = getAllStock();
        const totalStockCount = allStock.reduce((sum, e) => sum + e.serials.length, 0);
        let text = `👑 *Gestionnaire de Stock Telegram Stars (Tekaz)*\n\n`;
        text += `📊 Total articles en stock : *${totalStockCount}*\n\n`;
        if (allStock.length === 0) {
            text += `_Aucun stock manuel configuré pour le moment._\n`;
        }
        else {
            text += `*📦 Articles approvisionnés :*\n`;
            for (const entry of allStock) {
                const pName = escapeMd(entry.productName);
                const vName = entry.variantName ? ` \\(${escapeMd(entry.variantName)}\\)` : '';
                text += `• *${pName}*${vName} : *${entry.serials.length} en stock*\n  └ ID: \`${entry.productId}\`${entry.variantId ? ` | Var: \`${entry.variantId}\`` : ''}\n`;
            }
        }
        text += `\n➕ *Comment ajouter du stock :*
\`/addstock <ID_PRODUIT> [ID_VARIANTE]\`
suivi de vos comptes (un par ligne)
\`/clearstock <ID_PRODUIT>\` pour vider
`;
        await ctx.reply(text, { parse_mode: 'Markdown' });
    }
    catch (err) {
        await ctx.reply('❌ Erreur : ' + err.message);
    }
});
// Admin Command: /orders
bot.command('orders', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    try {
        const starsOrdersList = getAllStarsOrders().slice(0, 5);
        const { invoices: allInvoices } = await sellauthService.getRecentInvoices(1, 5);
        const invoices = allInvoices.slice(0, 5);
        let text = `📋 *Dernières Commandes :*\n\n`;
        text += `🌟 *Telegram Stars (Dernières) :*\n`;
        if (starsOrdersList.length === 0) {
            text += `_Aucune commande Stars récente_\n`;
        }
        else {
            for (const o of starsOrdersList) {
                const orderId = escapeMd(o.orderId);
                const stars = escapeMd(o.starsAmount);
                const statusStr = o.status === 'paid' ? '✅ Payé' : '⏳ En attente';
                const emailStr = escapeMd(o.email);
                text += `• #${orderId} \\- *${stars} ⭐* \\(${statusStr}\\) \\- ${emailStr}\n`;
            }
        }
        text += `\n💳 *SellAuth (Dernières) :*\n`;
        if (invoices.length === 0) {
            text += `_Aucune commande SellAuth récente_\n`;
        }
        else {
            for (const inv of invoices) {
                const invId = escapeMd(inv.id);
                const price = escapeMd(inv.price);
                const curr = escapeMd(inv.currency);
                const status = escapeMd(inv.status);
                const email = escapeMd(inv.email);
                text += `• #${invId} \\- *${price} ${curr}* \\(${status}\\) \\- ${email}\n`;
            }
        }
        await ctx.reply(text, { parse_mode: 'Markdown' });
    }
    catch (err) {
        await ctx.reply('❌ Erreur : ' + err.message);
    }
});
// Admin Command: /addstock
bot.command('addstock', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    const messageText = ctx.message?.text || '';
    const lines = messageText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
        return ctx.reply(`ℹ️ *Format requis :*
\`/addstock <ID_PRODUIT> [ID_VARIANTE]\`
suivi de vos comptes ou clés (un par ligne).

*Exemple :*
\`/addstock 411470
email1:password:2fa
email2:password:2fa\``, { parse_mode: 'Markdown' });
    }
    const firstLine = lines[0].replace(/^\/addstock\s*/i, '').trim();
    const parts = firstLine.split(/\s+/);
    const productId = parseInt(parts[0], 10);
    const variantId = parts[1] ? parseInt(parts[1], 10) : undefined;
    if (isNaN(productId)) {
        return ctx.reply('❌ ID de produit invalide. Tapez `/stock` pour voir les IDs disponibles.', { parse_mode: 'Markdown' });
    }
    try {
        const { products } = await sellauthService.getProducts();
        const prod = products.find(p => p.id === productId);
        if (!prod) {
            return ctx.reply('❌ Produit avec ID `' + productId + '` introuvable. Tapez `/stock` pour la liste.', { parse_mode: 'Markdown' });
        }
        const variant = variantId ? prod.variants?.find(v => v.id === variantId) : undefined;
        const serialsToAdd = lines.slice(1);
        const result = addStock(productId, prod.name, variantId, variant?.name, serialsToAdd);
        await ctx.reply(`✅ *${result.added} compte(s) / clé(s) ajouté(s) avec succès !*
📦 Produit : *${prod.name}* ${variant?.name ? `(${variant.name})` : ''}
🔢 Stock Stars disponible : *${result.total}*`, { parse_mode: 'Markdown' });
    }
    catch (err) {
        await ctx.reply('❌ Erreur lors de l\'ajout : ' + err.message);
    }
});
// Admin Command: /clearstock
bot.command('clearstock', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    const parts = (ctx.message?.text || '').trim().split(/\s+/);
    const productId = parseInt(parts[1], 10);
    const variantId = parts[2] ? parseInt(parts[2], 10) : undefined;
    if (isNaN(productId)) {
        return ctx.reply('Usage : `/clearstock <ID_PRODUIT>`', { parse_mode: 'Markdown' });
    }
    const cleared = clearStock(productId, variantId);
    if (cleared) {
        await ctx.reply('🗑️ Stock vidé pour le produit `' + productId + '`.', { parse_mode: 'Markdown' });
    }
    else {
        await ctx.reply('ℹ️ Aucun stock enregistré pour ce produit.', { parse_mode: 'Markdown' });
    }
});
// Admin Command: /broadcast <message> (Diffusion à tous les utilisateurs)
bot.command('broadcast', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    const messageText = ctx.message?.text || '';
    const broadcastBody = messageText.replace(/^\/broadcast\s*/i, '').trim();
    if (!broadcastBody) {
        return ctx.reply(`📢 *Usage :* \`/broadcast <Votre message>\`\n\n_Le message sera envoyé à tous les utilisateurs enregistrés avec le bouton d'accès à la boutique._`, { parse_mode: 'Markdown' });
    }
    const allUsers = getAllTelegramUsers();
    if (allUsers.length === 0) {
        return ctx.reply('ℹ️ Aucun utilisateur enregistré pour le moment.');
    }
    await ctx.reply(`⏳ Début de la diffusion vers *${allUsers.length}* utilisateurs...`, { parse_mode: 'Markdown' });
    const shopKeyboard = new InlineKeyboard()
        .webApp('🛍️ Ouvrir la Boutique', config.miniAppUrl)
        .url('📢 Canal Officiel', 'https://t.me/TekazMarket');
    const formattedMessage = `📢 *ANNONCE OFFICIELLE TEKAZ MARKET*\n\n${broadcastBody}`;
    let successCount = 0;
    let failCount = 0;
    for (const user of allUsers) {
        try {
            await bot.api.sendMessage(user.id, formattedMessage, {
                parse_mode: 'Markdown',
                reply_markup: shopKeyboard
            });
            successCount++;
        }
        catch (err) {
            failCount++;
        }
        // Anti flood protection (35ms delay between sends)
        await new Promise((resolve) => setTimeout(resolve, 35));
    }
    await ctx.reply(`✅ *Diffusion terminée !*\n\n• Envoyés avec succès : *${successCount}*\n• Échecs (bots bloqués/inaccessibles) : *${failCount}*\n• Total ciblés : *${allUsers.length}*`, { parse_mode: 'Markdown' });
});
// Admin Command: /say <chat_id> <message> (Envoyer un message individuel avec l'identité du bot)
bot.command('say', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    const messageText = ctx.message?.text || '';
    const parts = messageText.replace(/^\/say\s*/i, '').trim().split(/\s+/);
    const targetChatId = parts[0];
    const directMessage = parts.slice(1).join(' ').trim();
    if (!targetChatId || !directMessage) {
        return ctx.reply(`💬 *Usage :* \`/say <USER_ID> <Votre message>\`\n\n*Exemple :*\n\`/say 123456789 Bonjour, votre compte est réactivé !\``, { parse_mode: 'Markdown' });
    }
    try {
        const shopKeyboard = new InlineKeyboard()
            .webApp('🛍️ Ouvrir la Boutique', config.miniAppUrl);
        await bot.api.sendMessage(targetChatId, `💬 *Message de l'administrateur :*\n\n${directMessage}`, {
            parse_mode: 'Markdown',
            reply_markup: shopKeyboard
        });
        await ctx.reply(`✅ Message envoyé avec succès à l'utilisateur \`${targetChatId}\`.`, { parse_mode: 'Markdown' });
    }
    catch (err) {
        await ctx.reply(`❌ Erreur lors de l'envoi : ${err.message}`);
    }
});
// Callback query handlers
bot.callbackQuery('cmd_support', async (ctx) => {
    await ctx.answerCallbackQuery();
    const isFr = isFrenchUser(ctx);
    const keyboard = new InlineKeyboard()
        .url(isFr ? '👤 Contacter @notthatid' : '👤 Contact @notthatid', 'https://t.me/notthatid')
        .row()
        .url(isFr ? '📢 Canal t.me/TekazMarket' : '📢 Channel t.me/TekazMarket', 'https://t.me/TekazMarket')
        .row()
        .webApp(isFr ? '⭐ Avis Clients & Restocks' : '⭐ Reviews & Restocks', `${config.miniAppUrl}?tab=support`);
    const supportMsg = isFr
        ? `
🆘 *Support Tekaz Market*

Besoin d'aide, d'une question ou d'une demande sur vos commandes ?
• 👤 *Support direct :* Contactez @notthatid
• 📢 *Canal officiel :* [t.me/TekazMarket](https://t.me/TekazMarket) (annonces, restocks et alertes en direct)

Consultez également nos 186+ avis vérifiés et les derniers réapprovisionnements dans l'application !
    `.trim()
        : `
🆘 *Tekaz Market Support*

Need assistance or have questions regarding your order?
• 👤 *Direct Support:* Message @notthatid
• 📢 *Official Channel:* [t.me/TekazMarket](https://t.me/TekazMarket) (exclusive drops & restocks)

You can also browse our 186+ verified reviews & live restocks inside the app!
    `.trim();
    await ctx.reply(supportMsg, { parse_mode: 'Markdown', reply_markup: keyboard });
});
bot.callbackQuery('cmd_orders', async (ctx) => {
    await ctx.answerCallbackQuery();
    const isFr = isFrenchUser(ctx);
    const keyboard = new InlineKeyboard().webApp(isFr ? '🔍 Consulter mes achats' : '🔍 View My Orders', `${config.miniAppUrl}?tab=orders`);
    await ctx.reply(isFr
        ? 'Retrouvez vos achats, factures et livrables en ouvrant la section *Mes Commandes* dans l\'application :'
        : 'View your purchase history, invoices and delivered credentials in *My Orders* inside the store:', {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});
// /help and /support commands
bot.command(['help', 'support'], async (ctx) => {
    const isFr = isFrenchUser(ctx);
    const keyboard = new InlineKeyboard()
        .url(isFr ? '👤 Contacter @notthatid' : '👤 Contact @notthatid', 'https://t.me/notthatid')
        .row()
        .url(isFr ? '📢 Canal t.me/TekazMarket' : '📢 Channel t.me/TekazMarket', 'https://t.me/TekazMarket')
        .row()
        .webApp(isFr ? '🛍️ Ouvrir la Boutique' : '🛍️ Open Store', config.miniAppUrl);
    const helpMsg = isFr
        ? `
🆘 *Assistance & Support Tekaz Market*

• Pour toute question ou réclamation : contactez *@notthatid*
• Rejoignez notre canal officiel : *t.me/TekazMarket* pour suivre tous les restocks et drops
• Retrouvez vos achats et avis directement dans notre Mini App Telegram !
    `.trim()
        : `
🆘 *Tekaz Market Assistance & Support*

• For any questions, warranties or inquiries: contact *@notthatid*
• Join our official channel: *t.me/TekazMarket* for restocks and special deals
• View your orders and reviews directly inside the Telegram Mini App!
    `.trim();
    await ctx.reply(helpMsg, { parse_mode: 'Markdown', reply_markup: keyboard });
});
// Handle pre_checkout_query
bot.on('pre_checkout_query', async (ctx) => {
    try {
        const payloadStr = ctx.preCheckoutQuery.invoice_payload;
        const payload = JSON.parse(payloadStr);
        const order = starsOrders.get(payload.orderId);
        if (!order) {
            return await ctx.answerPreCheckoutQuery(false, {
                error_message: 'Commande introuvable ou expirée. Veuillez réessayer.'
            });
        }
        await ctx.answerPreCheckoutQuery(true);
    }
    catch (err) {
        console.error('Error answering pre_checkout_query:', err.message);
        await ctx.answerPreCheckoutQuery(false, { error_message: 'Erreur lors de la validation du paiement.' });
    }
});
// Handle successful_payment (Stars received by bot!)
bot.on(':successful_payment', async (ctx) => {
    try {
        const payment = ctx.message?.successful_payment;
        if (!payment)
            return;
        const payload = JSON.parse(payment.invoice_payload);
        const order = starsOrders.get(payload.orderId);
        if (order) {
            order.status = 'paid';
            order.paidAt = new Date().toISOString();
            order.telegramPaymentChargeId = payment.telegram_payment_charge_id;
            order.telegramUsername = ctx.from?.username || undefined;
            // Pop manual stock & retrieve SellAuth instructions
            const deliveredLines = [];
            const instructionsList = [];
            let missingStockCount = 0;
            try {
                const { products } = await sellauthService.getProducts();
                for (const item of order.items) {
                    const prod = products.find(p => p.id === item.productId);
                    if (prod?.instructions) {
                        const cleanInst = htmlToTelegramText(prod.instructions);
                        if (cleanInst && !instructionsList.includes(cleanInst)) {
                            instructionsList.push(cleanInst);
                        }
                    }
                    const popped = popStock(item.productId, item.variantId, item.quantity);
                    if (popped.length > 0) {
                        deliveredLines.push(...popped);
                    }
                    if (popped.length < item.quantity) {
                        missingStockCount += (item.quantity - popped.length);
                    }
                }
            }
            catch (e) {
                console.error('Error popping stock or fetching instructions:', e.message);
            }
            const deliveredStr = deliveredLines.join('\n');
            if (deliveredStr) {
                order.delivered = deliveredStr;
            }
            if (instructionsList.length > 0) {
                order.instructions = instructionsList.join('\n\n---\n\n');
            }
            // Persist order update
            saveStarsOrder(order);
            // Customer notification message
            let text = `🌟 *Paiement en Telegram Stars Confirmé !* (${payment.total_amount} ⭐)\n\n`;
            if (order.isReseller) {
                text += `💎 *Tarif Revendeur Appliqué* (Remise: -${order.discountApplied}%)\n\n`;
            }
            text += `📦 *Articles commandés :*\n`;
            for (const item of order.items) {
                text += `• ${item.name} ${item.variantName ? `(${item.variantName})` : ''} x${item.quantity}\n`;
            }
            text += `\n📧 *Email :* \`${order.email}\`\n`;
            text += `🆔 *Commande :* \`${order.orderId}\`\n\n`;
            if (deliveredStr) {
                text += '🔑 *Vos Identifiants & Accès :*\n```\n' + deliveredStr + '\n```\n\n';
            }
            if (order.instructions) {
                text += `📋 *Instructions de configuration & Utilisation :*\n${order.instructions}\n\n`;
            }
            if (missingStockCount > 0) {
                text += `ℹ️ *Livraison en cours :* Votre paiement a bien été validé. Vos accès finaux sont préparés par notre support @notthatid qui vous contacte par message privé dans quelques instants !\n\n`;
            }
            else {
                text += `ℹ️ Vos accès et livrables restent consultables dans la boutique (section Mes Commandes).\n\n`;
            }
            text += `Merci pour votre achat sur Tekaz Market ! 🙏`;
            await ctx.reply(text, { parse_mode: 'Markdown' });
            // Notify Admin
            const adminChatId = getAdminChatId();
            if (adminChatId) {
                const buyerTag = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'Client');
                let adminAlert = `🌟 *NOUVELLE COMMANDE STARS !* (${payment.total_amount} ⭐)\n\n`;
                if (order.isReseller) {
                    adminAlert += `💎 *COMMANDE REVENDEUR* (Remise: -${order.discountApplied}%)\n`;
                }
                adminAlert += `👤 Client : ${buyerTag} (ID: \`${ctx.from?.id}\`)\n`;
                adminAlert += `📧 Email : \`${order.email}\`\n`;
                adminAlert += `🆔 Commande : \`${order.orderId}\`\n\n`;
                adminAlert += `📦 *Articles :*\n`;
                for (const item of order.items) {
                    adminAlert += `• ${item.name} ${item.variantName ? `(${item.variantName})` : ''} x${item.quantity}\n`;
                }
                if (missingStockCount > 0) {
                    adminAlert += `\n🚨 *ATTENTION : Stock Stars insuffisant (${missingStockCount} article(s) à livrer) !*\nVeuillez contacter ${buyerTag} pour lui transmettre son compte.`;
                }
                else {
                    adminAlert += `\n✅ *LIVRÉ AUTOMATIQUEMENT depuis le stock manuel Stars !*`;
                }
                try {
                    await bot.api.sendMessage(adminChatId, adminAlert, { parse_mode: 'Markdown' });
                }
                catch (err) {
                    console.warn('Could not send admin alert:', err.message);
                }
            }
        }
    }
    catch (err) {
        console.error('Error handling successful_payment:', err.message);
    }
});
// Function to notify user when an order is completed
export async function notifyUserOrderCompleted(chatId, invoice) {
    try {
        let text = `🎉 *Paiement Confirmé / Payment Confirmed #${invoice.id} !*\n\n`;
        text += `💰 Montant / Amount : *${invoice.price} ${invoice.currency}*\n`;
        text += `📧 Email : \`${invoice.email}\`\n\n`;
        if (invoice.items && invoice.items.length) {
            text += `*Articles :*\n`;
            for (const item of invoice.items) {
                text += `• ${item.name} ${item.variant ? `(${item.variant})` : ''} x${item.quantity}\n`;
            }
            text += `\n`;
        }
        if (invoice.delivered) {
            text += '🔑 *Vos livrables / Credentials :*\n```\n' + invoice.delivered + '\n```\n\n';
        }
        text += `Merci pour votre achat sur Tekaz Market / Thank you for shopping with us! 🙏`;
        await bot.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }
    catch (err) {
        console.error('Failed to send Telegram notification to user:', err.message);
    }
}
