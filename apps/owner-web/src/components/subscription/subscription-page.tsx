"use client";

import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  LogOut,
  Smartphone,
  Sparkles,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { AUTH_TOKEN_KEY } from "@/src/lib/api-client";
import { AUTH_ROLE_KEY, canAccessDashboard, hasExpiredTrial, isDevelopmentMode } from "@/src/lib/subscription-state";
import { getDashboardSummary } from "@/src/services/dashboard.service";
import { updateGymSubscription } from "@/src/services/gym-locations.service";
import {
  BASE_PLANS_LIST,
  PLAN_FEATURES,
  calculateSubscriptionPrice,
  type BasePlanDefinition
} from "@/src/lib/pricing-config";

const subscribe = () => () => undefined;
const serverSnapshot = () => false;

const faqs = [
  [
    "How does the Multi-Gym model work?",
    "Multi-Gym is an add-on scale factor applied to your chosen base plan (Growth, Pro, or Gym + Classes). You choose your base feature tier and how many physical locations you operate (2 to 10). Features remain strictly governed by the base plan."
  ],
  [
    "If I choose Growth Multi-Gym, do I get Advanced Analytics or Group Classes?",
    "No. Multi-Gym is not an all-inclusive bundle. Growth Multi-Gym gives you core Growth features across all your branch locations. If you need Advanced Analytics or WhatsApp Automation across your branches, choose Pro Multi-Gym. If you need Group Classes, choose Gym + Classes Multi-Gym."
  ],
  [
    "How does annual billing work?",
    "With annual billing, you pay for 10 months and receive 12 months of access — effectively giving you 2 full months completely free on any plan or location count."
  ],
  [
    "Are member records and staff isolated between branch locations?",
    "Yes. Every branch location operates with complete tenant isolation. Staff and receptionists can only access their assigned gym, while owners can seamlessly switch between all locations using the header Gym Switcher."
  ],
  [
    "Can I upgrade or change my location count later?",
    "Yes, you can upgrade your plan or add more branch locations at any time directly from this page."
  ]
];

