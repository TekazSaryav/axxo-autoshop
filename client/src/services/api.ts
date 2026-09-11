import type { Product, Category, ShopInfo, UserStatus, AdminStats, Reseller } from '../types.js';

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

export async function createStarsCheckout(
  cart: Array<{ productId: number; variantId?: number; quantity: number }>,
  email: string,
  telegramChatId?: number | string
): Promise<{ success: boolean; invoiceLink: string; starsPrice: number; orderId: string }> {
  const res = await fetch('/api/checkout/stars', {
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
    throw new Error(data.error || 'Stars Checkout failed');
  }
  return data;
}

export async function checkStarsPayment(orderId: string): Promise<{ success: boolean; isPaid: boolean; order?: any }> {
  const res = await fetch(`/api/orders/stars/${orderId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Check failed');
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

export async function fetchFeedbacks(): Promise<{
  feedbacks: Array<{ id: number; rating: number; message: string | null; date: string; product: string }>;
  total: number;
  averageRating: number;
  restocks: Array<{ id: number; name: string; price: string; stock: number | null; category: string; updated_at: string }>;
}> {
  const res = await fetch('/api/feedbacks');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch feedbacks');
  }
  return data;
}

export async function fetchUserStatus(telegramId?: number, username?: string): Promise<UserStatus> {
  const params = new URLSearchParams();
  if (telegramId) params.append('telegram_id', String(telegramId));
  if (username) params.append('username', username);

  const res = await fetch(`/api/user/status?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { isAdmin: false, isReseller: false, discountPercentage: 0 };
  }
  return data;
}

export async function fetchAdminStats(telegramId?: number, username?: string): Promise<AdminStats> {
  const params = new URLSearchParams();
  if (telegramId) params.append('telegram_id', String(telegramId));
  if (username) params.append('username', username);

  const res = await fetch(`/api/admin/stats?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch admin stats');
  }
  return data.stats;
}

export async function fetchAdminOrders(telegramId?: number, username?: string): Promise<{ sellauthOrders: any[]; starsOrders: any[] }> {
  const params = new URLSearchParams();
  if (telegramId) params.append('telegram_id', String(telegramId));
  if (username) params.append('username', username);

  const res = await fetch(`/api/admin/orders?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch admin orders');
  }
  return {
    sellauthOrders: data.sellauthOrders || [],
    starsOrders: data.starsOrders || []
  };
}

export async function fetchAdminResellers(telegramId?: number, username?: string): Promise<{ resellers: Reseller[]; defaultDiscount: number }> {
  const params = new URLSearchParams();
  if (telegramId) params.append('telegram_id', String(telegramId));
  if (username) params.append('username', username);

  const res = await fetch(`/api/admin/resellers?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch admin resellers');
  }
  return {
    resellers: data.resellers || [],
    defaultDiscount: data.defaultDiscount || 20
  };
}

export async function addAdminReseller(
  adminTelegramId?: number,
  adminUsername?: string,
  resellerData?: { telegramId: string; name?: string; discountPercentage?: number; note?: string }
): Promise<Reseller> {
  const res = await fetch('/api/admin/resellers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminTelegramId,
      adminUsername,
      ...resellerData
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to add reseller');
  }
  return data.reseller;
}

export async function deleteAdminReseller(
  adminTelegramId?: number,
  adminUsername?: string,
  targetTelegramId?: string
): Promise<boolean> {
  const params = new URLSearchParams();
  if (adminTelegramId) params.append('adminTelegramId', String(adminTelegramId));
  if (adminUsername) params.append('adminUsername', adminUsername);

  const res = await fetch(`/api/admin/resellers/${targetTelegramId}?${params.toString()}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete reseller');
  }
  return data.removed;
}

export async function addAdminStock(
  adminTelegramId: number | undefined,
  adminUsername: string | undefined,
  productId: number,
  variantId: number | undefined,
  lines: string[]
): Promise<{ added: number; total: number }> {
  const res = await fetch('/api/admin/stock/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminTelegramId,
      adminUsername,
      productId,
      variantId,
      lines
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to add stock');
  }
  return data.result;
}

export async function clearAdminStock(
  adminTelegramId: number | undefined,
  adminUsername: string | undefined,
  productId: number,
  variantId?: number
): Promise<boolean> {
  const res = await fetch('/api/admin/stock/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminTelegramId,
      adminUsername,
      productId,
      variantId
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to clear stock');
  }
  return data.cleared;
}

