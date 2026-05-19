import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultDates } from '../utils/dates.js';

const defaults = defaultDates();

export const useSearchStore = create(
  persist(
    (set) => ({
      pickupLocationId: null,
      returnLocationId: null,
      startDate: defaults.start,
      endDate: defaults.end,
      category: '',
      fuelType: '',
      transmission: '',
      minPrice: '',
      maxPrice: '',
      seats: '',
      features: [],
      sort: 'recommended',
      viewMode: 'grid',
      setSearch: (partial) => set((s) => ({ ...s, ...partial })),
      resetFilters: () =>
        set({
          category: '',
          fuelType: '',
          transmission: '',
          minPrice: '',
          maxPrice: '',
          seats: '',
          features: [],
          sort: 'recommended',
        }),
    }),
    { name: 'driverent-search' }
  )
);
