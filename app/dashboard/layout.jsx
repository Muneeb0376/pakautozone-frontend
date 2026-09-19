//frontend/app/dashboard/layout.jsx//
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import ShowroomPaymentBanner from '@/components/dashboard/ShowroomPaymentBanner';
import { getDashboardPath } from '@/lib/getDashboardPath';
import { useLang } from '@/lib/i18nContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * ✅ PHASE 12 FIX — "register-showroom → showroom flash" bug (unchanged, see below)
 * ✅ PHASE 13 FIX — "spare-parts bina payment ke khul rahi thi" bug
 *
 * ROOT CAUSE: Payment/subscription status sirf ShowroomPaymentBanner mein
 * fetch hoti thi aur sirf ek WARNING BANNER dikhati thi — koi route
 * actually BLOCK nahi hoti thi. Cars listings shayad backend se implicitly
 * gated thi, lekin spare-parts route/API mein wo check hi missing tha —
 * isliye spare-parts bina payment ke khul rahi thi.
 *
 * FIX: Ab subscription-status yahan (layout — jo har dashboard route ke
 * upar wrap hota hai) fetch hoti hai, aur guard-decision mein use hoti
 * hai. Jab tak showroom ki payment active na ho, '/listings',
 * '/new-listing', aur '/spare-parts' (sab sub-paths samet) — dono
 * consistently BLOCKED rahenge, aur user ko clear "Payment Pending"
 * message dikhega (chahe wo direct URL type kare ya kisi bhi button se
 * aaye).
 */
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, store, token, _hasHydrated } = useAuthStore();
  const { t } = useLang();

  // ── NEW: showroom subscription/payment status ──
  const [subStatus, setSubStatus] = useState(null); // null = abhi fetch nahi hui / fail hui
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated || !token) return;
    setSubLoading(true);
    fetch(`${API}/payments/subscription-status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((json) => setSubStatus(json.data))
      .catch(() => setSubStatus(null))
      .finally(() => setSubLoading(false));
  }, [_hasHydrated, token]);

  // ── Guard decision — computed FRESH on every single render ──
  const decision = (() => {
    if (!_hasHydrated) return { status: 'loading' };

    if (!isAuthenticated || !user) {
      return { status: 'redirect', to: '/login' };
    }

    const role = user.role?.toUpperCase();

    const isSeller = !!(user.hasSellerProfile || role === 'SELLER');
    const isDealer = !!(user.hasStore || store?.isShowroom || role === 'DEALER');

    // ✅ PHASE 14 FIX — "listingType stale rehta tha jab tak logout/login na karo" bug
    //
    // ROOT CAUSE: `store` yahan Zustand persisted authStore se aa raha hai —
    // yeh sirf LOGIN ke waqt backend se fetch hoti hai aur phir localStorage
    // mein cache ho jati hai. Agar admin baad mein showroom ka listingType
    // 'CARS' → 'BOTH' update kare, authStore ko koi idea nahi hota — jab tak
    // user manually logout → login na kare, cached (purani) value hi use
    // hoti rehti hai, aur is layout ka guard usi purani value par decision
    // leta hai (isliye 'CARS' samajh kar spare-parts block ho jata tha).
    //
    // FIX: Layout already har mount par `/payments/subscription-status`
    // fresh fetch karta hai (payment gate ke liye) — yeh backend se live data
    // hai, cached nahi. Agar wo response listingType bhi return karti hai
    // (ya karne ke liye update ki jaye), use PEHLE priority do — cached
    // authStore listingType sirf fallback ke tor par (jab tak fresh fetch
    // abhi loading ho) use hoga. Isse admin ka update turant reflect hoga,
    // bina logout/login kiye.
    //
    // ⚠️ NOTE: Backend `/payments/subscription-status` route (payments
    // controller) ko check/update karo ke response `data.listingType` bhi
    // include kare (showroom table se). Agar wo field abhi nahi bhej raha,
    // to yeh line abhi bhi cached value par hi fallback karegi — is case
    // mein backend route update karna zaroori hai taake fix mukammal ho.
    const listingType =
      subStatus?.listingType ?? store?.listingType ?? user?.store?.listingType ?? 'BOTH';

    // ── ADMIN ──────────────────────────────────────────────
    if (role === 'ADMIN') {
      return { status: 'ok' };
    }

    // ── registered dealer kabhi bhi register-showroom form na dekhe ──
    if (isDealer && pathname === '/dashboard/register-showroom') {
      return { status: 'redirect', to: '/dashboard/showroom' };
    }

    // ── BUYER ───────────────────────────────────────────────
    if (!isSeller && !isDealer) {
      // ✅ FIX: '/new-listing' ("Sell a Car" page) buyer ke liye ab
      // restricted NAHI hai — mobile bottom-nav ke "Dashboard" button se
      // aisay buyer ko seedha isi page par bheja jata hai jisne abhi tak
      // seller/showroom register nahi kiya. Pehle ye path bhi
      // buyerRestricted mein tha, is liye layout turant '/dashboard/buyer'
      // (purana/hataya hua page) par wapas bhej deta tha — is fix ko yahan
      // override kar raha tha.
      const buyerRestricted = ['/seller', '/showroom', '/my-showroom', '/listings', '/spare-parts', '/analytics'];
      if (buyerRestricted.some((path) => pathname?.includes(path))) {
        return { status: 'redirect', to: '/dashboard/buyer' };
      }
      if (pathname === '/dashboard') {
        return { status: 'redirect', to: '/dashboard/buyer' };
      }
      return { status: 'ok' };
    }

    // ── SELLER-ONLY ─────────────────────────────────────────
    if (isSeller && !isDealer) {
      if (pathname === '/dashboard') {
        return { status: 'redirect', to: '/dashboard/seller' };
      }
    }

    // ── DEALER-ONLY ─────────────────────────────────────────
    if (isDealer && !isSeller) {
      if (pathname === '/dashboard') {
        return { status: 'redirect', to: getDashboardPath(user, store) };
      }
    }

    // ── DUAL-PROFILE ────────────────────────────────────────
    if (isSeller && isDealer) {
      if (pathname === '/dashboard') {
        return { status: 'redirect', to: getDashboardPath(user, store) };
      }
    }

    // ── Showroom listingType restrictions (sirf isDealer users) ──
    if (isDealer) {
      // ✅ PHASE 15 FIX — race condition: "DB mein BOTH hai phir bhi
      // spare-parts se turant redirect ho jata tha"
      //
      // ROOT CAUSE: `listingType` ab fresh `subStatus` (jab wo load ho
      // chuki ho) se aata hai, lekin PEHLE render par `subStatus` abhi
      // `null` hota hai (fetch shuru hi hui hoti hai) — is waqt
      // `listingType` cached/stale authStore value par fallback hota
      // hai (jo 'CARS' ho sakti hai). Neeche wala check turant chalta
      // tha aur is stale value ke bharose FORAN redirect kar deta tha —
      // fresh fetch complete hone se pehle hi. Isliye DB mein 'BOTH'
      // hone ke bawajood user hamesha showroom par wapas bhej diya
      // jata tha.
      //
      // FIX: Jab tak fresh subscription-status fetch loading mein hai
      // AUR current path listingType-sensitive hai, guard ko 'loading'
      // par rakho — decision tab tak mat lo jab tak asli/taaza
      // listingType na mil jaye.
      const listingTypeSensitivePaths = ['/spare-parts', '/new-listing', '/listings'];
      const touchesListingTypeRestriction = listingTypeSensitivePaths.some((p) => pathname?.includes(p));

      if (touchesListingTypeRestriction && subLoading) {
        return { status: 'loading' };
      }

      if (listingType === 'CARS' && pathname?.includes('/spare-parts')) {
        return { status: 'redirect', to: getDashboardPath(user, store) };
      }
      if (listingType === 'PARTS') {
        const partsOnlyRestricted = ['/new-listing', '/listings'];
        if (partsOnlyRestricted.some((path) => pathname?.includes(path))) {
          return { status: 'redirect', to: getDashboardPath(user, store) };
        }
      }

      // ✅ PAYMENT GATE — cars + spare-parts dono, jab tak paid na ho
      const paymentGatedPaths = ['/listings', '/new-listing', '/spare-parts'];
      const needsPaymentGate = paymentGatedPaths.some((p) => pathname?.includes(p));

      if (needsPaymentGate) {
        // subLoading already handled above (touchesListingTypeRestriction
        // covers the same paths), so subStatus is guaranteed fresh here.
        // ✅ FIX: `subStatus.isActive` Subscription table ka status hai —
        // showroom ke live hone ka sahi signal `isLive` (store.isActive)
        // hai, jo admin approval ke baad backend already bhejta hai.
        // Pehle yahan `isActive` check hone ki wajah se admin-approved,
        // fully live showroom bhi hamesha "Payment Pending" par block
        // ho jata tha aur listings/spare-parts kabhi khulti hi nahi thin.
        const isPaid = !!subStatus?.isLive;
        if (!isPaid) {
          return { status: 'blocked' };
        }
      }
    }

    return { status: 'ok' };
  })();

  useEffect(() => {
    if (decision.status === 'redirect') {
      router.replace(decision.to);
    }
  }, [decision.status, decision.to, router]);

  if (decision.status === 'loading' || decision.status === 'redirect') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  // ✅ NEW: Payment-blocked screen — na cars listings na spare-parts
  // dikhengi, sirf clear message + "Payment Karein" button.
  if (decision.status === 'blocked') {
    return (
      <div>
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center bg-slate-950 px-4">
          <div className="max-w-md w-full text-center bg-white/5 border border-amber-400/20 rounded-2xl p-8">
            <p className="text-amber-400 font-bold text-lg mb-2">⚠️ {t('dashboard.paymentPending')}</p>
            <p className="text-slate-300 text-sm mb-6">
              {t('dashboard.paymentPendingBody')}
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20"
            >
              {t('dashboard.payNow')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isShowroomDashboard =
    pathname === '/dashboard/showroom' || pathname?.startsWith('/dashboard/showroom/');

  return (
    <div>
      <Navbar />
      {isShowroomDashboard && <ShowroomPaymentBanner />}
      <main>{children}</main>
    </div>
  );
}