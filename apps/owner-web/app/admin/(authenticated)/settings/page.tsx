"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  DollarSign,
  Lock,
  Mail,
  PlusCircle,
  RefreshCw,
  Settings,
  Shield,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import {
  getAdminSettings,
  saveWhatsAppCostRule,
  createSuperAdminUser,
  toggleAdminUserStatus,
  type PlatformSettingsData,
  type WhatsAppCostRule,
} from "@/src/services/admin.service";

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  // WhatsApp Cost Rule State
  const [costPerMessage, setCostPerMessage] = useState("");
  const [costRuleNotes, setCostRuleNotes] = useState("");
  const [costRuleSuccess, setCostRuleSuccess] = useState(false);
  const [costRuleError, setCostRuleError] = useState<string | null>(null);

  // New Admin Modal State
  const [isNewAdminOpen, setIsNewAdminOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminError, setNewAdminError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PlatformSettingsData>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await getAdminSettings();
      if (res?.costRules?.[0]?.unitCost) {
        setCostPerMessage(String(res.costRules[0].unitCost));
      }
      return res;
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: () =>
      saveWhatsAppCostRule({
        provider: "META",
        countryCode: "91",
        category: "UTILITY",
        unitCost: parseFloat(costPerMessage),
        currency: "INR",
        notes: costRuleNotes.trim() || undefined,
        isActive: true,
      }),
    onSuccess: () => {
      setCostRuleSuccess(true);
      setCostRuleError(null);
      setTimeout(() => setCostRuleSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "usage-costs"] });
    },
    onError: (err: any) => {
      setCostRuleError(err?.response?.data?.error?.message || "Failed to update cost rules");
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: () =>
      createSuperAdminUser({
        email: newEmail.trim(),
        name: newName.trim(),
        password: newPassword,
        role: "SUPER_ADMIN",
      }),
    onSuccess: () => {
      setIsNewAdminOpen(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewAdminError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (err: any) => {
      setNewAdminError(err?.response?.data?.error?.message || "Failed to create super admin");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleAdminUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-medium tracking-wide text-slate-400">Loading system parameters...</p>
        </div>
      </div>
    );
  }

  const costRules = data?.costRules || [];
  const adminUsers = data?.admins || [];
  const activeCostRule = costRules[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Platform Settings &amp; Governance
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Configure WhatsApp variable unit economics and manage authorized Super Admin accounts.
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

      {/* 1. WhatsApp Unit Economics Configuration */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                WhatsApp Unit Cost Model (INR)
              </h2>
              <p className="text-xs text-slate-400">
                Determines per-message cost charged against gym gross contribution margins.
              </p>
            </div>
          </div>
          {activeCostRule && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              Active Rule: ₹{Number(activeCostRule.unitCost).toFixed(4)} / msg
            </span>
          )}
        </div>

        {costRuleSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Unit cost rule successfully updated across platform analytics.</span>
          </div>
        )}

        {costRuleError && (
          <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
            {costRuleError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Unit Cost Per Delivered / Sent Message (₹ INR)
            </label>
            <input
              type="number"
              step="0.0001"
              value={costPerMessage}
              onChange={(e) => setCostPerMessage(e.target.value)}
              placeholder="0.1200"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Standard Indian WhatsApp business utility conversation rate is ~₹0.12 / message.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Audit Notes for Rate Adjustment
            </label>
            <input
              type="text"
              value={costRuleNotes}
              onChange={(e) => setCostRuleNotes(e.target.value)}
              placeholder="e.g. Meta provider price revision Q3"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => updateCostMutation.mutate()}
            disabled={!costPerMessage || parseFloat(costPerMessage) < 0 || updateCostMutation.isPending}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {updateCostMutation.isPending ? "Updating Rule..." : "Save Cost Rule"}
          </button>
        </div>
      </div>

      {/* 2. Super Admin User Directory & Access Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Super Admin Access Governance
              </h2>
              <p className="text-xs text-slate-400">
                Operators granted access to the OBO internal control center.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewAdminError(null);
              setIsNewAdminOpen(true);
            }}
            className="flex items-center gap-1.5 self-start rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Super Admin
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Admin Operator</th>
                <th className="px-4 py-3.5">Email Address</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {adminUsers.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white">{admin.name}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{admin.email}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        admin.isActive !== false
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {admin.isActive !== false ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">
                    {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({ id: admin.id, isActive: admin.isActive === false })
                      }
                      disabled={toggleStatusMutation.isPending}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        admin.isActive !== false
                          ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {admin.isActive !== false ? (
                        <>
                          <UserX className="h-3 w-3" /> Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3" /> Activate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Super Admin Modal */}
      {isNewAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Super Admin</h3>
              <button onClick={() => setIsNewAdminOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Creates a new high-privilege administrative operator account.
            </p>

            {newAdminError && (
              <div className="mt-3 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                {newAdminError}
              </div>
            )}

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin.jane@obo.fit"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsNewAdminOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => createAdminMutation.mutate()}
                disabled={!newEmail.trim() || !newPassword || createAdminMutation.isPending}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
