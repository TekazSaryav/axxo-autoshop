import React from 'react';
import { ShoppingBag, PackageCheck, Zap, HelpCircle } from 'lucide-react';
import type { ShopInfo, TelegramWebAppUser } from '../types.js';
import { useLanguage } from '../i18n.js';

interface NavbarProps {
  shop: ShopInfo | null;
  user?: TelegramWebAppUser;
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenSupport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shop,
  user,
  cartCount,
  onOpenCart,
  onOpenOrders,
  onOpenSupport
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {shop?.logo_url ? (
              <img
                src={shop.logo_url}
                alt="Tekaz Logo"
                className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-md shadow-indigo-500/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
            )}
            {/* Pulsing online status indicator */}
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-[#0d1322]" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base text-white tracking-tight leading-none">
                Tekaz Market
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                {t.shop_badge}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
              {user ? (
                <span className="text-gray-300 font-semibold truncate max-w-[120px]">
                  @{user.username || user.first_name}
                </span>
              ) : (
                <span className="text-gray-400">{t.official_shop}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions (Language Switcher, Support, Orders & Cart) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Switcher Button (FR / EN) */}
          <button
            onClick={toggleLanguage}
            className="h-10 px-2.5 rounded-xl bg-gray-850/90 hover:bg-gray-800 active:scale-95 text-xs font-black transition border border-white/10 flex items-center gap-1.5 cursor-pointer shadow-sm"
            title={t.switch_lang_title}
            aria-label={t.switch_lang_title}
          >
            <span className="text-sm leading-none">{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
            <span className="font-mono text-gray-200 uppercase tracking-wider text-[11px]">
              {language}
            </span>
          </button>

          <button
            onClick={onOpenSupport}
            className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-gray-850/80 hover:bg-gray-800 active:scale-95 text-gray-300 hover:text-white transition border border-white/5 flex items-center justify-center cursor-pointer shadow-sm"
            title={t.support_reviews}
            aria-label={t.support_reviews}
          >
            <HelpCircle className="w-5 h-5 text-cyan-400" />
          </button>

          <button
            onClick={onOpenOrders}
            className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-gray-850/80 hover:bg-gray-800 active:scale-95 text-gray-300 hover:text-white transition border border-white/5 flex items-center justify-center cursor-pointer shadow-sm"
            title={t.my_orders}
            aria-label={t.my_orders}
          >
            <PackageCheck className="w-5 h-5 text-indigo-400" />
          </button>

          <button
            onClick={onOpenCart}
            className="relative h-11 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 font-bold text-xs cursor-pointer"
            aria-label={t.cart}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline">{t.cart}</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-black bg-white text-indigo-900 rounded-full min-w-[1.25rem] text-center shadow font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
