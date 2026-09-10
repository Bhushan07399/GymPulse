"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAdminDashboard, type DashboardData } from "@/src/services/admin.service";

export default function AdminDashboardPage() {
  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<DashboardData>({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-slate-400">
            Loading Control Center Overview...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="rounded-2xl border border-rose-800/40 bg-rose-950/20 p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
        <h3 className="mt-3 text-base font-bold text-white">Failed to load platform summary</h3>
        <p className="mt-1 text-xs text-slate-400">
          An error occurred communicating with the Super Admin API.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const { primaryMetrics, businessMetrics, operations, systemHealth, trends } = dashboard;

  const waTotal = operations?.whatsAppMessagesThisMonth || 0;
  const waFailed = operations?.whatsAppFailedMessages || 0;
  const waDeliveryRate = waTotal > 0 ? Math.max(0, Math.round(((waTotal - waFailed) / waTotal) * 100)) : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Platform Operations &amp; Intelligence
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time portfolio pulse, recurring revenues, and multi-tenant telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/gyms"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
          >
            View All Gyms
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* System Health Truthful Alert Banner */}
      <div
        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          systemHealth?.database?.status === "CONNECTED"
            ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-300"
            : "border-amber-500/30 bg-amber-950/30 text-amber-300"
        }`}
      >
        <div className="flex items-center gap-3">
          {systemHealth?.database?.status === "CONNECTED" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              System Telemetry Status: {systemHealth?.database?.status === "CONNECTED" ? "OPERATIONAL" : "DEGRADED"}
            </div>
            <div className="text-[11px] text-slate-400">
              API: {systemHealth?.api?.status || "UP"} &bull; Database: {systemHealth?.database?.status || "CONNECTED"} ({systemHealth?.database?.latencyMs || 0}ms) &bull; Background: {systemHealth?.backgroundTasks?.status || "ACTIVE"}
            </div>
          </div>
        </div>
        <Link
          href="/admin/system-health"
          className="shrink-0 text-xs font-semibold underline underline-offset-4 hover:text-white"
        >
          Inspect Health Center &rarr;
        </Link>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Gyms</span>
            <Building2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            {primaryMetrics?.totalGyms || 0}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-emerald-400">{primaryMetrics?.activeGyms || 0} Active</span>
            <span className="text-slate-600">&bull;</span>
            <span className="font-medium text-amber-400">{primaryMetrics?.trialGyms || 0} Trial</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Run Rate</span>
            <TrendingUp className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            ₹{(businessMetrics?.mrr || 0).toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            ARR: ₹{(businessMetrics?.arr || 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">WhatsApp 30d Delivery</span>
            <MessageSquare className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            {waDeliveryRate}%
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400">{(waTotal - waFailed).toLocaleString()} delivered</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-rose-400">{waFailed.toLocaleString()} failed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-white">
            {operations?.activeAlerts || 0}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            {(operations?.urgentAlerts || 0) > 0 ? (
              <span className="font-semibold text-rose-400">{operations.urgentAlerts} Urgent/Critical</span>
            ) : (
              <span className="text-emerald-400">0 Critical Alerts</span>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suspended Gyms</div>
          <div className="mt-1 text-xl font-bold text-rose-400">{primaryMetrics?.suspendedGyms || 0}</div>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expired Gyms</div>
          <div className="mt-1 text-xl font-bold text-amber-400">{primaryMetrics?.expiredGyms || 0}</div>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Branches / Locations</div>
          <div className="mt-1 text-xl font-bold text-slate-200">{primaryMetrics?.totalLocations || 0}</div>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered Members</div>
          <div className="mt-1 text-xl font-bold text-slate-200">{(primaryMetrics?.totalMembers || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Operational Shortcuts */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href="/admin/revenue"
          className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="mt-3 text-sm font-bold text-white">Revenue &amp; MRR</div>
          <div className="text-[11px] text-slate-400">Platform ARR, MRR, cycle analytics</div>
        </Link>

        <Link
          href="/admin/usage-costs"
          className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-teal-400">
            <BarChart3 className="h-5 w-5" />
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="mt-3 text-sm font-bold text-white">Usage &amp; Unit Costs</div>
          <div className="text-[11px] text-slate-400">Per-gym WhatsApp and gross margin</div>
        </Link>

        <Link
          href="/admin/whatsapp"
          className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-sky-400">
            <MessageSquare className="h-5 w-5" />
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="mt-3 text-sm font-bold text-white">WhatsApp Logs</div>
          <div className="text-[11px] text-slate-400">Delivery status &amp; provider intelligence</div>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="group rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-400">
            <Activity className="h-5 w-5" />
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="mt-3 text-sm font-bold text-white">Audit Logs</div>
          <div className="text-[11px] text-slate-400">Immutable admin operator events</div>
        </Link>
      </div>
    </div>
  );
}
