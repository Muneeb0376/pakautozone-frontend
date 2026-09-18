'use client';
// frontend/components/dashboard/ShowroomPaymentBanner.jsx
//
// ✅ POORI FILE REPLACE — Issue 3
//
// ══ AAP KA MASLA ══
// "Shayad maine payment ki hui hai aur mera showroom main page par show bhi
//  ho raha hai per ye message abhi bhi aa raha hai."
//
// Purana banner sirf ek cheez dekhta tha: `status.isActive`. Aur wo column
// database mein kabhi update hi nahi hota tha (na expire par false hota
// tha, na payment ke baad reliably true). Is liye showroom live hone ke
// bawajood banner chipka rehta tha.
//
// ══ AB YE 5 HAALATEIN JAANTA HAI ══
//
//   1. SUBSCRIPTION CHAL RAHI HAI      → banner bilkul nahi (khamoshi)
//   2. EXPIRY QAREEB HAI (warning din)  → amber warning + din ki ginti
//   3. EXPIRE HO GAYI                   → laal, "showroom off ho gayi"
//   4. PAYMENT REVIEW MEIN (VERIFYING)  → neutral "intezar karein"
//   5. KABHI PAY HI NAHI KIYA           → amber, pehli payment ki dawat
//
// ══ TAREEKH KA HISAAB KAHAN HOTA HAI ══
// Yahan nahi — backend mein (services/subscription.service.js). Frontend
// sirf wo dikhata hai jo API bhejti hai (`expiringSoon`, `daysLeft`,
// `justExpired`, `neverPaid`). Wajah: agar hisaab yahan hota to koi bhi
// apni computer ki tareekh badal kar banner gayab kar sakta tha, aur
// showroom expire hone ke bawajood live rehti.
//
// ══ VERIFIED BADGE ══
// Is file mein `isVerified` sirf parha jata hai, badla nahi. Showroom
// expire ho kar band ho jaye tab bhi badge apni jagah rehta hai, aur
// payment karte hi wesa hi verified live ho jati hai — bilkul jo aap ne
// kaha tha.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, X, CreditCard, Clock, ShieldCheck, Hourglass } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/lib/i18nContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ShowroomPaymentBanner() {
  const { token, _hasHydrated } = useAuthStore();
  const { t } = useLang();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!_hasHydrated || !token) return;
    fetch(`${API}/payments/subscription-status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((json) => setStatus(json.data))
      .catch(() => setStatus(null));
  }, [_hasHydrated, token]);

  if (!status || !status.hasStore || dismissed) return null;

  // ⚠️ Sirf REGISTERED showroom ke liye. Private seller ka bhi ek
  // "hidden anchor store" hota hai (car.controller.js banata hai taake
  // listings kahin link ho sakein) — usay showroom subscription ka
  // banner dikhana bilkul ghalat tha.
  if (status.isShowroom === false) return null;

  /* ── 1. Sab theek — banner ki zarurat hi nahi ── */
  if (status.isActive && !status.expiringSoon) return null;

  /* ── 2. Payment review mein ── */
  if (status.paymentStatus === 'VERIFYING') {
    return (
      <Banner
        tone="neutral"
        Icon={Hourglass}
        title={t('payment.reviewing')}
        body={t('payment.reviewingBody')}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  /* ── 3. Payment reject ── */
  if (status.paymentStatus === 'REJECTED' && !status.isActive) {
    return (
      <Banner
        tone="danger"
        Icon={AlertTriangle}
        title={t('payment.rejectedTitle')}
        body={t('payment.rejectedBody')}
        cta={{ href: '/payment/showroom', label: t('common.tryAgain') }}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  /* ── 4. Expiry qareeb — abhi live hai lekin warning ── */
  if (status.isActive && status.expiringSoon) {
    const d = status.daysLeft;
    return (
      <Banner
        tone="warning"
        Icon={Clock}
        title={
          d <= 0
            ? t('payment.expiresToday')
            : d === 1
            ? t('payment.expiresTomorrow')
            : t('payment.expiresIn', { days: d })
        }
        body={t('payment.expiresBody', { date: status.endDate ? new Date(status.endDate).toLocaleDateString() : t('payment.expiry') })}
        cta={{ href: '/payment/showroom', label: t('payment.renew', { amount: status.price }) }}
        badge={status.isVerified ? t('payment.verifiedBadgeSafe') : null}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  /* ── 5. Expire ho chuki ── */
  if (!status.isActive && !status.neverPaid) {
    return (
      <Banner
        tone="danger"
        Icon={AlertTriangle}
        title={t('payment.subscriptionExpired')}
        body={t('payment.expiredBody', { count: status.pendingCarsCount || t('common.all') })}
        cta={{ href: '/payment/showroom', label: t('payment.renew', { amount: status.price }) }}
        badge={status.isVerified ? t('payment.verifiedBadgeKept') : null}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  /* ── 6. Kabhi pay hi nahi kiya ── */
  return (
    <Banner
      tone="warning"
      Icon={CreditCard}
      title={t('payment.notLive', { amount: status.price })}
      body={t('payment.unlockBody')}
      cta={{ href: '/payment/showroom', label: t('dashboard.payNow') }}
      onDismiss={() => setDismissed(true)}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   Banner shell — teen tone, dono theme
   ═══════════════════════════════════════════════════════════ */
function Banner({ tone, Icon, title, body, cta, badge, onDismiss }) {
  const { t } = useLang();
  const tones = {
    warning: {
      bg: 'var(--bg-dash-cta)',
      border: 'var(--accent)',
      icon: 'var(--accent)',
      btnBg: 'var(--accent)',
      btnText: 'var(--accent-text)',
    },
    danger: {
      bg: 'rgba(220,38,38,0.08)',
      border: 'rgba(220,38,38,0.35)',
      icon: '#dc2626',
      btnBg: '#dc2626',
      btnText: '#ffffff',
    },
    neutral: {
      bg: 'var(--bg-surface-alt)',
      border: 'var(--border-color)',
      icon: 'var(--text-secondary)',
      btnBg: 'var(--accent)',
      btnText: 'var(--accent-text)',
    },
  };

  const c = tones[tone] || tones.neutral;

  return (
    <div style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-start sm:items-center gap-3">
        <Icon size={18} className="shrink-0 mt-0.5 sm:mt-0" style={{ color: c.icon }} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {body}
          </p>

          {badge && (
            <p
              className="text-[11px] mt-1.5 inline-flex items-center gap-1.5 font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              <ShieldCheck size={12} style={{ color: '#059669' }} />
              {badge}
            </p>
          )}
        </div>

        {cta && (
          <Link
            href={cta.href}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-transform active:scale-[0.97]"
            style={{ background: c.btnBg, color: c.btnText }}
          >
            <CreditCard size={13} /> {cta.label}
          </Link>
        )}

        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-lg transition-opacity hover:opacity-60"
          aria-label={t('common.close')}
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}