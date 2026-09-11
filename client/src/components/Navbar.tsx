import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, PackageCheck, Zap, HelpCircle, Shield, Menu, X } from 'lucide-react';
import type { ShopInfo, TelegramWebAppUser } from '../types.js';
import { useLanguage } from '../i18n.js';

interface NavbarProps {
  shop: ShopInfo | null;
  user?: TelegramWebAppUser;
  cartCount: number;
  isAdmin?: boolean;
  isReseller?: boolean;
  resellerDiscount?: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenSupport: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shop,
  user,
  cartCount,
  isAdmin,
  isReseller,
  resellerDiscount = 20,
  onOpenCart,
  onOpenOrders,
  onOpenSupport,
  onOpenAdmin
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
          <div className="relative flex-shrink-0">
            {shop?.logo_url ? (
              <img
                src={shop.logo_url}
                alt="Tekaz Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-white/10 shadow-md shadow-indigo-500/20"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
            )}
            {/* Pulsing online status indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 ring-2 ring-[#0d1322]" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-none truncate">
                Tekaz Market
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 flex-shrink-0">
                {t.shop_badge}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {user ? (
                <span className="text-gray-300 font-semibold truncate max-w-[90px] sm:max-w-[120px] text-[10px] sm:text-[11px]">
                  @{user.username || user.first_name}
                </span>
              ) : (
                <span className="text-gray-400 text-[10px] sm:text-[11px] truncate">{t.official_shop}</span>
              )}
              {isReseller && (
                <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-500/25 to-amber-600/20 text-amber-300 font-black text-[8px] sm:text-[9px] border border-amber-500/40 uppercase tracking-tight shadow-sm flex-shrink-0">
                  💎 VIP -{resellerDiscount}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0" ref={menuRef}>
          {/* Desktop & Tablet actions (visible when screen width >= sm: 640px) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
            {/* Admin button if user is admin */}
            {isAdmin && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="h-10 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 transition border border-amber-500/40 flex items-center gap-1 cursor-pointer font-black text-[11px] shadow-sm shadow-amber-500/10"
                title="Panel Administrateur"
                aria-label="Panel Administrateur"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin</span>
              </button>
            )}

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

            {/* Support button */}
            <button
              onClick={onOpenSupport}
              className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-gray-850/80 hover:bg-gray-800 active:scale-95 text-gray-300 hover:text-white transition border border-white/5 flex items-center justify-center cursor-pointer shadow-sm"
              title={t.support_reviews}
              aria-label={t.support_reviews}
            >
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </button>

            {/* Orders button */}
            <button
              onClick={onOpenOrders}
              className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-gray-850/80 hover:bg-gray-800 active:scale-95 text-gray-300 hover:text-white transition border border-white/5 flex items-center justify-center cursor-pointer shadow-sm"
              title={t.my_orders}
              aria-label={t.my_orders}
            >
              <PackageCheck className="w-5 h-5 text-indigo-400" />
            </button>
          </div>

          {/* Cart Button (Always visible on mobile & desktop) */}
          <button
            onClick={onOpenCart}
            className="relative h-9 sm:h-11 px-2.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 sm:gap-2 font-bold text-xs cursor-pointer"
            aria-label={t.cart}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden md:inline">{t.cart}</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] sm:text-[11px] font-black bg-white text-indigo-900 rounded-full min-w-[1.2rem] text-center shadow font-mono">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Button (visible only when screen width < sm: 640px) */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition border active:scale-95 cursor-pointer shadow-sm ${
                isMenuOpen
                  ? 'bg-indigo-600/30 border-indigo-500 text-white'
                  : 'bg-gray-850/90 border-white/10 text-gray-300 hover:text-white'
              }`}
              aria-label={t.menu_btn || 'Menu'}
              title={t.menu_btn || 'Menu'}
            >
              {isMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>

            {/* Mobile Dropdown Menu Drawer */}
            {isMenuOpen && (
              <div className="absolute right-0 top-11 w-56 p-2 rounded-2xl glass-panel border border-white/15 bg-gray-900/95 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                {/* Admin Item */}
                {isAdmin && onOpenAdmin && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left font-bold text-xs text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition flex items-center gap-2.5 border border-amber-500/20 bg-amber-500/10 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Panel Admin</span>
                  </button>
                )}

                {/* Orders Item */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenOrders();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left font-bold text-xs text-gray-200 hover:text-white hover:bg-white/10 active:scale-[0.98] transition flex items-center gap-2.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>{t.my_orders}</span>
                </button>

                {/* Support & Reviews Item */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSupport();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left font-bold text-xs text-gray-200 hover:text-white hover:bg-white/10 active:scale-[0.98] transition flex items-center gap-2.5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{t.support_reviews}</span>
                </button>

                {/* Language Switcher Item */}
                <button
                  onClick={() => {
                    toggleLanguage();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left font-bold text-xs text-gray-200 hover:text-white hover:bg-white/10 active:scale-[0.98] transition flex items-center justify-between border-t border-white/10 pt-2 mt-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                    <span>Langue</span>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-bold uppercase text-gray-300">
                    {language.toUpperCase()}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
