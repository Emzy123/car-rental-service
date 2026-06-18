export function defaultDates() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function rentalDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const startStr = typeof startDate === 'string' ? startDate.split('T')[0] : new Date(startDate).toISOString().split('T')[0];
  const endStr = typeof endDate === 'string' ? endDate.split('T')[0] : new Date(endDate).toISOString().split('T')[0];
  
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

export function formatDate(d) {
  if (!d) return '';
  const dateStr = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
  const dateObj = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) {
    const fallback = new Date(d);
    if (Number.isNaN(fallback.getTime())) return 'Invalid Date';
    return fallback.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
