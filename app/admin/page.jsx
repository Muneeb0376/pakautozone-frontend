'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Check, X, Users, Car, Store, MapPin, Phone, Mail,
  CreditCard, Receipt, Loader2, AlertCircle, BadgeCheck,
  FileText, ArrowRight, MessageSquare, Trash2, User as UserIcon,
} from 'lucide-react';
import { getCleanToken } from '@/lib/auth';
import { useLang } from '@/lib/i18nContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// ContactForm.jsx ke TOPICS ke value se translation key tak map
const MESSAGE_TOPIC_KEYS = {
  general: 'contactForm.topic.general',
  listing: 'contactForm.topic.listing',
  payment: 'contactForm.topic.payment',
  showroom: 'contactForm.topic.showroom',
  report: 'contactForm.topic.report',
  other: 'contactForm.topic.other',
};

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, cars: 0, stores: 0, pendingPayments: 0 });
  const [stores, setStores] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [deactivationRequests, setDeactivationRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('stores');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { t } = useLang();

  // ✅ Reply modal states
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    setErrorMsg('');
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const token = getCleanToken();
    if (!token) {
      setErrorMsg(t('auth.sessionExpired'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsRes.status === 403) {
        setErrorMsg(t('admin.accessDenied'));
        setLoading(false);
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          users: statsData.users || 0,
          cars: statsData.cars || 0,
          stores: statsData.stores || 0,
          pendingPayments: statsData.pendingPayments || 0,
        });
      }

      // Tab-specific data
      if (activeTab === 'stores') {
        const storesRes = await fetch(`${API_BASE}/admin/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (storesRes.ok) {
          const data = await storesRes.json();
          setStores(Array.isArray(data) ? data : (data.data || []));
        } else {
          setErrorMsg(t('admin.showroomsLoadFailed'));
        }
      } else if (activeTab === 'messages') {
        const messagesRes = await fetch(`${API_BASE}/admin/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          const list = Array.isArray(data) ? data : (data.data || []);
          setMessages(
            [...list].sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )
          );
        } else {
          setErrorMsg(t('admin.messagesLoadFailed'));
        }
      } else if (activeTab === 'deactivation') {
        const requestsRes = await fetch(`${API_BASE}/admin/showroom-deactivation-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (requestsRes.ok) {
          const data = await requestsRes.json();
          setDeactivationRequests(Array.isArray(data) ? data : (data.data || []));
        } else {
          setErrorMsg(t('admin.deactivationLoadFailed'));
        }
      } else {
        const paymentsRes = await fetch(`${API_BASE}/admin/payments/verifying`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.success ? data.data : []);
        } else {
          setErrorMsg(t('admin.paymentsLoadFailed'));
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t('common.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivationAction = async (requestId, action) => {
    const token = getCleanToken();
    if (!token) return;
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_BASE}/admin/showroom-deactivation-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(result.message || t('admin.actionFailed'));
        return;
      }
      await fetchData();
    } catch {
      alert(t('common.serverError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStoreAction = async (storeId, action) => {
    const token = getCleanToken();
    if (!token) return;
    setActionLoading(storeId);
    try {
      const res = await fetch(`${API_BASE}/admin/stores/${storeId}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || t('admin.actionFailed'));
      }
    } catch (err) {
      alert(t('common.serverError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentAction = async (paymentId, actionType) => {
    const token = getCleanToken();
    if (!token) return;
    setActionLoading(paymentId);
    try {
      const res = await fetch(`${API_BASE}/admin/payments/${paymentId}/action`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: actionType }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(result.message || t('admin.actionFailed'));
        return;
      }
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      await fetchData();
    } catch (err) {
      alert(t('admin.networkError'));
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Contact form messages: mark read / delete
  const handleMarkMessageRead = async (messageId) => {
    const token = getCleanToken();
    if (!token) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
    );
    try {
      await fetch(`${API_BASE}/admin/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // silent — UI already updated optimistically, next refresh will re-sync
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const token = getCleanToken();
    if (!token) return;
    setActionLoading(messageId);
    try {
      const res = await fetch(`${API_BASE}/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else {
        alert(t('admin.actionFailed'));
      }
    } catch (err) {
      alert(t('common.serverError'));
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Reply to message — email bhejta hai
  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    const token = getCleanToken();
    if (!token) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${API_BASE}/admin/messages/${replyingTo.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ replyText }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === replyingTo.id ? { ...m, isRead: true } : m))
        );
        setReplyingTo(null);
        setReplyText('');
        alert('Reply bhej di gayi ✅');
      } else {
        alert(data.message || 'Reply nahi gayi — dobara try karein');
      }
    } catch (err) {
      alert('Server error');
    } finally {
      setSendingReply(false);
    }
  };

  // ✅ Note: yeh "Pending" tab count sirf VERIFIED BADGE ke liye hai
  // (isVerified) — showroom LIVE hai ya nahi (isActive, payment-gated)
  // ab har store row par alag se "🟢 Live" / "⚪ Not Live" tag mein
  // dikhaya ja raha hai, taake admin ko dono status saaf nazar aayein.
  const pendingStores = stores.filter((s) => !s.isVerified);
  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;
  const pendingDeactivationCount = deactivationRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: t('admin.totalUsers'), value: stats.users, color: 'text-blue-600 bg-blue-50' },
            { icon: Car, label: t('admin.totalCars'), value: stats.cars, color: 'text-green-600 bg-green-50' },
            { icon: Store, label: t('admin.totalShowrooms'), value: stats.stores, color: 'text-purple-600 bg-purple-50' },
            { icon: CreditCard, label: t('admin.pendingPayments'), value: stats.pendingPayments, color: 'text-amber-600 bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center mb-2`}>
                <s.icon size={18} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
                {/* ✅ BLOG — Blog manager ka entry point */}
        <Link
          href="/admin/blogs"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-8 hover:border-blue-200 transition-colors"
        >
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm">{t('admin.blogs')}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('admin.blogDescription')}
            </p>
          </div>
          <ArrowRight size={18} className="text-gray-400 shrink-0" />
        </Link>

        

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6 flex-wrap items-center">
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-3 text-sm font-bold px-2 border-b-2 transition-all ${
              activeTab === 'stores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('admin.showroomsVerification')} ({pendingStores.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-sm font-bold px-2 border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('admin.manualPayments')} ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`pb-3 text-sm font-bold px-2 border-b-2 transition-all ${
              activeTab === 'messages'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('admin.contactMessages')} ({unreadMessagesCount > 0 ? `${unreadMessagesCount} ${t('admin.unread')}` : messages.length})
          </button>
          <button
            onClick={() => setActiveTab('deactivation')}
            className={`pb-3 text-sm font-bold px-2 border-b-2 transition-all ${
              activeTab === 'deactivation'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('admin.deactivationRequests')} ({pendingDeactivationCount})
          </button>
          {/* ✅ PHASE 5 — Payments page ka link (categories ke saath) */}
          <Link
            href="/admin/payments"
            className="px-4 py-2 rounded-lg text-sm font-bold transition-colors mb-1"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {t('admin.paymentsWithCategories')} →
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'stores' ? (
            stores.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Store size={36} className="mx-auto mb-3 text-gray-200" />
                {t('admin.noShowrooms')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stores.map((store) => (
                  <div key={store.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{store.name}</p>
                        {/* ✅ Verified badge — trust badge only, admin-controlled here */}
                        {store.isVerified ? (
                          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                            <BadgeCheck size={12} /> {t('common.verified')}
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700">
                            {t('common.pending')}
                          </span>
                        )}
                        {/* ✅ NEW: separate LIVE indicator — this is controlled
                            purely by payment approval (Manual Payments Review
                            tab), not by the Verified button above. Admin can
                            now see both statuses at a glance. */}
                        {store.isActive ? (
                          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                            🟢 {t('admin.liveMarketplace')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                            ⚪ {t('admin.notLivePayment')}
                          </span>
                        )}
                        {typeof store._count?.cars === 'number' && (
                          <span className="text-xs text-gray-400">{store._count.cars} {t('nav.cars')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mt-1.5">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={11} /> {store.city || '—'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={11} /> {store.phone || '—'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Mail size={11} /> {t('admin.owner')}: {store.owner?.name} ({store.owner?.email})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!store.isVerified && (
                        <>
                          <button
                            disabled={actionLoading === store.id}
                            onClick={() => handleStoreAction(store.id, 'verify')}
                            className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 disabled:opacity-50"
                          >
                            {actionLoading === store.id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Check size={13} />}
                            {t('admin.approve')}
                          </button>
                          <button
                            disabled={actionLoading === store.id}
                            onClick={() => handleStoreAction(store.id, 'reject')}
                            className="flex items-center gap-1 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
                          >
                            <X size={13} /> {t('admin.reject')}
                          </button>
                        </>
                      )}
                      {store.isVerified && (
                        <button
                          disabled={actionLoading === store.id}
                          onClick={() => handleStoreAction(store.id, 'reject')}
                          className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50"
                        >
                          <X size={13} /> {t('admin.revoke')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'deactivation' ? (
            deactivationRequests.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Trash2 size={36} className="mx-auto mb-3 text-gray-200" />
                {t('admin.noDeactivationRequests')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {deactivationRequests.map((request) => (
                  <div key={request.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{request.store?.name || t('admin.deletedShowroom')}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          request.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{request.user?.name} · {request.user?.email}</p>
                      <p className="text-sm text-gray-700 mt-2">{request.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                    {request.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeactivationAction(request.id, 'REJECT')}
                          disabled={actionLoading === request.id}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 disabled:opacity-50"
                        >
                          {t('common.reject')}
                        </button>
                        <button
                          onClick={() => handleDeactivationAction(request.id, 'APPROVE')}
                          disabled={actionLoading === request.id}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-red-600 disabled:opacity-50"
                        >
                          {t('admin.approveDeactivation')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'messages' ? (
            messages.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <MessageSquare size={36} className="mx-auto mb-3 text-gray-200" />
                {t('admin.noMessages')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-5 flex flex-col gap-3 ${!m.isRead ? 'bg-blue-50/40' : ''}`}
                    onClick={() => !m.isRead && handleMarkMessageRead(m.id)}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                            <UserIcon size={13} className="text-gray-400" /> {m.name}
                          </p>
                          {!m.isRead && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                              {t('admin.unread')}
                            </span>
                          )}
                          {m.topic && MESSAGE_TOPIC_KEYS[m.topic] && (
                            <span className="text-xs font-black bg-gray-50 text-gray-700 border border-gray-100 px-2.5 py-0.5 rounded-md">
                              {t(MESSAGE_TOPIC_KEYS[m.topic])}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mt-1.5 text-xs text-gray-500">
                          {m.email && (
                            <a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-blue-600">
                              <Mail size={11} /> {m.email}
                            </a>
                          )}
                          {m.phone && (
                            <a href={`tel:${m.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                              <Phone size={11} /> {m.phone}
                            </a>
                          )}
                          {m.createdAt && (
                            <span>{t('admin.sentOn')}: {new Date(m.createdAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      {/* ✅ Reply + Delete buttons */}
                      <div className="flex gap-2 shrink-0">
                        {m.email && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyingTo(m); setReplyText(''); }}
                            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 shrink-0"
                          >
                            <Mail size={13} /> Reply
                          </button>
                        )}
                        <button
                          disabled={actionLoading === m.id}
                          onClick={(e) => { e.stopPropagation(); handleDeleteMessage(m.id); }}
                          className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-40 shrink-0"
                        >
                          {actionLoading === m.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={13} />}
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {m.message}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            payments.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Receipt size={36} className="mx-auto mb-3 text-gray-200" />
                {t('admin.noPendingTransactions')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 bg-white">
                {payments.map((p) => {
                  const meta = p.metadata || {};
                  return (
                    <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-md">
                            {meta.type || 'LISTING'}
                          </span>
                          <span className="text-sm font-black text-gray-900 font-mono">
                            PKR {p.amount}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{t('admin.via')} {p.method}</span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium pt-0.5">
                          {t('admin.submittedBy')}: <strong className="text-gray-900">{p.user?.name}</strong> ({p.user?.email})
                        </p>
                        {/* ✅ Showroom info — so admin can verify the showroom from this payment */}
                        {p.user?.store && (
                          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 pt-0.5">
                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                              <Store size={11} /> {p.user.store.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {p.user.store.city || '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={11} /> {p.user.store.phone || p.user.store.whatsapp || '—'}
                            </span>
                            {!p.user.store.isVerified && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700">
                                {t('admin.showroomPending')}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-xl font-mono font-bold mt-2">
                          <Receipt size={13} className="text-amber-600" /> {t('admin.txId')}: {p.transactionId}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 self-end md:self-center">
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handlePaymentAction(p.id, 'REJECT')}
                          className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-40"
                        >
                          <X size={13} /> {t('admin.reject')}
                        </button>
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handlePaymentAction(p.id, 'APPROVE')}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm disabled:opacity-40"
                        >
                          {actionLoading === p.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Check size={13} />}
                          {t('admin.approvePayment')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* ✅ Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Mail size={16} className="text-blue-600" /> Reply to {replyingTo.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Sending to: {replyingTo.email}</p>
            </div>
            <div className="p-5">
              {/* Original message */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500 border border-gray-100">
                <p className="font-semibold text-gray-600 mb-1">Their message:</p>
                <p className="leading-relaxed">{replyingTo.message}</p>
              </div>
              {/* Reply textarea */}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Apna reply yahan likhein (English mein)..."
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="p-5 pt-0 flex gap-3 justify-end">
              <button
                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={sendingReply || !replyText.trim()}
                onClick={handleReply}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
              >
                {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}