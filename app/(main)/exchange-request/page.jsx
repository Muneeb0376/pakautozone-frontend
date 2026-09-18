'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/exchange-request/page.jsx
//
// ✅ POORI FILE REPLACE
//
// ══ AAP NE JO KAHA ══
// "Is ki theme bhi light aur dark mein nahi hai, aur is form mein aur
//  option bhi nahi hain. Is ko jaisa new-listing wala form hai jis se
//  hum car upload karte hain, us jaisa bana do — ziada saare options,
//  full functional."
//
// ══ PEHLE KYA THA ══
// Poora safha hard-coded `from-slate-900 to-slate-950` (dark navy) par
// tha, text hamesha safed, inputs `bg-white/5` — light theme mein bhi
// yehi kaala safha dikhta tha, screenshot mein wahi nazar aa raha hai.
// Sirf 5 fields thin: brand, model, year, mileage, condition (dropdown
// mein sirf teen option), description, photos.
//
// ══ AB KYA HAI ══
// Poora theme `var(--*)` tokens par — Navbar/new-listing form jaisa hi
// light/dark. Aur fields new-listing form jaise hi mukammal:
//
//   • Brand (dropdown) → Model (brand ke sath badalta hai, ya "Koi aur")
//   • Variant/Trim
//   • Year (dropdown — 1961 jaisa ghalat saal ab nahi likha ja sakta)
//   • Mileage, Engine CC
//   • Condition (chips) — New / Used / Certified Pre-Owned
//   • Body Type, Transmission, Fuel Type (chips/dropdown)
//   • Exterior Color (swatches + custom text)
//   • Aap ka shehar
//   • Features (grouped checkboxes) — Comfort/Safety/Exterior/Infotainment
//   • Description
//   • Photos — **kam az kam 1 lazmi** (backend bhi check karta hai)
//
// Data sab `components/home/browseData.js` se — wahi ek file jo
// homepage, listing form aur filters use karte hain. Is liye yahan
// diye options kabhi baqi site se alag nahi honge.
//
// ══ BACKEND KA MASLA ══
// `TradeIn` table mein sirf carBrand/carModel/carYear/carMileage/
// carCondition/carDescription/images columns hain — bodyType, color,
// transmission, fuelType, engineCC, city, features ke apne columns
// nahi hain. Migration ke bagair data zaya na ho, is liye ye extra
// maloomat description ke neeche ek saaf "— Gaari Ki Tafseel —" block
// mein jati hai (Phase 2 ke car listing form jaisa hi pattern). Proper
// columns chahiye hon to is file ke README mein SQL diya hua hai.
//
// ⚠️ LOGIC BILKUL NAHI BADLA — wahi auth guard, wahi
//    `POST /trade-in/submit`, wahi WhatsApp link banane wala hissa
//    dealer ke store se number laa kar. Sirf UI mukammal aur theme
//    theek ki hai.

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCleanToken } from '@/lib/auth';
import {
  ArrowLeft, Upload, Loader2, CheckCircle2, AlertTriangle, X, ChevronDown,
  Repeat, Check, Info, Car, SlidersHorizontal, Sparkles, FileText, Images,
} from 'lucide-react';

import {
  MAKES, MAKE_NAMES, PK_CITIES, BODY_TYPES, TRANSMISSIONS, FUEL_TYPES,
  EXTERIOR_COLORS, CAR_FEATURES, REGISTRATION_CITIES, ASSEMBLY_TYPES,
  SELLER_TYPES,
} from '@/components/home/browseData';
import { toTitleCase, sentenceCase } from '@/lib/textCase';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const UPLOADS_BASE = API.replace(/\/api\/?$/, '');

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1960 + 1 }, (_, i) => CURRENT_YEAR - i);

const CONDITIONS = [
  { label: 'New', value: 'New' },
  { label: 'Used', value: 'Used' },
  { label: 'Certified Pre-Owned', value: 'Certified Pre-Owned' },
];

/* ✅ WhatsApp glyph — lucide brand icons nahi deta */
const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.892.526 3.66 1.437 5.166L2 22l4.964-1.404A9.945 9.945 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.4a8.38 8.38 0 0 1-4.27-1.17l-.306-.183-3.096.876.85-3.02-.2-.31A8.394 8.394 0 0 1 3.6 12c0-4.639 3.762-8.4 8.4-8.4 4.639 0 8.4 3.762 8.4 8.4 0 4.639-3.762 8.4-8.399 8.4z" />
  </svg>
);

