import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Phone, CreditCard, MapPin, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../api/client.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    driver_license_number: user?.driver_license_number || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth?.slice(0, 10) || '',
  });

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  const profileMutation = useMutation({
    mutationFn: (data) =>
      apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Profile updated');
      if (typeof refreshUser === 'function') refreshUser();
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const pwMutation = useMutation({
    mutationFn: (data) =>
      apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Password changed');
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPwError('');
    },
    onError: (err) => toast.error(err.message),
  });

  function handleProfileSubmit(e) {
    e.preventDefault();
    profileMutation.mutate(form);
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwError('');
    if (passwords.newPass.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setPwError('Passwords do not match');
      return;
    }
    pwMutation.mutate({ password: passwords.newPass });
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-primary-500">My Profile</h1>
      <p className="mt-1 text-sm text-gray-500">Update your personal information and password.</p>

      {/* Personal info */}
      <form onSubmit={handleProfileSubmit} className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-primary-500">
          <User className="h-4 w-4" /> Personal information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            type="tel"
            icon={<Phone className="h-4 w-4" />}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Driver's license number"
            icon={<CreditCard className="h-4 w-4" />}
            value={form.driver_license_number}
            onChange={(e) => setForm({ ...form, driver_license_number: e.target.value })}
          />
          <Input
            label="Date of birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
          />
        </div>
        <Input
          label="Address"
          icon={<MapPin className="h-4 w-4" />}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={profileMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-primary-500">
          <Lock className="h-4 w-4" /> Change password
        </h2>
        <Input
          label="New password"
          type="password"
          value={passwords.newPass}
          onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={passwords.confirm}
          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          required
          error={pwError}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={pwMutation.isPending} variant="outline">
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}
