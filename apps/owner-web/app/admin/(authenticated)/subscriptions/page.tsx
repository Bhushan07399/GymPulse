"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  History,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  getAdminSubscriptions,
  getAdminSubscriptionHistory,
  type AdminSubscription,
  type SubscriptionHistoryItem,
} from "@/src/services/admin.service";

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "history">("subscriptions");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");

  const {
    data: subscriptionsData,
    isLoading: subsLoading,
    refetch: refetchSubs,
    isFetching: subsFetching,
  } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => getAdminSubscriptions(),
  });

  const {
    data: historyData = [],
    isLoading: histLoading,
    refetch: refetchHist,
    isFetching: histFetching,
  } = useQuery<SubscriptionHistoryItem[]>({
    queryKey: ["admin", "subscription-history", { eventType: eventTypeFilter }],
    queryFn: () =>
      getAdminSubscriptionHistory({
        limit: 100,
      }),
  });

  const subscriptions = subscriptionsData?.subscriptions || [];
  const filteredSubs = subscriptions.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.gymName?.toLowerCase().includes(term) ||
      s.ownerName?.toLowerCase().includes(term) ||
      s.plan?.toLowerCase().includes(term)
    );
  });

  const filteredHistory = historyData.filter((h) => {
    if (eventTypeFilter === "ALL") return true;
    return h.eventType === eventTypeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            SaaS Subscriptions &amp; Plan Governance
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Portfolio subscription state, renewal cycles, and historical plan lifecycle changes.
          </p>
        </div>
        <button
          onClick={() => (activeTab === "subscriptions" ? refetchSubs() : refetchHist())}
          disabled={subsFetching || histFetching}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${subsFetching || histFetching ? "animate-spin text-emerald-400" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors ${
            activeTab === "subscriptions"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Active Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors ${
            activeTab === "history"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="h-4 w-4" />
          Global Event History
        </button>
      </div>

      {activeTab === "subscriptions" ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subscription by gym, owner, or plan..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Gym Organization</th>
                    <th className="px-4 py-3.5">Owner</th>
                    <th className="px-4 py-3.5">Plan Tier</th>
                    <th className="px-4 py-3.5">Cycle</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Period Ends</th>
                    <th className="px-4 py-3.5">Trial Ends</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {subsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        Loading subscriptions...
                      </td>
                    </tr>
                  ) : filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                        No subscriptions found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((s) => (
                      <tr key={s.gymId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white">{s.gymName}</td>
                        <td className="px-4 py-3.5 text-slate-300">{s.ownerName || "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                            {s.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 uppercase">{s.billingCycle}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              s.status === "ACTIVE"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : s.status === "TRIAL"
                                ? "bg-blue-500/20 text-blue-400"
                                : s.status === "SUSPENDED"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">
                          {s.subscriptionEndDate
                            ? new Date(s.subscriptionEndDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">
                          {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/gyms/${s.gymId}`}
                            className="font-semibold text-emerald-400 hover:text-emerald-300"
                          >
                            Manage &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter by event type */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">Event Type:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="TRIAL_STARTED">TRIAL_STARTED</option>
              <option value="PLAN_UPGRADE">PLAN_UPGRADE</option>
              <option value="PLAN_DOWNGRADE">PLAN_DOWNGRADE</option>
              <option value="RENEWAL">RENEWAL</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="REACTIVATED">REACTIVATED</option>
              <option value="TRIAL_EXTENDED">TRIAL_EXTENDED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* History table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Gym Organization</th>
                    <th className="px-4 py-3.5">Event</th>
                    <th className="px-4 py-3.5">Plan</th>
                    <th className="px-4 py-3.5">Cycle</th>
                    <th className="px-4 py-3.5">Notes</th>
                    <th className="px-4 py-3.5">Admin Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {histLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        Loading event history...
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        No subscription history events found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5 text-slate-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white">
                          <Link href={`/admin/gyms/${h.gymId}`} className="hover:text-emerald-400">
                            {h.gymName || h.gymId}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                            {h.eventType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-emerald-400 font-bold">
                          {h.plan}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 uppercase">{h.billingCycle}</td>
                        <td className="px-4 py-3.5 text-slate-300">{h.notes || "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">
                          {h.createdByAdmin ? `${h.createdByAdmin.slice(0, 8)}...` : "System"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
