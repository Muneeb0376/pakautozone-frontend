'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/(main)/pricing/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 5
//
// ══════════════════════════════════════════════════════════════
//  AAP KA MASLA — "showroom ki payment form nahi aa raha, us ki
//  jagah seller wala form aa raha hai"
// ══════════════════════════════════════════════════════════════
// Screenshot 3 mein "Showroom Subscription" ka badge tha, lekin card
// par "Private Seller — PKR 0/month" likha tha, aur neeche
// "Pay JazzCash se" ka button.
//
// ══ WAJAH ══
// Phase 2 mein maine `getPlans` ko do plans lauta-ne wala bana diya:
//
//     plans[0] = Private Seller      (PKR 0)   ← free wala
//     plans[1] = Showroom Monthly    (PKR 100)
//
// Lekin ye safha purane waqt ka code chala raha tha:
//
//     .then(d => setPlan((d.plans || [])[0] || null))
//                                     ^^^ hamesha PEHLA plan
//
// Yani wo Private Seller (PKR 0) uthata tha aur usi par
// "SUBSCRIPTION" ki payment ka button laga deta tha. Nateeja: qeemat
// PKR 0 dikhti thi, plan ka naam ghalat, aur number bhi nahi poocha
// jata tha.
//
// ══ DOOSRA MASLA — NUMBER NAHI POOCHTA THA ══
// Ye safha seedha `POST /api/payments` maar deta tha bagair `phone`
// bheje. Phase 2 ke backend mein number ab lazmi hai, is liye ye
// request ab reject bhi ho jati (400).
//
// ══ AB ══
// 1. DONO plans saaf saaf dikhte hain — free wala bhi, showroom wala
//    bhi — taake user faisla kar sake.
// 2. Showroom ka button seedha payment START nahi karta. Wo
//    `/payment/showroom` par le jata hai, jahan PaymentStartForm
//    method aur NUMBER dono poochta hai, phir agle safhe par hamara
//    receiving number dikhata hai. Wahi flow jo boost aur listing ka
//    hai — poori site par ek jaisa.
// 3. Qeematein `/api/payments/pricing` se aati hain — hardcode nahi.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check, ShieldCheck, Loader2, Store, User, Infinity as InfinityIcon,
  ArrowRight, TrendingUp,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function PricingPage() {
  const { t } = useLang();
  const router = useRouter();
  const { token, user, _hasHydrated } = useAuthStore();

  const [pricing, setPricing] = useState(null);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/payments/pricing`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setPricing(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Login hai to batao ke kitni free listings baqi hain
  useEffect(() => {
    if (!_hasHydrated || !token) return;
    fetch(`${API}/payments/listing-quota`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setQuota(d.data))
      .catch(() => {});
  }, [_hasHydrated, token]);

  const goShowroom = () => {
    if (!token) { router.push('/?auth=login&next=/payment/showroom'); return; }
    // ✅ Yahan se seedha payment START nahi hoti. Pehle wo safha jahan
    // method aur number poocha jata hai.
    router.push(user?.hasStore ? '/payment/showroom' : '/dashboard/register-showroom');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const freeQuota = pricing?.freeListingQuota ?? 3;
  const extraPrice = pricing?.extraListingPrice ?? 15;
  const showroomPrice = pricing?.showroomPrice ?? 100;
  const boostPrice = pricing?.boostPrice ?? 20;
  const days = pricing?.subscriptionDays ?? 30;

  return (
    <div className="min-h-screen pb-16 paz-has-bottom-nav" style={{ background: 'var(--bg-page)' }}>

      {/* ══════════ Hero ══════════ */}
      <div
        className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden mb-10"
        style={{ background: 'var(--bg-hero)' }}
      >
        <div className="relative max-w-3xl mx-auto px-4 py-14 sm:py-16 text-center">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(232,184,75,0.12)',
              color: 'var(--accent)',
              border: '1px solid rgba(232,184,75,0.3)',
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.5} />{t('listing.pricing')}</span>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('pricing.heroTitle')}
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('pricing.heroSub', { n: freeQuota })}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">

        {/* Login user ka apna quota */}
        {quota && !quota.showroomActive && (
          <div
            className="mb-8 px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm"
            style={{ background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)' }}
          >
            <User size={16} className="shrink-0" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {quota.quotaExceeded
                ? t('pricing.quotaUsed', { n: quota.free })
                : t('pricing.quotaRemaining', { n: quota.remaining })}
            </p>
          </div>
        )}

        {/* ══════════ Do plan ══════════ */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* ── Private Seller ── */}
          <div
            className="rounded-2xl p-6 sm:p-7 flex flex-col"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}
          >
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'var(--bg-surface-alt)' }}
            >
              <User size={20} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
            </span>

            <h2 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>
              {t('pricing.privateSeller')}
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {t('pricing.privateDesc')}
            </p>

            <p className="mb-5">
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>PKR 0</span>
              <span className="text-sm font-semibold ml-1.5" style={{ color: 'var(--text-muted)' }}>
                {t('pricing.starting')}
              </span>
            </p>

            <ul className="space-y-2.5 mb-6 grow">
              {[
                t('pricing.freeListings', { n: freeQuota }),
                t('pricing.extraPerListing', { price: extraPrice }),
                t('pricing.hiddenNumber'),
                t('pricing.directChat'),
                t('pricing.boostOptional', { price: boostPrice }),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Check size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/new-listing"
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
              style={{ border: '1.5px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-surface-alt)' }}
            >
              {t('pricing.freeListing')} <ArrowRight size={15} />
            </Link>
          </div>

          {/* ── Showroom ── */}
          <div
            className="rounded-2xl p-6 sm:p-7 flex flex-col relative"
            style={{ background: 'var(--bg-dash-cta)', border: '1.5px solid var(--accent)', boxShadow: '0 14px 40px -18px rgba(232,184,75,0.5)' }}
          >
            <span
              className="absolute -top-3 left-6 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {t('pricing.forDealers')}
            </span>

            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(232,184,75,0.18)' }}
            >
              <Store size={20} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
            </span>

            <h2 className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)' }}>
              {t('pricing.showroomMonthly')}
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {t('pricing.regularSellers')}
            </p>

            <p className="mb-5">
              <span className="text-4xl font-black" style={{ color: 'var(--accent)' }}>
                PKR {showroomPrice}
              </span>
              <span className="text-sm font-semibold ml-1.5" style={{ color: 'var(--text-muted)' }}>
                {t('pricing.perMonth')}
              </span>
            </p>

            <ul className="space-y-2.5 mb-6 grow">
              <li className="flex items-start gap-2.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <InfinityIcon size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                {t('pricing.unlimited')}
              </li>
              {[
                t('pricing.publicPage'),
                t('pricing.applyBadge'),
                t('pricing.noRepayment', { n: days }),
                t('pricing.allLive'),
                t('pricing.partsToo'),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Check size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  {f}
                </li>
              ))}
            </ul>

            {/* ✅ Ab seedha payment START nahi karta — agle safhe par
                method aur number poocha jata hai */}
            <button
              onClick={goShowroom}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-transform active:scale-[0.98]"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
              }}
            >
              {user?.hasStore ? t('pricing.activateShowroom') : t('pricing.registerShowroom')}
              <ArrowRight size={15} />
            </button>

            <p className="text-[11px] text-center mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('pricing.nextPaymentHint')}
            </p>
          </div>
        </div>

        {/* ══════════ Boost ══════════ */}
        <div
          className="mt-5 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(232,184,75,0.10)' }}
          >
            <TrendingUp size={20} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
          </span>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {t('pricing.boostTitle', { price: boostPrice })}
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t('pricing.boostDesc', { days: pricing?.boostDays ?? 7 })}
            </p>
          </div>

          <Link
            href="/dashboard/seller"
            className="shrink-0 h-10 px-5 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {t('pricing.viewCars')}
          </Link>
        </div>

        {/* ══════════ Chhota FAQ ══════════ */}
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {[
            {
              q: t('pricing.faqLiveQ'),
              a: t('pricing.faqLiveA'),
            },
            {
              q: t('pricing.faqDeleteQ'),
              a: t('pricing.faqDeleteA'),
            },
            {
              q: t('pricing.faqExpireQ'),
              a: t('pricing.faqExpireA', { n: days }),
            },
            {
              q: t('pricing.faqBadgeQ'),
              a: t('pricing.faqBadgeA'),
            },
          ].map((f) => (
            <div
              key={f.q}
              className="rounded-xl p-5"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <p className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{f.q}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}