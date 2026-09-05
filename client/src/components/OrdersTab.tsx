import React from 'react';
import type { SavedOrder } from '../types.js';
import { PackageCheck, ExternalLink, X, Clock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n.js';

interface OrdersTabProps {
  isOpen: boolean;
  onClose: () => void;
  orders: SavedOrder[];
  onOpenOrder: (invoiceId: string | number, invoiceUrl: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  isOpen,
  onClose,
  orders,
  onOpenOrder
}) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0d1322] border-t border-white/10 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-gray-700/60 rounded-full mx-auto my-2.5 flex-shrink-0" />

        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">{t.orders_title}</h2>
              <p className="text-[11px] text-gray-400 font-medium">{t.orders_subtitle}</p>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {orders.length === 0 ? (
            <div className="py-14 text-center text-gray-400 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center mb-3">
                <PackageCheck className="w-8 h-8 stroke-1 text-indigo-400/50" />
              </div>
              <p className="font-bold text-base text-gray-200 mb-1">{t.no_orders_title}</p>
              <p className="text-xs text-gray-500 max-w-xs">
                {t.no_orders_desc}
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.invoiceId}
                onClick={() => onOpenOrder(ord.invoiceId, ord.url)}
                className="p-4 rounded-2xl bg-gray-900/80 border border-white/5 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between gap-3 shadow-sm active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm text-white font-mono">
                      #{ord.invoiceId}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        ord.status === 'completed' || ord.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {ord.status === 'completed' || ord.status === 'paid' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {t.paid_status}
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          {t.pending_status}
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    {new Date(ord.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  <div className="mt-2 text-xs text-gray-300">
                    {ord.items.map((i, idx) => (
                      <span key={idx} className="block text-[11px] text-gray-300 font-medium">
                        • {i.title} {i.variant ? `(${i.variant})` : ''} x{i.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2.5">
                  <span className="font-black text-base text-indigo-300 font-mono">
                    {ord.total.toFixed(2)} {ord.currency}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white transition flex items-center justify-center border border-white/5">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
