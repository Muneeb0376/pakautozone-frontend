/**
 * ✅ SINGLE SOURCE OF TRUTH — Dashboard Redirect Logic
 *
 * Ye function poore app mein ek hi jagah decide karta hai ke
 * kisi bhi user ko login/dashboard visit ke baad kahan bhejna hai.
 *
 * Login page, dashboard/page.jsx (index router), aur dashboard/layout.jsx
 * — teeno isi function ko call karte hain. Kabhi bhi path change karna ho,
 * sirf YAHAN change karo — baar baar teen jagah fix karne ki zaroorat
 * khatam.
 *
 * ✅ PHASE 1 (already done):
 * Decision PURI TARAH `role` field par hai — ye seedha database se
 * aata hai aur kabhi undefined nahi hota. `store` param sirf
 * backward-compat ke liye rakha gaya hai — routing decision mein iska
 * koi kirdar nahi.
 *
 * ✅ PHASE 8 UPDATE — Dual Dashboard Support:
 * Ab user ke paas do ALAG ALAG aur INDEPENDENT profile flags ho saktay
 * hain (Phase 1 ke decision ke mutabiq):
 *   - `hasSellerProfile` → private-seller (cars-only, no Store) profile
 *   - `hasStore`         → showroom (Store record — cars+parts) profile
 *
 * Agar dono true hon ("dual-profile" user), to ab single fixed path
 * return nahi hota — is bar `authStore.activeDashboard`
 * ('seller' | 'showroom') check hota hai, jo Navbar ke Dashboard
 * Switcher se ya jis dashboard pe user ne last baar click kiya usi se
 * set hota hai (zustand persist ke zariye localStorage mein bhi yaad
 * rehta hai).
 *
 * Agar user dual-profile hai lekin kabhi kisi dashboard pe click/select
 * nahi kiya (activeDashboard === null — fresh dual-profile state), to
 * default 'seller' rakha gaya hai. Ye sirf ek fallback hai — chaho to
 * yahan 'showroom' bhi kar sakte ho, business logic tumhari marzi hai.
 *
 * Single-profile users (sirf SELLER, ya sirf DEALER, ya BUYER/ADMIN)
 * ka behavior bilkul waisa hi hai jaisa Phase 1 mein tha — koi extra
 * step ya switcher unke liye nahi aata.
 *
 * NOTE: `useAuthStore` ko yahan direct import kiya gaya hai taake
 * purane call-sites (login page, dashboard/page.jsx, dashboard/layout.jsx)
 * ka signature `getDashboardPath(user, store)` bilkul na badle — koi bhi
 * teen jagah dobara fix karne ki zaroorat nahi.
 */
import { useAuthStore } from '@/store/authStore';

export function getDashboardPath(user, _store) {
  if (!user) return '/login';

  const role = user.role?.toUpperCase();

  // ADMIN hamesha priority — dual-profile logic isay apply nahi hoti
  if (role === 'ADMIN') return '/admin';

  // ✅ PHASE 8 — flags independent hain `role` label se (Phase 1 decision).
  // Legacy/abhi-tak-migrate-na-hue users ke liye `role` label ko bhi
  // fallback ke taur par honor karte hain (`role === 'SELLER'` /
  // `role === 'DEALER'`) taake purana data bhi sahi route ho.
  const isSeller = !!user.hasSellerProfile || role === 'SELLER';
  const isDealer = !!user.hasStore || role === 'DEALER';

  if (isSeller && isDealer) {
    // 🔀 Dual-profile user — activeDashboard decide karta hai konsa khulay.
    let activeDashboard = null;
    try {
      activeDashboard = useAuthStore.getState().activeDashboard;
    } catch {
      // Agar kisi wajah se store abhi available na ho (e.g. SSR ke waqt),
      // safe default par gir jao.
      activeDashboard = null;
    }
    return activeDashboard === 'showroom' ? '/dashboard/showroom' : '/dashboard/seller';
  }

  if (isDealer) {
    // Showroom dealer — Store record ke sath.
    // 👉 Agar aapka asal showroom page "/dashboard/my-showroom" hai
    //    "/dashboard/showroom" ki jagah, to SIRF ye ek line badlo:
    return '/dashboard/showroom';
  }

  if (isSeller) {
    return '/dashboard/seller';
  }

  switch (role) {
    case 'BUYER':
      return '/dashboard/buyer';
    default:
      // Fallback (unknown/legacy role)
      return '/dashboard/buyer';
  }
}