/**
 * Centralized GymPulse SaaS Pricing Matrix & Entitlement Config
 *
 * Model:
 *   BASE PLAN (Growth / Pro / Gym + Classes)
 *   + NUMBER OF LOCATIONS (1 for single gym, 2..10 for multi gym)
 *   + BILLING CYCLE (monthly / yearly)
 */

const BASE_PLANS = {
  GROWTH: 'Growth',
  PRO: 'Pro',
  GYM_CLASSES: 'Gym + Classes'
};

const SINGLE_GYM_PRICING = {
  [BASE_PLANS.GROWTH]: {
    monthly: 499,
    yearly: 4999
  },
  [BASE_PLANS.PRO]: {
    monthly: 999,
    yearly: 9999
  },
  [BASE_PLANS.GYM_CLASSES]: {
    monthly: 1499,
    yearly: 14999
  }
};

/**
 * Official Monthly Multi-Gym Pricing Matrix (Volume Discount)
 * N = 1..10 locations
 */
const MULTI_GYM_MONTHLY_PRICING = {
  [BASE_PLANS.GROWTH]: {
    1: 499,
    2: 899,
    3: 1199,
    4: 1399,
    5: 1599,
    6: 1799,
    7: 1949,
    8: 2099,
    9: 2249,
    10: 2399
  },
  [BASE_PLANS.PRO]: {
    1: 999,
    2: 1799,
    3: 2399,
    4: 2799,
    5: 3249,
    6: 3599,
    7: 3849,
    8: 4199,
    9: 4499,
    10: 4999
  },
  [BASE_PLANS.GYM_CLASSES]: {
    1: 1499,
    2: 2699,
    3: 3599,
    4: 4199,
    5: 4749,
    6: 5399,
    7: 5949,
    8: 6399,
    9: 6749,
    10: 7499
  }
};

const CANONICAL_PLANS = [BASE_PLANS.GROWTH, BASE_PLANS.PRO, BASE_PLANS.GYM_CLASSES];

/**
 * Resolves any plan name or legacy representation to canonical GymPulse plan:
 * Growth, Pro, or Gym + Classes.
 */
function resolveCanonicalPlan(inputPlan) {
  const s = String(inputPlan || '').trim().toLowerCase();
  if (s.includes('class') || s === 'enterprise') {
    return BASE_PLANS.GYM_CLASSES;
  }
  if (s.includes('pro')) {
    return BASE_PLANS.PRO;
  }
  return BASE_PLANS.GROWTH;
}

/**
 * Calculates official subscription price, per-location rates, and savings.
 */
function calculateSubscriptionPrice(basePlan = 'Growth', isMultiGym = false, locationCount = 1, billingCycle = 'monthly') {
  // Normalize plan to canonical
  const plan = resolveCanonicalPlan(basePlan);

  const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
  const locCount = Math.max(1, Math.min(10, parseInt(locationCount, 10) || 1));
  const multiGymActive = Boolean(isMultiGym && locCount > 1);

  if (!multiGymActive) {
    const monthlyPrice = SINGLE_GYM_PRICING[plan].monthly;
    const yearlyPrice = SINGLE_GYM_PRICING[plan].yearly;
    const price = cycle === 'yearly' ? yearlyPrice : monthlyPrice;
    const fullYearCost = monthlyPrice * 12;
    const savings = cycle === 'yearly' ? fullYearCost - yearlyPrice : 0;
    const annualSavings = fullYearCost - yearlyPrice;
    const monthlyPerLocation = monthlyPrice;
    const pricePerLocation = Math.round(price / 1);

    return {
      basePlan: plan,
      isMultiGym: false,
      locationCount: 1,
      billingCycle: cycle,
      monthlyPrice,
      yearlyPrice,
      price,
      savings,
      annualSavings,
      monthlyPerLocation,
      pricePerLocation
    };
  }

  // Multi-Gym: lookup official volume-discounted monthly price
  const monthlyPrice = MULTI_GYM_MONTHLY_PRICING[plan][locCount] || MULTI_GYM_MONTHLY_PRICING[plan][10];
  const yearlyPrice = monthlyPrice * 10;
  const fullYearCost = monthlyPrice * 12;
  const annualSavings = fullYearCost - yearlyPrice; // Exactly monthlyPrice * 2
  const savings = cycle === 'yearly' ? annualSavings : 0;
  const price = cycle === 'yearly' ? yearlyPrice : monthlyPrice;
  const monthlyPerLocation = Math.round(monthlyPrice / locCount);
  const pricePerLocation = Math.round(price / locCount);

  return {
    basePlan: plan,
    isMultiGym: true,
    locationCount: locCount,
    billingCycle: cycle,
    monthlyPrice,
    yearlyPrice,
    price,
    savings,
    annualSavings,
    monthlyPerLocation,
    pricePerLocation
  };
}

