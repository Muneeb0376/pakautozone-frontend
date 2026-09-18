// lib/carImage.js
//
// Car images ke liye single source of truth.
//   - Cards / grid / thumbnails  -> getCarImageUrl(img)              (SAAF, koi watermark nahi)
//   - Detail page                -> getCarImageUrl(img, { watermark: true })
//
// Agar image Cloudinary par hai to watermark Cloudinary transform se lagta hai
// (download/right-click save karne par bhi rehta hai). Agar image local /uploads
// se aa rahi hai to <CarImageWithWatermark /> component CSS overlay laga deta hai.

const UPLOAD_SEGMENT = '/image/upload/';

export const WATERMARK_TEXT =
  process.env.NEXT_PUBLIC_WATERMARK_TEXT || 'Pak Auto Zone';

/** Raw string nikalta hai — chahe img string ho, ya { url } ho, ya { filename } ho. */
function toRawUrl(img) {
  if (!img) return null;
  if (typeof img === 'string') {
    return img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`;
  }
  if (img.url) return img.url;
  if (img.secure_url) return img.secure_url;
  if (img.filename) return `/uploads/${img.filename}`;
  if (img.path) return img.path;
  return null;
}

export function isCloudinary(url) {
  return typeof url === 'string' && url.includes(UPLOAD_SEGMENT);
}

/**
 * URL mein pehle se maujood koi bhi overlay (l_text: / l_<public_id>) segment
 * hata deta hai — taake purani listings ke card thumbnails bhi saaf ho jayein.
 */
function stripOverlays(rest) {
  return rest
    .split('/')
    .filter((seg) => !/(^|,)l_/.test(seg))
    .join('/');
}

/**
 * @param {object|string} img            car.carImages[0] jesa object ya string
 * @param {object}  opts
 * @param {boolean} opts.watermark       true = detail page, false = card
 * @param {number}  opts.width           max width (px)
 * @returns {string|null}
 */
export function getCarImageUrl(img, opts = {}) {
  const { watermark = false, width = watermark ? 1400 : 640 } = opts;

  const raw = toRawUrl(img);
  if (!raw) return null;

  // Cloudinary nahi hai (local /uploads) -> URL waise hi wapas, watermark CSS se lagega
  if (!isCloudinary(raw)) return raw;

  const idx = raw.indexOf(UPLOAD_SEGMENT);
  const base = raw.slice(0, idx + UPLOAD_SEGMENT.length);
  const rest = stripOverlays(raw.slice(idx + UPLOAD_SEGMENT.length));

  const parts = [`w_${width}`, 'c_limit', 'q_auto', 'f_auto'];

  if (watermark) {
    // Font size image width ke hisaab se scale hota hai, taake chhoti aur
    // bari dono images par proportionate lage.
    const fontSize = Math.max(28, Math.round(width / 18));
    parts.push(
      [
        `l_text:Arial_${fontSize}_bold:${encodeURIComponent(WATERMARK_TEXT)}`,
        'co_white',
        'o_22',
        'g_center',
      ].join(',')
    );
  }

  return `${base}${parts.join('/')}/${rest}`;
}

/** Card ke liye shortcut — hamesha saaf image. */
export const getCardImageUrl = (img, width = 640) =>
  getCarImageUrl(img, { watermark: false, width });

/** Detail page ke liye shortcut — watermark ke sath. */
export const getDetailImageUrl = (img, width = 1400) =>
  getCarImageUrl(img, { watermark: true, width });