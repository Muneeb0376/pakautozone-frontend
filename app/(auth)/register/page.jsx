'use client';
// frontend/app/(auth)/register/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 5
//
// Bilkul wahi wajah jo `/login` ki hai — purana register form apni alag
// theme aur apne alag flow ke saath chal raha tha. Ab ye safha sirf
// homepage par bhejta hai aur wahan AuthModal ka "Sign Up" tab khul
// jata hai.
//
// Safha delete karne ki bajaye redirect is liye rakha hai ke purane
// bookmarks, email links aur `?redirect=` wale URLs sab chalte rahein —
// 404 kisi ko na mile.

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

function RegisterRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();

  useEffect(() => {
    const next = params.get('redirect') || params.get('next') || '';
    const qs = new URLSearchParams({ auth: 'signup' });
    if (next) qs.set('next', next);
    router.replace(`/?${qs.toString()}`);
  }, [router, params]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3 px-6"
      style={{ background: 'var(--bg-page)' }}
    >
      <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {t('auth.openingSignUp')}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      }
    >
      <RegisterRedirect />
    </Suspense>
  );
}