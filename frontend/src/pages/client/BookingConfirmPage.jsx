import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client.js';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { Spinner } from '../../components/ui/Spinner.jsx';

export default function BookingConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkout = useCheckoutStore();

  const vehicleId = searchParams.get('vehicle_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicle', vehicleId, startDate, endDate],
    queryFn: () => apiRequest(`/vehicles/${vehicleId}?start_date=${startDate}&end_date=${endDate}`),
    enabled: !!vehicleId,
  });

  useEffect(() => {
    if (data?.vehicle) {
      checkout.setCheckout({
        vehicleId: Number(vehicleId),
        vehicle: data.vehicle,
        startDate,
        endDate,
      });
      navigate('/checkout', { replace: true });
    }
  }, [data, vehicleId, startDate, endDate, checkout, navigate]);

  if (!vehicleId) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-gray-500">Missing booking parameters.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-error">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-24 text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-500">Preparing your booking…</p>
    </div>
  );
}
