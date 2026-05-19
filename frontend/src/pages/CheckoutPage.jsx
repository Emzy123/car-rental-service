import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckoutStore } from '../stores/checkoutStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import { Header } from '../components/layout/Header.jsx';
import { Progress } from '../components/ui/Progress.jsx';
import { BookingSummaryCard } from '../components/checkout/BookingSummaryCard.jsx';
import { RentalDetailsStep } from '../components/checkout/RentalDetailsStep.jsx';
import { DriverDetailsStep } from '../components/checkout/DriverDetailsStep.jsx';
import { ExtrasStep } from '../components/checkout/ExtrasStep.jsx';
import { PaymentStep } from '../components/checkout/PaymentStep.jsx';
import { Button } from '../components/ui/Button.jsx';

const STEPS = ['Rental details', 'Driver', 'Extras', 'Payment'];
const LAST = STEPS.length - 1;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const checkout = useCheckoutStore();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const createBooking = useMutation({
    mutationFn: (body) => apiRequest('/bookings', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (data) => {
      navigate(`/dashboard/bookings/${data.booking_id}/pay`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!checkout.vehicleId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center">
        <p className="text-lg font-medium text-gray-600">No vehicle selected.</p>
        <Button className="mt-4" onClick={() => navigate('/vehicles')}>Browse vehicles</Button>
      </div>
    );
  }

  function handleNext() {
    if (step === LAST) {
      createBooking.mutate({
        vehicle_id: checkout.vehicleId,
        start_date: checkout.startDate,
        end_date: checkout.endDate,
        pickup_location_id: checkout.pickupLocationId,
        return_location_id: checkout.returnLocationId,
        pickup_time: checkout.pickupTime,
        return_time: checkout.returnTime,
        special_requests: checkout.specialRequests,
        flight_number: checkout.flightNumber,
        extras: checkout.extras,
        driver_details: checkout.driverDetails,
      });
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Progress steps={STEPS} currentStep={step} />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && <RentalDetailsStep />}
                {step === 1 && <DriverDetailsStep user={user} />}
                {step === 2 && <ExtrasStep />}
                {step === 3 && <PaymentStep />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
              <Button loading={createBooking.isPending} onClick={handleNext}>
                {step === LAST ? 'Create booking & pay' : 'Continue'}
              </Button>
            </div>
          </div>

          <div>
            <BookingSummaryCard />
          </div>
        </div>
      </div>
    </div>
  );
}
