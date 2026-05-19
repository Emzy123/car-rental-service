import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Car, CalendarDays, Heart, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../lib/cn.js';

const navItems = [
  { to: '/dashboard/bookings', label: 'My Bookings', icon: CalendarDays, end: false },
  { to: '/dashboard/saved', label: 'Saved Vehicles', icon: Heart, end: false },
  { to: '/dashboard/profile', label: 'Profile', icon: User, end: false },
];

function SidebarContent({ user, logout, onClose }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-primary-800 px-5 py-4">
        <Link to="/" className="font-display text-lg font-bold text-white" onClick={onClose}>
          Drive<span className="text-secondary-400">Rent</span>
        </Link>
        <p className="mt-0.5 text-xs text-primary-300">Client portal</p>
      </div>

      <div className="border-b border-primary-800 px-5 py-3">
        <p className="text-sm font-medium text-white">{user?.full_name || 'Welcome back'}</p>
        <p className="truncate text-xs text-primary-400">{user?.email}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <NavLink
          to="/vehicles"
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive ? 'bg-secondary-500/20 text-secondary-400' : 'text-primary-200 hover:bg-primary-800 hover:text-white')
          }
          onClick={onClose}
        >
          <Car className="h-4 w-4 shrink-0" />
          Browse Fleet
        </NavLink>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-secondary-500/20 text-secondary-400' : 'text-primary-200 hover:bg-primary-800 hover:text-white')
            }
            onClick={onClose}
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
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 bg-primary-900 lg:flex lg:flex-col">
        <SidebarContent user={user} logout={logout} onClose={() => {}} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-primary-900">
            <SidebarContent user={user} logout={logout} onClose={() => setMobileOpen(false)} />
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
          <Link to="/" className="font-display text-lg font-bold text-primary-500">
            Drive<span className="text-secondary-500">Rent</span>
          </Link>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
