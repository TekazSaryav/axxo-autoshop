import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ExternalLink, CheckCircle2, Clock, Copy, Check, X, ShieldAlert } from 'lucide-react';
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
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
          clearInterval(intervalId);
        }
      } catch (err) {
        console.warn('Error polling invoice:', err);
      }
    }

    // Initial check
    checkStatus();

    // Poll every 4 seconds
    intervalId = setInterval(checkStatus, 4000);

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

  const isCompleted = status === 'completed' || invoice?.status === 'completed' || invoice?.status === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden animate-scale-up text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {isCompleted ? (
          /* Payment Success & Deliverables View */
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">Commande Validée !</h3>
              <p className="text-xs text-emerald-400 font-medium mt-1">
                Paiement reçu • Facture #{invoiceId}
              </p>
            </div>

            {/* Deliverables display */}
            {invoice?.delivered ? (
              <div className="text-left bg-gray-950 p-3.5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">Vos identifiants / Clé :</span>
                  <button
                    onClick={() => copyDeliverables(invoice.delivered)}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <pre className="p-2.5 rounded-xl bg-gray-900 border border-white/5 font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all select-all">
                  {invoice.delivered}
                </pre>
              </div>
            ) : (
              <div className="p-3 bg-gray-800/60 rounded-xl text-xs text-gray-300">
                Vos livrables ont été envoyés à l'adresse email{' '}
                <span className="text-indigo-300 font-semibold">{invoice?.email}</span> et sur Telegram.
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30"
            >
              Retour à la boutique
            </button>
          </div>
        ) : (
          /* Payment Pending View */
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse text-indigo-400" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Commande en attente</h3>
              <p className="text-xs text-gray-400 mt-1">
                Facture <span className="font-mono text-gray-200">#{invoiceId}</span> créée sur SellAuth
              </p>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl text-xs text-indigo-200 leading-relaxed text-left space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-indigo-300">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                Étape suivante :
              </p>
              <p>
                Cliquez sur le bouton ci-dessous pour choisir votre méthode de paiement (Carte Bancaire, Crypto BTC/LTC/SOL, etc.) sur la passerelle sécurisée SellAuth.
              </p>
            </div>

            {/* Direct Link Button */}
            <button
              onClick={() => onOpenPaymentLink(invoiceUrl)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>Accéder au Paiement SellAuth</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Polling indicator */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Détection automatique du paiement en cours...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
