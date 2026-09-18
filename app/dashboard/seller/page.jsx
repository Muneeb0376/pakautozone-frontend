'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/dashboard/seller/page.jsx
//
// ✅ POORI FILE REPLACE — Issue 2
//
// ══ KYA KYA THEEK HUA ══
//
// 1. "sirf PKR 30 fee" WALA JHOOTA MESSAGE HATA DIYA
//    Aap ne free listings rakhi hain, phir bhi banner har waqt PKR 30
//    maang raha tha. Ab wahan asli quota dikhta hai:
//        "3 mein se 2 free listings baqi hain"
//    aur quota khatam hone par:
//        "Free listings poori — showroom banayein ya PKR 15 dein"
//
// 2. FREE LIMIT KI ASAL PAABANDI
//    "New Listing" dabate hi pehle quota check hota hai. Quota khatam
//    ho to form khulta hi nahi — ListingQuotaModal khulta hai jismein
//    do rastay hain (showroom / PKR 15).
//    ⚠️ Ye sirf aadha bandobast hai. Asal paabandi backend par lagi
//    hai (car.controller.js) — kyunke frontend ka check koi bhi
//    Postman se bypass kar sakta tha.
//
// 3. BOOST AB NAZAR AATA HAI
//    Har card par ab teen mein se ek haalat dikhti hai:
//        • FEATURED — X din baqi   (boost chal raha hai)
//        • Boost karein             (boost lagaya ja sakta hai)
//        • Pay Now                  (listing abhi PENDING hai)
//    Boost ka asal bug backend mein tha — admin.controller.js car ko
//    'BOOSTED' status dene ki koshish karta tha jo enum mein hai hi
//    nahi, is liye har boost approve karte waqt crash ho jata tha.
//    Wo file bhi is phase mein di gayi hai.
//
// 4. CARTOON HATAYA
//    • "Assalam o Alaikum, Muneeb 👋" ka emoji nikal diya
//    • StatCard ke paanch alag alag neon gradients (emerald/orange/
//      yellow/amber) hata kar sab ek gold family mein
//    • 3D tilt effect (mousemove par card ghoomta tha) hata diya —
//      wo sab se zyada "cartoonish" cheez thi
//    • pulsing dot aur animate-pulse buttons hata diye
//
// 5. NAAM AB THEEK SHAKAL MEIN
//    Har jagah lib/textCase.js se guzarta hai — "corolla" ab
//    "Corolla" dikhta hai aur "mg hs" ab "MG HS".

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car, Plus, CreditCard, TrendingUp, Pencil, Trash2,
  Eye, MessageSquare, Repeat, UserCog, X, Loader2, Rocket, Store, Clock,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import ListingQuotaModal from '@/components/dashboard/ListingQuotaModal';
import { carTitle, toTitleCase, personName } from '@/lib/textCase';
import { formatPrice } from '@/lib/formatPrice';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE_URL = API.replace('/api', '');

