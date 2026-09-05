import React, { useState, useMemo } from 'react';
import type { Product, Variant } from '../types.js';
import { X, Check, ShoppingBag, Zap, ShieldCheck, Clock, Layers } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative w-full aspect-[16/9] bg-gray-950 overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-950 to-purple-950 text-indigo-400">
              <Zap className="w-12 h-12 mb-2 opacity-50" />
              <span className="font-semibold text-sm text-gray-300">Tekaz Digital Store</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition border border-white/10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category */}
          {product.category && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-semibold text-indigo-300 border border-white/10">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Title & Price */}
          <div>
            <h2 className="text-xl font-bold text-white leading-tight mb-1">{product.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-indigo-400">
                {currentPrice.toFixed(2)} {product.currency || '€'}
              </span>
              <span className="text-xs text-gray-400">TVA incluse • Livraison directe</span>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-800/40 border border-white/5 text-center">
              <Clock className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px] text-gray-300 font-semibold">Instantané</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-800/40 border border-white/5 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] text-gray-300 font-semibold">Garantie 100%</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-800/40 border border-white/5 text-center">
              <Zap className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] text-gray-300 font-semibold">Support 24/7</span>
            </div>
          </div>

          {/* Variant Selector if more than 1 variant */}
          {variants.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Choisir une formule / variante
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
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                          : inStock
                          ? 'bg-gray-800/50 border-white/5 hover:border-white/20'
                          : 'bg-gray-900/40 border-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-500'
                              : 'border-gray-500'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="font-semibold text-sm text-gray-100">{v.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {price.toFixed(2)} {product.currency || '€'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {inStock ? (v.stock === null || v.stock === -1 ? 'Stock' : `${v.stock} dispo`) : 'Épuisé'}
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/40 border border-white/5">
              <span className="text-xs font-semibold text-gray-300">Quantité</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition"
                >
                  -
                </button>
                <span className="font-bold text-sm text-white w-6 text-center">{quantity}</span>
                <button
                  onClick={() => {
                    const maxStock = selectedVariant.stock;
                    if (maxStock !== null && maxStock !== -1 && quantity >= maxStock) return;
                    setQuantity(quantity + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Product Description */}
          {product.description && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Description du produit
              </h3>
              <div
                className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-2 prose prose-invert max-w-none break-words"
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
            className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 active:scale-95 text-white font-semibold text-sm transition border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <ShoppingBag className="w-4 h-4" />
            Ajouter au panier
          </button>

          <button
            disabled={!isSelectedVariantInStock}
            onClick={() => {
              onDirectBuy(product, selectedVariant, quantity);
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>Commander • {totalPrice} {product.currency || '€'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
