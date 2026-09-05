import React, { useState, useEffect } from 'react';
import type { CartItem } from '../types.js';
import { X, Trash2, Mail, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-gray-900 border-t border-white/10 rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white">Mon Panier ({cart.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <ShoppingBag className="w-12 h-12 stroke-1 opacity-40 mb-3 text-indigo-400" />
              <p className="font-medium text-sm text-gray-300 mb-1">Votre panier est vide</p>
              <p className="text-xs text-gray-500">Ajoutez des produits pour passer commande.</p>
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
                      className="p-3 rounded-2xl bg-gray-800/40 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {img ? (
                          <img
                            src={img}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-gray-900 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-white truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-indigo-400 font-medium">
                            {item.variant.name} • {itemPrice.toFixed(2)} {currency}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 bg-gray-900 px-2 py-1 rounded-lg border border-white/5">
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                            className="text-gray-400 hover:text-white px-1 text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                            className="text-gray-400 hover:text-white px-1 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Total item & remove */}
                        <div className="text-right">
                          <span className="font-bold text-sm text-white block">
                            {itemTotal} {currency}
                          </span>
                          <button
                            onClick={() => onRemoveItem(idx)}
                            className="text-rose-400 hover:text-rose-300 p-0.5 inline-flex transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Email Form */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Email de livraison SellAuth <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="votre-email@exemple.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition ${
                    emailError
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                {emailError ? (
                  <p className="text-[11px] text-rose-400 mt-1">{emailError}</p>
                ) : (
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Vos accès, identifiants et clés de licence seront envoyés à cette adresse.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-gray-950 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total à régler</span>
              <span className="text-xl font-extrabold text-white">
                {total.toFixed(2)} {currency}
              </span>
            </div>

            <button
              disabled={isCheckingOut}
              onClick={handleCheckoutClick}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Génération de la commande...</span>
                </div>
              ) : (
                <>
                  <span>Passer au Paiement</span>
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
