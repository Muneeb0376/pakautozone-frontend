//frontend/app/dashboard/showroom/page.jsx
'use client';
import { useLang } from '@/lib/i18nContext';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getCleanToken } from '@/lib/auth';
import { getSocket, connectSocket } from '@/lib/socket';
import {
  ChevronRight, X, CheckCircle, AlertCircle, Loader2,
  BarChart2, Eye, ExternalLink, Bell, ShieldCheck,
  Car, Wrench, TrendingUp, Store, Lock, MessageSquare, Settings,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── Dashboard icons ─────────────────────────────────────────────────────────

function Icon3DCar({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 6px 8px rgba(232,184,75,0.35))' }}
    >
      <defs>
        <linearGradient id="dashboardCarBody" x1="12" y1="19" x2="80" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE7A3" />
          <stop offset="0.45" stopColor="#E8B84B" />
          <stop offset="1" stopColor="#9B6818" />
        </linearGradient>
        <linearGradient id="dashboardCarGlass" x1="35" y1="16" x2="63" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E7F7FF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#6B8795" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="dashboardCarChrome" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#F8FAFC" />
          <stop offset="0.5" stopColor="#94A3B8" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>
      <style>{`
        @keyframes dashboardCarFloat {
          0%, 100% { transform: translateY(0) rotateX(0deg); }
          50% { transform: translateY(-3px) rotateX(2deg); }
        }
        .dashboard-car-float {
          animation: dashboardCarFloat 2.4s ease-in-out infinite;
          transform-origin: 48px 48px;
        }
      `}</style>
      <g className="dashboard-car-float">
        <ellipse cx="48" cy="57" rx="34" ry="3.5" fill="#000" opacity="0.22" />
        <path
          d="M13 42.5C14 36.5 18 33 26 31.5L34 18.5C35 16.5 37 15.5 40 15.5H57C60 15.5 62 17 64 19L73 31.5C80 32.5 84 36 84 42.5V47C84 49.2 82.2 51 80 51H16C13.8 51 12 49.2 12 47V44.5C12 43.8 12.3 43 13 42.5Z"
          fill="url(#dashboardCarBody)"
          stroke="#7A5315"
          strokeWidth="1.5"
        />
        <path d="M34 30.5L39 18.5H56L63 30.5H34Z" fill="url(#dashboardCarGlass)" stroke="#64748B" strokeWidth="1" />
        <path d="M39 19L48 19V30H34L39 19Z" fill="#F8FAFC" opacity="0.22" />
        <path d="M16 39H80" stroke="#FFF1B8" strokeWidth="1.2" opacity="0.7" />
        <path d="M13 43H22M74 43H84" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
        <path d="M76 38.5H82" stroke="#FFF7D1" strokeWidth="2" strokeLinecap="round" />
        <circle cx="27" cy="49" r="8" fill="#111827" stroke="url(#dashboardCarChrome)" strokeWidth="2" />
        <circle cx="27" cy="49" r="3.5" fill="#CBD5E1" />
        <circle cx="69" cy="49" r="8" fill="#111827" stroke="url(#dashboardCarChrome)" strokeWidth="2" />
        <circle cx="69" cy="49" r="3.5" fill="#CBD5E1" />
        <path d="M18 35L29 34M67 34L78 35" stroke="#FFF8DC" strokeWidth="1.2" opacity="0.7" />
      </g>
    </svg>
  );
}

function Icon3DWrench({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 8px 16px rgba(232,184,75,0.4))' }}>
      <defs>
        <linearGradient id="wrenchGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
      <style>{`
        @keyframes wrenchSpin { 0%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} 100%{transform:rotate(-15deg)} }
        .wrench-anim { animation: wrenchSpin 2s ease-in-out infinite; transform-origin: 32px 32px; }
      `}</style>
      <g className="wrench-anim">
        <ellipse cx="32" cy="58" rx="14" ry="3" fill="rgba(0,0,0,0.12)" />
        <path d="M22 10 C14 10 10 18 14 24 L38 48 C42 52 48 52 52 48 C56 44 56 38 52 34 L28 10 C26 10 24 10 22 10Z"
          fill="url(#wrenchGrad)" />
        <circle cx="18" cy="16" r="8" fill="none" stroke="#FDE68A" strokeWidth="3" />
        <circle cx="48" cy="46" r="6" fill="#CA8A04" />
      </g>
    </svg>
  );
}

