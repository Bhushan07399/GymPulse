"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, CreditCard, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { createMembershipPlan, deleteMembershipPlan, listMembershipPlans, updateMembershipPlan } from "@/src/services/membership-plans.service";
import type { MembershipPlan, MembershipPlanInput } from "@/src/types/member";
import { getApiErrorMessage } from "@/src/utils/get-api-error-message";

const planSchema = z.object({
  planName: z.string().trim().min(1, "Plan name is required.").max(100),
  durationInDays: z.number().int().positive("Duration must be at least one day."),
  price: z.number().min(0, "Price cannot be negative."),
  description: z.string().max(5000, "Description is too long."),
  isActive: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#94A3B8] focus:bg-white focus:ring-4 focus:ring-slate-100";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

function planToValues(plan?: MembershipPlan): PlanFormValues {
  return {
    planName: plan?.planName ?? "",
    durationInDays: plan?.durationInDays ?? 30,
    price: plan?.price ?? 0,
    description: plan?.description ?? "",
    isActive: plan?.isActive ?? true,
  };
}

function PlanModal({
  plan,
  isDuplicate,
  isSaving,
  onClose,
  onSubmit,
}: {
  plan: MembershipPlan | null;
  isDuplicate: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: MembershipPlanInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: planToValues(plan ?? undefined),
  });

  const title = isDuplicate ? "Duplicate membership plan" : plan ? "Edit membership plan" : "Create membership plan";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-[#0F172A]/50 sm:items-center sm:justify-center sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#64748B]">Plan configuration</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#0F172A]">{title}</h2>
            <p className="mt-2 text-sm text-[#64748B]">Set the membership details available to your members.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]">
            Close
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit((values) => onSubmit({ ...values, description: values.description || undefined }))} noValidate>
          <label className="block text-sm font-semibold text-[#334155]">
            Plan name
            <input {...register("planName")} className={inputClassName} />
            <FieldError message={errors.planName?.message} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#334155]">
              Duration (days)
              <input {...register("durationInDays", { valueAsNumber: true })} type="number" min="1" className={inputClassName} />
              <FieldError message={errors.durationInDays?.message} />
            </label>
            <label className="text-sm font-semibold text-[#334155]">
              Price
              <input {...register("price", { valueAsNumber: true })} type="number" min="0" step="0.01" className={inputClassName} />
              <FieldError message={errors.price?.message} />
            </label>
          </div>

          <label className="block text-sm font-semibold text-[#334155]">
            Description <span className="font-normal text-[#94A3B8]">(optional)</span>
            <textarea {...register("description")} rows={3} className={inputClassName} />
            <FieldError message={errors.description?.message} />
          </label>

          <label className="flex items-center gap-2.5 text-sm font-semibold text-[#334155]">
            <input {...register("isActive")} type="checkbox" className="size-4 accent-[#334155]" /> Active plan
          </label>

          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-5">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9]">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E293B] disabled:opacity-60">
              {isSaving ? "Saving..." : isDuplicate ? "Create duplicate" : plan ? "Save changes" : "Create plan"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteDialog({ plan, isDeleting, onCancel, onConfirm }: { plan: MembershipPlan; isDeleting: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-6">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-[#0F172A]">Delete membership plan?</h2>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">{plan.planName} will no longer be available for new members.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {isDeleting ? "Deleting..." : "Delete plan"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MembershipPlansModule() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);

  const plansQuery = useQuery({
    queryKey: ["membership-plans", search, page],
    queryFn: () => listMembershipPlans({ search: search || undefined, page, limit: 12 }),
  });

  const invalidatePlans = () => queryClient.invalidateQueries({ queryKey: ["membership-plans"] });

  const saveMutation = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: MembershipPlanInput }) =>
      id ? updateMembershipPlan(id, values) : createMembershipPlan(values),
    onSuccess: (_plan, variables) => {
      toast.success(variables.id ? "Membership plan updated successfully." : "Membership plan created successfully.");
      setIsFormOpen(false);
      setSelectedPlan(null);
      setIsDuplicate(false);
      invalidatePlans();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMembershipPlan,
    onSuccess: () => {
      toast.success("Membership plan deleted successfully.");
      setPlanToDelete(null);
      invalidatePlans();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const plans = plansQuery.data?.membershipPlans ?? [];
  const pagination = plansQuery.data?.pagination;
  const activePlans = plans.filter((plan) => plan.isActive);
  const averagePrice = plans.length ? plans.reduce((total, plan) => total + Number(plan.price), 0) / plans.length : 0;

  const openCreate = () => {
    setSelectedPlan(null);
    setIsDuplicate(false);
    setIsFormOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setIsDuplicate(false);
    setIsFormOpen(true);
  };

  const openDuplicate = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setIsDuplicate(true);
    setIsFormOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mx-auto max-w-7xl space-y-6">
      {/* Premium Membership Plans Hero Visual Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop"
            alt="Gym Training Background"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-extrabold text-amber-300 border border-amber-400/30 uppercase tracking-wider">
              Plan Configuration & Tier Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gym & Class Membership Plans</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Configure Growth, Pro, and Gym + Classes plan pricing, durations, and allowed features.
            </p>
          </div>

          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-slate-900 shadow-lg transition hover:bg-slate-100 shrink-0">
            <Plus className="size-4" /> Create Plan
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.025)] sm:p-5">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search membership plans"
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-9 pr-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#94A3B8] focus:bg-white focus:ring-4 focus:ring-slate-100"
            aria-label="Search membership plans"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total plans", value: pagination?.total ?? "—", note: "Across your gym", icon: CreditCard },
          { label: "Active plans", value: activePlans.length, note: "In current results", icon: Check },
          { label: "Average plan price", value: plans.length ? formatMoney(averagePrice) : "—", note: "Based on current results", icon: Sparkles },
          { label: "Members enrolled", value: "—", note: "Enrollment insights coming soon", icon: Users },
        ].map(({ label, value, note, icon: Icon }) => (
          <motion.article key={label} whileHover={{ y: -3 }} transition={{ duration: 0.18 }} className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)] transition-shadow hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
            <span className="grid size-10 place-items-center rounded-xl bg-[#F1F5F9] text-[#475569] transition-colors group-hover:bg-[#E2E8F0]">
              <Icon className="size-5" strokeWidth={1.8} />
            </span>
            <p className="mt-5 text-sm font-medium text-[#64748B]">{label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#0F172A]">{value}</p>
            <p className="mt-2 text-xs font-medium text-[#94A3B8]">{note}</p>
          </motion.article>
        ))}
      </section>

      {plansQuery.isLoading ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
          ))}
        </section>
      ) : plansQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-600">{getApiErrorMessage(plansQuery.error)}</div>
      ) : plans.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-16 text-center shadow-[0_2px_5px_rgba(15,23,42,0.025)]">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#F1F5F9] text-[#475569]">
            <CreditCard className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-[#0F172A]">Create your first membership plan</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">Set up a clear membership offering and start enrolling members with confidence.</p>
          <button type="button" onClick={openCreate} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B]">
            <Plus className="size-4" /> Create first plan
          </button>
        </section>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <motion.article key={plan.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="group flex min-h-80 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)] transition-shadow hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#0F172A]">{plan.planName}</h2>
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0F172A]">{formatMoney(Number(plan.price))}</p>
                    <p className="mt-1 text-sm text-[#64748B]">for {plan.durationInDays} days</p>
                  </div>
                  <details className="relative">
                    <summary className="list-none rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]">
                      <MoreHorizontal className="size-5" />
                    </summary>
                    <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-xl">
                      <button type="button" onClick={() => openEdit(plan)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]">
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button type="button" onClick={() => openDuplicate(plan)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]">
                        <Copy className="size-3.5" /> Duplicate
                      </button>
                      <button type="button" onClick={() => setPlanToDelete(plan)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                        <Trash2 className="size-3.5" /> Delete
                      </button>
                    </div>
                  </details>
                </div>

                <p className="mt-5 min-h-10 text-sm leading-6 text-[#64748B]">{plan.description || "A flexible membership plan ready to be tailored to your members."}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${plan.isActive ? "bg-[#EEF2FF] text-[#4338CA]" : "bg-[#F1F5F9] text-[#475569]"}`}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-xs font-semibold text-[#475569]">Plan Capabilities</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#64748B]">
                    <span>Recommended plan</span>
                    <span>Color label</span>
                    <span>WhatsApp compatible</span>
                    <span>Auto renewal</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-[#E2E8F0] pt-4 text-xs text-[#94A3B8]">
                  <span>Created {formatDate(plan.createdAt)}</span>
                  <button type="button" onClick={() => openEdit(plan)} className="inline-flex items-center gap-1 font-semibold text-[#475569] hover:text-[#0F172A]">
                    <Pencil className="size-3" /> Edit
                  </button>
                </div>
              </motion.article>
            ))}
          </section>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 font-semibold shadow-sm">
              <div>
                Showing page {page} of {pagination.totalPages} ({pagination.total} total plans)
              </div>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1 || plansQuery.isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm">
                  Previous
                </button>
                <span className="px-2 font-mono font-bold text-slate-900">
                  Page {page} of {pagination.totalPages}
                </span>
                <button type="button" disabled={page >= pagination.totalPages || plansQuery.isLoading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {isFormOpen && (
          <PlanModal
            key={`${selectedPlan?.id ?? "new"}-${isDuplicate}`}
            plan={selectedPlan}
            isDuplicate={isDuplicate}
            isSaving={saveMutation.isPending}
            onClose={() => setIsFormOpen(false)}
            onSubmit={(values) => saveMutation.mutate({ id: isDuplicate ? undefined : selectedPlan?.id, values })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {planToDelete && (
          <DeleteDialog
            plan={planToDelete}
            isDeleting={deleteMutation.isPending}
            onCancel={() => setPlanToDelete(null)}
            onConfirm={() => deleteMutation.mutate(planToDelete.id)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
