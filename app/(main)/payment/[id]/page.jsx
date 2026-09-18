'use client';
import { useLang } from '@/lib/i18nContext';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentConfirmPage() {
  const { t } = useLang();
  const { id } = useParams();
  const router = useRouter();

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [done, setDone] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // ✅ localStorage sirf client side pe access karo
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const API = process.env.NEXT_PUBLIC_API_URL || '/api';
    fetch(`${API}/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.message || 'Payment details load nahi hue');
        }
        return r.json();
      })
      .then((data) => {
        // ✅ Backend response structure handle karo
        setPaymentDetails(data.data || data);
        setFetching(false);
      })
      .catch((err) => {
        setFetchError(err.message || 'Network error');
        setFetching(false);
      });
  }, [id, router]);

  const handleConfirm = async () => {
    if (!txId.trim()) {
      setSubmitError('Transaction ID required hai');
      return;
    }
    setSubmitError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API}/payments/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId: txId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Confirm karne mein error aya');
      }

      setDone(true);
    } catch (err) {
      setSubmitError(err.message || 'Network error — dobara try karein');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading State
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Payment details load ho rahi hain...</p>
        </div>
      </div>
    );
  }

  // ✅ Fetch Error State
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm border border-red-100 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Load Nahi Hua</h2>
          <p className="text-sm text-gray-500 mb-5">{fetchError}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >{t('nav.goToDashboard')}</button>
        </div>
      </div>
    );
  }

  // ✅ Success State
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm border border-gray-100 shadow-sm">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Payment Submit Ho Gaya!</h2>
          <p className="text-gray-500 text-sm mt-2">
            24 hours mein verify hoga aur premium features activate ho jayenge.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-5 w-full bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >{t('nav.goToDashboard')}</button>
        </div>
      </div>
    );
  }

  // ✅ Main Confirm Form
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Confirm Karo</h2>
        <p className="text-sm text-gray-500 mb-5">
          Niche di gayi details par payment kar ke TRX ID enter karein
        </p>

        {/* Payment Details Card */}
        {paymentDetails && (
          <div className="bg-blue-50 rounded-xl p-4 mb-5 border border-blue-100">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">
              Total Payable Amount
            </p>
            <p className="text-2xl font-black text-blue-800">
              PKR {Number(paymentDetails.amount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-2 font-medium">
              Method:{' '}
              <span className="uppercase font-bold text-gray-800">
                {paymentDetails.method}
              </span>
            </p>
            {paymentDetails.phone && (
              <p className="text-xs text-gray-500 mt-1">
                Phone: <span className="font-mono">{paymentDetails.phone}</span>
              </p>
            )}
            {paymentDetails.instructions && (
              <p className="text-xs text-gray-500 mt-1 italic">
                {paymentDetails.instructions}
              </p>
            )}
          </div>
        )}

        {/* Transaction ID Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Transaction ID / Reference Number
          </label>
          <input
            type="text"
            value={txId}
            onChange={(e) => {
              setTxId(e.target.value);
              setSubmitError('');
            }}
            placeholder="e.g. 12345678901"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Helper Text */}
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
          JazzCash/Easypaisa transaction ID woh unique number hota hai jo payment
          confirmation SMS ya App receipt par likha hota hai (TID).
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full mt-5 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Karo'
          )}
        </button>
      </div>
    </div>
  );
}