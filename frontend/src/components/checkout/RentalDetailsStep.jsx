import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock } from 'lucide-react';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { apiRequest } from '../../api/client.js';

const TIMES = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

export function RentalDetailsStep() {
  const checkout = useCheckoutStore();

  const { data } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiRequest('/locations'),
    staleTime: 10 * 60_000,
  });
  const locations = data?.locations ?? [];

  const field = (label, value, onChange, type = 'text', extra = {}) => (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
        {...extra}
      />
    </label>
  );

  const locationSelect = (label, key) => (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="relative mt-1.5">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <select
          value={checkout[key] ?? ''}
          onChange={(e) => checkout.setCheckout({ [key]: e.target.value || null })}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
        >
          <option value="">Select location</option>
          {locations.filter((l) => l.is_active).map((l) => (
            <option key={l.id} value={l.id}>{l.name} — {l.city}</option>
          ))}
        </select>
      </div>
    </label>
  );

  const timeSelect = (label, key) => (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="relative mt-1.5">
        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <select
          value={checkout[key]}
          onChange={(e) => checkout.setCheckout({ [key]: e.target.value })}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
        >
          {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </label>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="font-display text-xl font-bold text-primary-500">Rental details</h2>
      <p className="mt-1 text-sm text-gray-500">Set your pickup and return preferences.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {field('Pickup date', checkout.startDate, (v) => checkout.setCheckout({ startDate: v }), 'date', { required: true })}
        {timeSelect('Pickup time', 'pickupTime')}
        {field('Return date', checkout.endDate, (v) => checkout.setCheckout({ endDate: v }), 'date', { required: true })}
        {timeSelect('Return time', 'returnTime')}
        {locationSelect('Pickup location', 'pickupLocationId')}
        {locationSelect('Return location', 'returnLocationId')}
      </div>

      <div className="mt-4">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Flight number <span className="font-normal text-gray-400">(optional)</span></span>
          <input
            type="text"
            value={checkout.flightNumber ?? ''}
            onChange={(e) => checkout.setCheckout({ flightNumber: e.target.value })}
            placeholder="e.g. AA1234"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
          />
        </label>
      </div>

      <div className="mt-4">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Special requests <span className="font-normal text-gray-400">(optional)</span></span>
          <textarea
            rows={3}
            value={checkout.specialRequests ?? ''}
            onChange={(e) => checkout.setCheckout({ specialRequests: e.target.value })}
            placeholder="Any special requirements for your rental…"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
          />
        </label>
      </div>
    </div>
  );
}
