export type BasePlanId = "growth" | "pro" | "gym_classes";

export interface PlanFeature {
  name: string;
  includedInGrowth: boolean;
  includedInPro: boolean;
  includedInClasses: boolean;
  category: "Core" | "Pro" | "Classes";
}

export const PLAN_FEATURES: PlanFeature[] = [
  // Core / Growth Features
  { name: "Gym Dashboard & Real-Time KPIs", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },
  { name: "Member Directory & Profiles", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },
  { name: "Membership Plans & Validity Control", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },
  { name: "Manual & Digital QR Attendance", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },
  { name: "Payments & Outstanding Dues Ledger", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },
  { name: "Owner Mobile App Access", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },
  { name: "Member Mobile App & QR Pass", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },
  { name: "Basic Revenue & Attendance Reports", includedInGrowth: true, includedInPro: true, includedInClasses: true, category: "Core" },

  // Pro Features
  { name: "Advanced Reports & CSV Exports", includedInGrowth: false, includedInPro: true, includedInClasses: true, category: "Pro" },
  { name: "Business Analytics & Growth Trends", includedInGrowth: false, includedInPro: true, includedInClasses: true, category: "Pro" },
  { name: "Staff Management & Role Access Control", includedInGrowth: false, includedInPro: true, includedInClasses: true, category: "Pro" },
  { name: "WhatsApp Automation (Reminders & Passes)", includedInGrowth: false, includedInPro: true, includedInClasses: true, category: "Pro" },

  // Gym + Classes Features
  { name: "Group Classes & Multi-Trainer Schedules", includedInGrowth: false, includedInPro: false, includedInClasses: true, category: "Classes" },
  { name: "Class Plans, Passes & Session Quotas", includedInGrowth: false, includedInPro: false, includedInClasses: true, category: "Classes" },
  { name: "Daily Session Capacity & Seat Reservations", includedInGrowth: false, includedInPro: false, includedInClasses: true, category: "Classes" },
  { name: "Class Attendance Check-ins", includedInGrowth: false, includedInPro: false, includedInClasses: true, category: "Classes" },
  { name: "Fitness Classes Revenue Breakdown", includedInGrowth: false, includedInPro: false, includedInClasses: true, category: "Classes" },
  { name: "Member Mobile App Class Booking Access", includedInGrowth: false, includedInPro: false, includedInClasses: true, category: "Classes" }
];

export interface BasePlanDefinition {
  id: BasePlanId;
  name: "Growth" | "Pro" | "Gym + Classes";
  tagline: string;
  badge: string | null;
  singleMonthlyPrice: number;
  singleYearlyPrice: number;
  highlight: boolean;
  bulletFeatures: string[];
}

