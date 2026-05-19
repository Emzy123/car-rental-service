import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ClientLayout from '../components/ClientLayout.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

const BrowseVehicles = lazy(() => import('./client/BrowseVehicles.jsx'));
const VehicleDetailPage = lazy(() => import('./client/VehicleDetailPage.jsx'));
const BookingConfirmPage = lazy(() => import('./client/BookingConfirmPage.jsx'));
const PaymentPage = lazy(() => import('./client/PaymentPage.jsx'));
const PaymentCallbackPage = lazy(() => import('./client/PaymentCallbackPage.jsx'));
const BookingConfirmedPage = lazy(() => import('./client/BookingConfirmedPage.jsx'));
const MyBookingsPage = lazy(() => import('./client/MyBookingsPage.jsx'));
const SavedVehiclesPage = lazy(() => import('./client/SavedVehiclesPage.jsx'));
const ProfilePage = lazy(() => import('./client/ProfilePage.jsx'));

export default function ClientDashboard() {
  return (
    <ClientLayout>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
        <Routes>
          <Route index element={<Navigate to="bookings" replace />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="bookings/confirm" element={<BookingConfirmPage />} />
          <Route path="bookings/:id/pay" element={<PaymentPage />} />
          <Route path="bookings/:id/payment-callback" element={<PaymentCallbackPage />} />
          <Route path="bookings/:id/confirmed" element={<BookingConfirmedPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="saved" element={<SavedVehiclesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
    </ClientLayout>
  );
}