/**
 * Canonical MRR rates per subscriber gym:
 * Growth: ₹499 monthly, ₹4,999 / 12 yearly (₹416.58)
 * Pro: ₹999 monthly, ₹9,999 / 12 yearly (₹833.25)
 * Gym + Classes: ₹1,499 monthly, ₹14,999 / 12 yearly (₹1,249.92)
 */
const CANONICAL_MRR_RATES = {
  [BASE_PLANS.GROWTH]: {
    monthly: 499,
    yearly: Math.round((4999 / 12) * 100) / 100 // 416.58
  },
  [BASE_PLANS.PRO]: {
    monthly: 999,
    yearly: Math.round((9999 / 12) * 100) / 100 // 833.25
  },
  [BASE_PLANS.GYM_CLASSES]: {
    monthly: 1499,
    yearly: Math.round((14999 / 12) * 100) / 100 // 1249.92
  }
};

/**
 * Calculates MRR for an individual gym.
 * Returns 0 if gym is not active, or in trial/suspended/expired status.
 * Base-plan pricing and physical location count remain separate; physical location does not inflate MRR.
 */
function calculateGymMRR(gym) {
  if (!gym) return 0;

  const status = String(gym.subscription_status || gym.subscriptionStatus || '').toUpperCase();
  const isActive = gym.is_active !== undefined ? Boolean(gym.is_active) : (gym.isActive !== undefined ? Boolean(gym.isActive) : true);

  if (status !== 'ACTIVE' || !isActive) {
    return 0;
  }

  const canonicalPlan = resolveCanonicalPlan(gym.subscription_plan || gym.subscriptionPlan || gym.plan);
  const cycle = String(gym.billing_cycle || gym.billingCycle || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';

  const planRates = CANONICAL_MRR_RATES[canonicalPlan] || CANONICAL_MRR_RATES[BASE_PLANS.GROWTH];
  return planRates[cycle];
}

/**
 * Calculates portfolio-wide MRR, ARR, and exact reconciled breakdowns by plan and by cycle.
 * Guarantees:
 *   sum(byPlan[].mrrContribution) === totalMRR
 *   sum(byCycle[].mrrContribution) === totalMRR
 *   totalARR === Math.round(totalMRR * 12 * 100) / 100
 */
function calculatePortfolioMetrics(activeGyms = []) {
  let totalMRR = 0;

  const planMap = {
    [BASE_PLANS.GROWTH]: { subscribers: 0, mrrContribution: 0 },
    [BASE_PLANS.PRO]: { subscribers: 0, mrrContribution: 0 },
    [BASE_PLANS.GYM_CLASSES]: { subscribers: 0, mrrContribution: 0 }
  };

  const cycleMap = {
    monthly: { subscribers: 0, mrrContribution: 0 },
    yearly: { subscribers: 0, mrrContribution: 0 }
  };

  for (const gym of activeGyms) {
    const canonicalPlan = resolveCanonicalPlan(gym.subscription_plan || gym.subscriptionPlan || gym.plan);
    const cycle = String(gym.billing_cycle || gym.billingCycle || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
    const gymMrr = calculateGymMRR({ ...gym, subscription_status: 'ACTIVE', is_active: true });

    totalMRR += gymMrr;
    planMap[canonicalPlan].subscribers += 1;
    planMap[canonicalPlan].mrrContribution += gymMrr;

    cycleMap[cycle].subscribers += 1;
    cycleMap[cycle].mrrContribution += gymMrr;
  }

  totalMRR = Math.round(totalMRR * 100) / 100;
  const totalARR = Math.round(totalMRR * 12 * 100) / 100;

  const byPlan = CANONICAL_PLANS.map((plan) => {
    const data = planMap[plan];
    const mrrContribution = Math.round(data.mrrContribution * 100) / 100;
    const percentage = totalMRR > 0 ? Math.round((mrrContribution / totalMRR) * 1000) / 10 : 0;
    return {
      plan,
      subscribers: data.subscribers,
      count: data.subscribers,
      mrrContribution,
      total: mrrContribution,
      percentage
    };
  });

  const byCycle = ['monthly', 'yearly'].map((cycle) => {
    const data = cycleMap[cycle];
    const mrrContribution = Math.round(data.mrrContribution * 100) / 100;
    const percentage = totalMRR > 0 ? Math.round((mrrContribution / totalMRR) * 1000) / 10 : 0;
    return {
      cycle,
      subscribers: data.subscribers,
      count: data.subscribers,
      mrrContribution,
      total: mrrContribution,
      percentage
    };
  });

  return {
    mrr: totalMRR,
    arr: totalARR,
    byPlan,
    byCycle
  };
}

module.exports = {
  BASE_PLANS,
  CANONICAL_PLANS,
  CANONICAL_MRR_RATES,
  SINGLE_GYM_PRICING,
  MULTI_GYM_MONTHLY_PRICING,
  calculateSubscriptionPrice,
  calculateGymMRR,
  calculatePortfolioMetrics,
  resolveCanonicalPlan
};
