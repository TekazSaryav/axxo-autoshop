import { Router } from 'express';
import { sellauthService } from './sellauth.js';
import { notifyUserOrderCompleted, bot, starsOrders } from './bot.js';
import { getAdminChatId, getAllStock, addStock, clearStock } from './starsStock.js';
import { getAllResellers, getReseller, addReseller, removeReseller, getDefaultDiscount } from './resellerStore.js';
import { saveStarsOrder, getStarsOrder, getAllStarsOrders } from './starsOrdersStore.js';
import { recordTelegramUser } from './userStore.js';
export const apiRouter = Router();
// Store mapping of invoice_id -> telegram_chat_id in memory for instant notification
const invoiceToTelegramMap = new Map();
function checkIsAdmin(telegramId, username) {
    if (username && username.toLowerCase() === 'notthatid') {
        return true;
    }
    if (!telegramId)
        return false;
    const adminId = getAdminChatId();
    if (adminId && String(telegramId).trim() === String(adminId).trim()) {
        return true;
    }
    if (process.env.ADMIN_TELEGRAM_ID && String(telegramId).trim() === String(process.env.ADMIN_TELEGRAM_ID).trim()) {
        return true;
    }
    return false;
}
// GET /api/shop
apiRouter.get('/shop', async (_req, res) => {
    try {
        const shop = await sellauthService.getShopInfo();
        res.json({ success: true, shop });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/products
apiRouter.get('/products', async (req, res) => {
    try {
        const refresh = req.query.refresh === 'true';
        const data = await sellauthService.getProducts(refresh);
        res.json({ success: true, ...data });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/feedbacks (SellAuth customer feedbacks + restocks)
apiRouter.get('/feedbacks', async (_req, res) => {
    try {
        const feedbackData = await sellauthService.getFeedbacks();
        const restocks = await sellauthService.getRestocks();
        res.json({ success: true, ...feedbackData, restocks });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/user/status?telegram_id=...&username=...
apiRouter.get('/user/status', async (req, res) => {
    try {
        const telegramId = req.query.telegram_id;
        const username = req.query.username;
        if (telegramId) {
            recordTelegramUser(telegramId, username);
        }
        const isAdmin = checkIsAdmin(telegramId, username);
        const reseller = telegramId ? getReseller(telegramId) : undefined;
        const isResellerUser = !!reseller;
        const discountPercentage = reseller ? reseller.discountPercentage : 0;
        res.json({
            success: true,
            isAdmin,
            isReseller: isResellerUser,
            discountPercentage,
            reseller
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/checkout
apiRouter.post('/checkout', async (req, res) => {
    try {
        const { cart, email, telegram_chat_id } = req.body;
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ success: false, error: 'Le panier est vide' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Une adresse email valide est requise' });
        }
        const checkoutResult = await sellauthService.createCheckout(cart, email);
        // If customer provided their telegram chat id, remember it for webhook delivery and record user
        if (telegram_chat_id) {
            recordTelegramUser(telegram_chat_id);
            if (checkoutResult.invoice_id) {
                invoiceToTelegramMap.set(checkoutResult.invoice_id, telegram_chat_id);
            }
        }
        res.json({
            ...checkoutResult
        });
    }
    catch (err) {
        console.error('Checkout error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/checkout/stars (Telegram Stars Native Payment)
apiRouter.post('/checkout/stars', async (req, res) => {
    try {
        const { cart, email, telegram_chat_id } = req.body;
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ success: false, error: 'Le panier est vide' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Une adresse email valide est requise' });
        }
        // 1. Fetch current live products to verify prices and stock
        const { products } = await sellauthService.getProducts();
        let eurTotal = 0;
        const orderItems = [];
        // Check reseller status
        const reseller = telegram_chat_id ? getReseller(telegram_chat_id) : undefined;
        const resellerDiscount = reseller ? reseller.discountPercentage : 0;
        if (telegram_chat_id) {
            recordTelegramUser(telegram_chat_id);
        }
        for (const item of cart) {
            const prod = products.find(p => p.id === item.productId);
            if (!prod) {
                return res.status(400).json({ success: false, error: 'Produit introuvable (ID: ' + item.productId + ')' });
            }
            const variant = prod.variants?.find(v => v.id === item.variantId) || prod.variants?.[0];
            let itemPrice = parseFloat(variant?.price || prod.price || '0');
            const qty = item.quantity || 1;
            // Apply reseller discount if eligible
            if (resellerDiscount > 0) {
                itemPrice = Math.round((itemPrice * (1 - resellerDiscount / 100)) * 100) / 100;
            }
            eurTotal += itemPrice * qty;
            orderItems.push({
                productId: prod.id,
                variantId: variant?.id,
                name: prod.name,
                variantName: variant?.name,
                priceEur: itemPrice,
                quantity: qty
            });
        }
        // 2. Compute Stars price with 30% buffer:
        // With 30% Apple/Google fee coverage: 1 EUR = ~65 Stars. Minimum 10 Stars.
        const rawStars = Math.round(eurTotal * 65);
        const starsAmount = Math.max(10, rawStars);
        const orderId = 'stars_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        // 3. Save order record in memory and persistent storage
        const orderData = {
            orderId,
            chatId: telegram_chat_id || 0,
            email,
            items: orderItems,
            eurTotal,
            starsAmount,
            status: 'pending',
            createdAt: new Date().toISOString(),
            isReseller: !!reseller,
            discountApplied: resellerDiscount
        };
        starsOrders.set(orderId, orderData);
        saveStarsOrder(orderData);
        // 4. Generate official Telegram Stars invoice link via bot API
        const itemNames = orderItems.map(i => i.name + ' x' + i.quantity).join(', ');
        const shortTitle = (itemNames.length > 30 ? itemNames.substring(0, 27) + '...' : itemNames) || 'Commande Tekaz';
        const invoiceLink = await bot.api.createInvoiceLink(shortTitle, 'Commande Tekaz Market - Livraison 24/7 pour ' + email, JSON.stringify({ orderId, email }), '', // provider_token must be empty string for XTR (Telegram Stars)
        'XTR', [
            {
                label: shortTitle,
                amount: starsAmount
            }
        ]);
        res.json({
            success: true,
            orderId,
            starsPrice: starsAmount,
            eurTotal,
            invoiceLink,
            isReseller: !!reseller,
            discountApplied: resellerDiscount
        });
    }
    catch (err) {
        console.error('Stars checkout error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/orders/stars/:orderId
apiRouter.get('/orders/stars/:orderId', async (req, res) => {
    try {
        const orderId = String(req.params.orderId);
        let order = starsOrders.get(orderId);
        if (!order) {
            order = getStarsOrder(orderId);
        }
        if (!order) {
            return res.status(404).json({ success: false, error: 'Commande introuvable' });
        }
        res.json({
            success: true,
            isPaid: order.status === 'paid',
            order
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/invoices/:id
apiRouter.get('/invoices/:id', async (req, res) => {
    try {
        const invoice = await sellauthService.getInvoice(String(req.params.id));
        res.json({ success: true, invoice });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
/* ============================================================
   ADMIN ROUTES
============================================================ */
// GET /api/admin/stats
apiRouter.get('/admin/stats', async (req, res) => {
    try {
        const telegramId = (req.query.telegram_id || req.headers['x-telegram-id']);
        const username = (req.query.username || req.headers['x-telegram-username']);
        if (!checkIsAdmin(telegramId, username)) {
            return res.status(403).json({ success: false, error: 'Accès administrateur refusé' });
        }
        const { total: totalInvoices, invoices } = await sellauthService.getRecentInvoices(1, 50);
        const starsOrdersList = getAllStarsOrders();
        const resellers = getAllResellers();
        const stockItems = getAllStock();
        const paidStarsOrders = starsOrdersList.filter(o => o.status === 'paid');
        const totalStarsRevenue = paidStarsOrders.reduce((acc, o) => acc + o.starsAmount, 0);
        const totalEurRevenueStars = paidStarsOrders.reduce((acc, o) => acc + o.eurTotal, 0);
        const paidSellauth = invoices.filter((i) => i.status === 'completed' || i.status === 'paid');
        const totalEurSellauth = paidSellauth.reduce((acc, i) => acc + parseFloat(i.price || '0'), 0);
        const totalStockCount = stockItems.reduce((acc, s) => acc + (s.serials?.length || 0), 0);
        res.json({
            success: true,
            stats: {
                totalSellauthOrders: totalInvoices,
                totalStarsOrders: starsOrdersList.length,
                paidStarsOrders: paidStarsOrders.length,
                totalStarsRevenue,
                totalEurRevenueStars,
                totalEurSellauth,
                totalResellers: resellers.length,
                totalStockSerials: totalStockCount
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/admin/orders
apiRouter.get('/admin/orders', async (req, res) => {
    try {
        const telegramId = (req.query.telegram_id || req.headers['x-telegram-id']);
        const username = (req.query.username || req.headers['x-telegram-username']);
        if (!checkIsAdmin(telegramId, username)) {
            return res.status(403).json({ success: false, error: 'Accès administrateur refusé' });
        }
        const { invoices } = await sellauthService.getRecentInvoices(1, 30);
        const starsOrdersList = getAllStarsOrders();
        res.json({
            success: true,
            sellauthOrders: invoices,
            starsOrders: starsOrdersList
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/admin/resellers
apiRouter.get('/admin/resellers', async (req, res) => {
    try {
        const telegramId = (req.query.telegram_id || req.headers['x-telegram-id']);
        const username = (req.query.username || req.headers['x-telegram-username']);
        if (!checkIsAdmin(telegramId, username)) {
            return res.status(403).json({ success: false, error: 'Accès administrateur refusé' });
        }
        const resellers = getAllResellers();
        res.json({
            success: true,
            resellers,
            defaultDiscount: getDefaultDiscount()
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/admin/resellers
apiRouter.post('/admin/resellers', async (req, res) => {
    try {
        const { adminTelegramId, adminUsername, telegramId, name, discountPercentage, note } = req.body;
        if (!checkIsAdmin(adminTelegramId, adminUsername)) {
            return res.status(403).json({ success: false, error: 'Accès administrateur refusé' });
        }
        if (!telegramId) {
            return res.status(400).json({ success: false, error: 'Telegram User ID requis' });
        }
        const reseller = addReseller(telegramId, name, discountPercentage ? Number(discountPercentage) : undefined, note);
        res.json({ success: true, reseller });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// DELETE /api/admin/resellers/:telegramId
apiRouter.delete('/admin/resellers/:telegramId', async (req, res) => {
    try {
        const adminTelegramId = (req.query.adminTelegramId || req.headers['x-telegram-id']);
        const adminUsername = (req.query.adminUsername || req.headers['x-telegram-username']);
        if (!checkIsAdmin(adminTelegramId, adminUsername)) {
            return res.status(403).json({ success: false, error: 'Accès administrateur refusé' });
        }
        const targetId = String(req.params.telegramId);
        const removed = removeReseller(targetId);
        res.json({ success: true, removed });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/admin/stock/add
apiRouter.post('/admin/stock/add', async (req, res) => {
    try {
        const { adminTelegramId, adminUsername, productId, variantId, lines } = req.body;
        if (!checkIsAdmin(adminTelegramId, adminUsername)) {
            return res.status(403).json({ success: false, error: 'Accès administrateur refusé' });
        }
        const pId = parseInt(productId, 10);
        if (isNaN(pId)) {
            return res.status(400).json({ success: false, error: 'ID de produit invalide' });
        }
        const { products } = await sellauthService.getProducts();
        const prod = products.find(p => p.id === pId);
        if (!prod) {
            return res.status(404).json({ success: false, error: 'Produit introuvable sur SellAuth' });
        }
        const vId = variantId ? parseInt(variantId, 10) : undefined;
        const variant = vId ? prod.variants?.find(v => v.id === vId) : undefined;
        const rawLines = Array.isArray(lines) ? lines : String(lines).split('\n');
        const result = addStock(pId, prod.name, vId, variant?.name, rawLines);
        res.json({ success: true, result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/admin/stock/clear
apiRouter.post('/admin/stock/clear', async (req, res) => {
    try {
        const { adminTelegramId, adminUsername, productId, variantId } = req.body;
        if (!checkIsAdmin(adminTelegramId, adminUsername)) {
            return res.status(403).json({ success: false, error: 'Accès administrateur refusé' });
        }
        const pId = parseInt(productId, 10);
        const vId = variantId ? parseInt(variantId, 10) : undefined;
        const cleared = clearStock(pId, vId);
        res.json({ success: true, cleared });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/webhook/sellauth
apiRouter.post('/webhook/sellauth', async (req, res) => {
    try {
        const event = req.body;
        console.log('SellAuth Webhook received:', event?.event || 'unknown event');
        if (event && (event.event === 'invoice.completed' || event.event === 'invoice.paid')) {
            const invoice = event.data || event.invoice;
            if (invoice && invoice.id) {
                const chatId = invoiceToTelegramMap.get(invoice.id);
                if (chatId) {
                    await notifyUserOrderCompleted(chatId, invoice);
                    invoiceToTelegramMap.delete(invoice.id);
                }
            }
        }
        res.json({ received: true });
    }
    catch (err) {
        console.error('Webhook error:', err.message);
        res.status(500).json({ error: err.message });
    }
});
