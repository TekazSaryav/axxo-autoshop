import React from 'react';
import type { Product } from '../types.js';
import { ShoppingBag, Zap, Eye } from 'lucide-react';
import { useLanguage } from '../i18n.js';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onQuickAdd
}) => {
  const { t } = useLanguage();
  const imageUrl = product.images?.[0]?.url;

  // Calculate price display
  const prices = (product.variants || [])
    .map((v) => parseFloat(v.price))
    .filter((p) => !isNaN(p));
  const minPrice = prices.length > 0 ? Math.min(...prices) : (product.price ? parseFloat(product.price) : 0);

  // Calculate stock status
  const hasVariants = product.variants && product.variants.length > 0;
  let isInStock = false;
  let totalStock = 0;
  let isUnlimited = false;

  if (hasVariants) {
    for (const v of product.variants) {
      if (v.stock === null || v.stock === -1) {
        isUnlimited = true;
        isInStock = true;
      } else if (v.stock > 0) {
        totalStock += v.stock;
        isInStock = true;
      }
    }
  } else {
    if (product.stock_count === null || product.stock_count === -1) {
      isUnlimited = true;
      isInStock = true;
    } else if (product.stock_count > 0) {
      totalStock = product.stock_count;
      isInStock = true;
    }
  }

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group glass-card rounded-2xl p-3 flex flex-col justify-between cursor-pointer relative overflow-hidden border border-white/5 active:scale-[0.98] select-none"
    >
      {/* Top Media Banner */}
      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-950/80 mb-2.5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 text-indigo-400">
            <Zap className="w-8 h-8 opacity-40 mb-1" />
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">Tekaz</span>
          </div>
        )}

        {/* Subtle Bottom Gradient on Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-black/20 pointer-events-none" />

        {/* Category Badge */}
        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-white/10 shadow-sm">
            {product.category.name}
          </span>
        )}

        {/* Live Stock Pill */}
        <div
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-sm ${
            !isInStock
              ? 'bg-rose-500/80 text-white'
              : isUnlimited
              ? 'bg-emerald-500/80 text-white'
              : 'bg-amber-500/80 text-white'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isInStock ? 'bg-white animate-pulse' : 'bg-rose-200'
            }`}
          />
          <span>
            {isInStock ? (isUnlimited ? t.available_24_7 : `${totalStock} ${t.left_stock}`) : t.out_of_stock}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-gray-100 line-clamp-2 leading-snug mb-1 group-hover:text-indigo-300 transition-colors">
            {product.name}
          </h3>

          {product.variants && product.variants.length > 1 && (
            <p className="text-[11px] text-gray-400 font-medium mb-1.5">
              {product.variants.length} {t.formulas_choice}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1.5">
          <div>
            <span className="text-[9px] text-gray-400 block uppercase tracking-wider font-extrabold">
              {product.variants && product.variants.length > 1 ? t.from_price : t.single_price}
            </span>
            <span className="font-extrabold text-base text-white tracking-tight font-mono">
              {minPrice.toFixed(2)} {product.currency || '€'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(product);
              }}
              className="w-9 h-9 rounded-xl bg-gray-800/90 hover:bg-gray-700 active:scale-95 text-gray-300 hover:text-white transition flex items-center justify-center border border-white/5 cursor-pointer"
              title={t.details}
              aria-label={t.details}
            >
              <Eye className="w-4 h-4" />
            </button>

            {isInStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(product);
                }}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white transition shadow-md shadow-indigo-600/30 flex items-center justify-center cursor-pointer"
                title={t.add_to_cart}
                aria-label={t.add_to_cart}
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