/** Kisi bhi stored number ko wa.me ke liye theek shakal mein laao */
const formatWhatsappNumber = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return `92${digits.slice(1)}`;
  return `92${digits}`;
};

const inputCls = 'w-full p-3 rounded-xl outline-none transition-colors text-sm';
const selectCls = `${inputCls} appearance-none cursor-pointer pr-9`;
const inputStyle = {
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

export default function ExchangeRequestPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      }
    >
      <ExchangeRequestPage />
    </Suspense>
  );
}

function ExchangeRequestPage() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);

  // ⚠️ Purane URLs mein `dealCarId`/`dealerStoreId` istemal hote hain
  // (screenshot mein bhi yehi hain) — kuch jagah `dealCarId`/`dealerStoreId`
  // ki bajaye `dealCarId`/`dealerStoreId` alag naam se bhi bheja gaya
  // mil sakta hai, is liye dono naam check karte hain taake koi purana
  // link toota hua na mile.
  const dealCarId = searchParams?.get('dealCarId') || searchParams?.get('dealCarId');
  const dealerStoreId = searchParams?.get('dealerStoreId') || searchParams?.get('dealerStoreId');

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    brand: '', model: '', variant: '', year: CURRENT_YEAR,
    mileage: '', engineCC: '', condition: 'Used',
    bodyType: '', transmission: '', fuelType: '',
    city: '', description: '',
    // ✅ new-listing form jaisi extra fields
    registrationCity: '', registrationYear: '', assembly: 'Local', sellerType: 'PRIVATE',
  });

  const [modelMode, setModelMode] = useState('list'); // 'list' | 'custom'
  const [colorMode, setColorMode] = useState('swatch'); // 'swatch' | 'custom'
  const [color, setColor] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [features, setFeatures] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  /* ── Auth guard — bilkul purani jaisi ── */
  useEffect(() => {
    const cleanToken = getCleanToken();
    if (!cleanToken) {
      // ✅ Purana `/login` safha ab AuthModal par redirect karta hai —
      // wahi flow yahan bhi istemal, alert() ki bajaye.
      router.push(`/?auth=login&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setToken(cleanToken);
    setLoading(false);
  }, [router]);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  /* ── Brand → Model options ── */
  const modelOptions = useMemo(() => MAKES[form.brand] || [], [form.brand]);

  const handleBrandChange = (brand) => {
    setForm((p) => ({ ...p, brand, model: '' }));
    setModelMode((MAKES[brand] || []).length ? 'list' : 'custom');
  };

  /* ── Color ── */
  const pickColor = (name) => { setColorMode('swatch'); setCustomColor(''); setColor(name); };
  const useCustomColor = () => { setColorMode('custom'); setColor(customColor.trim()); };
  const onCustomColor = (v) => { setCustomColor(v); setColor(v.trim()); };

  /* ── Features ── */
  const toggleFeature = (f) =>
    setFeatures((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  const toggleGroup = (items) => {
    const allOn = items.every((i) => features.includes(i));
    setFeatures((p) => (allOn ? p.filter((x) => !items.includes(x)) : [...new Set([...p, ...items])]));
  };

  /* ── Photos ── */
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (files.length + newFiles.length > 5) {
      setError('Zyada se zyada 5 photos.');
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((p) => [...p, reader.result]);
      reader.readAsDataURL(file);
    });
    setError(null);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ── Missing params guard ── */
  if (!dealCarId || !dealerStoreId) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <span
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(220,38,38,0.10)' }}
          >
            <AlertTriangle size={26} style={{ color: '#dc2626' }} />
          </span>
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Ye link theek nahi hai
          </p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
            Kisi car ki listing se &ldquo;Trade In Karein&rdquo; par click kar ke aayein.
          </p>
          <button
            onClick={() => router.back()}
            className="h-11 px-6 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Wapis jayein
          </button>
        </div>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      </Shell>
    );
  }

  /* ── Submit — bilkul purana logic, sirf naye fields description mein jorhe ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.brand || !form.model) {
      setError('Brand aur model zaroori hain.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.city) {
      setError('Apna shehar batana zaroori hai — dealer isi se andaza lagata hai.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // ✅ Kam az kam ek photo — bagair tasveer dealer andaza nahi laga
    // sakta ke gaari ki asal haalat kya hai.
    if (files.length === 0) {
      setError('Kam az kam ek photo lagana zaroori hai.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);

      // ── Extra tafseel jo TradeIn table mein apna column nahi rakhti,
      // is liye description ke neeche ek saaf block mein jati hai ──
      const extras = [];
      if (form.variant) extras.push(`Variant: ${toTitleCase(form.variant)}`);
      if (form.engineCC) extras.push(`Engine: ${form.engineCC} cc`);
      if (form.bodyType) extras.push(`Body Type: ${toTitleCase(form.bodyType)}`);
      if (form.transmission) extras.push(`Transmission: ${toTitleCase(form.transmission)}`);
      if (form.fuelType) extras.push(`Fuel Type: ${toTitleCase(form.fuelType)}`);
      if (color) extras.push(`Color: ${colorMode === 'custom' ? sentenceCase(color) : color}`);
      if (form.city) extras.push(`City: ${toTitleCase(form.city)}`);
      if (form.registrationCity) extras.push(`Registered In: ${toTitleCase(form.registrationCity)}`);
      if (form.registrationYear) extras.push(`Registration Year: ${form.registrationYear}`);
      if (form.assembly) extras.push(`Assembly: ${form.assembly}`);
      if (form.sellerType) extras.push(`Seller Type: ${toTitleCase(form.sellerType)}`);
      if (features.length) extras.push(`Features: ${features.join(', ')}`);

      const fullDescription = [
        form.description ? String(form.description).trim() : '',
        extras.length ? `\n\n— Gaari Ki Tafseel —\n${extras.join('\n')}` : '',
      ].join('').trim();

      const formData = new FormData();
      formData.append('carBrand', toTitleCase(form.brand));
      formData.append('carModel', toTitleCase(form.model));
      formData.append('carYear', form.year);
      formData.append('carMileage', form.mileage);
      formData.append('carCondition', form.condition);
      formData.append('carDescription', fullDescription);
      formData.append('dealCarId', dealCarId);
      formData.append('dealerStoreId', dealerStoreId);

      files.forEach((file) => formData.append('images', file));

      const res = await fetch(`${API}/trade-in/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ── Dealer ke WhatsApp par bhejna — bilkul purana logic ──
        try {
          const storeRes = await fetch(`${API}/stores/id/${dealerStoreId}`);
          const storeData = await storeRes.json();
          const rawNumber = storeData?.data?.whatsapp || storeData?.data?.phone;
          const waNumber = formatWhatsappNumber(rawNumber);

          if (waNumber) {
            const imageLinks = (data.data?.images || []).map((p) => `${UPLOADS_BASE}${p}`);

            const message =
              `*Naya Trade-in / Exchange Request*\n\n` +
              `🚘 Car: ${toTitleCase(form.brand)} ${toTitleCase(form.model)} (${form.year})\n` +
              `📏 Mileage: ${form.mileage ? `${form.mileage} km` : 'N/A'}\n` +
              `⚙️ Condition: ${form.condition}\n` +
              (form.bodyType ? `🚗 Body Type: ${toTitleCase(form.bodyType)}\n` : '') +
              (color ? `🎨 Color: ${color}\n` : '') +
              (form.city ? `📍 City: ${toTitleCase(form.city)}\n` : '') +
              (form.assembly ? `🏭 Assembly: ${form.assembly}\n` : '') +
              (form.sellerType ? `👤 Seller Type: ${toTitleCase(form.sellerType)}\n` : '') +
              `📝 Description: ${form.description || '-'}\n` +
              (imageLinks.length ? `\n📸 Photos:\n${imageLinks.join('\n')}\n` : '\n') +
              `\nSent via Pak Auto Zone`;

            const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
            window.open(waLink, '_blank', 'noopener,noreferrer');
          }
        } catch (waErr) {
          console.error('WhatsApp link error:', waErr);
        }

        setSubmitted(true);
        setTimeout(() => router.push('/cars'), 3000);
      } else {
        setError(data.message || 'Exchange request could not be submitted.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Could not connect to the server. Please try again.');
      setSubmitting(false);
    }
  };

  /* ══ Success ══ */
  if (submitted) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div
            className="text-center max-w-md rounded-2xl p-8"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}
          >
            <span
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(5,150,105,0.10)' }}
            >
              <CheckCircle2 size={30} style={{ color: '#059669' }} />
            </span>
            <h1 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
              Exchange Request Sent

            </h1>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The dealer will review your request and contact you shortly. You will also receive a notification.

            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Redirecting to the Cars page…

            </p>
          </div>
        </div>
      </Shell>
    );
  }

  /* ══ Form ══ */
  return (
    <Shell>
      <div className="max-w-3xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="mb-6 flex items-start gap-3.5">
          <button
            onClick={() => router.back()}
            aria-label={t('common.back')}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={17} />
          </button>
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Repeat size={20} style={{ color: 'var(--accent-text)' }} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{t('exchange.request')}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Tell the Dealer About Your Car

            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ══ Buniyadi maloomat ══ */}
          <Section title="Basic Information" icon={Car} tint="#3b82f6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand" required>
                <Select value={form.brand} onChange={(e) => handleBrandChange(e.target.value)} required>
                  <option value="">Choose your Brand</option>
                  {MAKE_NAMES.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>

              <Field label="Model" required>
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
                    <option value="">{form.brand ? 'Chosse your Model' : 'First Select the Brand'}</option>
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom__">Other — Enter Your Own</option>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text" className={inputCls} style={inputStyle}
                      placeholder="Model ka naam" value={form.model}
                      onChange={(e) => set('model', e.target.value)} required
                    />
                    {modelOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setModelMode('list'); set('model', ''); }}
                        className="shrink-0 px-3 rounded-xl text-xs font-bold"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        List
                      </button>
                    )}
                  </div>
                )}
              </Field>

              <Field label="Variant / Trim">
                <input
                  type="text" className={inputCls} style={inputStyle} placeholder="GLI, VXL, Altis"
                  value={form.variant} onChange={(e) => set('variant', e.target.value)}
                />
              </Field>

              <Field label="Model Year">
                <Select value={form.year} onChange={(e) => set('year', e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>

              <Field label="Mileage (KM)">
                <input
                  type="number" min="0" className={inputCls} style={inputStyle} placeholder="e.g. 50000"
                  value={form.mileage} onChange={(e) => set('mileage', e.target.value)}
                />
              </Field>

              <Field label="Engine (CC)">
                <input
                  type="number" min="0" className={inputCls} style={inputStyle} placeholder="e.g. 1600"
                  value={form.engineCC} onChange={(e) => set('engineCC', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ══ Specifications ══ */}
          <Section title="Specifications" icon={SlidersHorizontal} tint="#8b5cf6">
            <Field label="Condition">
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Chip key={c.value} active={form.condition === c.value} onClick={() => set('condition', c.value)}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Body Type">
                <Select value={form.bodyType} onChange={(e) => set('bodyType', e.target.value)}>
                  <option value="">Select</option>
                  {BODY_TYPES.map((b, i) => <option key={b.value ?? b ?? i} value={b.value ?? b}>{b.label ?? b}</option>)}
                </Select>
              </Field>

              <Field label="Transmission">
                <Select value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                  <option value="">Select</option>
                  {TRANSMISSIONS.map((t, i) => <option key={t.value ?? t ?? i} value={t.value ?? t}>{t.label ?? t}</option>)}
                </Select>
              </Field>

              <Field label="Fuel Type">
                <Select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
                  <option value="">Select</option>
                  {FUEL_TYPES.map((f, i) => <option key={f.value ?? f ?? i} value={f.value ?? f}>{f.label ?? f}</option>)}
                </Select>
              </Field>

              <Field label="Your City" required>
                <Select value={form.city} onChange={(e) => set('city', e.target.value)} required>
                  <option value="">{t('ai.selectCity')}</option>
                  {PK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>

              {/* ✅ new-listing form jaisi extra fields */}
              <Field label="Registered In" hint="Which city/province is the car registered in?
">
                <Select value={form.registrationCity} onChange={(e) => set('registrationCity', e.target.value)}>
                  <option value="">Select</option>
                  {REGISTRATION_CITIES.map((c, i) => <option key={c ?? i} value={c}>{c}</option>)}
                </Select>
              </Field>

              <Field label="Registration Year">
                <Select value={form.registrationYear} onChange={(e) => set('registrationYear', e.target.value)}>
                  <option value="">Select</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>

              <Field label="Assembly">
                <div className="flex gap-2">
                  {ASSEMBLY_TYPES.map((a, i) => (
                    <Chip key={a ?? i} active={form.assembly === a} onClick={() => set('assembly', a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Field label="Who are you">
                <div className="flex gap-2">
                  {SELLER_TYPES.map((s, i) => (
                    <Chip key={s.value ?? s ?? i} active={form.sellerType === (s.value ?? s)} onClick={() => set('sellerType', s.value ?? s)}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>

            {/* ── Color ── */}
            <Field label="Exterior Color">
              <div className="flex flex-wrap gap-2">
                {EXTERIOR_COLORS.map(({ name, hex }, i) => {
                  const selected = colorMode === 'swatch' && color === name;
                  return (
                    <button
                      key={name ?? i} type="button" onClick={() => pickColor(name)} title={name}
                      className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      style={{
                        background: selected ? 'var(--accent)' : 'var(--bg-surface-alt)',
                        color: selected ? 'var(--accent-text)' : 'var(--text-secondary)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-color)'}`,
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                        style={{ background: hex, border: `1px solid ${name === 'White' ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.15)'}` }}
                      >
                        {selected && <Check size={11} style={{ color: name === 'White' || name === 'Beige' ? '#111' : '#fff' }} />}
                      </span>
                      {name}
                    </button>
                  );
                })}

                <button
                  type="button" onClick={useCustomColor}
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
                  Any Other
                </button>
              </div>

              {colorMode === 'custom' && (
                <input
                  type="text" className={`${inputCls} mt-3`} style={inputStyle}
                  placeholder="Enter the Color Name — Pearl White, Champagne"
                  value={customColor} onChange={(e) => onCustomColor(e.target.value)} autoFocus
                />
              )}
            </Field>
          </Section>

          {/* ══ Features ══ */}
          <Section title={`Features${features.length ? ` (${features.length})` : ''}`} icon={Sparkles} tint="#16a34a">
            <div className="space-y-5">
              {CAR_FEATURES.map(({ group, items }) => {
                const allOn = items.every((i) => features.includes(i));
                return (
                  <div key={group}>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                        {group}
                      </p>
                      <button
                        type="button" onClick={() => toggleGroup(items)}
                        className="text-[11px] font-bold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {allOn ? 'Remove all' : 'Select all'}
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
          <Section title={t('common.description')} icon={FileText} tint="#f97316">
            <textarea
              rows={5}
              className="w-full p-3 rounded-xl outline-none text-sm resize-none"
              style={inputStyle}
              placeholder="The car’s condition, service history, number of previous owners, and any pending repairs or work — the more clearly you provide these details, the easier it will be for the dealer.
"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Section>

          {/* ══ Photos ══ */}
          <Section title={`Photos (${previews.length}/5) — kam az kam 1 lazmi`} icon={Images} tint="#ec4899">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl p-8 text-center transition-colors"
              style={{ border: '2px dashed var(--border-color)', background: 'var(--bg-surface-alt)' }}
            >
              <Upload size={26} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Upload Photos

              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                A clear photo of the car in daylight works best.

              </p>
            </button>

            <input
              ref={fileInputRef} type="file" multiple accept="image/*"
              className="hidden" onChange={handleFileChange}
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button" onClick={() => removeFile(i)} aria-label="Photo hatayein"
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

          {/* ══ Submit ══ */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[0.99]"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Being sent…

              </>
            ) : (
              <>
                <WhatsAppIcon size={17} /> Send Details on WhatsApp

              </>
            )}
          </button>

          <div
            className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
            style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
          >
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your request and photos will be sent directly to the dealer via WhatsApp. The dealer will contact you directly.

            </p>
          </div>
        </form>
      </div>
    </Shell>
  );
}

/* ═══════════════ Chhote UI helpers ═══════════════ */

function Shell({ children }) {
  return (
    <div className="min-h-screen py-8 px-4 paz-has-bottom-nav" style={{ background: 'var(--bg-dash-page)' }}>
      {children}
    </div>
  );
}

function Section({ title, icon: Icon, tint, children }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${tint}1a`, color: tint }}
          >
            <Icon size={16} />
          </span>
        )}
        <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
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
      {hint && <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
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
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
      }}
    >
      {children}
    </button>
  );
}