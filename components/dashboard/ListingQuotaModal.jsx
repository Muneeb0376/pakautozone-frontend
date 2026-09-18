'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/dashboard/ListingQuotaModal.jsx
//
// ✅ NAYI FILE — Issue 2
//
// Aap ka point: "jab user 3 car free list kar de aur chauthi list karne
// lagay to option aaye ke aap ne free credentials chala liye — ab ya to
// showroom register karein (ek baar payment) ya chauthi listing ke liye
// PKR 15 dein."
//
// Ye modal wahi do rastay dikhata hai. Do jagah se khulta hai:
//
//   1. Seller dashboard ke "New Listing" button se — form kholne se
//      PEHLE. Faida: seller poora form bharne ke baad rok-tok ka shikar
//      nahi hota, usay pehle hi pata chal jata hai.
//
//   2. new-listing form ke submit ke baad — agar backend ne
//      `requiresPayment: true` bheja (yani listing save to ho gayi
//      lekin PENDING hai). Us soorat mein `carId` pass hota hai aur
//      "PKR 15 dein" wala button seedha usi car ki payment par le jata
//      hai.
//
// Rang sirf var(--*) tokens se — light/dark dono theek. Koi emoji,
// koi gradient block, koi cartoon icon.

import Link from 'next/link';
import { X, Store, CreditCard, Check, Infinity as InfinityIcon } from 'lucide-react';

export default function ListingQuotaModal({
  open,
  onClose,
  quota,          // { used, free, remaining, extraPrice }
  carId = null,   // agar listing pehle se save ho chuki hai
  showroomPrice = 100,
}) {
  const { t } = useLang();
  if (!open) return null;

  const free = quota?.free ?? 3;
  const used = quota?.used ?? free;
  const extraPrice = quota?.extraPrice ?? 15;

  // Agar listing pehle se ban chuki hai to usi car ki fee bharni hai,
  // warna seller ko pehle listing banani hogi.
  const payHref = carId
    ? `/payment/listing?carId=${carId}&type=extra`
    : '/dashboard/new-listing';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px -20px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 py-5 flex items-start justify-between gap-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.ui.freeListingsDone')}
            </h2>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.ui.quotaBody', { used, free })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="shrink-0 p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Do rastay ── */}
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          {/* ══ Option 1 — Showroom ══ */}
          <div
            className="rounded-xl p-5 flex flex-col relative"
            style={{
              background: 'var(--bg-dash-cta)',
              border: '1.5px solid var(--accent)',
            }}
          >
            <span
              className="absolute -top-2.5 left-4 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {t('dashboard.ui.better')}
            </span>

            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(232,184,75,0.18)' }}
            >
              <Store size={19} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
            </span>

            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{t('dashboard.registerShowroom')}</p>
            <p className="text-2xl font-black mb-3" style={{ color: 'var(--accent)' }}>
              PKR {showroomPrice}
              <span className="text-xs font-semibold ml-1" style={{ color: 'var(--text-muted)' }}>
                {t('dashboard.ui.perMonth')}
              </span>
            </p>

            <ul className="space-y-2 mb-5 grow">
              {[
                t('dashboard.ui.unlimitedBenefit'),
                t('dashboard.ui.publicShowroomBenefit'),
                t('dashboard.ui.verifiedBenefit'),
                t('dashboard.ui.liveBenefit'),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {f.startsWith('Unlimited')
                    ? <InfinityIcon size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    : <Check size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />}
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/register-showroom"
              className="w-full h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-transform active:scale-[0.98]"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                boxShadow: '0 6px 18px -6px rgba(232,184,75,0.5)',
              }}
            >
              {t('dashboard.ui.createShowroom')}
            </Link>
          </div>

          {/* ══ Option 2 — Ek listing ki fee ══ */}
          <div
            className="rounded-xl p-5 flex flex-col"
            style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'var(--bg-dash-card)' }}
            >
              <CreditCard size={19} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
            </span>

            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.ui.onlyThisListing')}
            </p>
            <p className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
              PKR {extraPrice}
              <span className="text-xs font-semibold ml-1" style={{ color: 'var(--text-muted)' }}>
                {t('dashboard.ui.perListing')}
              </span>
            </p>

            <ul className="space-y-2 mb-5 grow">
              {[
                t('dashboard.ui.oneTimeFee'),
                t('dashboard.ui.noMonthlyPayment'),
                t('dashboard.ui.occasionalSeller'),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  <Check size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={payHref}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
              style={{
                border: '1.5px solid var(--border-color)',
                color: 'var(--text-primary)',
                background: 'var(--card-bg)',
              }}
            >
              <CreditCard size={15} />
              {carId ? t('dashboard.ui.payListing', { price: extraPrice }) : t('dashboard.ui.listingCreate')}
            </Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 text-center"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('dashboard.ui.freeListingFooter', { free })}
          </p>
        </div>
      </div>
    </div>
  );
}