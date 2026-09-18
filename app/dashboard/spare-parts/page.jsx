// frontend/app/dashboard/spare-parts/page.jsx
'use client';
import { useLang } from '@/lib/i18nContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getCleanToken } from '@/lib/auth';
import DashboardSparePartCard from '@/components/dashboard/DashboardSparePartCard';
import PartDetailModal from '@/components/dashboard/PartDetailModal';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function DashboardSparePartsPage() {
  const { t } = useLang();
  const router = useRouter();
  const { user, store } = useAuthStore();

  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState(null); // 👈 modal ke liye

  useEffect(() => {
    if (!store?.id) return; // store abhi load nahi hui
    fetchMyParts();
  }, [store?.id]);

  const fetchMyParts = async () => {
    setLoading(true);
    try {
      // ✅ PHASE 8 FIX: 'token' key kabhi bhi localStorage me alag se save nahi
      // hoti — authStore ka Zustand persist key 'auth-storage' hai (JSON
      // { state: { token, ... } }). getCleanToken() wahi sahi tareeqe se
      // parhta hai (dekho lib/auth.js). Purana localStorage.getItem('token')
      // hamesha null deta tha.
      const token = getCleanToken();

      // ✅ IMPORTANT: sirf isi store ke parts fetch karo, sab nahi
      const res = await fetch(`${API}/parts?storeId=${store.id}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();

      const data = json.data || json || [];
      setParts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error fetching my parts:', err);
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleted = (deletedId) => {
    setParts((prev) => prev.filter((p) => p.id !== deletedId));
    // agar deleted part hi modal mein khula hai to modal band kar do
    setSelectedPart((prev) => (prev?.id === deletedId ? null : prev));
  };

  return (
    // ✅ THEME FIX: pehle "bg-slate-950 text-white" + blue-cyan-emerald top
    // bar hardcoded thi — listings page ki tarah ye bhi theme toggle ko
    // ignore kar rahi thi. Ab showroom/listings jaisa hi --bg-dash-page /
    // --text-primary token system use ho raha hai.
    <div className="min-h-screen" style={{ background: 'var(--bg-dash-page)', color: 'var(--text-primary)' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-extrabold leading-snug break-words" style={{ color: 'var(--text-primary)' }}>
              🔧 {t('dashboard.ui.mySpareParts')}
            </h1>
            <p className="text-[10px] sm:text-sm mt-0.5 sm:mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.ui.partsListed', { count: parts.length })}{store?.name ? ` · ${store.name}` : ''}
            </p>
          </div>
          <Link
            href="/dashboard/spare-parts/add"
            className="flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap hover:scale-[1.02]"
            style={{ background: 'var(--bg-dash-new-btn)', color: 'var(--text-dash-new-btn)', boxShadow: 'var(--card-shadow)' }}
          >
            <Plus size={13} className="sm:w-4 sm:h-4" /> {t('dashboard.ui.addPart')}
          </Link>
        </div>

        {/* ── Parts Grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-24">
            <div
              className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : parts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
            {parts.map((part, idx) => (
              <DashboardSparePartCard
                key={part.id}
                part={part}
                index={idx}
                delay={idx * 40}
                onDeleted={handleDeleted}
                onView={setSelectedPart}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedPart && (
        <PartDetailModal part={selectedPart} onClose={() => setSelectedPart(null)} />
      )}
    </div>
  );
}

// ── Empty State ──
function EmptyState() {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
      <div
        className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center mb-3.5 sm:mb-5"
        style={{ background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)' }}
      >
        <Package size={24} className="sm:w-8 sm:h-8" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="font-bold text-[13px] sm:text-base mb-1.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>
        {t('dashboard.ui.noParts')}
      </h3>
      <p className="text-[11px] sm:text-sm mb-4.5 sm:mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
        {t('dashboard.ui.firstPartHint')}
      </p>
      <Link
        href="/dashboard/spare-parts/add"
        className="flex items-center gap-1.5 sm:gap-2 font-bold text-[11px] sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl"
        style={{ background: 'var(--bg-dash-new-btn)', color: 'var(--text-dash-new-btn)', boxShadow: 'var(--card-shadow)' }}
      >
        <Plus size={13} className="sm:w-4 sm:h-4" /> {t('dashboard.ui.firstPart')}
      </Link>
    </div>
  );
}