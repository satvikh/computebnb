export const DEFAULT_MACHINE_HOURLY_RATE_CENTS = 420;

export function formatUsdFromCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
