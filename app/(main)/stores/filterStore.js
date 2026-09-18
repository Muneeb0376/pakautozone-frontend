import { create } from 'zustand';

export const useFilterStore = create((set) => ({
  filters: {},
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    })),
  resetFilters: () => set({ filters: {} }),
}));