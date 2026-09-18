// frontend/lib/blogHelpers.js
//
// Chhote pure functions jo client aur server dono taraf chalte hain.
// Yahan koi hook, koi 'use client', koi import nahi — isliye Server Component
// aur Client Component dono isay safely import kar sakte hain.

/**
 * Admin editor ke category dropdown aur public filter bar — dono ek hi list
 * se chalte hain, taake spelling kabhi mismatch na ho.
 * Nayi category chahiye? Sirf yahan add karein.
 */
export const BLOG_CATEGORIES = [
  'Reviews',
  'Buying Guides',
  'News',
  'Comparisons',
  'Maintenance & Tips',
];

/** HTML se plain text (word count / preview ke liye) */
export const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/** Content ke words ginta hai */
export const wordCount = (html) => {
  const text = stripHtml(html);
  return text ? text.split(/\s+/).length : 0;
};

/**
 * Reading time — 200 words per minute. DB mein store nahi hota, har dafa
 * content se nikal aata hai (roadmap ka faisla).
 * @returns {number} minutes, kam se kam 1
 */
export const readingTime = (html) => Math.max(1, Math.round(wordCount(html) / 200));

/**
 * Date ko "12 Aug 2026" shakal mein.
 * Server aur client dono par same output aaye is liye 'en-GB' fix kiya hai —
 * warna hydration mismatch warning aati hai.
 */
export const formatBlogDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** SEO / JSON-LD ke liye ISO date */
export const toIsoDate = (dateStr) => {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/**
 * Card par dikhane ke liye chhota excerpt. DB ka excerpt na ho to content se.
 */
export const previewText = (blog, max = 150) => {
  const base = blog?.excerpt?.trim() || stripHtml(blog?.content || '');
  if (!base) return '';
  return base.length > max ? `${base.slice(0, max - 3).trim()}...` : base;
};

/**
 * Featured image na ho to card khali/tooti hui na lage — ek halka gradient
 * placeholder use hota hai. `null` wapas aane par component apna fallback
 * block dikhata hai.
 */
export const blogImage = (blog) => blog?.featuredImage || null;