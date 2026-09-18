import { create } from 'zustand';
import { api } from '@/lib/api';

// ✅ FIX: authStore ke Zustand persist wale localStorage key 'auth-storage'
// se token check karta hai — bilkul waisa hi jaisa lib/api.js ka getToken()
// karta hai. Isi liye guest (logged-out) user ke liye wishlist API call
// nahi hoti — warna homepage pe hi 401 milta aur api.js ka interceptor
// forcefully /login pe redirect kar deta (bina user ne kuch kiye).
export const hasToken = () => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return !!parsed?.state?.token;
  } catch {
    return false;
  }
};

const useWishlistStore = create((set, get) => ({
  ids: new Set(),    // Set<carId> — CarCard ke heart icon ke liye O(1) lookup
  cars: [],          // poore car objects — /wishlist page ke liye

  partIds: new Set(), // Set<partId> — PartCard ke heart icon ke liye O(1) lookup
  parts: [],           // poore part objects — /wishlist page ke liye

  loading: false,
  initialized: false,

  // ✅ NEW — "unseen" notification-style counter, jaan-boojh kar `ids.size`
  // se ALAG rakha gaya hai. `ids.size` hamesha actual saved-cars count
  // hai (wishlist page pe visit karne se ye kabhi nahi ghatta). Lekin
  // Navbar ka badge ek "kya kuch naya add hua jab se maine wishlist page
  // nahi khola" wale notification jaisa behave karna chahiye — isi liye
  // ye alag counter hai jo sirf naya add hone par badhta hai, aur sirf
  // /wishlist page khulne par (markWishlistSeen ke through) 0 hota hai.
  unseenCount: 0,

  // Backend se poori wishlist fetch karta hai (GET /api/wishlist)
  fetchWishlist: async () => {
    if (!hasToken()) {
      set({ ids: new Set(), cars: [], initialized: true, loading: false });
      return;
    }
    if (get().loading) return; // ek se zyada CarCard ek sath mount na duplicate call karein
    set({ loading: true });
    try {
      const cars = await api.get('/wishlist');
      set({
        cars,
        ids: new Set(cars.map((c) => c.id)),
        loading: false,
        initialized: true,
      });
    } catch (err) {
      set({ loading: false, initialized: true });
    }
  },

  // ✅ NEW — Parts wishlist fetch karta hai (GET /api/wishlist/parts)
  fetchPartWishlist: async () => {
    if (!hasToken()) {
      set({ partIds: new Set(), parts: [] });
      return;
    }
    try {
      const parts = await api.get('/wishlist/parts');
      set({
        parts,
        partIds: new Set(parts.map((p) => p.id)),
      });
    } catch (err) {
      // ignore — page pe empty parts list dikhegi, dobara fetch try ho sakta hai
    }
  },

  // ✅ NEW — /wishlist page ke mount hote hi call hota hai, badge ko clear
  // karta hai. Actual saved cars (ids/cars) ko bilkul touch nahi karta —
  // sirf "unseen" notification counter reset hota hai.
  markWishlistSeen: () => set({ unseenCount: 0 }),

  isWished: (carId) => get().ids.has(carId),
  isPartWished: (partId) => get().partIds.has(partId),

  // ✅ Add/Remove toggle — pehle UI turant update (optimistic), phir backend
  // ke saath sync. Backend fail ho to purani state pe wapas (rollback).
  toggleWishlist: async (carId) => {
    if (!hasToken()) {
      throw new Error('AUTH_REQUIRED');
    }
    const { ids, cars, unseenCount } = get();
    const alreadyWished = ids.has(carId);
    const newIds = new Set(ids);

    if (alreadyWished) {
      newIds.delete(carId);
      set({ ids: newIds, cars: cars.filter((c) => c.id !== carId) });
    } else {
      newIds.add(carId);
      // ✅ naya car add hote hi unseen badge badhao — remove par nahi badhata,
      // sirf naya "add" hi ek notification-worthy activity hai.
      set({ ids: newIds, unseenCount: unseenCount + 1 });
    }

    try {
      if (alreadyWished) {
        await api.delete(`/wishlist/${carId}`);
      } else {
        await api.post(`/wishlist/${carId}`);
        // Poora car object cache karne ke liye background me refresh —
        // taake /wishlist page pe turant sahi data dikhe
        get().fetchWishlistSilent();
      }
    } catch (err) {
      set({ ids, cars, unseenCount }); // rollback
      throw err;
    }
  },

  // ✅ NEW — Parts ke liye same toggle logic
  togglePartWishlist: async (partId) => {
    if (!hasToken()) {
      throw new Error('AUTH_REQUIRED');
    }
    const { partIds, parts, unseenCount } = get();
    const alreadyWished = partIds.has(partId);
    const newPartIds = new Set(partIds);

    if (alreadyWished) {
      newPartIds.delete(partId);
      set({ partIds: newPartIds, parts: parts.filter((p) => p.id !== partId) });
    } else {
      newPartIds.add(partId);
      set({ partIds: newPartIds, unseenCount: unseenCount + 1 });
    }

    try {
      if (alreadyWished) {
        await api.delete(`/wishlist/parts/${partId}`);
      } else {
        await api.post(`/wishlist/parts/${partId}`);
        get().fetchPartWishlistSilent();
      }
    } catch (err) {
      set({ partIds, parts, unseenCount }); // rollback
      throw err;
    }
  },

  removeFromWishlist: async (carId) => {
    const prevCars = get().cars;
    const prevIds = get().ids;
    const newIds = new Set(prevIds);
    newIds.delete(carId);
    set({ ids: newIds, cars: prevCars.filter((c) => c.id !== carId) });
    try {
      await api.delete(`/wishlist/${carId}`);
    } catch (err) {
      set({ ids: prevIds, cars: prevCars }); // rollback
      throw err;
    }
  },

  // ✅ NEW — Parts ke liye same remove logic
  removePartFromWishlist: async (partId) => {
    const prevParts = get().parts;
    const prevPartIds = get().partIds;
    const newPartIds = new Set(prevPartIds);
    newPartIds.delete(partId);
    set({ partIds: newPartIds, parts: prevParts.filter((p) => p.id !== partId) });
    try {
      await api.delete(`/wishlist/parts/${partId}`);
    } catch (err) {
      set({ partIds: prevPartIds, parts: prevParts }); // rollback
      throw err;
    }
  },

  // fetchWishlist jaisa hi, lekin loading spinner re-trigger nahi karta —
  // add hone ke baad silently background me poori list refresh karta hai
  fetchWishlistSilent: async () => {
    if (!hasToken()) return;
    try {
      const cars = await api.get('/wishlist');
      set({ cars, ids: new Set(cars.map((c) => c.id)), initialized: true });
    } catch (err) {
      // ignore — agli manual fetch pe theek ho jayega
    }
  },

  // ✅ NEW — fetchPartWishlist jaisa hi, silent background refresh
  fetchPartWishlistSilent: async () => {
    if (!hasToken()) return;
    try {
      const parts = await api.get('/wishlist/parts');
      set({ parts, partIds: new Set(parts.map((p) => p.id)) });
    } catch (err) {
      // ignore — agli manual fetch pe theek ho jayega
    }
  },
}));

export { useWishlistStore };
export default useWishlistStore;