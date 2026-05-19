import { useState } from 'react';
import { apiRequest } from '../api/client.js';

export default function CancelBookingModal({ booking, cancellation, onClose, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCancel() {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest(`/bookings/${booking.id}/cancel`, { method: 'POST' });
      onCancelled(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const refund = cancellation?.estimated_refund ?? 0;
  const percent = (cancellation?.refund_percent ?? 0) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Cancel booking?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Booking #{booking.id} — {booking.vehicle?.make} {booking.vehicle?.model}
        </p>
        <p className="mt-4 text-sm text-slate-700">
          Estimated deposit refund: <strong>${refund.toFixed(2)}</strong> ({percent}% of deposit)
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm hover:bg-slate-50"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
          >
            {loading ? 'Cancelling...' : 'Confirm cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
