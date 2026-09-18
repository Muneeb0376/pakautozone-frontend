// hooks/useProtectedAction.js
// Use this hook on any button that requires login

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

/**
 * Returns a wrapper that:
 *  - If logged in: runs the action
 *  - If NOT logged in: shows the auth modal
 *
 * Usage:
 *   const { execute, AuthModalComponent } = useProtectedAction();
 *
 *   <button onClick={() => execute(() => addToWishlist(carId), 'Wishlist ke liye sign in karo')}>
 *     Save Car
 *   </button>
 *   {AuthModalComponent}
 */

import AuthModal from '@/components/ui/AuthModal';

export function useProtectedAction() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [modalConfig, setModalConfig] = useState(null);

  const execute = (action, message, redirectAfter) => {
    if (user) {
      action();
    } else {
      setModalConfig({ message, redirectAfter });
    }
  };

  const AuthModalComponent = modalConfig ? (
    <AuthModal
      message={modalConfig.message}
      redirectAfter={modalConfig.redirectAfter}
      onClose={() => setModalConfig(null)}
    />
  ) : null;

  return { execute, AuthModalComponent };
}

export default useProtectedAction;