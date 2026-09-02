"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Building2,
  ChevronRight,
  Flame,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";

export default function GymPulseEntryPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0F172A] font-extrabold text-sm text-white shadow-lg">
            GP
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#0F172A]">
              GymPulse
            </span>
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              SaaS Platform
            </span>
          </div>
        </div>

        <Link
          href="/create-account"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          Create Gym Account
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Main Role Selection Hero */}
      <section className="mx-auto my-auto w-full max-w-5xl py-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 border border-blue-200/80">
            <Sparkles className="h-3.5 w-3.5 fill-blue-600" />
            WELCOME TO GYMPULSE
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl">
            How do you want to continue?
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            Select your GymPulse experience below to access management or member portal.
          </p>
        </div>

        {/* 3D Role Selection Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* CARD 1: GYM MANAGEMENT */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-slate-900/5 blur-3xl pointer-events-none" />

            <div>
              {/* 3D Visual Floating Badge Container */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-slate-900 p-6 text-white overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Floating 3D Elements */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 left-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-md border border-white/20 shadow-lg text-xs font-semibold"
                >
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>342 Active Members</span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-md border border-white/20 shadow-lg text-xs font-semibold"
                >
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>₹98,500 Revenue</span>
                </motion.div>

                <div className="relative text-center z-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-2xl ring-4 ring-white/20">
                    <Building2 className="h-8 w-8 text-slate-900" />
                  </div>
                  <span className="mt-3 block text-xs font-bold tracking-wider text-slate-300 uppercase">
                    Gym Management SaaS
                  </span>
                </div>
              </div>

              <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight">
                Gym Management
              </h2>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                Manage your gym operations, members CRUD, attendance, subscriptions, revenue payments, and business analytics.
              </p>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors group-hover:shadow-lg"
              >
                <span>Continue as Management</span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* CARD 2: GYM MEMBER */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div>
              {/* 3D Visual Floating Badge Container */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-6 text-white overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Floating 3D Elements */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 right-4 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20 shadow-lg text-xs font-semibold text-emerald-300"
                >
                  <Flame className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>14 Day Streak</span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20 shadow-lg text-xs font-semibold text-blue-200"
                >
                  <QrCode className="h-4 w-4 text-blue-300" />
                  <span>Instant QR Check-In</span>
                </motion.div>

                <div className="relative text-center z-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-2xl ring-4 ring-white/20">
                    <Zap className="h-8 w-8 text-blue-600 fill-blue-600" />
                  </div>
                  <span className="mt-3 block text-xs font-bold tracking-wider text-blue-200 uppercase">
                    Mobile Fitness Companion
                  </span>
                </div>
              </div>

              <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight">
                Gym Member
              </h2>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                Access your digital member ID card, QR camera scanner, workout progress charts, attendance logs, and membership renewal.
              </p>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <a
                href="http://localhost:3002/member/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-colors group-hover:shadow-lg"
              >
                <span>Continue as Member</span>
                <ChevronRight className="h-4 w-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl py-4 text-center text-xs text-slate-400 font-medium">
        © {new Date().getFullYear()} GymPulse SaaS Platform. All rights reserved.
      </footer>
    </main>
  );
}
