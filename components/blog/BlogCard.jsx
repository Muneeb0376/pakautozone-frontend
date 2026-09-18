'use client';
// frontend/components/blog/BlogCard.jsx
//
// ✅ POORI FILE REPLACE — Issue 1 ka doosra hissa
//
// Aap ka point: "main blog page par ik professional type card hona chahiye
// jis mein blog ke baare mein description ho aur thori si detail — jaise main
// page par hai — proper light/dark shades ke sath, aur cartoonish shades hata
// kar realistic".
//
// Kya badla:
//   • HERO card ab poori tarah information wala hai: category, date, reading
//     time, views, author, aur ek 3-line description — yani reader ko click
//     karne se pehle hi pata chal jaye ke andar kya hai.
//   • Image par ek halka gradient scrim (neeche se upar) — flat cartoon block
//     ki bajaye asli magazine cover jaisi depth.
//   • Shadow ab do parton mein hai (halki ambient + tez contact shadow) —
//     yehi cheez flat/cartoon aur realistic ka farq banati hai.
//   • Category badge ab solid amber block nahi (wo cartoon sticker jaisa
//     lagta tha); ab glass/tint badge hai jo dono themes mein baith-ta hai.
//   • Hover par card sirf 2px uthta hai aur image halki si zoom hoti hai —
//     bouncy cartoon animation nahi.
//   • Sab rang var(--*) se — light/dark automatic.
//
// Teen shakalein, ek hi component:
//   variant="hero"    → sab se upar wala bara card
//   variant="default" → aam grid card
//   variant="compact" → category rows ka chhota card

import Link from 'next/link';
import { Clock, Calendar, Eye, ArrowRight, User, FileText } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';
import { formatBlogDate, readingTime, previewText } from '@/lib/blogHelpers';

/* ✅ PHASE 3 — Aap ne kaha: "jab blog published ho to 'Published by admin'
   aata hai, wo 'Published by PAK AUTO ZONE' aana chahiye."

   Wajah: backend har blog ko us admin user se jorta hai jis ne likha
   (`blog.author.name`), aur wo naam seedha screen par chhap jata tha —
   yani aap ka apna user-name public ho jata tha. Blog company ki taraf
   se hota hai, kisi ek shakhs ki taraf se nahi.

   Ab hamesha brand ka naam dikhta hai. `blog.author` ab bhi database
   mein mojood rehta hai (admin panel ke liye kaam aata hai) — bas
   public par nazar nahi aata. */
const PUBLISHER = 'Pak Auto Zone';

const tx = (t, key, fallback) => {
  const out = t(key);
  return !out || out === key ? fallback : out;
};

/* ─── Cover — image ya saaf placeholder ─── */
function Cover({ blog, eager = false, scrim = false }) {
  if (blog.featuredImage) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={blog.featuredImage}
          alt={blog.title || ''}
          loading={eager ? 'eager' : 'lazy'}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        {/* Scrim — image ke neeche halka andhera, taake badge/text parha jaye
            aur photo flat sticker ki bajaye asli cover jaisi lagay */}
        {scrim && (
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 45%, transparent 70%)' }}
          />
        )}
      </>
    );
  }

  // Koi featured image nahi — bara harf nahi (wo cartoon lagta tha),
  // balke ek saaf document icon aur halka texture.
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background:
          'radial-gradient(120% 120% at 30% 20%, var(--bg-surface-alt) 0%, var(--card-bg) 70%)',
      }}
    >
      <FileText size={30} strokeWidth={1.2} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
    </div>
  );
}

/* ─── Category badge — tint, solid block nahi ─── */
function CategoryBadge({ category, onImage = false }) {
  if (!category) return null;

  return (
    <span
      className="inline-flex items-center text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm"
      style={
        onImage
          ? {
              background: 'rgba(10,10,10,0.55)',
              color: '#f0d79a',
              border: '1px solid rgba(232,184,75,0.35)',
            }
          : {
              background: 'rgba(232,184,75,0.12)',
              color: 'var(--accent)',
              border: '1px solid rgba(232,184,75,0.3)',
            }
      }
    >
      {category}
    </span>
  );
}