function TrialExpiredModal({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/75 p-5 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl border border-slate-200">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 font-bold text-xl">
          ⌛
        </span>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">Your Free Trial Has Ended</h1>
        <p className="mt-3 text-xs leading-6 text-slate-600">
          Select a subscription plan below to reactivate your gym management portal.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Logout
          </button>
          <a
            href="#configurator"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            Select Plan Below
          </a>
        </div>
      </section>
    </div>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section className="mt-12 rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Frequently Asked Questions</p>
      <div className="mt-2 divide-y divide-slate-100">
        {faqs.map(([question, answer], index) => {
          const isOpen = openIndex === index;
          return (
            <div key={question} className="py-3">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 text-left text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors"
              >
                <span>{question}</span>
                <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2 text-xs leading-5 text-slate-600 font-medium"
                >
                  {answer}
                </motion.p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SubscriptionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useSyncExternalStore(subscribe, () => Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY)), serverSnapshot);
  const role = useSyncExternalStore(subscribe, () => window.localStorage.getItem(AUTH_ROLE_KEY), () => null);

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    enabled: isLoggedIn
  });

  const summaryData = summaryQuery.data as any;

  // Derive initial subscription state
  const currentPlanName = (summaryData?.subscriptionPlan as "Growth" | "Pro" | "Gym + Classes") || "Growth";
  const currentIsMulti = Boolean(summaryData?.isMultiGym);
  const currentLocCount = Number(summaryData?.maxLocations || 1);
  const currentCycle = (summaryData?.billingCycle as "monthly" | "yearly") || "monthly";

  // Configurator state
  const [selectedPlan, setSelectedPlan] = useState<"Growth" | "Pro" | "Gym + Classes">("Growth");
  const [isMultiGym, setIsMultiGym] = useState<boolean>(false);
  const [locationCount, setLocationCount] = useState<number>(2);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  // Sync state once summary data loads
  useEffect(() => {
    if (summaryData && !hasInitialized) {
      if (summaryData.subscriptionPlan) {
        const p = String(summaryData.subscriptionPlan);
        if (p.includes("Class")) setSelectedPlan("Gym + Classes");
        else if (p.includes("Pro")) setSelectedPlan("Pro");
        else setSelectedPlan("Growth");
      }
      if (summaryData.isMultiGym) {
        setIsMultiGym(true);
        setLocationCount(Math.max(2, summaryData.maxLocations || 2));
      }
      if (summaryData.billingCycle) {
        setBillingCycle(summaryData.billingCycle === "yearly" ? "yearly" : "monthly");
      }
      setHasInitialized(true);
    }
  }, [summaryData, hasInitialized]);

  const pricing = calculateSubscriptionPrice(selectedPlan, isMultiGym, isMultiGym ? locationCount : 1, billingCycle);

  const updateMutation = useMutation({
    mutationFn: updateGymSubscription,
    onSuccess: (data) => {
      toast.success(data.message || "Subscription updated successfully!");
      queryClient.invalidateQueries();
      router.push("/dashboard");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || "Failed to update subscription";
      toast.error(msg);
    }
  });

  const handleActivatePlan = () => {
    updateMutation.mutate({
      plan: selectedPlan,
      isMultiGym,
      maxLocations: isMultiGym ? locationCount : 1,
      billingCycle
    });
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_ROLE_KEY);
    router.replace("/login");
  };

  if (!isLoggedIn) return <div className="min-h-screen bg-[#F8FAFC]" />;

  const isCurrentPlan =
    summaryData?.subscriptionStatus === "ACTIVE" &&
    !summaryData?.isTrialActive &&
    summaryData?.subscriptionPlan === selectedPlan &&
    Boolean(summaryData?.isMultiGym) === isMultiGym &&
    (!isMultiGym || Number(summaryData?.maxLocations) === locationCount) &&
    summaryData?.billingCycle === billingCycle;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-[#0F172A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Bar */}
        <header className="flex items-center justify-between py-2 border-b border-slate-200/80 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[#0F172A] text-[10px] font-black text-white shadow-sm">GP</span>
            <span className="text-base font-black tracking-tight text-slate-900">GymPulse</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="size-3.5" /> Logout
            </button>
          </div>
        </header>

        {/* Hero Banner */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="relative mx-auto max-w-3xl py-8 text-center sm:py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-[10px] font-black tracking-wider uppercase text-blue-700 shadow-xs">
            <Sparkles className="size-3 text-blue-600" /> Transparent Subscription System
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Customizable Gym SaaS Pricing
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 max-w-xl mx-auto font-medium">
            Choose your base feature tier, scale across single or multiple gym locations, and select your billing cycle with instant 2-month annual savings.
          </p>
        </motion.section>

        {/* INTERACTIVE CONFIGURATOR */}
        <section id="configurator" className="space-y-6">
          {/* STEP 1: SELECT BASE PLAN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
              <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-white text-xs font-black">1</span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Select Base Plan</h2>
                <p className="text-[11px] text-slate-500 font-medium">Features are determined strictly by your selected base plan</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {BASE_PLANS_LIST.map((plan) => {
                const isSelected = selectedPlan === plan.name;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.name)}
                    className={`relative flex flex-col rounded-2xl p-5 text-left transition-all border-2 ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    {plan.badge && (
                      <span
                        className={`absolute right-4 top-3 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isSelected ? "bg-blue-400 text-slate-950" : "bg-slate-900 text-white"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <div className={`size-3 rounded-full border-2 ${isSelected ? "border-blue-400 bg-blue-400" : "border-slate-400"}`} />
                      <h3 className="text-base font-black tracking-tight">{plan.name}</h3>
                    </div>

                    <p className={`mt-1.5 text-xs font-medium min-h-8 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {plan.tagline}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-black">₹{plan.singleMonthlyPrice.toLocaleString("en-IN")}</span>
                      <span className={`text-[11px] ${isSelected ? "text-slate-400" : "text-slate-500"}`}>/month (single gym)</span>
                    </div>

                    <div className={`mt-4 border-t pt-3 space-y-1.5 text-[11px] ${isSelected ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-600"}`}>
                      {plan.bulletFeatures.map((f) => (
                        <div key={f} className="flex items-start gap-1.5">
                          <Check className={`size-3.5 shrink-0 mt-0.5 ${isSelected ? "text-blue-400" : "text-emerald-600"}`} />
                          <span className="font-medium">{f}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2 & 3: SCALE (SINGLE VS MULTI-GYM & LOCATION COUNT) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
              <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-white text-xs font-black">2</span>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Select Scale & Number of Gyms</h2>
                <p className="text-[11px] text-slate-500 font-medium">Single branch or multi-location fitness network</p>
              </div>
            </div>

            {/* Single vs Multi Toggle */}
            <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
              <button
                type="button"
                onClick={() => setIsMultiGym(false)}
                className={`flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-all ${
                  !isMultiGym
                    ? "border-slate-900 bg-slate-50 text-slate-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className={`grid size-10 place-items-center rounded-xl ${!isMultiGym ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Building2 className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-tight text-slate-900">Single Gym Location</div>
                  <div className="text-[11px] text-slate-500 font-medium">Standard single branch setup (1 Gym)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsMultiGym(true)}
                className={`flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-all ${
                  isMultiGym
                    ? "border-blue-600 bg-blue-50/50 text-slate-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className={`grid size-10 place-items-center rounded-xl ${isMultiGym ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Layers className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-tight text-slate-900">Multi-Gym Network</div>
                  <div className="text-[11px] text-slate-500 font-medium">Manage 2 to 10 gym branches</div>
                </div>
              </button>
            </div>

            {/* Multi-Gym Location Count Selector */}
            {isMultiGym && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 border-t border-slate-100 pt-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                      Volume Discount
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      More locations = lower price per gym
                    </span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-black text-blue-800 self-start sm:self-auto">
                    {locationCount} Locations Selected
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-9">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isNumSelected = locationCount === num;
                    const preview = calculateSubscriptionPrice(selectedPlan, true, num, "monthly");
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLocationCount(num)}
                        className={`flex flex-col items-center justify-center rounded-xl py-2.5 px-2 border-2 transition-all ${
                          isNumSelected
                            ? "border-blue-600 bg-blue-600 text-white shadow-sm font-black"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm font-black">{num}</span>
                        <span className="text-[9px] uppercase tracking-wider">Gyms</span>
                        <span className={`text-[10px] mt-1 font-black ${isNumSelected ? "text-white" : "text-slate-900"}`}>
                          ₹{preview.monthlyPrice.toLocaleString("en-IN")}
                        </span>
                        <span className={`text-[9px] font-medium ${isNumSelected ? "text-blue-100" : "text-slate-500"}`}>
                          ₹{preview.monthlyPerLocation}/gym
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-[11px] text-slate-500 font-medium">
                  {selectedPlan} Multi-Gym: ₹
                  {pricing.monthlyPrice.toLocaleString("en-IN")}{" "}
                  / month for {locationCount} locations (₹
                  {pricing.monthlyPerLocation.toLocaleString("en-IN")}{" "}
                  / gym / month) · Yearly: ₹{pricing.yearlyPrice.toLocaleString("en-IN")} / year (Save ₹{pricing.annualSavings.toLocaleString("en-IN")})
                </p>
              </motion.div>
            )}
          </div>

          {/* STEP 4: BILLING CYCLE & DYNAMIC PRICE BREAKDOWN */}
          <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 text-white p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Step 3 of 3</span>
                <h3 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white">
                  {selectedPlan} Plan {isMultiGym ? `· Multi-Gym (${locationCount} Locations)` : "· Single Gym"}
                </h3>
                <p className="mt-1 text-xs text-slate-300 font-medium">
                  {isMultiGym
                    ? `Unified owner management across ${locationCount} locations with strict ${selectedPlan} feature set.`
                    : `Core ${selectedPlan} feature set for your gym.`}
                </p>

                {/* Billing Cycle Switch */}
                <div className="mt-5 inline-flex items-center rounded-xl bg-slate-800 p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      billingCycle === "monthly" ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                      billingCycle === "yearly" ? "bg-blue-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <span>Yearly Billing</span>
                    <span className="rounded-full bg-blue-300/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-blue-200">
                      Save 2 Months
                    </span>
                  </button>
                </div>

                {/* Multi-Gym Volume & Rate Breakdown Box */}
                {isMultiGym && (
                  <div className="mt-5 max-w-md rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Base Plan:</span>
                      <span className="font-bold text-white">{selectedPlan}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Locations:</span>
                      <span className="font-bold text-white">{locationCount} Locations</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Monthly Total:</span>
                      <span className="font-black text-white">₹{pricing.monthlyPrice.toLocaleString("en-IN")}/month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Price / Location:</span>
                      <span className="font-black text-blue-400">₹{pricing.monthlyPerLocation.toLocaleString("en-IN")} / gym / month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Yearly Total:</span>
                      <span className="font-black text-white">₹{pricing.yearlyPrice.toLocaleString("en-IN")}/year</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/80 text-emerald-400">
                      <span className="font-bold">Annual Savings:</span>
                      <span className="font-black">Save ₹{pricing.annualSavings.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Action Section */}
              <div className="flex flex-col items-start lg:items-end border-t border-slate-800 pt-5 lg:border-t-0 lg:pt-0 shrink-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    ₹{pricing.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-medium text-slate-400">{pricing.periodLabel}</span>
                </div>

                <div className="mt-1 text-xs text-slate-300 font-semibold">
                  {isMultiGym ? `₹${pricing.monthlyPerLocation.toLocaleString("en-IN")} / gym / month` : "Full platform access"}
                </div>

                {billingCycle === "yearly" && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-black text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="size-3.5" />
                    Save ₹{pricing.annualSavings.toLocaleString("en-IN")} per year (2 months free)
                  </div>
                )}

                <button
                  type="button"
                  disabled={updateMutation.isPending || isCurrentPlan}
                  onClick={handleActivatePlan}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-xs font-black shadow-lg transition-all ${
                    isCurrentPlan
                      ? "bg-slate-800 text-slate-400 cursor-default border border-slate-700"
                      : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20 active:scale-95"
                  }`}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check className="size-4 text-emerald-400" /> Current Active Plan
                    </>
                  ) : updateMutation.isPending ? (
                    "Updating Subscription..."
                  ) : (
                    <>
                      Activate {selectedPlan} {isMultiGym ? `(${locationCount} Gyms)` : ""}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE COMPARISON MATRIX */}
        <section className="mt-12 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-black tracking-tight text-slate-900">Official Feature Comparison Matrix</h2>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Features are governed strictly by the base plan tier. Multi-Gym allows scaling the plan across 2 to 10 physical locations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-slate-700">
                  <th className="py-3 px-4 font-black">Feature / Capability</th>
                  <th className="py-3 px-4 font-black text-center w-32">Growth (₹499)</th>
                  <th className="py-3 px-4 font-black text-center w-32">Pro (₹999)</th>
                  <th className="py-3 px-4 font-black text-center w-40">Gym + Classes (₹1,499)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {PLAN_FEATURES.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {row.name}
                      <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">[{row.category}]</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.includedInGrowth ? (
                        <Check className="mx-auto size-4 text-emerald-600" strokeWidth={2.5} />
                      ) : (
                        <X className="mx-auto size-4 text-slate-300" strokeWidth={2} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.includedInPro ? (
                        <Check className="mx-auto size-4 text-emerald-600" strokeWidth={2.5} />
                      ) : (
                        <X className="mx-auto size-4 text-slate-300" strokeWidth={2} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center bg-indigo-50/20">
                      {row.includedInClasses ? (
                        <Check className="mx-auto size-4 text-indigo-600" strokeWidth={2.5} />
                      ) : (
                        <X className="mx-auto size-4 text-slate-300" strokeWidth={2} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Accepted Payment Methods</p>
            <p className="mt-0.5 text-xs text-slate-600 font-medium">Instant activation via UPI, Debit/Credit Cards & Net Banking.</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Razorpay", icon: CreditCard },
              { label: "UPI", icon: Smartphone },
              { label: "Cards", icon: CreditCard },
              { label: "Net Banking", icon: Landmark }
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="grid min-w-16 place-items-center rounded-xl bg-slate-50 px-2 py-2 text-slate-600">
                <Icon className="size-3.5" />
                <span className="mt-1 text-[10px] font-bold">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <FaqAccordion />

        <footer className="py-6 text-center text-[11px] text-slate-400 font-medium">
          GymPulse SaaS Platform © 2026 · Made in India 🇮🇳 · Production Entitlement Architecture
        </footer>
      </div>

      {hasExpiredTrial && <TrialExpiredModal onLogout={logout} />}
    </main>
  );
}
