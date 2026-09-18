import { create } from 'zustand';

const useFilterStore = create((set) => ({
  filters: {
    province: '',
    city: '',
    brand: '',
    bodyType: '',
    minPrice: '',
    maxPrice: '',
    transmission: '',
    fuelType: '',
  },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    })),

  resetFilters: () =>
    set({
      filters: {
        province: '', city: '', brand: '', bodyType: '',
        minPrice: '', maxPrice: '',
        transmission: '', fuelType: ''
      }
    })
}));

export { useFilterStore };
export default useFilterStore;