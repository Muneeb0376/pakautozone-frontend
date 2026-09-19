'use client';
// frontend/components/layout/FloatingPostButton.jsx
//
// ✅ POORI FILE REPLACE — Issue "+ Button Settings"
//
// ══ AAP NE JO KAHA ══
// • "desktop per is ka naam kuch aur rakh do, PakWheels jaisa na rakhna"
// • "trade-in wala section hata do, wo aise hi kaam ka nahi"
// • "mobile mein PakWheels jaisa neeche wala bar aaye, saari cheezen
//    neeche aayein"
// • "us mein ek dashboard wala bhi daal dena"
// • "thora sa change karna PakWheels se, theme aur animations match karein"
//
// ══ AB KYA HAI ══
//
// DESKTOP (sm aur upar):
//   Neeche daayein taraf ek chaurha pill button — "List Karein" +
//   plus icon. Ye jaan boojh kar PakWheels ke "Post an Ad" se alag
//   naam hai. Click par do options khulte hain:
//       Gaari Bechein  ·  Spare Part Bechein
//   (Trade-in nikal diya, jaisa aap ne kaha.)
//
// MOBILE (sm se chhota):
//   Neeche poori chaurai ka nav bar — 5 khaane:
//       Home · Cars · [ + ] · Parts · Dashboard
//   Bech wala plus utha hua (raised) hai. PakWheels se farq ye rakha:
//     - hamara plus GOL nahi, rounded-square hai (brand ke gear/badge
//       ki shakal se milta hai)
//     - active tab par neeche line nahi, upar chhoti gold line hai
//     - koi bounce animation nahi, sirf halka scale on press
//
// ══ THEME ══
// Poora blue/green/orange hardcoded palette hata diya. Ab bar
// var(--bg-header) par baithta hai — bilkul wahi rang jo Navbar ka hai,
// is liye upar aur neeche dono patti ek jaisi lagti hain.
//
// ⚠️ EK CSS LINE ZAROORI HAI — mobile par content bar ke neeche chhup
//    jata hai. globals-additions-v2.css mein `.paz-has-bottom-nav` wala
//    block diya hua hai, wo paste karna zaroori hai.

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Car, Wrench, X, UserPlus, Home, LayoutGrid, Cog,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import AuthModal from '@/components/auth/AuthModal';
import { getDashboardPath } from '@/lib/getDashboardPath';
import { useLang } from '@/lib/i18nContext';

/* ── "+" ke andar wale options — trade-in nikal diya ──
   Label ki jagah i18n KEY rakhi hai. Ye array module scope mein hai,
   yahan hook nahi chal sakta — is liye render ke waqt t(labelKey). */
const POST_OPTIONS = [
  {
    key: 'car',
    icon: Car,
    labelKey: 'sell.postCar',
    sublabelKey: 'sell.postCarHint',
    href: '/dashboard/new-listing',
  },
  {
    key: 'part',
    icon: Wrench,
    labelKey: 'sell.postPart',
    sublabelKey: 'sell.postPartHint',
    href: '/dashboard/spare-parts/add',
  },
];

const BECOME_SELLER_HREF = '/dashboard/become-seller';

