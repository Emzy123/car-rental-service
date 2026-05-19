import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Car, CalendarCheck, DollarSign, Activity } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { formatMoney } from '../../lib/currency.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

const PIE_COLORS = ['#1e3a5f', '#d4af37', '#5a7eb5', '#a8892a', '#9eb5d4', '#e8c52e'];

function StatCard({ title, value, sub, trend, icon: Icon, loading }) {
  if (loading) return <Skeleton className="h-32 rounded-xl" />;
  const up = trend >= 0;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-primary-500">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-500" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${up ? 'text-success' : 'text-error'}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

export default function AdminOverview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiRequest('/admin/dashboard/stats'),
    refetchInterval: 60_000,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['admin-charts'],
    queryFn: () => apiRequest('/admin/dashboard/charts'),
    staleTime: 5 * 60_000,
  });

  const { data: activityData } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => apiRequest('/admin/activity'),
    refetchInterval: 30_000,
  });
  const activity = activityData?.activity;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-500">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Real-time overview of your fleet and bookings.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue MTD"
          value={formatMoney(stats?.revenue_mtd || 0, 'NGN')}
          trend={stats?.revenue_trend_percent}
          icon={DollarSign}
          loading={statsLoading}
        />
        <StatCard
          title="Active bookings"
          value={stats?.active_bookings ?? '—'}
          sub="confirmed + in progress"
          icon={CalendarCheck}
          loading={statsLoading}
        />
        <StatCard
          title="Fleet size"
          value={stats?.fleet_size ?? '—'}
          sub="non-retired vehicles"
          icon={Car}
          loading={statsLoading}
        />
        <StatCard
          title="Utilisation"
          value={`${stats?.utilization_rate ?? '—'}%`}
          sub="vehicles on road today"
          icon={Activity}
          loading={statsLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary-500">Revenue trend (12 months)</h2>
          {chartsLoading ? (
            <Skeleton className="mt-4 h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={220} className="mt-4">
              <AreaChart data={charts?.revenue_trend || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatMoney(v, 'NGN')} />
                <Area type="monotone" dataKey="revenue" stroke="#1e3a5f" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bookings by category */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary-500">Bookings by category</h2>
          {chartsLoading ? (
            <Skeleton className="mt-4 h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={220} className="mt-4">
              <PieChart>
                <Pie
                  data={charts?.utilization_by_category || []}
                  dataKey="bookings"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(charts?.utilization_by_category || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top locations + activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top pickup locations */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary-500">Top pickup locations</h2>
          {chartsLoading ? (
            <Skeleton className="mt-4 h-40" />
          ) : (
            <ResponsiveContainer width="100%" height={180} className="mt-4">
              <BarChart data={charts?.top_locations || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#d4af37" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-primary-500">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {(!activity || activity.length === 0) && (
              <p className="text-sm text-gray-400">No recent activity.</p>
            )}
            {(activity || []).slice(0, 8).map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs text-primary-500">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-gray-700">{a.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
