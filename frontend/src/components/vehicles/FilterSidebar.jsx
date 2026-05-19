import { useSearchStore } from '../../stores/searchStore.js';
import { Button } from '../ui/Button.jsx';
import { Checkbox } from '../ui/Checkbox.jsx';
import { Switch } from '../ui/Switch.jsx';

const CATEGORIES = ['luxury', 'suv', 'sports', 'electric', 'economy', 'van'];
const FEATURES = ['GPS', 'Bluetooth', 'Backup Camera', 'Leather Seats', '4WD'];

export function FilterSidebar({ onApply }) {
  const store = useSearchStore();

  return (
    <aside className="sticky top-24 space-y-6 rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h3 className="font-semibold text-primary-500">Price range / day</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={store.minPrice}
            onChange={(e) => store.setSearch({ minPrice: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={store.maxPrice}
            onChange={(e) => store.setSearch({ maxPrice: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-primary-500">Vehicle type</h3>
        <div className="mt-3 space-y-2">
          {CATEGORIES.map((c) => (
            <Checkbox
              key={c}
              label={c.charAt(0).toUpperCase() + c.slice(1)}
              checked={store.category === c}
              onCheckedChange={(checked) => store.setSearch({ category: checked ? c : '' })}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-primary-500">Fuel type</h3>
        <select
          value={store.fuelType}
          onChange={(e) => store.setSearch({ fuelType: e.target.value })}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        >
          <option value="">Any</option>
          {['petrol', 'diesel', 'hybrid', 'electric'].map((f) => (
            <option key={f} value={f}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <Switch
        label="Automatic transmission"
        checked={store.transmission === 'automatic'}
        onCheckedChange={(checked) =>
          store.setSearch({ transmission: checked ? 'automatic' : '' })
        }
      />

      <div>
        <h3 className="font-semibold text-primary-500">Seats (min)</h3>
        <div className="mt-2 flex gap-2">
          {[2, 4, 5, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => store.setSearch({ seats: store.seats === String(n) ? '' : String(n) })}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                store.seats === String(n)
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-300 hover:border-primary-300'
              }`}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-primary-500">Features</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEATURES.map((f) => {
            const active = store.features.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  const next = active
                    ? store.features.filter((x) => x !== f)
                    : [...store.features, f];
                  store.setSearch({ features: next });
                }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'border-secondary-500 bg-secondary-500/20 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" fullWidth onClick={() => store.resetFilters()}>
          Clear all
        </Button>
        <Button fullWidth onClick={onApply}>
          Apply
        </Button>
      </div>
    </aside>
  );
}
