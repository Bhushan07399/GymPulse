"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  Landmark,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { getDashboardAnalytics, getDashboardSummary, type DashboardAnalyticsParams } from "@/src/services/dashboard.service";
import { getApiErrorMessage } from "@/src/utils/get-api-error-message";

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

  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics", period, customStart, customEnd],
    queryFn: () => getDashboardAnalytics({ period, startDate: customStart || undefined, endDate: customEnd || undefined }),
  });

  const analyticsData = analyticsQuery.data;
  const kpis = analyticsData?.kpis;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white">
              <TrendingUp className="size-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Analytics & Growth Trends</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Historical collections, membership growth trends, attrition analytics, and period-based business reports.
          </p>
        </div>

        {/* Period Selector */}
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
              className={`rounded-xl px-3 py-2 transition ${
                period === item.id ? "bg-slate-900 text-white shadow-sm" : "hover:bg-slate-200/70 text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Inputs */}
      {period === "custom" && (
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

      {/* Error state */}
      {analyticsQuery.isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {getApiErrorMessage(analyticsQuery.error)}
        </div>
      )}

      {/* 6 Business KPIs Grid */}
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
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">Gym Revenue</span>
              <Landmark className="size-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-950">{formatMoney(kpis.revenueCollected)}</p>
            <p className="text-[11px] text-emerald-700 font-medium">Membership payments</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">Total Outstanding</span>
              <AlertTriangle className="size-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-950">{formatMoney(kpis.totalOutstanding)}</p>
            <p className="text-[11px] text-amber-700 font-medium">Membership dues</p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider">Payments Count</span>
              <ReceiptText className="size-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-950">{kpis.paymentCount}</p>
            <p className="text-[11px] text-indigo-700 font-medium">Txn count</p>
          </div>
        </div>
      ) : null}

      {/* Visual Charts Grid */}
      {analyticsData && (
        <div className="grid gap-6 lg:grid-cols-3 pt-2">
          {/* Weekly Analytics Chart (Mon - Sun) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Joinings vs Left</h3>
                <p className="text-[11px] text-slate-500">Mon - Sun daily breakdown</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="size-2 rounded-full bg-blue-500" /> Joined
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="size-2 rounded-full bg-rose-500" /> Left
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 items-end h-44 pt-6 pb-2 border-b border-slate-100">
              {analyticsData.weeklyBreakdown.map((item) => {
                const maxVal = Math.max(...analyticsData.weeklyBreakdown.map((w) => Math.max(w.joined, w.left)), 1);
                const joinedPct = (item.joined / maxVal) * 100;
                const leftPct = (item.left / maxVal) * 100;
                return (
                  <div key={item.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="flex items-end gap-1 h-full w-full justify-center">
                      <div
                        style={{ height: `${Math.max(joinedPct, 8)}%` }}
                        className="w-2.5 rounded-t-md bg-blue-500 transition-all group-hover:bg-blue-600"
                        title={`${item.day}: ${item.joined} joined`}
                      />
                      <div
                        style={{ height: `${Math.max(leftPct, item.left > 0 ? 8 : 0)}%` }}
                        className={`w-2.5 rounded-t-md ${item.left > 0 ? "bg-rose-500" : "bg-transparent"}`}
                        title={`${item.day}: ${item.left} left`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Total joined: {analyticsData.weeklyBreakdown.reduce((sum, w) => sum + w.joined, 0)}</span>
              <span>Total left: {analyticsData.weeklyBreakdown.reduce((sum, w) => sum + w.left, 0)}</span>
            </div>
          </div>

          {/* Historical Member Growth (Last 6 Months) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Member Growth Trend</h3>
                <p className="text-[11px] text-slate-500">Last 6 Months historical net growth</p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 items-end h-44 pt-6 pb-2 border-b border-slate-100">
              {analyticsData.monthlyGrowth.map((item) => {
                const maxVal = Math.max(...analyticsData.monthlyGrowth.map((m) => Math.max(m.joined, m.left)), 1);
                const pct = (item.joined / maxVal) * 100;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="flex items-end gap-1 h-full w-full justify-center">
                      <div
                        style={{ height: `${Math.max(pct, 10)}%` }}
                        className="w-4 rounded-t-lg bg-slate-900 transition-all group-hover:bg-slate-800"
                        title={`${item.month}: +${item.joined} joined, -${item.left} left`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">{item.month.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 font-medium">
              {analyticsData.monthlyGrowth.slice(-3).map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span>{item.month}:</span>
                  <span className="font-mono font-bold text-slate-900">
                    +{item.joined} joined / {item.left} left ({item.netGrowth >= 0 ? `+${item.netGrowth}` : item.netGrowth})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Revenue Trend (Last 6 Months) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Revenue Trend (Last 6 Months)</h3>
                <p className="text-[11px] text-slate-500">Monthly collections & transaction counts</p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 items-end h-44 pt-6 pb-2 border-b border-slate-100">
              {analyticsData.revenueTrend.map((item) => {
                const maxRev = Math.max(...analyticsData.revenueTrend.map((r) => r.revenue), 1);
                const pct = (item.revenue / maxRev) * 100;
                return (
                  <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="flex items-end gap-1 h-full w-full justify-center">
                      <div
                        style={{ height: `${Math.max(pct, 10)}%` }}
                        className="w-4 rounded-t-lg bg-emerald-600 transition-all group-hover:bg-emerald-700"
                        title={`${item.month}: ${formatMoney(item.revenue)} (${item.paymentsCount} payments)`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">{item.month.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 font-medium">
              {analyticsData.revenueTrend.slice(-3).map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span>{item.month}:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatMoney(item.revenue)} ({item.paymentsCount} txns)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
