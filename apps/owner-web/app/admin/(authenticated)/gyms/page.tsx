"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { getAdminGyms, type AdminGym } from "@/src/services/admin.service";

export default function AdminGymsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "gyms", { search: searchTerm, status: statusFilter, plan: planFilter, page }],
    queryFn: () =>
      getAdminGyms({
        search: searchTerm || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        plan: planFilter === "ALL" ? undefined : planFilter,
        page,
        limit: pageSize,
      }),
  });

  const gyms = data?.gyms || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Gyms &amp; Tenant Organizations
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Directory of all registered fitness centers, subscription tiers, and tenant states.
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by gym name, owner phone, or email..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Plans</option>
            <option value="Growth">Growth</option>
            <option value="Pro">Pro</option>
            <option value="Gym + Classes">Gym + Classes</option>
          </select>
        </div>
      </div>

      {/* Gyms Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Gym Organization</th>
                <th className="px-4 py-3.5">Owner Details</th>
                <th className="px-4 py-3.5">Subscription Plan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Locations</th>
                <th className="px-4 py-3.5">Onboarded</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      <span>Loading gym portfolio...</span>
                    </div>
                  </td>
                </tr>
              ) : gyms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No gyms found matching the selected filters.
                  </td>
                </tr>
              ) : (
                gyms.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">{g.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{g.city ? `${g.city}, ${g.state || ""}` : g.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{g.ownerName || "—"}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {g.phone ? `${g.phone.slice(0, 4)}••••${g.phone.slice(-3)}` : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                          {g.subscriptionPlan}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {g.billingCycle}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          g.subscriptionStatus === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : g.subscriptionStatus === "TRIAL"
                            ? "bg-blue-500/20 text-blue-400"
                            : g.subscriptionStatus === "SUSPENDED"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {g.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-200">
                      {g.maxLocations} max
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/gyms/${g.id}`}
                        className="inline-flex items-center rounded-lg bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
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

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{gyms.length}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> gyms
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-300">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
              disabled={page >= (totalPages || 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
