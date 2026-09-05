import { config } from './config.js';

export interface Variant {
  id: number;
  product_id: number;
  name: string;
  price: string;
  stock: number | null; // null or -1 means unlimited
  description?: string | null;
}

export interface Product {
  id: number;
  name: string;
  path?: string;
  description: string;
  price?: string | null;
  currency: string;
  category?: {
    id: number;
    name: string;
    path: string;
  } | null;
  images: Array<{
    id: number;
    url: string;
  }>;
  variants: Variant[];
  stock_count: number | null;
  deliverables_type?: string;
}

export interface ShopInfo {
  id: number;
  name: string;
  url: string;
  currency: string;
  logo_url: string | null;
  payment_methods: Array<{
    id: number;
    type: string;
    name: string;
    checkout_name: string;
    is_active: boolean;
    icon_image_url?: string | null;
  }>;
}

let cachedProducts: Product[] | null = null;
let lastProductsFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

class SellAuthService {
  private get headers() {
    return {
      'Authorization': `Bearer ${config.sellauthApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async getShopInfo(): Promise<ShopInfo> {
    try {
      const res = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}`, {
        headers: this.headers
      });
      if (!res.ok) {
        throw new Error(`SellAuth API error: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as any;
      return {
        id: data.id,
        name: data.name || 'Tekaz Store',
        url: data.url || `https://${config.shopDomain}`,
        currency: data.currency || 'EUR',
        logo_url: data.logo_image_url || data.logo_image?.url || null,
        payment_methods: (data.payment_methods || []).filter((pm: any) => pm.is_active)
      };
    } catch (err: any) {
      console.error('Error fetching shop info:', err.message);
      return {
        id: parseInt(config.sellauthShopId),
        name: 'Tekaz Store',
        url: `https://${config.shopDomain}`,
        currency: 'EUR',
        logo_url: null,
        payment_methods: []
      };
    }
  }

  async getProducts(forceRefresh = false): Promise<{ products: Product[]; categories: Array<{ id: number; name: string; count: number }> }> {
    const now = Date.now();
    if (!forceRefresh && cachedProducts && (now - lastProductsFetchTime < CACHE_TTL_MS)) {
      return this.formatProductsResponse(cachedProducts);
    }

    try {
      let allProducts: Product[] = [];
      let page = 1;
      let lastPage = 1;

      // Fetch first page and determine total pages
      const firstRes = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/products?page=1&per_page=50`, {
        headers: this.headers
      });

      if (!firstRes.ok) {
        throw new Error(`SellAuth API error: ${firstRes.status} ${firstRes.statusText}`);
      }

      const firstData = (await firstRes.json()) as any;
      allProducts = allProducts.concat(firstData.data || []);
      lastPage = firstData.last_page || 1;

      // Fetch remaining pages if any
      if (lastPage > 1) {
        const pagePromises = [];
        for (let p = 2; p <= Math.min(lastPage, 5); p++) {
          pagePromises.push(
            fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/products?page=${p}&per_page=50`, {
              headers: this.headers
            }).then(r => r.json())
          );
        }
        const results = await Promise.all(pagePromises);
        for (const res of results) {
          if (res.data) {
            allProducts = allProducts.concat(res.data);
          }
        }
      }

      cachedProducts = allProducts;
      lastProductsFetchTime = now;
      return this.formatProductsResponse(allProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err.message);
      if (cachedProducts) {
        return this.formatProductsResponse(cachedProducts);
      }
      throw err;
    }
  }

  private formatProductsResponse(products: Product[]) {
    // Collect distinct categories
    const categoryMap = new Map<number, { id: number; name: string; count: number }>();

    for (const p of products) {
      if (p.category && p.category.id) {
        const existing = categoryMap.get(p.category.id);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(p.category.id, {
            id: p.category.id,
            name: p.category.name,
            count: 1
          });
        }
      }
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);

    return {
      products,
      categories
    };
  }

  async createCheckout(cart: Array<{ productId: number; variantId?: number; quantity: number }>, email: string) {
    try {
      const res = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/checkout`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          cart,
          email
        })
      });

      const data = (await res.json()) as any;

      if (!res.ok || !data.success) {
        const errorMsg = data.error || data.message || 'Impossible de créer la session de commande';
        throw new Error(errorMsg);
      }

      return {
        success: true,
        invoice_id: data.invoice_id,
        invoice_url: data.invoice_url || data.url,
        url: data.url || data.invoice_url
      };
    } catch (err: any) {
      console.error('Checkout error:', err.message);
      throw err;
    }
  }

  async getInvoice(invoiceId: string | number) {
    try {
      const res = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/invoices/${invoiceId}`, {
        headers: this.headers
      });

      if (!res.ok) {
        throw new Error(`SellAuth Invoice API error: ${res.status}`);
      }

      const data = (await res.json()) as any;
      return {
        id: data.id,
        unique_id: data.unique_id,
        status: data.status, // created, paid, completed, cancelled, etc.
        price: data.price,
        currency: data.currency,
        email: data.email,
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          name: item.product?.name || item.custom_name,
          variant: item.variant?.name,
          price: item.price,
          quantity: item.quantity,
          delivered: item.delivered
        })),
        delivered: data.delivered,
        created_at: data.created_at,
        completed_at: data.completed_at
      };
    } catch (err: any) {
      console.error('Error fetching invoice:', err.message);
      throw err;
    }
  }
}

export const sellauthService = new SellAuthService();
