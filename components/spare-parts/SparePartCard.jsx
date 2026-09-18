// frontend/components/dashboard/DashboardSparePartCard.jsx
'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Pencil, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/lib/partHelpers';
import { useLang } from '@/lib/i18nContext';

export default function DashboardSparePartCard({ part, index = 0, onDeleted }) {
  const router = useRouter();
  const { t } = useLang();
  const [deleting, setDeleting] = useState(false);

  // ✅ PHASE 10 — 3D tilt (same lightweight pattern as CarCard)
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  const imgUrl = getImageUrl(part.images?.[0]?.url);

  const handleEdit = (e) => {
    e.stopPropagation();
    router.push(`/dashboard/spare-parts/${part.id}/edit`);
  };

  // ✅ Card pe click karne se part ki details/image wali page khulti hai.
  // Edit/Remove buttons apna alag stopPropagation rakhte hain taake card
  // click trigger na ho un buttons pe click karte waqt.
  const handleCardClick = () => {
    router.push(`/spare-parts/${part.id}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const confirmed = window.confirm(t('parts.deleteConfirm', { name: part.name || t('parts.unnamed') }));
    if (!confirmed) return;

    setDeleting(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch(`${API}/parts/${part.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('parts.deleteFailed'));
      }

      onDeleted?.(part.id);
    } catch (err) {
      console.error('❌ Error deleting part:', err);
      alert(t('parts.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-card glow-hover tilt-3d rounded-2xl overflow-hidden group flex flex-col cursor-pointer"
      style={{ animation: `slideUp 0.5s ease-out ${index * 50}ms backwards` }}
    >
      {/* Image — poori image (bina crop) dikhti hai, lekin agar image ka
          aspect-ratio square se match na kare to bhi koi khaali/white gap
          nazar nahi aata: peechhe ussi image ka blurred + zoomed version
          background ki tarah bhar deta hai, aur asli image uske upar
          "contain" ke sath poori dikhti hai. */}
      <div className="aspect-square bg-slate-900 relative overflow-hidden">
        {imgUrl ? (
          <>
            <img
              src={imgUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
            />
            <img
              src={imgUrl}
              alt={part.name || t('parts.title')}
              className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Package size={32} />
          </div>
        )}

        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-white">
          {part.condition || t('common.used')}
        </div>

        {part.category && (
          <div className="absolute bottom-2 left-2 bg-cyan-500/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-semibold capitalize text-white">
            {part.category}
          </div>
        )}

        {/* Active/Inactive status, agar aapke schema mein field ho */}
        {part.isActive === false && (
          <div className="absolute top-2 left-2 bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-white">
            {t('common.inactive')}
          </div>
        )}
      </div>

      {/* Info Section — name/price khaali ho tab bhi card blank nahi
          dikhega, hamesha readable fallback text show hoga */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2">
            {part.name || t('parts.unnamed')}
          </h3>
          <p className="text-lg font-bold text-cyan-400 mt-2">
            {part.price != null && !Number.isNaN(Number(part.price))
              ? `PKR ${Number(part.price).toLocaleString()}`
              : t('parts.priceOnRequest')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MapPin size={12} />
          {part.store?.city || part.city || 'Pakistan'}
        </div>

        {/* Edit / Delete Buttons — dealer ke liye */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 mt-2">
          <button
            onClick={handleEdit}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white py-2 px-2 rounded-lg font-bold text-[11px] transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Pencil size={13} />
            <span>{t('common.edit')}</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white py-2 px-2 rounded-lg font-bold text-[11px] transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash2 size={13} />
            <span>{deleting ? t('common.deleting') : t('common.remove')}</span>
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