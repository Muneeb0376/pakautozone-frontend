'use client';
// frontend/components/home/DealersSection.jsx
// "Verified Dealers" homepage section. Fetches its own data. Includes StoreCard sub-component.
//
// ✅ MOBILE FIX — Pehle mobile par yeh 1-column full-width stack tha (har card
//    poori width le kar bohot lamba scroll ban jata tha). Ab mobile par horizontal
//    scroll row hai — cards fixed compact width ke, side se scroll karein.
//    sm+ (tablet/desktop) par grid pehle jaisa hi hai.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';
import { API, getImg } from './homeConstants';

export default function DealersSection() {
  const router = useRouter();
  const { t } = useLang();
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetch(`${API}/stores?limit=4`)
      .then(r => r.json())
      .then(d => setStores(Array.isArray(d) ? d : (d.data || d.stores || [])))
      .catch(() => {});
  }, []);

  if (stores.length === 0) return null;

  return (
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-10 sm:py-16 px-4 bg-page-base">
        {/* ━━━━━━ VERIFIED DEALERS ━━━━━━ */}
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-5 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-theme-primary">{t('home.verifiedDealersHeading')}</h2>
                <p className="text-theme-muted text-xs sm:text-sm mt-1">{t('home.verifiedDealersSub')}</p>
              </div>
              <button
                onClick={() => router.push('/stores')}
                className="text-amber-500 hover:text-amber-400 text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors shrink-0"
              >
                {t('home.viewAllDealers')} <ArrowRight size={14} />
              </button>
            </div>

            {/* ── MOBILE: horizontal scroll ── */}
            <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 no-scrollbar">
              {stores.map(store => (
                <div key={store.id} className="flex-shrink-0 w-[78vw] max-w-[300px] snap-start">
                  <StoreCard store={store} onClick={() => router.push(`/stores/${store.slug}`)} />
                </div>
              ))}
            </div>

            {/* ── TABLET/DESKTOP: grid ── */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stores.map(store => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onClick={() => router.push(`/stores/${store.slug}`)}
                />
              ))}
            </div>
          </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        </section>
  );
}

// ─── STORE CARD ───────────────────────────────────────────
function StoreCard({ store, onClick }) {
  const { t } = useLang();
  const logoUrl = getImg(store.logo);
  const initial = (store.name || 'S')[0].toUpperCase();

  return (
    <div
      onClick={onClick}
      className="w-full bg-surface border border-theme rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-surface-alt flex items-center justify-center shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt={store.name} className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <span className="font-black text-theme-secondary text-base sm:text-lg">{initial}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-bold text-theme-primary text-sm truncate">{store.name}</p>
          {store.isVerified && <span className="text-emerald-500 text-xs shrink-0">✓</span>}
        </div>
        <p className="text-xs text-theme-muted flex items-center gap-0.5 mt-0.5 truncate">
          <MapPin size={10} className="shrink-0" /> {store.city || 'Pakistan'}
          <span className="ml-1">· {store._count?.cars ?? store.carCount ?? 0} {t('common.cars')}</span>
        </p>
      </div>
    </div>
  );
}