export default function FloatingPostButton() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { t } = useLang();
  const { user, store, isAuthenticated, role, _hasHydrated } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const effectiveRole = (role || user?.role || '').toUpperCase();
  const hasStore = !!store || !!user?.hasStore;
  const isBuyerOnly = isAuthenticated && effectiveRole === 'BUYER' && !hasStore;

  // Sirf dealer/showroom ko parts ka option — private seller ke liye
  // parts ka koi flow hi nahi hai, is liye wo option dikhana confuse
  // karta tha.
  const options = (hasStore || effectiveRole === 'DEALER' || effectiveRole === 'ADMIN')
    ? POST_OPTIONS
    : POST_OPTIONS.filter((o) => o.key === 'car');

  // ⚠️ Signature `getDashboardPath(user, store)` hai — object nahi.
  // Ye function khud tay karta hai ke buyer/seller/dealer/dual-profile
  // user ko kaunsa dashboard dikhana hai.
  //
  // ✅ FIX: Jis user ne abhi tak koi seller/showroom profile register
  // nahi ki, uske liye getDashboardPath() '/dashboard/buyer' (ya kisi
  // purane hataye hue page) per le jata tha. Ab aisay user ke liye
  // "Dashboard" bottom-nav button seedha "Sell a Car" page per bhejta
  // hai. Jaise hi user seller ya showroom register kar leta hai,
  // isAuthenticated + isSeller/isDealer true ho jate hain aur normal
  // getDashboardPath() wapas asal dashboard per le jata hai.
  const isSellerProfile = !!user?.hasSellerProfile || effectiveRole === 'SELLER';
  const isDealerProfile = hasStore || effectiveRole === 'DEALER';
  const hasAnyDashboardProfile = isSellerProfile || isDealerProfile || effectiveRole === 'ADMIN';

  const dashboardHref = (() => {
    if (isAuthenticated && !hasAnyDashboardProfile) {
      return '/dashboard/new-listing'; // "Sell a Car" page
    }
    try {
      return getDashboardPath(user, store) || '/dashboard';
    } catch {
      return '/dashboard';
    }
  })();

  const handlePlus = () => {
    if (isAuthenticated && isBuyerOnly) {
      router.push(BECOME_SELLER_HREF);
      return;
    }
    setOpen((v) => !v);
  };

  const handleOption = (href) => {
    setOpen(false);
    if (!isAuthenticated) {
      setPendingRedirect(href);
      setShowAuth(true);
      return;
    }
    router.push(href);
  };

  const guardedPush = (href) => {
    if (!isAuthenticated) {
      setPendingRedirect(href);
      setShowAuth(true);
      return;
    }
    router.push(href);
  };

  if (!mounted || !_hasHydrated) return null;

  // Car detail page par neeche pehle se sticky contact bar hoti hai —
  // do bars ek doosre par chhap jati thin.
  const isCarDetail = /^\/cars\/[^/]+\/?$/.test(pathname);
  // Dashboard ke andar apna nav hota hai
  const isDashboard = pathname.startsWith('/dashboard');

  const NAV = [
    { key: 'home', label: t('nav.home'), icon: Home, href: '/' },
    { key: 'cars', label: t('nav.cars'), icon: Car, href: '/cars' },
    { key: 'plus' },
    { key: 'parts', label: t('nav.parts'), icon: Cog, href: '/spare-parts' },
    { key: 'dash', label: t('nav.dashboard'), icon: LayoutGrid, href: dashboardHref, guarded: true },
  ];

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          OPTIONS SHEET — mobile par neeche se, desktop par
          button ke upar. Ek hi list, do jagah.
          ═══════════════════════════════════════════════════ */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={() => setOpen(false)}
          />

          <div
            className="paz-post-sheet fixed z-50 flex flex-col gap-2.5
                       left-3 right-3 bottom-24
                       sm:left-auto sm:right-6 sm:bottom-24 sm:w-72"
          >
            {options.map((o) => {
              const Icon = o.icon;
              return (
                <button
                  key={o.key}
                  onClick={() => handleOption(o.href)}
                  className="flex items-center gap-3.5 rounded-2xl pl-3.5 pr-5 py-3.5 text-left transition-transform active:scale-[0.98]"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 14px 34px -14px rgba(0,0,0,0.45)',
                  }}
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(232,184,75,0.12)' }}
                  >
                    <Icon size={18} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {t(o.labelKey)}
                    </span>
                    <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {t(o.sublabelKey)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          DESKTOP — chaurha pill, neeche daayein
          ═══════════════════════════════════════════════════ */}
      {!isCarDetail && (
        <button
          onClick={handlePlus}
          aria-label={isBuyerOnly ? t('dashboard.becomeSeller') : t('sell.postAria')}
          className="hidden sm:flex fixed bottom-6 end-6 z-50 items-center gap-2.5 ps-4 pe-5 py-3.5 rounded-2xl font-bold text-sm transition-transform duration-200 active:scale-[0.97] hover:-translate-y-0.5"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: '0 14px 34px -12px rgba(232,184,75,0.65)',
          }}
        >
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-300"
            style={{
              background: 'rgba(0,0,0,0.10)',
              transform: open ? 'rotate(135deg)' : 'rotate(0deg)',
            }}
          >
            {isBuyerOnly ? <UserPlus size={14} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={3} />}
          </span>
          {isBuyerOnly ? t('dashboard.becomeSeller') : t('sell.listShort')}
        </button>
      )}

      {/* ═══════════════════════════════════════════════════
          MOBILE — neeche wala nav bar
          ═══════════════════════════════════════════════════ */}
      {!isCarDetail && !isDashboard && (
        <nav
          className="sm:hidden fixed bottom-0 left-0 right-0 z-50"
          style={{
            background: 'var(--bg-header)',
            borderTop: '1px solid var(--border-color)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -6px 24px -12px rgba(0,0,0,0.35)',
          }}
        >
          <div className="grid grid-cols-5 items-end h-[62px]">
            {NAV.map((item) => {
              /* ── Bech wala plus — utha hua ── */
              if (item.key === 'plus') {
                return (
                  <div key="plus" className="flex justify-center">
                    <button
                      onClick={handlePlus}
                      aria-label={isBuyerOnly ? t('dashboard.becomeSeller') : t('sell.postAria')}
                      className="relative -translate-y-4 rounded-2xl flex items-center justify-center transition-transform duration-200 active:scale-95"
                      style={{
                        width: 52,
                        height: 52,
                        background: 'var(--accent)',
                        color: 'var(--accent-text)',
                        boxShadow: '0 10px 26px -8px rgba(232,184,75,0.7)',
                        border: '3px solid var(--bg-header)',
                      }}
                    >
                      <span
                        className="transition-transform duration-300"
                        style={{ transform: open ? 'rotate(135deg)' : 'rotate(0deg)' }}
                      >
                        {open
                          ? <X size={22} strokeWidth={2.5} />
                          : isBuyerOnly
                          ? <UserPlus size={21} strokeWidth={2.4} />
                          : <Plus size={24} strokeWidth={3} />}
                      </span>
                    </button>
                  </div>
                );
              }

              const Icon = item.icon;
              const active = isActive(item.href);

              const inner = (
                <>
                  {/* Active ki nishani — upar chhoti gold line
                      (PakWheels neeche line lagata hai; ye us se alag hai) */}
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-7 rounded-b-full transition-opacity duration-200"
                    style={{ background: 'var(--accent)', opacity: active ? 1 : 0 }}
                  />
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.2 : 1.7}
                    style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                  />
                  <span
                    className="text-[10px] font-bold leading-none"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {item.label}
                  </span>
                </>
              );

              const cls =
                'relative h-full flex flex-col items-center justify-center gap-1.5 pt-1.5 transition-transform active:scale-95';

              // Dashboard login ke bagair nahi khulta — is liye button,
              // Link nahi (warna guest ko khali dashboard mil jata tha)
              return item.guarded ? (
                <button key={item.key} onClick={() => guardedPush(item.href)} className={cls}>
                  {inner}
                </button>
              ) : (
                <Link key={item.key} href={item.href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          message={t('common.signInFirst')}
          redirectAfter={pendingRedirect || pathname}
        />
      )}
    </>
  );
}