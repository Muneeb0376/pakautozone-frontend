// frontend/app/sitemap.js
//
// Next.js khud is file se /sitemap.xml bana deta hai — koi package nahi chahiye.
//
// ⚠️ AGAR YE FILE AAPKE PROJECT MEIN PEHLE SE HAI:
//    isay overwrite mat karein. Bas apni mojooda file mein `blogEntries`
//    wala hissa aur `fetchAllBlogSlugs` ka import add kar dein, aur usay
//    apne return array ke saath spread kar dein.
//
// Google Search Console mein submit karne ka URL:  https://<domain>/sitemap.xml

import { fetchAllBlogSlugs } from '@/lib/blogServer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pakautozone.com';

export default async function sitemap() {
  // Sab published blog posts
  const slugs = await fetchAllBlogSlugs();

  const blogEntries = slugs.map((b) => ({
    url: `${SITE_URL}/blog/${b.slug}`,
    lastModified: new Date(b.updatedAt || b.publishedAt || Date.now()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Site ke fixed pages
  const staticEntries = [
    { url: SITE_URL,                     changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/cars`,           changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/spare-parts`,    changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/stores`,         changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/blog`,           changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/trade-in`,       changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly',  priority: 0.3 },
  ].map((e) => ({ ...e, lastModified: new Date() }));

  return [...staticEntries, ...blogEntries];
}