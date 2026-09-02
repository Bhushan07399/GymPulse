"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Landmark, Users, CreditCard, Sparkles, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { getBusinessRevenueOverview, type BusinessRevenueOverview } from "@/src/services/class-plans.service";

const money = (val: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

export function BusinessRevenueOverviewCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["business-revenue-overview"],
    queryFn: () => getBusinessRevenueOverview(),
    retry: false,
    staleTime: 30000
  });

  if (isLoading || !data) {
    return <div className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />;
  }

  const { businessSummary, gymMetrics, classMetrics, revenueByClass } = data;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1 font-extrabold text-[10px] text-blue-700 border border-blue-200 uppercase tracking-wider">
            Combined Business Revenue
          </span>
          <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight mt-1">Total Revenue Overview</h2>
          <p className="text-xs text-slate-500 font-medium">Unified financial performance of Gym Memberships & Class Plans</p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium block">Total Business Revenue</span>
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{money(businessSummary.totalBusinessRevenue)}</span>
        </div>
      </div>

      {/* Two Business Branches: Gym vs Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch A: Gym Memberships */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Landmark className="h-4 w-4 text-slate-700" />
              Gym Membership Revenue
            </span>
            <span className="font-extrabold text-lg text-slate-900">{money(businessSummary.gymMembershipRevenue)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-slate-400 text-[10px]">Payments Recorded</span>
              <p className="font-bold text-slate-800">{gymMetrics.paymentCount} Receipts</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px]">Outstanding Dues</span>
              <p className="font-bold text-red-600">{money(gymMetrics.outstandingDues)}</p>
            </div>
          </div>
        </div>

        {/* Branch B: Fitness Classes */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-indigo-950 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Fitness Classes Revenue
            </span>
            <span className="font-extrabold text-lg text-indigo-900">{money(businessSummary.classRevenue)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-100">
            <div>
              <span className="text-indigo-600/70 text-[10px]">Active Class Members</span>
              <p className="font-bold text-indigo-950">{classMetrics.activeClassMembers} Members</p>
            </div>
            <div>
              <span className="text-indigo-600/70 text-[10px]">Outstanding Class Dues</span>
              <p className="font-bold text-red-600">{money(classMetrics.outstandingDues)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown by Class */}
      {revenueByClass.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Revenue Breakdown by Class</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {revenueByClass.map((item) => (
              <div key={item.classId} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-2xs space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{item.className}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.category}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs text-slate-500">{item.activeMembers} Members</span>
                  <span className="font-extrabold text-sm text-slate-900">{money(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
