import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, User, Download, ShieldOff, ShieldCheck, CalendarCheck } from 'lucide-react';
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

function ClientDetailDrawer({ clientId }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-client-detail', clientId],
    queryFn: () => apiRequest(`/admin/clients/${clientId}`),
    enabled: !!clientId,
  });

  const toggleMutation = useMutation({
    mutationFn: () => apiRequest(`/admin/clients/${clientId}/status`, { method: 'PATCH' }),
    onSuccess: (res) => {
      toast.success(`${res.client.full_name} ${res.client.is_active ? 'activated' : 'suspended'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-client-detail', clientId] });
    },
    onError: (err) => toast.error(err.message),
  });

  const client = data?.client;
  const bookings = data?.bookings ?? [];

  return (
    <SheetContent side="right" className="w-[440px] max-w-[95vw]" title="Client profile">
      {isLoading ? (
        <div className="space-y-3 pt-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      ) : !client ? (
        <p className="pt-6 text-center text-sm text-gray-400">Client not found.</p>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100">
              <User className="h-7 w-7 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary-500 truncate">{client.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{client.email}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                client.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                {client.is_active ? 'Active' : 'Suspended'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-100 p-3 text-center">
              <p className="text-xl font-bold text-primary-500">{client.booking_count}</p>
              <p className="text-xs text-gray-400">Total bookings</p>
            </div>
            <div className="rounded-lg border border-gray-100 p-3 text-center">
              <p className="text-lg font-bold text-secondary-600">{formatMoney(client.total_spent, 'NGN')}</p>
              <p className="text-xs text-gray-400">Total spent</p>
            </div>
          </div>

          {/* Details */}
          <section className="space-y-2 text-sm">
            {client.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{client.phone}</span>
              </div>
            )}
            {client.driver_license_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">Driver license</span>
                <span className="font-medium">{client.driver_license_number}</span>
              </div>
            )}
            {client.address && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Address</span>
                <span className="font-medium text-right">{client.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Member since</span>
              <span className="font-medium">{formatDate(client.created_at)}</span>
            </div>
          </section>

          {/* Suspend / Activate */}
          <Button
            variant={client.is_active ? 'danger' : 'outline'}
            fullWidth
            loading={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate()}
            className="gap-2"
          >
            {client.is_active
              ? <><ShieldOff className="h-4 w-4" /> Suspend client</>
              : <><ShieldCheck className="h-4 w-4" /> Activate client</>}
          </Button>

          {/* Recent bookings */}
          {bookings.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-4 w-4 text-primary-500" />
                <h3 className="text-sm font-semibold text-primary-500">Recent bookings</h3>
              </div>
              <ul className="space-y-2">
                {bookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs">
                    <div>
                      <p className="font-medium text-gray-700">{b.vehicle_make} {b.vehicle_model}</p>
                      <p className="text-gray-400">{formatDate(b.start_date)} → {formatDate(b.end_date)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={STATUS_VARIANT[b.status] || 'default'} className="capitalize mb-1">
                        {b.status}
                      </Badge>
                      <p className="font-medium text-primary-500">{formatMoney(b.total_price, 'NGN')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </SheetContent>
  );
}

export default function AdminClients() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-clients', page, search],
    queryFn: () => {
      const p = new URLSearchParams({ page, limit: 15 });
      if (search) p.set('search', search);
      return apiRequest(`/admin/clients?${p}`);
    },
  });

  const clients = data?.clients ?? [];
  const totalPages = data?.pages ?? 1;

  function handleExport() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    downloadCSV(`${API_BASE}/admin/clients/export?${p}`, `clients-${new Date().toISOString().split('T')[0]}.csv`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-500">Clients</h1>
          <p className="mt-1 text-sm text-gray-400">{data?.total ?? '—'} registered clients</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 shrink-0">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email…"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Client', 'Phone', 'License', 'Joined', 'Bookings', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              : clients.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100">
                          <User className="h-4 w-4 text-primary-500" />
                        </div>
                        <div>
                          <p className="font-medium text-primary-500">{c.full_name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.driver_license_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-primary-500">{c.booking_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.is_active
                          ? 'bg-success-light text-success'
                          : 'bg-error-light text-error'
                      }`}>
                        {c.is_active ? 'Active' : 'Suspended'}
                      </span>
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

      {/* Client detail drawer */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        {selectedId && <ClientDetailDrawer clientId={selectedId} />}
      </Sheet>
    </div>
  );
}
