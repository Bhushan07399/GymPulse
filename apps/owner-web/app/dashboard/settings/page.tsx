"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Building2,
  Image as ImageIcon,
  Share2,
  Clock,
  Receipt,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Globe,
  Camera,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  getGymProfile,
  getGymSettings,
  saveGymProfile,
  saveGymSettings,
  defaultOperatingHours,
  type GymProfile,
  type GymSettings,
  type WeeklyOperatingHours,
  type OperatingDaySchedule,
} from "@/src/services/gym-settings.service";
import { getDashboardSummary } from "@/src/services/dashboard.service";
import { getEntitlements } from "@/src/lib/entitlements";
import { getMyGymLocations, switchGymLocation, type GymLocation } from "@/src/services/gym-locations.service";

type ActiveTab = "profile" | "subscription" | "locations" | "branding" | "social" | "hours" | "business" | "legal";

const inputStyle =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400";
const labelStyle = "block text-xs font-bold text-slate-700 uppercase tracking-wider";

const DAYS_OF_WEEK: Array<{ key: keyof WeeklyOperatingHours; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function GymSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const profileQuery = useQuery({
    queryKey: ["gym-profile"],
    queryFn: getGymProfile,
  });

  const settingsQuery = useQuery({
    queryKey: ["gym-settings"],
    queryFn: getGymSettings,
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const entitlements = getEntitlements(summaryQuery.data);

  const locationsQuery = useQuery<GymLocation[]>({
    queryKey: ["myGymLocations"],
    queryFn: getMyGymLocations,
    enabled: Boolean(entitlements.hasMultiGym),
  });

  const switchMutation = useMutation({
    mutationFn: switchGymLocation,
    onSuccess: () => {
      queryClient.invalidateQueries();
      window.location.reload();
    },
  });

  const [profileForm, setProfileForm] = useState<GymProfile | null>(null);
  const [settingsForm, setSettingsForm] = useState<GymSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync initial data from queries
  useEffect(() => {
    if (profileQuery.data && !profileForm) {
      setProfileForm(profileQuery.data);
    }
  }, [profileQuery.data, profileForm]);

  useEffect(() => {
    if (settingsQuery.data && !settingsForm) {
      setSettingsForm({
        ...settingsQuery.data,
        operating_hours: settingsQuery.data.operating_hours || defaultOperatingHours,
      });
    }
  }, [settingsQuery.data, settingsForm]);

  // Profile Save Mutation
  const saveProfileMutation = useMutation({
    mutationFn: saveGymProfile,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["gym-profile"] });
      setProfileForm(updated);
      setIsDirty(false);
      toast.success("Gym Profile updated successfully!");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to update gym profile.";
      toast.error(msg);
    },
  });

  // Settings Save Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: saveGymSettings,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["gym-settings"] });
      setSettingsForm(updated);
      setIsDirty(false);
      toast.success("Gym Settings updated successfully!");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to update gym settings.";
      toast.error(msg);
    },
  });

  // Helper for Logo Upload
  const handleLogoUpload = async (file: File) => {
    if (file.size > 2_000_000) {
      return toast.error("Gym Logo must be 2 MB or smaller.");
    }
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    if (profileForm) {
      setProfileForm({ ...profileForm, logoUrl: dataUrl });
      setIsDirty(true);
    }
  };

  // Helper for Cover Image Upload
  const handleCoverUpload = async (file: File) => {
    if (file.size > 2_000_000) {
      return toast.error("Cover image must be 2 MB or smaller.");
    }
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    if (profileForm) {
      setProfileForm({ ...profileForm, coverImageUrl: dataUrl });
      setIsDirty(true);
    }
  };

  // Operating Hours Change Helper
  const handleHourChange = (
    day: keyof WeeklyOperatingHours,
    field: keyof OperatingDaySchedule,
    value: boolean | string
  ) => {
    if (!settingsForm) return;
    const currentHours = settingsForm.operating_hours || defaultOperatingHours;
    const dayCurrent = currentHours[day] || { isOpen: true, openTime: "06:00", closeTime: "22:00" };

    const updatedHours: WeeklyOperatingHours = {
      ...currentHours,
      [day]: {
        ...dayCurrent,
        [field]: value,
      },
    };

    setSettingsForm({ ...settingsForm, operating_hours: updatedHours });
    setIsDirty(true);
  };

  // Save All Action
  const handleSaveAll = () => {
    if (profileForm) {
      saveProfileMutation.mutate(profileForm);
    }
    if (settingsForm) {
      saveSettingsMutation.mutate(settingsForm);
    }
  };

  const isLoading = profileQuery.isLoading || settingsQuery.isLoading;

  if (isLoading || !profileForm || !settingsForm) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <span>Loading Gym Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Management SaaS</span>
            {isDirty && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                <AlertCircle className="h-3 w-3" /> Unsaved Changes
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
            Gym Settings & Profile
          </h1>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saveProfileMutation.isPending || saveSettingsMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4 text-emerald-400" />
          <span>
            {saveProfileMutation.isPending || saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </span>
        </button>
      </div>

      {/* Navigation Tabs (Mobile Scrollable / Desktop Row) */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 no-scrollbar">
        {[
          { id: "profile", label: "Gym Profile", icon: Building2 },
          { id: "subscription", label: "Subscription", icon: ShieldCheck },
          { id: "locations", label: "Multi-Gym Locations", icon: MapPin },
          { id: "branding", label: "Branding & Media", icon: ImageIcon },
          { id: "social", label: "Contact & Social", icon: Share2 },
          { id: "hours", label: "Operating Hours", icon: Clock },
          { id: "business", label: "Business & Receipt", icon: Receipt },
          { id: "legal", label: "Legal & Policies", icon: FileText },
        ]
          .filter((tab) => tab.id !== "locations" || entitlements.hasMultiGym)
          .map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GYM PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-6">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">Gym Identity & Location</h2>
            <p className="text-xs font-medium text-slate-500">
              Basic gym profile details displayed to members and used across receipts.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelStyle}>Gym Display Name *</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, name: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. GymPulse Fitness Club"
              />
            </div>

            <div>
              <label className={labelStyle}>Owner / Management Name *</label>
              <input
                type="text"
                value={profileForm.ownerName}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, ownerName: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. Rajesh Sharma"
              />
            </div>

            <div>
              <label className={labelStyle}>Primary Contact Phone *</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, phone: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. +91 9876543210"
              />
            </div>

            <div>
              <label className={labelStyle}>Primary Contact Email *</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, email: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. info@gympulse.in"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelStyle}>Street Address *</label>
              <textarea
                rows={2}
                value={profileForm.address}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, address: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. Plot 42, Commercial Complex, Sector 18"
              />
            </div>

            <div>
              <label className={labelStyle}>City *</label>
              <input
                type="text"
                value={profileForm.city}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, city: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. Mumbai"
              />
            </div>

            <div>
              <label className={labelStyle}>State *</label>
              <input
                type="text"
                value={profileForm.state}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, state: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. Maharashtra"
              />
            </div>

            <div>
              <label className={labelStyle}>Country</label>
              <input
                type="text"
                value={profileForm.country || "India"}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, country: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
              />
            </div>

            <div>
              <label className={labelStyle}>Pincode (6-digit) *</label>
              <input
                type="text"
                value={profileForm.pincode}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, pincode: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. 400001"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelStyle}>Google Maps Location Link</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-5 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  value={profileForm.googleMapsUrl || ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, googleMapsUrl: e.target.value });
                    setIsDirty(true);
                  }}
                  className={`${inputStyle} pl-10`}
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={labelStyle}>About / Gym Description</label>
              <textarea
                rows={3}
                value={profileForm.description || ""}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, description: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="Tell members about your equipment, facilities, trainers, and fitness philosophy..."
              />
            </div>
          </div>
        </section>
        </div>
      )}

      {/* TAB: SUBSCRIPTION */}
      {activeTab === "subscription" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Gym Subscription & Plan Entitlement
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    View active plan tier, remaining duration, trial dates, and feature entitlement
                  </p>
                </div>
              </div>

              <Link
                href="/subscription"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
              >
                {summaryQuery.data?.isTrialActive || summaryQuery.data?.isTrialExpired || summaryQuery.data?.subscriptionStatus === "EXPIRED"
                  ? "Choose Subscription Plan"
                  : "Manage Subscription"}
              </Link>
            </div>

            {/* DYNAMIC SUBSCRIPTION DETAILS */}
            {summaryQuery.data?.isTrialActive && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white shadow-sm">
                      FREE TRIAL ACTIVE
                    </span>
                    <span className="text-xs font-extrabold text-amber-950">
                      {summaryQuery.data?.trialDaysRemaining === 1 ? "Ends Today" : `${summaryQuery.data?.trialDaysRemaining || 0} days remaining`}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-800">
                    Growth Plan (Trial Access)
                  </span>
                </div>

                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  Your 3-day free trial gives you full access to Growth Plan features (Gym Dashboard, Member Directory, Attendance, Payments, Receipts, and Reports). Pro features and Group Classes are locked during trial.
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-amber-200/60 pt-4 text-xs font-medium text-amber-950">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase block">Trial Started</span>
                    <span>{summaryQuery.data?.trialStartedAt ? new Date(summaryQuery.data.trialStartedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase block">Trial Ends</span>
                    <span>{summaryQuery.data?.trialEndsAt ? new Date(summaryQuery.data.trialEndsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

            {!summaryQuery.data?.isTrialActive && !summaryQuery.data?.isTrialExpired && summaryQuery.data?.subscriptionStatus === "ACTIVE" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-black text-white shadow-sm">
                      ACTIVE SUBSCRIPTION
                    </span>
                    <span className="text-xs font-extrabold text-emerald-950">
                      {summaryQuery.data?.subscriptionDaysRemaining ? `${summaryQuery.data.subscriptionDaysRemaining} days remaining` : "Active"}
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-900">
                    {summaryQuery.data?.subscriptionPlan || "Growth"} Plan
                    {summaryQuery.data?.isMultiGym ? ` · Multi-Gym (${summaryQuery.data?.maxLocations || 1} Locations)` : " · Single Gym"}
                  </span>
                </div>

                <p className="text-xs font-semibold text-emerald-900 leading-relaxed">
                  {summaryQuery.data?.subscriptionPlan === "Gym + Classes"
                    ? "Full Access Tier: Includes all Growth & Pro features plus Group Classes, Schedule Management, and Class Booking."
                    : summaryQuery.data?.subscriptionPlan === "Pro"
                    ? "Pro Access Tier: Includes all Growth features plus Staff Management, WhatsApp Automation, and Advanced Analytics."
                    : "Growth Access Tier: Includes Gym Dashboard, Member Management, Membership Plans, Attendance, Dues Tracking, Basic Reports, Owner Mobile & Member Mobile apps."}
                  {summaryQuery.data?.isMultiGym && (
                    <span className="block mt-1 text-emerald-800">
                      Multi-Gym Enabled: You can manage up to {summaryQuery.data?.maxLocations || 1} locations under this plan.
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-emerald-200/60 pt-4 text-xs font-medium text-emerald-950 sm:grid-cols-4">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Base Tier</span>
                    <span>{summaryQuery.data?.subscriptionPlan || "Growth"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Scale</span>
                    <span>{summaryQuery.data?.isMultiGym ? `Multi-Gym (${summaryQuery.data?.maxLocations || 1} Loc)` : "Single Gym"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Subscription Start</span>
                    <span>{summaryQuery.data?.subscriptionStartDate ? new Date(summaryQuery.data.subscriptionStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Renewal Date</span>
                    <span>{summaryQuery.data?.subscriptionEndDate ? new Date(summaryQuery.data.subscriptionEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

            {(summaryQuery.data?.isTrialExpired || summaryQuery.data?.subscriptionStatus === "EXPIRED") && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white shadow-sm">
                    SUBSCRIPTION EXPIRED
                  </span>
                  <span className="text-xs font-extrabold text-rose-900">
                    Access Locked
                  </span>
                </div>

                <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                  {summaryQuery.data?.isTrialExpired
                    ? "Your 3-day free trial has expired. Choose a subscription plan (Growth, Pro, or Gym + Classes) to restore full access to your gym dashboard features."
                    : "Your gym subscription has expired. Choose a subscription plan to restore full access to your dashboard."}
                </p>

                <div className="pt-2">
                  <Link
                    href="/subscription"
                    className="inline-flex items-center justify-center rounded-xl bg-rose-900 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-rose-950"
                  >
                    Choose Subscription Plan
                  </Link>
                </div>
              </div>
            )}

            {/* FEATURE COMPARISON MATRIX BRIEF */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider text-slate-400">
                GymPulse Customer Subscription Plans
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-1">
                  <span className="font-extrabold text-xs text-slate-900 block">Growth</span>
                  <span className="text-sm font-black text-slate-900 block">₹499 <span className="text-[10px] font-normal text-slate-500">/mo</span></span>
                  <p className="text-[11px] text-slate-500 font-medium pt-1">Core gym, members, payments, attendance & mobile apps.</p>
                </div>
                <div className="rounded-xl border border-blue-200 p-4 bg-blue-50/30 space-y-1">
                  <span className="font-extrabold text-xs text-blue-900 block">Pro</span>
                  <span className="text-sm font-black text-blue-900 block">₹999 <span className="text-[10px] font-normal text-slate-500">/mo</span></span>
                  <p className="text-[11px] text-slate-500 font-medium pt-1">Growth + Staff management, WhatsApp & Advanced analytics.</p>
                </div>
                <div className="rounded-xl border border-indigo-200 p-4 bg-indigo-50/30 space-y-1">
                  <span className="font-extrabold text-xs text-indigo-900 block">Gym + Classes</span>
                  <span className="text-sm font-black text-indigo-900 block">₹1,499 <span className="text-[10px] font-normal text-slate-500">/mo</span></span>
                  <p className="text-[11px] text-slate-500 font-medium pt-1">Pro + Group classes, schedules & class booking entitlement.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB: MULTI-GYM LOCATIONS */}
      {activeTab === "locations" && entitlements.hasMultiGym && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Multi-Gym Network Locations</h2>
              <p className="text-xs font-medium text-slate-500">
                Manage branch locations across your gym network. Plan capacity: {locationsQuery.data?.length || 1} / {entitlements.maxLocations} locations used.
              </p>
            </div>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition shrink-0"
            >
              Configure Subscription
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(locationsQuery.data || []).map((loc) => {
              const isCurrent = loc.isCurrent;
              return (
                <div
                  key={loc.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isCurrent ? "border-slate-900 bg-slate-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{loc.name}</span>
                        {isCurrent && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700">
                            Active Context
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="size-3 text-slate-400 inline" />
                        {loc.city || "Branch"} {loc.address ? `· ${loc.address}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold text-slate-600">
                      Status: <span className="text-emerald-700">{loc.subscriptionStatus}</span>
                    </span>
                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={switchMutation.isPending}
                        onClick={() => switchMutation.mutate(loc.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                      >
                        Switch To This Gym
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB: BRANDING & MEDIA */}
      {activeTab === "branding" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Gym Branding & Media</h2>
            <p className="text-xs font-medium text-slate-500">
              Upload your gym logo and cover banner image used in member apps and receipts.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Logo Upload Box */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-4">
              <label className={labelStyle}>Gym Logo (Max 2MB)</label>
              <div className="flex items-center gap-4">
                {profileForm.logoUrl ? (
                  <img
                    src={profileForm.logoUrl}
                    alt="Gym Logo Preview"
                    className="h-20 w-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 font-extrabold text-slate-600">
                    GP
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    id="logo-file-input"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  />
                  <label
                    htmlFor="logo-file-input"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>Upload Logo</span>
                  </label>
                  <p className="mt-1 text-[11px] text-slate-400">PNG, JPG or WEBP up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Cover Image Upload Box */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 space-y-4">
              <label className={labelStyle}>Gym Cover Image (Max 2MB)</label>
              {profileForm.coverImageUrl ? (
                <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-slate-200">
                  <img src={profileForm.coverImageUrl} alt="Cover Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-400">
                  No Cover Image Uploaded
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  id="cover-file-input"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                />
                <label
                  htmlFor="cover-file-input"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  <span>Upload Cover Image</span>
                </label>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: CONTACT & SOCIAL */}
      {activeTab === "social" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Contact Channels & Social Media</h2>
            <p className="text-xs font-medium text-slate-500">
              Provide social links and WhatsApp numbers used in member communications.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelStyle}>WhatsApp Business Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-5 h-4 w-4 text-emerald-600" />
                <input
                  type="text"
                  value={profileForm.whatsappNumber || ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, whatsappNumber: e.target.value });
                    setIsDirty(true);
                  }}
                  className={`${inputStyle} pl-10`}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Secondary Management Contact</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={profileForm.managementContact || ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, managementContact: e.target.value });
                    setIsDirty(true);
                  }}
                  className={`${inputStyle} pl-10`}
                  placeholder="e.g. Desk: 022-24900000"
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Instagram Profile Link</label>
              <div className="relative">
                <Camera className="absolute left-3.5 top-5 h-4 w-4 text-pink-500" />
                <input
                  type="url"
                  value={profileForm.instagramUrl || ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, instagramUrl: e.target.value });
                    setIsDirty(true);
                  }}
                  className={`${inputStyle} pl-10`}
                  placeholder="https://instagram.com/yourgym"
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Facebook Page Link</label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-5 h-4 w-4 text-blue-600" />
                <input
                  type="url"
                  value={profileForm.facebookUrl || ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, facebookUrl: e.target.value });
                    setIsDirty(true);
                  }}
                  className={`${inputStyle} pl-10`}
                  placeholder="https://facebook.com/yourgym"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={labelStyle}>Official Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-5 h-4 w-4 text-slate-500" />
                <input
                  type="url"
                  value={profileForm.websiteUrl || ""}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, websiteUrl: e.target.value });
                    setIsDirty(true);
                  }}
                  className={`${inputStyle} pl-10`}
                  placeholder="https://www.yourgymname.com"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: OPERATING HOURS */}
      {activeTab === "hours" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Gym Operating Hours</h2>
              <p className="text-xs font-medium text-slate-500">
                Configure opening and closing times for each day of the week.
              </p>
            </div>
            <span className="mt-2 sm:mt-0 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Timezone: {settingsForm.timezone || "Asia/Kolkata"} (India IST)
            </span>
          </div>

          <div className="space-y-3">
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const schedule =
                settingsForm.operating_hours?.[key] || {
                  isOpen: true,
                  openTime: "06:00",
                  closeTime: "22:00",
                };

              return (
                <div
                  key={key}
                  className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border p-4 transition-all ${
                    schedule.isOpen ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/70 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 w-36">
                    <input
                      type="checkbox"
                      checked={schedule.isOpen}
                      onChange={(e) => handleHourChange(key, "isOpen", e.target.checked)}
                      className="h-4 w-4 rounded text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-bold text-sm text-slate-900">{label}</span>
                  </div>

                  {schedule.isOpen ? (
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Opens</span>
                        <input
                          type="time"
                          value={schedule.openTime}
                          onChange={(e) => handleHourChange(key, "openTime", e.target.value)}
                          className="mt-0.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <span className="text-slate-300 font-bold text-xs mt-3">—</span>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Closes</span>
                        <input
                          type="time"
                          value={schedule.closeTime}
                          onChange={(e) => handleHourChange(key, "closeTime", e.target.value)}
                          className="mt-0.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closed All Day</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 5: BUSINESS & RECEIPT */}
      {activeTab === "business" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Business & Receipt Invoice Info</h2>
            <p className="text-xs font-medium text-slate-500">
              Tax, legal details, and receipt printing options for membership payments.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelStyle}>Legal Registered Business Name</label>
              <input
                type="text"
                value={profileForm.legalName || ""}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, legalName: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. GymPulse Fitness Services Private Limited"
              />
            </div>

            <div>
              <label className={labelStyle}>GSTIN (GST Number - Optional)</label>
              <input
                type="text"
                value={profileForm.gstNumber || ""}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, gstNumber: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. 27AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className={labelStyle}>Default Payment Method</label>
              <select
                value={settingsForm.default_payment_method}
                onChange={(e) => {
                  setSettingsForm({
                    ...settingsForm,
                    default_payment_method: e.target.value as any,
                  });
                  setIsDirty(true);
                }}
                className={inputStyle}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className={labelStyle}>Default Membership Duration (Days)</label>
              <input
                type="number"
                value={settingsForm.default_membership_duration}
                onChange={(e) => {
                  setSettingsForm({
                    ...settingsForm,
                    default_membership_duration: Number(e.target.value),
                  });
                  setIsDirty(true);
                }}
                className={inputStyle}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelStyle}>Receipt Header Text</label>
              <input
                type="text"
                value={settingsForm.receipt_header || ""}
                onChange={(e) => {
                  setSettingsForm({ ...settingsForm, receipt_header: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. Official Payment Invoice"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelStyle}>Receipt Footer Notes & Terms</label>
              <textarea
                rows={2}
                value={settingsForm.receipt_footer || ""}
                onChange={(e) => {
                  setSettingsForm({ ...settingsForm, receipt_footer: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="e.g. Fees once paid are non-refundable. Keep this receipt for gym entrance verification."
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Receipt Display Toggles
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "show_gym_logo", label: "Display Gym Logo on Invoice" },
                { key: "show_gst", label: "Display GSTIN on Invoice" },
                { key: "show_address", label: "Display Full Address on Invoice" },
                { key: "show_contact_number", label: "Display Contact Phone on Invoice" },
                { key: "auto_generate_member_id", label: "Auto-Generate Member ID" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={(settingsForm as any)[key]}
                    onChange={(e) => {
                      setSettingsForm({ ...settingsForm, [key]: e.target.checked } as GymSettings);
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 6: LEGAL & POLICIES */}
      {activeTab === "legal" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Legal Terms & Member Policies</h2>
            <p className="text-xs font-medium text-slate-500">
              Terms of service and privacy guidelines shown to members.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelStyle}>Gym Rules & Terms and Conditions</label>
              <textarea
                rows={5}
                value={profileForm.termsAndConditions || ""}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, termsAndConditions: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="1. Re-rack weights after use.\n2. Proper gym shoes required.\n3. Gym membership non-transferable."
              />
            </div>

            <div>
              <label className={labelStyle}>Privacy Policy / Member Guidelines</label>
              <textarea
                rows={4}
                value={profileForm.privacyPolicy || ""}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, privacyPolicy: e.target.value });
                  setIsDirty(true);
                }}
                className={inputStyle}
                placeholder="Specify data privacy and locker security policies..."
              />
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-100 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">WhatsApp Communication Branding</p>
              <p className="mt-0.5 text-blue-700 font-medium">
                Your Gym Name, Phone Number, Terms, and WhatsApp Contact defined here will automatically be included in automated payment alerts and welcome notifications.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Floating Bar when dirty */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-2xl border border-slate-700">
          <span className="text-xs font-semibold">You have unsaved changes</span>
          <button
            onClick={handleSaveAll}
            disabled={saveProfileMutation.isPending || saveSettingsMutation.isPending}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
          >
            {saveProfileMutation.isPending || saveSettingsMutation.isPending ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}
    </div>
  );
}
