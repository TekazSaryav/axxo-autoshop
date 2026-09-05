import React, { useState, useEffect } from 'react';
import { X, Send, Bell, Star, CheckCircle2, ShieldCheck, Zap, Sparkles, MessageCircle, ExternalLink } from 'lucide-react';
import { fetchFeedbacks } from '../services/api.js';
import { useLanguage } from '../i18n.js';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLink: (url: string) => void;
  onSelectProduct?: (productId: number) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  onOpenLink,
}) => {
  const { t, language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'support' | 'feedbacks' | 'restocks'>('support');
  const [data, setData] = useState<{
    feedbacks: Array<{ id: number; rating: number; message: string | null; date: string; product: string }>;
    total: number;
    averageRating: number;
    restocks: Array<{ id: number; name: string; price: string; stock: number | null; category: string; updated_at: string }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !data) {
      setIsLoading(true);
      fetchFeedbacks()
        .then((res) => setData(res))
        .catch((err) => console.warn('Could not load feedbacks:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0d1322] border-t border-white/10 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-gray-700/60 rounded-full mx-auto my-2.5 flex-shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-white">{t.support_community_title}</h2>
              <p className="text-[11px] text-gray-400 font-medium">{t.support_community_sub}</p>
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

        {/* Sub Navigation Tabs */}
        <div className="flex items-center p-2 bg-gray-950 border-b border-white/5 gap-1.5 px-4">
          <button
            onClick={() => setActiveSubTab('support')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'support'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.tab_assistance}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('feedbacks')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'feedbacks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{t.tab_reviews} ({data?.total || 186})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('restocks')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'restocks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.tab_restocks}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeSubTab === 'support' && (
            <div className="space-y-4">
              {/* Direct Support Card (@notthatid) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-gray-900 to-gray-950 border border-indigo-500/30 space-y-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/40">
                    @
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{t.support_card_title}</h3>
                    <p className="text-xs text-indigo-300 font-semibold">{t.support_card_sub}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {t.support_card_desc}
                </p>

                <button
                  onClick={() => onOpenLink('https://t.me/notthatid')}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.support_card_btn}</span>
                </button>
              </div>

              {/* Official Channel Card (t.me/TekazMarket) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-gray-900 to-gray-950 border border-cyan-500/30 space-y-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-cyan-600/40">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{t.channel_card_title}</h3>
                    <p className="text-xs text-cyan-300 font-semibold">t.me/TekazMarket</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {t.channel_card_desc}
                </p>

                <button
                  onClick={() => onOpenLink('https://t.me/TekazMarket')}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-extrabold text-sm transition shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.channel_card_btn}</span>
                </button>
              </div>

              {/* Security & Warranty Note */}
              <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-white/5 flex items-start gap-3 text-xs text-gray-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  {t.security_note}
                </p>
              </div>
            </div>
          )}

          {activeSubTab === 'feedbacks' && (
            <div className="space-y-3">
              {/* Rating Summary Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/60 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-white font-mono">5.0</span>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.reviews_based_on} <span className="text-white font-bold">{data?.total || 186}+</span> {t.verified_reviews}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t.reviews_positive}
                </span>
              </div>

              {/* Feedbacks List */}
              {isLoading ? (
                <div className="py-8 text-center text-gray-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">{t.loading_reviews}</p>
                </div>
              ) : (
                data?.feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3.5 rounded-2xl bg-gray-900/80 border border-white/5 space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(fb.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(fb.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white leading-snug">
                      {fb.product}
                    </p>

                    {fb.message ? (
                      <p className="text-xs text-gray-300 italic bg-gray-950/60 p-2 rounded-xl border border-white/5">
                        « {fb.message} »
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {t.verified_purchase}
                      </p>
                    )}
                  </div>
                ))
              )}

              {/* View all reviews on tekaz.xyz/feedback */}
              <div className="pt-2 pb-1">
                <button
                  onClick={() => onOpenLink('https://tekaz.xyz/feedback')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/25"
                >
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>{t.view_all_reviews}</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
                  {t.view_all_reviews_desc}
                </p>
              </div>
            </div>
          )}

          {activeSubTab === 'restocks' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-gray-900 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{t.restocks_header_info}</span>
              </div>

              {/* Restocks List */}
              <div className="space-y-2">
                {(data?.restocks || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-gray-900/80 border border-white/5 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                          {t.in_stock_badge}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white truncate">
                        {item.name}
                      </h4>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="font-black text-sm text-indigo-300 font-mono">
                        {parseFloat(item.price).toFixed(2)} €
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {item.stock === null || item.stock === -1 ? t.unlimited : `${item.stock} ${t.dispo}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