function Icon3DTrendUp({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 8px rgba(232,184,75,0.4))' }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
      <style>{`
        @keyframes trendPulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .trend-anim{animation:trendPulse 1.8s ease-in-out infinite}
      `}</style>
      <g className="trend-anim">
        <polyline points="8,48 22,30 34,38 54,14" stroke="url(#trendGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <polygon points="44,10 58,10 58,24" fill="#E8B84B"/>
      </g>
    </svg>
  );
}

function Icon3DEye({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 8px rgba(34,197,94,0.4))' }}>
      <style>{`
        @keyframes eyeBlink{0%,90%,100%{scaleY:1}95%{scaleY:0.1}}
        .eye-anim{animation:eyeBlink 3s ease-in-out infinite;transform-origin:32px 32px}
      `}</style>
      <g className="eye-anim">
        <path d="M8 32 C16 18 48 18 56 32 C48 46 16 46 8 32Z" fill="#22C55E" opacity="0.25"/>
        <path d="M8 32 C16 18 48 18 56 32 C48 46 16 46 8 32Z" stroke="#22C55E" strokeWidth="3" fill="none"/>
        <circle cx="32" cy="32" r="9" fill="#16A34A"/>
        <circle cx="32" cy="32" r="5" fill="#14532D"/>
        <circle cx="29" cy="29" r="2" fill="white" opacity="0.6"/>
      </g>
    </svg>
  );
}

function Icon3DStore({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 6px 12px rgba(232,184,75,0.6))' }}>
      <defs>
        <linearGradient id="storeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF3C7"/>
          <stop offset="100%" stopColor="#F59E0B"/>
        </linearGradient>
      </defs>
      <style>{`
        @keyframes storeShine{0%,100%{opacity:1}50%{opacity:0.7}}
        .store-anim{animation:storeShine 2.5s ease-in-out infinite}
      `}</style>
      <g className="store-anim">
        <rect x="10" y="28" width="44" height="28" rx="3" fill="url(#storeGrad)"/>
        <path d="M8 28 L14 12 L50 12 L56 28Z" fill="#E8B84B"/>
        <rect x="24" y="38" width="16" height="18" rx="2" fill="#92400E"/>
        <rect x="10" y="38" width="10" height="10" rx="2" fill="#FEF9C3"/>
        <rect x="44" y="38" width="10" height="10" rx="2" fill="#FEF9C3"/>
        <path d="M28 12 L32 4 L36 12Z" fill="#FCD34D"/>
      </g>
    </svg>
  );
}

