import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { useConfig } from '../../hooks/useConfig.js';
import { calculateClientPricing } from '../../lib/pricing.js';
import { formatMoney } from '../../lib/currency.js';
import { rentalDays } from '../../utils/dates.js';
import { Card, CardContent, CardHeader } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Checkbox } from '../ui/Checkbox.jsx';

export function BookingWidget({ vehicle, startDate, endDate, available = true }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const checkout = useCheckoutStore();
  const { data: config } = useConfig();
  const currency = config?.currency_code || 'NGN';
  const days = rentalDays(startDate, endDate);
  const pricing = calculateClientPricing(
    vehicle.daily_rate,
    days,
    checkout.extras,
    {
      ...config?.pricing?.extras,
      taxRatePercent: config?.pricing?.tax_rate_percent,
      depositPercent: config?.pricing?.deposit_percent,
    }
  );

  function reserve() {
    checkout.setCheckout({ vehicleId: vehicle.id, vehicle, startDate, endDate });
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  }

  return (
    <Card className="sticky top-24 shadow-lg">
      <CardHeader>
        <h3 className="font-semibold text-primary-500">Book this vehicle</h3>
        <p className="text-sm text-gray-500">
          {startDate} → {endDate} · <strong>{days}</strong> days
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!available && (
          <div className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">
            Not available for the selected dates. Please choose different dates.
          </div>
        )}

        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Add-ons</p>
        <Checkbox
          label={`GPS navigation (+${formatMoney(config?.pricing?.extras?.gpsPerDay || 5, currency)}/day)`}
          checked={checkout.extras.gps}
          onCheckedChange={(c) => checkout.setCheckout({ extras: { ...checkout.extras, gps: !!c } })}
        />
        <Checkbox
          label={`Child seat (+${formatMoney(config?.pricing?.extras?.childSeatPerDay || 7, currency)}/day)`}
          checked={checkout.extras.child_seat}
          onCheckedChange={(c) => checkout.setCheckout({ extras: { ...checkout.extras, child_seat: !!c } })}
        />
        <Checkbox
          label={`Additional driver (+${formatMoney(config?.pricing?.extras?.additionalDriverPerDay || 10, currency)}/day)`}
          checked={checkout.extras.additional_driver}
          onCheckedChange={(c) => checkout.setCheckout({ extras: { ...checkout.extras, additional_driver: !!c } })}
        />

        <div className="space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{days} days × {formatMoney(vehicle.daily_rate, currency)}</span>
            <span>{formatMoney(pricing.subtotal, currency)}</span>
          </div>
          {pricing.extras_total > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Extras</span>
              <span>{formatMoney(pricing.extras_total, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Taxes &amp; fees</span>
            <span>{formatMoney(pricing.tax_amount, currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-primary-500">
            <span>Total</span>
            <span>{formatMoney(pricing.total_price, currency)}</span>
          </div>
          <p className="text-xs text-gray-400">
            Deposit due now: <strong>{formatMoney(pricing.deposit_amount, currency)}</strong>
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={reserve}
          disabled={!available}
        >
          Reserve Now
        </Button>
        <p className="text-center text-xs text-gray-400">Free cancellation 48h+ before pickup</p>
      </CardContent>
    </Card>
  );
}
