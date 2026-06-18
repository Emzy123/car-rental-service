import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Edit2,
  Trash2,
  ArrowRight,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { formatDate, rentalDays } from '../utils/dates.js';
import { formatMoney } from '../lib/currency.js';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { Spinner } from './ui/Spinner.jsx';
import { Input } from './ui/Input.jsx';

const TIMES = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  active: 'default',
  completed: 'default',
  cancelled: 'error',
};

export default function BookingDetailDrawer({ bookingId, onClose, onCancelTrigger }) {
  const queryClient = useQueryClient();
  const [isModifying, setIsModifying] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pricingPreview, setPricingPreview] = useState(null);

  // Fetch full booking details (including payments and cancellation policy)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking-detail', bookingId],
    queryFn: () => apiRequest(`/bookings/${bookingId}`),
    enabled: !!bookingId,
  });

  // Fetch locations for the modification dropdowns
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiRequest('/locations'),
  });

  const booking = data?.booking;
  const payments = data?.payments ?? [];
  const cancellation = data?.cancellation;
  const locations = locationsData?.locations ?? [];

  // Modification form state
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    pickup_time: '',
    return_time: '',
    pickup_location_id: '',
    return_location_id: '',
    special_requests: ''
  });

  // Pre-fill form state when entering modify mode
  useEffect(() => {
    if (booking) {
      setForm({
        start_date: booking.start_date?.slice(0, 10) || '',
        end_date: booking.end_date?.slice(0, 10) || '',
        pickup_time: booking.pickup_time?.slice(0, 5) || '10:00',
        return_time: booking.return_time?.slice(0, 5) || '10:00',
        pickup_location_id: booking.pickup_location_id || '',
        return_location_id: booking.return_location_id || '',
        special_requests: booking.special_requests || ''
      });
    }
  }, [booking, isModifying]);

  // Live preview of pricing on form date changes
  useEffect(() => {
    if (!isModifying || !booking || !form.start_date || !form.end_date) {
      setPricingPreview(null);
      setPreviewError('');
      return;
    }

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setPreviewError('Pickup date cannot be in the past');
      setPricingPreview(null);
      return;
    }
    if (end <= start) {
      setPreviewError('Return date must be after pickup date');
      setPricingPreview(null);
      return;
    }

    setPreviewError('');
    setPreviewLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await apiRequest('/bookings/preview', {
          method: 'POST',
          body: JSON.stringify({
            vehicle_id: booking.vehicle_id,
            start_date: form.start_date,
            end_date: form.end_date,
            extras: booking.extras
          })
        });
        setPricingPreview(response.pricing);
      } catch (err) {
        setPreviewError(err.message || 'Vehicle not available for these dates');
        setPricingPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.start_date, form.end_date, isModifying, booking]);

  // Submit modification
  const modifyMutation = useMutation({
    mutationFn: (body) => apiRequest(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    }),
    onSuccess: (res) => {
      toast.success(res.message || 'Reservation modified successfully');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', bookingId] });
      setIsModifying(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to modify reservation');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-error" />
        <p className="mt-4 text-sm text-gray-500">Failed to load booking details.</p>
        <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCancellable = ['pending', 'confirmed'].includes(booking.status);
  const photo = booking.vehicle?.photo_urls?.[0];

  // Financial summary calculations
  const days = rentalDays(booking.start_date, booking.end_date);
  const vehicleRate = Number(booking.vehicle?.daily_rate || 0);
  const subtotal = vehicleRate * days;
  const extrasTotal = Number(booking.extras_total || 0);
  const taxAmount = Number(booking.total_price) - subtotal - extrasTotal;

  // Completed payments sum
  const depositPaid = payments
    .filter((p) => p.status === 'completed' && p.type === 'deposit')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const refundPaid = payments
    .filter((p) => p.status === 'completed' && p.type === 'refund')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const balanceDue = Math.max(0, Number(booking.total_price) - depositPaid + refundPaid);

  function handleSaveModification(e) {
    e.preventDefault();
    modifyMutation.mutate({
      start_date: form.start_date,
      end_date: form.end_date,
      pickup_time: form.pickup_time,
      return_time: form.return_time,
      pickup_location_id: form.pickup_location_id ? Number(form.pickup_location_id) : null,
      return_location_id: form.return_location_id ? Number(form.return_location_id) : null,
      special_requests: form.special_requests || null
    });
  }

  return (
    <div className="space-y-6">
      {/* View Mode */}
      {!isModifying ? (
        <div className="space-y-6">
          {/* Header Card with Image */}
          {photo && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-900 shadow-md">
              <img src={photo} alt="" className="h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400">
                  {booking.vehicle?.category}
                </p>
                <h3 className="text-xl font-bold font-display">
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  Plate: {booking.vehicle?.license_plate} • {booking.vehicle?.year}
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs text-gray-400">Booking Ref</p>
              <p className="text-sm font-bold text-primary-500 uppercase">
                {payments[0]?.paystack_reference?.slice(0, 12) || `BK-${booking.id}`}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[booking.status] || 'default'} className="capitalize text-xs px-2.5 py-1">
              {booking.status}
            </Badge>
          </div>

          {/* Timeline Route Card */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Rental Route</h4>
            <div className="relative pl-6 before:absolute before:left-2.5 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gray-200">
              {/* Pickup location & time */}
              <div className="relative mb-6">
                <span className="absolute -left-6 top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                <p className="text-xs font-semibold text-gray-400">PICKUP</p>
                <p className="text-sm font-bold text-primary-500 mt-0.5">
                  {booking.pickup_location || 'Kotoka Airport'}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3 w-3" /> {formatDate(booking.start_date)} at <Clock className="h-3 w-3 ml-1" /> {booking.pickup_time?.slice(0, 5) || '10:00'}
                </p>
              </div>

              {/* Return location & time */}
              <div className="relative">
                <span className="absolute -left-6 top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-4 ring-red-50" />
                <p className="text-xs font-semibold text-gray-400">RETURN</p>
                <p className="text-sm font-bold text-primary-500 mt-0.5">
                  {booking.return_location || 'Kotoka Airport'}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3 w-3" /> {formatDate(booking.end_date)} at <Clock className="h-3 w-3 ml-1" /> {booking.return_time?.slice(0, 5) || '10:00'}
                </p>
              </div>
            </div>
          </div>

          {/* Selected Extras */}
          {booking.extras && Object.keys(booking.extras).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Add-ons & Extras</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(booking.extras).map(([key, val]) => {
                  if (!val) return null;
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <div key={key} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2.5 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-gray-700">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Requests */}
          {booking.special_requests && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Special Notes</h4>
              <div className="rounded-lg border border-gray-150 bg-gray-50 p-3 text-xs text-gray-600 italic">
                &ldquo;{booking.special_requests}&rdquo;
              </div>
            </div>
          )}

          {/* Pricing Receipt */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Financial Summary</h4>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm space-y-2.5">
              <div className="flex justify-between text-gray-500">
                <span>Daily Rental ({days} days @ {formatMoney(vehicleRate, 'NGN')})</span>
                <span className="font-medium text-primary-500">{formatMoney(subtotal, 'NGN')}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Extras & Add-ons</span>
                  <span className="font-medium text-primary-500">{formatMoney(extrasTotal, 'NGN')}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>VAT & Tax</span>
                  <span className="font-medium text-primary-500">{formatMoney(taxAmount, 'NGN')}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-primary-500 text-base">
                <span>Total Booking Cost</span>
                <span>{formatMoney(booking.total_price, 'NGN')}</span>
              </div>

              <div className="border-t border-dashed border-gray-100 pt-2.5 space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Deposit Paid (20%)</span>
                  <span className="font-semibold text-emerald-600">{formatMoney(depositPaid, 'NGN')}</span>
                </div>
                {refundPaid > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Refunded Amount</span>
                    <span className="font-semibold">- {formatMoney(refundPaid, 'NGN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold bg-gray-50 p-2 rounded-lg text-primary-500">
                  <span>Outstanding Balance</span>
                  <span>{formatMoney(balanceDue, 'NGN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payments list logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Transaction History</h4>
            {payments.length === 0 ? (
              <p className="text-xs text-gray-400">No payment logs found for this reservation.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 font-semibold uppercase border-b border-gray-100">
                      <th className="p-3">Ref</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-[10px] text-gray-500">
                          {p.paystack_reference ? p.paystack_reference.slice(0, 10) + '...' : `pm_${p.id}`}
                        </td>
                        <td className="p-3 capitalize text-gray-600 font-medium">{p.type}</td>
                        <td className="p-3 font-semibold text-primary-500">{formatMoney(Number(p.amount), 'NGN')}</td>
                        <td className="p-3">
                          <Badge variant={p.status === 'completed' ? 'success' : 'warning'} className="capitalize scale-90 -translate-x-1">
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons Group */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            {isCancellable && (
              <Button
                variant="outline"
                onClick={() => {
                  onCancelTrigger(booking);
                  onClose();
                }}
                className="gap-2 border-red-200 text-error hover:bg-red-50 flex-1 min-h-[46px]"
              >
                <Trash2 className="h-4 w-4" /> Cancel Booking
              </Button>
            )}
            {isCancellable && (
              <Button
                variant="primary"
                onClick={() => setIsModifying(true)}
                className="gap-2 flex-1 min-h-[46px]"
              >
                <Edit2 className="h-4 w-4" /> Modify Dates
              </Button>
            )}
            {isPending && (
              <Button asChild className="gap-2 flex-1 min-h-[46px]">
                <Link to={`/dashboard/bookings/${booking.id}/pay`}>
                  <CreditCard className="h-4 w-4" /> Pay Deposit
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Modification Mode */
        <form onSubmit={handleSaveModification} className="space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="h-5 w-5 text-secondary-500" />
            <h3 className="text-base font-bold text-primary-500">Modify Reservation Dates</h3>
          </div>

          {/* Location Dropdowns */}
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="font-semibold text-gray-700">Pickup Location</span>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.pickup_location_id}
                  onChange={(e) => setForm({ ...form, pickup_location_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
                >
                  <option value="">Select location</option>
                  {locations.filter((l) => l.is_active).map((l) => (
                    <option key={l.id} value={l.id}>{l.name} — {l.city}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-gray-700">Return Location</span>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.return_location_id}
                  onChange={(e) => setForm({ ...form, return_location_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
                >
                  <option value="">Select location</option>
                  {locations.filter((l) => l.is_active).map((l) => (
                    <option key={l.id} value={l.id}>{l.name} — {l.city}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          {/* Date & Time Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Pickup Date"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />

            <label className="block text-sm">
              <span className="font-semibold text-gray-700">Pickup Time</span>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.pickup_time}
                  onChange={(e) => setForm({ ...form, pickup_time: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none"
                >
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </label>

            <Input
              label="Return Date"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />

            <label className="block text-sm">
              <span className="font-semibold text-gray-700">Return Time</span>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.return_time}
                  onChange={(e) => setForm({ ...form, return_time: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none"
                >
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </label>
          </div>

          {/* Special Requests */}
          <label className="block text-sm">
            <span className="font-semibold text-gray-700">Special requests</span>
            <textarea
              rows={2}
              value={form.special_requests}
              onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
              placeholder="Any special notes or requirements..."
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
            />
          </label>

          {/* Pricing Preview / Date Validation */}
          {previewLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <Spinner size="sm" />
              <span>Checking vehicle availability and calculating new price...</span>
            </div>
          )}

          {previewError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{previewError}</span>
            </div>
          )}

          {pricingPreview && (
            <div className="rounded-xl border border-secondary-100 bg-secondary-50/50 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-600 uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> Live Modification Preview
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Current Total:</span>
                  <span className="font-medium text-gray-600">{formatMoney(booking.total_price, 'NGN')}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">New Total ({pricingPreview.days} days):</span>
                  <span className="font-bold text-primary-500">{formatMoney(pricingPreview.total_price, 'NGN')}</span>
                </div>
              </div>
              
              {/* Difference output */}
              <div className="border-t border-secondary-200/40 pt-2 text-xs">
                {pricingPreview.total_price > booking.total_price ? (
                  <p className="text-amber-600 font-semibold">
                    Price will increase by {formatMoney(pricingPreview.total_price - booking.total_price, 'NGN')}. Outstanding balance will adjust accordingly.
                  </p>
                ) : pricingPreview.total_price < booking.total_price ? (
                  <p className="text-emerald-600 font-semibold">
                    Price will decrease by {formatMoney(booking.total_price - pricingPreview.total_price, 'NGN')}. Savings will be applied.
                  </p>
                ) : (
                  <p className="text-gray-500 font-medium">No change in total price.</p>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModifying(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={modifyMutation.isPending}
              disabled={!!previewError || previewLoading || (pricingPreview === null && (form.start_date !== booking.start_date?.slice(0, 10) || form.end_date !== booking.end_date?.slice(0, 10)))}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
