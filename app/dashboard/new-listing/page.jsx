'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/dashboard/new-listing/page.jsx
//
// ✅ POORI FILE REPLACE — Issue 2 + Issue 5
//
// ══ KYA NAYA HAI ══
//
// 1. SAB OPTIONS ab browseData.js SE
//    Pehle is file mein apni alag BRANDS, CITIES, FEATURES_LIST,
//    CAR_COLORS parri hui thin. Natija: homepage par ek category dikhti
//    thi, form mein doosri — aur listing kabhi us category mein fit hi
//    nahi hoti thi. Ab dono ek hi file se aate hain, is liye jo bhi
//    aap browseData.js mein add karenge wo yahan khud aa jayega.
//
// 2. MODEL AB DROPDOWN HAI
//    Brand chunte hi us brand ke models ki fehrist aa jati hai (Toyota →
//    Corolla, Yaris Sedan, Vitz…). "Koi aur" chun kar khud bhi likh
//    sakte hain. Pehle sirf free text tha, is liye ek hi gaari
//    "corolla", "Corolla" aur "COROLLA" ban kar teen alag entries mein
//    bat jati thi aur filter mein nahi milti thi.
//
// 3. NAYI FIELDS
//    • Registered In (shehar/province ya Un-Registered)
//    • Registration Year
//    • Assembly (Local / Imported)
//    • Seller Type (Private / Dealer)
//    Pakistan mein har ad par yehi cheezen sab se pehle poochi jati hain.
//
//    ⚠️ Car table mein in ke apne columns nahi hain. Backend
//    (car.controller.js) inhe description ke neeche ek saaf
//    "— Extra Details —" block mein rakh deta hai, taake bagair
//    migration ke bhi maloomat zaya na ho. Proper columns chahiye hon
//    to README mein SQL mojood hai.
//
// 4. CUSTOM COLOR
//    "Other" chunte hi text box khulta hai. Pehle bhi tha lekin state
//    ulajh jati thi (custom likhne par swatch bhi selected reh jata
//    tha). Ab ek hi source of truth hai.
//
// 5. FEATURES AB GROUPS MEIN
//    Comfort / Safety / Exterior / Infotainment — 15 ki flat list ki
//    jagah. Dhoondna asaan, aur ek group ko poora select karne ka
//    button bhi hai.
//
// 6. CARTOON HATAYA
//    • header ka blue→cyan gradient circle
//    • submit button ka blue→cyan gradient
//    • exchange toggle ka purple (#8b5cf6)
//    • selected chips par hardcoded `color: white` (light theme mein
//      gold background par safed text parha hi nahi jata tha)
//    Sab ab var(--accent) / var(--accent-text) par.
//
// 7. QUOTA
//    Upar banner batata hai kitni free listings baqi hain. Submit ke
//    baad agar backend `requiresPayment: true` bheje to wahi
//    ListingQuotaModal khulta hai jo dashboard par hai.

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Upload, X, ChevronDown, ArrowLeftRight, Check, Loader2, Info } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import ListingQuotaModal from '@/components/dashboard/ListingQuotaModal';
import { toTitleCase, sentenceCase } from '@/lib/textCase';
import {
  MAKES, MAKE_NAMES, PK_CITIES, BODY_TYPES, TRANSMISSIONS, FUEL_TYPES,
  CONDITIONS, EXTERIOR_COLORS, CAR_FEATURES, REGISTRATION_CITIES,
  ASSEMBLY_TYPES, SELLER_TYPES,
} from '@/components/home/browseData';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const inputCls = 'w-full p-3 rounded-xl outline-none transition-colors text-sm';
const selectCls = `${inputCls} appearance-none cursor-pointer pr-9`;
const inputStyle = {
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1960;
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

export default function NewListingPage() {
  const { t } = useLang();
  const router = useRouter();
  const { token, user, isAuthenticated, _hasHydrated, refreshUser } = useAuthStore();
  const fileInputRef = useRef(null);

  /* ── Guard ──
     ✅ FIX: Pehle yahan `user.role` check karke turant (page load hote
     hi) non-seller/dealer ko '/dashboard/become-seller' par redirect
     kar diya jata tha — is wajah se pehle listing form render hota tha,
     phir 1 second baad ye useEffect fire ho kar dobara become-seller
     form khol deta tha (do forms ek sath dikhte thay).
     Ab sirf authentication check yahan hai — seller-onboarding ka faisla
     submit time par backend khud karta hai (`requiresSellerOnboarding`,
     neeche handleSubmit mein), jo sahi jagah hai kyunke tab tak user
     shayad already register ho chuka ho ya form bhar kar seller ban
     jaye. */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login?redirect=/dashboard/new-listing');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const [form, setForm] = useState({
    title: '', brand: '', model: '', variant: '', year: '',
    price: '', mileage: '', bodyType: 'SEDAN', transmission: 'MANUAL',
    fuelType: 'PETROL', condition: 'USED', color: '', engineCC: '',
    city: '', description: '', isForExchange: false,
    // ✅ nayi fields
    registrationCity: '', registrationYear: '', assembly: 'Local', sellerType: 'PRIVATE',
  });

  const [modelMode, setModelMode] = useState('list'); // 'list' | 'custom'
  const [colorMode, setColorMode] = useState('swatch'); // 'swatch' | 'custom'
  const [customColor, setCustomColor] = useState('');
  const [features, setFeatures] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [quota, setQuota] = useState(null);
  const [quotaModal, setQuotaModal] = useState({ open: false, carId: null });
  const [pricing, setPricing] = useState({ showroomPrice: 100 });

  /* ── Quota + pricing ── */
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/payments/listing-quota`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setQuota(d.data))
      .catch(() => {});

    fetch(`${API}/payments/pricing`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setPricing(d.data))
      .catch(() => {});
  }, [token]);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  /* ── Brand badalne par model reset ── */
  const modelOptions = useMemo(() => MAKES[form.brand] || [], [form.brand]);

  const handleBrandChange = (brand) => {
    setForm((p) => ({ ...p, brand, model: '' }));
    // Jis brand ke models hamare paas nahi (jaise "Other"), wahan seedha
    // text box khol do — warna user ek khali dropdown ke samne atak jata.
    setModelMode((MAKES[brand] || []).length ? 'list' : 'custom');
  };

  /* ── Title khud ban jata hai (user chahe to badal le) ── */
  const suggestedTitle = useMemo(() => {
    const parts = [form.brand, form.model, form.year, form.variant].filter(Boolean);
    return parts.length >= 2 ? toTitleCase(parts.join(' ')) : '';
  }, [form.brand, form.model, form.year, form.variant]);

  useEffect(() => {
    // Sirf tab bharo jab user ne khud kuch na likha ho
    if (suggestedTitle && !form.title) set('title', suggestedTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedTitle]);

  /* ── Color ── */
  const pickColor = (name) => {
    setColorMode('swatch');
    setCustomColor('');
    set('color', name);
  };

  const useCustomColor = () => {
    setColorMode('custom');
    set('color', customColor.trim());
  };

  const onCustomColor = (v) => {
    setCustomColor(v);
    set('color', v.trim());
  };

  /* ── Features ── */
  const toggleFeature = (f) =>
    setFeatures((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  const toggleGroup = (items) => {
    const allOn = items.every((i) => features.includes(i));
    setFeatures((p) => (allOn ? p.filter((x) => !items.includes(x)) : [...new Set([...p, ...items])]));
  };

  /* ── Images ── */
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      setError(t('listing.maxImages', { n: 10 }));
      return;
    }
    setImages((p) => [...p, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((p) => [...p, reader.result]);
      reader.readAsDataURL(file);
    });
    setError('');
  };

  const removeImage = (idx) => {
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.brand || !form.model || !form.year || !form.price) {
      setError(t('common.required'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.city) {
      setError(t('common.required'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // ✅ PHASE 5 — kam az kam ek photo lazmi.
    // Bagair tasveer ke listing par koi click hi nahi karta, aur wo
    // marketplace ko khali aur ghair-mo'tabar bana deti hai.
    if (images.length === 0) {
      setError(t('listing.addImages'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = new FormData();
      const clean = {
        ...form,
        title: toTitleCase(form.title || suggestedTitle),
        brand: toTitleCase(form.brand),
        model: toTitleCase(form.model),
        variant: form.variant ? toTitleCase(form.variant) : '',
        color: colorMode === 'custom' ? sentenceCase(customColor) : form.color,
      };

      Object.entries(clean).forEach(([k, v]) => payload.append(k, v));
      payload.append('features', JSON.stringify(features));
      images.forEach((img) => payload.append('images', img));

      const res = await fetch(`${API}/cars`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ✅ FIX: Backend ab pehli listing par user ko private SELLER bana
        // deta hai (hasSellerProfile: true) — authStore ko turant sync
        // karo taake agli dafa Dashboard button click karne par ye
        // listing form dobara na khule, balke seedha seller dashboard
        // khule (bina logout/login kiye).
        await refreshUser();

        // ✅ Free quota khatam — modal dikhao, dashboard mat bhejo
        if (data.requiresPayment) {
          setQuota(data.quota || quota);
          setQuotaModal({ open: true, carId: data.carId || data.data?.id });
          setLoading(false);
          return;
        }
        router.push('/dashboard/seller');
      } else if (data.requiresSellerOnboarding) {
        router.replace('/dashboard/become-seller');
      } else {
        setError(data.message || t('common.saveFailed'));
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('create listing error:', err);
      setError(t('dashboard.ui.serverConnection'));
      setLoading(false);
    }
  };

  if (!_hasHydrated) return null;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-dash-page)' }}>
      <div className="max-w-3xl mx-auto">

        {/* ══ Header — gradient circle hata diya ══ */}
        <div className="mb-6 flex items-start gap-3.5">
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Car size={20} style={{ color: 'var(--accent-text)' }} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{t('listing.newTitle')}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.ui.detailMoreSells')}
            </p>
          </div>
        </div>

        {/* ══ Quota strip ══ */}
        {quota && !quota.showroomActive && (
          <div
            className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
            style={{
              background: quota.quotaExceeded ? 'rgba(220,38,38,0.07)' : 'var(--bg-dash-cta)',
              border: `1px solid ${quota.quotaExceeded ? 'rgba(220,38,38,0.25)' : 'var(--border-dash-cta)'}`,
            }}
          >
            <Info size={16} className="shrink-0" style={{ color: quota.quotaExceeded ? '#dc2626' : 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {quota.quotaExceeded
                ? t('dashboard.ui.chooseNext', { price: quota.extraPrice })
                : t('dashboard.ui.freeRemaining', { free: quota.free, remaining: quota.remaining })}
            </p>
          </div>
        )}

        {error && (
          <div
            className="mb-5 p-3.5 rounded-xl text-sm"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ══ Exchange toggle — purple hata kar accent ══ */}
          <div
            className="p-5 rounded-2xl transition-colors"
            style={{
              background: form.isForExchange ? 'var(--bg-dash-cta)' : 'var(--card-bg)',
              border: `1.5px solid ${form.isForExchange ? 'var(--accent)' : 'var(--border-color)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ArrowLeftRight
                  size={19}
                  className="mt-0.5 shrink-0"
                  style={{ color: form.isForExchange ? 'var(--accent)' : 'var(--text-muted)' }}
                />
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {t('dashboard.ui.exchangeTradeIn')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {t('dashboard.ui.exchangeHint')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.isForExchange}
                onClick={() => set('isForExchange', !form.isForExchange)}
                className="relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300"
                style={{ background: form.isForExchange ? 'var(--accent)' : 'var(--border-color)' }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full transition-all duration-300"
                  style={{ left: form.isForExchange ? '26px' : '4px', background: '#fff' }}
                />
              </button>
            </div>
          </div>

          {/* ══ Basic ══ */}
          <Section title={t('dashboard.ui.basicInfo')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('car.brand')} required>
                <Select value={form.brand} onChange={(e) => handleBrandChange(e.target.value)} required>
                  <option value="">{t('car.selectBrand')}</option>
                  {MAKE_NAMES.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>

              <Field label={t('car.model')} required>
                {modelMode === 'list' && modelOptions.length > 0 ? (
                  <Select
                    value={form.model}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') { setModelMode('custom'); set('model', ''); }
                      else set('model', e.target.value);
                    }}
                    disabled={!form.brand}
                    required
                  >
                    <option value="">{form.brand ? t('dashboard.ui.modelChoose') : t('dashboard.ui.brandFirst')}</option>
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom__">{t('car.otherBrand')}</option>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={inputCls}
                      style={inputStyle}
                      placeholder={t('dashboard.ui.modelName')}
                      value={form.model}
                      onChange={(e) => set('model', e.target.value)}
                      required
                    />
                    {modelOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setModelMode('list'); set('model', ''); }}
                        className="shrink-0 px-3 rounded-xl text-xs font-bold"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        {t('dashboard.ui.list')}
                      </button>
                    )}
                  </div>
                )}
              </Field>

              <Field label={t('dashboard.ui.variantTrim')}>
                <input
                  type="text" className={inputCls} style={inputStyle} placeholder={t('dashboard.ui.variantExample')}
                  value={form.variant} onChange={(e) => set('variant', e.target.value)}
                />
              </Field>

              <Field label={t('common.year')} required>
                <Select value={form.year} onChange={(e) => set('year', e.target.value)} required>
                  <option value="">{t('car.selectYear')}</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>

              <div className="sm:col-span-2">
                <Field label={t('dashboard.ui.adTitle')} hint={t('dashboard.ui.adTitleHint')}>
                  <input
                    type="text" className={inputCls} style={inputStyle}
                    placeholder={suggestedTitle || t('dashboard.ui.adExample')}
                    value={form.title} onChange={(e) => set('title', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ══ Price & meters ══ */}
          <Section title={t('dashboard.ui.priceMeters')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={`${t('common.price')} (PKR)`} required>
                <input
                  type="number" min="0" className={inputCls} style={inputStyle} placeholder={t('dashboard.ui.priceExample')}
                  value={form.price} onChange={(e) => set('price', e.target.value)} required
                />
              </Field>
              <Field label={t('car.mileageKm')}>
                <input
                  type="number" min="0" className={inputCls} style={inputStyle} placeholder={t('dashboard.ui.mileageExample')}
                  value={form.mileage} onChange={(e) => set('mileage', e.target.value)}
                />
              </Field>
              <Field label={`${t('car.engine')} (CC)`}>
                <input
                  type="number" min="0" className={inputCls} style={inputStyle} placeholder={t('dashboard.ui.engineExample')}
                  value={form.engineCC} onChange={(e) => set('engineCC', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ══ Specs ══ */}
          <Section title={t('dashboard.ui.specifications')}>
            <Field label={t('car.condition')}>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Chip
                    key={c.value}
                    active={form.condition === c.value}
                    onClick={() => set('condition', c.value)}
                  >
                    {c.label}
                  </Chip>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('car.bodyType')}>
                <Select value={form.bodyType} onChange={(e) => set('bodyType', e.target.value)}>
                  {BODY_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </Select>
              </Field>

              <Field label={t('car.transmission')}>
                <Select value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                  {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>

              <Field label={t('car.fuelType')}>
                <Select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
                  {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </Field>

              <Field label={t('common.city')} required>
                <Select value={form.city} onChange={(e) => set('city', e.target.value)} required>
                  <option value="">{t('ai.selectCity')}</option>
                  {PK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>

              {/* ✅ nayi fields */}
              <Field label={t('dashboard.ui.registeredIn')} hint={t('dashboard.ui.registeredHint')}>
                <Select value={form.registrationCity} onChange={(e) => set('registrationCity', e.target.value)}>
                  <option value="">{t('common.selectOption')}</option>
                  {REGISTRATION_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>

              <Field label={t('dashboard.ui.registrationYear')}>
                <Select value={form.registrationYear} onChange={(e) => set('registrationYear', e.target.value)}>
                  <option value="">{t('common.selectOption')}</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>

              <Field label={t('dashboard.ui.assembly')}>
                <div className="flex gap-2">
                  {ASSEMBLY_TYPES.map((a) => (
                    <Chip key={a} active={form.assembly === a} onClick={() => set('assembly', a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Field label={t('dashboard.ui.whoAreYou')}>
                <div className="flex gap-2">
                  {SELLER_TYPES.map((s) => (
                    <Chip key={s.value} active={form.sellerType === s.value} onClick={() => set('sellerType', s.value)}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>

            {/* ── Color ── */}
            <Field label={t('dashboard.ui.exteriorColor')}>
              <div className="flex flex-wrap gap-2">
                {EXTERIOR_COLORS.map(({ name, hex }) => {
                  const selected = colorMode === 'swatch' && form.color === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => pickColor(name)}
                      title={name}
                      className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      style={{
                        background: selected ? 'var(--accent)' : 'var(--bg-surface-alt)',
                        color: selected ? 'var(--accent-text)' : 'var(--text-secondary)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-color)'}`,
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                        style={{
                          background: hex,
                          border: `1px solid ${name === 'White' ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.15)'}`,
                        }}
                      >
                        {selected && <Check size={11} style={{ color: name === 'White' || name === 'Beige' ? '#111' : '#fff' }} />}
                      </span>
                      {name}
                    </button>
                  );
                })}

                {/* ✅ Custom color */}
                <button
                  type="button"
                  onClick={useCustomColor}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: colorMode === 'custom' ? 'var(--accent)' : 'var(--bg-surface-alt)',
                    color: colorMode === 'custom' ? 'var(--accent-text)' : 'var(--text-secondary)',
                    border: `1px solid ${colorMode === 'custom' ? 'var(--accent)' : 'var(--border-color)'}`,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ background: 'conic-gradient(from 0deg,#c0271f,#e2c113,#15803d,#1d4ed8,#5f1220,#c0271f)' }}
                  />
                  {t('dashboard.ui.customColor')}
                </button>
              </div>

              {colorMode === 'custom' && (
                <input
                  type="text"
                  className={`${inputCls} mt-3`}
                  style={inputStyle}
                  placeholder={t('dashboard.ui.colorPlaceholder')}
                  value={customColor}
                  onChange={(e) => onCustomColor(e.target.value)}
                  autoFocus
                />
              )}
            </Field>
          </Section>

          {/* ══ Features — ab groups mein ══ */}
          <Section title={`${t('car.features')}${features.length ? ` (${features.length})` : ''}`}>
            <div className="space-y-5">
              {CAR_FEATURES.map(({ group, items }) => {
                const allOn = items.every((i) => features.includes(i));
                return (
                  <div key={group}>
                    <div className="flex items-center justify-between mb-2.5">
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--accent)' }}
                      >
                        {group}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleGroup(items)}
                        className="text-[11px] font-bold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {allOn ? t('dashboard.ui.removeAll') : t('dashboard.ui.selectAll')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((f) => (
                        <Chip key={f} active={features.includes(f)} onClick={() => toggleFeature(f)} small>
                          {f}
                        </Chip>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ══ Description ══ */}
          <Section title={t('common.description')}>
            <textarea
              rows={5}
              className="w-full p-3 rounded-xl outline-none text-sm resize-none"
              style={inputStyle}
              placeholder={t('dashboard.ui.descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Section>

          {/* ══ Photos ══ */}
          <Section title={t('dashboard.ui.photosRequired', { count: previews.length })}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl p-8 text-center transition-colors"
              style={{ border: '2px dashed var(--border-color)', background: 'var(--bg-surface-alt)' }}
            >
              <Upload size={26} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.ui.uploadPhotos')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('dashboard.ui.coverHintPhotos')}
              </p>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span
                        className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                      >
                        {t('dashboard.ui.cover')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={t('dashboard.ui.removePhoto')}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.65)' }}
                    >
                      <X size={11} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ══ Submit — gradient hata diya ══ */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[0.99]"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
            }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading
              ? t('common.processing')
              : form.isForExchange ? t('exchange.send') : t('common.publish')}
          </button>
        </form>
      </div>

      <ListingQuotaModal
        open={quotaModal.open}
        carId={quotaModal.carId}
        quota={quota}
        showroomPrice={pricing.showroomPrice}
        onClose={() => { setQuotaModal({ open: false, carId: null }); router.push('/dashboard/seller'); }}
      />
    </div>
  );
}

/* ═══════════════ Chhote UI helpers ═══════════════ */

function Section({ title, children }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
    >
      <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}

function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select className={selectCls} style={inputStyle} {...props}>
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
    </div>
  );
}

function Chip({ active, onClick, children, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full font-semibold transition-colors ${small ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'}`}
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-surface-alt)',
        // ✅ pehle yahan hardcoded `white` tha — light theme mein gold
        // background par safed text bilkul parha nahi jata tha
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
      }}
    >
      {children}
    </button>
  );
}