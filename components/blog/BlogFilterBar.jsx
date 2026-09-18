'use client';
// frontend/components/blog/BlogFilterBar.jsx
//
// Category filter + search. URL query params badalta hai (?category= &search=)
// — page Server Component hai, isliye URL badalte hi wo dobara server par
// render ho kar naya data le aata hai. Client par koi fetch nahi hota,
// matlab har filtered view bhi SEO-friendly aur shareable rehta hai.

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

export default function BlogFilterBar({ categories = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { t } = useLang();

  const activeCategory = params.get('category') || '';
  const activeTag = params.get('tag') || '';
  const activeSearch = params.get('search') || '';

  const [search, setSearch] = useState(activeSearch);

  // Back/forward button se aane par input sync rahe
  useEffect(() => { setSearch(activeSearch); }, [activeSearch]);

  const push = (next) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    sp.delete('page'); // filter badla to hamesha page 1 se
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    push({ search: search.trim() });
  };

  const hasFilters = activeCategory || activeTag || activeSearch;

  return (
    <div className="mb-8 space-y-4">
      {/* ── Search ── */}
      <form onSubmit={submitSearch} className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('blog.searchPlaceholder')}
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </form>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => push({ category: '', tag: '' })}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
            style={
              !activeCategory && !activeTag
                ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                : {
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }
            }
          >
            {t('blog.allPosts')}
          </button>

          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => push({ category: cat.name, tag: '' })}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={
                activeCategory === cat.name
                  ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                  : {
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              {cat.name}
              <span className="ml-1.5 opacity-60">{cat.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Active tag / clear ── */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {activeTag && (
            <span
              className="px-3 py-1 rounded-full font-semibold"
              style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
            >
              #{activeTag}
            </span>
          )}
          <button
            type="button"
            onClick={() => push({ category: '', tag: '', search: '' })}
            className="flex items-center gap-1 font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={12} /> {t('common.clearAll')}
          </button>
        </div>
      )}
    </div>
  );
}