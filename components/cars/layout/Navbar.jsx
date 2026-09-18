'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Heart, Bell, MessageCircle, Menu, X, Shield, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '@/lib/i18nContext';

const navLinks = [
  { href: '/cars', label: 'nav.cars' },
  { href: '/trade-in', label: 'nav.tradeIn' },
  { href: '/wishlist', label: 'nav.wishlist', icon: Heart },
  { href: '/chat', label: 'nav.chat', icon: MessageCircle },
  { href: '/notifications', label: 'nav.notifications', icon: Bell },
  { href: '/dashboard', label: 'nav.dashboard', icon: BarChart2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <Car className="text-blue-600" size={20} />
            <span className="font-bold text-gray-900 text-base sm:text-lg">AutoPak</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.icon && <link.icon size={15} />}
                {t(link.label)}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/admin"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              <Shield size={13} /> {t('nav.admin')}
            </Link>
            <button
              type="button"
              onClick={() => setLang(lang === 'ur' ? 'roman' : lang === 'roman' ? 'en' : 'ur')}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
              aria-label={t('nav.language')}
            >
              {lang === 'ur' ? 'اردو' : lang === 'en' ? 'English' : 'Roman Urdu'}
            </button>
            <Link href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">
              {t('nav.login')}
            </Link>
            <Link href="/register"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              {t('nav.register')}
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-600"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.icon && <link.icon size={15} />}
                {t(link.label)}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1 text-center text-sm border border-gray-200 py-2 rounded-xl">
                {t('nav.login')}
              </Link>
              <Link href="/register" className="flex-1 text-center text-sm bg-blue-600 text-white py-2 rounded-xl">
                {t('nav.register')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}