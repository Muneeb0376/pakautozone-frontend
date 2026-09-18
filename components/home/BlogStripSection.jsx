'use client';
// frontend/components/home/BlogStripSection.jsx
//
// ✅ NAYI FILE — Issue 1 ka doosra hissa
//
// Aap ne kaha: "blog main page par bhi show ho, boost car ke neeche —
// sirf ek blog, bare se card mein, jo naya update hua ho wahi."
//
// Ye section wahi karta hai: sab se naya published post ek chaurhe
// card mein (image baayein, text daayein), aur saath teen chhote cards
// jo us ke baad wale posts hain. Chhote cards `sm` se neeche chhup
// jate hain — mobile par sirf ek bara card, jaisa aap ne kaha.
//
// ── KYUN 'use client' ──
// Homepage khud client component hai (`app/(main)/page.jsx` mein
// 'use client' hai). Server component usay import nahi kar sakta,
// is liye data yahan browser se fetch hota hai.
//
// ── AGAR KOI POST NA HO ──
// Section apne aap gayab ho jata hai (null return) — khali heading ke
// neeche khali jagah nahi banti.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, FileText, Loader2 } from 'lucide-react';

import { useLang } from '@/lib/i18nContext';
import { API } from '@/components/home/homeConstants';

const tx = (t, key, fallback) => {
  const out = t(key);
  return !out || out === key ? fallback : out;
};

/* Reading time — 200 words per minute */
function readMinutes(html) {
  const text = String(html || '').replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function shortDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

function preview(blog, max = 200) {
  const raw = blog.excerpt || String(blog.content || '').replace(/<[^>]+>/g, ' ');
  const clean = raw.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
}

export default function BlogStripSection({ limit = 4 }) {
  const { t } = useLang();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch(`${API}/blogs?limit=${limit}&page=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        const arr = Array.isArray(d) ? d : (d.data || d.blogs || []);
        setBlogs(arr);
      })
      .catch(() => alive && setBlogs([]))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [limit]);

  if (loading) {
    return (
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-12 px-4" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto flex justify-center h-32 items-center">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      </section>
    );
  }

  if (!blogs.length) return null;

  const [lead, ...rest] = blogs;
  const side = rest.slice(0, 3);

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-12 sm:py-16 px-4" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Heading ── */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2
              className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="w-1 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
              {tx(t, 'home.latestFromBlog', 'Blog se Naya')}
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {tx(t, 'home.blogSub', 'Reviews, buying guides aur maintenance tips')}
            </p>
          </div>

          <Link
            href="/blog"
            className="shrink-0 flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-75"
            style={{ color: 'var(--accent)' }}
          >
            {tx(t, 'common.viewAll', 'Sab dekhein')}
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">

          {/* ══ Bara card — sab se naya post ══ */}
          <article
            className="paz-blog-card group rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 12px 28px -14px rgba(0,0,0,0.22)',
            }}
          >
            <Link href={`/blog/${lead.slug}`} className="grid sm:grid-cols-2 h-full">
              <div className="relative overflow-hidden aspect-[16/10] sm:aspect-auto sm:min-h-[260px]" style={{ background: 'var(--bg-surface-alt)' }}>
                {lead.featuredImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lead.featuredImage}
                      alt={lead.title || ''}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.40), transparent 60%)' }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText size={28} strokeWidth={1.2} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                  </div>
                )}

                {lead.category && (
                  <span
                    className="absolute bottom-3 left-3 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm"
                    style={{
                      background: 'rgba(10,10,10,0.55)',
                      color: '#f0d79a',
                      border: '1px solid rgba(232,184,75,0.35)',
                    }}
                  >
                    {lead.category}
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-center">
                <span
                  className="text-[10.5px] font-black uppercase tracking-[0.18em] mb-3"
                  style={{ color: 'var(--accent)' }}
                >
                  {tx(t, 'blog.latest', 'Naya')}
                </span>

                <h3
                  className="text-xl sm:text-2xl font-black leading-tight tracking-tight mb-3 line-clamp-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {lead.title}
                </h3>

                <p
                  className="text-sm leading-relaxed line-clamp-3 mb-5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {preview(lead)}
                </p>

                <div
                  className="flex items-center gap-4 text-[11.5px] flex-wrap pt-4"
                  style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {shortDate(lead.publishedAt || lead.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {readMinutes(lead.content || lead.excerpt)} min read
                  </span>
                </div>

                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  {tx(t, 'blog.readFull', 'Poora parhein')}
                  <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </article>

          {/* ══ Chhoti fehrist — mobile par chhupi hui ══ */}
          {side.length > 0 && (
            <div className="hidden lg:flex flex-col gap-3">
              {side.map((b) => (
                <Link
                  key={b.id || b.slug}
                  href={`/blog/${b.slug}`}
                  className="paz-blog-card group flex gap-3.5 p-3 rounded-xl transition-all duration-300"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span
                    className="w-20 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: 'var(--bg-surface-alt)' }}
                  >
                    {b.featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.featuredImage} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={16} strokeWidth={1.3} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </span>

                  <span className="min-w-0 flex flex-col justify-center">
                    <span
                      className="block text-[13px] font-bold leading-snug line-clamp-2 mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {b.title}
                    </span>
                    <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {shortDate(b.publishedAt || b.createdAt)} · {readMinutes(b.content || b.excerpt)} min
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}