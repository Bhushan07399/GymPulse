"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CreditCard, FileText, Filter, MoreHorizontal, Plus, ReceiptText, Search, Sparkles, Users, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AUTH_TOKEN_KEY } from "@/src/lib/api-client";
import { listMembershipPlans } from "@/src/services/membership-plans.service";
import { getMember, listMembers } from "@/src/services/members.service";
import { createPayment, getOutstandingPayments, listPayments } from "@/src/services/payments.service";
import type { Member, MembershipPlan } from "@/src/types/member";
import { getApiErrorMessage } from "@/src/utils/get-api-error-message";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));

const safeParseDate = (value: string | Date | null | undefined) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const safeDateFormat = (value: string | Date | null | undefined) => {
  const parsed = safeParseDate(value);
  if (!parsed) return "—";

  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
};

const input = "w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#94A3B8] focus:bg-white focus:ring-4 focus:ring-slate-100";

function PaymentModal({
  onClose,
  members,
  plans,
  memberSearch,
  setMemberSearch,
  selectedMemberId,
  setSelectedMemberId,
  selectedPlanId,
  setSelectedPlanId,
  amount,
  setAmount,
  paymentDate,
  setPaymentDate,
  paymentMethod,
  setPaymentMethod,
  notes,
  setNotes,
}: {
  onClose: () => void;
  members: Member[];
  plans: MembershipPlan[];
  memberSearch: string;
  setMemberSearch: (value: string) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (value: string | null) => void;
  selectedPlanId: string | null;
  setSelectedPlanId: (value: string | null) => void;
  amount: string;
  setAmount: (value: string) => void;
  paymentDate: string;
  setPaymentDate: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
}) {
  const queryClient = useQueryClient();
  const [resolvedMember, setResolvedMember] = useState<Member | null>(null);
  const [memberValidationMessage, setMemberValidationMessage] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => resolvedMember ?? members.find((member) => member.memberId === selectedMemberId) ?? null,
    [members, resolvedMember, selectedMemberId]
  );
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  const memberSuggestions = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return [];
    return members
      .filter((member) => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        return member.memberId.toLowerCase().includes(query) || fullName.includes(query) || member.phone.includes(query);
      })
      .slice(0, 6);
  }, [memberSearch, members]);

  const memberLookupMutation = useMutation({
    mutationFn: async (identifier: string) => getMember(identifier),
    onSuccess: (member) => {
      setResolvedMember(member);
      setSelectedMemberId(member.memberId);
      setMemberValidationMessage(null);

      if (member.membershipPlanId) {
        const plan = plans.find((item) => item.id === member.membershipPlanId);
        if (plan) {
          setSelectedPlanId(plan.id);
          setAmount(String(plan.price));
        } else {
          setSelectedPlanId(null);
          setAmount("");
        }
      } else {
        setSelectedPlanId(null);
        setAmount("");
      }
    },
    onError: (error) => {
      setResolvedMember(null);
      setSelectedMemberId(null);
      setSelectedPlanId(null);
      setAmount("");
      setMemberValidationMessage(getApiErrorMessage(error));
    },
  });

  const paymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-outstanding"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      toast.success("Payment recorded successfully.");
      onClose();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  useEffect(() => {
    if (selectedPlan) {
      setAmount(String(selectedPlan.price));
    }
  }, [selectedPlan?.id, selectedPlan?.price, setAmount]);

  const lookupMember = (identifier: string) => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setResolvedMember(null);
      setSelectedMemberId(null);
      setSelectedPlanId(null);
      setAmount("");
      setMemberValidationMessage("Enter a member ID code to validate registration.");
      return;
    }
    memberLookupMutation.mutate(trimmed);
  };

  const handleSave = () => {
    if (!selectedMemberId || !selectedMember) {
      toast.error("Please validate a valid member.");
      return;
    }
    if (!selectedPlanId || !selectedPlan) {
      toast.error("Please select a membership plan.");
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }

    const nextDueDateObj = safeParseDate(paymentDate) ?? new Date();
    nextDueDateObj.setDate(nextDueDateObj.getDate() + selectedPlan.durationInDays);
    const calculatedNextDueDate = nextDueDateObj.toISOString().slice(0, 10);

    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    let staffId = "00000000-0000-0000-0000-000000000000";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.sub) staffId = payload.sub;
      } catch {
        // Fallback
      }
    }

    const isFullPayment = numericAmount >= Number(selectedPlan.price);
    const pStatus = isFullPayment ? "Paid" : "Pending";

    paymentMutation.mutate({
      memberId: selectedMember.memberId,
      membershipPlanId: selectedPlanId,
      paymentAmount: numericAmount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: numericAmount,
      paymentMethod: paymentMethod as any,
      paymentStatus: pStatus,
      paymentDate,
      nextDueDate: calculatedNextDueDate,
      collectedByStaffId: staffId,
      notes: notes || null,
    });
  };

  const memberStatus = selectedMember ? (selectedMember.isActive ? "Active" : "Inactive") : null;
  const expiryDate = selectedPlan && paymentDate ? (() => {
    const parsedPaymentDate = safeParseDate(paymentDate);
    return parsedPaymentDate ? new Date(parsedPaymentDate.getTime() + selectedPlan.durationInDays * 24 * 60 * 60 * 1000) : null;
  })() : null;
  const summaryAmount = Number(amount || selectedPlan?.price || 0);
  const canSave = Boolean(selectedMemberId && selectedPlanId && amount && paymentDate && !paymentMutation.isPending && !memberLookupMutation.isPending);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-[#0F172A]/55 sm:items-center sm:justify-center sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex shrink-0 justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[#64748B]">New transaction</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Record payment</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#F1F5F9]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="text-sm font-semibold text-[#334155]">
                Member ID / Code
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(event) => {
                      setMemberSearch(event.target.value);
                      if (selectedMemberId) setSelectedMemberId(null);
                      setResolvedMember(null);
                    }}
                    className={input}
                    placeholder="e.g. GP-0001"
                  />
                  <button
                    type="button"
                    onClick={() => lookupMember(memberSearch)}
                    disabled={memberLookupMutation.isPending || !memberSearch.trim()}
                    className="shrink-0 rounded-xl bg-[#0F172A] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-50"
                  >
                    {memberLookupMutation.isPending ? "Validating..." : "Validate"}
                  </button>
                </div>
                {memberValidationMessage && <p className="mt-1 text-xs text-red-600 font-medium">{memberValidationMessage}</p>}

                {memberSuggestions.length > 0 && !selectedMemberId && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 shadow-lg">
                    {memberSuggestions.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(member.memberId);
                          setMemberSearch(member.memberId);
                          lookupMember(member.memberId);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[#334155] transition hover:bg-white"
                      >
                        <span>
                          <span className="block font-semibold">{member.firstName} {member.lastName}</span>
                          <span className="text-xs text-[#64748B]">ID: {member.memberId}</span>
                        </span>
                        <span className="text-xs text-[#64748B]">{member.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </label>

              <label className="text-sm font-semibold text-[#334155]">
                Membership Plan
                <div className="relative mt-2">
                  <select
                    value={selectedPlanId ?? ""}
                    onChange={(event) => {
                      const nextPlanId = event.target.value;
                      setSelectedPlanId(nextPlanId || null);
                      if (nextPlanId) {
                        const nextPlan = plans.find((plan) => plan.id === nextPlanId);
                        if (nextPlan) setAmount(String(nextPlan.price));
                      } else {
                        setAmount("");
                      }
                    }}
                    disabled={plans.length === 0}
                    className={`${input} ${plans.length === 0 ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <option value="">{plans.length > 0 ? "Select a plan" : "No membership plans available"}</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.planName} · {plan.durationInDays} days · ₹{plan.price}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            {selectedMember && (
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">Member summary</p>
                    <p className="mt-1 text-sm font-semibold text-[#0F172A]">{selectedMember.firstName} {selectedMember.lastName}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${memberStatus === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-[#F1F5F9] text-[#475569]"}`}>
                    {memberStatus || "Selected"}
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="text-sm font-semibold text-[#334155]">
                Amount
                <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${input} mt-2`} />
              </label>
              <label className="text-sm font-semibold text-[#334155]">
                Payment Date
                <input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className={`${input} mt-2`} />
              </label>
              <label className="text-sm font-semibold text-[#334155]">
                Payment Method
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={`${input} mt-2`}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-[#334155]">
                Notes
                <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className={`${input} mt-2`} placeholder="Optional remarks" />
              </label>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#64748B]">Payment summary</p>
                  <p className="mt-1 text-sm font-semibold text-[#0F172A]">Fast review before save</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#0F172A]">{money(summaryAmount)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#F1F5F9]">Cancel</button>
            <button type="button" onClick={handleSave} disabled={!canSave} className="rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60">
              {paymentMutation.isPending ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PaymentsModule() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("all");
  const [method, setMethod] = useState("all");
  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "outstanding">("history");

  const paymentsQuery = useQuery({
    queryKey: ["payments", page, status, search, period, customStart, customEnd],
    queryFn: () =>
      listPayments({
        page,
        status: status as any,
        search,
        period,
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      }),
  });

  const outstandingQuery = useQuery({ queryKey: ["payments-outstanding"], queryFn: getOutstandingPayments });
  const membersQuery = useQuery({ queryKey: ["members", "payments"], queryFn: () => listMembers({ page: 1, limit: 100 }) });
  const plansQuery = useQuery({ queryKey: ["membership-plans", "all"], queryFn: () => listMembershipPlans({ page: 1, limit: 100 }) });

  const members = membersQuery.data?.members ?? [];
  const plans = plansQuery.data?.membershipPlans ?? [];
  const memberMap = useMemo(() => new Map(members.map((m) => [m.memberId, m])), [members]);
  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);
  const payments = paymentsQuery.data?.payments ?? [];

  const visible = payments.filter((p) => {
    const m = memberMap.get(p.memberId);
    return (
      (!search || p.memberId.toLowerCase().includes(search.toLowerCase()) || (m && `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()))) &&
      (plan === "all" || p.membershipPlanId === plan) &&
      (method === "all" || p.paymentMethod === method)
    );
  });

  const today = new Date().toISOString().slice(0, 10);
  const summaryData = paymentsQuery.data?.summary;
  const totalRevenue = summaryData?.totalRevenue ?? 0;
  const todaysCollections = summaryData?.todaysCollections ?? 0;

  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");

  const clear = () => {
    setSearch("");
    setStatus("");
    setPlan("all");
    setMethod("all");
    setPeriod("this_month");
    setCustomStart("");
    setCustomEnd("");
    setPage(1);
  };

  const outstandingData = outstandingQuery.data;
  const totalOutstanding = outstandingData?.summary.totalOutstanding ?? 0;
  const pendingMemberCount = outstandingData?.summary.pendingCount ?? 0;

  const handleRecordMemberPayment = (memberIdCode: string, remainingBalance: number) => {
    setSelectedMemberId(memberIdCode);
    setMemberSearch(memberIdCode);
    setAmount(String(remainingBalance));
    setModal(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop"
            alt="Payments Background"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
              Finance & Payment Collections
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Payments, Dues & Receipts</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Collect membership fees, track partial balances, inspect transaction receipts, and view payment logs.
            </p>
          </div>

          <button onClick={() => setModal(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-slate-900 shadow-lg transition hover:bg-slate-100 shrink-0">
            <Plus className="size-4" /> Record Payment
          </button>
        </div>
      </section>

      {/* Date Range / Period Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="size-4 text-slate-500" /> Date Period:
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1.5 text-xs font-bold text-slate-700">
          {[
            { id: "today", label: "Today" },
            { id: "this_week", label: "This Week" },
            { id: "this_month", label: "This Month" },
            { id: "last_month", label: "Last Month" },
            { id: "this_year", label: "This Year" },
            { id: "all", label: "All Time" },
            { id: "custom", label: "Custom" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPeriod(item.id);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                period === item.id ? "bg-slate-900 text-white shadow-sm" : "hover:bg-slate-200/70 text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
          <label className="font-bold text-slate-700 flex items-center gap-2">
            From:
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-900 outline-none"
            />
          </label>
          <label className="font-bold text-slate-700 flex items-center gap-2">
            To:
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-900 outline-none"
            />
          </label>
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Revenue (Selected Period)", value: money(totalRevenue), icon: Wallet },
          { label: "Today's Collections", value: money(todaysCollections), icon: CreditCard },
          { label: "Total Outstanding", value: money(totalOutstanding), icon: ReceiptText, isAmber: true },
          { label: "Pending Members", value: `${pendingMemberCount} Members`, icon: Users },
        ].map(({ label, value, icon: Icon, isAmber }) => (
          <motion.article whileHover={{ y: -3 }} key={label} className={`rounded-2xl border bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)] ${isAmber ? "border-amber-200 bg-amber-50/30" : "border-[#E2E8F0]"}`}>
            <span className={`grid size-10 place-items-center rounded-xl text-[#475569] ${isAmber ? "bg-amber-100 text-amber-800" : "bg-[#F1F5F9]"}`}>
              <Icon className="size-5" />
            </span>
            <p className="mt-5 text-sm font-medium text-[#64748B]">{label}</p>
            <p className={`mt-1 text-3xl font-semibold tracking-[-0.05em] ${isAmber ? "text-amber-900" : ""}`}>
              {paymentsQuery.isLoading || outstandingQuery.isLoading ? "—" : value}
            </p>
          </motion.article>
        ))}
      </section>

      {/* View Toggle Tabs */}
      <div className="flex gap-2 border-b border-[#E2E8F0] pb-2">
        <button onClick={() => setActiveTab("history")} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "history" ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"}`}>
          Transaction History
        </button>
        <button onClick={() => setActiveTab("outstanding")} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "outstanding" ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"}`}>
          Outstanding Balances ({pendingMemberCount})
        </button>
      </div>

      {activeTab === "outstanding" ? (
        <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_5px_rgba(15,23,42,0.025)]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <div>
              <h2 className="font-semibold text-amber-900">Members with Outstanding Balances</h2>
              <p className="mt-1 text-xs text-[#64748B]">Member-wise breakdown of partial payments & pending dues</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              Total Due: {money(totalOutstanding)}
            </span>
          </div>

          {outstandingQuery.isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((x) => (
                <div key={x} className="h-14 animate-pulse rounded-xl bg-[#F1F5F9]" />
              ))}
            </div>
          ) : (outstandingData?.members.length ?? 0) === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Sparkles className="size-7" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-emerald-950">All dues cleared!</h3>
              <p className="mt-1 text-xs text-slate-500">There are no members with pending or partial balances.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>
                    {["Member", "Plan", "Total Plan Amount", "Paid Amount", "Remaining Due", "Last Payment Date", "Membership Expiry", "Action"].map((h) => (
                      <th key={h} className="px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {outstandingData?.members.map((m) => (
                    <tr key={m.id} className="transition hover:bg-[#F8FAFC]">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#0F172A]">{m.fullName}</div>
                        <div className="text-xs text-[#94A3B8] font-mono">{m.memberId} • {m.phone}</div>
                      </td>
                      <td className="px-5 py-4 text-[#475569] font-medium">{m.planName}</td>
                      <td className="px-5 py-4 text-[#475569]">{money(m.totalAmount)}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-600">{money(m.paidAmount)}</td>
                      <td className="px-5 py-4 font-bold text-amber-700">{money(m.remainingAmount)}</td>
                      <td className="px-5 py-4 text-[#475569]">{safeDateFormat(m.lastPaymentDate)}</td>
                      <td className="px-5 py-4 text-[#475569]">{safeDateFormat(m.expiryDate)}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleRecordMemberPayment(m.memberId, m.remainingAmount)}
                          className="rounded-xl bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B] shadow-2xs"
                        >
                          Record Dues
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.025)]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search member name or code" className={`${input} pl-9`} />
              </label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={input}>
                <option value="">Payment Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending / Partial</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className={input}>
                <option value="all">Membership Plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.planName}</option>
                ))}
              </select>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={input}>
                <option value="all">Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
              <button onClick={clear} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9]">
                Clear Filters
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_5px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h2 className="font-semibold">Transaction history</h2>
                <p className="mt-1 text-xs text-[#64748B]">Payments recorded for your gym</p>
              </div>
              <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                {paymentsQuery.data?.pagination.total ?? 0} payments
              </span>
            </div>

            {paymentsQuery.isLoading || membersQuery.isLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((x) => (
                  <div key={x} className="h-14 animate-pulse rounded-xl bg-[#F1F5F9]" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F1F5F9] text-[#475569]">
                  <FileText className="size-7" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">No payments found.</h3>
                <button onClick={() => setModal(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white">
                  <Plus className="size-4" /> Record First Payment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                    <tr>
                      {["Member", "Membership Plan", "Amount Paid", "Payment Date", "Payment Method", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {visible.map((p) => {
                      const m = memberMap.get(p.memberId);
                      return (
                        <tr key={p.id} className="transition hover:bg-[#F8FAFC]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="grid size-9 place-items-center rounded-full bg-[#E2E8F0] text-xs font-bold text-[#475569]">
                                {m ? `${m.firstName[0]}${m.lastName[0]}` : "?"}
                              </span>
                              <div>
                                <p className="font-semibold text-[#0F172A]">{m ? `${m.firstName} ${m.lastName}` : "Unknown member"}</p>
                                <p className="text-xs text-[#94A3B8]">{p.transactionReference || p.memberId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-[#475569]">{planMap.get(p.membershipPlanId)?.planName ?? "—"}</td>
                          <td className="px-5 py-4 font-semibold text-emerald-700">{money(p.totalAmount)}</td>
                          <td className="px-5 py-4 text-[#475569]">{safeDateFormat(p.paymentDate)}</td>
                          <td className="px-5 py-4 text-[#475569]">{p.paymentMethod}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#475569]">
                              {p.paymentStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Payment actions">
                              <MoreHorizontal className="size-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between border-t border-[#E2E8F0] px-5 py-3 text-sm">
              <button disabled={!paymentsQuery.data?.pagination.hasPreviousPage} onClick={() => setPage((p) => p - 1)} className="font-semibold text-[#475569] disabled:opacity-40">
                Previous
              </button>
              <button disabled={!paymentsQuery.data?.pagination.hasNextPage} onClick={() => setPage((p) => p + 1)} className="font-semibold text-[#475569] disabled:opacity-40">
                Next
              </button>
            </div>
          </section>
        </>
      )}

      <AnimatePresence>
        {modal && (
          <PaymentModal
            onClose={() => setModal(false)}
            members={members}
            plans={plans}
            memberSearch={memberSearch}
            setMemberSearch={setMemberSearch}
            selectedMemberId={selectedMemberId}
            setSelectedMemberId={setSelectedMemberId}
            selectedPlanId={selectedPlanId}
            setSelectedPlanId={setSelectedPlanId}
            amount={amount}
            setAmount={setAmount}
            paymentDate={paymentDate}
            setPaymentDate={setPaymentDate}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            notes={notes}
            setNotes={setNotes}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
