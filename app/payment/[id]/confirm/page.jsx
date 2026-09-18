'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/payment/[id]/confirm/page.jsx
//
// ✅ POORI FILE REPLACE — Issue 3 ka asal masla
//
// ══ AAP NE JO KAHA ══
// "Is ki payment form mein mujhe ek ghalti nazar aayi — ye theek se
//  nahi chal raha, ye number nahi maangta ya to ID nahi maangta number
//  ke baad."
//
// ══ ASAL WAJAH ══
// Ye safha kabhi backend se payment ki tafseel laata hi nahi tha. Sirf
// URL se ID uthata tha aur seedha TID ka box dikha deta tha. Backend
// mein `receivingNumber` mojood tha (payment.controller.js ka
// getPaymentById usay bhejta tha) lekin koi usay maangta hi nahi tha.
//
// Natija: user ke samne "Transaction ID daalein" likha aata tha, lekin
// wo TID aati kahan se? Paisay kis number par bhejne hain? Kuch nahi
// bataya jata tha. Isi liye flow adhoora lagta tha.
//
// ══ AB ══
// Safha khulte hi GET /api/payments/:id chalti hai aur user ko ye sab
// milta hai:
//     • kaunsi cheez ki payment hai (showroom / boost / listing)
//     • kitne paisay
//     • KIS NUMBER PAR bhejne hain + account ka naam
//     • copy button (number ya account number copy karne ke liye)
//     • phir TID ka box
//
// Aur poora safha ab theme tokens par hai — pehle bg-slate-950 par
// hardcoded tha.

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, ArrowLeft, ClipboardPaste, Copy, Check,
  Loader2, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const AFTER_LINK = {
  SUBSCRIPTION: '/dashboard/showroom',
  BOOST: '/dashboard/seller',
  LISTING: '/dashboard/seller',
};

export default function PaymentConfirmPage() {
  const { t } = useLang();
  const { id } = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [payment, setPayment] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [txId, setTxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Payment ki tafseel — YEHI wo call thi jo pehle hoti hi nahi thi ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) { router.replace('/login'); return; }
    if (!id) return;

    setFetching(true);
    fetch(`${API}/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || !json.success) throw new Error(json.message || 'Payment nahi mila.');
        return json.data;
      })
      .then(setPayment)
      .catch((e) => setFetchError(e.message))
      .finally(() => setFetching(false));
  }, [_hasHydrated, token, id, router]);

  const copyNumber = useCallback(async () => {
    if (!payment?.receivingNumber) return;
    try {
      await navigator.clipboard.writeText(payment.receivingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard block ho to khamoshi se chhor do — number screen par hai hi */
    }
  }, [payment]);

  const handleConfirm = async () => {
    if (!txId.trim()) {
      setError(t('payment.transactionRequired'));
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API}/payments/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId: txId.trim() }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || t('payment.confirmFailed'));
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Network error. Dobara koshish karein.');
      setSubmitting(false);
    }
  };

  const type = payment?.type || 'SUBSCRIPTION';
  const backHref = AFTER_LINK[type] || '/dashboard';

  /* ══ Loading ══ */
  if (fetching) {
    return (
      <Shell>
        <div className="py-20 flex justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      </Shell>
    );
  }

  /* ══ Fetch fail ══ */
  if (fetchError) {
    return (
      <Shell>
        <div className="p-8 text-center">
          <span
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(220,38,38,0.10)' }}
          >
            <AlertTriangle size={26} style={{ color: '#dc2626' }} />
          </span>
          <h2 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('payment.notFound')}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{fetchError}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <ArrowLeft size={15} />{t('nav.dashboard')}</Link>
        </div>
      </Shell>
    );
  }

  /* ══ Success ══ */
  if (success) {
    return (
      <Shell>
        <div className="p-8 text-center">
          <span
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(5,150,105,0.10)' }}
          >
            <CheckCircle2 size={30} style={{ color: '#059669' }} />
          </span>
          <h2 className="font-black text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('payment.submitted')}
          </h2>
          <p className="text-sm mb-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {type === 'BOOST'
              ? t('payment.successBoost')
              : type === 'LISTING'
              ? t('payment.successListing')
              : t('payment.successSubscription')}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            {t('payment.verificationTime')}
          </p>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {t('payment.dashboard')}
          </Link>
        </div>
      </Shell>
    );
  }

  /* ══ Main ══ */
  return (
    <Shell>
      {/* ── Header ── */}
      <div
        className="p-5 flex items-start justify-between gap-3"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="min-w-0">
          <h1 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
            {t('payment.confirm')}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {type === 'SUBSCRIPTION'
              ? t('payment.showroomSubscription')
              : type === 'BOOST'
              ? t('payment.listingBoost')
              : type === 'LISTING'
              ? t('payment.extraListingFee')
              : t('payment.title')}
          </p>
        </div>
        <Link href={backHref} aria-label={t('common.back')} style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* ══ STEP 3 — YAHAN NUMBER MILTA HAI (pehle ye poora block gayab tha) ══ */}
      <div className="p-5" style={{ background: 'var(--bg-dash-cta)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            3
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('payment.inDetailsPay')}
          </span>
        </div>

        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <Row label={t('payment.method')} value={payment?.methodLabel || payment?.method} />

          {payment?.receivingNumber && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {payment.method === 'BankTransfer' ? t('payment.accountNumber') : t('payment.number')}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono font-black text-lg tracking-wide flex-1 min-w-0 break-all"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {payment.receivingNumber}
                </span>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                  style={{
                    background: copied ? 'rgba(5,150,105,0.12)' : 'var(--bg-surface-alt)',
                    border: '1px solid var(--border-color)',
                    color: copied ? '#059669' : 'var(--text-secondary)',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? t('payment.copied') : t('payment.copy')}
                </button>
              </div>
            </div>
          )}

          {payment?.accountName && <Row label={t('payment.accountName')} value={payment.accountName} />}

          <div className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t('payment.amountToSend')}
              </span>
              <span className="font-black text-lg" style={{ color: 'var(--accent)' }}>
                PKR {Number(payment?.amount || 0).toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {t('payment.exactAmountHint')}
        </p>
      </div>

      {/* ══ STEP 4 — TID ══ */}
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            4
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('payment.transactionStep')}
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={txId}
            onChange={(e) => { setTxId(e.target.value); if (error) setError(''); }}
            placeholder={t('payment.transactionPlaceholder')}
            className="w-full rounded-xl px-4 py-3 pr-11 text-sm font-mono outline-none"
            style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                setTxId(text.trim());
              } catch { /* clipboard permission na ho to kuch na karo */ }
            }}
            title="Paste"
            aria-label="Paste"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          >
            <ClipboardPaste size={16} />
          </button>
        </div>

        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {t('payment.tidHint')} JazzCash/Easypaisa: TID / Transaction ID; Bank Transfer: Reference No.
        </p>

        {error && (
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)' }}
          >
            <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck size={12} style={{ color: 'var(--accent)' }} />
          {t('payment.verifyHint')}
        </div>

        <button
          onClick={handleConfirm}
          disabled={submitting || !txId.trim()}
          className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[0.99]"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
          }}
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? t('payment.submittingTid') : t('payment.submitTid')}
        </button>
      </div>
    </Shell>
  );
}

/* ── Shell ── */
function Shell({ children }) {
  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--bg-page)' }}>
      <div
        className="max-w-md mx-auto rounded-2xl overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-sm font-bold text-right" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}