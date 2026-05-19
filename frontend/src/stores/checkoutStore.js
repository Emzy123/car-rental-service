import { create } from 'zustand';

export const useCheckoutStore = create((set) => ({
  vehicleId: null,
  vehicle: null,
  startDate: null,
  endDate: null,
  pickupLocationId: null,
  returnLocationId: null,
  pickupTime: '10:00',
  returnTime: '10:00',
  specialRequests: '',
  flightNumber: '',
  driverDetails: null,
  extras: {
    insurance_tier: 'basic',
    gps: false,
    child_seat: false,
    additional_driver: false,
    roadside_assistance: false,
    prepaid_fuel: false,
  },
  setCheckout: (partial) => set((s) => ({ ...s, ...partial })),
  reset: () =>
    set({
      vehicleId: null,
      vehicle: null,
      driverDetails: null,
      extras: {
        insurance_tier: 'basic',
        gps: false,
        child_seat: false,
        additional_driver: false,
        roadside_assistance: false,
        prepaid_fuel: false,
      },
    }),
}));
