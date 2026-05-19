import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { Input } from '../ui/Input.jsx';
import { User, CreditCard, Phone, MapPin } from 'lucide-react';

export function DriverDetailsStep({ user }) {
  const checkout = useCheckoutStore();

  const d = checkout.driverDetails ?? {
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    driver_license_number: user?.driver_license_number ?? '',
    address: user?.address ?? '',
    date_of_birth: user?.date_of_birth?.slice(0, 10) ?? '',
  };

  function update(k, v) {
    checkout.setCheckout({ driverDetails: { ...d, [k]: v } });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="font-display text-xl font-bold text-primary-500">Driver details</h2>
      <p className="mt-1 text-sm text-gray-500">
        Please ensure these match your driver&apos;s license exactly.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          icon={<User className="h-4 w-4" />}
          value={d.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          required
        />
        <Input
          label="Phone number"
          type="tel"
          icon={<Phone className="h-4 w-4" />}
          value={d.phone}
          onChange={(e) => update('phone', e.target.value)}
          required
        />
        <Input
          label="Driver's license number"
          icon={<CreditCard className="h-4 w-4" />}
          value={d.driver_license_number}
          onChange={(e) => update('driver_license_number', e.target.value)}
          required
        />
        <Input
          label="Date of birth"
          type="date"
          value={d.date_of_birth}
          onChange={(e) => update('date_of_birth', e.target.value)}
          required
        />
      </div>
      <div className="mt-4">
        <Input
          label="Address"
          icon={<MapPin className="h-4 w-4" />}
          value={d.address}
          onChange={(e) => update('address', e.target.value)}
        />
      </div>

      <p className="mt-4 rounded-lg bg-primary-50 px-4 py-3 text-xs text-primary-600">
        Your details are stored securely and only used for rental purposes.
      </p>
    </div>
  );
}
