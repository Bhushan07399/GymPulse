"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  UserCheck,
  X,
  Zap,
  CreditCard,
  ReceiptText,
  Check,
  AlertCircle,
  QrCode,
  Printer,
  FileText,
  DollarSign,
  ArrowUpDown,
  UserPlus
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getClassKPIs,
  listGymClasses,
  createGymClass,
  updateGymClass,
  deleteGymClass,
  getWeeklySchedule,
  listClassBookings,
  updateClassBookingStatus,
  markClassAttendance,
  getSessionQR,
  listClassSessions,
  listGymClassAttendance,
  type GymClass,
  type ClassScheduleItem,
  type WeeklyScheduleEntry,
  type ClassBookingRecord,
  type ClassSessionRecord,
  type ClassAttendanceRecord
} from "@/src/services/classes.service";

import {
  listClassPlans,
  createClassPlan,
  updateClassPlan,
  deleteClassPlan,
  enrollMemberInClassPlan,
  listAllClassMembers,
  listAllClassPayments,
  softDeleteClassPayment,
  listClassOutstandingDues,
  recordClassDuesPayment,
  getBusinessRevenueOverview,
  type ClassPlan,
  type ClassOutstandingDue,
  type ClassMembership,
  type ClassPaymentRecord,
  type BusinessRevenueOverview
} from "@/src/services/class-plans.service";

import { listMembers } from "@/src/services/members.service";
import { usePathname } from "next/navigation";

const CATEGORIES = [
  "Zumba",
  "Yoga",
  "CrossFit",
  "Dance",
  "Aerobics",
  "Pilates",
  "Personal Training",
  "Strength",
  "Cardio",
  "Martial Arts",
  "Other"
];

