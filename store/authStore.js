import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──
      user: null,
      store: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // ✅ PHASE 8 — Dual Dashboard Logic
      // Jab user ke paas dono profiles hon (hasSellerProfile + hasStore),
      // ye field decide karta hai konsa dashboard "active"/default hai.
      // Values: null (abhi tak koi choice nahi hui) | 'seller' | 'showroom'
      // Persist hota hai (localStorage) taake refresh ke baad bhi yaad rahe.
      activeDashboard: null,

      // ── Hydration flag ──
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      // ✅ PHASE 8 — Navbar ka Dashboard Switcher (aur jis dashboard link pe
      // user click karay) isay call karta hai. "Jis dashboard pe user click
      // karay, wahi active ban jaye" — professional multi-workspace pattern
      // (Shopify/Stripe switcher jaisa).
      setActiveDashboard: (dashboard) => {
        if (dashboard !== 'seller' && dashboard !== 'showroom') return;
        set({ activeDashboard: dashboard });
      },

      // ── Login ──
      login: (userData, tokenValue) => {
        const storeData = userData.store || null;
        set({
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || null,
            whatsapp: userData.whatsapp || null,
            role: userData.role,
            avatar: userData.avatar || null,
            city: userData.city || null,
            // ✅ PHASE 5 — CORE FIX: ye field pehle yahan whitelist se
            // missing thi, isliye backend kuch bhi bheje, client-side
            // hamesha `user.isVerified === undefined` (falsy) reheta tha.
            isVerified: userData.isVerified || false,
            isSeller: userData.isSeller || false,
            // ✅ PHASE 8 — independent flag (Phase 1 decision): user BUYER se
            // SELLER upgrade ho sakta hai AUR alag se DEALER (Store) bhi bana
            // sakta hai, dono ek dusre se independent. Backend `/auth/me` aur
            // login response dono mein ye flag bhejta hai.
            hasSellerProfile: userData.hasSellerProfile || false,
            hasStore: userData.hasStore || false,
          },
          store: storeData,
          token: tokenValue,
          isAuthenticated: true,
        });
      },

      // ── Logout ──
      logout: () => {
        set({
          user: null,
          store: null,
          token: null,
          isAuthenticated: false,
          // ✅ PHASE 8 — agla user (agar same browser pe login karay) ko
          // pichle user ka dashboard-choice inherit nahi hona chahiye.
          activeDashboard: null,
        });
      },

      // ── Update user profile ──
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      // ── Update store (e.g. after listingType upgrade) ──
      setStore: (newStore) => {
        set({ store: newStore });
        set((state) => ({
          user: state.user
            ? { ...state.user, hasStore: !!newStore }
            : null,
        }));
      },

      // Clear stale showroom state after an approved deactivation.
      clearStore: () => {
        set((state) => ({
          store: null,
          user: state.user
            ? {
                ...state.user,
                hasStore: false,
                role: state.user.hasSellerProfile ? 'SELLER' : 'BUYER',
              }
            : null,
          activeDashboard:
            state.activeDashboard === 'showroom' ? null : state.activeDashboard,
        }));
      },

      // ── Fetch fresh user data from backend ──
      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          // ✅ FIX: same cross-user cache risk as /showrooms/my-showroom —
          // bina cache:'no-store' ke browser purane user ka cached /auth/me
          // response naye user ko de sakta hai.
          const res = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          const data = await res.json();

          if (data.success && data.user) {
            const u = data.user;
            set({
              user: {
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone || null,
                whatsapp: u.whatsapp || null,
                role: u.role,
                avatar: u.avatar || null,
                city: u.city || null,
                isSeller: u.isSeller || false,
                // ✅ PHASE 8 — dual-profile detection isi flag par depend karta hai
                hasSellerProfile: u.hasSellerProfile || false,
                hasStore: u.hasStore || false,
              },
              store: u.store || null,
              isAuthenticated: true,
            });
          }
        } catch (err) {
          console.error('refreshUser error:', err);
        }
      },

      // ✅ Ek hi jagah se authenticated fetch call karo.
      // Ye har API call ke response ko check karta hai — agar
      // token expire/invalid ho (401) to automatically logout
      // kar ke user ko /login pe bhej deta hai, aur original
      // caller ko ek clear error deta hai (silent 401 loop ki
      // jagah).
      authFetch: async (path, options = {}) => {
        const { token, logout } = get();

        const res = await fetch(`${API}${path}`, {
          ...options,
          // ✅ FIX: 'no-store' default — user-specific API responses kabhi
          // browser HTTP cache mein reh kar agle (alag) logged-in user ko
          // nahi milne chahiye. Caller options.cache se override kar sakta
          // hai agar kisi specific call ko genuinely cache karna ho.
          cache: options.cache || 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (res.status === 401) {
          logout(); // session storage clear ho jayegi
          if (typeof window !== 'undefined') {
            window.location.href = '/login?expired=1';
          }
          throw new Error('Session expire ho gayi hai. Dobara login karein.');
        }

        return res;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        store: state.store,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // ✅ PHASE 8 — refresh ke baad bhi last-selected dashboard yaad rahe
        activeDashboard: state.activeDashboard,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);