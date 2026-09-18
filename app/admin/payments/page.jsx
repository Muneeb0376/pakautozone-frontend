'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/admin/payments/page.jsx
//
// ✅ NAYI FILE — Phase 5 (aap ka "aakhri major kaam")
//
// ══ AAP NE JO KAHA ══
// "Admin panel mein categories banao — agar kisi ne showroom ki payment
//  ki hai to wo bas showroom payments mein show ho, aur boost wali
//  payments udhar. Isi tarah har payment ki alag category ho. Aur ye sab
//  cheezen working mein aur professional way mein honi chahiyein."
//
// ══ PEHLE KYA THA ══
// `/admin` par ek hi "Manual Payments Review" ka tab tha jismein
// showroom, boost aur listing ki saari payments mili juli parri thin.
// Admin ko har card parh kar andaza lagana parta tha ke ye kis cheez ki
// payment hai. Aur sirf VERIFYING dikhti thin — approve/reject ho chuki
// payments ka koi record hi nahi tha.
//
// ══ AB ══
// Teen alag category tabs + status filter:
//
//     [ Showroom (3) ] [ Boost (1) ] [ Extra Listing (0) ] [ Sab ]
//     Status:  Review mein | Approve shuda | Reject shuda | Sab
//
// Har card par:
//   • kis qism ki payment hai (rang wala badge)
//   • kis ne ki (naam, email, showroom)
//   • kis NUMBER se bheji (admin isi se bank mein match karta hai)
//   • Transaction ID (copy button ke saath)
//   • boost/listing ho to us CAR ki tasveer, naam aur qeemat
//   • Approve / Reject
//
// ⚠️ Backend chahiye: Phase 5 ka `adminPayments.controller.js` +
//    nayi `admin.routes.js` (GET /api/admin/payments aur
//    /api/admin/payments/counts).
//
// ⚠️ Purana `/admin` safha jaisa hai waisa chalta rahega. Ye alag route
//    hai (`/admin/payments`). `/admin` par ek link laga dein — tareeqa
//    README mein hai.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Check, X, Copy, Store, TrendingUp, FileText, Phone,
  Mail, RefreshCw, ArrowLeft, AlertTriangle, Clock, CheckCircle2,
  XCircle, Car as CarIcon,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/formatPrice';
import { toTitleCase, personName } from '@/lib/textCase';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

/* ── Categories ── */
const TYPES = [
  { key: 'SUBSCRIPTION', labelKey: 'admin.showroom', blurbKey: 'admin.monthlySubscription', icon: Store },
  { key: 'BOOST', labelKey: 'admin.boost', blurbKey: 'admin.boostFee', icon: TrendingUp },
  { key: 'LISTING', labelKey: 'admin.extraListing', blurbKey: 'admin.extraListingFee', icon: FileText },
  { key: '', labelKey: 'common.all', blurbKey: 'admin.allPaymentTypes', icon: RefreshCw },
];

const STATUSES = [
  { key: 'VERIFYING', labelKey: 'admin.reviewing', icon: Clock },
  { key: 'COMPLETED', labelKey: 'admin.approvedStatus', icon: CheckCircle2 },
  { key: 'REJECTED', labelKey: 'admin.rejectedStatus', icon: XCircle },
  { key: 'ALL', labelKey: 'common.all', icon: RefreshCw },
];

const TYPE_STYLE = {
  SUBSCRIPTION: { bg: 'rgba(232,184,75,0.14)', fg: '#a17c33', labelKey: 'admin.showroom' },
  BOOST: { bg: 'rgba(5,150,105,0.12)', fg: '#059669', labelKey: 'admin.boost' },
  LISTING: { bg: 'rgba(100,116,139,0.14)', fg: '#475569', labelKey: 'admin.extraListing' },
};

