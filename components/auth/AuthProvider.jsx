'use client';
import { useLang } from '@/lib/i18nContext';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { rehydrateAuthStoreFromStorage } from '@/lib/auth';

export default function AuthProvider({ children }) {
  const { t } = useLang();
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!token) {
      rehydrateAuthStoreFromStorage();
    }
    setIsReady(true);
  }, [token]);

  if (!hasHydrated || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center">{t('common.loading')}</div>
    );
  }

  return children;
}