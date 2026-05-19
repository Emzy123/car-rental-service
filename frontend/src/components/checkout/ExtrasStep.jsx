import { Shield, Navigation, Baby, UserPlus, Wrench, Fuel } from 'lucide-react';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { useConfig } from '../../hooks/useConfig.js';
import { formatMoney } from '../../lib/currency.js';
import { rentalDays } from '../../utils/dates.js';

const INSURANCE_TIERS = [
  { id: 'basic', label: 'Basic', description: 'Liability & third-party coverage', price: 0 },
  { id: 'standard', label: 'Standard', description: 'Collision damage waiver included', price: 15 },
  { id: 'premium', label: 'Premium', description: 'Full coverage, zero excess', price: 35 },
];

const ADDON_ITEMS = [
  { key: 'gps', icon: Navigation, label: 'GPS navigation', configKey: 'gpsPerDay', fallback: 5 },
  { key: 'child_seat', icon: Baby, label: 'Child seat', configKey: 'childSeatPerDay', fallback: 7 },
  { key: 'additional_driver', icon: UserPlus, label: 'Additional driver', configKey: 'additionalDriverPerDay', fallback: 10 },
  { key: 'roadside_assistance', icon: Wrench, label: 'Roadside assistance', configKey: 'roadsideAssistancePerDay', fallback: 8 },
  { key: 'prepaid_fuel', icon: Fuel, label: 'Pre-paid fuel', configKey: 'prepaidFuelPerDay', fallback: 20 },
];

export function ExtrasStep() {
  const checkout = useCheckoutStore();
  const { data: config } = useConfig();
  const currency = config?.currency_code || 'NGN';
  const extras = config?.pricing?.extras ?? {};
  const days = rentalDays(checkout.startDate, checkout.endDate);

  function toggleAddon(key) {
    checkout.setCheckout({
      extras: { ...checkout.extras, [key]: !checkout.extras[key] },
    });
  }

  function setInsurance(tier) {
    checkout.setCheckout({ extras: { ...checkout.extras, insurance_tier: tier } });
  }

  return (
    <div className="space-y-6">
      {/* Insurance */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-primary-500">
          <Shield className="mr-2 inline-block h-5 w-5 text-secondary-500" />
          Insurance coverage
        </h2>
        <p className="mt-1 text-sm text-gray-500">Choose the level of protection you need.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {INSURANCE_TIERS.map((tier) => {
            const selected = checkout.extras.insurance_tier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setInsurance(tier.id)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selected
                    ? 'border-secondary-500 bg-secondary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-primary-500">{tier.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{tier.description}</p>
                <p className="mt-2 font-bold text-primary-500">
                  {tier.price === 0
                    ? 'Included'
                    : `+${formatMoney(tier.price * days, currency)}`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add-ons */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-primary-500">Add-ons</h2>
        <p className="mt-1 text-sm text-gray-500">Enhance your rental with optional extras.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ADDON_ITEMS.map(({ key, icon: Icon, label, configKey, fallback }) => {
            const perDay = extras[configKey] ?? fallback;
            const active = checkout.extras[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleAddon(key)}
                className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  active
                    ? 'border-secondary-500 bg-secondary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-secondary-500/20' : 'bg-gray-100'}`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-primary-500' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-500">{label}</p>
                  <p className="text-xs text-gray-500">
                    +{formatMoney(perDay, currency)}/day · {formatMoney(perDay * days, currency)} total
                  </p>
                </div>
                <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${active ? 'border-secondary-500 bg-secondary-500' : 'border-gray-300'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
