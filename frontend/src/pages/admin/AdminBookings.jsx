import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client.js';
import { formatDate } from '../../utils/dates.js';
import { formatMoney } from '../../lib/currency.js';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

const STATUS_VARIANT = {
  pending: 'warning',
  confirmed: 'success',
  active: 'default',
  completed: 'default',
  cancelled: 'error',
};

const PATCH_STATUSES = ['confirmed', 'active', 'completed', 'cancelled'];

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-500">Bookings</h1>
        <p className="mt-1 text-sm text-gray-400">{data?.total ?? '—'} bookings total</p>
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
          {['pending','confirmed','active','completed','cancelled'].map((s) => (
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
                  <tr key={b.id} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3">
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
    </div>
  );
}
