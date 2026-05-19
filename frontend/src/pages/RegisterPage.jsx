import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', driver_license_number: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-primary-500">Create account</h1>
            <p className="mt-2 text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-secondary-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Full name"
              icon={<User className="h-4 w-4" />}
              value={form.full_name}
              onChange={update('full_name')}
              autoComplete="name"
              required
            />
            <Input
              label="Email address"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              minLength={8}
              helper="Minimum 8 characters"
              required
            />
            <Input
              label="Phone number"
              type="tel"
              icon={<Phone className="h-4 w-4" />}
              value={form.phone}
              onChange={update('phone')}
              autoComplete="tel"
              helper="Optional — used for booking notifications"
            />
            <Input
              label="Driver's license number"
              icon={<CreditCard className="h-4 w-4" />}
              value={form.driver_license_number}
              onChange={update('driver_license_number')}
              helper="Optional — required at vehicle pickup"
            />
            <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-2">
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400">
            By registering you agree to our{' '}
            <span className="underline cursor-pointer">Terms of Service</span> and{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link to="/" className="hover:text-primary-500">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
