'use client';
import { useLang } from '@/lib/i18nContext';
/**
 * frontend/app/(main)/chat/page.jsx
 *
 * ✅ PERMANENT FIX (this revision):
 *
 * 1) "Click karke chat open nahi hoti" — root cause: list/chat panel
 *    switching depended purely on Tailwind's `hidden md:flex` / `md:w-80`
 *    responsive classes. Is codebase mein kayi jagah (e.g. cars/[id]/page.jsx)
 *    dev already raw inline `style={{...}}` use kar raha tha kyunke Tailwind
 *    ke responsive utility classes reliably compile/apply nahi ho rahe the.
 *    Isi wajah se yahan bhi `md:` breakpoint waqai apply nahi ho raha tha,
 *    aur chat panel *sirf list ke peeche chhup jata tha* (`hidden` laagu
 *    reh jata, `md:flex` kabhi override nahi karta) — isliye lagta tha
 *    "chat open nahi ho rahi", chahe click sahi kaam kar raha ho.
 *
 *    FIX: List ↔ Chat switching ab 100% JavaScript state (`isMobile`,
 *    window.innerWidth + resize listener) se control hoti hai, Tailwind
 *    responsive variants par depend nahi karti. Isliye chahe Tailwind
 *    build kuch bhi ho, panel switching hamesha guaranteed kaam karegi.
 *
 * 2) URL se aaye `?roomId=` ko auto-open karna — pehle sirf EK dafa (mount
 *    par) try hota tha aur agar us exact waqt tak backend list mein room
 *    na aaya ho (naya-naya create hua room, halka sa DB/replication delay)
 *    to permanently miss ho jata tha. Ab ek chhota retry-loop hai
 *    (4 attempts / ~3 seconds) jo room mil jaane tak koshish karta rehta hai.
 *    Ye same page pe URL badalne (dobara "Send Message" click) par bhi
 *    dobara chalta hai, sirf pehli mount par nahi.
 *
 * 3) Auth-guard race — agar Zustand authStore abhi hydrate ho raha ho to
 *    pehle turant `/login` push ho jata tha aur `?roomId` URL se kho jata
 *    tha. Ab redirect se pehle token bhi check hota hai taake false-negative
 *    par user login page par na uchal jaye.
 *
 * 4) Mobile viewport height — `100vh` ki jagah `100dvh` (dynamic viewport)
 *    use kiya taake mobile browser ka address-bar show/hide hone par layout
 *    tootay na, aur input font-size >=16px rakha taake iOS Safari zoom-in
 *    na kare jab user type karna shuru kare.
 *
 * Baaki poora business-logic (sockets, privacy-clear on user switch,
 * read-receipts, polling fallback, trade-ins) waisa hi hai.
 */
import { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageCircle, Send, ArrowLeft, Car, Clock, Bell, Check, CheckCheck,
  Search, ChevronDown, Store as StoreIcon, Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket, connectSocket } from '@/lib/socket';
import { getCleanToken } from '@/lib/auth';

// ── Helpers ──────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-fuchsia-400',
  'from-pink-500 to-rose-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-indigo-500 to-sky-400',
];

const getAvatarGradient = (name = '') => {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
};

// ── Admin/Support chat handling ─────────────────────────────────────────
// Backend account is literally named "Super Admin", but in the user-facing
// chat it should read "Pak Auto Zone Customer Service". Users can read
// admin's replies here but cannot reply back — they're pointed to the
// Contact Us page instead.
const ADMIN_ACCOUNT_NAME = 'Super Admin';
const ADMIN_DISPLAY_NAME = 'Pak Auto Zone Customer Service';
const CONTACT_US_PATH = '/contact';

// ✅ The read-only restriction (below) is keyed off the CHAT ROOM's other
//    party, which — when the user is the buyer — is the admin's auto-created
//    Store record (`adminMessages.controller.js` creates it as
//    { name: 'Pak Auto Zone Support', slug: 'pak-auto-zone-support' }),
//    NOT the admin User record (whose name is "Super Admin"). Comparing a
//    Store's name against a User's name never matched, so the restriction
//    silently never applied to buyers. Matching the Store's own identity
//    instead (slug first, name as fallback) fixes that.
const ADMIN_STORE_NAME = 'Pak Auto Zone Support';
const ADMIN_STORE_SLUG = 'pak-auto-zone-support';

