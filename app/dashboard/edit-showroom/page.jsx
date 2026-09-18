//ye edit-showroom ki file ha //
'use client';
import { useLang } from '@/lib/i18nContext';

/**
 * FILE: frontend/app/dashboard/edit-showroom/page.jsx
 *
 * Showroom Profile Edit — rebuilt fresh.
 *
 * WHY THE OLD FORM WASN'T SAVING (root causes fixed here):
 * 1. This must submit multipart/form-data (because of the logo file input),
 *    NOT application/json. If you build a FormData object, do NOT manually
 *    set a `Content-Type` header — the browser sets the correct multipart
 *    boundary itself. Setting it manually breaks multer parsing silently.
 * 2. The backend controller (showroom.controller.js -> updateShowroom)
 *    reads `req.body.businessType`, NOT `listingType`. Sending the wrong
 *    field name means the business type silently never updates.
 * 3. Every request needs `Authorization: Bearer <token>` — without it the
 *    backend returns 401 and the old form may have swallowed that error.
 * 4. The endpoint is `PUT /api/showrooms/update` (see showroom.routes.js),
 *    matched to the `showroom.controller.js` field set:
 *    name, phone, whatsapp, email, city, address, description, businessType,
 *    + optional file field named "showroomImage".
 *
 * This page fixes all four, shows real backend error messages instead of a
 * generic failure, and gives immediate visual save confirmation.
 *
 * THEME FIX: page previously used its own hardcoded amber/cream Tailwind
 * `dark:` classes (bg-[#FFF8F0], bg-[#0f0f0a], border-amber-100, etc.),
 * which don't match the rest of the dashboard. It now reuses the exact same
 * shared design-system tokens as dashboard/showroom/page.jsx:
 *   - `bg-dash-page` for the page background
 *   - `text-theme-primary` / `text-theme-secondary` / `text-theme-muted`
 *   - `border-theme`, `glass-card`, `glow-hover`, `btn-dash-new`
 *   - CSS vars: --bg-dash-card, --border-dash-card, --bg-dash-cta,
 *     --border-dash-cta, --bg-surface-alt, --card-shadow
 * So light/dark mode now looks identical to the rest of the dealer
 * dashboard automatically, since these tokens flip with the same toggle.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getCleanToken } from '@/lib/auth';
import {
  ArrowLeft, Upload, Save, Loader2, CheckCircle2, AlertCircle,
  Building2, Phone, MessageCircle, Mail, MapPin, FileText, Car, Wrench, Layers, ImageOff,
  Trash2, Clock,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const BUSINESS_TYPES = [
  { value: 'CARS', label: 'Sirf Cars', desc: 'Sirf gaariyan bechni hain', icon: Car },
  { value: 'PARTS', label: 'Sirf Parts', desc: 'Sirf spare parts bechne hain', icon: Wrench },
  { value: 'BOTH', label: 'Cars + Parts', desc: 'Dono list karni hain', icon: Layers },
];

export default function EditShowroomPage() {
  const { t } = useLang();
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deactivationOpen, setDeactivationOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [deactivationSubmitting, setDeactivationSubmitting] = useState(false);
  const [deactivationMessage, setDeactivationMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: '',
    address: '',
    description: '',
    businessType: 'BOTH',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ✅ PHASE 7 FIX: same root cause as dashboard/showroom/page.jsx —
  // `getMyShowroom` returns HTTP 200 + `{ data: null }` when the user has
  // no Store yet (not a 404), so this edit page would previously just sit
  // on a blank/empty form forever instead of sending the user to the
  // Business Information form where a showroom actually gets created.
  const [noStoreFound, setNoStoreFound] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user) router.replace('/login');
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (noStoreFound) {
      router.replace('/dashboard/register-showroom');
    }
  }, [noStoreFound, router]);

  /* ── Load current showroom data ── */
  const fetchShowroom = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return;

    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API}/showrooms/my-showroom`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `Load nahi ho saka (status ${res.status})`);
      }

      const store = json?.data;
      if (store) {
        setForm({
          name: store.name || '',
          phone: store.phone || '',
          whatsapp: store.whatsapp || '',
          email: store.email || '',
          city: store.city || '',
          address: store.address || '',
          description: store.description || '',
          businessType: store.listingType || 'BOTH',
        });
        setLogoPreview(store.showroomImage || store.logo || null);
      } else {
        // ✅ PHASE 7 FIX: no store → send to register form instead of
        // leaving an empty "edit" form with nothing to save.
        setNoStoreFound(true);
      }
    } catch (err) {
      setLoadError(err.message || 'Showroom data load nahi ho saki.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) fetchShowroom();
  }, [_hasHydrated, isAuthenticated, fetchShowroom]);

  /* ── Field helpers ── */
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (saveSuccess) setSaveSuccess(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setSaveError('Sirf JPG, PNG ya WEBP images allowed hain.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Image 5MB se choti honi chahiye.');
      return;
    }

    setSaveError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  /* ── Save ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!form.name.trim() || !form.city.trim()) {
      setSaveError('Showroom ka naam aur city zaroori hain.');
      return;
    }

    const token = getCleanToken();
    if (!token) {
      setSaveError('Session khatam ho gaya hai. Dobara login karein.');
      return;
    }

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('phone', form.phone);
    fd.append('whatsapp', form.whatsapp);
    fd.append('email', form.email);
    fd.append('city', form.city);
    fd.append('address', form.address);
    fd.append('description', form.description);
    // ⚠️ must be "businessType" — this is what showroom.controller.js reads
    fd.append('businessType', form.businessType);
    if (logoFile) fd.append('showroomImage', logoFile);

    setSaving(true);
    try {
      const res = await fetch(`${API}/showrooms/update`, {
        method: 'PUT',
        headers: {
          // ⚠️ Do NOT set Content-Type here — the browser sets the correct
          // multipart/form-data boundary automatically for FormData.
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Save fail ho gaya (status ${res.status})`);
      }

      setSaveSuccess(true);
      if (json?.data?.showroomImage) setLogoPreview(json.data.showroomImage);
      setLogoFile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSaveError(err.message || 'Network error — backend check karein.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivationRequest = async (e) => {
    e.preventDefault();
    if (!deactivationReason) return;
    const token = getCleanToken();
    if (!token) {
      setDeactivationMessage(t('auth.sessionExpired'));
      return;
    }
    setDeactivationSubmitting(true);
    setDeactivationMessage('');
    try {
      const res = await fetch(`${API}/showrooms/deactivation-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: deactivationReason }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t('showroom.deactivationFailed'));
      }
      setDeactivationMessage(t('showroom.deactivationSubmitted'));
      setDeactivationReason('');
    } catch (err) {
      setDeactivationMessage(err.message || t('showroom.deactivationFailed'));
    } finally {
      setDeactivationSubmitting(false);
    }
  };

  /* ── Loading state ── */
  if (!_hasHydrated || loading || noStoreFound) {
    return (
      <div className="min-h-screen bg-dash-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-amber-400/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
          </div>
          <p className="text-amber-400/80 text-sm font-medium tracking-widest uppercase">
            {noStoreFound ? 'Showroom Registration Form khul raha hai…' : 'Profile Load Ho Raha Hai…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dash-page pb-28">
      {/* Ambient glows — matches dashboard/showroom exactly */}
      <div
        className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'rgba(232,184,75,0.08)' }}
      />
      <div
        className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl animate-pulse"
        style={{ background: 'rgba(232,184,75,0.06)' }}
      />

      {/* Header */}
      <div className="bg-dash-page border-b border-theme sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard/showroom"
            className="flex items-center justify-center w-9 h-9 rounded-xl glass-card text-theme-muted hover:text-amber-400 transition-all shrink-0 glow-hover"
            style={{ borderColor: 'var(--border-dash-card)' }}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-theme-primary tracking-tight">
              {t('showroom.edit')}
            </h1>
            <p className="text-[11px] sm:text-xs text-theme-muted font-medium">
              {t('dashboard.ui.showroomSetupHint')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto px-5 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── Load error ── */}
        {loadError && (
          <div
            className="rounded-2xl p-4 flex items-start gap-3 glass-card"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-semibold">{t('profile.loadFailed')}</p>
              <p className="text-red-400/80 text-xs mt-0.5">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={fetchShowroom}
              className="text-red-400 hover:text-red-300 text-xs font-bold underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Save success ── */}
        {saveSuccess && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3 glass-card"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-emerald-500 text-sm font-semibold">{t('settings.saved')} ✅</p>
          </div>
        )}

        {/* ── Save error ── */}
        {saveError && (
          <div
            className="rounded-2xl p-4 flex items-start gap-3 glass-card"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-semibold">{t('common.saveFailed')}</p>
              <p className="text-red-400/80 text-xs mt-0.5">{saveError}</p>
            </div>
          </div>
        )}

        {/* ── Logo ── */}
        <Section title={t('showroom.logo')} subtitle={t('dashboard.ui.logoQualityHint')}>
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-dash-card)' }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt={t('dashboard.ui.logoAlt')} className="w-full h-full object-cover" />
              ) : (
                <ImageOff className="w-8 h-8 text-theme-muted" />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card text-amber-500 hover:text-amber-400 text-sm font-semibold transition-all glow-hover"
                style={{ borderColor: 'var(--border-dash-card)' }}
              >
                <Upload size={15} /> {t('dashboard.ui.newLogo')}
              </button>
              <p className="text-theme-muted text-xs mt-2">{t('common.imageRequirements')}</p>
            </div>
          </div>
        </Section>

        {/* ── Business Type ── */}
        <Section title={t('dashboard.ui.offeringType')} subtitle={t('dashboard.ui.exchangeHint')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BUSINESS_TYPES.map(({ value, label, desc, icon: TypeIcon }) => {
              const active = form.businessType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setField('businessType', value)}
                  className="text-left p-4 rounded-2xl transition-all glow-hover"
                  style={
                    active
                      ? { background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)', boxShadow: '0 4px 16px rgba(232,184,75,0.15)' }
                      : { background: 'var(--bg-dash-card)', border: '1px solid var(--border-dash-card)' }
                  }
                >
                  <TypeIcon size={20} className={active ? 'text-amber-400' : 'text-theme-muted'} />
                  <p className={`text-sm font-bold mt-2 ${active ? 'text-theme-primary' : 'text-theme-secondary'}`}>{label}</p>
                  <p className="text-xs text-theme-muted mt-0.5">{desc}</p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Basic Info ── */}
        <Section title={t('listing.basicInfo')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={t('dashboard.ui.showroomName')}
              icon={Building2}
              required
              value={form.name}
              onChange={(v) => setField('name', v)}
              placeholder={t('dashboard.ui.showroomName')}
            />
            <Field
              label={t('common.city')}
              icon={MapPin}
              required
              value={form.city}
              onChange={(v) => setField('city', v)}
              placeholder={t('ai.selectCity')}
            />
          </div>
          <Field
            label={t('common.address')}
            icon={MapPin}
            value={form.address}
            onChange={(v) => setField('address', v)}
            placeholder={t('dashboard.ui.addressPlaceholder')}
            className="mt-4"
          />
        </Section>

        <section
          className="rounded-2xl p-5 sm:p-6"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h2 className="text-sm font-black text-theme-primary">{t('showroom.deactivateTitle')}</h2>
              <p className="text-xs text-theme-muted mt-1">{t('showroom.deactivateHint')}</p>
              <button
                type="button"
                onClick={() => setDeactivationOpen(true)}
                className="mt-4 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 transition-opacity hover:opacity-75"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                {t('showroom.deactivateButton')}
              </button>
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <Section title={t('tradeIn.contactInfo')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={t('common.phone')}
              icon={Phone}
              value={form.phone}
              onChange={(v) => setField('phone', v)}
              placeholder={t('payment.phonePlaceholder')}
              type="tel"
            />
            <Field
              label={t('profile.whatsapp')}
              icon={MessageCircle}
              value={form.whatsapp}
              onChange={(v) => setField('whatsapp', v)}
              placeholder={t('payment.phonePlaceholder')}
              type="tel"
            />
          </div>
          <Field
            label={t('common.email')}
            icon={Mail}
            value={form.email}
            onChange={(v) => setField('email', v)}
            placeholder={t('common.email')}
            type="email"
            className="mt-4"
          />
        </Section>

        {/* ── Description ── */}
        <Section title={t('dashboard.ui.aboutShowroom')} subtitle={t('dashboard.ui.showroomAboutHint')}>
          <div className="relative">
            <FileText size={16} className="absolute left-3.5 top-3.5 text-theme-muted" />
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder={t('dashboard.ui.aboutPlaceholder')}
              rows={4}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all resize-none"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-dash-card)' }}
            />
          </div>
        </Section>

      </form>

      {deactivationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl p-5 sm:p-6 bg-dash-page border border-theme shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-theme-primary">{t('showroom.deactivateTitle')}</h2>
                <p className="text-xs text-theme-muted mt-1">{t('showroom.deactivateQuestion')}</p>
              </div>
              <button type="button" onClick={() => setDeactivationOpen(false)} className="text-theme-muted hover:text-theme-primary">
                <AlertCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleDeactivationRequest} className="mt-5 space-y-3">
              {['notUsing', 'cost', 'moving', 'other'].map((key) => (
                <label key={key} className="flex items-center gap-3 rounded-xl p-3 border border-theme text-sm text-theme-secondary cursor-pointer">
                  <input
                    type="radio"
                    name="deactivationReason"
                    value={key}
                    checked={deactivationReason === key}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                  />
                  {t(`showroom.deactivationReason.${key}`)}
                </label>
              ))}
              {deactivationMessage && (
                <div className="rounded-xl p-3 text-xs text-theme-secondary" style={{ background: 'rgba(232,184,75,0.1)' }}>
                  <Clock size={14} className="inline mr-1" />{deactivationMessage}
                </div>
              )}
              {!deactivationMessage && deactivationReason && (
                <div className="rounded-xl p-3 text-xs text-theme-secondary" style={{ background: 'rgba(232,184,75,0.1)' }}>
                  <Clock size={14} className="inline mr-1" />{t('showroom.deactivationTiming')}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDeactivationOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold glass-card">
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!deactivationReason || deactivationSubmitting}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: '#dc2626', color: '#fff' }}
                >
                  {deactivationSubmitting ? t('common.processing') : t('showroom.submitDeactivation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-dash-page border-t border-theme z-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-xs text-theme-muted hidden sm:block">
            {t('dashboard.ui.saveBarHint')}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 btn-dash-new rounded-xl text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-hover"
            style={{ boxShadow: '0 4px 16px rgba(232,184,75,0.35)' }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t('common.saving')}
              </>
            ) : (
              <>
                <Save size={16} /> {t('dashboard.ui.saveChanges')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function Section({ title, subtitle, children }) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 glass-card"
      style={{ background: 'var(--bg-dash-card)', border: '1px solid var(--border-dash-card)', boxShadow: 'var(--card-shadow)' }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-black text-theme-primary uppercase tracking-widest">{title}</h2>
        {subtitle && <p className="text-xs text-theme-muted mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, icon: FieldIcon, value, onChange, placeholder, type = 'text', required, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-theme-secondary mb-1.5 block">
        {label} {required && <span className="text-amber-500">*</span>}
      </span>
      <div className="relative">
        <FieldIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all"
          style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-dash-card)' }}
        />
      </div>
    </label>
  );
}