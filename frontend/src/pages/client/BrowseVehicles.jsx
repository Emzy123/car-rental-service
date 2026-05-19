import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client.js';
import VehicleCard from '../../components/VehicleCard.jsx';
import { defaultDates } from '../../utils/dates.js';

export default function BrowseVehicles() {
  const defaults = defaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(e) {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      if (fuelType) params.set('fuel_type', fuelType);
      if (transmission) params.set('transmission', transmission);
      const data = await apiRequest(`/vehicles?${params}`);
      setVehicles(data.vehicles);
    } catch (err) {
      setError(err.message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Find a vehicle</h1>
      <form onSubmit={search} className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">
          <span className="font-medium text-slate-700">Pick-up</span>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Return</span>
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Fuel</span>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Any</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Transmission</span>
          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Any</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && vehicles.length === 0 && !error && (
        <p className="mt-8 text-center text-slate-500">No vehicles available for these dates.</p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} startDate={startDate} endDate={endDate} />
        ))}
      </div>
    </div>
  );
}
