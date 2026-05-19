import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useScrollHeader } from '../../hooks/useScrollHeader.js';
import { Button } from '../ui/Button.jsx';
import { Sheet, SheetContent } from '../ui/Sheet.jsx';
import { cn } from '../../lib/cn.js';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/vehicles', label: 'Vehicles', end: false },
  { to: '/support', label: 'Support', end: false },
];

export function Header({ variant = 'default' }) {
  const solid = useScrollHeader();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const transparent = variant === 'transparent' && !solid;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        transparent
          ? 'border-transparent bg-gradient-to-b from-black/40 to-transparent text-white backdrop-blur-sm'
          : 'border-b border-gray-200/80 bg-white/95 text-primary-500 shadow-sm backdrop-blur-md'
      )}
    >
      {/* Skip to content — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-primary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500"
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link
          to="/"
          className={cn('font-display text-xl font-bold tracking-tight drop-shadow-md', transparent ? 'text-white' : 'text-primary-500')}
          aria-label="DriveRent — home"
        >
          Drive<span className={cn(transparent ? 'text-secondary-400 drop-shadow-md' : 'text-secondary-500')}>Rent</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition hover:text-secondary-400',
                  transparent ? 'text-white drop-shadow-md' : 'text-primary-600',
                  isActive && (transparent ? 'text-secondary-300' : 'text-secondary-500')
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className={cn(
                  'text-sm font-medium transition hover:text-secondary-400',
                  transparent ? 'text-white drop-shadow-md' : 'text-primary-600'
                )}
              >
                {user?.full_name?.split(' ')[0] || 'Dashboard'}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className={transparent ? 'text-white drop-shadow-md hover:bg-white/20' : 'text-primary-600'}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className={transparent ? 'text-white drop-shadow-md hover:bg-white/20' : ''}>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className={cn('rounded-lg p-2 md:hidden', transparent ? 'text-white drop-shadow-md hover:bg-white/20' : 'text-primary-500 hover:bg-gray-100')}
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" title="Menu" id="mobile-nav">
          <nav className="space-y-1" aria-label="Mobile">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary-50 text-secondary-600'
                      : 'text-primary-600 hover:bg-gray-100'
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-6">
            {isAuthenticated ? (
              <>
                <p className="px-3 text-xs text-gray-400">{user?.email}</p>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg bg-primary-500 px-3 py-2.5 text-center text-sm font-medium text-white"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg border border-primary-500 px-3 py-2.5 text-center text-sm font-medium text-primary-500"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg bg-secondary-500 px-3 py-2.5 text-center text-sm font-medium text-primary-900"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
