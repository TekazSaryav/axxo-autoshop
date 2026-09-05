import { config } from './config.js';
let cachedProducts = null;
let lastProductsFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
class SellAuthService {
    get headers() {
        return {
            'Authorization': `Bearer ${config.sellauthApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
    async getShopInfo() {
        try {
            const res = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}`, {
                headers: this.headers
            });
            if (!res.ok) {
                throw new Error(`SellAuth API error: ${res.status} ${res.statusText}`);
            }
            const data = (await res.json());
            return {
                id: data.id,
                name: data.name || 'Tekaz Store',
                url: data.url || `https://${config.shopDomain}`,
                currency: data.currency || 'EUR',
                logo_url: data.logo_image_url || data.logo_image?.url || null,
                payment_methods: (data.payment_methods || []).filter((pm) => pm.is_active)
            };
        }
        catch (err) {
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
    async getProducts(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && cachedProducts && (now - lastProductsFetchTime < CACHE_TTL_MS)) {
            return this.formatProductsResponse(cachedProducts);
        }
        try {
            let allProducts = [];
            let page = 1;
            let lastPage = 1;
            // Fetch first page and determine total pages
            const firstRes = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/products?page=1&per_page=50`, {
                headers: this.headers
            });
            if (!firstRes.ok) {
                throw new Error(`SellAuth API error: ${firstRes.status} ${firstRes.statusText}`);
            }
            const firstData = (await firstRes.json());
            allProducts = allProducts.concat(firstData.data || []);
            lastPage = firstData.last_page || 1;
            // Fetch remaining pages if any
            if (lastPage > 1) {
                const pagePromises = [];
                for (let p = 2; p <= Math.min(lastPage, 5); p++) {
                    pagePromises.push(fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/products?page=${p}&per_page=50`, {
                        headers: this.headers
                    }).then(r => r.json()));
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
        }
        catch (err) {
            console.error('Error fetching products:', err.message);
            if (cachedProducts) {
                return this.formatProductsResponse(cachedProducts);
            }
            throw err;
        }
    }
    formatProductsResponse(products) {
        // Collect distinct categories
        const categoryMap = new Map();
        for (const p of products) {
            if (p.category && p.category.id) {
                const existing = categoryMap.get(p.category.id);
                if (existing) {
                    existing.count++;
                }
                else {
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
    async createCheckout(cart, email) {
        try {
            const res = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/checkout`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    cart,
                    email
                })
            });
            const data = (await res.json());
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
        }
        catch (err) {
            console.error('Checkout error:', err.message);
            throw err;
        }
    }
    async getInvoice(invoiceId) {
        try {
            const res = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/invoices/${invoiceId}`, {
                headers: this.headers
            });
            if (!res.ok) {
                throw new Error(`SellAuth Invoice API error: ${res.status}`);
            }
            const data = (await res.json());
            return {
                id: data.id,
                unique_id: data.unique_id,
                status: data.status, // created, paid, completed, cancelled, etc.
                price: data.price,
                currency: data.currency,
                email: data.email,
                items: (data.items || []).map((item) => ({
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
        }
        catch (err) {
            console.error('Error fetching invoice:', err.message);
            throw err;
        }
    }
}
export const sellauthService = new SellAuthService();
