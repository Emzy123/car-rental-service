import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchStore } from '../../stores/searchStore.js';
import { apiRequest } from '../../api/client.js';
import { Button } from '../ui/Button.jsx';
import { defaultDates } from '../../utils/dates.js';

export function SearchWidget({ compact = false }) {
  const navigate = useNavigate();
  const store = useSearchStore();
  const defaults = defaultDates();
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    apiRequest('/locations')
      .then((d) => setLocations(d.locations || []))
      .catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate('/vehicles');
  }

  return (
    <form
      onSubmit={handleSearch}
      className={
        compact
          ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-5'
          : 'grid gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md sm:grid-cols-2 sm:p-6 lg:grid-cols-5'
      }
    >
      <label className="text-left text-sm">
        <span className="mb-1 flex items-center gap-1 font-medium text-white drop-shadow-sm">
          <MapPin className="h-4 w-4" /> Pickup location
        </span>
        <select
          value={store.pickupLocationId || ''}
          onChange={(e) =>
            store.setSearch({
              pickupLocationId: e.target.value ? Number(e.target.value) : null,
              returnLocationId: store.returnLocationId || Number(e.target.value) || null,
            })
          }
          className="w-full min-h-[44px] rounded-lg border border-white/30 bg-white/95 px-3 py-2.5 text-primary-500"
        >
          <option value="">Any location</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.city}
            </option>
          ))}
        </select>
      </label>
      <label className="text-left text-sm">
        <span className="mb-1 flex items-center gap-1 font-medium text-white drop-shadow-sm">
          <Calendar className="h-4 w-4" /> Pickup date
        </span>
        <input
          type="date"
          required
          min={defaults.start}
          value={store.startDate}
          onChange={(e) => store.setSearch({ startDate: e.target.value })}
          className="w-full min-h-[44px] rounded-lg border border-white/30 bg-white/95 px-3 py-2.5 text-primary-500"
        />
      </label>
      <label className="text-left text-sm">
        <span className="mb-1 flex items-center gap-1 font-medium text-white drop-shadow-sm">
          <Calendar className="h-4 w-4" /> Return date
        </span>
        <input
          type="date"
          required
          min={store.startDate}
          value={store.endDate}
          onChange={(e) => store.setSearch({ endDate: e.target.value })}
          className="w-full min-h-[44px] rounded-lg border border-white/30 bg-white/95 px-3 py-2.5 text-primary-500"
        />
      </label>
      <label className="text-left text-sm sm:col-span-2 lg:col-span-1">
        <span className="mb-1 block font-medium text-white drop-shadow-sm">Category</span>
        <select
          value={store.category}
          onChange={(e) => store.setSearch({ category: e.target.value })}
          className="w-full min-h-[44px] rounded-lg border border-white/30 bg-white/95 px-3 py-2.5 text-primary-500"
        >
          <option value="">All categories</option>
          {['luxury', 'suv', 'sports', 'electric', 'economy', 'van'].map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="submit" variant="secondary" size="lg" fullWidth className="min-h-[48px]">
          Find Cars
        </Button>
      </div>
    </form>
  );
}
