'use client';
// frontend/app/(auth)/login/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 5
//
// ══ AAP NE JO KAHA ══
// "Purane forms abhi tak chal rahe hain — naye mail se kholo to form aa
//  jata hai, jab ke web directly open honi chahiye."
//
// ══ MASLA ══
// Do alag login system ek saath chal rahe thay:
//
//   1. AuthModal (naya) — Navbar aur "+" button se khulta hai
//   2. Ye safha `/login` (purana) — apna alag form, apni alag theme
//
// Aur kai jagah se log yahan par bhej diye jate thay:
//   • LoginWarningModal ke "Sign In" / "Register" buttons
//   • CarCard ka wishlist button (`router.push('/login')`)
//   • email verification link ka `?redirect=/login`
//   • purane bookmarks
//
// Nateeja: kabhi naya modal khulta, kabhi purana safha — do alag
// shakalein, do alag tajurbe.
//
// ══ HAL ══
// Ye safha ab koi form NAHI dikhata. Ye bas homepage par bhej deta hai
// aur wahan AuthModal khud khul jata hai (`?auth=login` ke zariye).
//
// Faida hataane ke bajaye redirect rakhne ka: purane links, bookmarks
// aur email ke andar mojood URLs sab chalte rehte hain — 404 nahi aata.
//
// ⚠️ EK CHOTA SA KAAM BAQI HAI (bas 4 lines):
//    Navbar ko batana hoga ke `?auth=` dekhe to modal khol de. Tareeqa
//    README ke section "Navbar ka 4-line patch" mein hai.
//    Us ke bagair user homepage par to pohanch jayega, lekin modal khud
//    nahi khulega — usay Sign In dabana parega.

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

function LoginRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();

  useEffect(() => {
    // Purane link par `?redirect=/dashboard` ho sakta hai — usay saath
    // le kar chalte hain taake login ke baad user wahin pohanche.
    const next = params.get('redirect') || params.get('next') || '';
    const qs = new URLSearchParams({ auth: 'login' });
    if (next) qs.set('next', next);

    // `replace` — `push` nahi. Warna user back dabaye to phir isi safhe
    // par aa jata hai aur ek loop ban jata hai.
    router.replace(`/?${qs.toString()}`);
  }, [router, params]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3 px-6"
      style={{ background: 'var(--bg-page)' }}
    >
      <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {t('auth.openingSignIn')}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}