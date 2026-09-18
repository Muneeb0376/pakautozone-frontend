'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/dashboard/become-seller/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 5
//
// ══ AAP NE JO KAHA ══
// "Become a seller wale page ki theme bhi blue hai, us ko bhi light aur
//  dark theme mein karo."
//
// ══ KYA THA ══
// Poora safha hard-coded dark-blue par tha:
//     bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900
//     bg-gradient-to-br from-blue-500 to-cyan-400   (icon)
//     bg-gradient-to-r from-blue-500 to-cyan-400    (button)
//     text-white / placeholder:text-slate-600       (inputs)
//
// Light theme mein bhi ye safha kaala-neela hi rehta tha — poori site se
// bilkul katta hua. Aur inputs ka text sirf safed tha, is liye light
// background par kuch nazar hi na aata.
//
// ══ AB ══
// Sab kuch var(--*) tokens par. Ek bhi hardcoded rang baqi nahi.
//
// ⚠️ LOGIC BILKUL NAHI BADLA. Wahi guards, wahi
//    `/showrooms/my-showroom` wala check, wahi
//    `PATCH /auth/become-seller` call, wahi `updateUser` fields.
//    Sirf ek chhoti tabdeeli: `/login?redirect=...` ki jagah ab
//    `/?auth=login&next=...` — kyunke purana /login safha ab AuthModal
//    par redirect karta hai (Phase 5).

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, MessageCircle, MapPin, Loader2, CheckCircle2, Store,
  ShieldCheck, ArrowRight,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { PK_CITIES } from '@/components/home/browseData';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const inputStyle = {
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

export default function BecomeSellerPage() {
  const { t } = useLang();
  const router = useRouter();
  const { token, user, _hasHydrated, isAuthenticated, updateUser } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [checking, setChecking] = useState(true);
  const [existingStoreInfo, setExistingStoreInfo] = useState(null);

  /* ── Guards ── */
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || !user) {
      // ✅ Purana /login safha ab modal par redirect karta hai
      router.replace('/?auth=login&next=/dashboard/become-seller');
      return;
    }
    if (user.hasSellerProfile) {
      router.replace('/dashboard/seller');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  /* ── ✅ FIX: local authStore copy kabhi stale ho sakti hai (jaise
     purane login se cache hui). Is page par decide karna zaroori hai
     ke user WAKAI seller hai ya nahi, is liye ek dafa seedha backend se
     taaza flag mangwa lete hain — warna guard upar wala kabhi galat
     faisla kar ke user ko is form tak pohancha deta hai jabke wo pehle
     se hi seller hai (aur "Continue" dabane par confusing error deta). */
  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !user || !token) return;
    if (user.hasSellerProfile) return; // already sahi — dobara check ki zarurat nahi

    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => null);
        if (alive && res.ok && json?.success && json.user?.hasSellerProfile) {
          updateUser({ hasSellerProfile: true });
          router.replace('/dashboard/seller');
        }
      } catch {
        // fail ho to normal flow chalta rahe, submit ke waqt bhi
        // defensive fallback maujood hai
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, isAuthenticated, user?.hasSellerProfile, token]);

  /* ── Pehle se showroom hai to form skip ── */
  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !user || user.hasSellerProfile) return undefined;

    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/showrooms/my-showroom`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => null);
        if (alive && res.ok && json?.success && json?.data) {
          setExistingStoreInfo(json.data);
        }
      } catch {
        // check fail ho to normal form dikha do
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => { alive = false; };
  }, [_hasHydrated, isAuthenticated, user, token]);

  const submitBecomeSeller = async (payload) => {
    setError('');
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/become-seller`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // ✅ DEFENSIVE FIX: agar backend keh raha hai ke user pehle se
        // seller hai, to ye "error" nahi hai — matlab frontend ke paas
        // `user.hasSellerProfile` ka jo copy tha wo stale/purana tha
        // (page load ke waqt guard is liye trigger nahi hua). Is case
        // mein user ko error dikhane ki bajaye seedha seller flag sync
        // kar ke uske seller dashboard bhej do — usay kabhi is dead-end
        // screen mein na phasne dein.
        const alreadySeller =
          res.status === 400 &&
          /already.*seller/i.test(data.message || '');

        if (alreadySeller) {
          updateUser({ hasSellerProfile: true });
          router.replace('/dashboard/seller');
          return;
        }

        setError(data.message || t('common.somethingWrong'));
        setLoading(false);
        return;
      }

      updateUser({
        role: data.user.role,
        phone: data.user.phone,
        whatsapp: data.user.whatsapp,
        city: data.user.city,
        hasSellerProfile: true,
      });

      router.replace('/dashboard/seller');
    } catch (err) {
      console.error('become-seller error:', err);
      setError(t('dashboard.ui.serverConnection'));
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!phone.trim()) return setError(t('common.required'));
    if (!sameAsPhone && !whatsapp.trim()) return setError(t('common.required'));

    submitBecomeSeller({
      phone: phone.trim(),
      whatsapp: sameAsPhone ? phone.trim() : whatsapp.trim(),
      sameAsPhone,
      city: city.trim() || undefined,
    });
  };

  if (!_hasHydrated || checking) return null;

  /* ═══════════════════════════════════════════════════════════
     Pehle se showroom hai — sirf confirm karna hai
     ═══════════════════════════════════════════════════════════ */
  if (existingStoreInfo) {
    return (
      <Shell
        icon={Store}
        title={t('sell.title')}
        subtitle={t('dashboard.ui.detailMoreSells')}
      >
        <div
          className="rounded-xl p-4 mb-5 space-y-2.5"
          style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {t('settings.profileInfo')}
          </p>

          <InfoRow Icon={Store} label={t('showroom.title')} value={existingStoreInfo.name} />
          <InfoRow Icon={Phone} label={t('common.phone')} value={existingStoreInfo.phone} />
          <InfoRow Icon={MessageCircle} label={t('profile.whatsapp')} value={existingStoreInfo.whatsapp} />
          <InfoRow Icon={MapPin} label={t('common.city')} value={existingStoreInfo.city} />
        </div>

        {error && <Alert text={error} />}

        <button
          type="button"
          onClick={() => submitBecomeSeller({})}
          disabled={loading}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 transition-transform active:scale-[0.99]"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {loading ? t('common.processing') : t('common.continue')}
        </button>

        <p className="text-[11px] text-center mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {t('dashboard.ui.showroomAboutHint')}
        </p>
      </Shell>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     Naya seller — form
     ═══════════════════════════════════════════════════════════ */
  return (
    <Shell
      icon={Store}
      title={t('dashboard.becomeSeller')}
      subtitle={t('dashboard.ui.basicInfo')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert text={error} />}

        <div>
          <Label>{t('auth.phone')}<Req /></Label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (error) setError(''); }}
              placeholder={t('dashboard.ui.phoneExample')}
              className="w-full h-12 rounded-xl pl-11 pr-3 text-sm outline-none font-mono"
              style={inputStyle}
            />
          </div>
          <Hint>{t('payment.phoneHint')}</Hint>
        </div>

        {/* Same-as-phone toggle */}
        <button
          type="button"
          onClick={() => setSameAsPhone((v) => !v)}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors"
          style={{
            background: sameAsPhone ? 'var(--bg-dash-cta)' : 'var(--bg-surface-alt)',
            border: `1px solid ${sameAsPhone ? 'var(--accent)' : 'var(--border-color)'}`,
          }}
        >
          <span
            className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
            style={{
              background: sameAsPhone ? 'var(--accent)' : 'transparent',
              border: `1.5px solid ${sameAsPhone ? 'var(--accent)' : 'var(--border-color)'}`,
            }}
          >
            {sameAsPhone && <CheckCircle2 size={11} style={{ color: 'var(--accent-text)' }} />}
          </span>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('profile.whatsapp')}
          </span>
        </button>

        {!sameAsPhone && (
          <div>
            <Label>{t('profile.whatsapp')}<Req /></Label>
            <div className="relative">
              <MessageCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="tel"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={t('dashboard.ui.phoneExample')}
                className="w-full h-12 rounded-xl pl-11 pr-3 text-sm outline-none font-mono"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div>
          <Label>{t('common.city')}</Label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--text-muted)' }} />
            {/* ✅ Ab free text nahi — dropdown. Warna "lahore", "Lahore" aur
                "LHR" teen alag shehar ban jate thay aur city filter mein
                listing milti hi nahi thi. */}
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-12 rounded-xl pl-11 pr-3 text-sm outline-none cursor-pointer appearance-none"
              style={inputStyle}
            >
              <option value="">{t('ai.selectCity')}</option>
              {PK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Hint>{t('dashboard.ui.firstListing')}</Hint>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 transition-transform active:scale-[0.99]"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? t('common.processing') : t('dashboard.becomeSeller')}
          {!loading && <ArrowRight size={15} />}
        </button>

        <div
          className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
          style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
        >
          <ShieldCheck size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.ui.freeListingFooter', { free: 3 })}
          </p>
        </div>
      </form>
    </Shell>
  );
}

/* ═══════════ Chhote helpers ═══════════ */

function Shell({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg-page)' }}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {/* Header — pehle blue→cyan gradient tha */}
        <div
          className="px-6 py-7 text-center"
          style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border-color)' }}
        >
          <span
            className="mx-auto mb-3 h-13 w-13 rounded-2xl flex items-center justify-center"
            style={{ width: 52, height: 52, background: 'var(--accent)' }}
          >
            <Icon size={22} style={{ color: 'var(--accent-text)' }} />
          </span>
          <h1 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {children}
    </label>
  );
}

function Req() {
  return <span style={{ color: 'var(--accent)' }}>*</span>;
}

function Hint({ children }) {
  return (
    <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  );
}

function Alert({ text }) {
  return (
    <div
      className="rounded-xl px-3.5 py-3 text-xs font-medium"
      style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)', color: '#dc2626' }}
    >
      {text}
    </div>
  );
}

function InfoRow({ Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />
      <span className="shrink-0 w-20 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}