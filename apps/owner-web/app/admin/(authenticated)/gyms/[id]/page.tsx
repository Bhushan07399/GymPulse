"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertOctagon,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Layers,
  MapPin,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Sliders,
  Users,
  X,
} from "lucide-react";
import {
  getAdminGymDetail,
  suspendGym,
  reactivateGym,
  extendGymTrial,
  changeGymSubscription,
  adjustGymLocationLimit,
  type GymDetailData,
} from "@/src/services/admin.service";

export default function AdminGymDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gymId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modals state
  const [activeModal, setActiveModal] = useState<
    "suspend" | "reactivate" | "extend_trial" | "change_plan" | "adjust_locations" | null
  >(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [reactivateNotes, setReactivateNotes] = useState("");
  const [extendDays, setExtendDays] = useState(14);
  const [extendReason, setExtendReason] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO");
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly");
  const [changePlanReason, setChangePlanReason] = useState("");
  const [maxLocationsInput, setMaxLocationsInput] = useState(1);
  const [adjustLocationsReason, setAdjustLocationsReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<GymDetailData>({
    queryKey: ["admin", "gym", gymId],
    queryFn: () => getAdminGymDetail(gymId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "gym", gymId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "gyms"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    setActiveModal(null);
    setActionError(null);
  };

  const suspendMutation = useMutation({
    mutationFn: () => suspendGym(gymId, suspendReason.trim()),
    onSuccess: () => invalidate(),
    onError: (err: any) => setActionError(err?.response?.data?.error?.message || "Failed to suspend gym"),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateGym(gymId, reactivateNotes.trim()),
    onSuccess: () => invalidate(),
    onError: (err: any) => setActionError(err?.response?.data?.error?.message || "Failed to reactivate gym"),
  });

  const extendTrialMutation = useMutation({
    mutationFn: () => extendGymTrial(gymId, Number(extendDays), extendReason.trim()),
    onSuccess: () => invalidate(),
    onError: (err: any) => setActionError(err?.response?.data?.error?.message || "Failed to extend trial"),
  });

  const changePlanMutation = useMutation({
    mutationFn: () =>
      changeGymSubscription(
        gymId,
        {
          subscriptionPlan: selectedPlan,
          billingCycle: selectedCycle,
        },
        changePlanReason.trim()
      ),
    onSuccess: () => invalidate(),
    onError: (err: any) => setActionError(err?.response?.data?.error?.message || "Failed to change subscription"),
  });

  const adjustLocationsMutation = useMutation({
    mutationFn: () =>
      adjustGymLocationLimit(gymId, Number(maxLocationsInput), adjustLocationsReason.trim()),
    onSuccess: () => invalidate(),
    onError: (err: any) => setActionError(err?.response?.data?.error?.message || "Failed to adjust locations"),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-slate-400">Loading gym tenant profile...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.gym) {
    return (
      <div className="rounded-2xl border border-rose-800/40 bg-rose-950/20 p-8 text-center">
        <AlertOctagon className="mx-auto h-8 w-8 text-rose-400" />
        <h3 className="mt-3 text-base font-bold text-white">Gym not found or inaccessible</h3>
        <p className="mt-1 text-xs text-slate-400">The requested tenant ID could not be loaded.</p>
        <Link
          href="/admin/gyms"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Gyms Directory
        </Link>
      </div>
    );
  }

  const { gym, owner, members, whatsappMonthly, recentAuditHistory = [] } = data;

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/gyms"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white">{gym.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  gym.subscriptionStatus === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : gym.subscriptionStatus === "TRIAL"
                    ? "bg-blue-500/20 text-blue-400"
                    : gym.subscriptionStatus === "SUSPENDED"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {gym.subscriptionStatus}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              ID: {gym.id}
            </p>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {gym.subscriptionStatus === "SUSPENDED" ? (
            <button
              onClick={() => {
                setReactivateNotes("");
                setActionError(null);
                setActiveModal("reactivate");
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Reactivate Gym
            </button>
          ) : (
            <button
              onClick={() => {
                setSuspendReason("");
                setActionError(null);
                setActiveModal("suspend");
              }}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600/20 border border-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-600/30 transition-colors"
            >
              <PauseCircle className="h-4 w-4" />
              Suspend Gym
            </button>
          )}

          <button
            onClick={() => {
              setExtendDays(14);
              setExtendReason("");
              setActionError(null);
              setActiveModal("extend_trial");
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <Clock className="h-4 w-4 text-blue-400" />
            Extend Trial
          </button>

          <button
            onClick={() => {
              setSelectedPlan((gym.subscriptionPlan as any) || "PRO");
              setSelectedCycle((gym.billingCycle as any) || "monthly");
              setChangePlanReason("");
              setActionError(null);
              setActiveModal("change_plan");
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <CreditCard className="h-4 w-4 text-emerald-400" />
            Change Plan
          </button>

          <button
            onClick={() => {
              setMaxLocationsInput(gym.maxLocations || 1);
              setAdjustLocationsReason("");
              setActionError(null);
              setActiveModal("adjust_locations");
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <Sliders className="h-4 w-4 text-purple-400" />
            Adjust Locations
          </button>
        </div>
      </div>

      {/* Grid: Details, Subscription, Usage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Building2 className="h-4 w-4 text-emerald-400" />
            Organization Profile
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Owner Name:</span>
              <div className="font-bold text-white">
                {owner ? `${owner.first_name} ${owner.last_name || ""}`.trim() : gym.ownerName || "—"}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Owner Phone (Masked):</span>
              <div className="font-mono font-semibold text-slate-200">
                {owner?.phone
                  ? `${owner.phone.slice(0, 4)}••••${owner.phone.slice(-3)}`
                  : gym.phone
                  ? `${gym.phone.slice(0, 4)}••••${gym.phone.slice(-3)}`
                  : "—"}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Owner Email:</span>
              <div className="font-medium text-slate-300">{owner?.email || gym.email || "—"}</div>
            </div>
            <div>
              <span className="text-slate-400">Address / City:</span>
              <div className="font-medium text-slate-300">
                {[gym.address, gym.city, gym.state, gym.pincode].filter(Boolean).join(", ") || "—"}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Platform Onboarding Date:</span>
              <div className="font-medium text-slate-300">
                {new Date(gym.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <CreditCard className="h-4 w-4 text-teal-400" />
            Subscription State
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Current Plan &amp; Cycle:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded bg-slate-800 px-2.5 py-1 font-bold text-white">
                  {gym.subscriptionPlan}
                </span>
                <span className="text-slate-400 font-semibold uppercase">{gym.billingCycle}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400">Trial Expiration:</span>
              <div className="font-medium text-slate-200">
                {gym.trialEndsAt ? new Date(gym.trialEndsAt).toLocaleDateString() : "No active trial"}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Current Billing Period Ends:</span>
              <div className="font-medium text-slate-200">
                {gym.subscriptionEndDate
                  ? new Date(gym.subscriptionEndDate).toLocaleDateString()
                  : "Continuous / None"}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Max Locations Entitlement:</span>
              <div className="font-bold text-emerald-400">{gym.maxLocations} Locations</div>
            </div>
          </div>
        </div>

        {/* Usage Telemetry */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <MessageSquare className="h-4 w-4 text-sky-400" />
            Tenant Telemetry &amp; Usage
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Members</div>
              <div className="mt-1 text-lg font-black text-white">{members?.total || gym.memberCount || 0}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Active Members</div>
              <div className="mt-1 text-lg font-black text-white">{members?.active || 0}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">WhatsApp (Month)</div>
              <div className="mt-1 text-lg font-black text-sky-400">{whatsappMonthly?.totalMessages || 0}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Delivered msgs</div>
              <div className="mt-1 text-lg font-black text-emerald-400">{whatsappMonthly?.delivered || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Timeline & Audit History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Recent Audit &amp; Operational Events
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Audit record of administrative changes made on this tenant.
            </p>
          </div>
          <History className="h-4 w-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {recentAuditHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No recent administrative changes recorded on this gym.
                  </td>
                </tr>
              ) : (
                recentAuditHistory.map((hist) => (
                  <tr key={hist.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(hist.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {hist.admin_email || "Super Admin"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                        {hist.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{hist.reason || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Suspend Modal */}
      {activeModal === "suspend" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-400">Suspend Gym Tenant</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Suspending this gym immediately disables access for all staff and members. An immutable audit log entry will be created.
            </p>

            {actionError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                {actionError}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Suspension (Required)
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Non-payment, violation of terms, tenant requested hold"
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => suspendMutation.mutate()}
                disabled={!suspendReason.trim() || suspendMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {suspendMutation.isPending ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Reactivate Modal */}
      {activeModal === "reactivate" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-emerald-400">Reactivate Gym Tenant</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Restores full active status to this gym organization and resumes member check-ins.
            </p>

            {actionError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                {actionError}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reactivation Reason / Notes
              </label>
              <input
                type="text"
                value={reactivateNotes}
                onChange={(e) => setReactivateNotes(e.target.value)}
                placeholder="e.g. Payment resolved via wire transfer"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => reactivateMutation.mutate()}
                disabled={reactivateMutation.isPending}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {reactivateMutation.isPending ? "Reactivating..." : "Confirm Reactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Extend Trial Modal */}
      {activeModal === "extend_trial" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-blue-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-blue-400">Extend Trial Period</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Grants additional trial days starting from the current trial expiry or from today if already expired.
            </p>

            {actionError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                {actionError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Additional Days
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Extension
                </label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Tenant onboarding delay requested by sales"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => extendTrialMutation.mutate()}
                disabled={extendDays <= 0 || extendTrialMutation.isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {extendTrialMutation.isPending ? "Extending..." : "Extend Trial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Change Plan Modal */}
      {activeModal === "change_plan" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-emerald-400">Change Subscription Plan</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Overrides the active subscription plan and updates platform MRR calculations.
            </p>

            {actionError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                {actionError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="STARTER">STARTER</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Cycle</label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="monthly">monthly</option>
                  <option value="yearly">yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={changePlanReason}
                  onChange={(e) => setChangePlanReason(e.target.value)}
                  placeholder="e.g. Direct wire payment received for Enterprise annual"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => changePlanMutation.mutate()}
                disabled={changePlanMutation.isPending}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {changePlanMutation.isPending ? "Updating..." : "Confirm Plan Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Adjust Locations Modal */}
      {activeModal === "adjust_locations" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-purple-400">Adjust Max Locations Entitlement</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Modifies the maximum physical locations/branches this tenant can create.
            </p>

            {actionError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                {actionError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Allowed Locations
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxLocationsInput}
                  onChange={(e) => setMaxLocationsInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustLocationsReason}
                  onChange={(e) => setAdjustLocationsReason(e.target.value)}
                  placeholder="e.g. Second franchise branch approved"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => adjustLocationsMutation.mutate()}
                disabled={maxLocationsInput < 1 || adjustLocationsMutation.isPending}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {adjustLocationsMutation.isPending ? "Saving..." : "Save Locations Limit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
