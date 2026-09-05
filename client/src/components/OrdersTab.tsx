import React from 'react';
import type { SavedOrder } from '../types.js';
import { PackageCheck, ExternalLink, X, Clock, CheckCircle2 } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-gray-900 border-t border-white/10 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white">Historique de mes commandes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <PackageCheck className="w-12 h-12 stroke-1 opacity-40 mb-3 text-indigo-400" />
              <p className="font-medium text-sm text-gray-300">Aucune commande enregistrée</p>
              <p className="text-xs text-gray-500 mt-1">Vos futurs achats apparaîtront ici.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.invoiceId}
                onClick={() => onOpenOrder(ord.invoiceId, ord.url)}
                className="p-3.5 rounded-2xl bg-gray-800/40 border border-white/5 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white">
                      Facture #{ord.invoiceId}
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
                          Payé
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          En attente
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">
                    {new Date(ord.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  <div className="mt-2 text-xs text-gray-300">
                    {ord.items.map((i, idx) => (
                      <span key={idx} className="block text-[11px] text-gray-400">
                        • {i.title} {i.variant ? `(${i.variant})` : ''} x{i.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className="font-extrabold text-sm text-indigo-300">
                    {ord.total.toFixed(2)} {ord.currency}
                  </span>
                  <div className="p-2 rounded-xl bg-gray-700/60 text-gray-300">
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
