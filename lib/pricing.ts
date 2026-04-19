const PROVIDER_PAYOUT_RATE = parseFloat(process.env.GPUBNB_PROVIDER_PAYOUT_RATE ?? "0.8");

/**
 * Calculate runtime-priced cost with a budget cap, then split it 80/20.
 */
export function calculateRuntimePricing(input: {
  runtimeSeconds: number;
  hourlyRateCents: number;
  budgetCents: number;
}) {
  const uncappedCost = Math.round((input.runtimeSeconds / 3600) * input.hourlyRateCents);
  const jobCostCents = Math.max(1, Math.min(input.budgetCents, uncappedCost || 1));
  const providerPayoutCents = Math.round(jobCostCents * PROVIDER_PAYOUT_RATE);
  const platformFeeCents = jobCostCents - providerPayoutCents;
  return { jobCostCents, providerPayoutCents, platformFeeCents };
}
