"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  DollarSign,
  Layers,
  MessageSquare,
  Percent,
  PlusCircle,
  RefreshCw,
  Server,
  Trash2,
  X,
} from "lucide-react";
import {
  getAdminUsageAndCosts,
  getAdminOperatingCosts,
  addAdminOperatingCost,
  deleteAdminOperatingCost,
  type UsageAndCostsData,
  type OperatingCostEntry,
} from "@/src/services/admin.service";

export default function AdminUsageCostsPage() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isAddCostOpen, setIsAddCostOpen] = useState(false);
  const [category, setCategory] = useState("HOSTING");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: usageData,
    isLoading: isUsageLoading,
    isFetching,
    refetch: refetchUsage,
  } = useQuery<UsageAndCostsData>({
    queryKey: ["admin", "usage-costs", selectedMonth],
    queryFn: () => getAdminUsageAndCosts(selectedMonth),
  });

  const {
    data: operatingCosts = [],
    refetch: refetchCosts,
  } = useQuery<OperatingCostEntry[]>({
    queryKey: ["admin", "operating-costs", selectedMonth],
    queryFn: () => getAdminOperatingCosts(selectedMonth),
  });

  const addCostMutation = useMutation({
    mutationFn: () =>
      addAdminOperatingCost({
        month: selectedMonth,
        category,
        provider: provider.trim() || "INFRA",
        amount: parseFloat(amount),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "usage-costs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "operating-costs"] });
      setIsAddCostOpen(false);
      setProvider("");
      setNotes("");
      setAmount("");
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error?.message || "Failed to record operating cost");
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: (id: string) => deleteAdminOperatingCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "usage-costs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "operating-costs"] });
    },
  });

  if (isUsageLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-slate-400">
            Computing unit economics and cost allocations...
          </p>
        </div>
      </div>
    );
  }

  const economics = usageData?.companyEconomics || {
    totalPlatformSubscriptionRevenue: 0,
    totalWhatsAppCost: 0,
    totalOperatingCosts: 0,
    totalCosts: 0,
    estimatedGrossContribution: 0,
    contributionMarginPct: 100,
    unitCostUsed: 0.12,
    activeGymsCount: 0,
    allocatedSharedCostPerGym: 0,
  };
  const topWhatsAppUsage = usageData?.topRankings?.topWhatsAppUsage || [];
  const gymsList = usageData?.gyms || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Usage, Unit Costs &amp; Margins
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            WhatsApp variable consumption, infrastructure cost allocation, and gym gross contribution margins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => {
              refetchUsage();
              refetchCosts();
            }}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setIsAddCostOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Record Operating Cost
          </button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>WhatsApp Unit Cost</span>
            <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            ₹{economics.unitCostUsed}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Per delivered/sent message</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>WhatsApp Cost</span>
            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            ₹{economics.totalWhatsAppCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Direct WhatsApp fees</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Shared Operating</span>
            <Server className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-400">
            ₹{economics.totalOperatingCosts.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Allocated across {economics.activeGymsCount} gyms</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Platform Revenue</span>
            <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-teal-400">
            ₹{economics.totalPlatformSubscriptionRevenue.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Subscription cash collected</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Contribution Margin</span>
            <Percent className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {economics.contributionMarginPct}%
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Gross profit contribution</div>
        </div>
      </div>

      {/* Top Consuming Gyms & Operating Costs Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 WhatsApp Consuming Gyms */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Top WhatsApp Consuming Tenants
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Gym</th>
                  <th className="px-4 py-3">Month Volume</th>
                  <th className="px-4 py-3 text-right">Direct WhatsApp Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {topWhatsAppUsage.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No WhatsApp activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  topWhatsAppUsage.map((tg) => (
                    <tr key={tg.gymId} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-white">
                        <Link href={`/admin/gyms/${tg.gymId}`} className="hover:text-emerald-400">
                          {tg.gymName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sky-400 font-mono font-bold">
                        {tg.whatsapp?.delivered || 0} delivered
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                        ₹{(tg.financials?.estimatedWhatsAppCost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operating Costs Recorded */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Platform Shared Operating Expenses
            </h2>
            <span className="text-xs text-slate-400">{selectedMonth}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Provider / Notes</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {operatingCosts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No operating expenses recorded for this month.
                    </td>
                  </tr>
                ) : (
                  operatingCosts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {c.provider} {c.notes ? `• ${c.notes}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-purple-400">
                        ₹{c.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteCostMutation.mutate(c.id)}
                          disabled={deleteCostMutation.isPending}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Per-Gym Contribution Margins Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Per-Tenant Unit Economics &amp; Contribution Margins
        </h2>
        <p className="text-xs text-slate-400">
          Individual gym revenue vs. variable WhatsApp provider costs and allocated shared infrastructure overhead.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Gym Organization</th>
                  <th className="px-4 py-3">Plan Tier</th>
                  <th className="px-4 py-3 text-right">Subscription Rev</th>
                  <th className="px-4 py-3 text-right">WhatsApp Cost</th>
                  <th className="px-4 py-3 text-right">Allocated Shared</th>
                  <th className="px-4 py-3 text-right">Contribution</th>
                  <th className="px-4 py-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {gymsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No tenant economics calculated for selected month.
                    </td>
                  </tr>
                ) : (
                  gymsList.map((item) => (
                    <tr key={item.gymId} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-white">
                        <Link href={`/admin/gyms/${item.gymId}`} className="hover:text-emerald-400">
                          {item.gymName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                          {item.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                        ₹{(item.financials?.subscriptionRevenue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        ₹{(item.financials?.estimatedWhatsAppCost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-purple-400">
                        ₹{(item.financials?.allocatedSharedCost || 0).toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          (item.financials?.estimatedGrossContribution || 0) >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        ₹{(item.financials?.estimatedGrossContribution || 0).toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          (item.financials?.contributionMarginPct || 0) >= 50
                            ? "text-emerald-400"
                            : (item.financials?.contributionMarginPct || 0) >= 0
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {item.financials?.contributionMarginPct || 0}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Operating Cost Modal */}
      {isAddCostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Record Operating Expense</h3>
              <button onClick={() => setIsAddCostOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Input infrastructure, hosting, or external API costs for margin allocation.
            </p>

            {formError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                {formError}
              </div>
            )}

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="HOSTING">HOSTING (AWS / Render / DigitalOcean)</option>
                  <option value="DATABASE">DATABASE (Neon / Supabase / RDS)</option>
                  <option value="SMS_GATEWAY">SMS_GATEWAY (Twilio / MessageBird Base)</option>
                  <option value="THIRD_PARTY_API">THIRD_PARTY_API</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Provider Name</label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. AWS Lightsail / Neon"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Amount (₹ INR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Memo</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Database compute units"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAddCostOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => addCostMutation.mutate()}
                disabled={!amount || parseFloat(amount) <= 0 || addCostMutation.isPending}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {addCostMutation.isPending ? "Saving..." : "Save Operating Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
