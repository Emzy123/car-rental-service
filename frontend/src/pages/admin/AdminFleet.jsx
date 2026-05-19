import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client.js';
import { formatMoney } from '../../lib/currency.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Dialog, DialogContent } from '../../components/ui/Dialog.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

const STATUS_VARIANT = {
  available: 'success',
  rented: 'default',
  maintenance: 'warning',
  retired: 'error',
};

const EMPTY_FORM = {
  make: '', model: '', year: '', license_plate: '', fuel_type: 'petrol',
  transmission: 'automatic', daily_rate: '', category: 'economy',
  seats: '', luggage_capacity: '', features: '', photo_urls: '', status: 'available',
};

function VehicleForm({ initial, onSave, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      year: Number(form.year),
      daily_rate: Number(form.daily_rate),
      seats: Number(form.seats) || undefined,
      luggage_capacity: Number(form.luggage_capacity) || undefined,
      features: form.features ? form.features.split(',').map((s) => s.trim()).filter(Boolean) : [],
      photo_urls: form.photo_urls ? form.photo_urls.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    onSave(payload);
  }

  const field = (label, key, type = 'text', opts = {}) => (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        {...opts}
      />
    </label>
  );

  const select = (label, key, options) => (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <select
        value={form[key]}
        onChange={set(key)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      {field('Make', 'make', 'text', { required: true })}
      {field('Model', 'model', 'text', { required: true })}
      {field('Year', 'year', 'number', { required: true, min: 1990, max: 2030 })}
      {field('License plate', 'license_plate', 'text', { required: true })}
      {field('Daily rate (₦)', 'daily_rate', 'number', { required: true, min: 0 })}
      {field('Seats', 'seats', 'number', { min: 1 })}
      {field('Luggage capacity', 'luggage_capacity', 'number', { min: 0 })}
      {select('Category', 'category', [
        ['economy','Economy'],['luxury','Luxury'],['suv','SUV'],['sports','Sports'],['electric','Electric'],['van','Van'],
      ])}
      {select('Fuel type', 'fuel_type', [
        ['petrol','Petrol'],['diesel','Diesel'],['hybrid','Hybrid'],['electric','Electric'],
      ])}
      {select('Transmission', 'transmission', [
        ['automatic','Automatic'],['manual','Manual'],
      ])}
      {select('Status', 'status', [
        ['available','Available'],['maintenance','Maintenance'],['retired','Retired'],
      ])}
      <label className="block text-sm sm:col-span-2">
        <span className="font-medium text-gray-700">Features (comma-separated)</span>
        <input
          type="text"
          value={form.features}
          onChange={set('features')}
          placeholder="GPS, Bluetooth, Backup Camera"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="font-medium text-gray-700">Photo URLs (comma-separated)</span>
        <input
          type="text"
          value={form.photo_urls}
          onChange={set('photo_urls')}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary-500 focus:outline-none"
        />
      </label>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" loading={loading}>Save vehicle</Button>
      </div>
    </form>
  );
}

export default function AdminFleet() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fleet', page, search],
    queryFn: () => {
      const p = new URLSearchParams({ page, limit: 10 });
      if (search) p.set('search', search);
      return apiRequest(`/admin/vehicles?${p}`);
    },
  });

  const vehicles = data?.vehicles ?? [];
  const totalPages = data?.pages ?? 1;

  const createMutation = useMutation({
    mutationFn: (body) => apiRequest('/admin/vehicles', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Vehicle created');
      queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => apiRequest(`/admin/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Vehicle updated');
      queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/admin/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Vehicle deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  function openEdit(v) {
    setEditing({
      ...v,
      features: Array.isArray(v.features) ? v.features.join(', ') : '',
      photo_urls: Array.isArray(v.photo_urls) ? v.photo_urls.join(', ') : '',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-500">Fleet management</h1>
          <p className="mt-1 text-sm text-gray-400">{data?.total ?? '—'} vehicles total</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add vehicle
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search make, model…"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-secondary-500 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Vehicle', 'Category', 'Fuel / Trans.', 'Daily rate', 'Status', ''].map((h) => (
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
              : vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary-500">{v.make} {v.model}</p>
                      <p className="text-xs text-gray-400">{v.year} · {v.license_plate}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{v.category}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{v.fuel_type} / {v.transmission}</td>
                    <td className="px-4 py-3 font-medium text-primary-500">{formatMoney(v.daily_rate, 'NGN')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[v.status] || 'default'} className="capitalize">
                        {v.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-500"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(v)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-error"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Create modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent size="lg" title="Add vehicle">
          <VehicleForm onSave={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent size="lg" title="Edit vehicle">
          {editing && (
            <VehicleForm
              initial={editing}
              onSave={(data) => updateMutation.mutate({ id: editing.id, ...data })}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent title="Delete vehicle">
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.make} {deleteTarget?.model}</strong>? This cannot be undone.
          </p>
          <div className="mt-5 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
