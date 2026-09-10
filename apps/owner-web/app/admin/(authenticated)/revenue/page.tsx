"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Info,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { getAdminRevenue, type RevenueAnalyticsData } from "@/src/services/admin.service";

export default function AdminRevenuePage() {
  const {
    data: revenue,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<RevenueAnalyticsData>({
    queryKey: ["admin", "revenue"],
    queryFn: getAdminRevenue,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-slate-400">
            Calculating portfolio recurring revenue...
          </p>
        </div>
      </div>
    );
  }

  const mrr = revenue?.mrr || 0;
  const arr = revenue?.arr || 0;
  const cashCollectedThisMonth = revenue?.cashCollectedThisMonth || 0;
  const growthPct = revenue?.growthPct || 0;
  const byPlan = revenue?.byPlan || [];
  const byCycle = revenue?.byCycle || [];
  const trend = revenue?.trend || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Recurring Revenue &amp; Financial Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            B2B software recurring revenues, plan yields, and subscription portfolio metrics.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Accounting Methodology Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs text-emerald-300/90">
        <Info className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-emerald-300 uppercase tracking-wider block mb-0.5">
            SaaS Revenue Methodology
          </span>
          MRR (Monthly Recurring Revenue) and ARR (Annual Recurring Revenue) are calculated strictly from active B2B gym platform subscriptions (e.g. Starter ₹1,499/mo, Pro ₹2,999/mo, Enterprise ₹5,999/mo). End-member fitness dues collected inside gyms belong exclusively to the gym owners and are not recognized as platform revenue.
        </div>
      </div>

      {/* Primary Financial Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MRR</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            ₹{mrr.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Monthly Recurring Revenue</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ARR</span>
            <Calendar className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            ₹{arr.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Normalized Annual Run Rate</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Collected This Month</span>
            <DollarSign className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            ₹{cashCollectedThisMonth.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {growthPct >= 0 ? `+${growthPct}% vs last month` : `${growthPct}% vs last month`}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reporting Currency</span>
            <Building2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            INR (₹)
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Domestic Indian SaaS pricing</div>
        </div>
      </div>

      {/* Plan Breakdown & Billing Cycle Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tier Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Revenue by Subscription Tier
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Plan Tier</th>
                  <th className="px-4 py-3">Subscribers</th>
                  <th className="px-4 py-3 text-right">Revenue Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {byPlan.map((p) => (
                  <tr key={p.plan} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-white">{p.plan}</td>
                    <td className="px-4 py-3">{p.count} gyms</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      ₹{p.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing Cycle Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Billing Frequency Distribution
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Subscribers</th>
                  <th className="px-4 py-3 text-right">Revenue Equivalent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {byCycle.map((c) => (
                  <tr key={c.cycle} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-white">{c.cycle}</td>
                    <td className="px-4 py-3">{c.count} gyms</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      ₹{c.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Historic Trend */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
          Historical Monthly Subscription Inflow
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Month</th>
                <th className="px-5 py-3.5">Payments Invoiced</th>
                <th className="px-5 py-3.5 text-right">Invoiced SaaS Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {trend.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-slate-500">
                    No historical monthly billing records captured yet.
                  </td>
                </tr>
              ) : (
                trend.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-bold text-white">{m.month}</td>
                    <td className="px-5 py-3.5">{m.paymentCount} payments</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">
                      ₹{m.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
