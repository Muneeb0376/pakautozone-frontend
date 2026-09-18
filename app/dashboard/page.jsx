//frontend/app/dashboard/page.jsx//
'use client';
import { useLang } from '@/lib/i18nContext';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/lib/getDashboardPath';

/**
 * ✅ DASHBOARD ROUTER PAGE
 * Ab ye page khud koi decision nahi leta — sirf shared
 * getDashboardPath() function ko call karta hai, taake login page
 * aur ye page hamesha SAME jagah redirect karein. Mismatch ab
 * possible nahi hai.
 */
export default function DashboardIndexPage() {
  const { t } = useLang();
  const router = useRouter();
  const { user, store, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    const destination = getDashboardPath(user, store);
    router.replace(destination);
  }, [_hasHydrated, isAuthenticated, user, store, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}