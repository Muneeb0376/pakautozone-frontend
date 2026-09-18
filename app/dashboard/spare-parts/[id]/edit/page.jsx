// frontend/app/dashboard/spare-parts/[id]/edit/page.jsx
'use client';
import { useLang } from '@/lib/i18nContext';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, X, UploadCloud, Save } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const CATEGORIES = ['engine', 'body', 'electrical', 'suspension', 'brakes', 'interior', 'tyres', 'other'];
const CONDITIONS = ['New', 'Used', 'Refurbished'];

export default function EditSparePartPage() {
  const { t } = useLang();
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    condition: 'Used',
    brand: '',
    description: '',
    city: '',
  });

  // existing images coming from server: [{ id, url }]
  const [existingImages, setExistingImages] = useState([]);
  // ids of existing images the user removed
  const [removedImageIds, setRemovedImageIds] = useState([]);
  // brand new files picked in this session
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetchPart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('auth-storage');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || null;
    } catch {
      return null;
    }
  };

  const fetchPart = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`${API}/parts/${id}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();

      if (!res.ok || (json.success === false)) {
        setError(json.message || 'Part nahi mila.');
        return;
      }

      const part = json.data || json;

      setForm({
        name: part.name || '',
        price: part.price ?? '',
        category: part.category || '',
        condition: part.condition || 'Used',
        brand: part.brand || '',
        description: part.description || '',
        city: part.city || part.store?.city || '',
      });

      setExistingImages(Array.isArray(part.images) ? part.images : []);
    } catch (err) {
      console.error('❌ Error fetching part:', err);
      setError(t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveExistingImage = (imgId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
    setRemovedImageIds((prev) => [...prev, imgId]);
  };

  const handleNewFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemoveNewFile = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = getToken();

      // agar nayi images add ki gayi hain to FormData bhejo (multipart),
      // warna simple JSON PUT kaafi hai
      let res;
      if (newFiles.length > 0 || removedImageIds.length > 0) {
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => fd.append(key, value));
        removedImageIds.forEach((rid) => fd.append('removedImageIds[]', rid));
        newFiles.forEach((file) => fd.append('images', file));

        res = await fetch(`${API}/parts/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
      } else {
        res = await fetch(`${API}/parts/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(form),
        });
      }

      const json = await res.json().catch(() => ({}));

      // ✅ FIX: token expired/invalid ho to seedha login page pe bhej do,
      // taake user ko pata chale session khatam ho gaya hai — silent fail nahi hoga
      if (res.status === 401) {
        sessionStorage.removeItem('auth-storage');
        router.push('/login?expired=1');
        return;
      }

      if (!res.ok || json.success === false) {
        throw new Error(json.message || t('common.saveFailed'));
      }

      router.push('/dashboard/spare-parts');
    } catch (err) {
      console.error('❌ Error updating part:', err);
      setError(err.message || t('common.somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} />{t('common.back')}</button>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package size={22} className="text-cyan-400" /> {t('dashboard.ui.editPart')}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">{t('listing.images')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {newPreviews.map((src, idx) => (
                <div key={src} className="relative aspect-square rounded-xl overflow-hidden border border-cyan-400/40">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(idx)}
                    className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-500 rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-cyan-400 transition-colors">
                <UploadCloud size={22} />
                <span className="text-[10px] mt-1">{t('common.add')}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewFiles} />
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">{t('parts.partName')}</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          {/* Price + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">{t('common.price')} (PKR)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">{t('car.brand')}</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">{t('parts.category')}</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
              >
                <option value="">{t('common.selectOption')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">{t('car.condition')}</label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">{t('common.city')}</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">{t('common.description')}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              <Save size={16} /> {saving ? t('common.saving') : t('dashboard.ui.saveChanges')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-white/10 hover:bg-white/5 transition-all"
            >{t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}