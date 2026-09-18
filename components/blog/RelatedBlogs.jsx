'use client';
// frontend/components/blog/RelatedBlogs.jsx
//
// Article ke neeche milte-julte posts. Backend pehle same category dhoondta
// hai, phir same tags, aur kam pade to latest posts se jagah bhar deta hai —
// isliye ye strip tab tak khali nahi hoti jab tak site par 2 posts hain.

import { useLang } from '@/lib/i18nContext';
import BlogCard from './BlogCard';

export default function RelatedBlogs({ blogs = [] }) {
  const { t } = useLang();
  if (!blogs.length) return null;

  return (
    <section className="mt-14 pt-10" style={{ borderTop: '1px solid var(--border-color)' }}>
      <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
        {t('blog.relatedTitle')}
      </h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </section>
  );
}