import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, Download, X, Car, User, CreditCard, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client.js';
import { formatDate } from '../../utils/dates.js';
import { formatMoney } from '../../lib/currency.js';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Sheet, SheetContent } from '../../components/ui/Sheet.jsx';

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  active: 'default',
  completed: 'default',
  cancelled: 'error',
};

const PATCH_STATUSES = ['confirmed', 'active', 'completed', 'cancelled'];

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function downloadCSV(url, filename) {
  const token = localStorage.getItem('token');
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    })
    .catch(() => toast.error('Export failed'));
}

function BookingDetailDrawer({ bookingId, onClose }) {
  const queryClient = useQueryClient();
  const [returnOdometer, setReturnOdometer] = useState('');
  const [damageCharge, setDamageCharge] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-booking-detail', bookingId],
    queryFn: () => apiRequest(`/admin/bookings/${bookingId}`),
    enabled: !!bookingId,
  });

  const returnMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          return_odometer: Number(returnOdometer) || undefined,
          damage_charge: Number(damageCharge) || 0,
        }),
      }),
    onSuccess: () => {
      toast.success('Return processed — booking completed');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-booking-detail', bookingId] });
    },
    onError: (err) => toast.error(err.message),
  });

  const b = data?.booking;
  const payments = data?.payments ?? [];

  return (
    <SheetContent side="right" className="w-[480px] max-w-[95vw]" title="Booking details">
      {isLoading ? (
        <div className="space-y-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      ) : !b ? (
        <p className="pt-6 text-center text-sm text-gray-400">Booking not found.</p>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Status & ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Booking #{b.id}</span>
            <Badge variant={STATUS_VARIANT[b.status] || 'default'} className="capitalize text-xs">
              {b.status}
            </Badge>
          </div>

          {/* Vehicle */}
          <section className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-primary-500">Vehicle</h3>
            </div>
            <p className="font-medium">{b.vehicle_make} {b.vehicle_model} ({b.vehicle_year})</p>
            <p className="text-xs text-gray-400 mt-0.5">{b.license_plate} · {b.vehicle_category}</p>
            <p className="text-xs text-gray-400">{formatMoney(b.daily_rate, 'NGN')}/day</p>
          </section>

          {/* Client */}
          <section className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-primary-500">Client</h3>
            </div>
            <p className="font-medium">{b.client_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{b.client_email}</p>
            {b.client_phone && <p className="text-xs text-gray-400">{b.client_phone}</p>}
          </section>

          {/* Dates & Locations */}
          <section className="rounded-lg border border-gray-100 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pickup</span>
              <span className="font-medium">{formatDate(b.start_date)} {b.pickup_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Return</span>
              <span className="font-medium">{formatDate(b.end_date)} {b.return_time}</span>
            </div>
            {b.pickup_location_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup location</span>
                <span className="font-medium text-right max-w-[55%]">{b.pickup_location_name}</span>
              </div>
            )}
            {b.return_location_name && (
              <div className="flex justify-between">
                <span className="text-gray-500">Return location</span>
                <span className="font-medium text-right max-w-[55%]">{b.return_location_name}</span>
              </div>
            )}
          </section>

          {/* Pricing */}
          <section className="rounded-lg border border-gray-100 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total price</span>
              <span className="font-bold text-primary-500">{formatMoney(b.total_price, 'NGN')}</span>
            </div>
            {b.damage_charge > 0 && (
              <div className="flex justify-between text-error">
                <span>Damage charge</span>
                <span className="font-medium">{formatMoney(b.damage_charge, 'NGN')}</span>
              </div>
            )}
            {b.special_requests && (
              <div>
                <span className="text-gray-500">Special requests</span>
                <p className="mt-0.5 text-gray-700 text-xs">{b.special_requests}</p>
              </div>
            )}
          </section>

          {/* Payments */}
          {payments.length > 0 && (
            <section className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-primary-500" />
                <h3 className="text-sm font-semibold text-primary-500">Payments</h3>
              </div>
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-gray-600">{p.type}</span>
                    <span className={`font-medium ${p.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      {formatMoney(p.amount, 'NGN')} · {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Return processing — only for active bookings */}
          {b.status === 'active' && (
            <section className="rounded-lg border-2 border-secondary-300 bg-secondary-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-secondary-600" />
                <h3 className="text-sm font-semibold text-secondary-700">Process vehicle return</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="font-medium text-gray-700">Pickup odometer (km)</span>
                  <input
                    type="number"
                    value={b.pickup_odometer ?? ''}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm opacity-60"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-medium text-gray-700">Return odometer (km) *</span>
                  <input
                    type="number"
                    value={returnOdometer}
                    onChange={(e) => setReturnOdometer(e.target.value)}
                    placeholder="e.g. 54210"
                    min={b.pickup_odometer ?? 0}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
                  />
                </label>
              </div>
              <label className="block text-xs">
                <span className="font-medium text-gray-700">Damage charge (₦) — leave 0 if none</span>
                <input
                  type="number"
                  value={damageCharge}
                  onChange={(e) => setDamageCharge(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
                />
              </label>
              <Button
                fullWidth
                loading={returnMutation.isPending}
                onClick={() => returnMutation.mutate()}
                disabled={!returnOdometer}
              >
                Complete return
              </Button>
            </section>
          )}
        </div>
      )}
    </SheetContent>
  );
}

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, status, search],
    queryFn: () => {
      const p = new URLSearchParams({ page, limit: 12 });
      if (status) p.set('status', status);
      if (search) p.set('search', search);
      return apiRequest(`/admin/bookings?${p}`);
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status: s }) =>
      apiRequest(`/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
    onSuccess: () => {
      toast.success('Booking updated');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const bookings = data?.bookings ?? [];
  const totalPages = data?.pages ?? 1;

  function handleExport() {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (search) p.set('search', search);
    downloadCSV(`${API_BASE}/admin/bookings/export?${p}`, `bookings-${new Date().toISOString().split('T')[0]}.csv`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-500">Bookings</h1>
          <p className="mt-1 text-sm text-gray-400">{data?.total ?? '—'} bookings total</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 shrink-0">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search client, vehicle…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'active', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Client', 'Vehicle', 'Dates', 'Total', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              : bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedId(b.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-500">#{b.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-500">{b.client_name}</p>
                      <p className="text-xs text-gray-400">{b.client_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{b.vehicle_make} {b.vehicle_model}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(b.start_date)} →<br />{formatDate(b.end_date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-500">
                      {formatMoney(b.total_price, 'NGN')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[b.status] || 'default'} className="capitalize">
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={b.status}
                        onChange={(e) => patchMutation.mutate({ id: b.id, status: e.target.value })}
                        className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-secondary-500 focus:outline-none"
                      >
                        {PATCH_STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Booking detail drawer */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        {selectedId && (
          <BookingDetailDrawer bookingId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </Sheet>
    </div>
  );
}
