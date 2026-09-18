// frontend/components/dashboard/PartDetailModal.jsx
'use client';
import { useLang } from '@/lib/i18nContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, MapPin, Package, Pencil, Tag, Layers } from 'lucide-react';
import { getImageUrl } from '@/lib/partHelpers';

export default function PartDetailModal({ part, onClose }) {
  const { t } = useLang();
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);

  // Modal khulte hi active image reset karo, aur Escape key se close karo
  useEffect(() => {
    setActiveImg(0);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    // background scroll lock
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [part, onClose]);

  if (!part) return null;

  const images = part.images?.length ? part.images : [];
  const mainImg = images.length ? getImageUrl(images[activeImg]?.url) : null;

  const handleEdit = () => {
    onClose?.();
    router.push(`/dashboard/spare-parts/${part.id}/edit`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-slate-950/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-cyan-300 rounded-full p-2 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image side */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 md:rounded-l-2xl">
            <div className="aspect-square relative">
              {mainImg ? (
                <img src={mainImg} alt={part.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-500/30">
                  <Package size={48} />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImg === i ? 'border-cyan-400' : 'border-white/10 hover:border-cyan-400/50'
                    }`}
                  >
                    <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info side */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white pr-8">{part.name}</h2>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-2">
                PKR {Number(part.price).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {part.condition && (
                <span className="flex items-center gap-1 bg-white/5 border border-white/10 text-slate-200 px-3 py-1 rounded-lg text-xs font-semibold">
                  <Tag size={12} className="text-cyan-400" /> {part.condition}
                </span>
              )}
              {part.category && (
                <span className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-3 py-1 rounded-lg text-xs font-semibold capitalize">
                  <Layers size={12} /> {part.category}
                </span>
              )}
              {part.isActive === false && (
                <span className="bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-1 rounded-lg text-xs font-semibold">{t('common.inactive')}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={14} className="text-cyan-400" />
              {part.store?.city || part.city || 'Pakistan'}
            </div>

            {part.brand && (
              <div className="text-sm flex items-center gap-1.5">
                <span className="text-slate-400">{t('dashboard.ui.brandLabel')}</span>
                <span className="font-semibold text-white">{part.brand}</span>
              </div>
            )}

            {part.compatibility && (
              <div className="text-sm flex items-center gap-1.5">
                <span className="text-slate-400">{t('dashboard.ui.compatibleWith')}</span>
                <span className="font-semibold text-white">{part.compatibility}</span>
              </div>
            )}

            {part.description && (
              <div className="pt-1">
                <p className="text-sm text-slate-400 mb-1">{t('common.description')}</p>
                <p className="text-sm text-slate-200 whitespace-pre-line">{part.description}</p>
              </div>
            )}

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handleEdit}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all mt-4"
              >
                <Pencil size={14} /> {t('dashboard.ui.editPart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}