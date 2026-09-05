import { useEffect, useMemo, useCallback } from 'react';
import type { TelegramWebApp, TelegramWebAppUser } from '../types.js';

export function useTelegram() {
  const tg: TelegramWebApp | undefined = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

  useEffect(() => {
    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.warn('Could not expand or ready Telegram WebApp:', e);
      }
    }
  }, [tg]);

  const user: TelegramWebAppUser | undefined = useMemo(() => {
    return tg?.initDataUnsafe?.user;
  }, [tg]);

  const haptic = useMemo(() => ({
    light: () => {
      try { tg?.HapticFeedback?.impactOccurred('light'); } catch {}
    },
    medium: () => {
      try { tg?.HapticFeedback?.impactOccurred('medium'); } catch {}
    },
    heavy: () => {
      try { tg?.HapticFeedback?.impactOccurred('heavy'); } catch {}
    },
    success: () => {
      try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {}
    },
    error: () => {
      try { tg?.HapticFeedback?.notificationOccurred('error'); } catch {}
    },
    selection: () => {
      try { tg?.HapticFeedback?.selectionChanged(); } catch {}
    }
  }), [tg]);

  const openLink = useCallback((url: string) => {
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, [tg]);

  const close = useCallback(() => {
    if (tg?.close) {
      tg.close();
    }
  }, [tg]);

  return {
    tg,
    user,
    isInTelegram: !!tg?.initData,
    haptic,
    openLink,
    close,
    mainButton: tg?.MainButton,
    backButton: tg?.BackButton,
    theme: tg?.colorScheme || 'dark'
  };
}
