// frontend/app/(main)/blog/page.jsx
//
// ✅ UPDATED (v2) — Public blog listing, WordPress-style layout.
//
// Kya naya hai:
//   1. Backend fail ho to ab saaf RED BANNER dikhta hai — pehle wo "koi post
//      nahi" ban kar chup jata tha, jis se debug karna namumkin tha.
//   2. Hero card — sab se naya post bara card mein (image left, text right).
//   3. Category-wise rows — har category apni row mein, 4-4 cards.
//   4. Behtar empty state — khali page ki jagah ek proper card jo batata hai
//      ke yahan kya aane wala hai.
//
// ⚠️ SERVER COMPONENT — data server par aata hai, is liye Google ko poora
//    content pehli hi HTML response mein milta hai.
// ⚠️ Next.js 16: `searchParams` Promise hai — `await` lazmi.

import Link from 'next/link';
import { AlertTriangle, Newspaper, Wrench, Scale, TrendingUp } from 'lucide-react';
import { cookies } from 'next/headers';
import { getT } from '@/lib/i18n';

import { fetchPublishedBlogs, fetchBlogCategories } from '@/lib/blogServer';
import BlogCard from '@/components/blog/BlogCard';
import CategoryRow from '@/components/blog/CategoryRow';
import BlogFilterBar from '@/components/blog/BlogFilterBar';

const SITE_NAME = 'Pak Auto Zone';
const PER_PAGE = 9;
const CATEGORY_ROW_SIZE = 4;

/* ─────────────────────────────────────────────────────────────
   SEO
   ───────────────────────────────────────────────────────────── */