function Icon3DLock({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 8px rgba(232,184,75,0.3))' }}>
      <style>{`
        @keyframes lockShake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
        .lock-anim{animation:lockShake 3s ease-in-out infinite;transform-origin:32px 32px}
      `}</style>
      <g className="lock-anim">
        <rect x="14" y="30" width="36" height="26" rx="5" fill="#CA8A04"/>
        <rect x="16" y="32" width="32" height="22" rx="4" fill="#FDE68A"/>
        <path d="M22 30 V22 C22 14 42 14 42 22 V30" stroke="#CA8A04" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <circle cx="32" cy="43" r="5" fill="#92400E"/>
        <rect x="30" y="43" width="4" height="6" rx="1" fill="#92400E"/>
      </g>
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ShowroomDashboard() {
  const { t } = useLang();
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated, clearStore } = useAuthStore();

  const [stats, setStats] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState('BOTH');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const socketRef = useRef(null);

  // ✅ PHASE 7 FIX: explicit no-store detection
  const [noStoreFound, setNoStoreFound] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (!noStoreFound) return;
    clearStore();
    router.replace('/dashboard/register-showroom');
  }, [noStoreFound, clearStore, router]);

  const fetchData = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      setNoStoreFound(false);

      const [statsRes, storeRes, paymentRes] = await Promise.all([
        fetch(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
        fetch(`${API}/showrooms/my-showroom`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
        fetch(`${API}/payments/subscription-status`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      ]);

      if (statsRes.ok) {
        const json = await statsRes.json();
        setStats(json.data || json);
      }

      if (storeRes.ok) {
        const json = await storeRes.json();
        const data = json.data ?? json.store ?? null;
        setStoreData(data);
        if (!data) setNoStoreFound(true);
      }

      if (paymentRes.ok) {
        const json = await paymentRes.json();
        setPaymentInfo(json.data || null);
      }
    } catch {
      setError(t('common.serverError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) fetchData();
  }, [_hasHydrated, isAuthenticated, fetchData]);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !user?.id) return;

    connectSocket();
    socketRef.current = getSocket();
    socketRef.current.emit('join_user_room', user.id);

    const handleChatNotification = () => setChatUnreadCount((prev) => prev + 1);
    socketRef.current.on('new_chat_notification', handleChatNotification);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_chat_notification', handleChatNotification);
      }
    };
  }, [_hasHydrated, isAuthenticated, user?.id]);

  const handleChatBellClick = () => {
    setChatUnreadCount(0);
    router.push('/chat');
  };

  const handleUpgradeConfirm = async () => {
    const token = getCleanToken();
    if (!token) return;
    try {
      setUpgrading(true);
      const res = await fetch(`${API}/dealer/store/listing-type`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingType: 'BOTH' }),
      });
      if (res.ok) {
        setUpgradeSuccess(true);
        setStoreData((prev) => ({ ...prev, listingType: 'BOTH' }));
        setTimeout(() => { setShowUpgradeModal(false); setUpgradeSuccess(false); }, 2000);
      } else {
        alert(t('common.tryAgain'));
      }
    } catch {
      alert(t('dashboard.ui.networkError'));
    } finally {
      setUpgrading(false);
    }
  };

  const API_BASE = API.replace(/\/api\/?$/, '');
  const toFullImageUrl = (p) => {
    if (!p) return null;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
  };

  const storeName    = storeData?.name || user?.store?.name || t('showroom.title');
  const storeLogo    = toFullImageUrl(storeData?.logo || storeData?.showroomImage || user?.store?.logo || null);
  const storeSlug    = storeData?.slug || user?.store?.slug || null;
  const listingType  = storeData?.listingType || user?.store?.listingType || 'BOTH';
  const isLive       = storeData?.isActive === true && paymentInfo?.isActive === true;
  const isVerifiedBadge = storeData?.isVerified === true;
  const paymentStatus   = paymentInfo?.paymentStatus || null;
  const canSellCars  = listingType === 'CARS' || listingType === 'BOTH';
  const canSellParts = listingType === 'PARTS' || listingType === 'BOTH';

  // ─── Loading screen ────────────────────────────────────────────────────────
  if (!_hasHydrated || loading || noStoreFound) {
    return (
      <div className="min-h-screen bg-dash-page flex items-center justify-center px-4">
        <div className="h-10 w-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dash-page">

      {/* Ambient glows — matches seller page exactly */}
      <div
        className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'rgba(232,184,75,0.08)' }}
      />
      <div
        className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl animate-pulse"
        style={{ background: 'rgba(232,184,75,0.06)' }}
      />

      <div className="relative max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-12">

        {/* ── Header ── */}
        <div className="mb-4 sm:mb-10 border-b border-theme pb-3 sm:pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* Store logo / avatar */}
            <div
              className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center shrink-0 ${
                storeLogo ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
              }`}
              style={{
                background: 'var(--bg-dash-new-btn)',
                boxShadow: '0 4px 16px rgba(232,184,75,0.35)',
              }}
              onClick={() => storeLogo && setShowLogoPreview(true)}
            >
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <span className="scale-75 sm:scale-100"><Icon3DStore size={32} /></span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-3xl font-extrabold text-theme-primary tracking-tight leading-snug break-words">
                  {storeName}
                </h1>
                {isVerifiedBadge && (
                  <span
                    className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-500 whitespace-nowrap"
                    title={t('common.verified')}
                  >
                    <ShieldCheck size={9} className="sm:w-[11px] sm:h-[11px]" />{t('common.verified')}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <p className="text-theme-muted text-[9px] sm:text-xs font-medium uppercase tracking-wider">
                  {t('dashboard.showroomDashboard')}
                </p>
                {listingType !== 'BOTH' && (
                  <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                    style={{ background: 'var(--bg-dash-card)', border: '1px solid var(--border-dash-card)', color: 'var(--text-theme-secondary)' }}>
                    {listingType === 'CARS' ? `🚗 ${t('dashboard.ui.carsOnly')}` : `🔧 ${t('dashboard.ui.partsOnly')}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
            {/* Chat bell */}
            <button
              onClick={handleChatBellClick}
              aria-label={t('nav.chatNotifications')}
              className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass-card glow-hover transition-all ${
                chatUnreadCount > 0 ? 'animate-pulse' : ''
              }`}
              style={{ borderColor: 'var(--border-dash-card)' }}
            >
              <Bell
                size={14}
                className={`sm:w-[16px] sm:h-[16px] ${chatUnreadCount > 0 ? 'text-amber-400' : 'text-theme-muted'}`}
                fill={chatUnreadCount > 0 ? 'currentColor' : 'none'}
              />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] sm:h-5 sm:min-w-[20px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] sm:text-[10px] font-bold shadow-lg">
                  {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                </span>
              )}
            </button>

            {/* Analytics */}
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1.5 glass-card text-theme-secondary hover:text-theme-primary font-bold text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors glow-hover whitespace-nowrap"
              style={{ borderColor: 'var(--border-dash-card)' }}
            >
              <BarChart2 size={13} /> {t('dashboard.myAnalytics')}
            </Link>

            {/* Public showroom link */}
            {storeSlug ? (
              <Link
                href={`/stores/${storeSlug}`}
                target="_blank"
                className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:scale-[1.02] transition-all whitespace-nowrap glow-hover btn-dash-new"
                style={{ boxShadow: '0 4px 16px rgba(232,184,75,0.35)' }}
              >
                <ExternalLink size={13} /> {t('stores.viewStore')}
              </Link>
            ) : (
              <Link
                href="/dashboard/edit-showroom"
                className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:scale-[1.02] transition-all whitespace-nowrap glow-hover btn-dash-new"
                style={{ boxShadow: '0 4px 16px rgba(232,184,75,0.35)' }}
              >
                <Eye size={13} />{t('stores.viewStore')}</Link>
            )}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div
            className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 glass-card"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-[10px] sm:text-sm">{error}</p>
            <button onClick={fetchData} className="ml-auto text-red-400 hover:text-red-300 text-[10px] sm:text-sm font-semibold underline whitespace-nowrap">
              {t('common.tryAgain')}
            </button>
          </div>
        )}

        {/* ── Payment / Live Status Banner ── */}
        {isLive ? (
          <div
            className="mb-4 sm:mb-10 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 glass-card"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <p className="text-emerald-500 text-[10px] sm:text-sm font-semibold">
              🎉 {t('admin.liveMarketplace')}
            </p>
          </div>
        ) : paymentStatus === 'VERIFYING' ? (
          <div
            className="mb-4 sm:mb-10 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 glass-card"
            style={{ background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)' }}
          >
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-spin shrink-0" />
            <p className="text-theme-secondary text-[10px] sm:text-sm font-semibold">
              {t('payment.reviewingBody')}
            </p>
          </div>
        ) : paymentStatus === 'REJECTED' ? (
          <div
            className="mb-4 sm:mb-10 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 glass-card"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-[10px] sm:text-sm font-semibold flex-1">
              {t('payment.rejectedBody')}
            </p>
            <Link href="/pricing" className="ml-auto text-amber-500 hover:text-amber-400 text-[10px] sm:text-sm font-bold underline shrink-0 whitespace-nowrap">
              {t('common.tryAgain')}
            </Link>
          </div>
        ) : (
          <div
            className="mb-4 sm:mb-10 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 glass-card"
            style={{ background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)' }}
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <p className="text-theme-secondary text-[10px] sm:text-sm font-semibold flex-1">
              {t('payment.unlockBody')}
            </p>
            <Link href="/pricing" className="ml-auto text-amber-500 hover:text-amber-400 text-[10px] sm:text-sm font-bold underline shrink-0 whitespace-nowrap">{t('dashboard.payNow')}</Link>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-5 mb-4 sm:mb-10">
          <StatCard
            icon={<Icon3DTrendUp size={28} />}
            label={t('dashboard.ui.totalListings')}
            value={stats?.totalListings ?? stats?.totalCars ?? 0}
            gradient="from-amber-500/20 to-yellow-400/20"
            iconColor="text-amber-400"
          />
          <StatCard
            icon={<Icon3DEye size={28} />}
            label={t('dashboard.activeListings')}
            value={
              stats?.activeListings ??
              stats?.active ??
              (Array.isArray(stats?.cars) ? stats.cars.filter((c) => c.status === 'ACTIVE').length : 0)
            }
            gradient="from-emerald-500/20 to-green-400/20"
            iconColor="text-emerald-400"
          />
          <StatCard
            icon={<Icon3DCar size={28} />}
            label={t('dashboard.ui.totalCars')}
            value={stats?.totalCars ?? 0}
            gradient="from-amber-400/20 to-orange-400/20"
            iconColor="text-orange-400"
          />
          <StatCard
            icon={canSellParts ? <Icon3DWrench size={28} /> : <Icon3DLock size={28} />}
            label={t('dashboard.ui.totalParts')}
            value={canSellParts ? (stats?.totalParts ?? stats?.parts ?? 0) : '🔒'}
            gradient={canSellParts ? 'from-yellow-500/20 to-amber-400/20' : 'from-gray-500/10 to-gray-400/10'}
            iconColor={canSellParts ? 'text-yellow-400' : 'text-theme-muted'}
          />
        </div>

        {/* ── Listings Manage Karein — CTA style cards ── */}
        <div className="mb-4 sm:mb-10">
          <div className="mb-2.5 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-theme-primary font-bold text-[11px] sm:text-sm tracking-wide">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 inline-block shrink-0"
              style={{ boxShadow: '0 0 10px 2px rgba(232,184,75,0.6)' }} />
            {t('dashboard.myListings')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-5">
            <ManagementCard
              icon={<Icon3DCar size={44} />}
              title={t('nav.cars')}
              description={canSellCars ? t('dashboard.ui.carsOnlyDesc') : t('dashboard.ui.chooseNext', { price: 0 })}
              locked={!canSellCars}
              onLockedClick={() => { setUpgradeTarget('BOTH'); setShowUpgradeModal(true); }}
              links={canSellCars ? [
                { label: t('dashboard.addNewListing'), href: '/dashboard/new-listing', emoji: '➕' },
                { label: t('dashboard.myListings'), href: '/dashboard/listings', emoji: '👁️' },
              ] : []}
              lockMsg={`${t('dashboard.ui.carsOnly')} →`}
            />
            <ManagementCard
              icon={<Icon3DWrench size={44} />}
              title={t('nav.parts')}
              description={canSellParts ? t('dashboard.ui.partsOnlyDesc') : t('dashboard.ui.chooseNext', { price: 0 })}
              locked={!canSellParts}
              onLockedClick={() => { setUpgradeTarget('BOTH'); setShowUpgradeModal(true); }}
              links={canSellParts ? [
                { label: t('dashboard.addSparePart'), href: '/dashboard/spare-parts/add', emoji: '➕' },
                { label: t('dashboard.spareParts'), href: '/dashboard/spare-parts', emoji: '🔧' },
              ] : []}
              lockMsg={`${t('dashboard.spareParts')} →`}
            />
          </div>
        </div>

        {/* ── Showroom Settings ── */}
        <div>
          <div className="mb-2.5 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-theme-primary font-bold text-[11px] sm:text-sm tracking-wide">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 inline-block shrink-0"
              style={{ boxShadow: '0 0 10px 2px rgba(232,184,75,0.6)' }} />
            {t('dashboard.editShowroom')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
            <QuickLinkCard
              emoji="⚙️"
              label={t('dashboard.editShowroom')}
              desc={t('dashboard.ui.showroomSetupHint')}
              href="/dashboard/edit-showroom"
            />
            <QuickLinkCard
              emoji="📊"
              label={t('dashboard.myAnalytics')}
              desc={t('dashboard.performanceHint')}
              href="/dashboard/analytics"
            />
            <QuickLinkCard
              emoji="💳"
              label={t('nav.settings')}
              desc={
                isLive
                  ? (paymentInfo?.endDate
                      ? `${t('admin.liveMarketplace')} — ${new Date(paymentInfo.endDate).toLocaleDateString()}`
                      : t('admin.liveMarketplace'))
                  : paymentStatus === 'VERIFYING'
                  ? t('payment.reviewing')
                  : paymentStatus === 'REJECTED'
                  ? t('payment.rejectedTitle')
                  : t('dashboard.paymentPending')
              }
              href="/pricing"
              badge={
                isLive
                  ? { label: 'LIVE', cls: 'bg-emerald-400/10 text-emerald-500' }
                  : paymentStatus === 'VERIFYING'
                  ? { label: 'VERIFYING', cls: 'bg-amber-400/10 text-amber-500' }
                  : paymentStatus === 'REJECTED'
                  ? { label: 'REJECTED', cls: 'bg-red-400/10 text-red-500' }
                  : { label: 'DUE', cls: 'bg-amber-400/10 text-amber-500' }
              }
            />
          </div>
        </div>

      </div>

      {/* ── Logo Preview Modal ── */}
      {showLogoPreview && storeLogo && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setShowLogoPreview(false)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowLogoPreview(false)}
              className="absolute -top-9 right-0 text-theme-muted hover:text-theme-primary transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={storeLogo}
              alt={storeName}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
              style={{ border: '1px solid var(--border-dash-card)', boxShadow: 'var(--card-shadow)' }}
            />
          </div>
        </div>
      )}

      {/* ── Upgrade Modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            className="rounded-2xl sm:rounded-3xl p-4 sm:p-7 max-w-md w-full glass-card"
            style={{
              background: 'var(--bg-dash-card)',
              border: '1px solid var(--border-dash-card)',
              boxShadow: '0 20px 60px rgba(232,184,75,0.15)',
            }}
          >
            {upgradeSuccess ? (
              <div className="text-center py-4 sm:py-6">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-xl font-black text-theme-primary mb-1.5 sm:mb-2">{t('dashboard.upgradeComplete')} 🎉</h3>
                <p className="text-theme-muted text-[11px] sm:text-sm">{t('dashboard.carsAndPartsUnlocked')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-3.5 sm:mb-5 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-dash-new-btn)', boxShadow: '0 4px 16px rgba(232,184,75,0.35)' }}
                    >
                      <span className="scale-75 sm:scale-100"><Icon3DWrench size={28} /></span>
                    </div>
                    <h3 className="text-[13px] sm:text-lg font-black text-theme-primary leading-snug">
                      {canSellCars ? `${t('dashboard.spareParts')}?` : `${t('dashboard.ui.totalCars')}?`}
                    </h3>
                  </div>
                  <button onClick={() => setShowUpgradeModal(false)} className="text-theme-muted hover:text-theme-primary transition-colors shrink-0">
                    <X size={18} />
                  </button>
                </div>

                <p className="text-theme-muted text-[11px] sm:text-sm mb-4 sm:mb-6 leading-relaxed">
                  Abhi aap sirf{' '}
                  <strong className="text-theme-primary">{listingType === 'CARS' ? t('nav.cars') : t('nav.parts')}</strong>{' '}
                  {t('dashboard.ui.noPerCarFee')}{' '}
                  {t('dashboard.carsAndParts')} 
                  <strong className="text-amber-500">{t('dashboard.carsAndParts')}</strong> {t('common.available').toLowerCase()}.
                </p>

                <div className="flex gap-2.5 sm:gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 py-2.5 sm:py-3 glass-card rounded-xl sm:rounded-2xl text-theme-muted text-[11px] sm:text-sm font-bold hover:text-theme-primary transition-colors"
                    style={{ borderColor: 'var(--border-dash-card)' }}
                  >
                    Abhi Nahi
                  </button>
                  <button
                    onClick={handleUpgradeConfirm}
                    disabled={upgrading}
                    className="flex-1 py-2.5 sm:py-3 btn-dash-new rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black transition-all disabled:opacity-50 glow-hover"
                    style={{ boxShadow: '0 4px 16px rgba(232,184,75,0.35)' }}
                  >
                    {upgrading ? t('common.processing') : `${t('common.yes')}, ${t('common.update')} ✓`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, gradient, iconColor }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--rx', `${x * 10}deg`);
      el.style.setProperty('--ry', `${y * -10}deg`);
    };
    const onMouseLeave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden p-2.5 sm:p-6 rounded-xl sm:rounded-2xl hover:-translate-y-0.5 transition-all duration-300 group glow-hover tilt-3d"
      style={{
        background: 'var(--bg-dash-card)',
        border: '1px solid var(--border-dash-card)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className={`relative flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 ${iconColor}`}>
        {icon}
        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-theme-muted leading-tight">{label}</span>
      </div>
      <span
        className="relative inline-block text-lg sm:text-3xl font-black text-theme-primary px-1.5 sm:px-2 py-0.5 rounded-lg leading-tight"
        style={{ background: 'var(--bg-surface-alt)' }}
      >
        {value}
      </span>
    </div>
  );
}

function ManagementCard({ icon, title, description, locked, onLockedClick, links, lockMsg }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--rx', `${x * 10}deg`);
      el.style.setProperty('--ry', `${y * -10}deg`);
    };
    const onMouseLeave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="p-3 sm:p-6 transition-all duration-300 rounded-xl sm:rounded-2xl glass-card glow-hover tilt-3d"
      style={{
        background: 'var(--bg-dash-cta)',
        border: '1px solid var(--border-dash-cta)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-start gap-2.5 sm:gap-4 mb-3 sm:mb-5">
        <div className="shrink-0 scale-75 sm:scale-100 origin-top-left">
          {locked ? <Icon3DLock size={44} /> : icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-theme-primary text-[12px] sm:text-base">{title}</h3>
          <p className="text-theme-muted text-[10px] sm:text-sm mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      {locked ? (
        <button
          onClick={onLockedClick}
          className="w-full py-2 sm:py-3 btn-dash-new text-[11px] sm:text-sm font-black rounded-lg sm:rounded-xl glow-hover"
          style={{ boxShadow: '0 4px 16px rgba(232,184,75,0.35)' }}
        >
          {lockMsg}
        </button>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 sm:gap-3 w-full py-2 sm:py-3 px-2.5 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-theme-secondary text-[11px] sm:text-sm hover:text-theme-primary transition-all glow-hover glass-card"
              style={{ borderColor: 'var(--border-dash-card)' }}
            >
              <span>{link.emoji}</span>
              {link.label}
              <ChevronRight size={13} className="sm:w-[14px] sm:h-[14px] ml-auto text-theme-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickLinkCard({ emoji, label, desc, href, badge }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--rx', `${x * 10}deg`);
      el.style.setProperty('--ry', `${y * -10}deg`);
    };
    const onMouseLeave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <Link
      ref={cardRef}
      href={href}
      className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all group block glass-card glow-hover tilt-3d"
      style={{
        background: 'var(--bg-dash-card)',
        border: '1px solid var(--border-dash-card)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-lg sm:text-2xl mb-1.5 sm:mb-2 block">{emoji}</span>
        {badge && (
          <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap border ${badge.cls}`}
            style={{ borderColor: 'var(--border-dash-card)' }}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="font-bold text-theme-primary text-[11px] sm:text-sm group-hover:text-amber-500 transition-colors">{label}</p>
      <p className="text-theme-muted text-[9px] sm:text-xs mt-0.5 sm:mt-1">{desc}</p>
      <ChevronRight size={13} className="sm:w-[14px] sm:h-[14px] text-theme-muted group-hover:text-amber-400 mt-1.5 sm:mt-2 transition-colors" />
    </Link>
  );
}