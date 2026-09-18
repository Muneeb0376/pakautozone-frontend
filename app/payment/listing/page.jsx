'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/payment/listing/page.jsx
//
// ✅ POORI FILE REPLACE — Issue 2
//
// Ab ye ek safha DO kaam karta hai, `?type=` se tay hota hai:
//
//     /payment/listing?carId=abc&type=boost   → Rs 20, car Featured banti hai
//     /payment/listing?carId=abc&type=extra   → Rs 15, free quota ke baad
//
// Purani file mein sirf boost tha, aur `boost=true` na ho to seedha
// /pricing par redirect kar deti thi. Ab extra-listing fee ka rasta bhi
// yahin hai — seller dashboard ka "Pay Now" button isi par aata hai.
//
// ⚠️ Purane links bhi chalte rehte hain: `?boost=true` ko bhi
//    boost hi samjha jata hai (neeche `legacyBoost`), taake koi purana
//    bookmark ya notification link na toote.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import PaymentStartForm from '@/components/payment/PaymentStartForm';
import { carTitle, toTitleCase } from '@/lib/textCase';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ListingPaymentPage() {
  const { t } = useLang();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

function Content() {
  const { t } = useLang();
  const params = useSearchParams();
  const router = useRouter();

  const carId = params.get('carId');
  const legacyBoost = params.get('boost') === 'true';
  const kind = legacyBoost ? 'boost' : (params.get('type') || 'extra');

  const [pricing, setPricing] = useState(null);
  const [car, setCar] = useState(null);

  useEffect(() => {
    if (!carId) {
      router.replace('/dashboard/seller');
    }
  }, [carId, router]);

  useEffect(() => {
    fetch(`${API}/payments/pricing`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setPricing(d.data))
      .catch(() => {});
  }, []);

  // Car ka naam dikhane ke liye — user ko yaqeen ho ke sahi gaari ki
  // payment ho rahi hai. Public endpoint hai, token ki zarurat nahi.
  useEffect(() => {
    if (!carId) return;
    fetch(`${API}/cars/${carId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setCar(d.data))
      .catch(() => {});
  }, [carId]);

  if (!carId) return null;

  const isBoost = kind === 'boost';
  const name = car ? (carTitle(car) || toTitleCase(car.title)) : 'Aap ki listing';

  return (
    <PaymentStartForm
      type={isBoost ? 'BOOST' : 'LISTING'}
      carId={carId}
      heading={isBoost ? t('payment.listingBoost') : t('payment.extraListingFee')}
      subheading={name}
      itemName={isBoost ? t('payment.featuredPlacement') : t('payment.listingActivation')}
      itemNote={
        isBoost
          ? t('payment.boostNote', { days: pricing?.boostDays ?? 7 })
          : t('payment.extraListingNote')
      }
      amount={isBoost ? pricing?.boostPrice : pricing?.extraListingPrice}
      loadingPrice={!pricing}
      backHref="/dashboard/seller"
    />
  );
}