export const BASE_PLANS_LIST: BasePlanDefinition[] = [
  {
    id: "growth",
    name: "Growth",
    tagline: "Essential gym operations for single and multi-branch fitness centers",
    badge: null,
    singleMonthlyPrice: 499,
    singleYearlyPrice: 4999,
    highlight: false,
    bulletFeatures: [
      "Member management & custom plans",
      "Manual & QR code attendance",
      "Payments, receipts & dues ledger",
      "Owner & Member mobile apps",
      "Basic summary reports",
      "Multi-gym location expansion available"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Staff permissions, WhatsApp automation & business analytics",
    badge: "Most Popular",
    singleMonthlyPrice: 999,
    singleYearlyPrice: 9999,
    highlight: true,
    bulletFeatures: [
      "Everything in Growth, PLUS:",
      "Staff management & role control",
      "WhatsApp automation & reminders",
      "Advanced business analytics & KPIs",
      "Detailed CSV & financial reports",
      "Multi-gym location expansion available"
    ]
  },
  {
    id: "gym_classes",
    name: "Gym + Classes",
    tagline: "Full gym management with group classes, trainers & session bookings",
    badge: "All-Inclusive",
    singleMonthlyPrice: 1499,
    singleYearlyPrice: 14999,
    highlight: false,
    bulletFeatures: [
      "Everything in Pro, PLUS:",
      "Group classes & trainer schedules",
      "Class booking & seat capacity control",
      "Class attendance & check-ins",
      "Fitness classes revenue breakdown",
      "Member mobile class reservations",
      "Multi-gym location expansion available"
    ]
  }
];

export const MULTI_GYM_MONTHLY_PRICING: Record<"Growth" | "Pro" | "Gym + Classes", Record<number, number>> = {
  Growth: {
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
  Pro: {
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
  "Gym + Classes": {
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

export interface PriceCalculationResult {
  basePlan: "Growth" | "Pro" | "Gym + Classes";
  isMultiGym: boolean;
  locationCount: number;
  billingCycle: "monthly" | "yearly";
  monthlyPrice: number;
  yearlyPrice: number;
  price: number;
  savings: number;
  annualSavings: number;
  monthlyPerLocation: number;
  pricePerLocation: number;
  periodLabel: string;
}

/**
 * Calculates official SaaS pricing:
 *
 * Single Gym:
 *   Growth: ₹499/mo | ₹4,999/yr (Save ₹989)
 *   Pro: ₹999/mo | ₹9,999/yr (Save ₹1,989)
 *   Gym + Classes: ₹1,499/mo | ₹14,999/yr (Save ₹2,989)
 *
 * Multi-Gym (Volume Discount Matrix N = 2..10):
 *   More locations = lower price per gym
 *   Yearly Price = Monthly Price * 10 (Save 2 months compared to paying 12 months)
 *   Annual Savings = Monthly Price * 2
 */
export function calculateSubscriptionPrice(
  basePlan: "Growth" | "Pro" | "Gym + Classes",
  isMultiGym: boolean,
  locationCount: number,
  billingCycle: "monthly" | "yearly"
): PriceCalculationResult {
  const locCount = Math.max(1, Math.min(10, locationCount || 1));
  const isMulti = Boolean(isMultiGym && locCount > 1);

  if (!isMulti) {
    const single = BASE_PLANS_LIST.find((p) => p.name === basePlan) || BASE_PLANS_LIST[0];
    const monthlyPrice = single.singleMonthlyPrice;
    const yearlyPrice = single.singleYearlyPrice;
    const price = billingCycle === "yearly" ? yearlyPrice : monthlyPrice;
    const fullYear = monthlyPrice * 12;
    const annualSavings = fullYear - yearlyPrice;
    const savings = billingCycle === "yearly" ? annualSavings : 0;
    const monthlyPerLocation = monthlyPrice;
    const pricePerLocation = Math.round(price / 1);

    return {
      basePlan,
      isMultiGym: false,
      locationCount: 1,
      billingCycle,
      monthlyPrice,
      yearlyPrice,
      price,
      savings,
      annualSavings,
      monthlyPerLocation,
      pricePerLocation,
      periodLabel: billingCycle === "yearly" ? "/year" : "/month"
    };
  }

  // Multi-Gym volume discount matrix
  const monthlyPrice = MULTI_GYM_MONTHLY_PRICING[basePlan][locCount] || MULTI_GYM_MONTHLY_PRICING[basePlan][10];
  const yearlyPrice = monthlyPrice * 10;
  const fullYear = monthlyPrice * 12;
  const annualSavings = fullYear - yearlyPrice; // Exactly monthlyPrice * 2
  const savings = billingCycle === "yearly" ? annualSavings : 0;
  const price = billingCycle === "yearly" ? yearlyPrice : monthlyPrice;
  const monthlyPerLocation = Math.round(monthlyPrice / locCount);
  const pricePerLocation = Math.round(price / locCount);

  return {
    basePlan,
    isMultiGym: true,
    locationCount: locCount,
    billingCycle,
    monthlyPrice,
    yearlyPrice,
    price,
    savings,
    annualSavings,
    monthlyPerLocation,
    pricePerLocation,
    periodLabel: billingCycle === "yearly" ? "/year" : "/month"
  };
}
