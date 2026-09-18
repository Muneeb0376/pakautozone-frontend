'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/blog/CategoryRow.jsx
//
// ✅ NAYI FILE — components/blog/ folder mein rakh dein.
//
// Ek category ka poora section: heading + "Sab dekhein" link + 4 compact cards.
// WordPress ke category blocks jaisa — har category apni row mein.
//
// Data page (server component) laata hai; ye sirf dikhata hai.
// Koi nayi i18n key nahi chahiye.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BlogCard from './BlogCard';

export default function CategoryRow({ category, blogs = [], total = 0 }) {
  const { t } = useLang();
  // Khali category ki row dikhane ka faida nahi
  if (!blogs.length) return null;

  return (
    <section className="mb-12">
      {/* ── Heading ── */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2
            className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <span
              className="w-1 h-6 rounded-full shrink-0"
              style={{ background: 'var(--accent)' }}
            />
            {category}
          </h2>
          <p className="text-xs mt-1 ml-3.5" style={{ color: 'var(--text-muted)' }}>
            {total} {total === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {total > blogs.length && (
          <Link
            href={`/blog?category=${encodeURIComponent(category)}`}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap"
            style={{ color: 'var(--accent)' }}
          >
            Sab dekhein
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* ── Cards ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} variant="compact" />
        ))}
      </div>
    </section>
  );
}