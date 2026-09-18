//frontend/app/dashboard/register-showroom/page.jsx//
'use client';
import { useLang } from '@/lib/i18nContext';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, Store, MapPin, Phone, Mail, FileText, Car, Wrench, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getCleanToken } from '@/lib/auth';

// ✅ PHASE 7 FIX: was hitting `/api/stores/...` — that resource doesn't exist
// anywhere in the backend. The real, only, mounted routes are under
// `/api/showrooms/...` (see showroom.routes.js: POST /create,
// GET /my-showroom, PUT /update). All fetch calls below now match that.
const API = process.env.NEXT_PUBLIC_API_URL || '/api';

// ✅ PHASE 7: single place to point at the actual email/OTP verification
// page once Phase 2 builds it. Backend already blocks unverified users at
// the `requireVerified` middleware level (showroom.routes.js) — this route
// is only for a friendlier frontend redirect instead of a raw 403.
// If your real verification route has a different path, change ONLY this
// line — nothing else in this file needs to know about it.
const VERIFY_ROUTE = '/verify-account';

const BUSINESS_TYPES = [
  { value: 'CARS', labelKey: 'dashboard.ui.carsOnly', descKey: 'dashboard.ui.carsOnlyDesc', icon: Car, color: 'blue' },
  { value: 'PARTS', labelKey: 'dashboard.ui.partsOnly', descKey: 'dashboard.ui.partsOnlyDesc', icon: Wrench, color: 'amber' },
  { value: 'BOTH', labelKey: 'dashboard.ui.carsPartsBoth', descKey: 'dashboard.ui.carsPartsBothDesc', icon: Store, color: 'emerald' },
];

