"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Landmark,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { getDashboardAnalytics, getDashboardSummary, type DashboardAnalyticsParams } from "@/src/services/dashboard.service";
import { getApiErrorMessage } from "@/src/utils/get-api-error-message";
import { getEntitlements } from "@/src/lib/entitlements";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export function BusinessAnalyticsModule() {
  const [period, setPeriod] = useState<DashboardAnalyticsParams["period"]>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const summaryData = summaryQuery.data as any;
  const entitlements = getEntitlements(summaryData);
  const hasProAccess = entitlements.hasPro;

  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics", period, customStart, customEnd],
    queryFn: () => getDashboardAnalytics({ period, startDate: customStart || undefined, endDate: customEnd || undefined }),
    enabled: hasProAccess,
  });

  const analyticsData = analyticsQuery.data;
  const kpis = analyticsData?.kpis;

  const gymStats = summaryData?.gymMemberships || {};
  const monthlyRevenue = Number(gymStats.revenue || summaryData?.totalRevenue || 0);
  const totalRevenue = Number(gymStats.totalRevenue || 0);
  const totalOutstanding = Number(summaryData?.totalOutstanding || 0);
  const totalMembers = Number(summaryData?.totalMembers || gymStats.totalMembers || 0);
  const activeMembers = Number(summaryData?.activeMembers || gymStats.activeMembers || 0);
  const todaysAttendance = Number(summaryData?.todaysAttendance || 0);
  const newJoinings = Number(gymStats.newJoinings || 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
              <TrendingUp className="size-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Analytics & Metrics</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time business overview, membership growth, collections & growth analytics.
          </p>
        </div>

        {!hasProAccess && (
          <Link
            href="/subscription"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <Crown className="size-4 text-amber-400" />
            Upgrade to Pro for Advanced Trends
          </Link>
        )}
      </div>

      {/* SECTION 1: BASIC BUSINESS PERFORMANCE OVERVIEW (WORKS FOR ALL PLANS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
            Core Business Metrics
          </h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Live Overview
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">Monthly Revenue</span>
              <Landmark className="size-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-950">{formatMoney(monthlyRevenue)}</p>
            <p className="text-xs text-emerald-700 font-medium">Collections this month</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-blue-800 tracking-wider">Active Members</span>
              <UserCheck className="size-5 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-950">{activeMembers}</p>
            <p className="text-xs text-blue-700 font-medium">Of {totalMembers} total registered</p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-indigo-800 tracking-wider">Today's Check-Ins</span>
              <Clock className="size-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-extrabold text-indigo-950">{todaysAttendance}</p>
            <p className="text-xs text-indigo-700 font-medium">Recorded gym attendance today</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-amber-800 tracking-wider">Outstanding Dues</span>
              <AlertTriangle className="size-5 text-amber-600" />
            </div>
            <p className="text-3xl font-extrabold text-amber-950">{formatMoney(totalOutstanding)}</p>
            <p className="text-xs text-amber-700 font-medium">Uncollected member payments</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ADVANCED ANALYTICS OR PRO LOCKED PREVIEW */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Advanced Period Analytics & Growth Breakdown
            </h2>
            {!hasProAccess && (
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-black text-amber-400">
                PRO FEATURE
              </span>
            )}
          </div>

          {hasProAccess && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 text-xs font-bold text-slate-700">
              {[
                { id: "today", label: "Today" },
                { id: "this_week", label: "This Week" },
                { id: "this_month", label: "This Month" },
                { id: "last_month", label: "Last Month" },
                { id: "this_year", label: "This Year" },
                { id: "last_6_months", label: "Last 6 Months" },
                { id: "custom", label: "Custom" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id as any)}
                  className={`rounded-xl px-3 py-1.5 transition ${
                    period === item.id ? "bg-slate-900 text-white shadow-sm" : "hover:bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom Date Inputs for Pro Users */}
        {hasProAccess && period === "custom" && (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-2">
              From:
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
              />
            </label>
            <label className="font-bold text-slate-700 flex items-center gap-2">
              To:
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
              />
            </label>
          </div>
        )}

        {/* ADVANCED ANALYTICS CONTENT (PRO/CLASSES/MULTI-GYM ONLY) */}
        {hasProAccess ? (
          <div className="space-y-6">
            {/* 6 Advanced KPIs */}
            {analyticsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : kpis ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider">New Joinings</span>
                    <UserPlus className="size-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-blue-950">{kpis.newJoinings}</p>
                  <p className="text-[11px] text-blue-700 font-medium">Joined in period</p>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-rose-700 tracking-wider">Members Left</span>
                    <UserMinus className="size-4 text-rose-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-rose-950">{kpis.membersLeft}</p>
                  <p className="text-[11px] text-rose-700 font-medium">Cancelled / Left</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">Net Growth</span>
                    {kpis.netGrowth >= 0 ? <TrendingUp className="size-4 text-emerald-600" /> : <TrendingDown className="size-4 text-rose-600" />}
                  </div>
                  <p className={`text-2xl font-extrabold ${kpis.netGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {kpis.netGrowth >= 0 ? `+${kpis.netGrowth}` : kpis.netGrowth}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Joinings - Left</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">Period Revenue</span>
                    <Landmark className="size-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-950">{formatMoney(kpis.revenueCollected)}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">Payments in period</p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">Outstanding Dues</span>
                    <AlertTriangle className="size-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-950">{formatMoney(kpis.totalOutstanding)}</p>
                  <p className="text-[11px] text-amber-700 font-medium">Uncollected dues</p>
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider">Payments Count</span>
                    <ReceiptText className="size-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-indigo-950">{kpis.paymentCount}</p>
                  <p className="text-[11px] text-indigo-700 font-medium">Transactions</p>
                </div>
              </div>
            ) : null}

            {/* Charts Grid */}
            {analyticsData && (
              <div className="grid gap-6 lg:grid-cols-2 pt-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Weekly Joinings vs Left</h3>
                      <p className="text-[11px] text-slate-500">Mon - Sun daily breakdown</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 items-end h-40 pt-6 pb-2 border-b border-slate-100">
                    {analyticsData.weeklyBreakdown.map((item) => {
                      const maxVal = Math.max(...analyticsData.weeklyBreakdown.map((w) => Math.max(w.joined, w.left)), 1);
                      const joinPct = Math.round((item.joined / maxVal) * 100);
                      const leftPct = Math.round((item.left / maxVal) * 100);

                      return (
                        <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <div className="flex items-end gap-1 w-full justify-center h-full">
                            <div style={{ height: `${Math.max(joinPct, 6)}%` }} className="w-2.5 rounded-t-md bg-blue-500" />
                            <div style={{ height: `${Math.max(leftPct, 6)}%` }} className="w-2.5 rounded-t-md bg-rose-500" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{item.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Monthly Revenue Trend</h3>
                      <p className="text-[11px] text-slate-500">6-month revenue history</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2 items-end h-40 pt-6 pb-2 border-b border-slate-100">
                    {(analyticsData.revenueTrend || []).map((item) => {
                      const maxRev = Math.max(...(analyticsData.revenueTrend || []).map((m) => m.revenue), 1);
                      const heightPct = Math.round((item.revenue / maxRev) * 100);

                      return (
                        <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <div style={{ height: `${Math.max(heightPct, 8)}%` }} className="w-6 rounded-t-lg bg-emerald-500" />
                          <span className="text-[10px] font-bold text-slate-600">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* POLISHED LOCKED PREVIEW FOR GROWTH / TRIAL USERS */
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative z-10 max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/30 px-3.5 py-1 text-xs font-bold text-amber-300">
                <Crown className="size-4 text-amber-400" />
                Pro Feature Tier
              </div>

              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Unlock Advanced Business Intelligence & Growth Trends
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Gain deep operational insights with custom date-range reporting, period-based revenue trends, attrition analysis, and multi-period financial comparisons.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs font-semibold text-slate-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span>Custom date-range revenue analytics</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span>6-Month revenue & growth trends</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span>Member attrition & cancellation analysis</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span>Staff management & role control</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/subscription"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-extrabold text-slate-900 shadow-md hover:bg-slate-100 transition"
                >
                  Upgrade to Pro Plan (₹999/mo)
                  <ArrowUpRight className="size-4 text-slate-900" />
                </Link>
                <span className="text-xs text-slate-400 font-medium">
                  Instant activation • Zero downtime
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
