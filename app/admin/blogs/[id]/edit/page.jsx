'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/admin/blogs/[id]/edit/page.jsx
//
// Mojooda blog wahi editor mein khol deta hai — sab values pehle se bhari hui.
// Draft ho ya published, dono edit ho sakte hain (admin API status filter
// nahi lagati).

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';

import BlogEditor from '@/components/admin/BlogEditor';
import { getAdminBlogById } from '@/lib/blogApi';

export default function EditBlogPage() {
  const { t } = useLang();
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await getAdminBlogById(id);
        if (!cancelled) setBlog(res?.data || null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? t('admin.ui.blogGone')
              : err?.response?.data?.message || t('admin.ui.blogLoadFailed')
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <AlertCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            {error || t('admin.ui.blogNotFound')}
          </p>
          <Link
            href="/admin/blogs"
            className="inline-flex h-10 px-5 rounded-xl text-sm font-bold items-center"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {t('admin.ui.blogListBack')}
          </Link>
        </div>
      </div>
    );
  }

  return <BlogEditor mode="edit" initialBlog={blog} />;
}