export default function RegisterShowroomPage() {
  const { t } = useLang();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { user, store, isAuthenticated, _hasHydrated, updateUser, setStore } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    city: '',
    address: '', // ✅ PHASE 2 FIX: backend + Store schema already accept/save
    // `address`, but this form never collected it — was always saved empty.
    phone: '',
    email: '',
    whatsapp: '',
    description: '',
    businessHours: '', // ✅ PHASE 7: new professional field
    businessType: 'BOTH',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [checking, setChecking] = useState(true);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [existingSlug, setExistingSlug] = useState('');
  const [checkFailed, setCheckFailed] = useState(false); // ✅ PHASE 10: network/exception ko UI mein surface karo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── Auth guard ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user) router.replace('/login');
  }, [_hasHydrated, isAuthenticated, user, router]);

  // ── Check if an active store profile already exists ──
  const checkShowroom = async () => {
    setCheckFailed(false);
    setChecking(true);

    // ✅ PHASE 10 FIX: fast-path — agar authStore ke persisted `store` mein
    // khud hi `isShowroom: true` maujood hai (backend ab createShowroom
    // response mein ye flag deta hai — dekho showroom.controller.js), to
    // fauran "already registered" maan lo, kisi extra API round-trip ka
    // intezar kiye baghair. Ye is bug ki direct safety-net hai jahan
    // pehle live fetch fail/silent-skip hone par registered dealer ko bhi
    // khaali form dikh jata tha.
    if (store?.isShowroom) {
      setAlreadyRegistered(true);
      setExistingSlug(store.slug || '');
      setChecking(false);
      return;
    }

    const token = getCleanToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      // ✅ cache: 'no-store' zaroori hai — bina iske browser fetch response
      // ko URL par cache kar sakta hai (Authorization header par nahi),
      // jo galat user ka data dikha sakta hai.
      const res = await fetch(`${API}/showrooms/my-showroom`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.data) {
        setAlreadyRegistered(true);
        setExistingSlug(json.data.slug || '');
        // ✅ authStore ko bhi live data se sync kar dein taake agla visit
        // fast-path se hi guzre.
        setStore({ ...json.data, isShowroom: true });
      } else if (!res.ok) {
        // ✅ PHASE 10 FIX: pehle ye case silently ignore ho kar seedha
        // form dikha deta tha — chahe wajah 401/403/500 ho. Ab isay
        // explicitly log + surface karte hain taake asal wajah (stale
        // token, backend down, etc.) foran pata chal jaye is se pehle ke
        // koi dealer duplicate-registration try kare.
        console.error('❌ /showrooms/my-showroom check failed:', res.status, json);
        setCheckFailed(true);
      }
    } catch (err) {
      console.error('❌ /showrooms/my-showroom exception:', err);
      setCheckFailed(true);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !user) return;
    checkShowroom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, isAuthenticated, user]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const autoSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, name, slug: autoSlug });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('common.imageRequirements'));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = getCleanToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('slug', formData.slug);
      payload.append('city', formData.city);
      payload.append('address', formData.address); // ✅ PHASE 2 FIX
      payload.append('phone', formData.phone);
      payload.append('email', formData.email);
      payload.append('whatsapp', formData.whatsapp);
      payload.append('description', formData.description);
      payload.append('businessHours', formData.businessHours); // ✅ PHASE 7
      payload.append('businessType', formData.businessType);

      if (imageFile) {
        payload.append('showroomImage', imageFile);
      }

      // ✅ FIXED: correct endpoint — matches showroom.routes.js
      const response = await fetch(`${API}/showrooms/create`, {
        method: 'POST',
        headers: {
          // ⚠️ Do NOT set Content-Type — browser sets the multipart
          // boundary automatically for FormData.
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        // ✅ PHASE 3 FIX: backend upgrades role → DEALER and creates the
        // Store record, but authStore (user.role / user.hasStore / store)
        // was never synced here. dashboard/layout.jsx guards routes using
        // authStore's *stale* role — so a former BUYER/SELLER landed back
        // on '/dashboard/showroom' with role still 'BUYER', got bounced
        // straight to '/dashboard/buyer' by the guard. Updating the store
        // BEFORE navigating fixes the wrong redirect.
        // ✅ BUGFIX: hardcoded { role: 'DEALER', hasStore: true } ki jagah
        // ab backend ka `result.user` merge karte hain — createShowroom()
        // seller-capability (`hasSellerProfile`) ko kabhi touch nahi karta,
        // is liye ye merge us flag ko accidentally overwrite/wipe nahi
        // karega (jo dual-profile users ke liye zaroori hai).
        updateUser(result.user || { role: 'DEALER', hasStore: true });
        // ✅ PHASE 10: backend ab `isShowroom: true` bhi deta hai
        // (result.data.isShowroom) — isay bhi persist karte hain taake
        // agla visit is page ke fast-path se turant guzre.
        setStore(result.data);
        router.push('/dashboard/showroom');
      } else if (result?.code === 'EMAIL_NOT_VERIFIED') {
        // ✅ PHASE 5 — defensive net: agar client-side `user.isVerified`
        // kisi wajah se stale ho (upar wala proactive gate isi cheez ko
        // pehle hi rok deta hai normally), backend ka 403 bhi isi friendly
        // route par bhej dega, raw error text ki jagah.
        router.push(VERIFY_ROUTE);
      } else {
        setError(result?.message || t('common.required'));
      }
    } catch {
      setError(t('dashboard.ui.serverConnection'));
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading state (auth hydration + existing-store check) ── */
  if (!_hasHydrated || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  /* ── ✅ PHASE 10: check hi fail ho gaya (network/backend issue) ──
      Pehle ye case silently form dikha deta tha — ab explicit error
      screen dikhate hain taake registered dealer galti se duplicate
      registration try na kare, aur asal wajah console mein bhi dikh jaye. */
  if (checkFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-page)' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl p-10 rounded-3xl border shadow-2xl text-center"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <h1 className="text-xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.ui.showroomStatusError')}
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Backend/network se connect nahi ho paya. Agar aapka showroom pehle se registered hai,
            dubara register karne ki koshish na karein — pehle check retry karein.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={checkShowroom}
              className="w-full py-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> {t('dashboard.ui.retryCheck')}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 font-bold rounded-xl border transition-all text-sm"
              style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
            >
              {t('dashboard.ui.dashboardBack')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Already registered ── */
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-page)' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl p-10 rounded-3xl border shadow-2xl text-center"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.ui.alreadyRegistered')}
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Aap ka showroom pehle se registered hai. Aap dashboard par ja kar listings manage kar sakte hain.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/stores/${existingSlug}`)}
              className="w-full py-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all text-sm"
            >
              {t('dashboard.ui.viewMyStore')} 🏪
            </button>
            <button
              onClick={() => router.push('/dashboard/showroom')}
              className="w-full py-4 font-bold rounded-xl border transition-all text-sm"
              style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
            >
              {t('dashboard.ui.goDashboard')} 📊
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ✅ FIX (per client request): verification-gate poori tarah hata di gayi.
  // Ab sirf login zaroori hai (upar wala auth-guard useEffect already
  // '/login' pe bhej deta hai agar user login nahi hai) — email/phone
  // verify kiye baghair bhi login hote hi seedha business-info form khulega.
  // Backend ka `requireVerified` middleware bhi showroom.routes.js se hata
  // diya gaya hai taake create/update dono is naye behavior se match karein.

  /* ── Business info form ── */
  return (
    <div className="min-h-screen flex items-center justify-center p-6 py-12" style={{ background: 'var(--bg-page)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-8 rounded-3xl border shadow-2xl"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-3 shadow-lg">
            <Store className="text-white" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.ui.registerYourShowroom')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.ui.showroomSetupHint')}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Showroom Photo Input */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.ui.identityPhoto')}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all hover:border-blue-400"
              style={{ borderColor: imagePreview ? 'var(--accent)' : 'var(--border-color)', minHeight: '140px' }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Showroom preview" className="w-full h-40 object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Camera size={32} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.bannerUpload')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('common.imageRequirements')}</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Business Inventory Category Matrix */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.ui.offeringType')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BUSINESS_TYPES.map((bt) => {
                const Icon = bt.icon;
                const isSelected = formData.businessType === bt.value;
                const colorMap = {
                  blue: isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-transparent',
                  amber: isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-transparent',
                  emerald: isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent',
                };
                return (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessType: bt.value })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${colorMap[bt.color]}`}
                    style={{
                      background: isSelected ? undefined : 'var(--bg-surface-alt)',
                      borderColor: isSelected ? undefined : 'var(--border-color)',
                    }}
                  >
                    <Icon size={22} className="mb-2" />
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t(bt.labelKey)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t(bt.descKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Store size={12} className="inline mr-1" />{t('dashboard.ui.showroomName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                className="w-full p-3 rounded-xl border outline-none text-sm"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                onChange={handleNameChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={12} className="inline mr-1" />{t('dashboard.ui.storeContactEmail')} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                className="w-full p-3 rounded-xl border outline-none text-sm"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={12} className="inline mr-1" />{t('dashboard.ui.operatingCity')} *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                className="w-full p-3 rounded-xl border outline-none text-sm"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Phone size={12} className="inline mr-1" />{t('dashboard.ui.phoneMobile')} *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                className="w-full p-3 rounded-xl border outline-none text-sm"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* ✅ PHASE 2 FIX: Address field — schema/controller already
              supported it, this input was simply missing from the form. */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={12} className="inline mr-1" />{t('dashboard.ui.fullAddress')}
            </label>
            <input
              type="text"
              placeholder={t('dashboard.ui.addressPlaceholder')}
              value={formData.address}
              className="w-full p-3 rounded-xl border outline-none text-sm"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.ui.whatsappNumber')}
            </label>
            <input
              type="text"
              value={formData.whatsapp || ''}
              className="w-full p-3 rounded-xl border outline-none text-sm"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            />
          </div>

          {/* ✅ PHASE 7: Business Hours (new professional field) */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Clock size={12} className="inline mr-1" />{t('dashboard.ui.businessHours')}
            </label>
            <input
              type="text"
              placeholder={t('dashboard.ui.businessHoursExample')}
              value={formData.businessHours}
              className="w-full p-3 rounded-xl border outline-none text-sm"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
            />
          </div>

          {formData.slug && (
            <div className="p-3 rounded-xl border text-sm" style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('dashboard.liveUrl')}: </span>
              <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>/stores/{formData.slug}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <FileText size={12} className="inline mr-1" />{t('dashboard.ui.businessDescription')}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              className="w-full p-3 rounded-xl border outline-none text-sm resize-none"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 font-bold text-white rounded-xl text-sm transition-all"
            style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }}
          >
            {loading ? t('dashboard.ui.processing') : `${t('dashboard.ui.registerButton')} 🚀`}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}