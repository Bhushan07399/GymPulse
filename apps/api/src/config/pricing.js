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

/**
 * Calculates official subscription price, per-location rates, and savings.
 */
function calculateSubscriptionPrice(basePlan = 'Growth', isMultiGym = false, locationCount = 1, billingCycle = 'monthly') {
  // Normalize plan
  let plan = BASE_PLANS.GROWTH;
  const lower = String(basePlan).toLowerCase();
  if (lower.includes('class')) {
    plan = BASE_PLANS.GYM_CLASSES;
  } else if (lower.includes('pro')) {
    plan = BASE_PLANS.PRO;
  }

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

module.exports = {
  BASE_PLANS,
  SINGLE_GYM_PRICING,
  MULTI_GYM_MONTHLY_PRICING,
  calculateSubscriptionPrice
};
