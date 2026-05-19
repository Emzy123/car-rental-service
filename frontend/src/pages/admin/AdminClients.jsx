import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { formatDate } from '../../utils/dates.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

export default function AdminClients() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-500">Clients</h1>
        <p className="mt-1 text-sm text-gray-400">{data?.total ?? '—'} registered clients</p>
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
                  <tr key={c.id} className="hover:bg-gray-50">
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
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.is_active
                            ? 'bg-success-light text-success'
                            : 'bg-error-light text-error'
                        }`}
                      >
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
    </div>
  );
}
