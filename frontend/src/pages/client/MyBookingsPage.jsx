import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Car, MapPin, CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client.js';
import { formatDate } from '../../utils/dates.js';
import { formatMoney } from '../../lib/currency.js';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Dialog, DialogContent } from '../../components/ui/Dialog.jsx';

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  active: 'default',
  completed: 'default',
  cancelled: 'error',
};

function BookingCard({ booking, onCancelClick, index }) {
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const needsPay = booking.status === 'pending';
  const photo = booking.vehicle?.photo_urls?.[0];

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex flex-col sm:flex-row">
        {photo && (
          <div className="aspect-video w-full shrink-0 bg-gray-100 sm:aspect-auto sm:h-auto sm:w-40">
            <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-2 font-semibold text-primary-500">
                <Car className="h-4 w-4 text-secondary-500" />
                {booking.vehicle.make} {booking.vehicle.model}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
              </p>
              {booking.pickup_location && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" /> {booking.pickup_location}
                </p>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[booking.status] || 'default'} className="capitalize">
              {booking.status}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-primary-500">
              {formatMoney(booking.total_price, 'NGN')}
            </p>
            <div className="flex flex-wrap gap-2">
              {needsPay && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={`/dashboard/bookings/${booking.id}/pay`}>
                    <CreditCard className="h-3.5 w-3.5" /> Pay deposit
                  </Link>
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancelClick(booking)}
                  className="border-red-200 text-error hover:bg-red-50"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

function Section({ title, bookings, onCancelClick, emptyText }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-primary-500">{title}</h2>
      {bookings.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {bookings.map((b, i) => (
            <BookingCard key={b.id} booking={b} onCancelClick={onCancelClick} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => apiRequest('/bookings/my-bookings'),
  });

  const upcoming = data?.upcoming ?? [];
  const past = data?.past ?? [];

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await apiRequest(`/bookings/${cancelTarget.id}/cancel`, { method: 'POST' });
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setCancelTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center">
        <p className="text-error">Failed to load reservations.</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-500">My reservations</h1>
        <p className="mt-1 text-sm text-gray-400">{upcoming.length + past.length} total bookings</p>
      </div>

      <Section
        title="Upcoming"
        bookings={upcoming}
        onCancelClick={setCancelTarget}
        emptyText="No upcoming reservations. Ready to book your next drive?"
      />

      <Section
        title="Past"
        bookings={past}
        onCancelClick={setCancelTarget}
        emptyText="No past reservations yet."
      />

      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent title="Cancel booking">
          <p className="mt-1 text-sm text-gray-600">
            Are you sure you want to cancel your booking for{' '}
            <strong>{cancelTarget?.vehicle?.make} {cancelTarget?.vehicle?.model}</strong>?
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Cancellation policy applies. Any applicable refund will be processed within 5–7 business days.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep booking
            </Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>
              Yes, cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
