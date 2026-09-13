import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('tekaz_cached_products');
      localStorage.removeItem('tekaz_cached_shop');
    } catch {}
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080c15] text-white flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-[#0d1322] border border-amber-500/30 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight text-white">Une erreur d'affichage est survenue</h2>
              <p className="text-xs text-gray-400">
                La page n'a pas pu s'afficher correctement. Cliquez ci-dessous pour recharger l'application en toute sécurité.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 text-left overflow-hidden">
                <p className="font-mono text-[10px] text-red-300 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réinitialiser & Recharger</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