export default function AdminPaymentsPage() {
  const { t } = useLang();
  const router = useRouter();
  const { token, user, _hasHydrated } = useAuthStore();

  const [type, setType] = useState('SUBSCRIPTION');
  const [status, setStatus] = useState('VERIFYING');

  const [payments, setPayments] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  /* ── Guard ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token || user?.role?.toUpperCase() !== 'ADMIN') {
      router.replace('/');
    }
  }, [_hasHydrated, token, user, router]);

  /* ── Counts (tab badges) ── */
  const loadCounts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/payments/counts`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) setCounts(json.data);
    } catch {
      // badge na dikhe to koi bara masla nahi
    }
  }, [token]);

  /* ── Payments ── */
  const loadPayments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const p = new URLSearchParams();
      if (type) p.set('type', type);
      p.set('status', status);
      p.set('limit', '50');

      const res = await fetch(`${API}/admin/payments?${p.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const json = await res.json();

      if (json.success) setPayments(json.data || []);
      else {
        setPayments([]);
        setError(json.message || t('admin.paymentsLoadFailed'));
      }
    } catch {
      setPayments([]);
      setError(t('common.serverError'));
    } finally {
      setLoading(false);
    }
  }, [token, type, status]);

  useEffect(() => { loadPayments(); }, [loadPayments]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  /* ── Approve / Reject ── */
  const act = async (id, action) => {
    const label = action === 'APPROVE' ? t('admin.approve') : t('admin.reject');
    if (!window.confirm(t('admin.confirmPaymentAction', { action: label }))) return;

    setActingId(id);
    try {
      const res = await fetch(`${API}/admin/payments/${id}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || t('admin.actionFailed'));
      } else {
        // Card ko fehrist se hata do (ab wo doosre status mein chala gaya)
        setPayments((prev) => prev.filter((p) => p.id !== id));
        loadCounts();
      }
    } catch {
      alert(t('admin.ui.serverConnect'));
    } finally {
      setActingId(null);
    }
  };

  const copyTid = async (p) => {
    if (!p.transactionId) return;
    try {
      await navigator.clipboard.writeText(p.transactionId);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch { /* clipboard block ho to koi baat nahi */ }
  };

  if (!_hasHydrated) return null;

  const verifying = counts?.verifying || {};

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">

        {/* ══ Header ══ */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold mb-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={13} />{t('dashboard.adminPanel')}</Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('admin.payments')}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('admin.paymentCategoriesDescription')}
            </p>
          </div>

          <button
            onClick={() => { loadPayments(); loadCounts(); }}
            disabled={loading}
            aria-label={t('common.refresh')}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ══ CATEGORY TABS ══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {TYPES.map((typeOption) => {
            const Icon = typeOption.icon;
            const active = type === typeOption.key;
            const badge = typeOption.key ? verifying[typeOption.key] : verifying.total;

            return (
              <button
                key={typeOption.key || 'all'}
                onClick={() => setType(typeOption.key)}
                className="relative rounded-xl p-3.5 text-left transition-all duration-200"
                style={{
                  background: active ? 'var(--bg-dash-cta)' : 'var(--card-bg)',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon
                    size={15}
                    strokeWidth={1.9}
                    style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                  />
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    {t(typeOption.labelKey)}
                  </span>

                  {/* Badge — kitni review ka intezar kar rahi hain */}
                  {badge > 0 && (
                    <span
                      className="ml-auto min-w-5 h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center"
                      style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {t(typeOption.blurbKey)}
                </p>
              </button>
            );
          })}
        </div>

        {/* ══ STATUS FILTER ══ */}
        <div
          className="inline-flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto max-w-full no-scrollbar"
          style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
        >
          {STATUSES.map((s) => {
            const Icon = s.icon;
            const active = status === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-bold whitespace-nowrap transition-colors"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={13} />
                {t(s.labelKey)}
              </button>
            );
          })}
        </div>

        {/* ══ LIST ══ */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)' }}
          >
            <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : payments.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <CheckCircle2 size={34} strokeWidth={1.3} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {t('admin.nothingHere')}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {status === 'VERIFYING'
                ? t('admin.noPaymentsReviewing')
                : t('admin.noRecordsForFilter')}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {payments.map((p) => (
              <PaymentCard
                key={p.id}
                payment={p}
                acting={actingId === p.id}
                copied={copiedId === p.id}
                onCopy={() => copyTid(p)}
                onApprove={() => act(p.id, 'APPROVE')}
                onReject={() => act(p.id, 'REJECT')}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Ek payment ka card
   ═══════════════════════════════════════════════════════════ */
function PaymentCard({ payment: p, acting, copied, onCopy, onApprove, onReject }) {
  const { t } = useLang();
  const style = TYPE_STYLE[p.type] || TYPE_STYLE.LISTING;
  const store = p.user?.store;
  const canAct = p.status === 'VERIFYING';

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded"
            style={{ background: style.bg, color: style.fg }}
          >
            {t(style.labelKey)}
          </span>

          <span className="text-lg font-black" style={{ color: 'var(--accent)' }}>
            PKR {Number(p.amount || 0).toLocaleString('en-US')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill status={p.status} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {new Date(p.updatedAt).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 grid md:grid-cols-2 gap-5">

        {/* ── Kis ne ki ── */}
        <div className="space-y-2.5 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {t('admin.sentBy')}
          </p>

          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {personName(p.user?.name) || '—'}
          </p>

          {store?.name && (
            <p className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              <Store size={13} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
              {store.name}
              {store.isVerified && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(5,150,105,0.12)', color: '#059669' }}
                >
                  {t('common.verified')}
                </span>
              )}
            </p>
          )}

          {p.user?.email && !p.user.email.endsWith('@phone.pakautozone.local') && (
            <p className="flex items-center gap-2 text-[13px] break-all" style={{ color: 'var(--text-secondary)' }}>
              <Mail size={13} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
              {p.user.email}
            </p>
          )}

          {/* ✅ Sab se ahem — jis number se paisay bheje.
              Admin isi se bank/JazzCash statement mein match karta hai. */}
          <div
            className="rounded-lg px-3 py-2.5 mt-1"
            style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              {t('admin.senderNumber')}
            </p>
            <p className="flex items-center gap-2 font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              <Phone size={13} style={{ color: 'var(--accent)' }} />
              {p.senderPhone || p.user?.phone || '— nahi diya —'}
            </p>
          </div>

          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {t('payment.method')}: <strong style={{ color: 'var(--text-primary)' }}>{p.method}</strong>
          </p>
        </div>

        {/* ── TID + car ── */}
        <div className="space-y-3 min-w-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('payment.transactionId')}</p>
            <div className="flex items-center gap-2">
              <span
                className="flex-1 min-w-0 font-mono font-bold text-sm break-all rounded-lg px-3 py-2"
                style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                {p.transactionId || '—'}
              </span>
              {p.transactionId && (
                <button
                  onClick={onCopy}
                  aria-label={t('common.copy')}
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    border: '1px solid var(--border-color)',
                    color: copied ? '#059669' : 'var(--text-secondary)',
                    background: copied ? 'rgba(5,150,105,0.10)' : 'transparent',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Boost / listing ho to car ki tafseel */}
          {p.car && (
            <div
              className="flex items-center gap-3 rounded-lg p-2.5"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
            >
              <span
                className="w-14 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'var(--card-bg)' }}
              >
                {p.car.carImages?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.car.carImages[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <CarIcon size={16} strokeWidth={1.3} style={{ color: 'var(--text-muted)' }} />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {toTitleCase(p.car.title) || `${toTitleCase(p.car.brand)} ${toTitleCase(p.car.model)}`}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {p.car.year} · {formatPrice(p.car.price)} · {p.car.status}
                  {p.car.isFeatured ? ' · Featured' : ''}
                </p>
              </div>

              <Link
                href={`/cars/${p.car.id}`}
                target="_blank"
                className="shrink-0 text-[11px] font-bold"
                style={{ color: 'var(--accent)' }}
              >{t('common.view')}</Link>
            </div>
          )}

          {/* Actions */}
          {canAct && (
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={onApprove}
                disabled={acting}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 transition-transform active:scale-[0.98]"
                style={{ background: '#059669', color: '#fff' }}
              >
                {acting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {t('admin.approve')}
              </button>
              <button
                onClick={onReject}
                disabled={acting}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 transition-transform active:scale-[0.98]"
                style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.30)', color: '#dc2626' }}
              >
                <X size={15} />{t('admin.reject')}</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  const { t } = useLang();
  const map = {
    VERIFYING: { bg: 'rgba(232,184,75,0.16)', fg: '#a17c33', labelKey: 'admin.reviewing' },
    COMPLETED: { bg: 'rgba(5,150,105,0.12)', fg: '#059669', labelKey: 'admin.approvedStatus' },
    REJECTED: { bg: 'rgba(220,38,38,0.10)', fg: '#dc2626', labelKey: 'admin.rejectedStatus' },
    PENDING: { bg: 'var(--bg-surface-alt)', fg: 'var(--text-muted)', labelKey: 'admin.tidPending' },
  };
  const s = map[status] || map.PENDING;

  return (
    <span
      className="text-[10px] font-bold px-2 py-1 rounded"
      style={{ background: s.bg, color: s.fg }}
    >
      {t(s.labelKey)}
    </span>
  );
}