import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Car, MapPin } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { formatDate } from '../../utils/dates.js';
import { formatMoney } from '../../lib/currency.js';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

export default function BookingConfirmedPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiRequest(`/bookings/${id}`);
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!id) {
    return (
      <div className="py-20 text-center">
        <p className="text-error">Invalid booking reference</p>
        <Link to="/dashboard/bookings" className="mt-4 inline-block text-secondary-600 hover:underline">
          View my reservations
        </Link>
      </div>
    );
  }
  if (!data) return (
    <div className="py-20 text-center">
      <p className="text-error">Booking not found</p>
      <Link to="/dashboard/bookings" className="mt-4 inline-block text-secondary-600 hover:underline">
        View my reservations
      </Link>
    </div>
  );

  const { booking } = data;
  const currency = 'NGN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-lg"
    >
      {/* Success icon */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-light"
        >
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>
        <h1 className="mt-5 font-display text-3xl font-bold text-primary-500">Booking Confirmed!</h1>
        <p className="mt-2 text-gray-500">
          Reservation <strong>#{booking.id}</strong> has been confirmed. Check your email for details.
        </p>
      </div>

      {/* Booking card */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {booking.vehicle?.photo_urls?.[0] && (
          <img
            src={booking.vehicle.photo_urls[0]}
            alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
            className="aspect-video w-full object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold text-primary-500">
                <Car className="h-4 w-4 text-secondary-500" />
                {booking.vehicle.make} {booking.vehicle.model}
              </p>
              <p className="mt-0.5 text-xs capitalize text-gray-400">{booking.vehicle.category}</p>
            </div>
            <span className="rounded-full bg-success-light px-3 py-1 text-xs font-medium capitalize text-success">
              {booking.status}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-secondary-500" />
              <span>{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</span>
            </div>
            {booking.pickup_location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-secondary-500" />
                <span>{booking.pickup_location}</span>
              </div>
            )}
          </div>

          <div className="mt-5 border-t pt-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatMoney(booking.total_price, currency)}</span>
            </div>
            <div className="mt-1 flex justify-between font-bold text-primary-500">
              <span>Total paid / due</span>
              <span className="text-lg">{formatMoney(booking.total_price, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild fullWidth>
          <Link to="/dashboard/bookings">View my reservations</Link>
        </Button>
        <Button asChild variant="outline" fullWidth>
          <Link to="/vehicles">Browse more vehicles</Link>
        </Button>
      </div>
    </motion.div>
  );
}
