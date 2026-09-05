import { Router, Request, Response } from 'express';
import { sellauthService } from './sellauth.js';
import { notifyUserOrderCompleted } from './bot.js';

export const apiRouter = Router();

// Store mapping of invoice_id -> telegram_chat_id in memory for instant notification
const invoiceToTelegramMap = new Map<string | number, number | string>();

// GET /api/shop
apiRouter.get('/shop', async (_req: Request, res: Response) => {
  try {
    const shop = await sellauthService.getShopInfo();
    res.json({ success: true, shop });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const refresh = req.query.refresh === 'true';
    const data = await sellauthService.getProducts(refresh);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/checkout
apiRouter.post('/checkout', async (req: Request, res: Response) => {
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
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/invoices/:id
apiRouter.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id as string;
    const invoice = await sellauthService.getInvoice(invoiceId);
    res.json({ success: true, invoice });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

// POST /api/webhook/sellauth
apiRouter.post('/webhook/sellauth', async (req: Request, res: Response) => {
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
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
