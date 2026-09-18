'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/admin/blogs/page.jsx
//
// Admin panel ka Blog section — saare posts ki list.
// ADMIN check upar wale layout.jsx mein ho chuka hai.

import BlogTable from '@/components/admin/BlogTable';

export default function AdminBlogsPage() {
  const { t } = useLang();
  return <BlogTable />;
}