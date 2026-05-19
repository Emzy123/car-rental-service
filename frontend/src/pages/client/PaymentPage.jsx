import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Calendar, Car, Lock } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { formatDate } from '../../utils/dates.js';
import { formatMoney } from '../../lib/currency.js';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

export default function PaymentPage() {
  const { id: bookingId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => apiRequest(`/bookings/${bookingId}`),
  });

  async function payWithPaystack() {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({ booking_id: Number(bookingId) }),
      });
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
        return;
      }
      if (res.public_key && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: res.public_key,
          email: res.email,
          amount: Math.round(res.amount * 100),
          ref: res.reference,
          callback: (response) => {
            window.location.href = `/dashboard/bookings/${bookingId}/payment-callback?reference=${response.reference}`;
          },
        });
        handler.openIframe();
        return;
      }
      // dev-mode: simulate success redirect
      if (res.dev_mode) {
        window.location.href = `/dashboard/bookings/${bookingId}/payment-callback?reference=${res.reference}`;
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const booking = data?.booking;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-lg"
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-50">
          <CreditCard className="h-7 w-7 text-secondary-500" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-primary-500">Pay deposit</h1>
        <p className="mt-1 text-sm text-gray-500">
          Secure payment for booking <strong>#{bookingId}</strong>
        </p>
      </div>

      {booking && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {booking.vehicle?.photo_urls?.[0] && (
            <img
              src={booking.vehicle.photo_urls[0]}
              alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
              className="aspect-[16/7] w-full object-cover"
            />
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 font-semibold text-primary-500">
              <Car className="h-4 w-4 text-secondary-500" />
              {booking.vehicle?.make} {booking.vehicle?.model}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 text-secondary-500" />
              {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
            </div>

            <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Total booking value</span>
                <span>{formatMoney(booking.total_price, 'NGN')}</span>
              </div>
              {booking.deposit_amount && (
                <div className="flex justify-between font-bold text-primary-500">
                  <span>Deposit due now (20%)</span>
                  <span className="text-base">{formatMoney(booking.deposit_amount, 'NGN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <Button
        fullWidth
        size="lg"
        className="mt-5 gap-2"
        loading={loading}
        onClick={payWithPaystack}
      >
        <ShieldCheck className="h-4 w-4" />
        {loading ? 'Redirecting to Paystack…' : 'Pay with Paystack'}
      </Button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock className="h-3.5 w-3.5" /> Payments secured by Paystack · 256-bit SSL
      </p>

      <div className="mt-4 text-center">
        <Link to="/dashboard/bookings" className="text-sm text-gray-400 hover:text-primary-500">
          View my reservations
        </Link>
      </div>
    </motion.div>
  );
}
