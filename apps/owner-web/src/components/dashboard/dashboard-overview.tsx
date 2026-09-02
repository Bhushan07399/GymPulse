"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  CreditCard,
  Landmark,
  Layers,
  Plus,
  ReceiptText,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserRoundCheck,
  Wallet,
  Zap,
} from "lucide-react";

import { DashboardChartCard } from "@/src/components/dashboard/dashboard-chart-card";
import { getDashboardAnalytics, getDashboardSummary, type DashboardAnalyticsParams } from "@/src/services/dashboard.service";
import { listActiveMembershipPlans } from "@/src/services/membership-plans.service";
import { listMembers } from "@/src/services/members.service";
import type { Member } from "@/src/types/member";
import { getApiErrorMessage } from "@/src/utils/get-api-error-message";
import { MobileBottomSheet } from "@/src/components/ui/mobile-bottom-sheet";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));

function ClickableMetricCard({
  label,
  value,
  description,
  Icon,
  href,
  badgeText = "Live",
  badgeColor = "bg-[#F8FAFC] text-[#64748B]",
}: {
  label: string;
  value: string | number;
  description: string;
  Icon: any;
  href: string;
  badgeText?: string;
  badgeColor?: string;
}) {
  return (
    <Link href={href} className="block group">
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group relative rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)] transition-all hover:border-slate-400 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <span className="grid size-10 place-items-center rounded-xl bg-[#F1F5F9] text-[#334155] transition-colors group-hover:bg-slate-900 group-hover:text-white">
            <Icon className="size-5" strokeWidth={1.8} />
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeColor}`}>
              {badgeText}
            </span>
            <ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900" />
          </div>
        </div>
        <p className="mt-5 text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-[#0F172A]">{value}</p>
        <p className="mt-2 text-xs font-medium text-[#94A3B8]">{description}</p>
      </motion.article>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-5 py-11 text-center text-sm text-[#64748B]">{message}</p>;
}

function AttendanceChart({ attendance, activeMembers }: { attendance: number; activeMembers: number }) {
  const rate = activeMembers ? Math.min(Math.round((attendance / activeMembers) * 100), 100) : 0;
  return (
    <div className="flex min-h-56 items-center justify-center gap-7 rounded-xl bg-[#F8FAFC] px-5 sm:gap-10">
      <div className="relative grid size-32 place-items-center rounded-full" style={{ background: `conic-gradient(#334155 ${rate}%, #E2E8F0 ${rate}% 100%)` }}>
        <div className="grid size-[6.2rem] place-items-center rounded-full bg-white">
          <span className="text-2xl font-semibold tracking-[-0.05em] text-[#0F172A]">{rate}%</span>
        </div>
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-[-0.05em] text-[#0F172A]">{attendance}</p>
        <p className="mt-1 text-sm font-semibold text-[#334155]">Check-ins today</p>
        <p className="mt-2 max-w-32 text-xs leading-5 text-[#64748B]">of {activeMembers} active members</p>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const pathname = usePathname();
  const isDashboardOverview = pathname === "/dashboard";

  const [activeSheet, setActiveSheet] = useState<"revenue" | "members" | "attendance" | "classes" | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<DashboardAnalyticsParams["period"]>("this_month");

  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary, enabled: isDashboardOverview });
  const plans = useQuery({ queryKey: ["membership-plans", "active"], queryFn: listActiveMembershipPlans, enabled: isDashboardOverview });
  const members = useQuery({ queryKey: ["dashboard-members"], queryFn: () => listMembers({ page: 1, limit: 100, sortBy: "expiryDate", order: "asc", status: "active" }), enabled: isDashboardOverview });

  const revenueSheetQuery = useQuery({
    queryKey: ["mobile-revenue-sheet", revenuePeriod],
    queryFn: () => getDashboardAnalytics({ period: revenuePeriod }),
    enabled: activeSheet === "revenue",
  });

  if (summary.isLoading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((key) => <div key={key} className="h-40 animate-pulse rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF]" />)}</div>;
  if (summary.isError) return <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-[#EF4444]">{getApiErrorMessage(summary.error)}</div>;
  if (!summary.data) return null;

  const data = summary.data;
  const hasClassFeature = data.hasClassFeature !== false;
  const activeMembersList = members.data?.members ?? [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const expiring = activeMembersList.filter((member: Member) => { const expiry = new Date(`${member.expiryDate}T00:00:00`); const days = Math.ceil((expiry.getTime() - now.getTime()) / 86400000); return days >= 0 && days <= 7; }).slice(0, 4);
  const planName = (planId: string) => plans.data?.find((plan) => plan.id === planId)?.planName ?? "Membership plan";

  const gymData = data.gymMemberships ?? {
    totalMembers: data.totalMembers,
    activeMembers: data.activeMembers,
    expiredMembers: data.expiredMembers,
    todaysAttendance: data.todaysAttendance,
    revenue: data.totalRevenue,
    newJoinings: 0,
    membersLeft: 0,
    totalOutstanding: data.totalOutstanding,
  };

  const classData = data.classes;
  const businessData = data.business ?? {
    gymMembershipRevenue: gymData.revenue,
    classRevenue: classData?.revenue ?? 0,
    totalBusinessRevenue: gymData.revenue + (classData?.revenue ?? 0),
  };

  const totalBusinessRev = businessData.totalBusinessRevenue;
  const gymRev = businessData.gymMembershipRevenue;
  const classRev = businessData.classRevenue;
  const todayStr = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="mx-auto max-w-7xl space-y-8 lg:space-y-9">
      {/* ========================================================= */}
      {/* MOBILE DASHBOARD VIEW (lg:hidden)                          */}
      {/* ========================================================= */}
      <div className="space-y-6 lg:hidden">
        {/* Mobile Header Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GYMPULSE MANAGEMENT</p>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Your Gym Snapshot</h1>
            <p className="text-xs text-slate-500 font-medium">{todayStr}</p>
          </div>
          <span className="grid size-9 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 font-bold border border-blue-200">
            <Zap className="size-4" />
          </span>
        </div>

        {/* 1. Today's Compact 4-Cell Overview */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <p className="text-[10px] font-extrabold tracking-wider uppercase text-slate-600 border-b border-slate-100 pb-2">
            Today's Overview
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">Members</span>
              <span className="text-base font-extrabold text-slate-900 block">{gymData.totalMembers}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">Active</span>
              <span className="text-base font-extrabold text-emerald-600 block">{gymData.activeMembers}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">Check-ins</span>
              <span className="text-base font-extrabold text-blue-600 block">{gymData.todaysAttendance}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">Due</span>
              <span className="text-base font-extrabold text-amber-600 block">{formatMoney(gymData.totalOutstanding)}</span>
            </div>
          </div>
        </div>

        {/* 2. Gym Memberships Compact Operational Card (Interactive Taps) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-slate-900" />
              <h2 className="text-sm font-extrabold text-slate-900">GYM MEMBERSHIPS</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveSheet("members")}
              className="text-left rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1 active:bg-slate-100 transition"
            >
              <span className="text-[10px] font-bold text-slate-600 block">Enrolled Members</span>
              <p className="text-base font-extrabold text-slate-900">{gymData.totalMembers} Total ({gymData.activeMembers} Active)</p>
              <span className="text-[9px] font-bold text-blue-600 block">Tap for Summary →</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet("revenue")}
              className="text-left rounded-2xl bg-emerald-50/60 p-3 border border-emerald-100 space-y-1 active:bg-emerald-100 transition"
            >
              <span className="text-[10px] font-bold text-emerald-800 block">Gym Revenue (Month)</span>
              <p className="text-base font-extrabold text-emerald-950">{formatMoney(gymData.revenue)}</p>
              <span className="text-[9px] font-bold text-emerald-700 block">Tap for Breakdown →</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-1">
            <button
              type="button"
              onClick={() => setActiveSheet("members")}
              className="rounded-xl bg-blue-50 p-2 text-blue-700 border border-blue-100 active:bg-blue-100"
            >
              +{gymData.newJoinings} New
            </button>
            <button
              type="button"
              onClick={() => setActiveSheet("members")}
              className="rounded-xl bg-rose-50 p-2 text-rose-700 border border-rose-100 active:bg-rose-100"
            >
              {gymData.membersLeft} Left
            </button>
            <button
              type="button"
              onClick={() => setActiveSheet("attendance")}
              className="rounded-xl bg-slate-100 p-2 text-slate-700 border border-slate-200 active:bg-slate-200"
            >
              {gymData.todaysAttendance} Check-in
            </button>
          </div>
        </div>

        {/* 3. Classes Compact Card (Only when enabled) */}
        {hasClassFeature && classData && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-blue-600" />
                <h2 className="text-sm font-extrabold text-slate-900">CLASSES & GROUP SESSIONS</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
                Active
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveSheet("classes")}
              className="w-full text-left rounded-2xl bg-blue-50/50 p-3 border border-blue-100 space-y-2 active:bg-blue-100 transition"
            >
              <div className="grid grid-cols-4 gap-1 text-center">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">Classes</span>
                  <span className="text-sm font-extrabold text-slate-900">{classData.activeClasses}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">Today</span>
                  <span className="text-sm font-extrabold text-slate-900">{classData.todaysSessions}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">Live</span>
                  <span className="text-sm font-extrabold text-emerald-600">{classData.liveSessions}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block">Revenue</span>
                  <span className="text-sm font-extrabold text-blue-700">{formatMoney(classData.revenue)}</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-blue-700 block text-right">Tap for Class Details →</span>
            </button>
          </div>
        )}

        {/* 4. Quick Action Chips */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Quick Actions</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold text-slate-800">
            <Link href="/dashboard/members" className="flex items-center gap-1.5 shrink-0 rounded-2xl bg-slate-900 text-white px-3.5 py-2.5 shadow-xs">
              <Plus className="size-3.5" /> Add Member
            </Link>
            <Link href="/dashboard/payments" className="flex items-center gap-1.5 shrink-0 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs">
              <CreditCard className="size-3.5 text-slate-600" /> Record Payment
            </Link>
            <Link href="/dashboard/attendance" className="flex items-center gap-1.5 shrink-0 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs">
              <CalendarDays className="size-3.5 text-slate-600" /> Check In
            </Link>
            {hasClassFeature && (
              <Link href="/dashboard/classes" className="flex items-center gap-1.5 shrink-0 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-2.5 shadow-2xs">
                <Zap className="size-3.5" /> Group Classes
              </Link>
            )}
          </div>
        </div>

        {/* 5. Business Performance Summary Card */}
        <div className="rounded-3xl border border-slate-200 bg-[#0F172A] p-5 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 block">Monthly Performance</span>
              <h2 className="text-base font-extrabold text-white">Business Summary</h2>
            </div>
            <Link href="/dashboard/business-analytics" className="inline-flex items-center gap-1 rounded-xl bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-300 border border-blue-400/30">
              <TrendingUp className="size-3.5" /> View Analytics
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <div className="rounded-2xl bg-slate-800/80 p-3">
              <span className="text-slate-400 text-[10px] block">Month Revenue</span>
              <span className="text-base font-extrabold text-white mt-0.5 block">{formatMoney(totalBusinessRev)}</span>
            </div>
            <div className="rounded-2xl bg-slate-800/80 p-3">
              <span className="text-slate-400 text-[10px] block">Net Growth</span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">+{gymData.newJoinings} Net</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP DASHBOARD VIEW (hidden lg:block - UNCHANGED)        */}
      {/* ========================================================= */}
      <div className="hidden lg:block space-y-8 lg:space-y-9">
        {/* 1. Premium Fitness Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute inset-0 opacity-30">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop"
              alt="Gym Background"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-extrabold text-blue-300 border border-blue-400/30">
                <Sparkles className="size-3.5 fill-blue-300" /> GYMPULSE ENTERPRISE
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your gym, at a glance.</h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
                Real-time operational view of member activity, entrance check-ins, and current month collections.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/business-analytics" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-slate-700 shrink-0">
                <TrendingUp className="size-4" /> Full Analytics
              </Link>
              <Link href="/dashboard/members" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-slate-900 shadow-lg transition hover:bg-slate-100 shrink-0">
                <Plus className="size-4" /> Add Member
              </Link>
            </div>
          </div>
        </section>

        {/* 2. TOTAL BUSINESS REVENUE SUMMARY BANNER (THIS MONTH) */}
        <section className="rounded-3xl border border-slate-200 bg-[#0F172A] p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                <Landmark className="size-6" />
              </span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 block">Monthly Performance Snapshot</span>
                <h2 className="text-xl font-extrabold text-white tracking-tight">TOTAL BUSINESS REVENUE (THIS MONTH)</h2>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-white tracking-tight">{formatMoney(totalBusinessRev)}</span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {hasClassFeature ? "Current Month Gym + Classes Revenue" : "Current Month Membership Revenue"}
              </p>
            </div>
          </div>

          <div className={`grid gap-3 ${hasClassFeature ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            <Link href="/dashboard/payments" className="group flex items-center justify-between rounded-2xl bg-slate-800/80 p-4 border border-slate-700/60 transition hover:bg-slate-800">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Wallet className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Gym Membership Revenue (This Month)</p>
                  <p className="text-lg font-bold text-white mt-0.5">{formatMoney(gymRev)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">View History</span>
                <ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </Link>

            {hasClassFeature && classData && (
              <Link href="/dashboard/classes" className="group flex items-center justify-between rounded-2xl bg-slate-800/80 p-4 border border-slate-700/60 transition hover:bg-slate-800">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Classes Revenue (This Month)</p>
                    <p className="text-lg font-bold text-blue-400 mt-0.5">{formatMoney(classRev)}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            )}
          </div>
        </section>

        {/* 3. GYM MEMBERSHIPS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-slate-900 text-white">
                <Users className="size-4" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">GYM MEMBERSHIPS</h2>
                <p className="text-xs text-slate-500 font-medium">Current active member stats and this month's operations</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ClickableMetricCard
              label="Total Members"
              value={gymData.totalMembers}
              description="Total gym membership records"
              Icon={Users}
              href="/dashboard/members"
              badgeText="Live"
            />

            <ClickableMetricCard
              label="Active Members"
              value={gymData.activeMembers}
              description="Currently active & unexpired"
              Icon={UserRoundCheck}
              href="/dashboard/members"
              badgeText="Active"
              badgeColor="bg-emerald-50 text-emerald-700"
            />

            <ClickableMetricCard
              label="Today's Gym Attendance"
              value={gymData.todaysAttendance}
              description="Check-ins today"
              Icon={CalendarDays}
              href="/dashboard/attendance"
              badgeText="Today"
            />

            <ClickableMetricCard
              label="Gym Revenue (This Month)"
              value={formatMoney(gymData.revenue)}
              description="Current month collections"
              Icon={Landmark}
              href="/dashboard/payments"
              badgeText="This Month"
              badgeColor="bg-emerald-50 text-emerald-700"
            />

            <ClickableMetricCard
              label="New Joinings (This Month)"
              value={gymData.newJoinings}
              description="Enrolled this month"
              Icon={UserPlus}
              href="/dashboard/members"
              badgeText="This Month"
              badgeColor="bg-blue-50 text-blue-700"
            />

            <ClickableMetricCard
              label="Members Left (This Month)"
              value={gymData.membersLeft}
              description="Cancelled/left this month"
              Icon={UserMinus}
              href="/dashboard/members"
              badgeText="Attrited"
              badgeColor="bg-rose-50 text-rose-700"
            />

            <ClickableMetricCard
              label="Outstanding Membership"
              value={formatMoney(gymData.totalOutstanding)}
              description="Current pending dues"
              Icon={AlertTriangle}
              href="/dashboard/payments"
              badgeText="Pending Dues"
              badgeColor="bg-amber-50 text-amber-800"
            />
          </div>
        </section>

        {/* 4. CLASSES & GROUP SESSIONS SECTION (ONLY WHEN ENABLED) */}
        {hasClassFeature && classData && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-blue-600 text-white">
                  <Zap className="size-4" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">CLASSES & GROUP SESSIONS</h2>
                  <p className="text-xs text-slate-500 font-medium">Zumba, Yoga, CrossFit & group fitness operations</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 border border-blue-200">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" /> Live
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <ClickableMetricCard
                label="Active Classes"
                value={classData.activeClasses}
                description="Active group fitness classes"
                Icon={Layers}
                href="/dashboard/classes"
                badgeText="Classes"
              />

              <ClickableMetricCard
                label="Today's Sessions"
                value={classData.todaysSessions}
                description="Scheduled for today"
                Icon={Calendar}
                href="/dashboard/classes"
                badgeText="Schedule"
              />

              <ClickableMetricCard
                label="Live Sessions"
                value={classData.liveSessions}
                description="Currently in session right now"
                Icon={Clock}
                href="/dashboard/classes"
                badgeText={classData.liveSessions > 0 ? "Live Now" : "Upcoming"}
                badgeColor={classData.liveSessions > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}
              />

              <ClickableMetricCard
                label="Class Members"
                value={classData.classMembers}
                description="Enrolled class participants"
                Icon={UserCheck}
                href="/dashboard/classes"
                badgeText="Enrolled"
              />

              <ClickableMetricCard
                label="Class Revenue (This Month)"
                value={formatMoney(classData.revenue)}
                description="Current month class payments"
                Icon={CreditCard}
                href="/dashboard/classes"
                badgeText="This Month"
                badgeColor="bg-blue-50 text-blue-700"
              />
            </div>
          </section>
        )}

        {/* 5. Outstanding Payments Alert Section */}
        {data.totalOutstanding > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold text-amber-950 text-lg">Outstanding Payments Due</h2>
                  <p className="text-xs text-amber-700 font-medium">
                    {data.outstandingMembersCount} member(s) have a pending membership balance.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">Total Due</span>
                  <span className="text-xl font-extrabold text-amber-900">{formatMoney(data.totalOutstanding)}</span>
                </div>
                <Link href="/dashboard/payments" className="rounded-xl bg-amber-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-800">
                  Manage Payments
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.outstandingMembers.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-3.5 border border-amber-200/80 shadow-2xs">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{item.firstName} {item.lastName}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.memberId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-red-600 block">{formatMoney(item.remainingAmount)}</span>
                    <span className="text-[10px] text-slate-500">Paid {formatMoney(item.paidAmount)} / {formatMoney(item.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Attendance Overview & Quick Actions */}
        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <DashboardChartCard title="Gym Attendance overview" description="Today’s entrance check-in rate across active memberships">
            <AttendanceChart attendance={data.todaysAttendance} activeMembers={data.activeMembers} />
          </DashboardChartCard>

          <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)] sm:p-6">
            <h2 className="font-semibold tracking-[-0.02em] text-[#0F172A]">Quick actions</h2>
            <p className="mt-1 text-sm text-[#64748B]">Move through daily operational tasks faster.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { label: "View Business Analytics & Trends", href: "/dashboard/business-analytics", icon: TrendingUp },
                { label: "Add new gym member", href: "/dashboard/members", icon: Users },
                { label: "Record gym attendance", href: "/dashboard/attendance", icon: CalendarDays },
                { label: "Record gym payment", href: "/dashboard/payments", icon: CreditCard },
                ...(hasClassFeature ? [{ label: "Manage group classes", href: "/dashboard/classes", icon: Zap }] : [])
              ].map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href} className="group flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#334155] transition hover:border-[#94A3B8] hover:bg-[#F8FAFC]">
                  <span className="flex items-center gap-3">
                    <Icon className="size-4 text-[#64748B]" />
                    {label}
                  </span>
                  <ChevronRight className="size-4 text-[#94A3B8] transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </article>
        </section>

        {/* 7. Recent Members & Expiry Tables */}
        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <article className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_5px_rgba(15,23,42,0.025)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-semibold tracking-[-0.02em] text-[#0F172A]">Recent gym members</h2>
                <p className="mt-1 text-sm text-[#64748B]">Newest additions to your gym</p>
              </div>
              <Link href="/dashboard/members" className="inline-flex items-center gap-1 text-sm font-semibold text-[#475569] hover:text-[#0F172A]">
                View all <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-5 py-3 sm:px-6">Member</th>
                    <th className="px-5 py-3">Membership</th>
                    <th className="px-5 py-3">Join date</th>
                    <th className="px-5 py-3 sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {data.recentMembers.length ? (
                    data.recentMembers.map((member) => (
                      <tr key={member.id} className="transition-colors hover:bg-[#F8FAFC]">
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#E2E8F0] text-xs font-bold text-[#334155]">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                            <div>
                              <p className="font-semibold text-[#0F172A]">{member.firstName} {member.lastName}</p>
                              <p className="mt-0.5 text-xs text-[#64748B]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-[#475569]">{planName(member.membershipPlanId)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-[#64748B]">{formatDate(member.joinDate)}</td>
                        <td className="px-5 py-4 sm:px-6">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.isActive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#E2E8F0] text-[#475569]"}`}>
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}><EmptyState message="No members have been added yet." /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold tracking-[-0.02em] text-[#0F172A]">Upcoming expiries</h2>
                <p className="mt-1 text-sm text-[#64748B]">Due within the next 7 days</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-[#F1F5F9] text-[#475569]">
                <Activity className="size-4" />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {members.isLoading ? (
                <div className="h-28 animate-pulse rounded-xl bg-[#F8FAFC]" />
              ) : expiring.length ? (
                expiring.map((member: Member) => {
                  const days = Math.ceil((new Date(`${member.expiryDate}T00:00:00`).getTime() - now.getTime()) / 86400000);
                  return (
                    <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-3 transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">{member.firstName} {member.lastName}</p>
                        <p className="mt-1 text-xs text-[#64748B]">Expires {shortDate(member.expiryDate)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-[#B45309]">{days === 0 ? "Today" : `${days}d left`}</p>
                        <Link href="/dashboard/members" className="mt-1 inline-flex text-xs font-semibold text-[#334155] hover:text-[#0F172A]">
                          Renew <ArrowUpRight className="ml-0.5 size-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-9 text-center text-sm text-[#64748B]">
                  No active memberships expiring in the next 7 days.
                </div>
              )}
            </div>
          </article>
        </section>

        {/* 8. Recent Payments */}
        <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_5px_rgba(15,23,42,0.025)]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-[#0F172A]">Recent gym payments</h2>
              <p className="mt-1 text-sm text-[#64748B]">Latest membership payment activity</p>
            </div>
            <ReceiptText className="size-5 text-[#94A3B8]" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Method</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right sm:px-6">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {data.recentPayments.length ? (
                  data.recentPayments.map((payment) => (
                    <tr key={payment.id} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-5 py-4 font-semibold text-[#0F172A] sm:px-6">{payment.paymentMethod}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-[#64748B]">{formatDate(payment.paymentDate)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#475569]">
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[#0F172A] sm:px-6">{formatMoney(payment.totalAmount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}><EmptyState message="No payment activity yet." /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* MOBILE INTERACTIVE BOTTOM SHEETS                          */}
      {/* ========================================================= */}

      {/* REVENUE BOTTOM SHEET */}
      <MobileBottomSheet
        isOpen={activeSheet === "revenue"}
        onClose={() => setActiveSheet(null)}
        title="Gym Revenue Breakdown"
        subtitle="Current collections & multi-period financial inspection"
      >
        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-800 p-1.5 text-xs font-bold text-slate-300">
          {[
            { id: "today", label: "Today" },
            { id: "this_week", label: "This Week" },
            { id: "this_month", label: "This Month" },
            { id: "last_month", label: "Last Month" },
            { id: "this_year", label: "This Year" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRevenuePeriod(item.id as any)}
              className={`rounded-xl px-3 py-1.5 transition ${
                revenuePeriod === item.id ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-700 text-slate-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Breakdown Stats */}
        {revenueSheetQuery.isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-800" />
        ) : revenueSheetQuery.data?.kpis ? (
          <div className="space-y-3 pt-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">
                {(revenuePeriod ?? "this_month").replace("_", " ")} Revenue
              </span>
              <p className="text-3xl font-extrabold text-white">
                {formatMoney(revenueSheetQuery.data.kpis.revenueCollected)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {revenueSheetQuery.data.kpis.paymentCount} successful payment transaction(s)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl bg-slate-800/80 p-3 border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Membership Dues Pending</span>
                <span className="text-sm font-extrabold text-amber-400 mt-0.5 block">
                  {formatMoney(gymData.totalOutstanding)}
                </span>
              </div>
              <div className="rounded-2xl bg-slate-800/80 p-3 border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">All-Time Gym Revenue</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">
                  {formatMoney(gymData.totalRevenue ?? gymData.revenue)}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="pt-2">
          <Link
            href="/dashboard/payments"
            onClick={() => setActiveSheet(null)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-3 text-xs font-bold text-white hover:bg-blue-500 transition"
          >
            View Full Payment History →
          </Link>
        </div>
      </MobileBottomSheet>

      {/* MEMBERS BOTTOM SHEET */}
      <MobileBottomSheet
        isOpen={activeSheet === "members"}
        onClose={() => setActiveSheet(null)}
        title="Gym Members Overview"
        subtitle="Current member enrollment & monthly activity"
      >
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-blue-300">Total Enrolled</span>
              <p className="text-2xl font-extrabold text-white">{gymData.totalMembers}</p>
              <p className="text-[10px] text-slate-400">Total membership records</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400">Active Unexpired</span>
              <p className="text-2xl font-extrabold text-emerald-400">{gymData.activeMembers}</p>
              <p className="text-[10px] text-slate-400">Active members</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div className="rounded-2xl bg-slate-800 p-3 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">New This Month</span>
              <span className="text-sm font-extrabold text-blue-400 mt-1 block">+{gymData.newJoinings}</span>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Left This Month</span>
              <span className="text-sm font-extrabold text-rose-400 mt-1 block">{gymData.membersLeft}</span>
            </div>
            <div className="rounded-2xl bg-slate-800 p-3 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Expired Dues</span>
              <span className="text-sm font-extrabold text-amber-400 mt-1 block">{gymData.expiredMembers}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/members"
              onClick={() => setActiveSheet(null)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-3 text-xs font-bold text-slate-900 hover:bg-slate-100 transition"
            >
              View Full Member List →
            </Link>
          </div>
        </div>
      </MobileBottomSheet>

      {/* ATTENDANCE BOTTOM SHEET */}
      <MobileBottomSheet
        isOpen={activeSheet === "attendance"}
        onClose={() => setActiveSheet(null)}
        title="Today's Gym Attendance"
        subtitle="Entrance check-in logs & active member participation"
      >
        <div className="space-y-4 pt-1">
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-center space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-blue-300 tracking-wider">Checked In Today</span>
            <p className="text-4xl font-extrabold text-white">{gymData.todaysAttendance}</p>
            <p className="text-xs text-slate-300 font-medium pt-1">
              out of {gymData.activeMembers} active members
            </p>
          </div>

          <div className="pt-1">
            <Link
              href="/dashboard/attendance"
              onClick={() => setActiveSheet(null)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-3 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              Manage Entrance Check-ins →
            </Link>
          </div>
        </div>
      </MobileBottomSheet>

      {/* CLASSES BOTTOM SHEET (WHEN ENABLED) */}
      {hasClassFeature && classData && (
        <MobileBottomSheet
          isOpen={activeSheet === "classes"}
          onClose={() => setActiveSheet(null)}
          title="Classes & Group Sessions"
          subtitle="Group fitness classes, today's schedule & session revenue"
        >
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl bg-slate-800 p-3.5 border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Active Classes</span>
                <span className="text-xl font-extrabold text-white mt-1 block">{classData.activeClasses}</span>
              </div>
              <div className="rounded-2xl bg-slate-800 p-3.5 border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Today's Sessions</span>
                <span className="text-xl font-extrabold text-white mt-1 block">{classData.todaysSessions}</span>
              </div>
              <div className="rounded-2xl bg-slate-800 p-3.5 border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Live Now</span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{classData.liveSessions}</span>
              </div>
              <div className="rounded-2xl bg-slate-800 p-3.5 border border-slate-700">
                <span className="text-slate-400 text-[10px] block">Class Revenue (Month)</span>
                <span className="text-xl font-extrabold text-blue-400 mt-1 block">{formatMoney(classData.revenue)}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/classes"
                onClick={() => setActiveSheet(null)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-3 text-xs font-bold text-white hover:bg-blue-500 transition"
              >
                View Full Classes Module →
              </Link>
            </div>
          </div>
        </MobileBottomSheet>
      )}
    </motion.div>
  );
}