export default function SellerDashboard() {
  const { t } = useLang();
  const router = useRouter();
  const { token, user, _hasHydrated, isAuthenticated, updateUser } = useAuthStore();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalViews: 0, totalInquiries: 0 });
  const [tradeIns, setTradeIns] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // ✅ NEW — quota state
  const [quota, setQuota] = useState(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [pricing, setPricing] = useState({ showroomPrice: 100 });

  /* ── Guards ── */
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (user.role?.toUpperCase() === 'BUYER') {
      router.replace('/dashboard/buyer');
      return;
    }

    const hasSellerProfile = !!user.hasSellerProfile;
    const isDealer = !!(user.hasStore || user.store?.isShowroom || user.role?.toUpperCase() === 'DEALER');

    if (!hasSellerProfile && isDealer) {
      router.replace('/dashboard/showroom');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  /* ── Data ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/cars/my-listings`, { headers })
      .then(async (r) => {
        if (r.ok) return r.json();
        const r2 = await fetch(`${API}/dealer/my-listings`, { headers });
        return r2.ok ? r2.json() : null;
      })
      .then((data) => {
        if (cancelled) return;
        if (!data) { setListings([]); return; }
        const arr = Array.isArray(data) ? data
          : Array.isArray(data.data) ? data.data
          : Array.isArray(data.listings) ? data.listings
          : [];
        setListings(arr);
      })
      .catch(() => { if (!cancelled) setListings([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    fetch(`${API}/auth/seller/stats`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.success) setStats(d.data); })
      .catch(() => {});

    fetch(`${API}/chat/trade-ins/available`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.success) setTradeIns(d.data || []); })
      .catch(() => {});

    // ✅ NEW — quota
    fetch(`${API}/payments/listing-quota`, { headers, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.success) setQuota(d.data); })
      .catch(() => {});

    // ✅ NEW — qeematein server se, hardcode nahi
    fetch(`${API}/payments/pricing`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.success) setPricing(d.data); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [_hasHydrated, token]);

  /* ── New listing — quota check pehle ── */
  const handleNewListing = useCallback(() => {
    // Showroom active hai to koi limit nahi
    if (quota?.showroomActive) {
      router.push('/dashboard/new-listing');
      return;
    }
    if (quota?.quotaExceeded) {
      setShowQuotaModal(true);
      return;
    }
    router.push('/dashboard/new-listing');
  }, [quota, router]);

  const handleTradeInAction = async (id, status) => {
    try {
      const res = await fetch(`${API}/trade-ins/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTradeIns((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      }
    } catch (err) {
      console.error('Trade-in action failed:', err);
    }
  };

  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dash-page">
        <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!user) return null;

  const total = listings.length;
  const liveNow = listings.filter((c) => c.status === 'ACTIVE').length;
  const featuredNow = listings.filter((c) => c.isFeatured).length;

  return (
    <div className="min-h-screen bg-dash-page">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* ══ Header ══ */}
        <div
          className="mb-6 sm:mb-10 pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="min-w-0">
            {/* ✅ Emoji nikal diya */}
            <h1
              className="text-xl sm:text-3xl font-black tracking-tight leading-snug break-words"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('dashboard.ui.assalam', { name: personName(user.name) })}
            </h1>
            <p
              className="text-[10px] sm:text-xs mt-1 font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('dashboard.ui.privateSeller')}
            </p>
          </div>

          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center justify-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0 self-start sm:self-auto"
            style={{
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              background: 'var(--card-bg)',
            }}
          >
            <UserCog size={14} />{t('profile.edit')}</button>
        </div>

        {/* ══ Stat Cards ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard icon={Car} label={t('dashboard.ui.totalListings')} value={total} />
          <StatCard icon={Rocket} label={t('dashboard.ui.liveMarketplace')} value={liveNow} />
          <StatCard icon={Eye} label={t('dashboard.totalViews')} value={stats.totalViews} />
          <StatCard icon={MessageSquare} label={t('dashboard.ui.inquiries')} value={stats.totalInquiries} />
        </div>

        {/* ══ CTA — ab asli quota dikhata hai ══ */}
        <QuotaBanner
          quota={quota}
          featuredNow={featuredNow}
          onNewListing={handleNewListing}
        />

        {/* ══ Exchange requests ══ */}
        {tradeIns.length > 0 && (
          <div className="mb-6 sm:mb-10">
            <SectionHeading icon={Repeat}>{t('dashboard.ui.exchangeRequests', { count: tradeIns.length })}</SectionHeading>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {tradeIns.map((tradeIn) => (
                <div
                  key={tradeIn.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--bg-dash-card)',
                    border: '1px solid var(--border-dash-card)',
                  }}
                >
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {toTitleCase(tradeIn.carBrand)} {toTitleCase(tradeIn.carModel)} ({tradeIn.carYear})
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('dashboard.ui.offerFor', { title: toTitleCase(tradeIn.dealCar?.title), name: personName(tradeIn.user?.name) })}
                  </p>

                  {tradeIn.status === 'SUBMITTED' ? (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleTradeInAction(tradeIn.id, 'ACCEPTED')}
                        className="flex-1 text-[11px] font-bold px-2.5 py-2 rounded-lg transition-colors"
                        style={{ color: '#059669', background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.25)' }}
                      >
                        {t('dashboard.ui.accept')}
                      </button>
                      <button
                        onClick={() => handleTradeInAction(tradeIn.id, 'REJECTED')}
                        className="flex-1 text-[11px] font-bold px-2.5 py-2 rounded-lg transition-colors"
                        style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)' }}
                      >{t('admin.reject')}</button>
                    </div>
                  ) : (
                    <span
                      className="inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
                    >
                      {tradeIn.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ Listings ══ */}
        <SectionHeading icon={Car}>{t('dashboard.ui.myCarListings', { count: total })}</SectionHeading>

        {listings.length === 0 ? (
          <div
            className="rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center"
            style={{
              background: 'var(--bg-dash-card)',
              border: '1px solid var(--border-dash-card)',
            }}
          >
            <span
              className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(232,184,75,0.14)' }}
            >
              <Car size={24} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
            </span>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.ui.noListings')}
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              {t('dashboard.ui.firstListingsFree', { count: quota?.free ?? 3 })}
            </p>
            <button
              onClick={handleNewListing}
              className="font-bold text-xs px-5 py-3 rounded-xl transition-transform active:scale-[0.98]"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {t('dashboard.ui.firstListing')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {listings.map((car) => (
              <SellerCarCard
                key={car.id}
                car={car}
                token={token}
                onDeleted={(id) => {
                  setListings((prev) => prev.filter((c) => c.id !== id));
                  // Ek listing hatne se ek free slot wapis milta hai
                  setQuota((q) => (q ? {
                    ...q,
                    used: Math.max(0, q.used - 1),
                    remaining: Math.min(q.free, q.remaining + 1),
                    quotaExceeded: q.showroomActive ? false : Math.max(0, q.used - 1) >= q.free,
                  } : q));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══ Modals ══ */}
      <ListingQuotaModal
        open={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        quota={quota}
        showroomPrice={pricing.showroomPrice}
      />

      {showEditProfile && (
        <EditProfileModal
          user={user}
          token={token}
          onClose={() => setShowEditProfile(false)}
          onSaved={(updated) => { updateUser(updated); setShowEditProfile(false); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section heading — pulsing dot ki jagah saada line icon
   ═══════════════════════════════════════════════════════════ */
function SectionHeading({ icon: Icon, children }) {
  return (
    <div
      className="mb-3 sm:mb-4 flex items-center gap-2 font-black text-sm tracking-tight"
      style={{ color: 'var(--text-primary)' }}
    >
      <span className="w-1 h-5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
      <Icon size={15} style={{ color: 'var(--accent)' }} />
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stat card — ek hi gold tone, koi 3D tilt nahi
   ═══════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value }) {
  return (
    <div
      className="p-4 sm:p-5 rounded-2xl transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-dash-card)',
        border: '1px solid var(--border-dash-card)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
        <span
          className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      </div>
      <span className="block text-2xl sm:text-3xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value ?? 0}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Quota banner — purane "sirf PKR 30" ki jagah
   ═══════════════════════════════════════════════════════════ */
function QuotaBanner({ quota, featuredNow, onNewListing }) {
  const { t } = useLang();
  const free = quota?.free ?? 3;
  const remaining = quota?.remaining ?? free;
  const exceeded = quota?.quotaExceeded === true;
  const unlimited = quota?.showroomActive === true;
  const extraPrice = quota?.extraPrice ?? 15;

  let title;
  let subtitle;

  if (unlimited) {
    title = t('dashboard.ui.showroomUnlimited');
    subtitle = t('dashboard.ui.noPerCarFee');
  } else if (exceeded) {
    title = t('dashboard.ui.freeListingsFull');
    subtitle = t('dashboard.ui.chooseNext', { price: extraPrice });
  } else {
    title = t('dashboard.ui.wantSell');
    subtitle = t('dashboard.ui.freeRemaining', { free, remaining });
  }

  return (
    <div
      className="mb-6 sm:mb-10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      style={{
        background: 'var(--bg-dash-cta)',
        border: `1px solid ${exceeded ? 'var(--accent)' : 'var(--border-dash-cta)'}`,
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <span
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          {unlimited
            ? <Store size={18} style={{ color: 'var(--accent-text)' }} />
            : <Car size={18} style={{ color: 'var(--accent-text)' }} />}
        </span>

        <div className="min-w-0">
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>

          {/* Quota bar — sirf tab jab limit lagti ho */}
          {!unlimited && (
            <div className="mt-2.5 flex items-center gap-2 max-w-[15rem]">
              <span
                className="h-1.5 flex-1 rounded-full overflow-hidden"
                style={{ background: 'var(--border-color)' }}
              >
                <span
                  className="block h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((free - remaining) / free) * 100)}%`,
                    background: exceeded ? '#dc2626' : 'var(--accent)',
                  }}
                />
              </span>
              <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                {free - remaining}/{free}
              </span>
            </div>
          )}

          {featuredNow > 0 && (
            <p className="text-[11px] mt-2 flex items-center gap-1.5 font-semibold" style={{ color: 'var(--accent)' }}>
              <TrendingUp size={12} />
              {t('dashboard.ui.featuredListings', { count: featuredNow })}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
        <Link
          href="/chat"
          className="flex items-center justify-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
          style={{
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            background: 'var(--card-bg)',
          }}
        >
          <MessageSquare size={13} />{t('nav.chat')}</Link>

        <button
          onClick={onNewListing}
          className="flex items-center justify-center gap-1.5 font-bold text-xs px-5 py-2.5 rounded-xl whitespace-nowrap transition-transform active:scale-[0.98]"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: '0 6px 18px -6px rgba(232,184,75,0.5)',
          }}
        >
          <Plus size={13} /> {t('dashboard.ui.newListing')}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Ek listing ka card
   ═══════════════════════════════════════════════════════════ */
function SellerCarCard({ car, token, onDeleted }) {
  const { t } = useLang();
  const [deleting, setDeleting] = useState(false);

  const rawImg = car.carImages?.[0]?.url || car.images?.[0]?.url;
  let img = null;
  if (rawImg) {
    img = /^https?:\/\//i.test(rawImg)
      ? rawImg
      : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
  }

  // ✅ Boost ki asal haalat
  const boostEnd = car.featuredListing?.isActive ? car.featuredListing.endDate : null;
  const boostDaysLeft = boostEnd
    ? Math.max(0, Math.ceil((new Date(boostEnd) - new Date()) / 86400000))
    : null;
  const isFeatured = car.isFeatured === true;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const name = carTitle(car) || toTitleCase(car.title);
    if (!window.confirm(t('dashboard.confirmDelete'))) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API}/cars/${car.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        onDeleted?.(car.id);
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.message || t('common.saveFailed'));
        setDeleting(false);
      }
    } catch (err) {
      console.error('Delete listing failed:', err);
      alert(t('dashboard.ui.serverConnection'));
      setDeleting(false);
    }
  };

  // ✅ PHASE 5 — agar is car ki payment admin ke paas review mein hai to
  // "Pay Now" dikhana ghalat hai (user dobara pay kar dega). Us waqt
  // "Review mein" dikhana chahiye.
  const inReview = car.paymentStatus === 'VERIFYING';

  return (
    <div
      className="rounded-2xl overflow-hidden flex transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-dash-card)',
        // Featured card ko patli gold line se pehchan — koi ribbon/star nahi
        border: isFeatured ? '1.5px solid var(--accent)' : '1px solid var(--border-dash-card)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Image */}
      <div
        className="w-24 sm:w-32 shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--bg-surface-alt)' }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={carTitle(car)}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Car size={22} strokeWidth={1.4} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {carTitle(car) || toTitleCase(car.title)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {toTitleCase(car.city) || 'Pakistan'} · {car.year}
          </p>
          <span className="block font-black text-sm mt-1" style={{ color: 'var(--accent)' }}>
            {formatPrice(car.price)}
          </span>
        </div>

        {/* Status + boost */}
        <div
          className="flex items-center justify-between gap-2 mt-2 pt-2"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={
              car.status === 'ACTIVE'
                ? { color: '#059669', background: 'rgba(5,150,105,0.10)' }
                : car.status === 'PENDING'
                ? { color: '#b45309', background: 'rgba(232,184,75,0.16)' }
                : { color: 'var(--text-muted)', background: 'var(--bg-surface-alt)' }
            }
          >
            {car.status}
          </span>

          {/* ✅ Chaar haalatein — review mein, pending pay, featured, ya boost karein */}
          {inReview ? (
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
              style={{ background: 'rgba(232,184,75,0.16)', color: '#a17c33' }}
            >
              <Clock size={11} />               {t('dashboard.ui.reviewingTime')}
            </span>
          ) : car.status === 'PENDING' ? (
            <Link
              href={`/payment/listing?carId=${car.id}&type=extra`}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors"
              style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)' }}
            >
              <CreditCard size={11} /> {t('dashboard.ui.payNow')}
            </Link>
          ) : isFeatured ? (
            <span
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg whitespace-nowrap"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              <TrendingUp size={11} strokeWidth={3} />
              {t('dashboard.ui.featuredDays', { days: boostDaysLeft ?? 0 })}
            </span>
          ) : (
            <Link
              href={`/payment/listing?carId=${car.id}&type=boost`}
              className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap transition-opacity hover:opacity-75"
              style={{ color: 'var(--accent)' }}
            >
              <TrendingUp size={11} /> {t('dashboard.ui.boost')}
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <Link
            href={`/dashboard/listings/${car.id}/edit`}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold px-2 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-primary)', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <Pencil size={11} />{t('common.edit')}</Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold px-2 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ color: '#dc2626', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.20)' }}
          >
            <Trash2 size={11} /> {deleting ? t('common.deleting') : t('common.remove')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Edit profile modal
   ═══════════════════════════════════════════════════════════ */
function EditProfileModal({ user, token, onClose, onSaved }) {
  const { t } = useLang();
  const [phone, setPhone] = useState(user.phone || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [city, setCity] = useState(user.city || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    background: 'var(--bg-surface-alt)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  const handleSave = async () => {
    setError('');
    if (!phone.trim() || !whatsapp.trim()) {
      setError(t('dashboard.ui.phoneWhatsappRequired'));
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.trim(), whatsapp: whatsapp.trim(), city: city.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || t('dashboard.ui.updateFailed'));
        setSaving(false);
        return;
      }
      onSaved({ phone: data.user.phone, whatsapp: data.user.whatsapp, city: data.user.city });
    } catch (err) {
      console.error('update profile error:', err);
      setError(t('dashboard.ui.serverConnection'));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t('profile.edit')}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            className="text-xs font-medium px-3 py-2 rounded-lg mb-4"
            style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.20)' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          {[
            { label: t('common.phone'), value: phone, set: setPhone, type: 'tel' },
            { label: t('profile.whatsapp'), value: whatsapp, set: setWhatsapp, type: 'tel' },
            { label: t('common.city'), value: city, set: setCity, type: 'text' },
          ].map((f) => (
            <div key={f.label}>
              <label
                className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: 'var(--text-muted)' }}
              >
                {f.label}
              </label>
              <input
                type={f.type}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-5 flex items-center justify-center gap-2 font-bold text-xs px-5 py-3 rounded-xl disabled:opacity-50 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          {saving && <Loader2 className="animate-spin" size={13} />}
          {saving ? t('common.saving') : t('dashboard.ui.saveChanges')}
        </button>
      </div>
    </div>
  );
}