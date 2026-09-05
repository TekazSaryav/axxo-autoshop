import type { Product, Category, ShopInfo } from '../types.js';

export async function fetchShopInfo(): Promise<ShopInfo> {
  const res = await fetch('/api/shop');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch shop info');
  }
  return data.shop;
}

export async function fetchProducts(refresh = false): Promise<{ products: Product[]; categories: Category[] }> {
  const res = await fetch(`/api/products${refresh ? '?refresh=true' : ''}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch products');
  }
  return {
    products: data.products,
    categories: data.categories
  };
}

export async function createCheckout(
  cart: Array<{ productId: number; variantId?: number; quantity: number }>,
  email: string,
  telegramChatId?: number | string
): Promise<{ invoice_id: number; invoice_url: string; url: string }> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cart,
      email,
      telegram_chat_id: telegramChatId
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Checkout failed');
  }
  return data;
}

export async function fetchInvoice(invoiceId: string | number) {
  const res = await fetch(`/api/invoices/${invoiceId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch invoice');
  }
  return data.invoice;
}
