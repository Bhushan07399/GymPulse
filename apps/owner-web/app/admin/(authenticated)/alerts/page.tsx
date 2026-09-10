"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  Filter,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import {
  getAdminAlerts,
  acknowledgeAlert,
  resolveAlert,
  type PlatformAlert,
} from "@/src/services/admin.service";

export default function AdminAlertsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const {
    data: alerts = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PlatformAlert[]>({
    queryKey: ["admin", "alerts", { status: statusFilter, severity: severityFilter }],
    queryFn: () =>
      getAdminAlerts({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        severity: severityFilter === "ALL" ? undefined : severityFilter,
      }),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Platform Operational Alerts
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time critical incidents, subscription anomalies, delivery spikes, and system warnings.
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
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <span>Checking platform alert conditions...</span>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <h3 className="mt-2 text-sm font-bold text-white">No alerts currently match filter</h3>
            <p className="mt-1 text-xs text-slate-500">
              All monitored subsystems and tenant thresholds are within normal boundaries.
            </p>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border p-5 transition-colors ${
                a.severity === "CRITICAL"
                  ? "border-rose-500/30 bg-rose-950/20"
                  : a.severity === "HIGH"
                  ? "border-amber-500/30 bg-amber-950/20"
                  : a.severity === "MEDIUM"
                  ? "border-yellow-500/20 bg-yellow-950/10"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  {a.severity === "CRITICAL" ? (
                    <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                  ) : a.severity === "HIGH" ? (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                  ) : (
                    <Bell className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          a.severity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300"
                            : a.severity === "HIGH"
                            ? "bg-amber-500/20 text-amber-300"
                            : a.severity === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {a.severity}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">{a.alertKey}</span>
                      <span className="text-[11px] text-slate-500">
                        &bull; {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="mt-1.5 text-sm font-bold text-white">{a.title}</h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">{a.description}</p>

                    {a.gymName && (
                      <div className="mt-2 text-xs">
                        <span className="text-slate-500">Affected Tenant: </span>
                        <Link
                          href={`/admin/gyms/${a.gymId}`}
                          className="font-semibold text-emerald-400 hover:underline"
                        >
                          {a.gymName}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      a.status === "ACTIVE"
                        ? "bg-rose-500/20 text-rose-400"
                        : a.status === "ACKNOWLEDGED"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {a.status}
                  </span>

                  {a.status === "ACTIVE" && (
                    <button
                      onClick={() => acknowledgeMutation.mutate(a.id)}
                      disabled={acknowledgeMutation.isPending}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Acknowledge
                    </button>
                  )}

                  {a.status !== "RESOLVED" && (
                    <button
                      onClick={() => resolveMutation.mutate(a.id)}
                      disabled={resolveMutation.isPending}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
