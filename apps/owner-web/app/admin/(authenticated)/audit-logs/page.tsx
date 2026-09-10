"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Code,
  Filter,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { getAdminAuditLogs, type AdminAuditLog } from "@/src/services/admin.service";

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [inspectingLog, setInspectingLog] = useState<AdminAuditLog | null>(null);
  const pageSize = 25;

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "audit-logs", { action: actionFilter, page }],
    queryFn: () =>
      getAdminAuditLogs({
        action: actionFilter === "ALL" ? undefined : actionFilter,
        page,
        limit: pageSize,
      }),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Immutable Security Audit Logs
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Append-only record of all administrative operations, tenant overrides, and platform interventions.
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

      {/* Filter Bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">Action:</span>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Actions</option>
          <option value="SUSPEND_GYM">SUSPEND_GYM</option>
          <option value="REACTIVATE_GYM">REACTIVATE_GYM</option>
          <option value="EXTEND_TRIAL">EXTEND_TRIAL</option>
          <option value="CHANGE_PLAN">CHANGE_PLAN</option>
          <option value="ADJUST_LOCATIONS">ADJUST_LOCATIONS</option>
          <option value="UPDATE_ALERT">UPDATE_ALERT</option>
          <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
          <option value="ADD_OPERATING_COST">ADD_OPERATING_COST</option>
          <option value="CREATE_ADMIN">CREATE_ADMIN</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Admin Operator</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Target Gym</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      <span>Retrieving audit ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-white">
                      <div className="font-mono text-xs">{log.adminEmail || "Super Admin"}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {log.gymName ? (
                        <Link
                          href={`/admin/gyms/${log.gymId}`}
                          className="font-semibold text-slate-200 hover:text-emerald-400"
                        >
                          {log.gymName}
                        </Link>
                      ) : log.gymId ? (
                        <span className="font-mono text-slate-400">{log.gymId.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-slate-500">Platform Global</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{log.ipAddress || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setInspectingLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
                      >
                        <Code className="h-3 w-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{logs.length}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> audit records
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

      {/* JSON State Diff Inspection Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Audit Event Details</h3>
                <p className="text-xs text-slate-400">
                  {inspectingLog.action} &bull; {new Date(inspectingLog.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Previous State
                </div>
                <pre className="max-h-64 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
                  {inspectingLog.beforeState
                    ? JSON.stringify(inspectingLog.beforeState, null, 2)
                    : "null"}
                </pre>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  New State / Payload
                </div>
                <pre className="max-h-64 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-400">
                  {inspectingLog.afterState
                    ? JSON.stringify(inspectingLog.afterState, null, 2)
                    : "null"}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectingLog(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
