'use client';
import { useLang } from '@/lib/i18nContext';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

const BRANDS       = ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'Nissan', 'Mitsubishi', 'Daihatsu', 'BMW', 'Mercedes', 'Audi', 'Other'];
const CITIES       = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad'];
const FUELS        = ['Petrol', 'Diesel', 'CNG', 'Hybrid', 'Electric'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT'];
const CONDITIONS   = ['New', 'Used', 'Certified Pre-Owned'];

const inputCls   = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border";
const inputStyle = { background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
const labelCls   = "text-sm font-semibold block mb-1.5";

const DB_TO_DISPLAY = {
  fuelType: {
    PETROL: 'Petrol', DIESEL: 'Diesel', CNG: 'CNG',
    HYBRID: 'Hybrid', ELECTRIC: 'Electric',
  },
  transmission: {
    MANUAL: 'Manual', AUTOMATIC: 'Automatic', CVT: 'CVT',
  },
  condition: {
    NEW: 'New', USED: 'Used', CERTIFIED_PREOWNED: 'Certified Pre-Owned',
  },
};

const DISPLAY_TO_DB = {
  fuelType: {
    Petrol: 'PETROL', Diesel: 'DIESEL', CNG: 'CNG',
    Hybrid: 'HYBRID', Electric: 'ELECTRIC',
  },
  transmission: {
    Manual: 'MANUAL', Automatic: 'AUTOMATIC', CVT: 'CVT',
  },
  condition: {
    New: 'NEW', Used: 'USED', 'Certified Pre-Owned': 'CERTIFIED_PREOWNED',
  },
};

const toDisplay = (field, dbValue) =>
  DB_TO_DISPLAY[field]?.[dbValue] ?? dbValue ?? '';

const toDBValue = (field, displayValue) =>
  DISPLAY_TO_DB[field]?.[displayValue] ?? displayValue?.toUpperCase() ?? '';

export default function EditListingPage() {
  const { t } = useLang();
  const params = useParams();
  const id     = params?.id;
  const router = useRouter();

  const [token,    setToken]   = useState(null);
  const [loading,  setLoading] = useState(false);
  const [fetching, setFetching]= useState(true);
  const [error,    setError]   = useState('');
  const [success,  setSuccess] = useState(false);
  const [form,     setForm]    = useState(null);

  // ── Image state ──────────────────────────────────────────────
  const [existingImages, setExistingImages] = useState([]); // URLs from DB
  const [newFiles,       setNewFiles]       = useState([]); // File objects
  const [newPreviews,    setNewPreviews]    = useState([]); // blob URLs
  const [removedUrls,    setRemovedUrls]    = useState([]); // existing URLs to delete
  const fileInputRef = useRef(null);

  useEffect(() => {
    const t = getToken();
    setToken(t);
  }, []);

  useEffect(() => {
    if (!id || !token) return;

    api.get(`/cars/${id}`, token)
      .then(data => {
        if (data) {
          setForm({
            brand:        data.brand       || 'Toyota',
            model:        data.model       || '',
            year:         data.year        || '',
            price:        data.price       || '',
            mileage:      data.mileage     || '',
            color:        data.color       || '',
            engineCC:     data.engineCC    || data.engineSize || '',
            description:  data.description || '',
            city:         data.city        || 'Karachi',
            fuelType:     toDisplay('fuelType',     data.fuelType)     || 'Petrol',
            transmission: toDisplay('transmission', data.transmission) || 'Manual',
            condition:    toDisplay('condition',    data.condition)    || 'Used',
          });
          // Load existing images (adjust field name if your API differs)
          setExistingImages(data.images || []);
        }
        setFetching(false);
      })
      .catch(err => {
        console.error('Fetch listing error:', err);
        setError(t('car.loadFailed'));
        setFetching(false);
      });
  }, [id, token]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Image handlers ────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const totalAfterAdd = (existingImages.length - removedUrls.length) + newFiles.length + files.length;
    if (totalAfterAdd > 10) {
      setError(t('listing.maxImages', { n: 10 }));
      return;
    }

    setNewFiles(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    // Reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  const removeExisting = (url) => {
    setRemovedUrls(prev => [...prev, url]);
  };

  const removeNew = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles(prev    => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!token) { setError(t('auth.sessionExpired')); return; }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Use FormData so images can be sent along with fields
      const formData = new FormData();

      formData.append('brand',        form.brand);
      formData.append('model',        form.model);
      formData.append('year',         Number(form.year));
      formData.append('price',        Number(form.price));
      formData.append('mileage',      Number(form.mileage)  || 0);
      formData.append('engineCC',     Number(form.engineCC) || 0);
      formData.append('color',        form.color);
      formData.append('description',  form.description);
      formData.append('city',         form.city);
      formData.append('fuelType',     toDBValue('fuelType',     form.fuelType));
      formData.append('transmission', toDBValue('transmission', form.transmission));
      formData.append('condition',    toDBValue('condition',    form.condition));

      // Tell backend which existing images to remove
      if (removedUrls.length) {
        formData.append('removeImages', JSON.stringify(removedUrls));
      }

      // Attach new image files
      newFiles.forEach(file => formData.append('images', file));

      // If your api helper doesn't support FormData PUT, call fetch directly:
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(t('common.saveFailed'));

      setSuccess(true);
      setTimeout(() => router.push('/dashboard/listings'), 1200);
    } catch (err) {
      console.error('Update error:', err);
      setError(t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
      />
    </div>
  );

  if (!form) return (
    <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
      {t('car.notFound')}
    </div>
  );

  const visibleExisting = existingImages.filter(url => !removedUrls.includes(url));
  const totalImages     = visibleExisting.length + newFiles.length;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12" style={{ background: 'var(--bg-page)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/listings"
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.editListing')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.updateListingDetails')}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 border border-red-100">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-5 border border-emerald-100 font-semibold">
          ✅ {t('common.saved')}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-6 space-y-5 shadow-sm"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}
      >
        {/* ── IMAGE UPLOAD SECTION ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--text-primary)' }}>
            {t('listing.images')}{' '}
            <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>
              ({totalImages}/10)
            </span>
          </label>

          {/* Grid: existing + new previews + upload button */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">

            {/* Existing images from DB */}
            {visibleExisting.map((url) => (
              <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                <img src={url} alt={t('car.genericName')} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExisting(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  ×
                </button>
              </div>
            ))}

            {/* New file previews */}
            {newPreviews.map((src, i) => (
              <div key={src} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-blue-400">
                <img src={src} alt="new" className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">{t('common.new')}</span>
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add more button */}
            {totalImages < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[11px] font-medium">{t('common.add')}</span>
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('listing.maxImages', { n: 10 })}
          </p>
        </div>

        {/* ── EXISTING FIELDS (unchanged) ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.brand')}</label>
            <select value={form.brand} onChange={e => setField('brand', e.target.value)} className={inputCls} style={inputStyle}>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.model')}</label>
            <input type="text" value={form.model} onChange={e => setField('model', e.target.value)} required className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('common.year')}</label>
            <input type="number" value={form.year} onChange={e => setField('year', e.target.value)} required className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.price')} (PKR)</label>
            <input type="number" value={form.price} onChange={e => setField('price', e.target.value)} required className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.mileageKm')}</label>
            <input type="number" value={form.mileage} onChange={e => setField('mileage', e.target.value)} required className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.engine')} (cc)</label>
            <input type="number" value={form.engineCC} onChange={e => setField('engineCC', e.target.value)} required className={inputCls} style={inputStyle} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.fuelType')}</label>
            <select value={form.fuelType} onChange={e => setField('fuelType', e.target.value)} className={inputCls} style={inputStyle}>
              {FUELS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.transmission')}</label>
            <select value={form.transmission} onChange={e => setField('transmission', e.target.value)} className={inputCls} style={inputStyle}>
              {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('common.city')}</label>
            <select value={form.city} onChange={e => setField('city', e.target.value)} className={inputCls} style={inputStyle}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.condition')}</label>
            <select value={form.condition} onChange={e => setField('condition', e.target.value)} className={inputCls} style={inputStyle}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('car.color')}</label>
          <input type="text" value={form.color} onChange={e => setField('color', e.target.value)} required className={inputCls} style={inputStyle} />
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{t('common.description')}</label>
          <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={4} className={`${inputCls} resize-none`} style={inputStyle} />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
        >
          {loading ? t('common.saving') : success ? `✅ ${t('common.saved')}` : t('dashboard.ui.saveChanges')}
        </button>
      </form>
    </div>
  );
}