//ye payment/page.jsx ki file ha //
'use client';
import { useLang } from '@/lib/i18nContext';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';

const METHODS = [
  { id: 'JazzCash', label: 'JazzCash' },
  { id: 'Easypaisa', label: 'Easypaisa' },
  { id: 'BankTransfer', label: 'Bank Transfer' },
];

function PaymentListingInner() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const carId = searchParams.get('carId');

  const [method, setMethod] = useState('JazzCash');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!carId) {
      setError('Car ID missing hai — dashboard se dobara try karein.');
    }
  }, [carId, router]);

  const handlePay = async () => {
    if (!carId) {
      setError('Car ID missing hai.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // ✅ type: 'LISTING' zaroor bhejo — is ke bina backend default
        // 'SUBSCRIPTION' (showroom price) samajh leta hai.
        body: JSON.stringify({ carId, method, phone, type: 'LISTING' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment initiate nahi ho saki');
      }

      // ✅ Payment record ban gaya — ab common confirm page par bhejo
      // jahan user TID submit karega.
      router.push(`/payment/${data.data.id}/confirm`);
    } catch (err) {
      setError(err.message || 'Network error — dobara try karein');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 transition-colors">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {t('payment.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t('payment.listingDescription')}
        </p>

        <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-4 mb-5 border border-blue-100 dark:border-blue-900">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">
            {t('payment.totalPayable')}
          </p>
          <p className="text-2xl font-black text-blue-800 dark:text-blue-300">PKR 30</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {t('payment.oneTimeListing')}
          </p>
        </div>

        <div className="space-y-1 mb-4">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('payment.chooseMethod')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`text-xs font-bold py-2.5 rounded-xl border transition-colors ${
                  method === m.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('payment.yourNumberOptional', { method })}
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('payment.phonePlaceholder')}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {error && (
          <div className="mt-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl p-3 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading || !carId}
          className="w-full mt-5 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />{t('common.processing')}</>
          ) : (
            <>
              <CreditCard size={16} />
              {t('common.continue')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PaymentListingPage() {
  return (
    <Suspense fallback={null}>
      <PaymentListingInner />
    </Suspense>
  );
}