import { CheckCircle2, Lock, CreditCard } from 'lucide-react';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { useConfig } from '../../hooks/useConfig.js';
import { calculateClientPricing } from '../../lib/pricing.js';
import { formatMoney } from '../../lib/currency.js';
import { rentalDays } from '../../utils/dates.js';

export function PaymentStep() {
  const checkout = useCheckoutStore();
  const { data: config } = useConfig();
  const currency = config?.currency_code || 'NGN';
  const days = rentalDays(checkout.startDate, checkout.endDate);
  const pricing = calculateClientPricing(
    checkout.vehicle?.daily_rate,
    days,
    checkout.extras,
    {
      ...config?.pricing?.extras,
      taxRatePercent: config?.pricing?.tax_rate_percent,
      depositPercent: config?.pricing?.deposit_percent,
    }
  );

  const rows = [
    { label: `${days} days × ${formatMoney(checkout.vehicle?.daily_rate, currency)}`, value: pricing.subtotal },
    pricing.extras_total > 0 && { label: 'Extras', value: pricing.extras_total },
    { label: 'Taxes & fees', value: pricing.tax_amount },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Order summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-display text-xl font-bold text-primary-500">Order summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between text-gray-600">
              <span>{r.label}</span>
              <span>{formatMoney(r.value, currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-bold text-primary-500">
            <span>Total</span>
            <span className="text-lg">{formatMoney(pricing.total_price, currency)}</span>
          </div>
        </div>
      </div>

      {/* Deposit notice */}
      <div className="rounded-xl border border-secondary-300 bg-secondary-50 p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-secondary-600" />
          <div>
            <p className="font-semibold text-primary-500">
              Deposit due now: {formatMoney(pricing.deposit_amount, currency)}
            </p>
            <p className="mt-0.5 text-sm text-gray-600">
              The remaining balance of {formatMoney(pricing.total_price - pricing.deposit_amount, currency)} is
              collected at pickup.
            </p>
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold text-primary-500">What happens next</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          {[
            'Your booking is created immediately after clicking "Create booking & pay".',
            'You will be redirected to securely pay the deposit via Paystack.',
            'Confirmation and voucher sent to your email.',
            'Present your booking voucher and driver\'s license at pickup.',
          ].map((s) => (
            <li key={s} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Security badge */}
      <p className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Lock className="h-3.5 w-3.5" /> Payments secured by Paystack 256-bit encryption
      </p>
    </div>
  );
}
