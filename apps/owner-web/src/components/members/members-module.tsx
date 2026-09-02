"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, ChevronDown, CreditCard, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, Trash2, UserMinus } from "lucide-react";

import {
  createMember,
  deleteMember,
  listMembers,
  updateMember,
} from "@/src/services/members.service";
import { listActiveMembershipPlans } from "@/src/services/membership-plans.service";
import type { Member, MemberInput, MembershipPlan } from "@/src/types/member";
import { getApiErrorMessage } from "@/src/utils/get-api-error-message";

const memberSchema = z.object({
  membershipPlanId: z.string().uuid("Choose a membership plan."),
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
  dateOfBirth: z.string().optional().or(z.literal("")),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  email: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  joinDate: z.string().date("Use a valid date."),
  expiryDate: z.string(),
  isActive: z.boolean(),
  // Initial Payment fields
  paymentStatus: z.enum(["Paid", "Partial", "Unpaid"]),
  amountPaid: z.number().min(0).optional(),
  paymentMethod: z.enum(["Cash", "UPI", "Card", "Bank Transfer"]),
});

type MemberFormValues = z.infer<typeof memberSchema>;

const inputClassName =
  "mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#1E293B] focus:ring-2 focus:ring-slate-200";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

function memberToFormValues(member?: Member): MemberFormValues {
  return {
    membershipPlanId: member?.membershipPlanId ?? "",
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    gender: member?.gender ?? "Male",
    dateOfBirth: member?.dateOfBirth ? new Date(member.dateOfBirth).toISOString().slice(0, 10) : "",
    phone: member?.phone ?? "",
    email: member?.email ?? "",
    emergencyContact: member?.emergencyContact ?? "",
    address: member?.address ?? "",
    joinDate: member?.joinDate ? new Date(member.joinDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    expiryDate: member?.expiryDate ? new Date(member.expiryDate).toISOString().slice(0, 10) : "",
    isActive: member?.isActive ?? true,
    paymentStatus: "Paid",
    amountPaid: undefined,
    paymentMethod: "Cash",
  };
}

function MemberFormModal({
  member,
  plans,
  isSaving,
  onClose,
  onSubmit,
}: {
  member: Member | null;
  plans: MembershipPlan[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: MemberInput) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: memberToFormValues(member ?? undefined),
  });

  const watchPlanId = watch("membershipPlanId");
  const watchJoinDate = watch("joinDate");
  const watchPaymentStatus = watch("paymentStatus");
  const watchAmountPaid = watch("amountPaid");

  const selectedPlan = plans.find((p) => p.id === watchPlanId);
  const planPrice = selectedPlan ? Number(selectedPlan.price) : 0;

  // Auto-calculate expiry date when plan or join date changes
  useEffect(() => {
    if (selectedPlan && watchJoinDate) {
      const start = new Date(watchJoinDate);
      if (!isNaN(start.getTime())) {
        start.setDate(start.getDate() + Number(selectedPlan.durationInDays));
        const calcExpiry = start.toISOString().slice(0, 10);
        setValue("expiryDate", calcExpiry);
      }
    }
  }, [selectedPlan, watchJoinDate, setValue]);

  // Calculate remaining balance
  let calculatedPaid = 0;
  if (watchPaymentStatus === "Paid") {
    calculatedPaid = planPrice;
  } else if (watchPaymentStatus === "Partial") {
    calculatedPaid = Number(watchAmountPaid || 0);
  } else {
    calculatedPaid = 0;
  }
  const remainingBalance = Math.max(0, planPrice - calculatedPaid);

  const submit = (values: MemberFormValues) => {
    if (!member && values.paymentStatus === "Partial") {
      if (!values.amountPaid || values.amountPaid <= 0 || values.amountPaid >= planPrice) {
        toast.error(`Partial payment amount must be between ₹1 and ₹${planPrice - 1}`);
        return;
      }
    }

    onSubmit({
      membershipPlanId: values.membershipPlanId,
      firstName: values.firstName,
      lastName: values.lastName,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth || undefined,
      phone: values.phone,
      email: values.email || undefined,
      emergencyContact: values.emergencyContact || undefined,
      address: values.address || undefined,
      joinDate: values.joinDate,
      expiryDate: values.expiryDate || undefined,
      isActive: values.isActive,
      paymentStatus: values.paymentStatus,
      amountPaid: calculatedPaid,
      paymentMethod: values.paymentMethod,
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-zinc-950/50 p-0 sm:items-center sm:justify-center sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:max-w-3xl sm:rounded-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              {member ? "Edit Member Details" : "Add New Gym Member"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Member profile, plan selection, and initial payment.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
            Close
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-zinc-700">
              First Name *
              <input {...register("firstName")} className={inputClassName} placeholder="Rahul" />
              <FieldError message={errors.firstName?.message} />
            </label>
            <label className="text-xs font-bold text-zinc-700">
              Last Name *
              <input {...register("lastName")} className={inputClassName} placeholder="Patil" />
              <FieldError message={errors.lastName?.message} />
            </label>
            <label className="text-xs font-bold text-zinc-700">
              Phone Number *
              <input {...register("phone")} className={inputClassName} placeholder="9876543210" />
              <FieldError message={errors.phone?.message} />
            </label>
            <label className="text-xs font-bold text-zinc-700">
              Email (Optional)
              <input {...register("email")} type="email" className={inputClassName} placeholder="rahul@gmail.com" />
              <FieldError message={errors.email?.message} />
            </label>

            <label className="text-xs font-bold text-zinc-700">
              Gender *
              <select {...register("gender")} className={inputClassName}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>

            <label className="text-xs font-bold text-zinc-700">
              Date of Birth (Optional)
              <input {...register("dateOfBirth")} type="date" className={inputClassName} />
              <FieldError message={errors.dateOfBirth?.message} />
            </label>

            <label className="text-xs font-bold text-zinc-700">
              Emergency Contact (Optional)
              <input {...register("emergencyContact")} className={inputClassName} placeholder="9876543211" />
            </label>

            <label className="text-xs font-bold text-zinc-700">
              Address (Optional)
              <input {...register("address")} className={inputClassName} placeholder="Street / Area" />
            </label>
          </div>

          {/* Membership Plan & Auto Expiry Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Membership Plan & Duration
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-xs font-bold text-zinc-700">
                Membership Plan *
                <select {...register("membershipPlanId")} className={inputClassName}>
                  <option value="">Select Plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.planName} ({p.durationInDays} Days - ₹{p.price})
                    </option>
                  ))}
                </select>
                <FieldError message={errors.membershipPlanId?.message} />
              </label>

              <label className="text-xs font-bold text-zinc-700">
                Join Date *
                <input {...register("joinDate")} type="date" className={inputClassName} />
                <FieldError message={errors.joinDate?.message} />
              </label>

              <label className="text-xs font-bold text-zinc-700">
                Calculated Expiry Date (Auto)
                <input
                  {...register("expiryDate")}
                  type="date"
                  disabled
                  className={`${inputClassName} bg-slate-200 cursor-not-allowed font-bold text-slate-700`}
                />
                <FieldError message={errors.expiryDate?.message} />
              </label>
            </div>
          </div>

          {/* Initial Payment Section (New Member Only) */}
          {!member && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Initial Membership Payment
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-xs font-bold text-zinc-700">
                  Payment Status *
                  <select {...register("paymentStatus")} className={inputClassName}>
                    <option value="Paid">Fully Paid</option>
                    <option value="Partial">Partially Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </label>

                {watchPaymentStatus === "Partial" && (
                  <label className="text-xs font-bold text-zinc-700">
                    Amount Paid (₹) *
                    <input
                      type="number"
                      placeholder="Enter amount paid"
                      {...register("amountPaid", { valueAsNumber: true })}
                      className={inputClassName}
                    />
                  </label>
                )}

                <label className="text-xs font-bold text-zinc-700">
                  Payment Method *
                  <select {...register("paymentMethod")} className={inputClassName}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </label>
              </div>

              {/* Outstanding Summary Bar */}
              <div className="flex flex-wrap items-center justify-between rounded-xl bg-white p-3 text-xs font-bold border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">Plan Price</span>
                  <span className="text-slate-900 text-sm">₹{planPrice}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Amount Paid</span>
                  <span className="text-emerald-600 text-sm">₹{calculatedPaid}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Outstanding Balance</span>
                  <span className={`text-sm ${remainingBalance > 0 ? "text-red-600" : "text-slate-900"}`}>
                    ₹{remainingBalance}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : member ? "Update Member" : "Register Member & Record Payment"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function MembersModule() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "expired" | "">("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const queryClient = useQueryClient();

  const activeStatusParam = statusFilter === "" ? undefined : statusFilter;

  const membersQuery = useQuery({
    queryKey: ["members", { page, limit: 10, search, status: activeStatusParam }],
    queryFn: () => listMembers({ page, limit: 10, search, status: activeStatusParam }),
  });

  const plansQuery = useQuery({
    queryKey: ["membership-plans", "active"],
    queryFn: listActiveMembershipPlans,
  });

  const saveMutation = useMutation({
    mutationFn: (values: MemberInput) => {
      if (selectedMember) {
        return updateMember(selectedMember.id, values);
      }
      return createMember(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-outstanding"] });
      toast.success(selectedMember ? "Member updated successfully." : "Member created with initial payment.");
      setIsModalOpen(false);
      setSelectedMember(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-outstanding"] });
      toast.success("Member deleted successfully.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const leaveMutation = useMutation({
    mutationFn: ({ id, leftDate }: { id: string; leftDate: string }) =>
      updateMember(id, { isActive: false, leftDate } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      toast.success("Member marked as Left/Cancelled.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const members = membersQuery.data?.members ?? [];
  const plans = plansQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Premium Members Hero Visual Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1576678927484-cc909957088c?q=80&w=1600&auto=format&fit=crop"
            alt="Members Training Background"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-extrabold text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Member Directory & Profiles
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Active Members & Subscriptions</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Manage member profiles, active membership plans, auto-calculated expiry dates, and dues collections.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedMember(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-slate-900 shadow-lg transition hover:bg-slate-100 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add New Member
          </button>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member ID, name, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Members</option>
            <option value="expired">Expired Members</option>
            <option value="inactive">Inactive Members</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Member ID</th>
                <th className="px-4 py-3.5">Member Name</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Join Date</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {membersQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No member records found.
                  </td>
                </tr>
              ) : (
                members.map((m: Member) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">{m.memberId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-4 py-3.5">{m.phone}</td>
                    <td className="px-4 py-3.5">{new Date(m.joinDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5">{new Date(m.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                          m.isActive && new Date(m.expiryDate) >= new Date()
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {m.isActive && new Date(m.expiryDate) >= new Date() ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit member"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const dateStr = prompt(`Mark ${m.firstName} ${m.lastName} as Left/Cancelled. Enter Left Date (YYYY-MM-DD):`, new Date().toISOString().slice(0, 10));
                            if (dateStr) {
                              leaveMutation.mutate({ id: m.id, leftDate: dateStr });
                            }
                          }}
                          className="p-1 text-amber-600 hover:text-amber-800"
                          title="Mark member as Left/Cancelled"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete member ${m.firstName} ${m.lastName} (${m.memberId})?`)) {
                              deleteMutation.mutate(m.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Delete member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {membersQuery.data?.pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 font-semibold">
            <div>
              Showing {members.length > 0 ? (page - 1) * 10 + 1 : 0} to{" "}
              {Math.min(page * 10, membersQuery.data.pagination.total)} of {membersQuery.data.pagination.total} members
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || membersQuery.isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-bold text-slate-900">
                Page {page} of {Math.max(1, membersQuery.data.pagination.totalPages)}
              </span>
              <button
                type="button"
                disabled={page >= membersQuery.data.pagination.totalPages || membersQuery.isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <MemberFormModal
            member={selectedMember}
            plans={plans}
            isSaving={saveMutation.isPending}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedMember(null);
            }}
            onSubmit={(values) => saveMutation.mutate(values)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
