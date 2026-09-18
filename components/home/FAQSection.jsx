'use client';
// frontend/components/home/FAQSection.jsx
//
// ✅ PHASE 9 — FAQ homepage section. Accordion-style, mobile-responsive.
// Content 100% original wording, platform ki actual working logic (jo
// baaki phases me define hui — roles, exchange, showroom, phone verify)
// ke mutabiq likha gaya hai, generic filler nahi.
//
// Isko dobara review karna: agar aapki actual fee/refund/verification
// policy final ho jaye to neeche ka FAQS array update kar dena — abhi
// jo likha hai wo platform ke current logic (Phase 1-8) ke mutabiq hai.

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

export default function FAQSection() {
  const { t } = useLang();
  const [openIndex, setOpenIndex] = useState(0); // pehla sawal by default khula

  const FAQS = [
    {
      q: t('faq.q1'),
      a: t('faq.a1'),
    },
    {
      q: t('faq.q2'),
      a: t('faq.a2'),
    },
    {
      q: t('faq.q3'),
      a: t('faq.a3'),
    },
    {
      q: t('faq.q4'),
      a: t('faq.a4'),
    },
    {
      q: t('faq.q5'),
      a: t('faq.a5'),
    },
    {
      q: t('faq.q6'),
      a: t('faq.a6'),
    },
    {
      q: t('faq.q7'),
      a: t('faq.a7'),
    },
    {
      q: t('faq.q8'),
      a: t('faq.a8'),
    },
  ];

  const toggle = (idx) => setOpenIndex((prev) => (prev === idx ? -1 : idx));

  return (
    <section
      className="py-16 px-4 bg-page-base"
      style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <HelpCircle size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-2xl font-black text-theme-primary">{t('home.faqTitle')}</h2>
          <p className="text-theme-secondary text-sm mt-1">{t('home.faqSub')}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl overflow-hidden border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 text-left px-5 py-4"
                >
                  <span className="font-bold text-theme-primary text-sm">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className="shrink-0"
                    style={{
                      color: 'var(--text-secondary)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}
                  />
                </button>

                {/* Collapse animation via max-height — mobile-friendly, no layout jump */}
                <div
                  style={{
                    maxHeight: isOpen ? 240 : 0,
                    transition: 'max-height 0.3s ease',
                    overflow: 'hidden',
                  }}
                >
                  <p className="px-5 pb-4 text-theme-secondary text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}