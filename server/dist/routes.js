import { Router } from 'express';
import { sellauthService } from './sellauth.js';
import { notifyUserOrderCompleted } from './bot.js';
export const apiRouter = Router();
// Store mapping of invoice_id -> telegram_chat_id in memory for instant notification
const invoiceToTelegramMap = new Map();
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
        // If customer provided their telegram chat id, remember it for webhook delivery
        if (telegram_chat_id && checkoutResult.invoice_id) {
            invoiceToTelegramMap.set(checkoutResult.invoice_id, telegram_chat_id);
        }
        res.json({
            success: true,
            invoice_id: checkoutResult.invoice_id,
            invoice_url: checkoutResult.invoice_url,
            url: checkoutResult.url
        });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// POST /api/checkout/stars (Telegram Stars Checkout)
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
        for (const item of cart) {
            const prod = products.find(p => p.id === item.productId);
            if (!prod) {
                return res.status(400).json({ success: false, error: `Produit introuvable (ID: ${item.productId})` });
            }
            const variant = prod.variants?.find(v => v.id === item.variantId) || prod.variants?.[0];
            const itemPrice = parseFloat(variant?.price || prod.price || '0');
            const qty = item.quantity || 1;
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
        // Base: 1 EUR ~ 50 Stars.
        // With 30% Apple/Google fee coverage: 1 EUR = ~65 Stars. Minimum 10 Stars.
        const rawStars = Math.round(eurTotal * 65);
        const starsAmount = Math.max(10, rawStars);
        const orderId = `stars_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        // 3. Save order record in memory
        const { bot, starsOrders } = await import('./bot.js');
        starsOrders.set(orderId, {
            orderId,
            chatId: telegram_chat_id || 0,
            email,
            items: orderItems,
            eurTotal,
            starsAmount,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        // 4. Generate official Telegram Stars invoice link via bot API
        const itemNames = orderItems.map(i => `${i.name} x${i.quantity}`).join(', ');
        const shortTitle = (itemNames.length > 30 ? itemNames.substring(0, 27) + '...' : itemNames) || 'Commande Tekaz';
        const invoiceLink = await bot.api.createInvoiceLink(shortTitle, `Commande Tekaz Market - Livraison 24/7 pour ${email}`, JSON.stringify({ orderId, email }), '', // provider_token must be empty string for XTR (Telegram Stars)
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
            invoiceLink
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
        const { starsOrders } = await import('./bot.js');
        const order = starsOrders.get(String(req.params.orderId));
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
        const invoiceId = req.params.id;
        const invoice = await sellauthService.getInvoice(invoiceId);
        res.json({ success: true, invoice });
    }
    catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
});
// POST /api/webhook/sellauth
apiRouter.post('/webhook/sellauth', async (req, res) => {
    try {
        const event = req.body;
        console.log('🔔 SellAuth Webhook received:', event?.event || event?.type || 'Event');
        // SellAuth passes invoice data on payment
        const invoice = event.invoice || event.data;
        if (invoice && (invoice.status === 'completed' || invoice.status === 'paid' || event.event === 'invoice.completed')) {
            const invoiceId = invoice.id;
            const chatId = invoiceToTelegramMap.get(invoiceId);
            if (chatId) {
                // Fetch full invoice with deliverables
                const fullInvoice = await sellauthService.getInvoice(invoiceId);
                await notifyUserOrderCompleted(chatId, fullInvoice);
                invoiceToTelegramMap.delete(invoiceId);
            }
        }
        res.json({ received: true });
    }
    catch (err) {
        console.error('Webhook error:', err.message);
        res.status(500).json({ error: err.message });
    }
});
