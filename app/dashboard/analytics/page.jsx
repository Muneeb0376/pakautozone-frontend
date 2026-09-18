'use client';
import { useLang } from '@/lib/i18nContext';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/lib/themeContext';
import { getCleanToken } from '@/lib/auth';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import {
  BarChart2, ArrowLeft, Car, Wrench, Eye, Star,
  TrendingUp, Heart, MessageSquare, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── Tone chip colors (restrained — amber is the brand accent, green/rose only where meaning is clear) ──
const TONE = {
  amber:   { chipL: 'bg-amber-50',    chipD: 'bg-amber-500/10',   iconL: 'text-amber-600',  iconD: 'text-amber-400',  ringD: 'ring-amber-500/20' },
  success: { chipL: 'bg-emerald-50',  chipD: 'bg-emerald-500/10', iconL: 'text-emerald-600',iconD: 'text-emerald-400',ringD: 'ring-emerald-500/20' },
  rose:    { chipL: 'bg-rose-50',     chipD: 'bg-rose-500/10',    iconL: 'text-rose-500',   iconD: 'text-rose-400',  ringD: 'ring-rose-500/20' },
  neutral: { chipL: 'bg-stone-100',   chipD: 'bg-stone-500/10',   iconL: 'text-stone-500',  iconD: 'text-stone-400', ringD: 'ring-stone-500/15' },
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, tone = 'amber', isDark, index = 0, big = false }) {
  const { t } = useLang();
  const c = TONE[tone] ?? TONE.amber;

  return (
    <div
      className={[
        'stat-anim group relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3',
        'border transition-all duration-300 ease-out',
        'hover:-translate-y-1',
        isDark
          ? 'bg-[#1c1914] border-stone-800/80 hover:border-amber-500/30 hover:shadow-xl hover:shadow-black/30'
          : 'bg-white border-stone-100 hover:border-amber-200 hover:shadow-lg hover:shadow-stone-200/60 shadow-sm',
      ].join(' ')}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        className={[
          'w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
          isDark ? c.chipD : c.chipL,
        ].join(' ')}
      >
        <Icon size={18} className={isDark ? c.iconD : c.iconL} strokeWidth={2} />
      </div>
      <div>
        <p className={[big ? 'text-3xl' : 'text-2xl', 'font-bold tracking-tight', isDark ? 'text-stone-100' : 'text-stone-900'].join(' ')}>
          {value}
        </p>
        <p className={['text-[11px] font-semibold mt-1 uppercase tracking-wider', isDark ? 'text-stone-500' : 'text-stone-400'].join(' ')}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ isDark }) {
  return (
    <div
      className={[
        'rounded-2xl border p-5 animate-pulse space-y-3',
        isDark ? 'bg-[#1c1914] border-stone-800/80' : 'bg-white border-stone-100',
      ].join(' ')}
    >
      <div className={['w-10 h-10 rounded-xl', isDark ? 'bg-stone-800' : 'bg-stone-100'].join(' ')} />
      <div className={['h-6 rounded w-1/2', isDark ? 'bg-stone-800' : 'bg-stone-100'].join(' ')} />
      <div className={['h-3 rounded w-3/4', isDark ? 'bg-stone-800' : 'bg-stone-100'].join(' ')} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsDashboardPage() {
  const { t } = useLang();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const router                = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { theme, mounted }    = useTheme();
  const isDark                = mounted ? theme === 'dark' : false;

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    fetchAnalytics();
  }, [_hasHydrated, isAuthenticated]);

  const fetchAnalytics = async () => {
    const token = getCleanToken();
    if (!token) { router.replace('/login'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/analytics/my-store`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) { setData(null); setLoading(false); return; }
      if (!res.ok) { setError(t('dashboard.ui.paymentError')); setLoading(false); return; }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(t('dashboard.ui.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const pageBg = isDark ? 'bg-[#131110]' : 'bg-[#fdf8f0]';

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (!mounted || !_hasHydrated || loading) {
    return (
      <div className={`min-h-screen ${pageBg} px-4 py-8 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3 animate-pulse">
            <div className={['w-9 h-9 rounded-xl', isDark ? 'bg-stone-800' : 'bg-stone-200'].join(' ')} />
            <div className="space-y-1.5">
              <div className={['h-5 rounded w-36', isDark ? 'bg-stone-800' : 'bg-stone-200'].join(' ')} />
              <div className={['h-3 rounded w-24', isDark ? 'bg-stone-800' : 'bg-stone-100'].join(' ')} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} isDark={isDark} />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} isDark={isDark} />)}
          </div>
          <p className={['text-center text-sm', isDark ? 'text-stone-600' : 'text-stone-400'].join(' ')}>
            {t('dashboard.ui.analyticsLoading')}
          </p>
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center px-4 transition-colors duration-300`}>
        <div className={[
          'rounded-2xl p-8 max-w-sm w-full text-center border shadow-sm',
          isDark ? 'bg-[#1c1914] border-rose-500/20' : 'bg-white border-red-100',
        ].join(' ')}>
          <div className={['w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4', isDark ? 'bg-rose-500/10' : 'bg-red-50'].join(' ')}>
            <BarChart2 size={22} className={isDark ? 'text-rose-400' : 'text-red-400'} />
          </div>
          <p className={['font-semibold', isDark ? 'text-stone-100' : 'text-stone-800'].join(' ')}>{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {t('dashboard.ui.analyticsRetry')}
          </button>
        </div>
      </div>
    );
  }

  // ─── No store ────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center px-4 transition-colors duration-300`}>
        <div className={[
          'rounded-2xl p-8 max-w-sm w-full text-center border shadow-sm',
          isDark ? 'bg-[#1c1914] border-amber-500/20' : 'bg-white border-amber-100',
        ].join(' ')}>
          <div className={['w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4', isDark ? 'bg-amber-500/10' : 'bg-amber-50'].join(' ')}>
            <BarChart2 size={22} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          </div>
          <p className={['text-lg font-bold', isDark ? 'text-stone-100' : 'text-stone-800'].join(' ')}>{t('dashboard.showroomNotFound')}</p>
          <p className={['text-sm mt-2 leading-relaxed', isDark ? 'text-stone-400' : 'text-stone-500'].join(' ')}>
            {t('dashboard.ui.analyticsNoStore')}
          </p>
          <Link
            href="/dashboard/register-showroom"
            className="inline-block mt-5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {t('dashboard.ui.registerShowroom')}
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main ────────────────────────────────────────────────────────────────
  const rating = data.rating ? Number(data.rating).toFixed(1) : null;

  return (
    <div className={`min-h-screen ${pageBg} transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto px-4 py-7 space-y-7">

        {/* ── Header ── */}
        <div className="page-anim flex items-center gap-3">
          <Link
            href="/dashboard"
            className={[
              'w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm transition-colors',
              isDark
                ? 'bg-[#1c1914] border-stone-800 text-stone-400 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400'
                : 'bg-white border-stone-200 text-stone-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600',
            ].join(' ')}
          >
            <ArrowLeft size={17} />
          </Link>
          <div>
            <h1 className={['text-xl font-bold flex items-center gap-2', isDark ? 'text-stone-100' : 'text-stone-900'].join(' ')}>
              <BarChart2 size={20} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
              {t('dashboard.ui.storeAnalytics')}
            </h1>
            <p className={['text-sm', isDark ? 'text-stone-500' : 'text-stone-500'].join(' ')}>{t('dashboard.performanceHint')}</p>
          </div>
        </div>

        {/* ── Top Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('dashboard.ui.totalCars')}  value={data.totalCars  ?? 0}                    icon={Car}    tone="amber" isDark={isDark} index={0} big />
          <StatCard label={t('dashboard.ui.totalParts')} value={data.totalParts ?? 0}                    icon={Wrench} tone="amber" isDark={isDark} index={1} big />
          <StatCard label={t('dashboard.ui.views')} value={(data.totalViews ?? 0).toLocaleString()} icon={Eye}    tone="amber" isDark={isDark} index={2} big />
          <StatCard label={t('dashboard.ui.rating')}      value={rating ? `${rating} ★` : t('common.none')}          icon={Star}   tone="amber" isDark={isDark} index={3} big />
        </div>

        {/* ── Detail Cards Grid ── */}
        <div>
          <p className={[
            'page-anim text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2',
            isDark ? 'text-stone-500' : 'text-stone-400',
          ].join(' ')}>
            <span className={['h-px flex-shrink-0 w-4', isDark ? 'bg-stone-700' : 'bg-stone-300'].join(' ')} />
            {t('dashboard.ui.detailedBreakdown')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label={t('dashboard.activeListings')} value={data.activeListings ?? 0}                 icon={TrendingUp}    tone="neutral" isDark={isDark} index={4} />
            <StatCard label={t('dashboard.ui.views')}      value={(data.totalViews ?? 0).toLocaleString()} icon={Eye}           tone="neutral" isDark={isDark} index={5} />
            <StatCard label={t('dashboard.ui.wishlisted')}       value={data.wishlisted   ?? 0}                  icon={Heart}         tone="rose"    isDark={isDark} index={6} />
            <StatCard label={t('dashboard.ui.inquiries')}        value={data.inquiries    ?? 0}                  icon={MessageSquare} tone="neutral" isDark={isDark} index={7} />
            <StatCard label={t('dashboard.ui.tradeOffers')}     value={data.tradeOffers  ?? 0}                  icon={RefreshCw}     tone="neutral" isDark={isDark} index={8} />
          </div>
        </div>

        {/* ── Rating Summary ── */}
        <div className={[
          'page-anim rounded-2xl p-5 flex items-center gap-4 border shadow-sm transition-colors duration-300',
          isDark ? 'bg-[#1c1914] border-amber-500/20' : 'bg-white border-amber-100',
        ].join(' ')}>
          <div className={['w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0', isDark ? 'bg-amber-500/10' : 'bg-amber-50'].join(' ')}>
            <Star size={20} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
          </div>
          <div>
            <p className={['text-2xl font-bold', isDark ? 'text-amber-400' : 'text-amber-600'].join(' ')}>
              {rating ?? '0.0'}
              <span className={['text-sm font-normal ml-2', isDark ? 'text-stone-500' : 'text-stone-400'].join(' ')}>/ 5.0</span>
            </p>
            <p className={['text-xs mt-0.5', isDark ? 'text-stone-500' : 'text-stone-400'].join(' ')}>{t('dashboard.ui.reviews', { count: data.reviewCount ?? 0 })}</p>
          </div>
        </div>

        {/* ── Chart ── */}
        <div className={[
          'page-anim rounded-2xl p-5 border shadow-sm transition-colors duration-300',
          isDark ? 'bg-[#1c1914] border-stone-800' : 'bg-white border-stone-100',
        ].join(' ')}>
          <p className={['text-sm font-semibold mb-4 flex items-center gap-2', isDark ? 'text-stone-200' : 'text-stone-700'].join(' ')}>
            <BarChart2 size={16} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            {t('dashboard.ui.performanceOverview')}
          </p>
          <AnalyticsChart data={data} />
        </div>

      </div>

      <style jsx global>{`
        @keyframes statFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pageFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-anim {
          animation: statFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .page-anim {
          animation: pageFadeUp 0.45s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .stat-anim, .page-anim {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}