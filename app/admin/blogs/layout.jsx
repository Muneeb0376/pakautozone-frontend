'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/admin/blogs/layout.jsx
//
// /admin/blogs, /admin/blogs/new aur /admin/blogs/[id]/edit — teenon ke liye
// ek hi ADMIN guard. Har page mein alag check likhne ki zaroorat nahi.
//
// ⚠️ Ye sirf UX guard hai, security nahi. Asal security backend par hai:
//    har `/api/blogs/admin/*` route `authenticate + authorizeRoles('ADMIN')`
//    se guzarta hai, isliye BUYER/DEALER API se direct bhi kuch nahi kar sakte
//    (403 milega). Yahan ka kaam sirf itna hai ke ghalat user ko khali table
//    aur error ke bajaye saaf message mile.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AdminBlogsLayout({ children }) {
  const { t } = useLang();
  const { user, role, isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Zustand persist localStorage se hydrate hota hai — pehle render par
  // token abhi aaya nahi hota. Isliye mount + hydration dono ka intezar.
  useEffect(() => { setMounted(true); }, []);

  const ready = mounted && _hasHydrated !== false;
  const effectiveRole = String(role || user?.role || '').toUpperCase();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-page)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (!isAuthenticated || effectiveRole !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm text-center">
          <ShieldAlert size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('admin.onlyAdmin')}</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {t('admin.ui.blogAccess')}
          </p>
          <Link
            href={isAuthenticated ? '/' : '/login'}
            className="inline-flex h-10 px-5 rounded-xl text-sm font-bold items-center"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {isAuthenticated ? t('admin.ui.home') : t('admin.ui.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {children}
    </div>
  );
}