"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CreditCard,
  Landmark,
  QrCode,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { getDashboardSummary } from "@/src/services/dashboard.service";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export default function ReceptionistDashboardPage() {
  const summary = useQuery({
    queryKey: ["reception-summary"],
    queryFn: getDashboardSummary,
  });

  const data = summary.data;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              RECEPTIONIST OPERATIONAL DASHBOARD
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Front Desk & Check-In Operations
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage member check-ins, record payments, and register new members.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/member/scan"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <QrCode className="h-4 w-4 text-blue-600" />
              QR Scanner
            </Link>
            <Link
              href="/dashboard/attendance"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
            >
              <UserCheck className="h-4 w-4" />
              Manual Check-In
            </Link>
          </div>
        </div>

        {/* Operational Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Gym Members</span>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {summary.isLoading ? "..." : data?.totalMembers ?? 0}
            </p>
            <p className="text-[11px] font-medium text-slate-400">Enrolled members database</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Members</span>
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">
              {summary.isLoading ? "..." : data?.activeMembers ?? 0}
            </p>
            <p className="text-[11px] font-medium text-emerald-700">Valid membership access</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Today&apos;s Attendance</span>
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-600">
              {summary.isLoading ? "..." : data?.todaysAttendance ?? 0}
            </p>
            <p className="text-[11px] font-medium text-blue-700">Checked in today</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Revenue Collected</span>
              <Landmark className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {summary.isLoading ? "..." : formatMoney(data?.totalRevenue ?? 0)}
            </p>
            <p className="text-[11px] font-medium text-slate-400">Paid membership payments</p>
          </div>
        </div>

        {/* Reception Action Buttons */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider text-slate-400">
            Quick Reception Actions
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/members"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Register New Member</span>
                <span className="text-[11px] text-slate-500">Add member profile & assign plan</span>
              </div>
            </Link>

            <Link
              href="/dashboard/payments"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Record Payment</span>
                <span className="text-[11px] text-slate-500">Collect fees & generate receipt</span>
              </div>
            </Link>

            <Link
              href="/dashboard/attendance"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Manual Check-In</span>
                <span className="text-[11px] text-slate-500">Log member entry at reception</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Operational Feeds Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Members Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Recent Registrations</h3>
              <Link href="/dashboard/members" className="text-xs font-semibold text-blue-600 hover:underline">
                View all members →
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {data?.recentMembers && data.recentMembers.length > 0 ? (
                data.recentMembers.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">ID: {m.memberId}</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">No recent member registrations.</p>
              )}
            </div>
          </div>

          {/* Recent Payments Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Recent Payment Collections</h3>
              <Link href="/dashboard/payments" className="text-xs font-semibold text-blue-600 hover:underline">
                View all payments →
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {data?.recentPayments && data.recentPayments.length > 0 ? (
                data.recentPayments.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{formatMoney(Number(p.totalAmount))}</span>
                      <span className="text-[10px] text-slate-500">Method: {p.paymentMethod}</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {p.paymentStatus}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">No recent payment collections.</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
