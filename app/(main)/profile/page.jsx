//frontend/app/(main)/profile/page.jsx
'use client';
import { useLang } from '@/lib/i18nContext';

// ✅ PHASE 5 — "Profile" destination for the Navbar ProfileDropdown.
// Lives in the (main) route group (Navbar + Footer, no dashboard
// role-gating) because Profile is a personal-account page every
// logged-in user (buyer/seller/dealer/admin) should be able to reach —
// dashboard/layout.jsx restricts BUYER away from seller/showroom-only
// paths, which Profile is not.
// Uses the existing PUT /api/auth/me endpoint (auth.routes.js →
// updateMe controller) — no new backend work needed, it already accepts
// name/phone/whatsapp/city + an optional avatar file.

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, User, Mail, Phone, MessageCircle, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { translateApiError } from '@/lib/i18n';

export default function ProfilePage() {
  const { t } = useLang();
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated, updateUser } = useAuthStore();
  const fileInputRef = useRef(null);

  // ✅ (main) layout doesn't auth-gate like dashboard/layout.jsx does —
  // this page needs its own guard.
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user) router.replace('/login');
  }, [_hasHydrated, isAuthenticated, user, router]);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    city: user?.city || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [synced, setSynced] = useState(false);

  // ✅ authStore hydrates from localStorage a tick after first render, so
  // `user` can arrive after this component already mounted with empty
  // initial state — sync once real data shows up.
  useEffect(() => {
    if (!synced && user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        whatsapp: user.whatsapp || '',
        city: user.city || '',
      });
      setAvatarPreview(user.avatar || null);
      setSynced(true);
    }
  }, [user, synced]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('common.imageRequirements'));
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('phone', form.phone);
      payload.append('whatsapp', form.whatsapp);
      payload.append('city', form.city);
      if (avatarFile) payload.append('avatar', avatarFile);

      const res = await api.putForm('/auth/me', payload);
      if (res?.success && res.user) {
        updateUser(res.user);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(translateApiError({ message: res?.message || 'Profile update failed' }, t));
      }
    } catch (err) {
      setError(translateApiError(err, t));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--bg-page)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-8 rounded-3xl border shadow-2xl"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>{t('dashboard.myProfile')}</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Apni personal information update karein
        </p>

        {error && (
          <div className="mb-5 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3 bg-green-500/15 border border-green-500/40 rounded-xl text-green-400 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} /> Profile update ho gaya!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 rounded-full cursor-pointer overflow-hidden border-2 shrink-0 group"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-xl font-bold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {(user.name || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Profile Photo</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click the avatar to change (max 5MB)</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <User size={12} className="inline mr-1" />{t('profile.name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 rounded-xl border outline-none text-sm"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Mail size={12} className="inline mr-1" />Email (read-only)
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full p-3 rounded-xl border outline-none text-sm opacity-60 cursor-not-allowed"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Phone size={12} className="inline mr-1" />{t('common.phone')}</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-3 rounded-xl border outline-none text-sm"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <MessageCircle size={12} className="inline mr-1" />{t('seller.whatsapp')}</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full p-3 rounded-xl border outline-none text-sm"
                style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={12} className="inline mr-1" />{t('common.city')}</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full p-3 rounded-xl border outline-none text-sm"
              style={{ background: 'var(--bg-surface-alt)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            type="submit"
            disabled={saving}
            className="w-full py-4 mt-2 font-bold text-white rounded-xl text-sm transition-all"
            style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }}
          >
            {saving ? t('common.saving') : t('common.save')}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
