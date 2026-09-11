import React, { useState, useEffect } from 'react';
import type { CartItem } from '../types.js';
import { X, Trash2, Mail, ShieldCheck, ArrowRight, ShoppingBag, Lock } from 'lucide-react';
import { useLanguage } from '../i18n.js';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: string;
  isReseller?: boolean;
  resellerDiscount?: number;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: (email: string) => void;
  onCheckoutStars: (email: string) => void;
  isCheckingOut: boolean;
  isCheckingOutStars: boolean;
  telegramUser?: { id: number; username?: string; first_name?: string };
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  isReseller,
  resellerDiscount = 20,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onCheckoutStars,
  isCheckingOut,
  isCheckingOutStars
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('tekaz_customer_email') || '';
  });
  const [emailError, setEmailError] = useState('');

  // Persist email
  useEffect(() => {
    if (email) {
      localStorage.setItem('tekaz_customer_email', email);
    }
  }, [email]);

  if (!isOpen) return null;

  const rawTotal = cart.reduce((sum, item) => {
    return sum + parseFloat(item.variant.price || '0') * item.quantity;
  }, 0);

  const discountFactor = isReseller ? (1 - (resellerDiscount || 20) / 100) : 1;
  const total = rawTotal * discountFactor;
  const savings = rawTotal - total;

  // Compute stars total (65 stars per 1 EUR with 30% Apple/Google fee coverage)
  const starsTotal = Math.max(10, Math.round(total * 65));

  const validateEmail = () => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailError(t.email_invalid);
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleCheckoutClick = () => {
    if (validateEmail()) {
      onCheckout(email);
    }
  };

  const handleCheckoutStarsClick = () => {
    if (validateEmail()) {
      onCheckoutStars(email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0d1322] border-t border-white/10 rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-gray-700/60 rounded-full mx-auto my-2.5 flex-shrink-0" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">{t.my_cart}</h2>
              <p className="text-[11px] text-gray-400 font-medium">
                {cart.length} {cart.length > 1 ? t.diff_items : t.single_item}
              </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="py-14 text-center text-gray-400 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 stroke-1 text-indigo-400/50" />
              </div>
              <p className="font-bold text-base text-gray-200 mb-1">{t.cart_empty}</p>
              <p className="text-xs text-gray-500 max-w-xs">
                {t.cart_empty_desc}
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-2.5">
                {cart.map((item, idx) => {
                  const itemPrice = parseFloat(item.variant.price || '0');
                  const itemTotal = (itemPrice * item.quantity).toFixed(2);
                  const img = item.product.images?.[0]?.url;

                  return (
                    <div
                      key={`${item.product.id}-${item.variant.id}-${idx}`}
                      className="p-3.5 rounded-2xl bg-gray-900/80 border border-white/5 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {img ? (
                          <img
                            src={img}
                            alt={item.product.name}
                            className="w-13 h-13 rounded-xl object-cover bg-gray-950 flex-shrink-0 border border-white/5"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-indigo-300 font-semibold mt-0.5">
                            {item.variant.name} • <span className="font-mono">{itemPrice.toFixed(2)} {currency}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Stepper with accessible touch targets */}
                        <div className="flex items-center gap-1 bg-gray-950 px-2 py-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 text-sm font-black transition cursor-pointer"
                            aria-label="Diminuer"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-white w-5 text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 text-sm font-black transition cursor-pointer"
                            aria-label="Augmenter"
                          >
                            +
                          </button>
                        </div>

                        {/* Total & Delete */}
                        <div className="text-right flex flex-col items-end">
                          <span className="font-extrabold text-sm text-white font-mono block">
                            {itemTotal} {currency}
                          </span>
                          <button
                            onClick={() => onRemoveItem(idx)}
                            className="text-rose-400/80 hover:text-rose-300 p-1 transition cursor-pointer mt-1"
                            title="Supprimer"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Email Delivery Field */}
              <div className="pt-3 border-t border-white/5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1.5 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {t.email_label} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder={t.email_placeholder}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-950 border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${
                    emailError
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500/30'
                  }`}
                />
                {emailError ? (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1.5">{emailError}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {t.email_hint}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions: Dual Payment Gateways (Crypto/Card & Telegram Stars) */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-gray-950 space-y-3 flex-shrink-0">
            {/* Reseller Wholesale Summary Banner */}
            {isReseller && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-yellow-500/10 border border-amber-400/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span>💎</span>
                  <span>{t.reseller_discount_applied} (-{resellerDiscount}%)</span>
                </div>
                <span className="font-mono font-black text-amber-400">
                  -{savings.toFixed(2)} {currency}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 font-medium">{t.total_cart}</span>
              <div className="text-right">
                {isReseller && (
                  <span className="text-xs line-through text-gray-500 font-mono block">
                    {rawTotal.toFixed(2)} {currency}
                  </span>
                )}
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {total.toFixed(2)} {currency}
                </span>
                <span className="text-xs font-black text-amber-400 font-mono block">
                  ou {starsTotal} ⭐
                </span>
              </div>
            </div>

            {/* Telegram Stars Button */}
            <button
              disabled={isCheckingOut || isCheckingOutStars}
              onClick={handleCheckoutStarsClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.99] text-gray-950 font-black text-sm transition shadow-xl shadow-amber-500/25 flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              {isCheckingOutStars ? (
                <div className="flex items-center gap-2 mx-auto">
                  <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  <span>{t.paying_stars}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">⭐</span>
                    <div className="text-left">
                      <span className="block leading-tight">{t.pay_stars_btn}</span>
                      <span className="text-[10px] font-bold text-amber-950/80 block -mt-0.5">
                        {t.stars_fee_included}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-black">
                    <span>{starsTotal} ⭐</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </>
              )}
            </button>

            {/* Standard Crypto & Card SellAuth Button */}
            <button
              disabled={isCheckingOut || isCheckingOutStars}
              onClick={handleCheckoutClick}
              className="w-full py-3 px-4 rounded-2xl bg-gray-900 hover:bg-gray-850 active:scale-[0.99] text-gray-200 hover:text-white font-extrabold text-xs transition border border-white/10 flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              {isCheckingOut ? (
                <div className="flex items-center gap-2 mx-auto">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.paying}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.pay_btn}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-gray-400">
                    <span>{total.toFixed(2)} {currency}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
