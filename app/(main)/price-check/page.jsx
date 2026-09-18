'use client';
import { useState } from 'react';
import { TrendingUp, Search } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

export default function PriceCheckPage() {
  const { t } = useLang();
  const [form, setForm] = useState({ brand: '', model: '', variant: '', year: '', mileage: '', condition: 'USED', fuelType: 'PETROL', transmission: 'MANUAL', city: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API}/ai/price-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      // Log status so we can see it in DevTools Network/Console tab
      console.log('price-estimate status:', res.status);

      if (!res.ok) {
        // Try to read backend's actual error message instead of hiding it
        let backendMsg = t('common.serverError');
        try {
          const errData = await res.json();
          backendMsg = errData.message || errData.error || backendMsg;
        } catch {
          // response wasn't JSON (likely an HTML error page / server crash)
        }
        throw new Error(backendMsg);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Price check failed:', err);
      setErrorMsg(err.message || t('priceCheck.serviceUnavailable'));
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <input type={type} placeholder={placeholder} value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full mt-1 border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-orange-50/40 dark:bg-black py-6 px-4 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex-shrink-0">
            <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('priceCheck.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('priceCheck.subtitle')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/60 rounded-2xl p-4 sm:p-6 border border-orange-100 dark:border-orange-500/20 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field(t('car.brand'), 'brand', 'text', 'Toyota')}
            {field(t('car.model'), 'model', 'text', 'Corolla')}
            {field(t('priceCheck.variant'), 'variant', 'text', t('priceCheck.optional'))}
            {field(t('car.year'), 'year', 'number', '2020')}
            {field(t('car.mileageKm'), 'mileage', 'number', '50000')}
            {field(t('car.city'), 'city', 'text', 'Lahore')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[            [t('car.condition'), 'condition', ['USED', 'NEW', 'CERTIFIED_PREOWNED']],
            [t('car.fuelType'), 'fuelType', ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'CNG']],
            [t('car.transmission'), 'transmission', ['MANUAL', 'AUTOMATIC', 'CVT']]
            ].map(([label, key, opts]) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
                <select value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  {opts.map(o => <option key={o} value={o} className="dark:bg-gray-900">{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button onClick={handleCheck} disabled={loading || !form.brand || !form.model || !form.year}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 disabled:opacity-50 disabled:shadow-none transition-all">
            <Search size={16} /> {loading ? t('priceCheck.calculating') : t('priceCheck.check')}
          </button>

          {errorMsg && (
            <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-6 bg-white dark:bg-gray-900/60 rounded-2xl p-4 sm:p-6 border border-orange-100 dark:border-orange-500/20 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('priceCheck.estimated')}</p>
            <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              PKR {Number(result.estimatedPrice).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.min')}: <strong className="text-gray-900 dark:text-white">PKR {Number(result.priceRange?.min).toLocaleString()}</strong></span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.max')}: <strong className="text-gray-900 dark:text-white">PKR {Number(result.priceRange?.max).toLocaleString()}</strong></span>
            </div>
            {result.marketInsight && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 bg-orange-50 dark:bg-orange-500/10 p-3 rounded-lg">{result.marketInsight}</p>
            )}
            {result.factors?.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 mb-2">{t('priceCheck.factors')}:</p>
                <ul className="space-y-1">
                  {result.factors.map((f, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {f}</li>)}
                </ul>
              </div>
            )}
            {result.negotiationTips?.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-sm text-green-700 dark:text-green-400 mb-2">💡 {t('priceCheck.tips')}:</p>
                <ul className="space-y-1">
                  {result.negotiationTips.map((tip, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {tip}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}