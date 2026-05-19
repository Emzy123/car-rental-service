import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const VehicleListingPage = lazy(() => import('./pages/VehicleListingPage.jsx'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const SupportPage = lazy(() => import('./pages/SupportPage.jsx'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout headerVariant="transparent" />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="/vehicles" element={<VehicleListingPage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['client']} />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/dashboard/*" element={<ClientDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
