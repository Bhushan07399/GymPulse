"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  getAdminWhatsAppOperations,
  getAdminWhatsAppLogs,
  type WhatsAppOperationsData,
  type AdminWhatsAppLog,
} from "@/src/services/admin.service";

export default function AdminWhatsappOperationsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: operations,
    isLoading: isOpsLoading,
    isFetching: isOpsFetching,
    refetch: refetchOps,
  } = useQuery<WhatsAppOperationsData>({
    queryKey: ["admin", "whatsapp-operations"],
    queryFn: () => getAdminWhatsAppOperations(30),
  });

  const {
    data: logsData,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["admin", "whatsapp-logs", { status: statusFilter, search: searchTerm }],
    queryFn: () =>
      getAdminWhatsAppLogs({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchTerm || undefined,
        limit: 50,
      }),
  });

  const logs = logsData?.logs || [];
  const failures = operations?.failures || [];
  const modes = operations?.gymConnectionModes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            WhatsApp Gateway &amp; Operations
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Platform message throughput, delivery performance, connection modes, and failure intelligence.
          </p>
        </div>
        <button
          onClick={() => {
            refetchOps();
            refetchLogs();
          }}
          disabled={isOpsFetching || isLogsFetching}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isOpsFetching || isLogsFetching ? "animate-spin text-emerald-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Attempts</div>
          <div className="mt-2 text-2xl font-black text-white">{(operations?.totalMessages || 0).toLocaleString()}</div>
          <div className="mt-1 text-[10px] text-slate-400">30-day window</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivered</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{(operations?.delivered || 0).toLocaleString()}</div>
          <div className="mt-1 text-[10px] text-slate-400">Confirmed delivery</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sent / In Flight</div>
          <div className="mt-2 text-2xl font-black text-sky-400">{(operations?.sent || 0).toLocaleString()}</div>
          <div className="mt-1 text-[10px] text-slate-400">Dispatched to provider</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Failed Messages</div>
          <div className="mt-2 text-2xl font-black text-rose-400">{(operations?.failed || 0).toLocaleString()}</div>
          <div className="mt-1 text-[10px] text-slate-400">Undeliverable / rejected</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivery Success Rate</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{operations?.deliveryRatePct || 100}%</div>
          <div className="mt-1 text-[10px] text-slate-400">Delivered / Total</div>
        </div>
      </div>

      {/* Connection Modes & Failure Reasons */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Connection Modes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Tenant Connection Modes
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Connection Mode</th>
                  <th className="px-4 py-3 text-right">Configured Gyms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold text-white">Live Meta Cloud API</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">{modes?.liveMetaApi || 0} gyms</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold text-white">Log-Only / Gateway Mode</td>
                  <td className="px-4 py-3 text-right text-sky-400 font-bold">{modes?.logOnlyMode || 0} gyms</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold text-white">Not Configured</td>
                  <td className="px-4 py-3 text-right text-slate-400 font-bold">{modes?.notConfigured || 0} gyms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Failure Intelligence */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Failure Intelligence &amp; Rejection Causes
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Reason / Error</th>
                  <th className="px-4 py-3 text-right">Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {failures.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-center text-slate-500">
                      Zero message failures detected in current window.
                    </td>
                  </tr>
                ) : (
                  failures.map((f) => (
                    <tr key={f.reason} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-rose-300 font-mono text-[11px] truncate max-w-xs">
                        {f.reason}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">{f.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Logs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by recipient phone or gym..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      </div>

      {/* Masked Operational WhatsApp Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Gym Organization</th>
                <th className="px-4 py-3.5">Recipient (Masked)</th>
                <th className="px-4 py-3.5">Message Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5">Error / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No WhatsApp logs found matching filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-white">
                      <Link href={`/admin/gyms/${log.gymId}`} className="hover:text-emerald-400">
                        {log.gymName || log.gymId}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-200">
                      {log.maskedPhone}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {log.automationType || log.templateName || "MESSAGE"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          log.status === "DELIVERED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : log.status === "SENT"
                            ? "bg-sky-500/20 text-sky-400"
                            : log.status === "FAILED"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-rose-300 font-mono text-[10px] max-w-xs truncate">
                      {log.errorMessage || "—"}
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
