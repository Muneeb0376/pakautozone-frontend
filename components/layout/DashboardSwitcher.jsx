//frontend/components/layout/DashboardSwitcher.jsx
'use client';

// ✅ PHASE 5 — dual-profile users ke liye Seller/Showroom ke beech switcher.
// ProfileDropdown.jsx isay tab render karta hai jab user ke paas dono
// profiles hon (isDualProfile === true). Standalone rakha gaya hai taake
// future mein (e.g. mobile menu ya kahin aur) reuse ho sake bina
// ProfileDropdown ka poora JSX duplicate kiye.

import { Car, Store } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

export default function DashboardSwitcher({ activeDashboard, storeName, onSwitch }) {
  const { t } = useLang();
  const showroomLabel = storeName
    ? t('dashboard.storeDashboard', { name: storeName })
    : t('dashboard.showroomDashboard');
  const isShowroomActive = activeDashboard === 'showroom';

  return (
    <>
      <button
        onClick={() => onSwitch('seller')}
        role="menuitem"
        className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="flex items-center gap-2.5">
          <Car size={16} />
          {t('dashboard.sellerDashboard')}
        </span>
        {!isShowroomActive && (
          <span style={{ color: 'var(--accent)' }} title={t('dashboard.activeNow')}>●</span>
        )}
      </button>
      <button
        onClick={() => onSwitch('showroom')}
        role="menuitem"
        className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-alt)]"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="flex items-center gap-2.5">
          <Store size={16} />
          {showroomLabel}
        </span>
        {isShowroomActive && (
          <span style={{ color: 'var(--accent)' }} title={t('dashboard.activeNow')}>●</span>
        )}
      </button>
    </>
  );
}