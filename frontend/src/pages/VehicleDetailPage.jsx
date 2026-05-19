import { useState } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, CheckCircle2, Fuel, Settings2, Users, Luggage } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../api/client.js';
import { useSearchStore } from '../stores/searchStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ImageGallery } from '../components/vehicles/ImageGallery.jsx';
import { BookingWidget } from '../components/vehicles/BookingWidget.jsx';
import VehicleCard from '../components/vehicles/VehicleCard.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { defaultDates } from '../utils/dates.js';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const store = useSearchStore();
  const defaults = defaultDates();
  const startDate = searchParams.get('start_date') || store.startDate || defaults.start;
  const endDate = searchParams.get('end_date') || store.endDate || defaults.end;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicle', id, startDate, endDate],
    queryFn: () => apiRequest(`/vehicles/${id}?start_date=${startDate}&end_date=${endDate}`),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saved
        ? apiRequest(`/saved-vehicles/${id}`, { method: 'DELETE' })
        : apiRequest('/saved-vehicles', { method: 'POST', body: JSON.stringify({ vehicle_id: Number(id) }) }),
    onSuccess: () => {
      setSaved((s) => !s);
      toast.success(saved ? 'Removed from saved' : 'Saved to your list');
      queryClient.invalidateQueries({ queryKey: ['saved-vehicles'] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data?.vehicle) {
    return <p className="py-20 text-center text-error">{error?.message || 'Vehicle not found'}</p>;
  }

  const { vehicle, available_for_dates, similar_vehicles = [] } = data;

  const specs = [
    { icon: Users, label: 'Seats', value: vehicle.seats || 5 },
    { icon: Luggage, label: 'Luggage', value: `${vehicle.luggage_capacity || 2} bags` },
    { icon: Fuel, label: 'Fuel', value: vehicle.fuel_type },
    { icon: Settings2, label: 'Transmission', value: vehicle.transmission },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
    >
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary-500">Home</Link>
        <span>/</span>
        <Link to="/vehicles" className="hover:text-primary-500">Vehicles</Link>
        <span>/</span>
        <span className="capitalize text-primary-500">{vehicle.category}</span>
        <span>/</span>
        <span className="text-gray-700">{vehicle.make} {vehicle.model}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImageGallery images={vehicle.photo_urls} alt={`${vehicle.make} ${vehicle.model}`} />

          <div className="mt-6">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-bold text-primary-500">
                    {vehicle.make} {vehicle.model}
                  </h1>
                  <Badge variant="gold" className="capitalize">{vehicle.category}</Badge>
                  {!available_for_dates && <Badge variant="error">Unavailable for selected dates</Badge>}
                </div>
                <p className="mt-2 text-gray-500">{vehicle.year} · {vehicle.license_plate}</p>
              </div>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  aria-label={saved ? 'Remove from saved' : 'Save vehicle'}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 transition-colors hover:border-red-300 hover:bg-red-50"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  />
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {specs.map((s) => (
              <div key={s.label} className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-4">
                <s.icon className="h-5 w-5 text-secondary-500" />
                <p className="mt-2 text-xs text-gray-500">{s.label}</p>
                <p className="mt-0.5 font-semibold capitalize text-primary-500 text-sm">{s.value}</p>
              </div>
            ))}
          </div>

          {vehicle.features?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-primary-500">Features &amp; amenities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {vehicle.features.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary-500" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl bg-primary-50 p-6">
            <h2 className="font-semibold text-primary-500">What&apos;s included</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {[
                'Basic insurance coverage',
                '24/7 roadside support',
                'Free cancellation (48h+ before pickup)',
                'Unlimited mileage on selected vehicles',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <BookingWidget vehicle={vehicle} startDate={startDate} endDate={endDate} available={available_for_dates} />
        </div>
      </div>

      {similar_vehicles.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-primary-500">Similar vehicles</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar_vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} startDate={startDate} endDate={endDate} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
