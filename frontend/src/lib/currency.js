const SYMBOLS = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };

export function formatMoney(amount, currencyCode = 'NGN') {
  const symbol = SYMBOLS[currencyCode] || currencyCode + ' ';
  const n = Number(amount);
  if (Number.isNaN(n)) return `${symbol}0.00`;
  return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
