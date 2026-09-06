import { Bot, InlineKeyboard } from 'grammy';
import { config } from './config.js';
import { sellauthService } from './sellauth.js';
import { addStock, popStock, getStockCount, clearStock, setAdminChatId, getAdminChatId } from './starsStock.js';
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
        console.warn('⚠️ Could not set menu button (may require domain verification or valid https):', err.message);
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
// Auto-detect and record admin chatId when @notthatid interacts with bot
bot.use(async (ctx, next) => {
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
    return false;
}
// /start command
bot.command('start', async (ctx) => {
    const isFr = isFrenchUser(ctx);
    const userName = ctx.from?.first_name || (isFr ? 'Cher client' : 'Customer');
    const keyboard = new InlineKeyboard()
        .webApp(isFr ? '🚀 Ouvrir la Boutique' : '🚀 Open Shop', config.miniAppUrl)
        .row()
        .url(isFr ? '🌐 Site Web (tekaz.xyz)' : '🌐 Website (tekaz.xyz)', `https://${config.shopDomain}`)
        .row()
        .text(isFr ? '📦 Mes Commandes' : '📦 My Orders', 'cmd_orders')
        .text(isFr ? '💬 Support' : '💬 Support', 'cmd_support');
    const welcomeMessage = isFr
        ? `
⚡ *Bienvenue sur Tekaz Market, ${userName} !*

Accédez à notre catalogue complet de comptes, abonnements, licences et boosts avec livraison instantanée 24/7.

🛒 *Une vraie application intégrée :*
Cliquez sur le bouton ci-dessous pour ouvrir l'interface interactive directement dans Telegram (avec panier, filtres et paiement rapide).
    `.trim()
        : `
⚡ *Welcome to Tekaz Market, ${userName}!*

Access our full catalog of accounts, subscriptions, software licenses and boosts with instant 24/7 delivery.

🛒 *Full Native Mini App:*
Click the button below to launch the store directly inside Telegram (with cart, instant search and secure checkout).
    `.trim();
    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});
// Admin Command: /stock or /admin
bot.command(['stock', 'admin'], async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply("⛔ Cette commande est réservée à l'administrateur @notthatid.");
    }
    try {
        const { products } = await sellauthService.getProducts();
        let text = `👑 *Gestionnaire de Stock Telegram Stars (Tekaz)*\n\n`;
        text += `📦 *État actuel du stock manuel Stars :*\n`;
        for (const p of products) {
            if (p.variants && p.variants.length > 1) {
                text += '\n🏷️ *' + p.name + '* (ID: `' + p.id + '`):\n';
                for (const v of p.variants) {
                    const count = getStockCount(p.id, v.id);
                    text += '  • ' + v.name + ' (Variant: `' + v.id + '`) : *' + count + ' en stock*\n';
                }
            }
            else {
                const count = getStockCount(p.id);
                text += '• *' + p.name + '* (ID: `' + p.id + '`) : *' + count + ' en stock*\n';
            }
        }
        text += `\n➕ *Comment ajouter du stock :*
Tapez la commande ci-dessous suivie de vos comptes ou clés (un par ligne) :
\`/addstock <ID_PRODUIT>\`

*Exemple pour ajouter 2 comptes :*
\`/addstock 411470
mail1@test.com:mdp1:2fakey
mail2@test.com:mdp2:2fakey\`

🗑️ *Pour vider le stock d'un produit :*
\`/clearstock <ID_PRODUIT>\`
`;
        await ctx.reply(text, { parse_mode: 'Markdown' });
    }
    catch (err) {
        await ctx.reply(`❌ Erreur : ${err.message}`);
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
        return ctx.reply("❌ ID de produit invalide. Tapez `/stock` pour voir les IDs disponibles.", { parse_mode: 'Markdown' });
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
        await ctx.reply(`❌ Erreur lors de l'ajout : ${err.message}`);
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
        return ctx.reply("Usage : `/clearstock <ID_PRODUIT>`", { parse_mode: 'Markdown' });
    }
    const cleared = clearStock(productId, variantId);
    if (cleared) {
        await ctx.reply('🗑️ Stock vidé pour le produit `' + productId + '`.', { parse_mode: 'Markdown' });
    }
    else {
        await ctx.reply(`ℹ️ Aucun stock enregistré pour ce produit.`, { parse_mode: 'Markdown' });
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
export const starsOrders = new Map();
// Handle pre_checkout_query (Telegram requires an immediate answer within 10s to approve the Stars purchase)
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
            // Customer notification message
            let text = `🌟 *Paiement en Telegram Stars Confirmé !* (${payment.total_amount} ⭐)\n\n`;
            text += `📦 *Articles commandés :*\n`;
            for (const item of order.items) {
                text += `• ${item.name} ${item.variantName ? `(${item.variantName})` : ''} x${item.quantity}\n`;
            }
            text += `\n📧 *Email :* \`${order.email}\`\n`;
            text += `🆔 *Commande :* \`${order.orderId}\`\n\n`;
            if (deliveredStr) {
                text += `🔑 *Vos Identifiants & Accès :*\n\`\`\`\n${deliveredStr}\n\`\`\`\n\n`;
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
            text += `🔑 *Vos livrables / Credentials :*\n\`\`\`\n${invoice.delivered}\n\`\`\`\n\n`;
        }
        text += `Merci pour votre achat sur Tekaz Market / Thank you for shopping with us! 🙏`;
        await bot.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }
    catch (err) {
        console.error('Failed to send Telegram notification to user:', err.message);
    }
}
