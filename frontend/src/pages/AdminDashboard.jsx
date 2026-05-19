import { useState, lazy, Suspense } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, CalendarCheck, Users,
  LogOut, Menu, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { cn } from '../lib/cn.js';

const AdminOverview = lazy(() => import('./admin/AdminOverview.jsx'));
const AdminFleet = lazy(() => import('./admin/AdminFleet.jsx'));
const AdminBookings = lazy(() => import('./admin/AdminBookings.jsx'));
const AdminClients = lazy(() => import('./admin/AdminClients.jsx'));

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/fleet', label: 'Fleet', icon: Car, end: false },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
  { to: '/admin/clients', label: 'Clients', icon: Users, end: false },
];

function AdminSidebar({ user, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-full flex-col bg-primary-900">
      <div className="border-b border-primary-800 px-5 py-4">
        <Link to="/" className="font-display text-lg font-bold text-white" onClick={onClose}>
          Drive<span className="text-secondary-400">Rent</span>
        </Link>
        <p className="mt-0.5 text-xs text-primary-300">Admin panel</p>
      </div>
      <div className="border-b border-primary-800 px-5 py-3">
        <p className="text-sm font-medium text-white">{user?.full_name || 'Admin'}</p>
        <p className="truncate text-xs text-primary-400">{user?.email}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-secondary-500/20 text-secondary-400'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg border border-primary-700 px-3 py-2 text-sm text-primary-300 transition-colors hover:bg-primary-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <AdminSidebar user={user} onClose={() => {}} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56">
            <AdminSidebar user={user} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="text-primary-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display font-bold text-primary-500">
            Drive<span className="text-secondary-500">Rent</span> Admin
          </span>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="fleet" element={<AdminFleet />} />
              <Route path="fleet/*" element={<AdminFleet />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="*" element={<AdminOverview />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
