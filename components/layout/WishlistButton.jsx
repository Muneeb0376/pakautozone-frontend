'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useEffect } from 'react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useLang } from '@/lib/i18nContext';

// 3D + lighting-effect wishlist icon button — Navbar me notification bell
// ke pass laga sakte hain. Count badge live wishlistStore se aata hai,
// is liye jaise hi koi car add/remove ho, badge khud-ba-khud update hoga.
//
// ✅ BUG FIX — badge kabhi kabhi navbar se bilkul detach ho kar screen ke
// top-right corner mein chala jata tha. Root cause: styled-jsx apni CSS
// rules ko ek scoped hash class (jsx-xxxxxxxx) ke through match karta hai.
// Kisi wajah se (dev-server hot-reload / hydration timing) ye <Link>
// element kabhi kabhi wo hash class miss kar deta tha, is liye
// `.wishlist-btn-3d { position: relative }` wala rule apply hi nahi hota
// tha is element par. Jab parent 'position: relative' nahi hota, to uske
// andar wala `.wishlist-badge` (jo position: absolute hai) apna nearest
// positioned ancestor DHOONDTA hai — jo yahan sticky Navbar ban jata tha —
// aur badge Navbar ke corner mein jaake chipak jata tha, heart icon se
// bilkul door.
// FIX: `position: relative` ab ek plain Tailwind class (`relative`) se
// bhi force kiya gaya hai, jo styled-jsx scoping quirk se bilkul immune
// hai — chahe scoped hash class mismatch ho ya na ho, ye hamesha apply
// hoga. Badge ab guaranteed hamesha heart icon ke upar hi rahega.
export default function WishlistButton() {
  // ✅ CHANGED — badge ab total saved-cars count (ids.size) nahi, balke
  // unseenCount dikhata hai. Ye "notification" jaisa behave karta hai:
  // naya add hone par badhta hai, aur sirf /wishlist page khulne par
  // (markWishlistSeen ke through) clear hota hai — chahe wishlist mein
  // abhi bhi cars saved hon.
  const unseenCount = useWishlistStore((s) => s.unseenCount);
  const { t } = useLang();
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <Link href="/wishlist" className="wishlist-btn-3d relative" aria-label={t('nav.wishlist')}>
      <Heart size={20} className="wishlist-heart-icon" strokeWidth={2} />
      {unseenCount > 0 && (
        <span className="wishlist-badge">{unseenCount > 99 ? '99+' : unseenCount}</span>
      )}

      <style jsx>{`
        .wishlist-btn-3d {
          /* position: relative is now also set via the Tailwind "relative"
             class above (defensive fix — see comment above the component).
             Kept here too so nothing else about the styling changes. */
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(145deg, #232838, #14171f);
          box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          transform-style: preserve-3d;
          cursor: pointer;
        }

        .wishlist-btn-3d:hover {
          transform: translateY(-3px) scale(1.07) rotateX(8deg);
          box-shadow:
            0 10px 20px rgba(255, 140, 0, 0.3),
            0 0 22px rgba(255, 90, 90, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .wishlist-btn-3d:active {
          transform: translateY(0) scale(0.95);
        }

        .wishlist-heart-icon {
          color: #ff6b6b;
          filter: drop-shadow(0 0 2px rgba(255, 107, 107, 0.55));
          transition: filter 0.25s ease, transform 0.25s ease;
        }

        .wishlist-btn-3d:hover .wishlist-heart-icon {
          filter: drop-shadow(0 0 9px rgba(255, 107, 107, 0.95));
          transform: scale(1.12);
        }

        .wishlist-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ff9500, #ff5e00);
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(255, 140, 0, 0.85), 0 0 2px rgba(0, 0, 0, 0.4);
          animation: wishlist-pulse 1.8s infinite;
        }

        @keyframes wishlist-pulse {
          0%,
          100% {
            box-shadow: 0 0 6px rgba(255, 140, 0, 0.6);
          }
          50% {
            box-shadow: 0 0 14px rgba(255, 140, 0, 0.95);
          }
        }
      `}</style>
    </Link>
  );
}