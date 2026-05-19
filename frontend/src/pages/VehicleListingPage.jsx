import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LayoutGrid, List, SlidersHorizontal, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../api/client.js';
import { useSearchStore } from '../stores/searchStore.js';
import { FilterSidebar } from '../components/vehicles/FilterSidebar.jsx';
import VehicleCard from '../components/vehicles/VehicleCard.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Sheet, SheetContent } from '../components/ui/Sheet.jsx';

export default function VehicleListingPage() {
  const store = useSearchStore();
  const loadMoreRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = useInfiniteQuery({
    queryKey: ['vehicles', store.startDate, store.endDate, store.fuelType, store.transmission,
      store.category, store.minPrice, store.maxPrice, store.seats, store.features, store.sort],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        start_date: store.startDate,
        end_date: store.endDate,
        page: String(pageParam),
        limit: '9',
        sort: store.sort,
      });
      if (store.fuelType) params.set('fuel_type', store.fuelType);
      if (store.transmission) params.set('transmission', store.transmission);
      if (store.category) params.set('category', store.category);
      if (store.minPrice) params.set('min_price', store.minPrice);
      if (store.maxPrice) params.set('max_price', store.maxPrice);
      if (store.seats) params.set('seats', store.seats);
      if (store.features.length) params.set('features', store.features.join(','));
      return apiRequest(`/vehicles?${params}`);
    },
    getNextPageParam: (last) => last.page < last.pages ? last.page + 1 : undefined,
    initialPageParam: 1,
  });

  const vehicles = query.data?.pages.flatMap((p) => p.vehicles) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [query]);

  const activeFilters = [
    store.category && { key: 'category', label: store.category.charAt(0).toUpperCase() + store.category.slice(1) },
    store.fuelType && { key: 'fuelType', label: store.fuelType },
    store.transmission && { key: 'transmission', label: store.transmission },
    store.seats && { key: 'seats', label: `${store.seats}+ seats` },
    (store.minPrice || store.maxPrice) && { key: 'price', label: `₦${store.minPrice || '0'} – ₦${store.maxPrice || '∞'}` },
    ...store.features.map((f) => ({ key: `feat-${f}`, label: f })),
  ].filter(Boolean);

  function removeFilter(key) {
    if (key === 'category') store.setSearch({ category: '' });
    else if (key === 'fuelType') store.setSearch({ fuelType: '' });
    else if (key === 'transmission') store.setSearch({ transmission: '' });
    else if (key === 'seats') store.setSearch({ seats: '' });
    else if (key === 'price') store.setSearch({ minPrice: '', maxPrice: '' });
    else if (key.startsWith('feat-')) {
      store.setSearch({ features: store.features.filter((f) => `feat-${f}` !== key) });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:pb-8">
      <h1 className="font-display text-3xl font-bold text-primary-500">Find your vehicle</h1>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Desktop sidebar */}
        <div className="hidden w-72 shrink-0 lg:block">
          <FilterSidebar onApply={() => {}} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              <strong className="text-primary-500">{total}</strong> vehicles found
            </p>
            <div className="flex items-center gap-2">
              <select
                value={store.sort}
                onChange={(e) => store.setSearch({ sort: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="newest">Newest</option>
              </select>
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => store.setSearch({ viewMode: 'grid' })}
                  className={`p-2 transition-colors ${store.viewMode === 'grid' ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => store.setSearch({ viewMode: 'list' })}
                  className={`p-2 transition-colors ${store.viewMode === 'list' ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 rounded-full border border-secondary-300 bg-secondary-50 px-2.5 py-0.5 text-xs text-primary-700"
                >
                  {f.label}
                  <button
                    type="button"
                    onClick={() => removeFilter(f.key)}
                    aria-label={`Remove ${f.label} filter`}
                    className="ml-0.5 rounded-full hover:text-error"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => store.resetFilters()}
                className="text-xs text-gray-400 hover:text-error underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid / list */}
          {query.isLoading ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="mt-12 text-center">
              <p className="text-error">{query.error.message}</p>
              <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Retry</Button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="mt-20 flex flex-col items-center text-center">
              <Search className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-semibold text-gray-600">No vehicles found</p>
              <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or dates.</p>
              <Button variant="outline" className="mt-6" onClick={() => store.resetFilters()}>
                Clear filters
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={store.viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={
                  store.viewMode === 'list'
                    ? 'mt-6 flex flex-col gap-4'
                    : 'mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3'
                }
              >
                {vehicles.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  >
                    <VehicleCard
                      vehicle={v}
                      startDate={store.startDate}
                      endDate={store.endDate}
                      listView={store.viewMode === 'list'}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          <div ref={loadMoreRef} className="h-8" />
          {query.isFetchingNextPage && (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white p-3 shadow-lg lg:hidden">
        <Button
          fullWidth
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-bold text-primary-900">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" title="Filters">
          <FilterSidebar onApply={() => setFiltersOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
