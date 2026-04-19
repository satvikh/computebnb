export function calculateRuntimePricing(input: {
  runtimeSeconds: number;
  hourlyRateCents: number;
  budgetCents: number;
}) {
  const uncappedCost = Math.round((input.runtimeSeconds / 3600) * input.hourlyRateCents);
  const jobCostCents = Math.max(1, Math.min(input.budgetCents, uncappedCost || 1));
  return {
    jobCostCents,
    providerPayoutCents: jobCostCents,
    platformFeeCents: 0,
  };
}