const isAdminAccountName = (name = '') =>
  name.trim().toLowerCase() === ADMIN_ACCOUNT_NAME.toLowerCase();

const isAdminStore = (store) => {
  if (!store) return false;
  if (store.slug && store.slug.trim().toLowerCase() === ADMIN_STORE_SLUG) return true;
  return (store.name || '').trim().toLowerCase() === ADMIN_STORE_NAME.toLowerCase();
};

const getDisplayName = (name = '') =>
  isAdminAccountName(name) ? ADMIN_DISPLAY_NAME : name;

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDateDivider = (date, t) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return t('chat.today');
  if (isSameDay(d, yesterday)) return t('chat.yesterday');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

const groupMessagesByDay = (messages, t) => {
  const out = [];
  let lastDay = null;
  for (const msg of messages) {
    const day = formatDateDivider(msg.createdAt, t);
    if (day !== lastDay) {
      out.push({ type: 'divider', key: `divider-${msg.id}`, label: day });
      lastDay = day;
    }
    out.push({ type: 'message', key: msg.id, msg });
  }
  return out;
};

const extractList = (raw, nestedKey) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (nestedKey && Array.isArray(raw?.data?.[nestedKey])) return raw.data[nestedKey];
  if (nestedKey && Array.isArray(raw?.[nestedKey])) return raw[nestedKey];
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
};

const extractItem = (raw, nestedKey) => {
  if (raw?.data?.[nestedKey]) return raw.data[nestedKey];
  if (raw?.[nestedKey]) return raw[nestedKey];
  if (raw?.data) return raw.data;
  return raw;
};

