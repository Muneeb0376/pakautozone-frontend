// frontend/components/dashboard/DashboardSparePartCard.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Pencil, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/lib/partHelpers';
import { getCleanToken } from '@/lib/auth';
import { useLang } from '@/lib/i18nContext';

// Part ki condition DB mein enum hoti hai — yahan sirf i18n key rakhi hai
// taake teeno zabanon mein sahi lafz nikle.
const PART_CONDITION_KEYS = {
  NEW: 'common.new',
  USED: 'common.used',
  REFURBISHED: 'parts.refurbished',
  new: 'common.new',
  used: 'common.used',
};

export default function DashboardSparePartCard({ part, index = 0, delay, onDeleted, onView }) {
  const router = useRouter();
  const { t } = useLang();
  const [deleting, setDeleting] = useState(false);

  const imgUrl = getImageUrl(part.images?.[0]?.url);
  const animDelay = delay ?? index * 40;

  const handleEdit = () => {
    router.push(`/dashboard/spare-parts/${part.id}/edit`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('parts.deleteConfirm', { name: part.name }));
    if (!confirmed) return;

    setDeleting(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      // ✅ PHASE 8 FIX: 'token' localStorage key wajood hi nahi rakhta —
      // isi wajah se Delete hamesha 401 (Unauthorized) fail hota tha kyunke
      // DELETE /api/parts/:id backend par authenticate+requireVerified
      // middleware laga hai. getCleanToken() Zustand 'auth-storage' se
      // asal token nikalta hai (jaisa baaki app me hota hai).
      const token = getCleanToken();

      const res = await fetch(`${API}/parts/${part.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('dashboard.ui.partDeleteFailed'));
      }

      onDeleted?.(part.id);
    } catch (err) {
      console.error('❌ Error deleting part:', err);
      alert(t('parts.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleCardClick = () => {
    onView?.(part);
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
      style={{ animation: `slideUp 0.4s ease-out ${animDelay}ms backwards` }}
      className="bg-white/3 border border-white/8 rounded-xl sm:rounded-2xl overflow-hidden hover:border-cyan-400/30 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex"
    >
      {/* Image — chhota fixed-size thumbnail, ab poori card ka width/height nahi leti */}
      <div className="relative w-20 h-20 sm:w-32 sm:h-28 shrink-0 bg-slate-900 overflow-hidden">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={part.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Package size={22} className="sm:w-7 sm:h-7 text-slate-700" />
          </div>
        )}

        {part.isActive === false && (
          <div className="absolute top-1 start-1 bg-red-500/85 backdrop-blur px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-white">
            {t('common.inactive')}
          </div>
        )}

        {part.category && (
          <div className="absolute bottom-1 start-1 bg-cyan-500/85 backdrop-blur px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold capitalize text-white truncate max-w-[90%]">
            {part.category}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 sm:p-4 flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="font-bold text-[11px] sm:text-sm text-white truncate">
              {part.name}
            </h3>
            <span className="shrink-0 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border bg-white/8 text-slate-300 border-white/10">
              {t(PART_CONDITION_KEYS[part.condition] || 'common.used')}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1">
            <MapPin size={9} /> {part.store?.city || part.city || t('common.pakistan')}
          </div>

          <p className="text-[12px] sm:text-lg font-black text-cyan-400 mt-0.5 sm:mt-1">
            {t('common.pkr')} {Number(part.price).toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleEdit(); }}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-[9px] sm:text-xs font-semibold py-1 sm:py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pencil size={10} /> {t('common.edit')}
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 border border-red-400/25 hover:bg-red-500/20 text-red-400 text-[9px] sm:text-xs font-semibold py-1 sm:py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={10} />             {deleting ? t('common.deleting') : t('common.remove')}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}