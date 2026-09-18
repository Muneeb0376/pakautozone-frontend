'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/admin/blogs/new/page.jsx
//
// "Write a blog" — khali editor. Saara form logic BlogEditor mein hai,
// isliye New aur Edit ka behaviour hamesha bilkul same rehta hai.

import BlogEditor from '@/components/admin/BlogEditor';

export default function NewBlogPage() {
  const { t } = useLang();
  return <BlogEditor mode="new" />;
}