export const CATEGORY_VISUALS: Record<string, { image: string; color: string; badge: string }> = {
  Zumba: {
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
    color: "bg-pink-500 text-white",
    badge: "Group Dance Workout"
  },
  Yoga: {
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop",
    color: "bg-emerald-600 text-white",
    badge: "Mindfulness & Flow"
  },
  CrossFit: {
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop",
    color: "bg-amber-600 text-white",
    badge: "High-Intensity Functional"
  },
  Dance: {
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop",
    color: "bg-purple-600 text-white",
    badge: "Rhythm & Movement"
  },
  Aerobics: {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
    color: "bg-cyan-600 text-white",
    badge: "Cardio Group Fitness"
  },
  Pilates: {
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800&auto=format&fit=crop",
    color: "bg-indigo-600 text-white",
    badge: "Core & Posture Studio"
  },
  Strength: {
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=800&auto=format&fit=crop",
    color: "bg-[#0F172A] text-white",
    badge: "Weights & Conditioning"
  },
  Cardio: {
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=800&auto=format&fit=crop",
    color: "bg-rose-600 text-white",
    badge: "Endurance & Stamina"
  },
  "Martial Arts": {
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop",
    color: "bg-orange-600 text-white",
    badge: "Combat & Self-Defense"
  },
  "Personal Training": {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
    color: "bg-blue-600 text-white",
    badge: "Personal Coaching"
  },
  Other: {
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    color: "bg-slate-700 text-white",
    badge: "Custom Fitness Session"
  }
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const money = (val: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

export function ClassesModule() {
  const pathname = usePathname();
  const isClassesPage = pathname === "/dashboard/classes";

  type TabType =
    | "list"
    | "plans"
    | "schedule"
    | "sessions"
    | "bookings"
    | "members"
    | "attendance"
    | "payments"
    | "dues"
    | "revenue";

  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [returnToPlanModal, setReturnToPlanModal] = useState(false);

  const [editingClass, setEditingClass] = useState<GymClass | null>(null);
  const [selectedClassDetails, setSelectedClassDetails] = useState<GymClass | null>(null);
  const [selectedDue, setSelectedDue] = useState<ClassOutstandingDue | null>(null);
  const [selectedSessionQrId, setSelectedSessionQrId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Queries (only enabled when actually on /dashboard/classes)
  const kpisQuery = useQuery({ queryKey: ["classes-kpis"], queryFn: getClassKPIs, enabled: isClassesPage, retry: false, staleTime: 60000 });
  const classesQuery = useQuery({ queryKey: ["gym-classes"], queryFn: listGymClasses, enabled: isClassesPage, retry: false, staleTime: 60000 });
  const plansQuery = useQuery({ queryKey: ["class-plans"], queryFn: () => listClassPlans(), enabled: isClassesPage, retry: false, staleTime: 60000 });
  const scheduleQuery = useQuery({ queryKey: ["classes-weekly-schedule"], queryFn: getWeeklySchedule, enabled: isClassesPage, retry: false, staleTime: 60000 });
  const sessionsQuery = useQuery({ queryKey: ["classes-sessions"], queryFn: () => listClassSessions(), enabled: isClassesPage, retry: false, staleTime: 60000 });
  const bookingsQuery = useQuery({
    queryKey: ["class-bookings", selectedClassDetails?.id],
    queryFn: () => listClassBookings(selectedClassDetails?.id),
    enabled: isClassesPage,
    retry: false,
    staleTime: 60000
  });
  const membersQuery = useQuery({ queryKey: ["class-all-members"], queryFn: () => listAllClassMembers(), enabled: isClassesPage, retry: false, staleTime: 60000 });
  const attendanceQuery = useQuery({ queryKey: ["class-all-attendance"], queryFn: () => listGymClassAttendance(), enabled: isClassesPage, retry: false, staleTime: 60000 });
  const paymentsQuery = useQuery({ queryKey: ["class-all-payments"], queryFn: () => listAllClassPayments(), enabled: isClassesPage, retry: false, staleTime: 60000 });
  const duesQuery = useQuery({ queryKey: ["class-outstanding-dues"], queryFn: listClassOutstandingDues, enabled: isClassesPage, retry: false, staleTime: 60000 });
  const revenueOverviewQuery = useQuery({ queryKey: ["business-revenue-overview"], queryFn: () => getBusinessRevenueOverview(), enabled: isClassesPage, retry: false, staleTime: 60000 });
  const gymMembersListQuery = useQuery({ queryKey: ["gym-members-lookup"], queryFn: () => listMembers({ page: 1, limit: 100 }), enabled: isClassesPage && isEnrollModalOpen, retry: false });

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: createGymClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym-classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["classes-weekly-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["classes-sessions"] });
      toast.success("Class created successfully!");
      setIsClassModalOpen(false);
      setEditingClass(null);
      if (returnToPlanModal) {
        setReturnToPlanModal(false);
        setIsPlanModalOpen(true);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to create class")
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ classId, payload }: { classId: string; payload: any }) =>
      updateGymClass(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym-classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["classes-weekly-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["classes-sessions"] });
      toast.success("Class updated successfully!");
      setIsClassModalOpen(false);
      setEditingClass(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to update class")
  });

  const createPlanMutation = useMutation({
    mutationFn: createClassPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-plans"] });
      queryClient.invalidateQueries({ queryKey: ["classes-kpis"] });
      toast.success("Class Plan created successfully!");
      setIsPlanModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to create plan")
  });

  const enrollMemberMutation = useMutation({
    mutationFn: enrollMemberInClassPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-all-members"] });
      queryClient.invalidateQueries({ queryKey: ["class-all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["class-outstanding-dues"] });
      queryClient.invalidateQueries({ queryKey: ["classes-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["class-plans"] });
      queryClient.invalidateQueries({ queryKey: ["business-revenue-overview"] });
      toast.success("Member enrolled in Class Plan successfully!");
      setIsEnrollModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to enroll member")
  });

  const recordDuesMutation = useMutation({
    mutationFn: recordClassDuesPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-outstanding-dues"] });
      queryClient.invalidateQueries({ queryKey: ["class-plans"] });
      queryClient.invalidateQueries({ queryKey: ["class-all-members"] });
      queryClient.invalidateQueries({ queryKey: ["class-all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["business-revenue-overview"] });
      toast.success("Class payment dues recorded!");
      setIsDuesModalOpen(false);
      setSelectedDue(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to record payment")
  });

  const deleteClassMutation = useMutation({
    mutationFn: deleteGymClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym-classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["classes-weekly-schedule"] });
      toast.success("Class removed.");
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: softDeleteClassPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["classes-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["class-outstanding-dues"] });
      queryClient.invalidateQueries({ queryKey: ["business-revenue-overview"] });
      toast.success("Class payment voided/deleted.");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to delete payment")
  });

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: "Attended" | "Cancelled" | "No Show" }) =>
      updateClassBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["classes-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["class-all-attendance"] });
      toast.success("Booking status updated.");
    }
  });

  const kpis = kpisQuery.data ?? { totalClasses: 0, activeClasses: 0, classesToday: 0, totalBookingsToday: 0, totalClassMemberships: 0, uniqueClassMembers: 0 };
  const classesList = classesQuery.data ?? [];
  const classPlans = plansQuery.data ?? [];
  const weeklySchedule = scheduleQuery.data ?? [];
  const sessionsList = sessionsQuery.data ?? [];
  const bookingsList = bookingsQuery.data ?? [];
  const classMembersList = membersQuery.data ?? [];
  const attendanceList = attendanceQuery.data ?? [];
  const paymentsList = paymentsQuery.data ?? [];
  const outstandingDues = duesQuery.data ?? [];
  const revenueOverview = revenueOverviewQuery.data;

  const totalClassRevenue = revenueOverview?.classMetrics?.totalRevenue ?? paymentsList.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalClassDues = outstandingDues.reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

  const filteredClasses = classesList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === "All" || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#64748B]">Management</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#0F172A]">Fitness Classes & Class Plans</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Schedule Zumba, Yoga, CrossFit, manage Class Plans, member enrollments & track separate Class Revenue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEnrollModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <UserPlus className="size-4 text-blue-600" />
            Enroll Member
          </button>
          <button
            type="button"
            onClick={() => setIsPlanModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Plus className="size-4 text-slate-600" />
            New Class Plan
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            Create Class
          </button>
        </div>
      </header>

      {/* Real KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Total Classes", value: kpis.totalClasses, icon: Zap, color: "text-slate-800" },
          { label: "Active Classes", value: kpis.activeClasses, icon: Sparkles, color: "text-emerald-600" },
          { label: "Classes Today", value: kpis.classesToday, icon: CalendarDays, color: "text-blue-600" },
          { label: "Bookings Today", value: kpis.totalBookingsToday, icon: UserCheck, color: "text-indigo-600" },
          { label: "Class Members", value: kpis.uniqueClassMembers ?? classMembersList.length, icon: Users, color: "text-purple-600" },
          { label: "Class Revenue", value: money(totalClassRevenue), icon: DollarSign, color: "text-emerald-700" }
        ].map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <span className="grid size-9 place-items-center rounded-xl bg-[#F1F5F9] text-[#475569]">
              <Icon className="size-4.5" />
            </span>
            <p className="mt-4 text-xs font-medium text-[#64748B]">{label}</p>
            <p className={`mt-0.5 text-2xl font-semibold tracking-[-0.05em] ${color}`}>{value}</p>
          </article>
        ))}
      </section>

      {/* 10 Primary Operational Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#E2E8F0] pb-2">
        {[
          { key: "list", label: "Classes", count: classesList.length },
          { key: "plans", label: "Class Plans", count: classPlans.length },
          { key: "schedule", label: "Schedule" },
          { key: "sessions", label: "Sessions", count: sessionsList.length },
          { key: "bookings", label: "Bookings", count: bookingsList.length },
          { key: "members", label: "Class Members", count: classMembersList.length },
          { key: "attendance", label: "Attendance", count: attendanceList.length },
          { key: "payments", label: "Payments Ledger", count: paymentsList.length },
          { key: "dues", label: "Class Dues", count: outstandingDues.length },
          { key: "revenue", label: "Revenue & Analytics" }
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as TabType)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === t.key ? "bg-[#0F172A] text-white shadow-sm" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
            }`}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${activeTab === t.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL CLASSES */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-3 rounded-2xl border border-[#E2E8F0]">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by class name, coach..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium outline-none bg-white"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-5 py-3">Class Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Instructor / Coach</th>
                    <th className="px-5 py-3">Capacity</th>
                    <th className="px-5 py-3">Drop-in Fee</th>
                    <th className="px-5 py-3">Schedule</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <p className="font-semibold text-slate-600 mb-1">No fitness classes found.</p>
                        <p className="text-xs text-slate-400 mb-3">Create your first class to start scheduling sessions and class plans.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClass(null);
                            setIsClassModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-md cursor-pointer"
                        >
                          <Plus className="size-3.5" /> Create Class
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((c) => {
                      const visual = CATEGORY_VISUALS[c.category] || CATEGORY_VISUALS.Other;
                      return (
                        <tr key={c.id} className="hover:bg-[#F8FAFC]">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{c.name}</div>
                            {c.description && <div className="text-[11px] text-slate-400 line-clamp-1">{c.description}</div>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${visual.color}`}>
                              {c.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-medium">{c.instructorName || "Gym Coach"}</td>
                          <td className="px-5 py-3.5 text-slate-700 font-mono">
                            <span className="font-bold text-slate-900">{c.bookedCount || 0}</span> / {c.capacity}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{money(c.dropInPrice || 0)}</td>
                          <td className="px-5 py-3.5 text-[11px] text-slate-600">
                            {c.schedule && c.schedule.length > 0
                              ? c.schedule.map((s) => `${s.dayOfWeek.slice(0, 3)} ${s.startTime.slice(0, 5)}`).join(", ")
                              : "No weekly slots"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase border ${c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                              {c.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1">
                            <button
                              onClick={() => {
                                setEditingClass(c);
                                setIsClassModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
                              title="Edit Class"
                            >
                              <Edit3 className="size-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${c.name}?`)) {
                                  deleteClassMutation.mutate(c.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 cursor-pointer"
                              title="Delete Class"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS PLANS */}
      {activeTab === "plans" && (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4 p-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Class Subscription Plans</h2>
              <p className="text-xs text-slate-500">Dedicated recurring membership plans for Zumba, Yoga, CrossFit, and group sessions</p>
            </div>
            <button onClick={() => setIsPlanModalOpen(true)} className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white cursor-pointer">
              <Plus className="inline size-3.5 mr-1" /> Create Class Plan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Plan Name</th>
                  <th className="px-4 py-3">Primary Class</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Billing Period</th>
                  <th className="px-4 py-3">Session Limit</th>
                  <th className="px-4 py-3">Active Subscribers</th>
                  <th className="px-4 py-3">Total Revenue</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {classPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">No class plans created yet. Click "Create Class Plan" above.</td>
                  </tr>
                ) : (
                  classPlans.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-700">{p.className} ({p.classCategory})</td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">{money(p.price)}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">{p.billingPeriod}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {p.isUnlimited ? "Unlimited" : `${p.sessionLimit} sessions`}
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-700">{p.activeSubscribers} Members</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-700">{money(p.totalRevenue)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase border ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WEEKLY SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayClasses = weeklySchedule.filter((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase());
              return (
                <div key={day} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 min-h-[220px]">
                  <span className="font-extrabold text-xs uppercase text-slate-700 block border-b pb-1 mb-2">{day.slice(0, 3)}</span>
                  {dayClasses.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No classes</p>
                  ) : (
                    dayClasses.map((item) => (
                      <div key={item.scheduleId} className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs space-y-1 mb-2 shadow-2xs">
                        <div className="font-bold text-slate-900 flex justify-between items-start">
                          <span>{item.className}</span>
                          <span className="text-[10px] text-blue-600 font-mono bg-blue-50 px-1 py-0.2 rounded">
                            {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">Coach: {item.instructorName || "Gym Coach"}</p>
                        <p className="text-[10px] text-slate-400">Cap: {item.capacity} seats</p>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SESSIONS */}
      {activeTab === "sessions" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Class Sessions & Live Rosters</h2>
              <p className="text-xs text-slate-500">View generated class sessions, capacity occupancy, and check-in QR codes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Session Date & Time</th>
                  <th className="px-4 py-3">Class & Category</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Booked</th>
                  <th className="px-4 py-3">Attended</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sessionsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">No scheduled sessions recorded yet.</td>
                  </tr>
                ) : (
                  sessionsList.map((s) => (
                    <tr key={s.sessionId} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-slate-900 block">{new Date(s.sessionDate).toLocaleDateString("en-IN")}</span>
                        <span className="text-[11px] text-slate-500">{s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{s.className}</span>
                        <span className="text-[10px] text-blue-600">{s.category}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{s.instructorName || "Gym Coach"}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{s.capacity}</td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">{s.bookedCount}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">{s.attendedCount}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">{s.availableSeats}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-[10px] text-blue-700 border border-blue-200 uppercase">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedSessionQrId(s.sessionId)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="size-3" /> Session QR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BOOKINGS & ROSTER */}
      {activeTab === "bookings" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Class Bookings & Rosters</h2>
              <p className="text-xs text-slate-500">Member class reservations, booked attendance status, and check-in confirmation</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Session Date & Time</th>
                  <th className="px-4 py-3">Booking Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bookingsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">No active bookings recorded yet.</td>
                  </tr>
                ) : (
                  bookingsList.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{b.memberName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{b.memberPhone}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{b.className}</td>
                      <td className="px-4 py-3 font-mono">
                        {new Date(b.sessionDate).toLocaleDateString("en-IN")} ({b.startTime ? b.startTime.slice(0, 5) : ""})
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase border ${
                          b.bookingStatus === "Attended"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : b.bookingStatus === "Cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedSessionQrId(b.sessionId)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="size-3" /> QR
                        </button>
                        {b.bookingStatus === "Booked" && (
                          <>
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: b.bookingId, status: "Attended" })}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                            >
                              Mark Attended
                            </button>
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: b.bookingId, status: "No Show" })}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              No Show
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CLASS MEMBERS */}
      {activeTab === "members" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Enrolled Class Members</h2>
              <p className="text-xs text-slate-500">Active class subscribers, quotas used/remaining, expiry dates, and settlement status</p>
            </div>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <UserPlus className="inline size-3.5 mr-1" /> Enroll Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Class Plan</th>
                  <th className="px-4 py-3">Primary Class</th>
                  <th className="px-4 py-3">Validity</th>
                  <th className="px-4 py-3">Sessions Used</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Remaining Due</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {classMembersList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No class members enrolled yet. Click "Enroll Member" to assign a class plan.
                    </td>
                  </tr>
                ) : (
                  classMembersList.map((m) => (
                    <tr key={m.membershipId} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{m.memberName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.memberId} • {m.memberPhone}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{m.planName}</td>
                      <td className="px-4 py-3 text-slate-600">{m.className} ({m.classCategory})</td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {new Date(m.startDate).toLocaleDateString("en-IN")} → {new Date(m.expiryDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-slate-900">{m.sessionsUsed}</span> / {m.isUnlimited ? "∞" : m.sessionsAllowed}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase border ${
                          m.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {m.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-extrabold font-mono">
                        {m.remainingAmount > 0 ? (
                          <span className="text-red-600">{money(m.remainingAmount)}</span>
                        ) : (
                          <span className="text-emerald-600">₹0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.remainingAmount > 0 ? (
                          <button
                            onClick={() => {
                              const due = outstandingDues.find((d) => d.memberUuid === m.memberUuid);
                              if (due) {
                                setSelectedDue(due);
                                setIsDuesModalOpen(true);
                              } else {
                                toast("Use Dues tab to settle balance");
                              }
                            }}
                            className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 cursor-pointer"
                          >
                            Pay Due
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold">Paid in Full</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: CLASS ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Class Session Attendance Ledger</h2>
              <p className="text-xs text-slate-500">
                Attendance specifically marked for fitness classes. Completely isolated from normal gym floor check-ins.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800 uppercase">
              Independent Class Domain
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Class & Instructor</th>
                  <th className="px-4 py-3">Session Date</th>
                  <th className="px-4 py-3">Time Slot</th>
                  <th className="px-4 py-3">Marked At</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {attendanceList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">No class attendance marked yet.</td>
                  </tr>
                ) : (
                  attendanceList.map((a) => (
                    <tr key={a.attendanceId} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{a.memberName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.memberId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block">{a.className}</span>
                        <span className="text-[10px] text-slate-500">Coach: {a.instructorName || "Gym Coach"}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">{new Date(a.sessionDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{a.startTime.slice(0, 5)} - {a.endTime.slice(0, 5)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {new Date(a.markedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-[10px] text-emerald-700 border border-emerald-200 uppercase">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: CLASS PAYMENTS */}
      {activeTab === "payments" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Class Payments & Receipts Ledger</h2>
              <p className="text-xs text-slate-500">All fees collected strictly for Zumba, Yoga, and group classes (separate from gym revenue)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Class & Plan</th>
                  <th className="px-4 py-3">Total Fee</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Remaining Due</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paymentsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">No class payments recorded yet.</td>
                  </tr>
                ) : (
                  paymentsList.map((p) => (
                    <tr key={p.paymentId} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{p.receiptNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{p.memberName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.memberPhone}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.className} ({p.planName})</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{money(p.totalAmount)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{money(p.paidAmount)}</td>
                      <td className="px-4 py-3 font-extrabold text-red-600">
                        {p.remainingAmount > 0 ? money(p.remainingAmount) : "₹0"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{p.paymentMethod}</td>
                      <td className="px-4 py-3 font-mono">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase border ${
                          p.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Void payment ${p.receiptNumber}? This will remove it from active revenue while preserving audit history.`)) {
                              deletePaymentMutation.mutate(p.paymentId);
                            }
                          }}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Soft delete / Void"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: CLASS DUES */}
      {activeTab === "dues" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Class Outstanding Balances</h2>
              <p className="text-xs text-slate-500">Unpaid and partial dues for Zumba, Yoga, and group class memberships</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Class & Plan</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Remaining Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {outstandingDues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">✓ No outstanding class dues! All class payments are settled.</td>
                  </tr>
                ) : (
                  outstandingDues.map((d) => (
                    <tr key={d.paymentId} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{d.memberName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{d.memberId}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{d.className} ({d.planName})</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{money(d.totalAmount)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{money(d.paidAmount)}</td>
                      <td className="px-4 py-3 font-extrabold text-red-600">{money(d.remainingAmount)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-[10px] text-amber-700 border border-amber-200 uppercase">
                          {d.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedDue(d);
                            setIsDuesModalOpen(true);
                          }}
                          className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                        >
                          Record Dues
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: CLASS REVENUE & ANALYTICS */}
      {activeTab === "revenue" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Class Revenue</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700">{money(totalClassRevenue)}</p>
              <p className="mt-1 text-[11px] text-slate-500">Collected from class plans & drop-ins</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-2xs">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Class Dues</p>
              <p className="mt-1 text-2xl font-extrabold text-red-700">{money(totalClassDues)}</p>
              <p className="mt-1 text-[11px] text-slate-500">Outstanding balance pending collection</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Gym Floor Revenue</p>
              <p className="mt-1 text-2xl font-extrabold text-blue-700">
                {money(revenueOverview?.gymMetrics?.totalRevenue ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Normal gym memberships</p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-slate-900 p-4 shadow-md text-white">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Business Revenue</p>
              <p className="mt-1 text-2xl font-extrabold text-white">
                {money((revenueOverview?.gymMetrics?.totalRevenue ?? 0) + totalClassRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Gym + Classes combined</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Revenue by Class</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[10px] font-bold uppercase text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {revenueOverview?.revenueByClass && revenueOverview.revenueByClass.length > 0 ? (
                      revenueOverview.revenueByClass.map((rc) => (
                        <tr key={rc.classId}>
                          <td className="px-3 py-2 font-bold text-slate-800">{rc.className}</td>
                          <td className="px-3 py-2 text-slate-600">{rc.category}</td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700">{money(rc.revenue)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-slate-400">No class revenue records yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Revenue by Class Plan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[10px] font-bold uppercase text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Subscribers</th>
                      <th className="px-3 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {revenueOverview?.revenueByClassPlan && revenueOverview.revenueByClassPlan.length > 0 ? (
                      revenueOverview.revenueByClassPlan.map((rp) => (
                        <tr key={rp.planId}>
                          <td className="px-3 py-2 font-bold text-slate-800">{rp.planName}</td>
                          <td className="px-3 py-2 text-slate-600">{rp.activeSubscribers}</td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700">{money(rp.revenue)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-slate-400">No plan revenue records yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENROLL MEMBER MODAL */}
      <AnimatePresence>
        {isEnrollModalOpen && (
          <EnrollMemberModal
            members={gymMembersListQuery.data?.members ?? []}
            plans={classPlans}
            onClose={() => setIsEnrollModalOpen(false)}
            onSubmit={(payload) => enrollMemberMutation.mutate(payload)}
            isPending={enrollMemberMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* CREATE / EDIT CLASS MODAL */}
      <AnimatePresence>
        {isClassModalOpen && (
          <ClassModal
            initialData={editingClass}
            onClose={() => {
              setIsClassModalOpen(false);
              setEditingClass(null);
              setReturnToPlanModal(false);
            }}
            onSubmit={(payload) => {
              if (editingClass) {
                updateClassMutation.mutate({ classId: editingClass.id, payload });
              } else {
                createClassMutation.mutate(payload);
              }
            }}
            isPending={createClassMutation.isPending || updateClassMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* CREATE CLASS PLAN MODAL */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <CreatePlanModal
            classes={classesList}
            onClose={() => setIsPlanModalOpen(false)}
            onCreateClassFirst={() => {
              setIsPlanModalOpen(false);
              setReturnToPlanModal(true);
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            onSubmit={(payload) => createPlanMutation.mutate(payload)}
            isPending={createPlanMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* RECORD DUES MODAL */}
      <AnimatePresence>
        {isDuesModalOpen && selectedDue && (
          <RecordDuesModal
            due={selectedDue}
            onClose={() => {
              setIsDuesModalOpen(false);
              setSelectedDue(null);
            }}
            onSubmit={(amountPaid, paymentMethod) => {
              recordDuesMutation.mutate({ paymentId: selectedDue.paymentId, amountPaid, paymentMethod });
            }}
            isPending={recordDuesMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* SESSION QR MODAL */}
      <AnimatePresence>
        {selectedSessionQrId && (
          <SessionQrModal
            sessionId={selectedSessionQrId}
            onClose={() => setSelectedSessionQrId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EnrollMemberModal({
  members,
  plans,
  onClose,
  onSubmit,
  isPending
}: {
  members: Array<{ id: string; memberId: string; firstName: string; lastName: string; phone: string }>;
  plans: ClassPlan[];
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [classPlanId, setClassPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const selectedPlan = plans.find((p) => p.id === classPlanId);
  const [totalAmount, setTotalAmount] = useState(selectedPlan ? String(selectedPlan.price) : "999");
  const [paidAmount, setPaidAmount] = useState(selectedPlan ? String(selectedPlan.price) : "999");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    if (selectedPlan) {
      setTotalAmount(String(selectedPlan.price));
      setPaidAmount(String(selectedPlan.price));
    }
  }, [classPlanId, selectedPlan]);

  const filteredMembers = members.filter(
    (m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.phone.includes(memberSearch)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return toast.error("Please select a member.");
    if (!classPlanId) return toast.error("Please select a class plan.");

    onSubmit({
      memberId,
      classPlanId,
      paymentData: {
        startDate,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        paymentMethod,
        notes: notes.trim() || undefined
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Class Subscription</span>
            <h2 className="font-bold text-base text-slate-900 mt-1">Enroll Member in Class Plan</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="size-5" /></button>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center space-y-2">
            <p className="font-bold text-xs text-amber-900">No Class Plans available</p>
            <p className="text-[11px] text-amber-700">Create a Class Plan first before enrolling members.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Member *</label>
              <input
                type="text"
                placeholder="Search member by name, ID, or phone..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs mb-1.5 outline-none"
              />
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full rounded-xl border p-2.5 font-medium outline-none bg-white"
                required
              >
                <option value="">-- Choose Member --</option>
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.memberId}) - {m.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Class Plan *</label>
              <select
                value={classPlanId}
                onChange={(e) => setClassPlanId(e.target.value)}
                className="w-full rounded-xl border p-2.5 font-medium outline-none bg-white"
                required
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.className}) - {money(p.price)} / {p.billingPeriod.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border p-2 font-medium outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border p-2 font-medium outline-none bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Fee (₹) *</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  min="0"
                  className="w-full rounded-xl border p-2 font-bold outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  min="0"
                  max={totalAmount}
                  className="w-full rounded-xl border p-2 font-bold outline-none"
                  required
                />
              </div>
            </div>

            {Number(totalAmount) > Number(paidAmount) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 font-medium">
                Remaining due: <strong>{money(Number(totalAmount) - Number(paidAmount))}</strong> will be recorded in Class Dues.
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Registration remarks or receipt memo..."
                className="w-full rounded-xl border p-2 font-medium outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 font-bold text-slate-700 cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Enrolling..." : "Enroll & Collect"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function CreatePlanModal({
  classes,
  onClose,
  onSubmit,
  onCreateClassFirst,
  isPending
}: {
  classes: GymClass[];
  onClose: () => void;
  onSubmit: (payload: any) => void;
  onCreateClassFirst?: () => void;
  isPending: boolean;
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [name, setName] = useState("Yoga Monthly");
  const [price, setPrice] = useState("999");
  const [billingPeriod, setBillingPeriod] = useState("Monthly");
  const [sessionLimit, setSessionLimit] = useState("12");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedAllowedIds, setSelectedAllowedIds] = useState<string[]>(classes[0] ? [classes[0].id] : []);

  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(classes[0].id);
      setSelectedAllowedIds([classes[0].id]);
    }
  }, [classes, classId]);

  const toggleAllowedId = (id: string) => {
    if (selectedAllowedIds.includes(id)) {
      if (selectedAllowedIds.length > 1) {
        setSelectedAllowedIds(selectedAllowedIds.filter((x) => x !== id));
      }
    } else {
      setSelectedAllowedIds([...selectedAllowedIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return toast.error("Select a primary class.");
    if (!name.trim()) return toast.error("Plan name required.");

    onSubmit({
      classId,
      name: name.trim(),
      price: Number(price),
      billingPeriod,
      sessionLimit: isUnlimited ? null : Number(sessionLimit),
      isUnlimited,
      allowedClassIds: selectedAllowedIds.length > 0 ? selectedAllowedIds : [classId],
      description: description.trim() || null
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-lg text-slate-900">Create Class Subscription Plan</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="size-5" /></button>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3 my-2">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-900">No Classes Created Yet</h3>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                A Class Subscription Plan must be linked to a primary fitness class (e.g., Yoga, Zumba, CrossFit). Please create your first class first.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCreateClassFirst}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-sm cursor-pointer"
              >
                <Plus className="size-3.5" />
                Create Class First
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Class *</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border p-2.5 font-medium outline-none bg-white">
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Allowed Classes (Multi-select) *</label>
              <div className="rounded-2xl border p-2.5 space-y-1.5 max-h-32 overflow-y-auto bg-slate-50">
                {classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedAllowedIds.includes(c.id)}
                      onChange={() => toggleAllowedId(c.id)}
                    />
                    <span>{c.name} ({c.category})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Plan Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yoga Monthly" className="w-full rounded-xl border p-2.5 font-medium outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-xl border p-2 font-medium outline-none" min="0" required />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Period</label>
                <select value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} className="w-full rounded-xl border p-2 font-medium outline-none bg-white">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Drop-In">Drop-In</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={isUnlimited} onChange={(e) => setIsUnlimited(e.target.checked)} />
                <span>Unlimited Sessions</span>
              </label>
              {!isUnlimited && (
                <div className="flex-1">
                  <input type="number" value={sessionLimit} onChange={(e) => setSessionLimit(e.target.value)} placeholder="Sessions / month" className="w-full rounded-xl border p-2 font-medium outline-none" min="1" required />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 font-bold text-slate-700 cursor-pointer">Cancel</button>
              <button type="submit" disabled={isPending} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-md disabled:opacity-50 cursor-pointer">
                {isPending ? "Creating..." : "Create Plan"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function RecordDuesModal({
  due,
  onClose,
  onSubmit,
  isPending
}: {
  due: ClassOutstandingDue;
  onClose: () => void;
  onSubmit: (amountPaid: number, paymentMethod: string) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState(String(due.remainingAmount));
  const [method, setMethod] = useState("Cash");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-bold text-base text-slate-900">Record Class Dues Payment</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="size-5" /></button>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-xs space-y-1">
          <p className="font-bold text-slate-900">{due.memberName} ({due.className})</p>
          <p className="text-slate-600">Remaining Due: <strong className="text-red-600">{money(due.remainingAmount)}</strong></p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Amount Paid (₹) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} max={due.remainingAmount} min="1" className="w-full rounded-xl border p-2.5 font-bold outline-none" required />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-xl border p-2.5 font-medium outline-none bg-white">
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2 text-xs">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border py-2 font-bold text-slate-700 cursor-pointer">Cancel</button>
          <button type="button" disabled={isPending} onClick={() => onSubmit(Number(amount), method)} className="flex-1 rounded-xl bg-slate-900 py-2 font-bold text-white shadow-md disabled:opacity-50 cursor-pointer">
            {isPending ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SessionQrModal({
  sessionId,
  onClose
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["session-qr", sessionId],
    queryFn: () => getSessionQR(sessionId)
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100 text-center">
        <div className="flex items-center justify-between border-b pb-3 text-left">
          <div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Session QR Attendance</span>
            <h2 className="font-bold text-base text-slate-900 mt-1">{data ? data.className : "Class Session"}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="size-5" /></button>
        </div>

        {isLoading ? (
          <div className="py-12 animate-pulse text-xs text-slate-400 font-medium">Generating Session QR Code...</div>
        ) : !data ? (
          <div className="py-8 text-xs text-red-500 font-medium">Could not load session QR.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs space-y-1 text-slate-700 font-medium">
              <p className="font-bold text-slate-900">{data.category} • Coach: {data.instructorName || "Gym Coach"}</p>
              <p>{new Date(data.sessionDate).toLocaleDateString("en-IN")} @ {data.startTime.slice(0, 5)} - {data.endTime.slice(0, 5)}</p>
              <div className="flex justify-around pt-1 text-[11px] font-bold text-slate-800">
                <span>Booked: {data.bookedCount}</span>
                <span className="text-emerald-600">Present: {data.presentCount}</span>
                <span className="text-blue-600">Capacity: {data.capacity}</span>
              </div>
            </div>

            <div className="mx-auto flex flex-col items-center justify-center rounded-3xl bg-slate-900 p-6 text-white shadow-xl space-y-3">
              <QrCode className="size-36 text-blue-400" />
              <p className="text-[11px] text-slate-300 font-medium max-w-xs">
                Members scan this QR in Member App to check in specifically for this {data.className} session.
              </p>
            </div>

            <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 font-bold text-xs text-white hover:bg-slate-800 shadow-md cursor-pointer">
              <Printer className="size-4" /> Print Session QR Poster
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ClassModal({
  initialData,
  onClose,
  onSubmit,
  isPending
}: {
  initialData?: GymClass | null;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "Yoga");
  const [instructorName, setInstructorName] = useState(initialData?.instructorName ?? "");
  const [capacity, setCapacity] = useState(initialData ? String(initialData.capacity) : "20");
  const [monthlyPrice, setMonthlyPrice] = useState(initialData ? String(initialData.monthlyPrice) : "1200");
  const [dropInPrice, setDropInPrice] = useState(initialData ? String(initialData.dropInPrice ?? 0) : "150");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [schedule, setSchedule] = useState<ClassScheduleItem[]>(() => {
    if (initialData?.schedule && initialData.schedule.length > 0) {
      return initialData.schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek || "Monday",
        startTime: s.startTime ? s.startTime.slice(0, 5) : "07:00",
        endTime: s.endTime ? s.endTime.slice(0, 5) : "08:00"
      }));
    }
    return [
      { dayOfWeek: "Monday", startTime: "07:00", endTime: "08:00" }
    ];
  });

  const handleAddSlot = () => {
    const currentDays = schedule.map((s) => s.dayOfWeek);
    const nextDay = DAYS_OF_WEEK.find((d) => !currentDays.includes(d)) || "Wednesday";
    setSchedule((prev) => [
      ...prev,
      { dayOfWeek: nextDay, startTime: "07:00", endTime: "08:00" }
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (schedule.length <= 1) {
      toast.error("At least one weekly schedule slot is required.");
      return;
    }
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: keyof ClassScheduleItem, value: string) => {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Class name is required.");
    const parsedCapacity = Number(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return toast.error("Capacity must be greater than 0.");
    }
    const parsedMonthly = Number(monthlyPrice);
    if (isNaN(parsedMonthly) || parsedMonthly < 0) {
      return toast.error("Monthly price cannot be negative.");
    }
    const parsedDropIn = Number(dropInPrice || 0);
    if (isNaN(parsedDropIn) || parsedDropIn < 0) {
      return toast.error("Drop-in price cannot be negative.");
    }
    if (!schedule || schedule.length === 0) {
      return toast.error("At least one weekly schedule slot is required.");
    }

    for (let i = 0; i < schedule.length; i++) {
      const slot = schedule[i];
      if (!slot.dayOfWeek) {
        return toast.error(`Please select a day for schedule slot #${i + 1}`);
      }
      if (!slot.startTime || !slot.endTime) {
        return toast.error(`Start and end time are required for slot #${i + 1}`);
      }
      if (slot.startTime >= slot.endTime) {
        return toast.error(`Slot #${i + 1} (${slot.dayOfWeek}): End time must be after start time.`);
      }
    }

    onSubmit({
      name: name.trim(),
      category,
      instructorName: instructorName.trim() || null,
      capacity: parsedCapacity,
      monthlyPrice: parsedMonthly,
      dropInPrice: parsedDropIn,
      description: description.trim() || null,
      isActive,
      schedule
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              {initialData ? "Edit Fitness Class" : "Create New Fitness Class"}
            </h2>
            <p className="text-xs text-slate-500">
              Define class identity, coach, capacity, drop-in fee & weekly schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Class Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Power Yoga, Morning Zumba"
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-slate-800"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-slate-800 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Instructor / Coach</label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="e.g. Bhushan, Rahul"
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Capacity *</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Drop-in Fee (₹)
                <span className="text-[10px] font-normal text-slate-400 ml-1">Single session</span>
              </label>
              <input
                type="number"
                value={dropInPrice}
                onChange={(e) => setDropInPrice(e.target.value)}
                min="0"
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Monthly Fee (₹) *
              </label>
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                min="0"
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What to expect, gear needed, intensity level..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-medium outline-none focus:border-slate-800"
            />
          </div>

          {/* Weekly Schedule Slots Builder */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs">Weekly Schedule Slots *</label>
              <button
                type="button"
                onClick={handleAddSlot}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Plus className="size-3" /> Add Time Slot
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {schedule.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-2 text-xs"
                >
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => handleSlotChange(index, "dayOfWeek", e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-800 outline-none"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 outline-none font-mono"
                      required
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 outline-none font-mono"
                      required
                    />
                  </div>

                  {schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      className="ml-auto rounded-lg p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-slate-900"
              />
              <span>Class is active & visible for booking</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-[#0F172A] px-5 py-2 font-bold text-white shadow-md hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Saving..." : initialData ? "Update Class" : "Create Class"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
