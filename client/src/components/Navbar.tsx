import React from 'react';
import { ShoppingBag, PackageCheck, Zap } from 'lucide-react';
import type { ShopInfo, TelegramWebAppUser } from '../types.js';

interface NavbarProps {
  shop: ShopInfo | null;
  user?: TelegramWebAppUser;
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shop,
  user,
  cartCount,
  onOpenCart,
  onOpenOrders
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {shop?.logo_url ? (
              <img
                src={shop.logo_url}
                alt="Tekaz Logo"
                className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-md shadow-indigo-500/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
                <Zap className="w-5 h-5" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base text-white tracking-tight">Tekaz Market</h1>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                24/7
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              {user ? (
                <>
                  <span className="text-gray-300 font-medium">@{user.username || user.first_name}</span>
                </>
              ) : (
                <span className="text-gray-400">Autoshop Officiel</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions (Orders & Cart) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenOrders}
            className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 active:scale-95 text-gray-300 hover:text-white transition border border-white/5"
            title="Mes Commandes"
            aria-label="Mes Commandes"
          >
            <PackageCheck className="w-5 h-5 text-indigo-400" />
          </button>

          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 font-medium text-sm"
            aria-label="Voir le Panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-indigo-900 rounded-full min-w-[1.25rem] text-center shadow">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
