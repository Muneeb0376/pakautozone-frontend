'use client';
import { useLang } from '@/lib/i18nContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const CONDITIONS = ['NEW', 'USED', 'CERTIFIED_PREOWNED'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan'];

export default function TradeInPage() {
  const { t } = useLang();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);   // ✅ FIX: zustand store se token
  const [form, setForm] = useState({
    brand: '', model: '', year: '', mileage: '',
    condition: 'USED', description: '', askingPrice: '', city: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/trade-in', form);   // ✅ FIX: api helper use (auto token attach + correct baseURL)
      if (res.success) {
        setSuccess(true);
      } else {
        throw new Error(res.message || 'Submit failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-sm border border-gray-100">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submit Ho Gayi!</h2>
        <p className="text-gray-500 text-sm mb-6">Dealers aapko offer karenge jald hi.</p>
        <button onClick={() => router.push('/')} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm">
          Home par Jao
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Car Exchange / Trade-In</h1>
        <p className="text-gray-500 text-sm mb-6">Apni car ka details bharo — dealers offer karenge</p>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('car.brand')}</label>
              <input required value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder={t('brand.Toyota')} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('car.model')}</label>
              <input required value={form.model} onChange={e => setForm({...form, model: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Corolla" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('common.year')}</label>
              <input required type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="2020" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('car.mileageKm')}</label>
              <input required type="number" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="50000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('car.condition')}</label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('common.city')}</label>
              <select required value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Asking Price (PKR) — Optional</label>
            <input type="number" value={form.askingPrice} onChange={e => setForm({...form, askingPrice: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="1500000" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('common.description')}</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none"
              placeholder="Car ki condition ke baare mein batao..." />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Submit ho raha hai...' : 'Submit Trade-In Request'}
          </button>
        </form>
      </div>
    </div>
  );
}