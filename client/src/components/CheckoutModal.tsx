import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ExternalLink, CheckCircle2, Copy, Check, X, ShieldCheck, CreditCard, Coins } from 'lucide-react';
import { fetchInvoice } from '../services/api.js';

interface CheckoutModalProps {
  invoiceId: number | string;
  invoiceUrl: string;
  onClose: () => void;
  onOpenPaymentLink: (url: string) => void;
  haptic: {
    success: () => void;
    selection: () => void;
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  invoiceId,
  invoiceUrl,
  onClose,
  onOpenPaymentLink,
  haptic
}) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [status, setStatus] = useState<string>('pending');
  const [copied, setCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  // Poll invoice status
  useEffect(() => {
    let intervalId: any;
    let isMounted = true;

    async function checkStatus() {
      try {
        const inv = await fetchInvoice(invoiceId);
        if (!isMounted) return;
        setInvoice(inv);

        if (inv.status === 'completed' || inv.status === 'paid') {
          setStatus('completed');
          haptic.success();
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          clearInterval(intervalId);
        }
      } catch (err) {
        console.warn('Error polling invoice:', err);
      }
    }

    checkStatus();
    intervalId = setInterval(checkStatus, 3500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [invoiceId, haptic]);

  const copyDeliverables = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    haptic.selection();
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInvoiceId = () => {
    navigator.clipboard.writeText(String(invoiceId));
    setIdCopied(true);
    haptic.selection();
    setTimeout(() => setIdCopied(false), 2000);
  };

  const isCompleted = status === 'completed' || invoice?.status === 'completed' || invoice?.status === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[#0d1322] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden animate-scale-up text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-850 hover:bg-gray-750 text-gray-400 hover:text-white transition flex items-center justify-center cursor-pointer border border-white/5"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {isCompleted ? (
          /* Payment Success & Deliverables View */
          <div className="space-y-4 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Paiement Validé !</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                Facture <span className="font-mono">#{invoiceId}</span> honorée
              </p>
            </div>

            {/* Deliverables display */}
            {invoice?.delivered ? (
              <div className="text-left bg-gray-950 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-bold text-gray-200">Vos livrables (clés / comptes) :</span>
                  <button
                    onClick={() => copyDeliverables(invoice.delivered)}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-gray-900 border border-white/5 font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all select-all leading-relaxed">
                  {invoice.delivered}
                </pre>
              </div>
            ) : (
              <div className="p-3.5 bg-gray-900/80 border border-white/5 rounded-2xl text-xs text-gray-300">
                Vos accès ont également été envoyés à{' '}
                <span className="text-indigo-300 font-bold font-mono">{invoice?.email}</span> ainsi que par message Telegram.
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Terminer et retourner à la boutique
            </button>
          </div>
        ) : (
          /* Payment Pending View */
          <div className="space-y-4 pt-2">
            {/* Animated Radar Circle */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-radar" />
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Coins className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Commande en attente de paiement</h3>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-gray-400">
                <span>Facture</span>
                <button
                  onClick={copyInvoiceId}
                  className="font-mono text-indigo-300 font-bold bg-gray-800/80 px-2 py-0.5 rounded-md border border-white/5 hover:border-white/20 transition flex items-center gap-1 cursor-pointer"
                  title="Copier le numéro de facture"
                >
                  #{invoiceId}
                  {idCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Payment Methods Badges */}
            <div className="p-3.5 bg-gray-950/70 border border-white/5 rounded-2xl text-left space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Moyens de paiement acceptés :
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Carte / Stripe
                </span>
                <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">
                  ₿ Bitcoin
                </span>
                <span className="px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                  Ł Litecoin
                </span>
                <span className="px-2 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  ◎ Solana
                </span>
              </div>
            </div>

            {/* Direct CTA */}
            <button
              onClick={() => onOpenPaymentLink(invoiceUrl)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-95 text-white font-black text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Accéder à la Passerelle SellAuth</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Real-time Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Détection automatique du paiement en cours...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
