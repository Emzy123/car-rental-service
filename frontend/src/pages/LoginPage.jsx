import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(from ?? (user.role === 'admin' ? '/admin' : '/dashboard'));
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
            <h1 className="font-display text-3xl font-bold text-primary-500">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-500">
              New here?{' '}
              <Link to="/register" className="font-medium text-secondary-600 hover:underline">
                Create an account
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
              label="Email address"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-2">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link to="/" className="hover:text-primary-500">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
