import { Link } from 'react-router-dom';

export default function VehicleCard({ vehicle, startDate, endDate }) {
  const photo = vehicle.photo_urls?.[0];
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate }).toString();

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="aspect-[16/10] bg-slate-100">
        {photo ? (
          <img src={photo} alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-sm text-slate-500">
          {vehicle.year} · {vehicle.fuel_type} · {vehicle.transmission}
        </p>
        <p className="mt-3 text-xl font-bold text-emerald-600">
          ${Number(vehicle.daily_rate).toFixed(2)}
          <span className="text-sm font-normal text-slate-500">/day</span>
        </p>
        <Link
          to={`/dashboard/vehicles/${vehicle.id}?${qs}`}
          className="mt-4 block w-full rounded-lg bg-emerald-600 py-2 text-center text-sm font-medium text-white hover:bg-emerald-500"
        >
          View & Book
        </Link>
      </div>
    </article>
  );
}
