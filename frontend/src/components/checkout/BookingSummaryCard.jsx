import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { useConfig } from '../../hooks/useConfig.js';
import { calculateClientPricing } from '../../lib/pricing.js';
import { formatMoney } from '../../lib/currency.js';
import { rentalDays } from '../../utils/dates.js';
import { Card, CardContent, CardHeader } from '../ui/Card.jsx';

export function BookingSummaryCard() {
  const checkout = useCheckoutStore();
  const { data: config } = useConfig();
  const currency = config?.currency_code || 'NGN';
  const vehicle = checkout.vehicle;

  if (!vehicle) return null;

  const days = rentalDays(checkout.startDate, checkout.endDate);
  const pricing = calculateClientPricing(vehicle.daily_rate, days, checkout.extras, {
    ...config?.pricing?.extras,
    taxRatePercent: config?.pricing?.tax_rate_percent,
    depositPercent: config?.pricing?.deposit_percent,
  });

  const photo = vehicle.photo_urls?.[0];

  return (
    <Card className="sticky top-24 h-fit">
      <CardHeader>
        <h3 className="font-semibold text-primary-500">Booking summary</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {photo && (
          <img src={photo} alt="" className="aspect-video w-full rounded-lg object-cover" />
        )}
        <p className="font-semibold">
          {vehicle.make} {vehicle.model}
        </p>
        <p className="text-sm text-gray-500">
          {checkout.startDate} → {checkout.endDate}
        </p>
        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>{days} days rental</span>
            <span>{formatMoney(pricing.subtotal, currency)}</span>
          </div>
          {pricing.extras_total > 0 && (
            <div className="flex justify-between">
              <span>Extras</span>
              <span>{formatMoney(pricing.extras_total, currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatMoney(pricing.tax_amount, currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-primary-500">
            <span>Total</span>
            <span>{formatMoney(pricing.total_price, currency)}</span>
          </div>
          <p className="text-xs text-gray-500">
            Deposit due now: {formatMoney(pricing.deposit_amount, currency)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