export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const category = sp?.category;

  const title = category
    ? `${category} — Car Blog | ${SITE_NAME}`
    : `Car Blog — Reviews, Buying Guides aur News | ${SITE_NAME}`;

  const description = category
    ? `${category} par Pakistan ki cars se related detailed articles, prices aur expert advice.`
    : 'Pakistan ki cars par honest reviews, buying guides, comparisons aur maintenance tips — Pak Auto Zone ka blog.';

  return {
    title,
    description,
    alternates: {
      canonical: category ? `/blog?category=${encodeURIComponent(category)}` : '/blog',
    },
    openGraph: { title, description, type: 'website', siteName: SITE_NAME },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/* ─────────────────────────────────────────────────────────────
   Empty state — khali page ke bajaye ek maloomati card
   ───────────────────────────────────────────────────────────── */
function EmptyState({ filtered, t }) {
  const topics = [
    { Icon: Newspaper, title: t('blog.reviews'), text: t('blog.reviewsHint') },
    { Icon: TrendingUp, title: t('blog.buyingGuides'), text: t('blog.buyingGuidesHint') },
    { Icon: Scale, title: t('blog.comparisons'), text: t('blog.comparisonsHint') },
    { Icon: Wrench, title: t('blog.maintenance'), text: t('blog.maintenanceHint') },
  ];

  if (filtered) {
    return (
      <div
        className="py-16 px-6 text-center rounded-2xl"
        style={{ border: '1px dashed var(--border-color)', background: 'var(--card-bg)' }}
      >
        <p className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('blog.noResults')}
        </p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          {t('blog.noResultsHint')}
        </p>
        <Link
          href="/blog"
          className="inline-flex h-10 px-5 rounded-xl text-sm font-bold items-center"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          {t('blog.allPosts')}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div
        className="px-6 py-10 md:px-10 md:py-12 text-center"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <Newspaper size={26} />
        </div>

        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('blog.firstArticleSoon')}
        </h2>
        <p
          className="text-sm max-w-lg mx-auto leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('blog.emptyDescription')}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        {topics.map(({ Icon, title, text }, i) => (
          <div
            key={title}
            className="p-5"
            style={{
              borderTop: i > 0 ? '1px solid var(--border-color)' : 'none',
              borderLeft: 'none',
            }}
          >
            <Icon size={20} style={{ color: 'var(--accent)' }} className="mb-3" />
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              {title}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */
export default async function BlogListingPage({ searchParams }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const lang = cookieStore.get('autopk_lang')?.value || 'en';
  const t = getT(lang);

  const page = Math.max(1, parseInt(sp?.page, 10) || 1);
  const category = sp?.category || '';
  const tag = sp?.tag || '';
  const search = sp?.search || '';

  const hasFilter = Boolean(category || tag || search);
  const isLandingView = page === 1 && !hasFilter;

  // Main list + categories — dono ek saath
  const [listRes, catRes] = await Promise.all([
    fetchPublishedBlogs({ page, limit: PER_PAGE, category, tag, search }),
    fetchBlogCategories(),
  ]);

  const { blogs, meta, error: listError } = listRes;
  const { categories } = catRes;

  // Landing view par har category ki apni row — parallel mein laate hain
  let categoryRows = [];
  if (isLandingView && categories.length > 0) {
    const results = await Promise.all(
      categories.slice(0, 6).map(async (cat) => {
        const res = await fetchPublishedBlogs({
          category: cat.name,
          limit: CATEGORY_ROW_SIZE,
          page: 1,
        });
        return { name: cat.name, total: cat.count, blogs: res.blogs };
      })
    );
    categoryRows = results.filter((r) => r.blogs.length > 0);
  }

  // Landing par: pehla post hero, baqi grid mein
  const hero = isLandingView && blogs.length > 0 ? blogs[0] : null;
  const gridBlogs = hero ? blogs.slice(1) : blogs;

  const pageHref = (p) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (search) params.set('search', search);
    if (p > 1) params.set('page', String(p));
    const q = params.toString();
    return q ? `/blog?${q}` : '/blog';
  };

  return (
    <div className="py-6">
      {/* ── Header ── */}
      <header className="mb-8">
        <h1
          className="text-3xl md:text-4xl font-black tracking-tight mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {category || t('blog.title')}
        </h1>
        <p className="text-sm md:text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          {t('blog.subtitle')}
        </p>
      </header>

      {/* ── Backend error banner ── */}
      {listError && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <AlertTriangle size={18} style={{ color: '#dc2626' }} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: '#dc2626' }}>
              {t('blog.loadFailed')}
            </p>
            <p className="text-xs mt-1 break-words" style={{ color: '#dc2626', opacity: 0.85 }}>
              {listError}
            </p>
          </div>
        </div>
      )}

      <BlogFilterBar categories={categories} />

      {blogs.length === 0 ? (
        <EmptyState filtered={hasFilter} t={t} />
      ) : (
        <>
          {/* ── Hero ── */}
          {hero && (
            <div className="mb-10">
              <BlogCard blog={hero} variant="hero" />
            </div>
          )}

          {/* ── Latest grid ── */}
          {gridBlogs.length > 0 && (
            <section className="mb-12">
              {isLandingView && (
                <h2
                  className="text-xl md:text-2xl font-black tracking-tight mb-4 flex items-center gap-2.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span
                    className="w-1 h-6 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                  Nayi Posts
                </h2>
              )}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            </section>
          )}

          {/* ── Category-wise rows (sirf landing par) ── */}
          {categoryRows.length > 0 && (
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="pt-8">
                {categoryRows.map((row) => (
                  <CategoryRow
                    key={row.name}
                    category={row.name}
                    blogs={row.blogs}
                    total={row.total}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Pagination — asli links, crawlable ── */}
          {meta.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  rel="prev"
                  className="h-10 px-5 rounded-xl text-sm font-bold flex items-center"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Pichla
                </Link>
              )}

              <span className="text-sm px-3" style={{ color: 'var(--text-muted)' }}>
                {meta.page} / {meta.totalPages}
              </span>

              {page < meta.totalPages && (
                <Link
                  href={pageHref(page + 1)}
                  rel="next"
                  className="h-10 px-5 rounded-xl text-sm font-bold flex items-center"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  Agla
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}