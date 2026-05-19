export function calculateClientPricing(dailyRate, days, extras = {}, rates = {}) {
  const subtotal = Number(dailyRate) * days;
  let extrasTotal = 0;

  if (extras.gps) extrasTotal += (rates.gpsPerDay || 5) * days;
  if (extras.child_seat) extrasTotal += (rates.childSeatPerDay || 7) * days;
  if (extras.additional_driver) extrasTotal += (rates.additionalDriverPerDay || 10) * days;
  if (extras.roadside_assistance) extrasTotal += (rates.roadsidePerDay || 5) * days;
  if (extras.prepaid_fuel) extrasTotal += rates.prepaidFuelFlat || 40;

  const tier = extras.insurance_tier || 'basic';
  if (tier === 'premium') extrasTotal += (rates.insurancePremiumPerDay || 15) * days;
  if (tier === 'elite') extrasTotal += (rates.insuranceElitePerDay || 30) * days;

  const subtotalWithExtras = subtotal + extrasTotal;
  const taxRate = rates.taxRatePercent || 18;
  const tax = subtotalWithExtras * (taxRate / 100);
  const total = subtotalWithExtras + tax;
  const depositPercent = rates.depositPercent || 20;

  return {
    days,
    subtotal,
    extras_total: extrasTotal,
    tax_amount: tax,
    total_price: total,
    deposit_amount: total * (depositPercent / 100),
  };
}
