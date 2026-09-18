import { useAuthStore } from '../store/authStore';

/**
 * Handles the login side effects by updating the Zustand store
 */
export const handleLoginSuccess = (userData, token, role) => {
  useAuthStore.getState().login(userData, token, role);
};

/**
 * Handles logout cleanup
 */
export const handleLogout = () => {
  useAuthStore.getState().logout();
};


// frontend/lib/auth.js

/**
 * Zustand 'auth-storage' key se clean JWT token nikalta hai.
 * authStore mein persist name = 'auth-storage' hai.
 */
export const getCleanToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    // ✅ FIX: authStore.js mein persist() ka storage localStorage hai
    // (createJSONStorage(() => localStorage)) — sessionStorage se yahan
    // token kabhi nahi milta tha, isi liye logged-in user ko bhi
    // "Pehle login karein" alert aata tha. authStore ke asal storage se match karo.
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

/**
 * ✅ ALIAS: getToken = getCleanToken
 * Kai jagah getToken import ho raha tha — yeh fix karta hai bina saari files badley
 */
export const getToken = getCleanToken;

/**
 * Helper to manually sync sessionStorage data into the store if needed
 */
export const rehydrateAuthStoreFromStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    const rawData = localStorage.getItem('auth-storage'); // ✅ FIX: authStore localStorage use karta hai
    if (rawData) {
      const parsed = JSON.parse(rawData);
      const authState = parsed?.state;

      if (authState && authState.token && !useAuthStore.getState().token) {
        useAuthStore.getState().login(
          authState.user,
          authState.token,
          authState.role
        );
        return authState;
      }
    }
  } catch (error) {
    console.error("Error reading auth from localStorage:", error);
  }
  return null;
};