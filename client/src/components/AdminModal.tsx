import React, { useState, useEffect } from 'react';
import type { Product, AdminStats, Reseller } from '../types.js';
import {
  fetchAdminStats,
  fetchAdminOrders,
  fetchAdminResellers,
  addAdminReseller,
  deleteAdminReseller,
  addAdminStock,
  clearAdminStock
} from '../services/api.js';
import { useLanguage } from '../i18n.js';
import {
  X,
  Shield,
  Package,
  ShoppingBag,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  AlertTriangle,
  Key,
  Layers
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminTelegramId?: number;
  adminUsername?: string;
  products: Product[];
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  adminTelegramId,
  adminUsername,
  products
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'orders' | 'resellers'>('dashboard');

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Orders State
  const [ordersData, setOrdersData] = useState<{ sellauthOrders: any[]; starsOrders: any[] } | null>(null);
  const [ordersSubTab, setOrdersSubTab] = useState<'stars' | 'sellauth'>('stars');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Resellers State
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [isLoadingResellers, setIsLoadingResellers] = useState(false);
  const [newResellerId, setNewResellerId] = useState('');
  const [newResellerName, setNewResellerName] = useState('');
  const [newResellerDiscount, setNewResellerDiscount] = useState('20');
  const [isSubmittingReseller, setIsSubmittingReseller] = useState(false);

  // Stock State
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 0);
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(undefined);
  const [stockLines, setStockLines] = useState('');
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockMessage, setStockMessage] = useState('');

  // Initial load
  useEffect(() => {
    if (isOpen) {
      loadStats();
      loadResellers();
      loadOrders();
    }
  }, [isOpen]);

  // Update selected product when products load
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const s = await fetchAdminStats(adminTelegramId, adminUsername);
      setStats(s);
    } catch (err) {
      console.warn('Could not load admin stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await fetchAdminOrders(adminTelegramId, adminUsername);
      setOrdersData(data);
    } catch (err) {
      console.warn('Could not load admin orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadResellers = async () => {
    setIsLoadingResellers(true);
    try {
      const data = await fetchAdminResellers(adminTelegramId, adminUsername);
      setResellers(data.resellers);
    } catch (err) {
      console.warn('Could not load resellers:', err);
    } finally {
      setIsLoadingResellers(false);
    }
  };

  const handleAddReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResellerId.trim()) return;

    setIsSubmittingReseller(true);
    try {
      await addAdminReseller(adminTelegramId, adminUsername, {
        telegramId: newResellerId.trim(),
        name: newResellerName.trim() || undefined,
        discountPercentage: parseInt(newResellerDiscount, 10) || 20
      });
      setNewResellerId('');
      setNewResellerName('');
      setNewResellerDiscount('20');
      await loadResellers();
      alert('Revendeur ajouté avec succès !');
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    } finally {
      setIsSubmittingReseller(false);
    }
  };

  const handleDeleteReseller = async (id: string) => {
    if (!confirm(`Voulez-vous vraiment révoquer l'accès revendeur pour l'ID ${id} ?`)) return;

    try {
      await deleteAdminReseller(adminTelegramId, adminUsername, id);
      await loadResellers();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = stockLines.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert('Veuillez entrer au moins un compte ou une clé');
      return;
    }

    setIsSubmittingStock(true);
    setStockMessage('');
    try {
      const res = await addAdminStock(adminTelegramId, adminUsername, selectedProductId, selectedVariantId, lines);
      setStockMessage(`✅ ${res.added} compte(s) ajouté(s) ! Stock total : ${res.total}`);
      setStockLines('');
      loadStats();
    } catch (err: any) {
      setStockMessage(`❌ Erreur : ${err.message}`);
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const handleClearStock = async (productId: number, variantId?: number) => {
    if (!confirm('Voulez-vous vraiment vider le stock Stars pour ce produit ?')) return;

    try {
      await clearAdminStock(adminTelegramId, adminUsername, productId, variantId);
      alert('Stock vidé avec succès.');
      loadStats();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  };

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-[#0d1322] border-t border-amber-500/20 rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle */}
        <div className="w-12 h-1.5 bg-gray-700/60 rounded-full mx-auto my-2.5 flex-shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-gray-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 text-black font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5 text-gray-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white">{t.admin_panel_title}</h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">{t.admin_panel_sub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-850 hover:bg-gray-750 text-gray-400 hover:text-white transition flex items-center justify-center cursor-pointer border border-white/5"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-gray-950 border-b border-white/5 px-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.admin_tab_dashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{t.admin_tab_stock}</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t.admin_tab_orders}</span>
          </button>

          <button
            onClick={() => setActiveTab('resellers')}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'resellers'
                ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.admin_tab_resellers}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-semibold">Vue globale des performances</span>
                <button
                  onClick={loadStats}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* SellAuth Revenue */}
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
                    <span>Revenus SellAuth</span>
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">
                    {(stats?.totalEurSellauth || 0).toFixed(2)} €
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {stats?.totalSellauthOrders || 0} commandes reçues
                  </p>
                </div>

                {/* Stars Revenue */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-gray-900 border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
                    <span>Revenus Stars</span>
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <p className="text-xl font-black text-amber-300 font-mono">
                    {stats?.totalStarsRevenue || 0} ⭐
                  </p>
                  <p className="text-[10px] text-gray-400">
                    ~{(stats?.totalEurRevenueStars || 0).toFixed(2)} € ({stats?.paidStarsOrders || 0} payées)
                  </p>
                </div>

                {/* Resellers */}
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
                    <span>Revendeurs VIP</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">
                    {stats?.totalResellers || 0}
                  </p>
                  <p className="text-[10px] text-gray-400">Accès grossistes actifs</p>
                </div>

                {/* Stars Stock */}
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
                    <span>Stock Manuel Stars</span>
                    <Package className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-xl font-black text-white font-mono">
                    {stats?.totalStockSerials || 0}
                  </p>
                  <p className="text-[10px] text-gray-400">Comptes/clés en réserve</p>
                </div>
              </div>

              {/* Quick links banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-white">Bot Telegram connecté</h4>
                  <p className="text-[11px] text-gray-400">Menu rapide disponible avec la commande /admin</p>
                </div>
                <button
                  onClick={() => setActiveTab('resellers')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs transition cursor-pointer"
                >
                  + Revendeur
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK MANAGEMENT */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <form onSubmit={handleAddStock} className="p-4 rounded-2xl bg-gray-900/80 border border-white/5 space-y-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>{t.admin_add_stock}</span>
                </h3>

                {/* Product Select */}
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-1">Produit concerné :</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedProductId(id);
                      setSelectedVariantId(undefined);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ID: {p.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variant Select if present */}
                {currentProduct?.variants && currentProduct.variants.length > 1 && (
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1">Variante :</label>
                    <select
                      value={selectedVariantId || ''}
                      onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gray-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Toutes les variantes / Défaut</option>
                      {currentProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.price} €) - ID: {v.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Textarea for Accounts / Serials */}
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-1">
                    Comptes ou Clés (1 par ligne) :
                  </label>
                  <textarea
                    rows={4}
                    value={stockLines}
                    onChange={(e) => setStockLines(e.target.value)}
                    placeholder={t.admin_stock_lines_placeholder}
                    className="w-full p-3 rounded-xl bg-gray-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {stockMessage && (
                  <p className="text-xs font-semibold p-2 rounded-lg bg-gray-950 border border-white/10">
                    {stockMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingStock}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmittingStock ? 'Ajout en cours...' : 'Valider & Ajouter au stock Stars'}
                </button>
              </form>

              {/* Current Products Stock Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-gray-300">Stock actuel des produits :</h4>
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-gray-900/60 border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {p.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleClearStock(p.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                        title="Vider le stock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {/* Toggle Stars vs SellAuth */}
              <div className="flex p-1 bg-gray-950 rounded-xl border border-white/5">
                <button
                  onClick={() => setOrdersSubTab('stars')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    ordersSubTab === 'stars'
                      ? 'bg-amber-500 text-gray-950 font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Telegram Stars (⭐)
                </button>
                <button
                  onClick={() => setOrdersSubTab('sellauth')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    ordersSubTab === 'sellauth'
                      ? 'bg-indigo-600 text-white font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  SellAuth (Crypto/Carte)
                </button>
              </div>

              {ordersSubTab === 'stars' && (
                <div className="space-y-2.5">
                  {ordersData?.starsOrders.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">Aucune commande Stars pour le moment.</p>
                  ) : (
                    ordersData?.starsOrders.map((ord: any) => (
                      <div
                        key={ord.orderId}
                        className="p-3.5 rounded-xl bg-gray-900/80 border border-white/5 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-white text-[11px]">#{ord.orderId}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              ord.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {ord.status === 'paid' ? 'Payé' : 'En attente'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-gray-300">
                          <span>📧 {ord.email}</span>
                          <span className="font-mono font-black text-amber-400">{ord.starsAmount} ⭐</span>
                        </div>

                        {ord.items && (
                          <div className="text-[11px] text-gray-400 pt-1 border-t border-white/5">
                            {ord.items.map((i: any, idx: number) => (
                              <span key={idx} className="block">
                                • {i.name} {i.variantName ? `(${i.variantName})` : ''} x{i.quantity}
                              </span>
                            ))}
                          </div>
                        )}

                        {ord.delivered && (
                          <div className="mt-1 p-2 rounded-lg bg-black/50 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 whitespace-pre-wrap select-all">
                            {ord.delivered}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {ordersSubTab === 'sellauth' && (
                <div className="space-y-2.5">
                  {ordersData?.sellauthOrders.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">Aucune commande SellAuth pour le moment.</p>
                  ) : (
                    ordersData?.sellauthOrders.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-xl bg-gray-900/80 border border-white/5 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-white text-[11px]">#{inv.id}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              inv.status === 'completed' || inv.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span>📧 {inv.email}</span>
                          <span className="font-mono font-black text-white">
                            {inv.price} {inv.currency}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESELLERS */}
          {activeTab === 'resellers' && (
            <div className="space-y-4">
              {/* Form Add Reseller */}
              <form
                onSubmit={handleAddReseller}
                className="p-4 rounded-2xl bg-gray-900/80 border border-white/5 space-y-3"
              >
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{t.admin_add_reseller}</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-400 font-semibold mb-1">ID Telegram :</label>
                    <input
                      type="text"
                      required
                      value={newResellerId}
                      onChange={(e) => setNewResellerId(e.target.value)}
                      placeholder={t.admin_telegram_id_placeholder}
                      className="w-full py-2.5 px-3 rounded-xl bg-gray-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-400 font-semibold mb-1">Remise (%) :</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      required
                      value={newResellerDiscount}
                      onChange={(e) => setNewResellerDiscount(e.target.value)}
                      placeholder={t.admin_discount_placeholder}
                      className="w-full py-2.5 px-3 rounded-xl bg-gray-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-1">Nom / Note (optionnel) :</label>
                  <input
                    type="text"
                    value={newResellerName}
                    onChange={(e) => setNewResellerName(e.target.value)}
                    placeholder={t.admin_reseller_name_placeholder}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-950 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReseller}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmittingReseller ? 'Ajout en cours...' : 'Accorder l\'accès Revendeur'}
                </button>
              </form>

              {/* Resellers List */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-gray-300">
                  Revendeurs autorisés ({resellers.length}) :
                </h4>

                {resellers.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    Aucun revendeur configuré. Ajoutez-en un ci-dessus avec son Telegram ID.
                  </div>
                ) : (
                  resellers.map((r) => (
                    <div
                      key={r.telegramId}
                      className="p-3.5 rounded-xl bg-gray-900/80 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{r.telegramId}</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-[10px]">
                            -{r.discountPercentage}%
                          </span>
                        </div>
                        {r.name && <p className="text-[11px] text-gray-400 mt-0.5">{r.name}</p>}
                      </div>

                      <button
                        onClick={() => handleDeleteReseller(r.telegramId)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                        title="Révoquer l'accès"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
