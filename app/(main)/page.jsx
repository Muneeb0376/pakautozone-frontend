'use client';
// frontend/app/(main)/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 3 (sirf TARTEEB badli hai)
//
// Aap ne kaha: "boost car ka section main page par 'Kya Dhoond Rahe Ho'
// ke neeche rakhna, aur phir blog us ke neeche."
//
// Nayi tarteeb:
//
//     1. Hero banner
//     2. Kya Dhoond Rahe Ho        (CategoryCarousel)
//     3. Featured / Boosted Cars   ← yahan aaya
//     4. Blog se Naya              ← naya section
//     5. Browse Used Cars          (tabs)
//     6. Brands
//     7. Body types
//     8. Dealers
//     9. All cars
//    10. Spare parts
//
// Kyun ye tarteeb behtar hai: visitor pehle apni zaroorat chunta hai
// (category), phir usay boosted listings dikhti hain — yani boost ki
// asal qeemat wahin milti hai jahan nazar sab se zyada thehrti hai.
// Blog us ke baad, kyunke wo parhne wali cheez hai, kharidne wali nahi.

import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18nContext';

import AICarFinderButton from '@/components/home/AICarFinderButton';
import HeroSection from '@/components/home/HeroSection';
import CategoryCarousel from '@/components/home/CategoryCarousel';
import FeaturedCarsSection from '@/components/home/FeaturedCarsSection';
import BlogStripSection from '@/components/home/BlogStripSection';   // ✅ NEW
import BrowseByTabs from '@/components/home/BrowseByTabs';
import BrandsCarousel from '@/components/home/BrandsCarousel';
import BodyTypeSection from '@/components/home/BodyTypeSection';
import DealersSection from '@/components/home/DealersSection';
import CarsGridSection from '@/components/home/CarsGridSection';
import SparePartsGridSection from '@/components/home/SparePartsGridSection';
import { CATEGORIES } from '@/components/home/categories';

export default function HomePage() {
  const router = useRouter();
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-page-base paz-has-bottom-nav">
      <AICarFinderButton />

      {/* 1 ── Hero */}
      <HeroSection />

      {/* 2 ── Kya Dhoond Rahe Ho */}
      <section
        className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-14 sm:py-16"
        style={{ background: 'var(--bg-section-accent)' }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-black text-theme-primary text-center mb-2">
            {t('home.whatLookingFor')}
          </h2>
          <p className="text-theme-muted text-sm text-center mb-10">
            {t('home.whatLookingForSub')}
          </p>
        </div>
        <CategoryCarousel categories={CATEGORIES} onSelect={(href) => router.push(href)} />
      </section>

      {/* 3 ── Boosted / Featured cars — ✅ ab yahan */}
      <FeaturedCarsSection />

      {/* 4 ── Blog — ✅ boost ke neeche */}
      <BlogStripSection />

      {/* 5 ── Browse Used Cars (Category / City / Make / Model / Budget / Body) */}
      <BrowseByTabs />

      {/* 6-10 */}
      <BrandsCarousel />
      <BodyTypeSection />
      <DealersSection />
      <CarsGridSection />
      <SparePartsGridSection />
    </div>
  );
}