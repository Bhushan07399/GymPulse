"use client";

import { motion } from "framer-motion";
import { Check, ChevronDown, CreditCard, Landmark, LogOut, Smartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import toast from "react-hot-toast";

import { AUTH_TOKEN_KEY } from "@/src/lib/api-client";
import { AUTH_ROLE_KEY, canAccessDashboard, foundingMemberOffer, hasExpiredTrial, isDevelopmentMode } from "@/src/lib/subscription-state";

const subscribe = () => () => undefined;
const serverSnapshot = () => false;
const plans = [
  {
    id: "growth",
    name: "Growth",
    tagline: "Essential gym management for growing fitness centers",
    monthlyPrice: 499,
    yearlyPrice: 4999,
    yearlySavings: "Save ₹989 (2 Months Free)",
    badge: null,
    highlight: false,
    features: [
      "Gym Dashboard",
      "Member Management",
      "Membership Plans",
      "Manual Attendance",
      "QR Attendance",
      "Payments & Dues",
      "Basic Reports",
      "Owner Mobile App",
      "Member Mobile App"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Advanced automation, staff control & business analytics",
    monthlyPrice: 999,
    yearlyPrice: 9999,
    yearlySavings: "Save ₹1,989 (2 Months Free)",
    badge: "Most Popular",
    highlight: true,
    features: [
      "Everything in Growth, PLUS:",
      "Advanced Reports & CSV Exports",
      "Business Analytics & Trends",
      "Staff Management & Permissions",
      "WhatsApp Automation (Reminders & Passes)",
      "Advanced Business Insights"
    ]
  },
  {
    id: "gym_classes",
    name: "Gym + Classes",
    tagline: "Complete gym management with group classes & session bookings",
    monthlyPrice: 1499,
    yearlyPrice: 14999,
    yearlySavings: "Save ₹2,989 (2 Months Free)",
    badge: "All-Inclusive",
    highlight: false,
    features: [
      "Everything in Pro, PLUS:",
      "Group Classes & Schedule Management",
      "Class Plans & Member Class Pass",
      "Daily Class Sessions & Capacity Control",
      "Class Bookings & Seat Reservations",
      "Class Attendance & Check-ins",
      "Class Payments & Class Revenue Analytics",
      "Member Mobile Class Booking Access"
    ]
  }
];

const comparisonRows = [
  { feature: "Gym Dashboard & KPIs", growth: true, pro: true, gymClasses: true },
  { feature: "Member Management", growth: true, pro: true, gymClasses: true },
  { feature: "Membership Plans", growth: true, pro: true, gymClasses: true },
  { feature: "Manual & QR Attendance", growth: true, pro: true, gymClasses: true },
  { feature: "Payments & Dues Ledger", growth: true, pro: true, gymClasses: true },
  { feature: "Owner & Member Mobile Apps", growth: true, pro: true, gymClasses: true },
  { feature: "Basic Summary Reports", growth: true, pro: true, gymClasses: true },
  { feature: "Advanced Reports & CSV Exports", growth: false, pro: true, gymClasses: true },
  { feature: "Business Analytics & Trends", growth: false, pro: true, gymClasses: true },
  { feature: "Staff Management & Roles", growth: false, pro: true, gymClasses: true },
  { feature: "WhatsApp Automation", growth: false, pro: true, gymClasses: true },
  { feature: "Group Classes & Sessions", growth: false, pro: false, gymClasses: true },
  { feature: "Class Plans & Memberships", growth: false, pro: false, gymClasses: true },
  { feature: "Class Bookings & Attendance", growth: false, pro: false, gymClasses: true },
  { feature: "Class Payments & Analytics", growth: false, pro: false, gymClasses: true },
  { feature: "Member Mobile Class Access", growth: false, pro: false, gymClasses: true }
];

const faqs = [
  ["Can I upgrade my plan anytime?", "Yes, you can upgrade from Growth to Pro or Gym + Classes at any time."],
  ["Is there any setup fee?", "No, all plans come with zero setup fee and a 7-day free trial."],
  ["Are mobile apps included in all plans?", "Yes, both Owner Mobile App and Member Mobile App access are included in all plans."],
  ["Who needs the Gym + Classes plan?", "Gyms that offer group workout sessions (Zumba, Yoga, CrossFit, Spinning, MMA) and need session booking, capacity control, and class membership tracking."]
];

function TrialExpiredModal({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/65 p-5">
      <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#F1F5F9] text-[#475569]">
          <Sparkles className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">Your Free Trial Has Ended</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">Subscribe to continue using GymPulse.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => toast("Please contact GymPulse Sales to upgrade your subscription.")} className="rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white">Upgrade Now</button>
          <button type="button" onClick={onLogout} className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#475569]">Logout</button>
        </div>
      </section>
    </div>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white px-5 shadow-[0_5px_18px_rgba(15,23,42,0.035)]">
      <p className="pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">Frequently asked questions</p>
      <div className="mt-2 divide-y divide-[#E2E8F0]">
        {faqs.map(([question, answer], index) => {
          const isOpen = openIndex === index;
          return (
            <div key={question}>
              <button type="button" onClick={() => setOpenIndex(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-semibold text-[#334155]">
                <span>{question}</span>
                <ChevronDown className={`size-4 shrink-0 text-[#94A3B8] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pb-3.5 text-sm leading-5 text-[#64748B]">{answer}</motion.p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SubscriptionPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const isLoggedIn = useSyncExternalStore(subscribe, () => Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY)), serverSnapshot);
  const role = useSyncExternalStore(subscribe, () => window.localStorage.getItem(AUTH_ROLE_KEY), () => null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
    else if (!isDevelopmentMode && canAccessDashboard(role)) router.replace("/dashboard");
  }, [isLoggedIn, role]);

  const logout = () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_ROLE_KEY);
    router.replace("/login");
  };

  const handleUpgradeClick = (planName: string) => {
    toast(`Please contact GymPulse Sales to upgrade to the ${planName} plan.`);
  };

  if (!isLoggedIn || (!isDevelopmentMode && canAccessDashboard(role))) return <div className="min-h-screen bg-[#F8FAFC]" />;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-[#0F172A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between py-2">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[#0F172A] text-[10px] font-black text-white">GP</span>
            <span className="text-base font-bold tracking-[-0.04em]">GymPulse</span>
          </Link>
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#64748B] transition hover:bg-white hover:text-[#0F172A]">
            <LogOut className="size-4" />Logout
          </button>
        </header>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative mx-auto max-w-3xl py-8 text-center sm:py-10">
          <div className="absolute inset-x-20 top-0 -z-10 h-40 rounded-full bg-[radial-gradient(ellipse,rgba(203,213,225,0.7),transparent_70%)]" />
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-[#475569] shadow-sm">
            <Sparkles className="size-3" />PRICING & ENTITLEMENTS
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.06em] sm:text-5xl">Choose the right plan for your gym.</h1>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">Transparent pricing tailored to your gym size and operational needs.</p>

          <div className="mt-6 inline-flex items-center rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${billingCycle === "monthly" ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"}`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${billingCycle === "yearly" ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"}`}
            >
              Yearly Billing (Save up to ₹2,989)
            </button>
          </div>
        </motion.section>

        {/* 3 Customer Subscription Cards */}
        <section className="grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const periodStr = billingCycle === "monthly" ? "/month" : "/year";
            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${plan.highlight ? "border-2 border-[#0F172A] shadow-lg" : "border-[#E2E8F0]"}`}
              >
                {plan.badge && (
                  <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-[#0F172A] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-sm">
                    {plan.badge}
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-[#0F172A]">{plan.name}</h3>
                  <p className="mt-1 text-xs text-[#64748B] min-h-8">{plan.tagline}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-[-0.05em] text-[#0F172A]">₹{price.toLocaleString("en-IN")}</span>
                    <span className="text-xs font-medium text-[#64748B]">{periodStr}</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">{plan.yearlySavings}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleUpgradeClick(plan.name)}
                  className={`mt-6 w-full rounded-xl py-3 text-xs font-bold transition ${plan.highlight ? "bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-md" : "border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] hover:bg-[#F1F5F9]"}`}
                >
                  Choose {plan.name}
                </button>

                <div className="mt-6 border-t border-[#E2E8F0] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Included Entitlements</p>
                  <ul className="mt-3 space-y-2 text-xs text-[#475569]">
                    {plan.features.map((feat) => (
                      <li key={feat} className={`flex items-start gap-2 ${feat.startsWith("Everything") ? "font-bold text-[#0F172A]" : ""}`}>
                        {!feat.startsWith("Everything") && <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />}
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </section>

        {/* Feature Comparison Matrix */}
        <section className="mt-12 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">Plan Comparison Matrix</h2>
            <p className="mt-1 text-xs text-[#64748B]">Detailed breakdown of available features across customer tiers.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]">
                  <th className="py-3 px-4 font-bold">Feature / Capability</th>
                  <th className="py-3 px-4 font-bold text-center w-28">Growth (₹499)</th>
                  <th className="py-3 px-4 font-bold text-center w-28">Pro (₹999)</th>
                  <th className="py-3 px-4 font-bold text-center w-36">Gym + Classes (₹1,499)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="hover:bg-[#F8FAFC]/50 transition">
                    <td className="py-3 px-4 font-medium text-[#334155]">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.growth ? <Check className="mx-auto size-4 text-emerald-600" strokeWidth={2.5} /> : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.pro ? <Check className="mx-auto size-4 text-emerald-600" strokeWidth={2.5} /> : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center bg-indigo-50/30">
                      {row.gymClasses ? <Check className="mx-auto size-4 text-indigo-600" strokeWidth={2.5} /> : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">SaaS Payment Methods</p>
            <p className="mt-1 text-xs text-[#64748B]">Online gateway activation available via GymPulse Sales.</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[{ label: "Razorpay", icon: CreditCard }, { label: "UPI", icon: Smartphone }, { label: "Cards", icon: CreditCard }, { label: "Net Banking", icon: Landmark }].map(({ label, icon: Icon }) => (
              <div key={label} className="grid min-w-16 place-items-center rounded-lg bg-[#F8FAFC] px-2 py-2 text-[#64748B]">
                <Icon className="size-3.5" />
                <span className="mt-1 text-[10px] font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <FaqAccordion />
        <footer className="py-6 text-center text-[11px] text-[#94A3B8]">Made in India 🇮🇳 · Built for Modern Gyms · GymPulse © 2026</footer>
      </div>
      {hasExpiredTrial && <TrialExpiredModal onLogout={logout} />}
    </main>
  );
}
