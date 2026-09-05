import React from 'react';
import type { Product } from '../types.js';
import { ShoppingCart, Check, Zap, Eye } from 'lucide-react';

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
      className="group glass-card rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:translate-y-[-2px] cursor-pointer relative overflow-hidden"
    >
      {/* Top Banner / Image */}
      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-800/60 mb-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/30 to-purple-900/20 text-indigo-400">
            <Zap className="w-8 h-8 opacity-40 mb-1" />
            <span className="text-[11px] font-medium text-gray-400">Tekaz Digital</span>
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-semibold text-indigo-300 border border-white/10">
            {product.category.name}
          </span>
        )}

        {/* Stock Badge */}
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md flex items-center gap-1 ${
            !isInStock
              ? 'bg-rose-500/80 text-white'
              : isUnlimited
              ? 'bg-emerald-500/80 text-white'
              : 'bg-amber-500/80 text-white'
          }`}
        >
          {isInStock ? (
            <>
              <Check className="w-3 h-3" />
              {isUnlimited ? 'En stock' : `${totalStock} restants`}
            </>
          ) : (
            'Épuisé'
          )}
        </span>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-100 line-clamp-2 leading-snug mb-1 group-hover:text-indigo-300 transition-colors">
            {product.name}
          </h3>

          {product.variants && product.variants.length > 1 && (
            <p className="text-[11px] text-gray-400 mb-2">
              {product.variants.length} options disponibles
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
          <div>
            <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-semibold">
              {product.variants && product.variants.length > 1 ? 'Dès' : 'Prix'}
            </span>
            <span className="font-bold text-base text-white tracking-tight">
              {minPrice.toFixed(2)} {product.currency || '€'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(product);
              }}
              className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white transition"
              title="Voir les détails"
            >
              <Eye className="w-4 h-4" />
            </button>

            {isInStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(product);
                }}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition shadow-md shadow-indigo-600/30"
                title="Ajouter au panier"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
