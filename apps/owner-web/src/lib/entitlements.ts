export interface EntitlementFlags {
  plan: string;
  status: string;
  isTrial: boolean;
  isExpired: boolean;
  isMultiGym: boolean;
  maxLocations: number;
  billingCycle: string;
  hasGrowth: boolean;
  hasPro: boolean;
  hasClass: boolean;
  hasMultiGym: boolean;
}

export function getEntitlements(summaryData: any): EntitlementFlags {
  const status = String(summaryData?.subscriptionStatus || "ACTIVE");
  const rawPlan = String(summaryData?.subscriptionPlan || "Growth");
  const isTrialActive = Boolean(summaryData?.isTrialActive);
  const isTrialExpired = Boolean(summaryData?.isTrialExpired);
  const isSubExpired = status === "EXPIRED";
  const isExpired = isTrialExpired || isSubExpired;

  // Multi-Gym status is derived from isMultiGym flag, or backwards-compatible rawPlan check
  const isMultiGym = Boolean(summaryData?.isMultiGym || rawPlan.toLowerCase().includes("multi"));
  const maxLocations = Number(summaryData?.maxLocations || (isMultiGym ? 5 : 1));
  const billingCycle = String(summaryData?.billingCycle || "monthly");

  const planLower = rawPlan.toLowerCase();
  // CRITICAL: Features depend strictly on the Base Plan!
  // Multi-Gym does NOT unlock Pro or Class features if base plan is Growth.
  const isClass = planLower.includes("class");
  const isPro = planLower.includes("pro") || isClass;

  return {
    plan: rawPlan,
    status,
    isTrial: isTrialActive,
    isExpired,
    isMultiGym,
    maxLocations,
    billingCycle,
    hasGrowth: !isExpired,
    hasPro: !isExpired && !isTrialActive && isPro,
    hasClass: !isExpired && !isTrialActive && isClass,
    hasMultiGym: !isExpired && !isTrialActive && isMultiGym,
  };
}
