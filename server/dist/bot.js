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
// /start command
bot.command('start', async (ctx) => {
    const userName = ctx.from?.first_name || 'Cher client';
    const keyboard = new InlineKeyboard()
        .webApp('🚀 Ouvrir la Boutique', config.miniAppUrl)
        .row()
        .url('🌐 Site Web (tekaz.xyz)', `https://${config.shopDomain}`)
        .row()
        .text('📦 Mes Commandes', 'cmd_orders')
        .text('💬 Support', 'cmd_support');
    const welcomeMessage = `
⚡ *Bienvenue sur Tekaz Market, ${userName} !*

Accédez à notre catalogue complet de comptes, abonnements, licences et boosts avec livraison instantanée 24/7.

🛒 *Une vraie application intégrée :*
Cliquez sur le bouton ci-dessous pour ouvrir l'interface interactive directement dans Telegram (avec panier, filtres et paiement rapide).
  `.trim();
    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});
// Callback query handlers
bot.callbackQuery('cmd_support', async (ctx) => {
    await ctx.answerCallbackQuery();
    const keyboard = new InlineKeyboard()
        .url('👤 Contacter @notthatid', 'https://t.me/notthatid')
        .row()
        .url('📢 Canal t.me/TekazMarket', 'https://t.me/TekazMarket')
        .row()
        .webApp('⭐ Avis Clients & Restocks', `${config.miniAppUrl}?tab=support`);
    await ctx.reply(`
🆘 *Support Tekaz Market*

Besoin d'aide, d'une question ou d'une demande sur vos commandes ?
• 👤 *Support direct :* Contactez @notthatid
• 📢 *Canal officiel :* [t.me/TekazMarket](https://t.me/TekazMarket) (annonces, restocks et alertes en direct)

Consultez également nos 186+ avis vérifiés et les derniers réapprovisionnements dans l'application !
  `.trim(), { parse_mode: 'Markdown', reply_markup: keyboard });
});
bot.callbackQuery('cmd_orders', async (ctx) => {
    await ctx.answerCallbackQuery();
    const keyboard = new InlineKeyboard().webApp('🔍 Consulter mes achats', `${config.miniAppUrl}?tab=orders`);
    await ctx.reply('Retrouvez vos achats, factures et livrables en ouvrant la section *Mes Commandes* dans l\'application :', {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});
// /help and /support commands
bot.command(['help', 'support'], async (ctx) => {
    const keyboard = new InlineKeyboard()
        .url('👤 Contacter @notthatid', 'https://t.me/notthatid')
        .row()
        .url('📢 Canal t.me/TekazMarket', 'https://t.me/TekazMarket')
        .row()
        .webApp('🛍️ Ouvrir la Boutique', config.miniAppUrl);
    await ctx.reply(`
🆘 *Assistance & Support Tekaz Market*

• Pour toute question ou réclamation : contactez *@notthatid*
• Rejoignez notre canal officiel : *t.me/TekazMarket* pour suivre tous les restocks et drops
• Retrouvez vos achats et avis directement dans notre Mini App Telegram !
  `.trim(), { parse_mode: 'Markdown', reply_markup: keyboard });
});
// Function to notify user when an order is completed
export async function notifyUserOrderCompleted(chatId, invoice) {
    try {
        let text = `🎉 *Paiement Confirmé pour votre commande #${invoice.id} !*\n\n`;
        text += `💰 Montant : *${invoice.price} ${invoice.currency}*\n`;
        text += `📧 Email : \`${invoice.email}\`\n\n`;
        if (invoice.items && invoice.items.length) {
            text += `*Articles :*\n`;
            for (const item of invoice.items) {
                text += `• ${item.name} ${item.variant ? `(${item.variant})` : ''} x${item.quantity}\n`;
            }
            text += `\n`;
        }
        if (invoice.delivered) {
            text += `🔑 *Vos livrables :*\n\`\`\`\n${invoice.delivered}\n\`\`\`\n\n`;
        }
        text += `Merci pour votre achat sur Tekaz Market ! 🙏`;
        await bot.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }
    catch (err) {
        console.error('Failed to send Telegram notification to user:', err.message);
    }
}
