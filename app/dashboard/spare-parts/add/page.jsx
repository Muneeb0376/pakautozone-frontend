'use client';
import { useLang } from '@/lib/i18nContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/lib/themeContext';
import { Wrench, Camera, X, CheckCircle2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

// ✅ Ye 'id' values EXACTLY public /spare-parts page ke CATEGORY_META
// 'value' strings se match karti hain (spare-parts/page.jsx). Inhein
// tabdeel na karein, warna filter tab pe part show nahi hoga.
const CATEGORIES = [
  ...['engine','brakes','suspension','electrical','battery','body','bumpers','lights','interior','ac','radiator','exhaust','clutch','fuel','filters','tyres','mirrors','glass','audio','dashboard','doors','tools','sensors','paint','locks','other']
    .map((id) => ({ id, labelKey: `parts.category.${id}` })),
];

// ✅ Theme-aware helper classes — dark ho ya light, sab jagah se
// consistent, spare-parts public page wale dark/light pattern ki tarah
const FieldLabel = ({ dark, children }) => (
  <label className={`block text-xs font-semibold mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
    {children}
  </label>
);

const inputClass = (dark) =>
  `w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm transition-colors ${
    dark
      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:bg-white/[0.07]'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400'
  }`;

export default function AddPartPage() {
  const { t } = useLang();
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ✅ Ab sirf 2 steps — 'form' aur 'success'. Purana fake 'payment' step
  // hata diya gaya hai: wo backend ko call hi nahi karta tha, sirf 1.5
  // second wait karke "success" dikha deta tha, jabke part us se pehle
  // hi (form submit pe) DB mein save/public ho chuka hota tha. Showroom
  // ki policy ke mutabiq parts pe koi alag payment nahi honi — sirf
  // showroom subscription (dashboard banner se) ek dafa.
  const [step, setStep] = useState('form');

  const [form, setForm] = useState({
    name:        '',
    price:       '',
    category:    'engine',
    brand:       '',
    condition:   'Used',
    city:        'Lahore',
    description: '',
  });
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('name',        form.name.trim());
      data.append('price',       form.price);
      data.append('category',    form.category);
      data.append('brand',       form.brand);
      data.append('condition',   form.condition);
      data.append('city',        form.city);
      data.append('description', form.description);
      images.forEach((img) => data.append('images', img));

      const res = await fetch(`${API}/parts`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    data,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error occurred');

      // ✅ Part already publicly live hai is response ke baad — koi payment
      // step nahi, seedha success dikhao.
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-950' : 'bg-[#f5f6f8]'}`}>
      <div className={`rounded-2xl p-10 text-center max-w-md w-full border ${
        dark ? 'bg-white/5 border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]' : 'bg-white border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
      }`}>
        <CheckCircle2 className={`mx-auto mb-4 ${dark ? 'text-emerald-400' : 'text-emerald-500'}`} size={52} />
        <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-[#0a1628]'}`}>{t('parts.listed')}</h2>
        <p className={`text-sm mb-6 ${dark ? 'text-slate-400' : 'text-gray-400'}`}>{t('parts.listedBody')}</p>
        <button
          onClick={() => router.push('/dashboard/spare-parts')}
          className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
            dark ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950' : 'bg-[#0a1628] hover:bg-[#132039] text-white'
          }`}
        >
          {t('dashboard.ui.mySpareParts')}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen px-4 py-8 ${dark ? 'bg-slate-950' : 'bg-[#f5f6f8]'}`}>
      <div className={`max-w-2xl mx-auto rounded-2xl overflow-hidden border ${
        dark ? 'bg-white/[0.03] border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]' : 'bg-white border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.07)]'
      }`}>
        <div className="px-6 sm:px-8 py-6 flex items-center gap-3 bg-gradient-to-br from-[#0a1628] to-[#1a2d52]">
          <Wrench className="text-white/90" size={26} />
          <div>
            <h2 className="text-white text-lg font-bold">{t('parts.addTitle')}</h2>
            <p className="text-white/60 text-xs mt-0.5">{t('parts.detailsHint')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6">
          {error && (
            <div className={`rounded-lg px-3.5 py-2.5 text-sm mb-4 border ${
              dark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {error}
            </div>
          )}

          {[
            { name: 'name',  label: `${t('parts.partName')} *`, placeholder: t('dashboard.ui.partNameExample'), type: 'text', required: true },
            { name: 'price', label: `${t('common.price')} (PKR) *`, placeholder: t('dashboard.ui.partPriceExample'), type: 'number', required: true },
            { name: 'brand', label: t('car.brand'), placeholder: t('dashboard.ui.partBrandExample'), type: 'text', required: false },
            { name: 'city',  label: `${t('common.city')} *`, placeholder: t('dashboard.ui.partCityExample'), type: 'text', required: true },
          ].map(({ name, label, placeholder, type, required }) => (
            <div key={name} className="mb-3.5">
              <FieldLabel dark={dark}>{label}</FieldLabel>
              <input
                type={type}
                name={name}
                required={required}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={inputClass(dark)}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <FieldLabel dark={dark}>{t('parts.category')} *</FieldLabel>
              <select name="category" value={form.category} onChange={handleChange} className={inputClass(dark)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className={dark ? 'bg-slate-900 text-white' : ''}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel dark={dark}>{t('parts.condition')} *</FieldLabel>
              <select name="condition" value={form.condition} onChange={handleChange} className={inputClass(dark)}>
                <option className={dark ? 'bg-slate-900 text-white' : ''}>{t('common.new')}</option>
                <option className={dark ? 'bg-slate-900 text-white' : ''}>{t('common.used')}</option>
              </select>
            </div>
          </div>

          <div className="mb-3.5">
            <FieldLabel dark={dark}>{t('common.description')}</FieldLabel>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder={t('common.writeHere')}
              className={`${inputClass(dark)} resize-y`}
            />
          </div>

          <div className="mb-5">
            <FieldLabel dark={dark}>{t('listing.images')} ({images.length}/5)</FieldLabel>
            <label className={`rounded-xl p-6 flex flex-col items-center cursor-pointer border-2 border-dashed transition-colors ${
              dark ? 'border-white/10 bg-white/[0.02] hover:border-cyan-400/30' : 'border-gray-200 bg-gray-50 hover:border-blue-300'
            }`}>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => setImages((prev) => [...prev, ...Array.from(e.target.files)].slice(0, 5))}
              />
              <Camera className={`mb-2 ${dark ? 'text-slate-500' : 'text-gray-400'}`} size={26} />
              <span className={`text-sm ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{t('parts.uploadImages')}</span>
            </label>

            {images.length > 0 && (
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-[60px] h-[60px]">
                    <img src={URL.createObjectURL(img)} alt="" className="w-[60px] h-[60px] object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-[18px] h-[18px] flex items-center justify-center hover:bg-red-600"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-3 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              dark ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950' : 'bg-[#0a1628] hover:bg-[#132039] text-white'
            }`}
          >
            {loading ? t('common.processing') : `✓ ${t('common.submit')}`}
          </button>
        </form>
      </div>
    </div>
  );
}