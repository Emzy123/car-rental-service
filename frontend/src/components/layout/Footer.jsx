import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

const columns = [
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/' },
      { label: 'Careers', to: '/' },
      { label: 'Press', to: '/' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/support' },
      { label: 'Contact', to: '/support' },
      { label: 'FAQs', to: '/support' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', to: '/' },
      { label: 'Privacy', to: '/' },
      { label: 'Cookies', to: '/' },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  function subscribe(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg('Please enter a valid email');
      return;
    }
    setMsg('Thanks for subscribing!');
    setEmail('');
  }

  return (
    <footer className="border-t border-gray-200 bg-primary-900 text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-display text-xl font-bold text-white">
            Drive<span className="text-secondary-500">Rent</span>
          </p>
          <p className="mt-3 max-w-sm text-sm">
            Premium vehicles with white-glove service worldwide.
          </p>
          <form onSubmit={subscribe} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 text-white placeholder:text-gray-400"
              aria-label="Newsletter email"
            />
            <Button type="submit" variant="secondary" size="md">
              Subscribe
            </Button>
          </form>
          {msg && <p className="text-sm text-secondary-500">{msg}</p>}
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-semibold text-white">{col.title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="hover:text-secondary-500">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-6 text-center text-sm">
        © {new Date().getFullYear()} DriveRent. All rights reserved.
      </div>
    </footer>
  );
}
