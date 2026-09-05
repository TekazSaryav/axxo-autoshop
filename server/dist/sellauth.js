import { config } from './config.js';
let cachedProducts = null;
let cachedCategories = null;
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
        if (!forceRefresh && cachedProducts && cachedCategories && (now - lastProductsFetchTime < CACHE_TTL_MS)) {
            return {
                products: cachedProducts,
                categories: cachedCategories
            };
        }
        try {
            // 1. Fetch categories to get exact dashboard order
            let officialCategories = [];
            const catOrderMap = new Map();
            try {
                const catRes = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/categories`, {
                    headers: this.headers
                });
                if (catRes.ok) {
                    const catData = (await catRes.json());
                    const rawCats = catData.data || [];
                    // Sort categories strictly by their defined order
                    rawCats.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
                    for (const c of rawCats) {
                        catOrderMap.set(c.id, c.order ?? 999);
                        officialCategories.push({
                            id: c.id,
                            name: c.name,
                            order: c.order ?? 999,
                            count: 0
                        });
                    }
                }
            }
            catch (catErr) {
                console.warn('Could not fetch official categories, fallback to product categories:', catErr);
            }
            // 2. Fetch all products (pages 1 to N)
            let allProducts = [];
            const firstRes = await fetch(`${config.sellauthBaseUrl}/shops/${config.sellauthShopId}/products?page=1&per_page=50`, {
                headers: this.headers
            });
            if (!firstRes.ok) {
                throw new Error(`SellAuth API error: ${firstRes.status} ${firstRes.statusText}`);
            }
            const firstData = (await firstRes.json());
            allProducts = allProducts.concat(firstData.data || []);
            const lastPage = firstData.last_page || 1;
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
            // 3. Count products per category
            const counts = new Map();
            for (const p of allProducts) {
                const catId = p.category?.id || p.category_id;
                if (catId) {
                    counts.set(catId, (counts.get(catId) || 0) + 1);
                }
            }
            for (const cat of officialCategories) {
                cat.count = counts.get(cat.id) || 0;
            }
            // 4. Sort products in the exact merchant order:
            // First by Category Order (Streaming: 0, AI: 1, VPN: 2...), then by product sort_priority (0, 1, 2, 3...)
            allProducts.sort((a, b) => {
                const catIdA = a.category?.id || a.category_id;
                const catIdB = b.category?.id || b.category_id;
                const orderA = catIdA ? (catOrderMap.get(catIdA) ?? 999) : 999;
                const orderB = catIdB ? (catOrderMap.get(catIdB) ?? 999) : 999;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                // Within same category, sort by sort_priority
                const prioA = (a.sort_priority !== undefined && a.sort_priority !== null) ? a.sort_priority : 999;
                const prioB = (b.sort_priority !== undefined && b.sort_priority !== null) ? b.sort_priority : 999;
                if (prioA !== prioB) {
                    return prioA - prioB;
                }
                return a.id - b.id;
            });
            cachedProducts = allProducts;
            cachedCategories = officialCategories;
            lastProductsFetchTime = now;
            return {
                products: allProducts,
                categories: officialCategories
            };
        }
        catch (err) {
            console.error('Error fetching products:', err.message);
            if (cachedProducts && cachedCategories) {
                return {
                    products: cachedProducts,
                    categories: cachedCategories
                };
            }
            throw err;
        }
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
