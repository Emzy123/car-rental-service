import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client.js';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog, DialogContent } from '../../components/ui/Dialog.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

const TYPE_LABELS = { airport: 'Airport', city: 'City', hotel: 'Hotel', port: 'Port' };

const EMPTY_FORM = { name: '', city: '', type: 'city' };

function LocationForm({ initial, onSave, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-4"
    >
      <label className="block text-sm">
        <span className="font-medium text-gray-700">Location name</span>
        <input
          value={form.name}
          onChange={set('name')}
          required
          placeholder="e.g. Murtala Muhammed Airport T2"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-gray-700">City</span>
        <input
          value={form.city}
          onChange={set('city')}
          required
          placeholder="e.g. Lagos"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-gray-700">Type</span>
        <select
          value={form.type}
          onChange={set('type')}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        >
          <option value="airport">Airport</option>
          <option value="city">City Center</option>
          <option value="hotel">Hotel</option>
          <option value="port">Port</option>
        </select>
      </label>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>Save location</Button>
      </div>
    </form>
  );
}

export default function AdminLocations() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => apiRequest('/admin/locations'),
  });

  const locations = data?.locations ?? [];

  const createMutation = useMutation({
    mutationFn: (body) => apiRequest('/admin/locations', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Location created');
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => apiRequest(`/admin/locations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Location updated');
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => apiRequest(`/admin/locations/${id}/toggle`, { method: 'PATCH' }),
    onSuccess: (data) => {
      toast.success(`Location ${data.location.is_active ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-500">Locations</h1>
          <p className="mt-1 text-sm text-gray-400">{locations.length} pickup / return locations</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add location
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Location', 'City', 'Type', 'Bookings', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              : locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-secondary-500" />
                        <span className="font-medium text-primary-500">{loc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{loc.city}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="capitalize">
                        {TYPE_LABELS[loc.type] || loc.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-500">{loc.booking_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        loc.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {loc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(loc)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-500"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(loc.id)}
                          className={`rounded p-1.5 transition-colors ${
                            loc.is_active
                              ? 'text-green-600 hover:bg-red-50 hover:text-error'
                              : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                          }`}
                          aria-label={loc.is_active ? 'Deactivate' : 'Activate'}
                          title={loc.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {loc.is_active
                            ? <ToggleRight className="h-5 w-5" />
                            : <ToggleLeft className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && locations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MapPin className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">No locations yet. Add your first pickup location.</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title="Add location">
          <LocationForm onSave={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title="Edit location">
          {editing && (
            <LocationForm
              initial={editing}
              onSave={(data) => updateMutation.mutate({ id: editing.id, ...data })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
