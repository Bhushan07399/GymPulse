"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowRight, Sparkles } from "lucide-react";
import { apiClient, AUTH_TOKEN_KEY } from "@/src/lib/api-client";
import { AUTH_ROLE_KEY } from "@/src/lib/subscription-state";

export default function CreateAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    gymName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/auth/create-gym-account", payload);
      return res.data;
    },
    onSuccess: (res) => {
      const { token, owner } = res.data;
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(AUTH_ROLE_KEY, owner.role);
      toast.success("Gym Account created successfully!");
      router.replace("/dashboard");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? "Registration failed. Email may already be registered.";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Password and Confirmation do not match.");
      return;
    }

    createMutation.mutate({
      gymName: form.gymName,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      password: form.password,
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-slate-900 text-[10px] font-black text-white">
            GP
          </span>
          ← Back to Role Selection
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 border border-blue-200">
              <Sparkles className="h-3.5 w-3.5 fill-blue-600" />
              CREATE GYM WORKSPACE
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Register Your Gym on GymPulse
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Start managing members, attendance, memberships, and revenue in one platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Informational Trial Card */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-amber-500 text-[10px] font-black text-white shadow-sm">
                  3D
                </span>
                <span className="font-extrabold text-xs tracking-wider text-amber-950 uppercase">
                  3-DAY FREE TRIAL
                </span>
              </div>
              <p className="text-xs font-bold text-amber-900">
                Start managing your gym with Growth features. No payment required.
              </p>
              <p className="text-[11px] font-medium text-amber-800/90 leading-relaxed">
                After your trial, choose Growth, Pro, or Gym + Classes from Subscription.
              </p>
            </div>

            {/* Gym & Owner Details */}
            <div className="space-y-4 pt-2">
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider text-slate-400">
                Gym & Owner Information
              </h2>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Gym Name</label>
                <input
                  type="text"
                  placeholder="e.g. IronPulse Fitness Club"
                  value={form.gymName}
                  onChange={(e) => setForm({ ...form, gymName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Owner First Name</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Owner Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="owner@gympulse.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
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
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="400001"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Account Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-extrabold text-sm text-white hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating Gym Workspace..." : "Create Gym Workspace"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
