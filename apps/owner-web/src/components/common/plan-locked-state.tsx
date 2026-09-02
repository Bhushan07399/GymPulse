import React from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface PlanLockedStateProps {
  title?: string;
  description?: string;
  featureName?: string;
  requiredPlan?: string;
  requiredPlanName?: string;
  actionText?: string;
  actionHref?: string;
}

export function PlanLockedState({
  title,
  description,
  featureName = "Feature",
  requiredPlan,
  requiredPlanName,
  actionText = "Upgrade Plan",
  actionHref = "/subscription",
}: PlanLockedStateProps) {
  const planDisplay = requiredPlanName || requiredPlan || "Growth";
  const displayTitle = title || `${featureName} Locked`;
  const displayDesc = description || `Upgrade your gym plan to unlock ${featureName}.`;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-amber-200 bg-amber-50/50 my-6 max-w-md mx-auto">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4 shadow-sm">
        <Lock className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{displayTitle}</h3>
      <p className="text-xs text-slate-600 mt-1.5 max-w-sm">{displayDesc}</p>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Requires {planDisplay} Plan</span>
      </div>

      <Link
        href={actionHref}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
      >
        {actionText}
      </Link>
    </div>
  );
}
