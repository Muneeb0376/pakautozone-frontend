'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/payment/showroom/page.jsx
//
// ✅ POORI FILE REPLACE — Issue 3
//
// Purani file ke teen masail:
//
//   1. `const SUBSCRIPTION_FEE = 1000;` — HARDCODED aur GHALAT.
//      Backend Rs 100 charge karta hai. User ko Rs 1000 dikhta tha,
//      wo Rs 1000 bhej deta, aur record Rs 100 ka banta. Ab qeemat
//      server se aati hai — do jagah kabhi alag nahi ho sakti.
//
//   2. Wapis ka link `/dashboard/my-showroom` tha — ye route mojood
//      hi nahi. Sahi route `/dashboard/showroom` hai.
//
//   3. Poora safha `bg-slate-950` + `text-white` par HARDCODED tha —
//      light theme mein bhi kaala rehta tha aur baqi site se bilkul
//      alag lagta tha.
//
// Ab poora form PaymentStartForm se aata hai (wahi jo listing/boost
// page bhi use karta hai), is liye dono jagah ka flow bilkul ek jaisa
// hai.

import { useEffect, useState } from 'react';
import PaymentStartForm from '@/components/payment/PaymentStartForm';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ShowroomPaymentPage() {
  const { t } = useLang();
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    fetch(`${API}/payments/pricing`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setPricing(d.data))
      .catch(() => {});
  }, []);

  const days = pricing?.subscriptionDays ?? 30;

  return (
    <PaymentStartForm
      type="SUBSCRIPTION"
      heading={t('payment.showroomSubscription')}
      subheading={t('payment.monthlyAccessFee')}
      itemName={t('payment.showroomMonthlyAccess')}
      itemNote={t('payment.subscriptionNote', { days })}
      amount={pricing?.showroomPrice}
      loadingPrice={!pricing}
      backHref="/dashboard/showroom"
    />
  );
}