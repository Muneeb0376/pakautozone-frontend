import { useState, useEffect } from 'react';

export function useWishlist() {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  const toggle = (carId) => {
    const updated = wishlist.includes(carId)
      ? wishlist.filter(id => id !== carId)
      : [...wishlist, carId];
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const isWishlisted = (carId) => wishlist.includes(carId);

  return { wishlist, toggle, isWishlisted };
}