/* ─── Meta row ─── */
function Meta({ blog, minutes, t, compact = false, showAuthor = false }) {
  const size = compact ? 11 : 12;
  return (
    <div
      className={`flex items-center gap-x-3.5 gap-y-1.5 flex-wrap ${compact ? 'text-[10px]' : 'text-[11.5px]'}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {showAuthor && (
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
          <User size={size} />
          {PUBLISHER}
        </span>
      )}
      <span className="flex items-center gap-1">
        <Calendar size={size} />
        {formatBlogDate(blog.publishedAt || blog.createdAt)}
      </span>
      <span className="flex items-center gap-1">
        <Clock size={size} />
        {tx(t, 'blog.minRead', `${minutes} min read`).replace('{count}', minutes)}
      </span>
      {blog.viewCount > 0 && (
        <span className="flex items-center gap-1">
          <Eye size={size} />
          {blog.viewCount.toLocaleString('en-US')}
        </span>
      )}
    </div>
  );
}

export default function BlogCard({ blog, variant = 'default' }) {
  const { t } = useLang();
  if (!blog) return null;

  const minutes = readingTime(blog.content || blog.excerpt || '');

  /* Realistic depth: ek chaurha halka saya + ek tang gehra saya.
     Ek hi flat shadow cartoon lagta hai; do layers asli lagti hain. */
  const shell = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 12px 28px -14px rgba(0,0,0,0.22)',
  };

  /* ══════════════ HERO ══════════════ */
  if (variant === 'hero') {
    return (
      <article
        className="paz-blog-card group rounded-2xl overflow-hidden transition-all duration-300"
        style={shell}
      >
        <Link href={`/blog/${blog.slug}`} className="grid md:grid-cols-[1.15fr_1fr] h-full">
          <div className="relative overflow-hidden aspect-[16/10] md:aspect-auto md:min-h-[340px]">
            <Cover blog={blog} eager scrim />
            <span className="absolute bottom-3 left-3 md:hidden">
              <CategoryBadge category={blog.category} onImage />
            </span>
          </div>

          <div className="p-6 md:p-8 lg:p-9 flex flex-col justify-center">
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <span
                className="text-[10.5px] font-black uppercase tracking-[0.18em]"
                style={{ color: 'var(--accent)' }}
              >
                {tx(t, 'blog.featured', 'Featured')}
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)' }} />
              <span className="hidden md:inline-flex">
                <CategoryBadge category={blog.category} />
              </span>
            </div>

            <h2
              className="text-2xl md:text-[2rem] font-black leading-[1.15] tracking-tight mb-3.5 line-clamp-3"
              style={{ color: 'var(--text-primary)' }}
            >
              {blog.title}
            </h2>

            {/* Description — sab se ahem hissa, reader ko andar ka andaza deta hai */}
            <p
              className="text-sm md:text-[15px] leading-relaxed line-clamp-3 mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              {previewText(blog, 240)}
            </p>

            <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Meta blog={blog} minutes={minutes} t={t} showAuthor />
            </div>

            <span
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold"
              style={{ color: 'var(--accent)' }}
            >
              {tx(t, 'blog.readFull', 'Poora parhein')}
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </article>
    );
  }

  /* ══════════════ COMPACT ══════════════ */
  if (variant === 'compact') {
    return (
      <article
        className="paz-blog-card group rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300"
        style={shell}
      >
        <Link href={`/blog/${blog.slug}`} className="flex flex-col h-full">
          <div className="relative overflow-hidden aspect-[16/9]">
            <Cover blog={blog} />
          </div>

          <div className="p-3.5 flex flex-col grow">
            <h3
              className="font-bold text-sm leading-snug mb-2 line-clamp-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {blog.title}
            </h3>
            <p
              className="text-[12px] leading-relaxed line-clamp-2 mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {previewText(blog, 80)}
            </p>
            <div className="mt-auto">
              <Meta blog={blog} minutes={minutes} t={t} compact />
            </div>
          </div>
        </Link>
      </article>
    );
  }

  /* ══════════════ DEFAULT ══════════════ */
  return (
    <article
      className="paz-blog-card group rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300"
      style={shell}
    >
      <Link href={`/blog/${blog.slug}`} className="flex flex-col h-full">
        <div className="relative overflow-hidden aspect-[16/9]">
          <Cover blog={blog} scrim />
          {blog.category && (
            <span className="absolute bottom-3 left-3">
              <CategoryBadge category={blog.category} onImage />
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5 flex flex-col grow">
          <h3
            className="font-bold text-[17px] leading-snug tracking-tight mb-2 line-clamp-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {blog.title}
          </h3>

          <p
            className="text-[13.5px] leading-relaxed line-clamp-3 mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {previewText(blog, 150)}
          </p>

          <div className="mt-auto pt-3.5" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Meta blog={blog} minutes={minutes} t={t} />

            <span
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold"
              style={{ color: 'var(--accent)' }}
            >
              {tx(t, 'blog.readFull', 'Poora parhein')}
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}