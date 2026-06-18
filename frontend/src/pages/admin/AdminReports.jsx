import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Trophy, TrendingUp, Users, CalendarCheck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { formatMoney } from '../../lib/currency.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

const STATUS_COLORS = {
  confirmed: '#1e3a5f',
  active: '#d4af37',
  completed: '#22c55e',
  cancelled: '#ef4444',
  pending: '#94a3b8',
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function AdminReports() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => apiRequest('/admin/reports'),
    staleTime: 5 * 60_000,
  });

  const daily = data?.daily_revenue ?? [];
  const statuses = data?.status_breakdown ?? [];
  const topClients = data?.top_clients ?? [];
  const monthly = data?.monthly_bookings ?? [];

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = statuses.reduce((s, d) => s + d.count, 0);
  const completionRate = totalBookings
    ? Math.round(((statuses.find((s) => s.status === 'completed')?.count || 0) / totalBookings) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-500">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">Detailed performance metrics and trends.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Revenue (30 days)',
            value: isLoading ? '—' : formatMoney(totalRevenue, 'NGN'),
            icon: TrendingUp,
            color: 'text-secondary-500',
            bg: 'bg-secondary-50',
          },
          {
            label: 'Total bookings',
            value: isLoading ? '—' : totalBookings,
            icon: CalendarCheck,
            color: 'text-primary-500',
            bg: 'bg-primary-50',
          },
          {
            label: 'Completion rate',
            value: isLoading ? '—' : `${completionRate}%`,
            icon: Users,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
              {isLoading
                ? <Skeleton className="mt-1.5 h-6 w-24" />
                : <p className="mt-0.5 text-xl font-bold text-primary-500">{value}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Revenue */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-primary-500">Daily revenue — last 30 days</h2>
        {isLoading ? (
          <Skeleton className="mt-4 h-56" />
        ) : daily.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-400">No payment data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220} className="mt-4">
            <BarChart data={daily} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatMoney(v, 'NGN')} />
              <Bar dataKey="revenue" fill="#d4af37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly bookings + Status breakdown */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Monthly booking volume */}
        <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary-500">Monthly bookings & revenue (12 months)</h2>
          {isLoading ? (
            <Skeleton className="mt-4 h-52" />
          ) : monthly.length === 0 ? (
            <p className="mt-8 text-center text-sm text-gray-400">No booking data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={210} className="mt-4">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="bookings" stroke="#1e3a5f" fill="url(#bookGrad)" strokeWidth={2} name="Bookings" />
                <Bar yAxisId="right" dataKey="revenue" fill="#d4af37" radius={[3, 3, 0, 0]} name="Revenue (₦)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking status donut */}
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary-500">Booking status breakdown</h2>
          {isLoading ? (
            <Skeleton className="mt-4 h-52" />
          ) : statuses.length === 0 ? (
            <p className="mt-8 text-center text-sm text-gray-400">No bookings yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160} className="mt-4">
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                  >
                    {statuses.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5">
                {statuses.map((s) => (
                  <li key={s.status} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: STATUS_COLORS[s.status] || '#cbd5e1' }}
                      />
                      <span className="capitalize text-gray-600">{s.status}</span>
                    </span>
                    <span className="font-semibold text-primary-500">{s.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Top clients */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-secondary-500" />
          <h2 className="font-semibold text-primary-500">Top clients by spend</h2>
        </div>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : topClients.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-400">No client data yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Client', 'Bookings', 'Total spent'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topClients.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-lg">{MEDAL[i] ?? `${i + 1}`}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-500">{c.full_name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.booking_count}</td>
                    <td className="px-4 py-3 font-semibold text-secondary-600">{formatMoney(c.total_spent, 'NGN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
