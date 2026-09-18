'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import LoginWarningModal from '../components/ui/LoginWarningModal';

export function useProtected() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const requireAuth = (callback) => {
    if (isAuthenticated) {
      if (typeof callback === 'function') callback();
    } else {
      setIsModalOpen(true);
    }
  };

  // LoginWarningModal render block component helper
  const AuthModalComponent = () => (
    <LoginWarningModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
    />
  );

  return {
    requireAuth,
    AuthModalComponent
  };
}