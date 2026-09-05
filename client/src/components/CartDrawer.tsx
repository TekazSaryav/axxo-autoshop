import React, { useState, useEffect } from 'react';
import type { CartItem } from '../types.js';
import { X, Trash2, Mail, ShieldCheck, ArrowRight, ShoppingBag, Lock } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: string;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: (email: string) => void;
  isCheckingOut: boolean;
  telegramUser?: { id: number; username?: string; first_name?: string };
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isCheckingOut
}) => {
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

  const total = cart.reduce((sum, item) => {
    return sum + parseFloat(item.variant.price || '0') * item.quantity;
  }, 0);

  const handleCheckoutClick = () => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }
    setEmailError('');
    onCheckout(email);
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
              <h2 className="font-extrabold text-base text-white">Mon Panier</h2>
              <p className="text-[11px] text-gray-400 font-medium">
                {cart.length} {cart.length > 1 ? 'articles différents' : 'article sélectionné'}
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
              <p className="font-bold text-base text-gray-200 mb-1">Votre panier est vide</p>
              <p className="text-xs text-gray-500 max-w-xs">
                Explorez le catalogue Tekaz pour ajouter des comptes, licences ou services à votre panier.
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
                  Email de réception des livrables <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="votre-adresse@domaine.com"
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
                    Vos clés de licence et identifiants seront expédiés à cette adresse.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-gray-950 space-y-3.5 flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 font-medium">Montant total</span>
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {total.toFixed(2)} {currency}
              </span>
            </div>

            <button
              disabled={isCheckingOut}
              onClick={handleCheckoutClick}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.99] text-white font-black text-sm transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCheckingOut ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Création de la facture SellAuth...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Passer au Paiement Sécurisé</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
