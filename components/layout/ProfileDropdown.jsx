//frontend/components/layout/ProfileDropdown.jsx
'use client';

// ✅ PHASE 5 — Navbar Dashboard Dropdown
//
// Single professional Profile Avatar dropdown, ek hi jagah se sab kuch:
//   - Seller-only user  → sirf "Seller Dashboard" link
//   - Showroom-only user → sirf "Showroom Dashboard" link
//   - Dual-profile user  → <DashboardSwitcher /> (dono options + active dot)
//   - Buyer-only user    → "My Dashboard" + "Become a Seller" / "Register
//                           Showroom" shortcuts (Phase 4/2 entry points —
//                           roadmap ka #1 complaint tha ke "Seller Dashboard
//                           ka entry point hi exist nahi karta")
//   - Admin              → "Admin Panel"
// Profile / Settings / Logout hamesha bottom mein, har role ke liye same.
//
// Same flags jo getDashboardPath.js + dashboard/layout.jsx use karte hain
// (hasSellerProfile / hasStore, role fallback) — taake teeno jagah kabhi
// disagree na karein.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  LayoutDashboard,
  Car,
  Store,
  Settings,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/lib/i18nContext';
import DashboardSwitcher from './DashboardSwitcher';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

// ✅ FIX: avatar relative path ko full URL mein convert karta hai.
// Backend /uploads/... pe file serve karta hai — Next.js frontend ka
// origin alag hota hai (port 3000 vs 5000), is liye relative path kaam
// nahi karti. NEXT_PUBLIC_API_URL se base URL leke prefix karo.
function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '');
  return base ? `${base}${avatar}` : avatar;
}

export default function ProfileDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();
  const {
    user,
    store,
    role,
    logout,
    activeDashboard,
    setActiveDashboard,
  } = useAuthStore();

  const [open, setOpen] = useState(false);
  // ✅ FIX: agar avatar URL load fail ho (broken img) toh initials fallback
  const [avatarError, setAvatarError] = useState(false);
  const wrapRef = useRef(null);

  // ✅ user.avatar change hone par error reset karo (e.g. naya avatar upload)
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close whenever the route changes (link click, back/forward, etc.)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!user) return null;

  const effectiveRole = (role || user?.role || '').toUpperCase();
  const isAdmin = effectiveRole === 'ADMIN';

  // ✅ Same computation as getDashboardPath.js / dashboard/layout.jsx —
  // single behaviour everywhere, never disagree with each other.
  const isSeller = !!(user.hasSellerProfile || effectiveRole === 'SELLER');
  // ✅ FIX: pehle `store?.id` ko dealer-signal maana ja raha tha. Lekin
  // become-seller flow bhi ek "hidden anchor" Store banata hai
  // (isShowroom: false) sirf listings/chat anchor karne ke liye — us
  // record ka bhi ek `id` hota hai! Is wajah se pure private-seller
  // (jiska koi real showroom register nahi hua) ko bhi "dealer" samajh
  // liya jata tha, aur Seller Dashboard click karne par wo showroom
  // flow mein chala jata (jo aage register-showroom form dikha deta).
  // Sirf `isShowroom: true` wala record hi asal showroom ginta hai —
  // showroom.controller.js mein bhi yahi convention hai.
  const isDealer = !!(user.hasStore || store?.isShowroom || effectiveRole === 'DEALER');
  const isDualProfile = isSeller && isDealer;
  const isBuyerOnly = !isAdmin && !isSeller && !isDealer;

  const handleSwitchDashboard = (target) => {
    setActiveDashboard(target);
    setOpen(false);
    router.push(target === 'showroom' ? '/dashboard/showroom' : '/dashboard/seller');
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push('/');
  };

  const showroomLabel = store?.name
    ? t('dashboard.storeDashboard', { name: store.name })
    : t('dashboard.showroomDashboard');

  // ✅ /profile aur /settings ab dedicated pages hain (app/(main)/profile,
  // app/(main)/settings), is liye seedha unhi par bhejna hai — dashboard
  // path ke saath duplicate karne ki zaroorat nahi.

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('dashboard.accountMenu')}
        className="flex items-center gap-1.5 h-9 ps-1 pe-2 rounded-full border transition-shadow duration-200 hover:shadow-md glass-card"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {user.avatar && !avatarError ? (
          <img
            src={getAvatarUrl(user.avatar)}
            alt={user.name || t('nav.profile')}
            className="h-7 w-7 rounded-full object-cover shrink-0"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {getInitials(user.name)}
          </div>
        )}
        <ChevronDown
          size={14}
          className={`hidden sm:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-primary)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
            className="absolute end-0 mt-2 w-72 max-w-[90vw] rounded-2xl border shadow-2xl z-50 overflow-hidden py-1.5 glass-card"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}
          >
            {/* Header */}
            <div className="px-3.5 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              {user.avatar && !avatarError ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.name || t('nav.profile')}
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {getInitials(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.name || t('dashboard.myAccount')}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Dashboard section */}
            <div className="py-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <LayoutDashboard size={16} />
                  {t('dashboard.adminPanel')}
                </Link>
              )}

              {!isAdmin && isDualProfile && (
                <DashboardSwitcher
                  activeDashboard={activeDashboard}
                  storeName={store?.name}
                  onSwitch={handleSwitchDashboard}
                />
              )}

              {!isAdmin && !isDualProfile && isSeller && (
                <Link
                  href="/dashboard/seller"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Car size={16} />
                  {t('dashboard.sellerDashboard')}
                </Link>
              )}

              {!isAdmin && !isDualProfile && isDealer && (
                <Link
                  href="/dashboard/showroom"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Store size={16} />
                  {showroomLabel}
                </Link>
              )}

              {!isAdmin && isBuyerOnly && (
                <Link
                  href="/dashboard/buyer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <LayoutDashboard size={16} />
                  {t('dashboard.myDashboard')}
                </Link>
              )}

              {/* ✅ Entry points — user ko kabhi bhi seller/showroom banne
                  ke liye Navbar mein hi raasta milna chahiye (Phase 4/2). */}
              {!isAdmin && !isSeller && (
                <Link
                  href="/dashboard/become-seller"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
                  style={{ color: 'var(--accent)' }}
                >
                  <PlusCircle size={16} />
                  {t('dashboard.becomeSeller')}
                </Link>
              )}
              {!isAdmin && !isDealer && (
                <Link
                  href="/dashboard/register-showroom"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
                  style={{ color: 'var(--accent)' }}
                >
                  <Store size={16} />
                  {t('dashboard.registerShowroom')}
                </Link>
              )}
            </div>

            {/* Account section */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
                style={{ color: 'var(--text-primary)' }}
              >
                <Settings size={16} />
                {t('nav.settings')}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogOut size={16} />
                {t('nav.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}