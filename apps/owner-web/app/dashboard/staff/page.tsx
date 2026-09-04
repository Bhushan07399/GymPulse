"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Edit3,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  createStaff,
  deleteStaff,
  listStaff,
  resetStaffPassword,
  updateStaff,
  updateStaffStatus,
} from "@/src/services/staff.service";
import { PlanLockedState } from "@/src/components/common/plan-locked-state";
import type { CreateStaffInput, StaffMember, UpdateStaffInput } from "@/src/types/staff";

export default function StaffManagementPage() {
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [resetPasswordStaff, setResetPasswordStaff] = useState<StaffMember | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff-list", search],
    queryFn: () => listStaff({ search }),
  });

  const isLocked = (error as any)?.response?.data?.error?.code === "FEATURE_LOCKED" || (error as any)?.response?.status === 403;

  if (isLocked) {
    return <PlanLockedState featureName="Staff Management & Reception Roles" requiredPlan="Pro" actionText="Upgrade to Pro Plan" />;
  }

  const staffList = data?.staff ?? [];
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const receptionistsCount = staffList.filter((s) => s.role === "Receptionist").length;

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateStaffStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      setActionSuccessMsg("Staff status updated successfully.");
      setTimeout(() => setActionSuccessMsg(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      setActionSuccessMsg("Staff member deleted successfully.");
      setTimeout(() => setActionSuccessMsg(null), 3000);
    },
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
              OWNER MANAGEMENT PORTAL
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Staff Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Create receptionist accounts, manage access roles, and update passwords.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Receptionist
          </button>
        </div>

        {actionSuccessMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Staff Summary Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Staff</span>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalStaff}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Staff</span>
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">{activeStaff}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Receptionists</span>
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-600">{receptionistsCount}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Staff Name</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading staff records...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No staff records found. Click &quot;Add Receptionist&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  staffList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-bold text-xs text-white">
                            {item.firstName[0]}
                            {item.lastName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {item.firstName} {item.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Joined {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-900 font-semibold">{item.email}</td>
                      <td className="px-4 py-3.5">{item.phone}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase ${
                            item.role === "Owner"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({ id: item.id, isActive: !item.isActive })
                          }
                          disabled={item.role === "Owner"}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px] transition-colors ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                          } disabled:opacity-50`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingStaff(item)}
                            className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Edit Staff"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setResetPasswordStaff(item)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          {item.role !== "Owner" && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${item.firstName}?`)) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Staff"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Staff Modal */}
        {isAddModalOpen && <AddStaffModal onClose={() => setIsAddModalOpen(false)} />}

        {/* Edit Staff Modal */}
        {editingStaff && (
          <EditStaffModal staff={editingStaff} onClose={() => setEditingStaff(null)} />
        )}

        {/* Reset Password Modal */}
        {resetPasswordStaff && (
          <ResetPasswordModal
            staff={resetPasswordStaff}
            onClose={() => setResetPasswordStaff(null)}
          />
        )}
      </div>
  );
}

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateStaffInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "Receptionist",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ?? err?.message ?? "Failed to create staff account."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Add Receptionist Account</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">First Name</label>
              <input
                type="text"
                placeholder="Sarah"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
              <input
                type="text"
                placeholder="Connor"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="sarah@gympulse.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Login Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Access Role</label>
            <select
              value={form.role}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-semibold text-slate-700 cursor-not-allowed"
            >
              <option value="Receptionist">Receptionist (Front Desk Access)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-xs text-white hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {mutation.isPending ? "Creating Account..." : "Create Staff Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditStaffModal({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  const [form, setForm] = useState<UpdateStaffInput>({
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email,
    phone: staff.phone,
    role: "Receptionist",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: UpdateStaffInput) => updateStaff(staff.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ?? err?.message ?? "Failed to update staff account."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Edit Staff Account</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-xs text-white hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (pwd: string) => resetStaffPassword(staff.id, pwd),
    onSuccess: () => {
      setSuccessMsg("Password reset successfully!");
      setTimeout(() => onClose(), 1500);
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ?? err?.message ?? "Failed to reset password."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    mutation.mutate(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">
            Reset Password: {staff.firstName}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {errorMsg}
          </p>
        )}

        {successMsg && (
          <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            {successMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-xs text-white hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {mutation.isPending ? "Resetting Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
