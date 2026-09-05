import { Bot, InlineKeyboard } from 'grammy';
import { config } from './config.js';
export const bot = new Bot(config.telegramBotToken);
// Configure bot menu button on startup
export async function setupBot() {
    try {
        // Set default menu button to open the Mini App
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
// Helper to detect if user is French speaking
function isFrenchUser(ctx) {
    const code = ctx.from?.language_code?.toLowerCase() || '';
    return code.startsWith('fr');
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
            // Delivery notification text
            let text = `🌟 *Paiement en Telegram Stars Confirmé !* (${payment.total_amount} ⭐)\n\n`;
            text += `📦 *Articles commandés :*\n`;
            for (const item of order.items) {
                text += `• ${item.name} ${item.variantName ? `(${item.variantName})` : ''} x${item.quantity}\n`;
            }
            text += `\n📧 *Email :* \`${order.email}\`\n`;
            text += `🆔 *Commande :* \`${order.orderId}\`\n\n`;
            text += `ℹ️ Vos accès et livrables sont disponibles dans la boutique (section Mes Commandes). Si votre article nécessite une configuration manuelle ou un remplacement, notre support @notthatid est à votre disposition 24/7 !\n\n`;
            text += `Merci pour votre achat sur Tekaz Market ! 🙏`;
            await ctx.reply(text, { parse_mode: 'Markdown' });
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