// ✅ Mobile breakpoint check — matches Tailwind's default `md` (768px) but
//    is resolved in JS so it can never silently fail to apply.
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  // Default to `false` (desktop) on the server / first paint to avoid a
  // layout flash; corrected immediately on mount before the user can
  // interact with anything.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useLang();
  const isMobile = useIsMobile();

  const [chatRooms, setChatRooms] = useState([]);
  const [tradeIns, setTradeIns] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const roomsLoadedRef = useRef(false);
  const selectedRoomRef = useRef(null);
  const lastUrlRoomIdRef = useRef(null);
  const autoSelectAttemptsRef = useRef(0);

  const isDealer = ['DEALER', 'SHOWROOM', 'SELLER'].includes((user?.role || '').toUpperCase());

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // ✅ PRIVACY: current user badalte hi (account switch, same tab) purana
  //    chat data foran clear karo — pehle ke koi bhi naya fetch complete ho.
  useEffect(() => {
    setSelectedRoom(null);
    setMessages([]);
    setChatRooms([]);
    setTradeIns([]);
    setUnreadCount(0);
    roomsLoadedRef.current = false;
  }, [user?.id]);

  const markRoomAsRead = async (roomId) => {
    if (!roomId) return;
    try {
      await api.post(`/chat/rooms/${roomId}/read`);
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const syncReadReceipts = async (roomId) => {
    if (!roomId) return;
    try {
      const raw = await api.get(`/chat/rooms/${roomId}/messages`);
      const fresh = extractList(raw, 'messages');
      if (selectedRoomRef.current?.id !== roomId) return;

      setMessages(prev => {
        let changed = false;
        const merged = prev.map(m => {
          const freshMsg = fresh.find(f => f.id === m.id);
          if (freshMsg && freshMsg.isRead !== m.isRead) {
            changed = true;
            return { ...m, isRead: freshMsg.isRead };
          }
          return m;
        });
        const missingMsgs = fresh.filter(f => !prev.find(m => m.id === f.id));
        if (missingMsgs.length > 0) {
          changed = true;
          return [...merged, ...missingMsgs];
        }
        return changed ? merged : prev;
      });
    } catch {
      // Silent — background sync
    }
  };

  // ✅ Socket setup
  useEffect(() => {
    if (!isAuthenticated) {
      // ✅ FIX: agar authStore abhi tak sirf hydrate ho raha hai (async),
      //    to token maujood hone ke bawajood false-negative redirect ho
      //    sakta tha aur ?roomId URL se kho jata. Token check ek safety-net
      //    hai taake asal logged-out user hi /login par jaye.
      const hasToken = typeof window !== 'undefined' && getCleanToken();
      if (!hasToken) {
        router.push('/login');
      }
      return;
    }

    connectSocket();
    socketRef.current = getSocket();

    if (user?.id) {
      socketRef.current.emit('join_user_room', user.id);
    }

    socketRef.current.on('receive_message', (message) => {
      if (String(selectedRoomRef.current?.id) === String(message.chatRoomId)) {
        setMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
        markRoomAsRead(message.chatRoomId);
      }
      fetchChatRooms(false);
    });

    socketRef.current.on('new_chat_notification', (notification) => {
      setUnreadCount(prev => prev + 1);
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(`AutoPK — ${t('notifications.newMessage')}`, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
      fetchChatRooms(false);
    });

    socketRef.current.on('messages_read', ({ roomId }) => {
      if (String(roomId) !== String(selectedRoomRef.current?.id)) return;
      setMessages(prev => prev.map(m => {
        const senderIdOfMsg = m.senderId || m.sender?.id;
        return String(senderIdOfMsg) === String(user?.id)
          ? { ...m, isRead: true }
          : m;
      }));
    });

    fetchChatRooms(true);
    if (isDealer) fetchTradeIns();

    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }

    const handleFocus = () => {
      if (selectedRoomRef.current?.id) {
        syncReadReceipts(selectedRoomRef.current.id);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
        socketRef.current.off('new_chat_notification');
        socketRef.current.off('messages_read');
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user?.id]);

  // ✅ FIX: URL ka ?roomId badalne par bhi (jaise ek car se "Send Message"
  //    click karke, phir kisi doosri car/dealer se dobara click karna jabke
  //    /chat page pehle se hi khula ho) — auto-select dobara try hota hai,
  //    sirf pehli mount par nahi.
  useEffect(() => {
    const roomIdFromUrl = searchParams?.get('roomId');
    if (!roomIdFromUrl || roomIdFromUrl === lastUrlRoomIdRef.current) return;
    lastUrlRoomIdRef.current = roomIdFromUrl;
    autoSelectAttemptsRef.current = 0;
    tryAutoSelectFromUrl(roomIdFromUrl, chatRooms);
  }, [searchParams, chatRooms]);

  // ✅ Room change pe messages fetch + socket room join + read mark
  useEffect(() => {
    if (!selectedRoom || !socketRef.current) return;

    setMessages([]);
    fetchMessages(selectedRoom.id);
    socketRef.current.emit('join_room', `room_${selectedRoom.id}`);
    setUnreadCount(0);
    markRoomAsRead(selectedRoom.id);
    if (!isMobile) inputRef.current?.focus();

    const pollInterval = setInterval(() => {
      syncReadReceipts(selectedRoom.id);
    }, 4000);

    return () => {
      socketRef.current?.emit('leave_room', `room_${selectedRoom.id}`);
      clearInterval(pollInterval);
    };
  }, [selectedRoom?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollBtn(false);
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);
  };

  // ✅ FIX: retry-loop — naya-naya create hua room agar list-fetch mein
  //    turant na mile (halka DB/replication delay), to 4 baar ~700ms ke
  //    fasle se dobara try karta hai isse pehle ke haar maan le.
  const tryAutoSelectFromUrl = (roomIdFromUrl, rooms) => {
    if (!roomIdFromUrl) return;

    // ✅ FIX: room.id backend se number ho sakti hai jabke URL query param
    // (?roomId=...) hamesha string hoti hai — strict `===` is wajah se
    // kabhi match nahi karta tha aur click par chat khulti hi nahi thi.
    // Ab dono ko String() bana kar compare karte hain.
    const targetRoom = rooms.find(r => String(r.id) === String(roomIdFromUrl));
    if (targetRoom) {
      setSelectedRoom(targetRoom);
      autoSelectAttemptsRef.current = 0;
      return;
    }

    if (autoSelectAttemptsRef.current >= 4) return; // give up quietly
    autoSelectAttemptsRef.current += 1;
    setTimeout(() => fetchChatRooms(false, roomIdFromUrl), 700);
  };

  const fetchChatRooms = async (isInitial = false, forceAutoSelectRoomId = null) => {
    if (isInitial) setLoading(true);
    try {
      const endpoint = isDealer ? '/chat/dealer-rooms' : '/chat/my-rooms';
      const raw = await api.get(endpoint);
      const rooms = extractList(raw, 'rooms');
      setChatRooms(rooms);

      const roomIdFromUrl = forceAutoSelectRoomId || searchParams?.get('roomId');
      if (roomIdFromUrl && !selectedRoomRef.current) {
        lastUrlRoomIdRef.current = roomIdFromUrl;
        tryAutoSelectFromUrl(roomIdFromUrl, rooms);
      }
      roomsLoadedRef.current = true;
    } catch (err) {
      console.error('Chat rooms fetch error:', err);
      setChatRooms([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const fetchTradeIns = async () => {
    try {
      const raw = await api.get('/chat/trade-ins/available');
      setTradeIns(extractList(raw, 'tradeIns'));
    } catch (err) {
      console.error('Trade-ins fetch error:', err);
    }
  };

  const fetchMessages = async (roomId) => {
    setMessagesLoading(true);
    try {
      const raw = await api.get(`/chat/rooms/${roomId}/messages`);
      if (selectedRoomRef.current?.id !== roomId) return;
      setMessages(extractList(raw, 'messages'));
    } catch (err) {
      console.error('Messages fetch error:', err);
      if (selectedRoomRef.current?.id === roomId) setMessages([]);
    } finally {
      if (selectedRoomRef.current?.id === roomId) setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;
    if (selectedRoomIsAdmin) return; // ✅ Admin/support room is read-only for users

    setSending(true);
    const tempContent = newMessage;
    setNewMessage('');

    try {
      const raw = await api.post(`/chat/rooms/${selectedRoom.id}/messages`, {
        content: tempContent,
      });

      const msg = extractItem(raw, 'message');
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      fetchChatRooms(false);
    } catch (err) {
      console.error('Send message error:', err);
      setNewMessage(tempContent);
      alert(t('chat.sendFailed'));
    } finally {
      setSending(false);
      if (!isMobile) inputRef.current?.focus();
    }
  };

  // ✅ Selecting a room from the list — always works because this is a
  //    plain state update; the panel that shows it is now driven by the
  //    same `isMobile` JS state, not by CSS breakpoints.
  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
  };

  const handleBackToList = () => {
    setSelectedRoom(null);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return chatRooms;
    const q = search.trim().toLowerCase();
    return chatRooms.filter(room => {
      const isRoomBuyer = String(room.buyerId) === String(user?.id);
      const otherParty = isRoomBuyer ? room.store : room.buyer;
      const rawName = (otherParty?.name || '').toLowerCase();
      const displayName = getDisplayName(otherParty?.name || '').toLowerCase();
      const carTitle = (room.car?.title || '').toLowerCase();
      return rawName.includes(q) || displayName.includes(q) || carTitle.includes(q);
    });
  }, [chatRooms, search, user?.id]);

  const groupedMessages = useMemo(() => groupMessagesByDay(messages, t), [messages, t]);

  // ✅ Admin/support rooms are read-only for the user — they can see the
  //    admin's replies but must use the Contact page to write in. This only
  //    ever applies when the logged-in user is the BUYER in the room and the
  //    other side is specifically the admin's support Store — a buyer↔dealer
  //    room (any normal store) is never affected.
  const selectedRoomIsAdmin = useMemo(() => {
    if (!selectedRoom) return false;
    const isBuyer = String(selectedRoom.buyerId) === String(user?.id);
    if (!isBuyer) return false;
    return isAdminStore(selectedRoom.store);
  }, [selectedRoom, user?.id]);

  // ✅ Visibility is now computed purely in JS — guaranteed correct
  //    regardless of Tailwind's responsive class generation.
  const showListPane = !isMobile || !selectedRoom;
  const showChatPane = !isMobile || !!selectedRoom;

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-page-base text-theme-primary" style={{ minHeight: '100dvh' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="h-7 w-40 skeleton-block rounded-lg animate-pulse mb-4" />
          <div className="flex gap-4" style={{ height: 'calc(100dvh - 160px)' }}>
            {!isMobile && (
              <div className="flex flex-col p-4 gap-4 glass-card rounded-2xl" style={{ width: '320px', flexShrink: 0 }}>
                <div className="h-9 w-full skeleton-block rounded-xl animate-pulse" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full skeleton-block animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 skeleton-block rounded animate-pulse" />
                      <div className="h-2.5 w-1/2 skeleton-block rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 glass-card rounded-2xl flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-page-base text-theme-primary" style={{ minHeight: '100dvh' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 tracking-tight">
            <MessageCircle size={22} className="text-blue-400" />{t('nav.chat')}</h1>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 rounded-full px-3 py-1">
              <Bell size={13} className="text-blue-400" />
              <span className="text-xs text-blue-300 font-semibold">{t('chat.unreadNew', { count: unreadCount })}</span>
            </div>
          )}
        </div>

        {/* ✅ FIX: layout ab flex-row rehta hai desktop par (list + chat
            side-by-side, hamesha guaranteed), aur mobile par sirf EK pane
            dikhta hai — control JS `isMobile` state se, CSS breakpoint se nahi. */}
        <div className="flex gap-4" style={{ height: 'calc(100dvh - 150px)', minHeight: '420px' }}>

          {/* ── Conversations list ── */}
          {showListPane && (
            <div
              className="glass-card rounded-2xl overflow-hidden flex flex-col min-h-0"
              style={isMobile ? { width: '100%' } : { width: '320px', flexShrink: 0 }}
            >
              <div className="p-4 border-b border-theme space-y-3 bg-surface-alt">
                <h2 className="font-bold flex items-center gap-2 text-sm text-theme-primary">
                  <MessageCircle size={16} className="text-blue-400" /> {t('chat.conversations')}
                </h2>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('chat.searchPlaceholder')}
                    className="w-full bg-surface border border-theme rounded-full pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-400/60 focus:bg-surface-alt transition-colors placeholder:text-theme-muted"
                    style={{ fontSize: '16px' }} /* ✅ iOS auto-zoom rokne ke liye */
                  />
                </div>
              </div>

              {isDealer && tradeIns.length > 0 && (
                <div className="border-b border-theme">
                  <div className="px-4 py-2 bg-purple-500/10 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-purple-400" />
                    <h3 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      {t('chat.tradeInRequests')} ({tradeIns.length})
                    </h3>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {tradeIns.map(ti => (
                      <div
                        key={ti.id}
                        className="px-4 py-3 border-b border-theme hover:bg-surface-alt cursor-pointer transition-colors"
                        onClick={() => alert(
                          `Trade-in:\nCar: ${ti.dealCar?.title || 'N/A'}\nUser: ${ti.user?.name}\nAsking Price: PKR ${Number(ti.askingPrice || 0).toLocaleString()}`
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Car size={14} className="text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{ti.user?.name}</p>
                            <p className="text-[10px] text-theme-muted truncate">{ti.dealCar?.title}</p>
                          </div>
                          <Clock size={12} className="text-theme-muted shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto chat-scroll">
                {chatRooms.length === 0 ? (
                  <div className="text-center py-14 px-6">
                    <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-3">
                      <MessageCircle size={26} className="text-theme-muted" />
                    </div>
                    <p className="text-sm font-medium text-theme-secondary">{t('chat.noConversations')}</p>
                    <p className="text-xs text-theme-muted mt-1">{t('chat.sendMessageHint')}</p>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-14 px-6">
                    <Search size={26} className="text-theme-muted mx-auto mb-2" />
                    <p className="text-sm text-theme-muted">{t('chat.noMatch', { query: search })}</p>
                  </div>
                ) : (
                  filteredRooms.map(room => {
                    const isRoomBuyer = String(room.buyerId) === String(user?.id);
                    const otherParty = isRoomBuyer ? room.store : room.buyer;
                    const otherPartyDisplayName = getDisplayName(otherParty?.name || '');
                    const lastMsg = room.messages?.[room.messages.length - 1];
                    const isSelected = selectedRoom?.id === room.id;
                    const lastMsgSenderId = lastMsg?.senderId || lastMsg?.sender?.id;
                    const hasUnread = lastMsg && !lastMsg.isRead && String(lastMsgSenderId) !== String(user?.id);
                    const gradient = getAvatarGradient(otherPartyDisplayName || '');

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleSelectRoom(room)}
                        className={`w-full text-left px-4 py-3 border-b border-theme cursor-pointer transition-colors relative ${
                          isSelected ? 'bg-blue-500/10' : 'hover:bg-surface-alt'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {isSelected && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r" />}
                        <div className="flex items-start gap-3">
                          <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-md`}>
                            {otherPartyDisplayName?.charAt(0)?.toUpperCase() || '?'}
                            {hasUnread && (
                              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-950" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <p className={`text-sm truncate ${hasUnread ? 'font-bold text-white' : 'font-semibold text-theme-primary'}`}>
                                {otherPartyDisplayName || 'Unknown'}
                              </p>
                              {lastMsg && (
                                <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'text-blue-400 font-semibold' : 'text-theme-muted'}`}>
                                  {formatTime(lastMsg.createdAt)}
                                </span>
                              )}
                            </div>
                            {room.car && (
                              <p className="text-[10px] text-blue-400/80 truncate mt-0.5">{t('chat.re')}: {room.car.title}</p>
                            )}
                            {lastMsg && (
                              <p className={`text-xs truncate mt-1 ${hasUnread ? 'text-theme-primary font-medium' : 'text-theme-muted'}`}>
                                {String(lastMsgSenderId) === String(user?.id) ? `${t('common.you')}: ` : ''}{lastMsg.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── Chat window ── */}
          {showChatPane && (
            <div
              className="glass-card rounded-2xl overflow-hidden flex flex-col min-h-0"
              style={{ flex: 1, minWidth: 0 }}
            >
              {selectedRoom ? (
                <>
                  {(() => {
                    const isSelectedRoomBuyer = String(selectedRoom.buyerId) === String(user?.id);
                    const selectedOtherParty = isSelectedRoomBuyer ? selectedRoom.store : selectedRoom.buyer;
                    const selectedOtherPartyName = getDisplayName(selectedOtherParty?.name || '');
                    const gradient = getAvatarGradient(selectedOtherPartyName || '');
                    return (
                      <div className="p-3.5 border-b border-theme flex items-center gap-3 bg-surface-alt">
                        {isMobile && (
                          <button
                            type="button"
                            onClick={handleBackToList}
                            className="p-2 rounded-lg hover:bg-surface-alt -ml-1 transition-colors"
                            aria-label={t('chat.backToConversations')}
                          >
                            <ArrowLeft size={20} />
                          </button>
                        )}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-md shrink-0`}>
                          {selectedOtherPartyName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-sm text-theme-primary">
                            {selectedOtherPartyName || 'Unknown'}
                          </p>
                          {selectedRoom.car ? (
                            <p className="text-xs text-blue-400 flex items-center gap-1 truncate">
                              <Car size={11} /> {selectedRoom.car.title}
                            </p>
                          ) : (
                            <p className="text-xs text-theme-muted flex items-center gap-1">
                              <StoreIcon size={11} /> {t('chat.generalInquiry')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div
                    dir="ltr"
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className="relative flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 chat-scroll bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.05),_transparent_55%)]"
                  >
                    {messagesLoading ? (
                      <div className="space-y-3 py-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className={`h-9 rounded-2xl skeleton-block animate-pulse`} style={{ width: `${120 + (i * 37) % 140}px` }} />
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-3">
                            <MessageCircle size={30} className="text-theme-muted" />
                          </div>
                          <p className="text-sm font-medium text-theme-secondary">{t('chat.firstMessage')}</p>
                          <p className="text-xs text-theme-muted mt-1">{t('chat.conversationStarts')}</p>
                        </div>
                      </div>
                    ) : (
                      groupedMessages.map(item => {
                        if (item.type === 'divider') {
                          return (
                            <div key={item.key} className="flex justify-center py-3 sticky top-1 z-10">
                              <span className="text-[10px] font-semibold text-theme-secondary bg-surface-alt border border-theme px-3 py-1 rounded-full shadow-sm">
                                {item.label}
                              </span>
                            </div>
                          );
                        }

                        const msg = item.msg;
                        const senderIdOfMsg = msg.senderId || msg.sender?.id;
                        const isOwn = String(senderIdOfMsg) === String(user?.id);
                        const isSelectedRoomBuyer = String(selectedRoom.buyerId) === String(user?.id);
                        const otherPartyName = isSelectedRoomBuyer ? selectedRoom.store?.name : selectedRoom.buyer?.name;
                        const senderName = isOwn ? 'Aap' : getDisplayName(msg.sender?.name || otherPartyName || 'User');

                        return (
                          <div
                            key={item.key}
                            dir="ltr"
                            className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] sm:max-w-[78%] md:max-w-[62%] px-3.5 py-2 shadow-sm ${
                              isOwn
                                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl rounded-br-md'
                                : 'bg-surface-alt text-theme-primary rounded-2xl rounded-bl-md border border-theme'
                            }`}>
                              <p className={`text-[10px] font-semibold mb-0.5 ${
                                isOwn ? 'text-blue-100/90' : 'text-blue-300'
                              }`}>
                                {senderName}
                              </p>
                              <p className="text-sm whitespace-pre-line break-words leading-snug">{msg.content}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${isOwn ? 'text-blue-100/80' : 'text-theme-muted'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isOwn && (
                                  msg.isRead ? (
                                    <CheckCheck size={14} className="text-sky-200" />
                                  ) : (
                                    <Check size={14} className="text-blue-100/80" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />

                    {showScrollBtn && (
                      <button
                        type="button"
                        onClick={() => scrollToBottom()}
                        className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-colors"
                      >
                        <ChevronDown size={14} /> {t('chat.newMessages')}
                      </button>
                    )}
                  </div>

                  {selectedRoomIsAdmin ? (
                    // ✅ Admin/support room: user sirf replies padh sakta hai,
                    //    yahan se message nahi bhej sakta — Contact Us par bhejo.
                    <div
                      className="p-4 border-t border-theme bg-surface-alt text-center"
                      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                    >
                      <p className="text-sm font-medium text-theme-secondary">
                        {t('chat.cannotSend')}
                      </p>
                      <p className="text-xs text-theme-muted mt-1">
                        {t('chat.contactPrompt')}{' '}
                        <a
                          href={CONTACT_US_PATH}
                          className="text-blue-400 font-semibold hover:underline"
                        >
                          {t('chat.contact')}
                        </a>{' '}
                        {t('chat.section')} {t('common.of')} Pak Auto Zone.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-3.5 border-t border-theme bg-surface-alt" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                      <div className="flex gap-2 items-end">
                        <input
                          ref={inputRef}
                          type="text"
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          placeholder={t('chat.typeMessage')}
                          className="flex-1 bg-surface border border-theme rounded-full px-4 py-2.5 focus:outline-none focus:border-blue-400/60 focus:bg-surface-alt transition-colors placeholder:text-theme-muted"
                          style={{ fontSize: '16px' }} /* ✅ iOS auto-zoom rokne ke liye */
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={sending || !newMessage.trim()}
                          className="w-11 h-11 shrink-0 bg-blue-500 hover:bg-blue-400 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95"
                          aria-label={t('chat.sendAria')}
                        >
                          {sending ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send size={17} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-4">
                      <MessageCircle size={40} className="text-theme-muted" />
                    </div>
                    <p className="text-lg font-semibold text-theme-secondary">{t('chat.selectConversation')}</p>
                    <p className="text-sm text-theme-muted mt-1">{t('chat.selectFromList')}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
        .chat-scroll { scrollbar-width: thin; scrollbar-color: var(--border-color) transparent; }
      `}</style>
    </div>
  );
}

// ✅ FIX: `useSearchParams()` Next.js App Router mein Suspense boundary
//    maangta hai, warna production build is route ko poori tarah client-only
//    render mein deopt kar sakta hai — jo navigation ke turant baad
//    ?roomId read karne mein inconsistency la sakta tha. Ab explicit
//    Suspense wrap kar diya taake behavior hamesha predictable rahe.
export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-page-base text-theme-primary flex items-center justify-center" style={{ minHeight: '100dvh' }}>
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}