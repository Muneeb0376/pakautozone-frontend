'use client';
import { useLang } from '@/lib/i18nContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { CreditCard, AlertTriangle, ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const LISTING_FEE = 100;
const METHODS = [
  { value: 'JazzCash', label: 'JazzCash' },
  { value: 'Easypaisa', label: 'Easypaisa' },
  { value: 'BankTransfer', label: 'Bank Transfer' },
];

export default function ListingPaymentPage() {
  const { t } = useLang();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-10 w-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentFormContent />
    </Suspense>
  );
}

function PaymentFormContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const carId = searchParams.get('carId');
  const isBoost = searchParams.get('boost') === 'true';
  const [method, setMethod] = useState('JazzCash');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !carId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'LISTING',
          carId,
          amount: LISTING_FEE,
          method,
          phone,
          reason: isBoost ? 'Car Boost Activation' : 'Car Listing Activation'
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Payment initiate nahi ho saka.');
      }
      router.push(`/payment/${result.data.id}/confirm`);
    } catch (err) {
      setError(err.message || 'Network error.');
      setLoading(false);
    }
  };

  if (!carId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-sm text-center">
          <AlertTriangle className="text-rose-400 mx-auto mb-4" size={32} />
          <h3 className="text-white font-extrabold text-lg mb-2">Car ID Nahi Mila</h3>
          <p className="text-slate-400 text-xs mb-6">Dashboard se dobara Pay Now click karein.</p>
          <Link href="/dashboard/seller"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold py-3 px-6 rounded-xl">
            <ArrowLeft size={14} />{t('nav.goToDashboard')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="text-blue-400" size={18} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Listing Payment</h2>
              <p className="text-slate-400 text-[10px] font-mono">{carId.substring(0, 14)}...</p>
            </div>
          </div>
          <Link href="/dashboard/seller" className="text-slate-400 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
        </div>

        <div className="p-6 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
          <p className="text-white font-bold text-sm">
            {isBoost ? '⚡ Premium Boost' : 'Standard Listing'}
          </p>
          <span className="text-cyan-400 font-black text-lg">PKR {LISTING_FEE}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                  className={`py-3 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
                    method === m.value
                      ? 'border-cyan-400/50 bg-blue-500/20 text-white'
                      : 'border-white/10 text-slate-400'
                  }`}>
                  <Smartphone size={16} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {method} Number
            </label>
            <input type="tel" required value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('payment.phonePlaceholder')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] pt-1">
            <ShieldCheck size={12} /> {t('payment.sendAndEnter')}.
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold py-3 rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-1.5">
            {loading
              ? <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('common.processing')}</>
              : `${t('common.continue')} — PKR ${LISTING_FEE}`
            }
          </button>
        </form>
      </div>
    </div>
  );
}