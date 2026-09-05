import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram.js';
import { fetchShopInfo, fetchProducts, createCheckout } from './services/api.js';
import type { Product, Variant, Category, CartItem, ShopInfo, SavedOrder } from './types.js';

import { Navbar } from './components/Navbar.js';
import { CategoryTabs } from './components/CategoryTabs.js';
import { SearchBar } from './components/SearchBar.js';
import { ProductCard } from './components/ProductCard.js';
import { ProductModal } from './components/ProductModal.js';
import { CartDrawer } from './components/CartDrawer.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { OrdersTab } from './components/OrdersTab.js';

import { Sparkles, ShieldCheck, Zap, RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const { user, haptic, openLink } = useTelegram();

  // Shop & catalog state
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeCheckout, setActiveCheckout] = useState<{ invoiceId: number; invoiceUrl: string } | null>(null);

  // Cart state persisted
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('tekaz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders history persisted
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('tekaz_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tekaz_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('tekaz_orders', JSON.stringify(savedOrders));
  }, [savedOrders]);

  // Fetch shop and products data
  const loadData = useCallback(async (refresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const [shopData, productsData] = await Promise.all([
        fetchShopInfo().catch(() => null),
        fetchProducts(refresh)
      ]);
      if (shopData) setShop(shopData);
      setProducts(productsData.products);
      setCategories(productsData.categories);
    } catch (err: any) {
      console.error('Failed to load shop catalog:', err);
      setError(err.message || 'Impossible de charger les articles de la boutique');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cart operations
  const handleAddToCart = (product: Product, variant: Variant, quantity = 1) => {
    haptic.medium();
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.variant.id === variant.id
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, variant, quantity }];
    });
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    haptic.light();
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    haptic.selection();
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDirectBuy = (product: Product, variant: Variant, quantity = 1) => {
    handleAddToCart(product, variant, quantity);
    setIsCartOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    const defaultVariant = product.variants?.find((v) => v.stock === null || v.stock === -1 || v.stock > 0) || product.variants?.[0];
    if (!defaultVariant) return;
    handleAddToCart(product, defaultVariant, 1);
  };

  // Checkout execution
  const handleCheckout = async (email: string) => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    haptic.medium();

    try {
      const formattedCart = cart.map((item) => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity
      }));

      const res = await createCheckout(formattedCart, email, user?.id);

      // Save order to history
      const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.variant.price || '0') * item.quantity, 0);
      const newOrder: SavedOrder = {
        invoiceId: res.invoice_id,
        url: res.url || res.invoice_url,
        email,
        date: new Date().toISOString(),
        total: totalAmount,
        currency: shop?.currency || 'EUR',
        items: cart.map((i) => ({
          title: i.product.name,
          variant: i.variant.name,
          quantity: i.quantity
        })),
        status: 'created'
      };

      setSavedOrders((prev) => [newOrder, ...prev]);

      // Clear cart
      setCart([]);
      setIsCartOpen(false);

      // Open checkout modal
      setActiveCheckout({
        invoiceId: res.invoice_id,
        invoiceUrl: res.url || res.invoice_url
      });
      haptic.success();
    } catch (err: any) {
      haptic.error();
      alert(`Erreur lors de la commande : ${err.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== null && product.category?.id !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q);
        const matchesCategory = product.category?.name.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-between pb-12">
      {/* Top Navigation */}
      <Navbar
        shop={shop}
        user={user}
        cartCount={totalCartItems}
        onOpenCart={() => {
          haptic.selection();
          setIsCartOpen(true);
        }}
        onOpenOrders={() => {
          haptic.selection();
          setIsOrdersOpen(true);
        }}
      />

      <main className="max-w-4xl mx-auto w-full flex-1">
        {/* Hero Banner */}
        <section className="p-4">
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/20 shadow-xl shadow-indigo-950/50">
            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Autoshop Automatisé 24h/24 & 7j/7</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                Le meilleur des comptes, licences & boosts
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1.5 leading-relaxed">
                Paiement instantané par Crypto (BTC, LTC, SOL) ou Carte Bancaire avec délivrance automatique immédiate.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-gray-300 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Garantie SellAuth
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Livraison instantanée
                </span>
              </div>
            </div>

            {/* Decorative background glow */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          </div>
        </section>

        {/* Search Bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Categories Bar */}
        {categories.length > 0 && (
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => {
              haptic.selection();
              setSelectedCategory(id);
            }}
            totalProducts={products.length}
          />
        )}

        {/* Products Grid */}
        <section className="px-4 py-2">
          {isLoading ? (
            /* Loading skeletons */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-3 animate-pulse space-y-3">
                  <div className="w-full aspect-[16/10] bg-gray-800/60 rounded-xl" />
                  <div className="h-4 bg-gray-800/80 rounded w-3/4" />
                  <div className="h-3 bg-gray-800/50 rounded w-1/2" />
                  <div className="h-8 bg-gray-800/80 rounded-xl mt-2" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error state with retry */
            <div className="glass-card rounded-3xl p-8 text-center my-6 max-w-md mx-auto space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="font-bold text-base text-white">Erreur de chargement</h3>
              <p className="text-xs text-gray-400">{error}</p>
              <button
                onClick={() => loadData(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réessayer
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty state */
            <div className="glass-card rounded-3xl p-10 text-center my-6 space-y-2">
              <p className="font-semibold text-gray-300">Aucun produit ne correspond à votre recherche</p>
              <p className="text-xs text-gray-500">Essayez un autre mot-clé ou réinitialisez les filtres.</p>
              {(searchQuery || selectedCategory !== null) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="mt-2 text-xs font-semibold text-indigo-400 hover:underline"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            /* Product cards */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={(p) => {
                    haptic.selection();
                    setSelectedProduct(p);
                  }}
                  onQuickAdd={(p) => handleQuickAdd(p)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onDirectBuy={handleDirectBuy}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currency={shop?.currency || 'EUR'}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
        telegramUser={user}
      />

      {/* Orders Drawer */}
      <OrdersTab
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={savedOrders}
        onOpenOrder={(invoiceId, url) => {
          setActiveCheckout({ invoiceId: Number(invoiceId), invoiceUrl: url });
        }}
      />

      {/* Active Checkout & Invoice Modal */}
      {activeCheckout && (
        <CheckoutModal
          invoiceId={activeCheckout.invoiceId}
          invoiceUrl={activeCheckout.invoiceUrl}
          onClose={() => setActiveCheckout(null)}
          onOpenPaymentLink={(url) => openLink(url)}
          haptic={haptic}
        />
      )}
    </div>
  );
}

export default App;
