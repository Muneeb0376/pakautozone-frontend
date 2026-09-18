'use client';
import { useLang } from '@/lib/i18nContext';
// components/CarImageWithWatermark.jsx
//
// SIRF car detail page ke liye. Cards mein ye component use NA karein —
// wahan seedha getCardImageUrl() se saaf image dikhayein.

import { getCarImageUrl, isCloudinary, WATERMARK_TEXT } from '@/lib/carImage';

export default function CarImageWithWatermark({
  img,
  alt = 'Car image',
  width = 1400,
  className = '',
  imgClassName = '',
  priority = false,
}) {
  const { t } = useLang();
  const src = getCarImageUrl(img, { watermark: true, width });
  if (!src) return null;

  // Cloudinary par watermark URL transform se lag chuka hai.
  // Local /uploads images par CSS overlay chahiye.
  const needsCssOverlay = !isCloudinary(src);

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-full object-contain ${imgClassName}`}
      />

      {needsCssOverlay && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="text-white/35 font-bold tracking-wide whitespace-nowrap
                       text-2xl sm:text-4xl md:text-5xl -rotate-[25deg]
                       [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]"
          >
            {WATERMARK_TEXT}
          </span>
        </div>
      )}
    </div>
  );
}