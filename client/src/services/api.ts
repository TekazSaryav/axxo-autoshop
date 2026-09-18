import type { Product, Category, ShopInfo, UserStatus, AdminStats, Reseller, TelegramUserRecord } from '../types.js';

// Helper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function fetchShopInfo(): Promise<ShopInfo> {
  try {
    const res = await fetchWithTimeout('/api/shop', {}, 8000);
    const data = await res.json();
    if (res.ok && data.success && data.shop) {
      try { localStorage.setItem('tekaz_cached_shop', JSON.stringify(data.shop)); } catch {}
      return data.shop;
    }
  } catch (e) {
    console.warn('Shop info fetch failed, trying cache:', e);
  }

  // Fallback to cache
  try {
    const cached = localStorage.getItem('tekaz_cached_shop');
    if (cached) return JSON.parse(cached);
  } catch {}

  return {
    id: 147681,
    name: 'Tekaz Market',
    domain: 'tekaz.xyz',
    currency: 'EUR',
    logo_url: null,
    banner_url: null,
    description: 'Boutique automatisée 24/7'
  };
}

export async function fetchProducts(refresh = false): Promise<{ products: Product[]; categories: Category[] }> {
  let lastError: any = null;

  // Try up to 2 attempts
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const url = `/api/products${refresh ? '?refresh=true' : ''}`;
      const res = await fetchWithTimeout(url, {}, 12000);
      const data = await res.json();
      if (res.ok && data.success && data.products) {
        // Cache products and categories in localStorage for offline/cold-start instant recovery
        try {
          localStorage.setItem('tekaz_cached_products', JSON.stringify({
            products: data.products,
            categories: data.categories,
            time: Date.now()
          }));
        } catch {}
        return {
          products: data.products,
          categories: data.categories || []
        };
      }
      throw new Error(data.error || `Erreur serveur HTTP ${res.status}`);
    } catch (err: any) {
      lastError = err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }

  // If network failed (Render cold start or mobile network hiccup), check localStorage cache
  try {
    const cachedStr = localStorage.getItem('tekaz_cached_products');
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (cached.products && cached.products.length > 0) {
        console.warn('Serving products from local cache following network error:', lastError);
        return {
          products: cached.products,
          categories: cached.categories || []
        };
      }
    }
  } catch {}

  throw new Error(lastError?.message || 'Impossible de charger le catalogue. Veuillez vérifier votre connexion.');
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

export async function fetchUserStatus(
  telegramId?: number,
  username?: string,
  firstName?: string,
  lastName?: string,
  languageCode?: string
): Promise<UserStatus> {
  const params = new URLSearchParams();
  if (telegramId) params.append('telegram_id', String(telegramId));
  if (username) params.append('username', username);
  if (firstName) params.append('first_name', firstName);
  if (lastName) params.append('last_name', lastName);
  if (languageCode) params.append('language_code', languageCode);

  const res = await fetch(`/api/user/status?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { isAdmin: false, isReseller: false, discountPercentage: 0 };
  }
  return data;
}

export async function fetchAdminUsers(telegramId?: number, username?: string): Promise<{ count: number; users: TelegramUserRecord[] }> {
  const params = new URLSearchParams();
  if (telegramId) params.append('telegram_id', String(telegramId));
  if (username) params.append('username', username);

  const res = await fetch(`/api/admin/users?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch admin users');
  }
  return { count: data.count, users: data.users || [] };
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

