'use client';
// frontend/components/payment/PaymentStartForm.jsx
//
// ✅ NAYI FILE — Issue 3 (payment form ka flow)
//
// ══ MASLA ══
// Aap ne kaha: "payment form theek se nahi chal raha — ye number nahi
// maangta, ya ID nahi maangta number ke baad."
//
// Do alag payment pages (showroom aur listing) ne apna apna form likha
// hua tha, dono thore alag thay, aur dono mein:
//   • qeemat HARDCODED thi (showroom page Rs 1000 dikhata tha jabke
//     backend Rs 100 charge karta tha)
//   • agla safha (confirm) kabhi receiving number dikhata hi nahi tha,
//     is liye user ko kabhi pata nahi chalta tha ke paisay kahan bhejne
//     hain
//   • wapis ka link /dashboard/my-showroom tha jo route hi nahi hai
//
// ══ HAL ══
// Ab dono pages yehi ek component use karte hain. Qeemat aur methods
// server se aate hain (GET /api/payments/pricing), aur payment shuru
// hote hi backend receiving number wapis bhej deta hai jo agle safhe
// par dikhta hai.
//
// FLOW ab ye hai:
//     [1] Method chunein  →  [2] Apna number daalein  →  Continue
//                                    ↓
//     [3] Receiving number + amount dikhta hai  →  [4] TID daalein  →  Done

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Smartphone, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/lib/i18nContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const METHOD_ICON = {
  JazzCash: Smartphone,
  Easypaisa: Smartphone,
  BankTransfer: Building2,
};

export default function PaymentStartForm({
  type,            // 'SUBSCRIPTION' | 'BOOST' | 'LISTING'
  carId = null,
  heading,
  subheading,
  itemName,
  itemNote,
  amount,          // server se aata hai; null ho to "…" dikhta hai
  backHref = '/dashboard',
  loadingPrice = false,
}) {
  const router = useRouter();
  const { t } = useLang();
  const token = useAuthStore((s) => s.token);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [methods, setMethods] = useState([
    { value: 'JazzCash', label: 'JazzCash', disabled: true },
    { value: 'Easypaisa', label: 'Easypaisa' },
    { value: 'BankTransfer', label: 'Bank Transfer' },
  ]);
  const [method, setMethod] = useState('Easypaisa');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.replace('/login');
  }, [_hasHydrated, token, router]);

  // Methods bhi server se — taake kal koi naya method add karein to
  // frontend badalne ki zarurat na pare.
  useEffect(() => {
    fetch(`${API}/payments/pricing`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success && Array.isArray(d.data.methods) && d.data.methods.length) {
          setMethods(d.data.methods);
          const current = d.data.methods.find((m) => m.value === method);
          if (!current || current.disabled) {
            const firstEnabled = d.data.methods.find((m) => !m.disabled);
            if (firstEnabled) setMethod(firstEnabled.value);
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Number ki halki si jaanch ──
     Sakht regex jaan boojh kar nahi lagaya — log 0300-1234567,
     03001234567 aur +923001234567 teenon tarah likhte hain, aur
     sakht validation ka natija sirf jhunjhlahat hoti hai. Bas itna
     dekh rahe hain ke 10 se zyada hindse maujood hon. */
  const digits = phone.replace(/\D/g, '');
  const phoneOk = digits.length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!phoneOk) {
      setError(t('payment.validPhone'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, carId, method, phone: phone.trim() }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || t('payment.startFailed'));
      }

      if (type === 'SUBSCRIPTION') {
        // ✅ Showroom — koi TID/receiving-number safha nahi. Number
        // confirm hote hi request seedha admin ke paas chali jati hai,
        // is liye yahan se seedha dashboard.
        router.push('/dashboard?showroomRequest=sent');
        return;
      }

      // ✅ Agle safhe par — wahan receiving number aur TID box dono hain
      router.push(`/payment/${result.data.id}/confirm`);
    } catch (err) {
      console.error('payment start error:', err);
      setError(err.message || t('common.serverError'));
      setLoading(false);
    }
  };

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
        {/* ── Header ── */}
        <div
          className="p-5 flex items-start justify-between gap-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="min-w-0">
            <h1 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
              {heading}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subheading}
            </p>
          </div>
          <Link href={backHref} aria-label={t('common.back')} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={18} />
          </Link>
        </div>

        {/* ── Kya kharid rahe hain ── */}
        <div className="p-5" style={{ background: 'var(--bg-surface-alt)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{itemName}</p>
              {itemNote && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {itemNote}
                </p>
              )}
            </div>
          </div>

          <div
            className="flex justify-between items-center pt-3"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {t('common.total')}
            </span>
            <span className="font-black text-lg" style={{ color: 'var(--accent)' }}>
              {loadingPrice || amount == null ? '…' : `PKR ${Number(amount).toLocaleString('en-US')}`}
            </span>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div
              className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)' }}
            >
              <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
              <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {/* Step 1 — method */}
          <div>
            <Step n={1} label={t('payment.chooseMethod')} />
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => {
                const Icon = METHOD_ICON[m.value] || Smartphone;
                const active = method === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      if (m.disabled) {
                        setError(m.disabledMessage || `${m.value} filhaal available nahi hai.`);
                        return;
                      }
                      if (error) setError('');
                      setMethod(m.value);
                    }}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-[11px] font-bold transition-colors"
                    style={{
                      background: active ? 'var(--bg-dash-cta)' : 'var(--bg-surface-alt)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
                      color: m.disabled ? 'var(--text-muted)' : (active ? 'var(--text-primary)' : 'var(--text-secondary)'),
                      opacity: m.disabled ? 0.55 : 1,
                      cursor: m.disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Icon size={16} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                    {m.value === 'JazzCash' ? 'JazzCash' : m.value === 'Easypaisa' ? 'Easypaisa' : t('payment.bankTransfer')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — apna number */}
          <div>
            <Step n={2} label={t('payment.yourNumber', {
              method: method === 'JazzCash' ? 'JazzCash' : method === 'Easypaisa' ? 'Easypaisa' : t('payment.bankTransfer'),
            })} />
            <input
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (error) setError(''); }}
              placeholder={t('payment.phonePlaceholder')}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors"
              style={{
                background: 'var(--bg-surface-alt)',
                border: `1px solid ${phone && !phoneOk ? 'rgba(220,38,38,0.45)' : 'var(--border-color)'}`,
                color: 'var(--text-primary)',
              }}
            />
            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('payment.phoneHint')}
            </p>
          </div>

          {/* Step 3 — preview */}
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
            style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
          >
            <ShieldCheck size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {type === 'SUBSCRIPTION'
                ? 'Once you continue, your showroom request will be sent directly to the admin for review — no transaction ID is required here.'
                : t('payment.nextStepHint')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !phoneOk}
            className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[0.99]"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
            }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? t('common.processing') : t('common.continue')}
          </button>
        </form>
      </div>
    </div>
  );
}

function Step({ n, label }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
      >
        {n}
      </span>
      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{label}</span>
    </div>
  );
}