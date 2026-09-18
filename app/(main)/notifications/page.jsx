'use client';
import { useLang } from '@/lib/i18nContext';
import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { api } from '@/lib/api'; // ✅ FIX: raw fetch + localStorage token ki jagah app ka apna api client use karo

export default function NotificationsPage() {
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      // ✅ FIX: backend seedha array return karta hai, lekin agar api client
      //    kabhi { success, data } wrap kare to dono cases handle ho jayein
      const list = Array.isArray(res) ? res : (res?.data || []);
      setNotifications(list);
    } catch (err) {
      console.error(err);
      setNotifications([]); // ✅ FIX: error par bhi hamesha array rakho, .filter crash na ho
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.notifications')}</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Check size={14} /> {t('notifications.markAllRead')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id}
                className={`bg-white rounded-xl p-4 border transition-colors ${
                  n.isRead ? 'border-gray-100' : 'border-blue-200 bg-blue-50'
                }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{n.body}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(n.createdAt).toLocaleDateString('en-PK')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}