"use client";

import React, { useState } from "react";
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
  Printer
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
  type GymClass,
  type ClassScheduleItem,
  type WeeklyScheduleEntry,
  type ClassBookingRecord
} from "@/src/services/classes.service";

import {
  listClassPlans,
  createClassPlan,
  updateClassPlan,
  deleteClassPlan,
  listClassOutstandingDues,
  recordClassDuesPayment,
  type ClassPlan,
  type ClassOutstandingDue
} from "@/src/services/class-plans.service";

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

  const [activeTab, setActiveTab] = useState<"list" | "plans" | "schedule" | "bookings" | "dues">("list");
  const [search, setSearch] = useState("");
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);

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
  const bookingsQuery = useQuery({
    queryKey: ["class-bookings", selectedClassDetails?.id],
    queryFn: () => listClassBookings(selectedClassDetails?.id),
    enabled: isClassesPage && (Boolean(selectedClassDetails) || activeTab === "bookings"),
    retry: false,
    staleTime: 60000
  });
  const duesQuery = useQuery({
    queryKey: ["class-outstanding-dues"],
    queryFn: listClassOutstandingDues,
    enabled: isClassesPage && activeTab === "dues",
    retry: false,
    staleTime: 60000
  });

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: createGymClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gym-classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes-kpis"] });
      toast.success("Class created successfully!");
      setIsClassModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to create class")
  });

  const createPlanMutation = useMutation({
    mutationFn: createClassPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-plans"] });
      toast.success("Class Plan created successfully!");
      setIsPlanModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to create plan")
  });

  const recordDuesMutation = useMutation({
    mutationFn: recordClassDuesPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-outstanding-dues"] });
      queryClient.invalidateQueries({ queryKey: ["class-plans"] });
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
      toast.success("Class removed.");
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: "Attended" | "Cancelled" | "No Show" }) =>
      updateClassBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-bookings"] });
      toast.success("Booking status updated.");
    }
  });

  const kpis = kpisQuery.data ?? { totalClasses: 0, activeClasses: 0, classesToday: 0, totalBookingsToday: 0 };
  const classesList = classesQuery.data ?? [];
  const classPlans = plansQuery.data ?? [];
  const weeklySchedule = scheduleQuery.data ?? [];
  const bookingsList = bookingsQuery.data ?? [];
  const outstandingDues = duesQuery.data ?? [];

  // TESTING PHASE BYPASS: Disable UI feature lock screen during testing
  const isLocked = false;
  /* Original check:
    (kpisQuery.error as any)?.response?.data?.error?.code === "FEATURE_LOCKED" ||
    (classesQuery.error as any)?.response?.data?.error?.code === "FEATURE_LOCKED" ||
    (kpisQuery.error as any)?.response?.status === 403;
  */

  if (isLocked) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center space-y-5">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 shadow-xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
            <Lock className="h-8 w-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 font-extrabold text-[10px] text-amber-900 uppercase tracking-wider">
            Premium Plan Required
          </span>
          <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight">Classes is a Premium Feature</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Unlock Zumba, Yoga, Dance, CrossFit, class plans, class revenue, member bookings, and attendance management.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-xs text-white hover:bg-slate-800 transition-colors shadow-md"
          >
            Upgrade to Premium Plan
          </a>
        </div>
      </div>
    );
  }

  const filteredClasses = classesList.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#64748B]">Management</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#0F172A]">Fitness Classes & Class Plans</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Schedule Zumba, Yoga, CrossFit, manage Class Plans & track separate Class Revenue.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <Plus className="size-4 text-blue-600" />
            New Class Plan
          </button>
          <button
            onClick={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#1E293B]"
          >
            <Plus className="size-4" />
            Create Class
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Total Classes", value: kpis.totalClasses, icon: Zap },
          { label: "Active Classes", value: kpis.activeClasses, icon: Sparkles },
          { label: "Classes Today", value: kpis.classesToday, icon: CalendarDays },
          { label: "Bookings Today", value: kpis.totalBookingsToday, icon: UserCheck },
          { label: "Class Memberships", value: kpis.totalClassMemberships ?? 0, icon: Users },
          { label: "Unique Members", value: kpis.uniqueClassMembers ?? 0, icon: Users }
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <span className="grid size-9 place-items-center rounded-xl bg-[#F1F5F9] text-[#475569]">
              <Icon className="size-4.5" />
            </span>
            <p className="mt-4 text-xs font-medium text-[#64748B]">{label}</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-[-0.05em]">{value}</p>
          </article>
        ))}
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-2">
        {[
          { key: "list", label: `All Classes (${classesList.length})` },
          { key: "plans", label: `Class Plans (${classPlans.length})` },
          { key: "schedule", label: "Weekly Schedule" },
          { key: "bookings", label: "Bookings & Roster" },
          { key: "dues", label: `Class Dues (${outstandingDues.length})` }
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === t.key ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL CLASSES */}
      {activeTab === "list" && (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-5 py-3">Class Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Instructor</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Monthly Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4 font-bold text-[#0F172A]">{c.name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-extrabold text-[10px] uppercase shadow-xs ${CATEGORY_VISUALS[c.category]?.color || "bg-slate-800 text-white"}`}>
                        {c.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{c.instructorName || "Unassigned"}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{c.bookedCount} / {c.capacity}</td>
                    <td className="px-5 py-4 font-extrabold text-slate-900">{money(c.monthlyPrice)}/mo</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase border ${c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                        {c.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1">
                      <button onClick={() => setSelectedClassDetails(c)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-50">View</button>
                      <button onClick={() => deleteClassMutation.mutate(c.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100"><Trash2 className="size-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS PLANS */}
      {activeTab === "plans" && (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs space-y-4 p-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Class Subscription Plans</h2>
              <p className="text-xs text-slate-500">Dedicated plans for Zumba, Yoga, CrossFit, and group sessions</p>
            </div>
            <button onClick={() => setIsPlanModalOpen(true)} className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white">
              <Plus className="inline size-3.5 mr-1" /> Create Class Plan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Plan Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Session Limit</th>
                  <th className="px-4 py-3">Active Subscribers</th>
                  <th className="px-4 py-3">Total Revenue</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {classPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">No class plans created yet. Click "Create Class Plan" above.</td>
                  </tr>
                ) : (
                  classPlans.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-700">{p.className} ({p.classCategory})</td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">{money(p.price)} / {p.billingPeriod.toLowerCase()}</td>
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
                <div key={day} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 min-h-[200px]">
                  <span className="font-extrabold text-xs uppercase text-slate-700 block border-b pb-1 mb-2">{day.slice(0, 3)}</span>
                  {dayClasses.map((item) => (
                    <div key={item.scheduleId} className="rounded-xl border border-slate-200 bg-white p-2 text-xs space-y-1 mb-2">
                      <div className="font-bold text-slate-900 flex justify-between">
                        <span>{item.className}</span>
                        <span className="text-[10px] text-blue-600 font-mono">{item.startTime.slice(0, 5)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Coach: {item.instructorName || "Gym Coach"}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Session Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bookingsList.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-bold text-slate-900">{b.memberName}</td>
                    <td className="px-4 py-3 text-slate-700">{b.className}</td>
                    <td className="px-4 py-3 font-mono">{new Date(b.sessionDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 font-bold text-[10px] uppercase border ${b.bookingStatus === "Attended" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => setSelectedSessionQrId(b.sessionId)} className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1">
                        <QrCode className="size-3" /> Session QR
                      </button>
                      {b.bookingStatus === "Booked" && (
                        <button onClick={() => statusMutation.mutate({ bookingId: b.bookingId, status: "Attended" })} className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">Mark Attended</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CLASS OUTSTANDING DUES */}
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
                          className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800"
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

      {/* CREATE CLASS PLAN MODAL */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <CreatePlanModal
            classes={classesList}
            onClose={() => setIsPlanModalOpen(false)}
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

function CreatePlanModal({
  classes,
  onClose,
  onSubmit,
  isPending
}: {
  classes: GymClass[];
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [name, setName] = useState("Zumba Premium");
  const [price, setPrice] = useState("999");
  const [billingPeriod, setBillingPeriod] = useState("Monthly");
  const [sessionLimit, setSessionLimit] = useState("12");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedAllowedIds, setSelectedAllowedIds] = useState<string[]>(classes[0] ? [classes[0].id] : []);

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
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Primary Class *</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border p-2.5 font-medium outline-none">
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zumba Premium" className="w-full rounded-xl border p-2.5 font-medium outline-none" required />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-xl border p-2 font-medium outline-none" min="0" required />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Billing Period</label>
              <select value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} className="w-full rounded-xl border p-2 font-medium outline-none">
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
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 font-bold text-slate-700">Cancel</button>
            <button type="submit" disabled={isPending} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-md disabled:opacity-50">
              {isPending ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </form>
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
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
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
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-xl border p-2.5 font-medium outline-none">
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2 text-xs">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border py-2 font-bold text-slate-700">Cancel</button>
          <button type="button" disabled={isPending} onClick={() => onSubmit(Number(amount), method)} className="flex-1 rounded-xl bg-slate-900 py-2 font-bold text-white shadow-md disabled:opacity-50">
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
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
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

            <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 font-bold text-xs text-white hover:bg-slate-800 shadow-md">
              <Printer className="size-4" /> Print Session QR Poster
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
