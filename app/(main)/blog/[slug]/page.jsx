// frontend/app/(main)/blog/[slug]/page.jsx
//
// Single blog post — /blog/toyota-corolla-2024-review
//
// ⚠️ SERVER COMPONENT. Poora article server par render ho kar HTML mein jaata
//    hai. Check karne ka tareeqa: page par right-click → "View Page Source"
//    (Inspect nahi) — article ka text wahan nazar aana chahiye.
//
// ⚠️ Next.js 16: `params` bhi ab Promise hai — `await` lazmi hai.
//
// DRAFT ka slug yahan 404 deta hai, kyunke backend `getBlogBySlug` sirf
// `status: 'PUBLISHED'` filter karta hai.

import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Calendar, Clock, Eye, User, ArrowLeft } from 'lucide-react';

import { fetchBlogBySlug, fetchRelatedBlogs } from '@/lib/blogServer';
import BlogContent from '@/components/blog/BlogContent';
import RelatedBlogs from '@/components/blog/RelatedBlogs';
import {
  formatBlogDate, readingTime, toIsoDate, previewText,
} from '@/lib/blogHelpers';
import { getT } from '@/lib/i18n';

const SITE_NAME = 'Pak Auto Zone';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pakautozone.com';

/* ─────────────────────────────────────────────────────────────
   SEO — har post ke apne meta tags
   metaTitle/metaDescription khali hon to title/excerpt par fallback
   ───────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await fetchBlogBySlug(slug);

  if (!blog) {
    return { title: `Blog nahi mila | ${SITE_NAME}`, robots: { index: false } };
  }

  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || previewText(blog, 155);
  const url = `${SITE_URL}/blog/${blog.slug}`;
  const images = blog.featuredImage ? [{ url: blog.featuredImage }] : [];

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: `/blog/${blog.slug}` },
    keywords: blog.tags?.length ? blog.tags : undefined,
    authors: blog.author?.name ? [{ name: blog.author.name }] : undefined,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: SITE_NAME,
      images,
      publishedTime: toIsoDate(blog.publishedAt),
      modifiedTime: toIsoDate(blog.updatedAt),
      tags: blog.tags,
    },
    twitter: {
      card: blog.featuredImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: blog.featuredImage ? [blog.featuredImage] : undefined,
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */
export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const t = getT(cookieStore.get('autopk_lang')?.value || 'en');
  const blog = await fetchBlogBySlug(slug);

  // Draft, delete-shuda, ya ghalat slug → Next ka 404
  if (!blog) notFound();

  const related = await fetchRelatedBlogs(slug, 4);
  const minutes = readingTime(blog.content);

  // Google ke liye Article structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.metaDescription || previewText(blog, 155),
    image: blog.featuredImage ? [blog.featuredImage] : undefined,
    datePublished: toIsoDate(blog.publishedAt || blog.createdAt),
    dateModified: toIsoDate(blog.updatedAt),
    author: {
      '@type': 'Person',
      name: blog.author?.name || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${blog.slug}`,
    },
    articleSection: blog.category || undefined,
    keywords: blog.tags?.length ? blog.tags.join(', ') : undefined,
    wordCount: undefined,
  };

  return (
    <article className="py-6">
      {/* Structured data — Google ke liye, user ko nazar nahi aata */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto">
        {/* ── Back ── */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> {t('blog.title')}
        </Link>

        {/* ── Header ── */}
        <header className="mb-7">
          {blog.category && (
            <Link
              href={`/blog?category=${encodeURIComponent(blog.category)}`}
              className="inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {blog.category}
            </Link>
          )}

          <h1
            className="text-3xl md:text-[2.6rem] font-black leading-[1.15] tracking-tight mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-base md:text-lg leading-relaxed mb-5"
              style={{ color: 'var(--text-secondary)' }}>
              {blog.excerpt}
            </p>
          )}

          <div
            className="flex items-center gap-4 text-xs flex-wrap pb-5"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
          >
            {blog.author?.name && (
              <span className="flex items-center gap-1.5">
                <User size={13} /> {blog.author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> {formatBlogDate(blog.publishedAt || blog.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> {t('blog.minRead', { count: minutes })}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={13} /> {t('blog.views', { count: blog.viewCount })}
            </span>
          </div>
        </header>

        {/* ── Featured image ── */}
        {blog.featuredImage && (
          <figure className="mb-8 rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border-color)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full aspect-[16/9] object-cover"
            />
          </figure>
        )}

        {/* ── Article body ── */}
        <BlogContent html={blog.content} />

        {/* ── Tags ── */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6"
            style={{ borderTop: '1px solid var(--border-color)' }}>
            {blog.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: 'var(--bg-surface-alt)',
                  color: 'var(--text-secondary)',
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Related ── */}
      <div className="max-w-6xl mx-auto">
        <RelatedBlogs blogs={related} />
      </div>
    </article>
  );
}