import { Heart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client.js';
import VehicleCard from '../../components/vehicles/VehicleCard.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { defaultDates } from '../../utils/dates.js';

export default function SavedVehiclesPage() {
  const queryClient = useQueryClient();
  const defaults = defaultDates();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-vehicles'],
    queryFn: () => apiRequest('/saved-vehicles'),
  });

  const unsaveMutation = useMutation({
    mutationFn: (id) => apiRequest(`/saved-vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Removed from saved');
      queryClient.invalidateQueries({ queryKey: ['saved-vehicles'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const vehicles = data?.vehicles ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-primary-500">Saved Vehicles</h1>
      <p className="mt-1 text-sm text-gray-500">Vehicles you&apos;ve bookmarked for later.</p>

      {isLoading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <Heart className="h-12 w-12 text-gray-300" />
          <p className="mt-4 font-semibold text-gray-600">No saved vehicles yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Click the heart icon on any vehicle to save it here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="relative">
              <VehicleCard vehicle={v} startDate={defaults.start} endDate={defaults.end} />
              <button
                type="button"
                onClick={() => unsaveMutation.mutate(v.id)}
                disabled={unsaveMutation.isPending}
                aria-label="Remove from saved"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-red-50"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
