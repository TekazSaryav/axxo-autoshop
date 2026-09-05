import React, { useState, useMemo } from 'react';
import type { Product, Variant } from '../types.js';
import { X, Check, ShoppingBag, Zap, ShieldCheck, Clock, Layers, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n.js';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  onDirectBuy: (product: Product, variant: Variant, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onDirectBuy
}) => {
  const { t } = useLanguage();
  if (!product) return null;

  const variants = useMemo(() => product.variants || [], [product]);

  // Default to first variant in stock or first variant
  const initialVariant = useMemo(() => {
    const inStockVar = variants.find((v) => v.stock === null || v.stock === -1 || v.stock > 0);
    return inStockVar || variants[0] || {
      id: 0,
      product_id: product.id,
      name: 'Default',
      price: product.price || '0.00',
      stock: product.stock_count
    };
  }, [variants, product]);

  const [selectedVariant, setSelectedVariant] = useState<Variant>(initialVariant);
  const [quantity, setQuantity] = useState(1);

  const isSelectedVariantInStock =
    selectedVariant.stock === null || selectedVariant.stock === -1 || selectedVariant.stock > 0;

  const currentPrice = parseFloat(selectedVariant.price || '0');
  const totalPrice = (currentPrice * quantity).toFixed(2);

  const imageUrl = product.images?.[0]?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0d1322] border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar */}
        <div className="w-12 h-1.5 bg-gray-700/60 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Modal Hero Banner */}
        <div className="relative w-full aspect-[16/9] bg-gray-950 overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-950/60 to-purple-950/40 text-indigo-400">
              <Zap className="w-12 h-12 mb-2 opacity-50" />
              <span className="font-bold text-sm text-gray-300">Tekaz Digital Store</span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-transparent to-black/30 pointer-events-none" />

          {/* Close button (44x44px touch target) */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition border border-white/10 flex items-center justify-center cursor-pointer shadow-lg"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category */}
          {product.category && (
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-xs font-bold text-indigo-300 border border-white/10 shadow">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Title & Price */}
          <div>
            <h2 className="text-xl font-extrabold text-white leading-snug mb-1.5">{product.name}</h2>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-mono">
                {currentPrice.toFixed(2)} {product.currency || '€'}
              </span>
              <span className="text-xs text-gray-400 font-medium">{t.vat_instant}</span>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-900/80 border border-white/5 text-center">
              <Clock className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px] text-gray-200 font-bold">24/7</span>
              <span className="text-[9px] text-gray-400">{t.available_24_7}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-900/80 border border-white/5 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] text-gray-200 font-bold">SellAuth</span>
              <span className="text-[9px] text-gray-400">100% {t.reviews_positive}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gray-900/80 border border-white/5 text-center">
              <Zap className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] text-gray-200 font-bold">Support</span>
              <span className="text-[9px] text-gray-400">@notthatid</span>
            </div>
          </div>

          {/* Variant Selector */}
          {variants.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2.5 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                {t.select_formula}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  const inStock = v.stock === null || v.stock === -1 || v.stock > 0;
                  const price = parseFloat(v.price || '0');

                  return (
                    <button
                      key={v.id}
                      disabled={!inStock}
                      onClick={() => {
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-950/70 to-indigo-900/40 border-indigo-500 shadow-md shadow-indigo-500/20'
                          : inStock
                          ? 'bg-gray-900/60 border-white/5 hover:border-white/20'
                          : 'bg-gray-950/40 border-white/5 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-600'
                              : 'border-gray-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-bold text-sm text-gray-100">{v.name}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-sm text-white font-mono">
                          {price.toFixed(2)} {product.currency || '€'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {inStock ? (v.stock === null || v.stock === -1 ? t.in_stock_badge : `${v.stock} ${t.dispo}`) : t.out_of_stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          {isSelectedVariantInStock && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/70 border border-white/5">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{t.quantity}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center transition active:scale-95 cursor-pointer"
                  aria-label="Diminuer"
                >
                  -
                </button>
                <span className="font-extrabold text-base text-white w-6 text-center font-mono">{quantity}</span>
                <button
                  onClick={() => {
                    const maxStock = selectedVariant.stock;
                    if (maxStock !== null && maxStock !== -1 && quantity >= maxStock) return;
                    setQuantity(quantity + 1);
                  }}
                  className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center transition active:scale-95 cursor-pointer"
                  aria-label="Augmenter"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                {t.product_description}
              </h3>
              <div
                className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-2 prose prose-invert max-w-none break-words bg-gray-950/60 p-3.5 rounded-2xl border border-white/5"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-gray-950 flex items-center gap-3 flex-shrink-0">
          <button
            disabled={!isSelectedVariantInStock}
            onClick={() => {
              onAddToCart(product, selectedVariant, quantity);
              onClose();
            }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gray-850 hover:bg-gray-800 active:scale-95 text-white font-bold text-sm transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            <span>{t.add_to_cart}</span>
          </button>

          <button
            disabled={!isSelectedVariantInStock}
            onClick={() => {
              onDirectBuy(product, selectedVariant, quantity);
              onClose();
            }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-95 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <span>{t.instant_buy} ({totalPrice} {product.currency || '€'})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
