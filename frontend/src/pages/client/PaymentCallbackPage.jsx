import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

export default function PaymentCallbackPage() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setError('Missing payment reference.');
      return;
    }
    (async () => {
      try {
        await apiRequest('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({ reference }),
        });
        setStatus('success');
        setTimeout(() => navigate(`/dashboard/bookings/${bookingId}/confirmed`), 2000);
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    })();
  }, [reference, bookingId, navigate]);

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Spinner size="lg" />
        <p className="mt-5 font-medium text-primary-500">Verifying your payment…</p>
        <p className="mt-1 text-sm text-gray-400">Please wait, do not close this page.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md py-16 text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-10 w-10 text-error" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-primary-500">Payment failed</h1>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to={`/dashboard/bookings/${bookingId}/pay`}>Try again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/bookings">My reservations</Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-light"
      >
        <CheckCircle2 className="h-10 w-10 text-success" />
      </motion.div>
      <h1 className="mt-5 font-display text-2xl font-bold text-primary-500">Payment successful!</h1>
      <p className="mt-2 text-sm text-gray-500">
        Your booking is confirmed. Redirecting you now…
      </p>
      <div className="mt-6 flex justify-center">
        <Spinner size="sm" />
      </div>
      <p className="mt-4">
        <Link
          to={`/dashboard/bookings/${bookingId}/confirmed`}
          className="text-sm text-secondary-600 hover:underline"
        >
          Click here if you are not redirected
        </Link>
      </p>
    </motion.div>
  );
}
