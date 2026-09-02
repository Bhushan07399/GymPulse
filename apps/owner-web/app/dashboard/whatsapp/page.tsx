"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  Heart,
  Image as ImageIcon,
  Info,
  Layers,
  Link,
  Lock,
  Megaphone,
  MessageSquare,
  Package,
  Phone,
  PhoneCall,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { PlanLockedState } from "@/src/components/common/plan-locked-state";
import {
  getAutomationStats,
  getAutomationTemplates,
  getBroadcastHistory,
  getGymBranding,
  getWhatsAppLogs,
  getWhatsAppSettings,
  previewBroadcast,
  saveAutomationTemplate,
  sendBroadcast,
  sendWhatsAppTestMessage,
  updateGymBranding,
  updateWhatsAppSettings,
  type AutomationStats,
  type AutomationTemplate,
  type BroadcastHistoryItem,
  type GymBranding,
  type WhatsAppLog,
  type WhatsAppSettings,
} from "@/src/services/whatsapp.service";
import { listMembers } from "@/src/services/members.service";
import { listActiveMembershipPlans } from "@/src/services/membership-plans.service";
import { listGymClasses } from "@/src/services/classes.service";
import {
  createBmiAppointment,
  listBmiAppointments,
  updateBmiAppointment,
  type BmiAssessment,
  type BmiInput
} from "@/src/services/bmi.service";

export default function WhatsAppAutomationPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"automations" | "templates" | "broadcast" | "bmi" | "branding" | "logs">("automations");

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastMediaUrl, setBroadcastMediaUrl] = useState("");
  const [audienceType, setAudienceType] = useState<"ALL" | "SELECTED" | "PLAN" | "CLASS" | "EXPIRING" | "OUTSTANDING">("ALL");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<{ recipientCount: number; members: any[] } | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Template Modal State
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [editingTemplateBody, setEditingTemplateBody] = useState("");

  // Test Message Phone
  const [testPhone, setTestPhone] = useState("");
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);

  // BMI Assessment Form State
  const [bmiModalOpen, setBmiModalOpen] = useState(false);
  const [bmiMemberId, setBmiMemberId] = useState("");
  const [bmiType, setBmiType] = useState<"FREE" | "PAID">("FREE");
  const [bmiPrice, setBmiPrice] = useState("500");
  const [bmiPaidAmount, setBmiPaidAmount] = useState("500");
  const [bmiDate, setBmiDate] = useState(new Date().toISOString().slice(0, 10));
  const [bmiTime, setBmiTime] = useState("10:00");
  const [bmiNotes, setBmiNotes] = useState("");

  // Complete BMI Modal State
  const [completeBmiItem, setCompleteBmiItem] = useState<BmiAssessment | null>(null);
  const [completeHeight, setCompleteHeight] = useState("175");
  const [completeWeight, setCompleteWeight] = useState("70");
  const [completeNotes, setCompleteNotes] = useState("");

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState<Partial<GymBranding>>({});

  // Queries
  const settingsQuery = useQuery({ queryKey: ["whatsapp-settings"], queryFn: getWhatsAppSettings });
  const logsQuery = useQuery({ queryKey: ["whatsapp-logs"], queryFn: getWhatsAppLogs });
  const statsQuery = useQuery({ queryKey: ["whatsapp-stats"], queryFn: getAutomationStats });
  const templatesQuery = useQuery({ queryKey: ["whatsapp-templates"], queryFn: getAutomationTemplates });
  const brandingQuery = useQuery({
    queryKey: ["whatsapp-branding"],
    queryFn: getGymBranding,
  });
  const broadcastHistoryQuery = useQuery({ queryKey: ["whatsapp-broadcasts"], queryFn: getBroadcastHistory });
  const bmiListQuery = useQuery({ queryKey: ["bmi-assessments"], queryFn: () => listBmiAppointments() });
  const membersQuery = useQuery({ queryKey: ["members", "all"], queryFn: () => listMembers({ limit: 100 }) });
  const plansQuery = useQuery({ queryKey: ["membership-plans", "active"], queryFn: listActiveMembershipPlans });
  const classesQuery = useQuery({
    queryKey: ["gym-classes"],
    queryFn: listGymClasses,
    enabled: audienceType === "CLASS",
    retry: false,
  });

  // Sync branding form when query returns
  React.useEffect(() => {
    if (brandingQuery.data) {
      setBrandingForm(brandingQuery.data);
    }
  }, [brandingQuery.data]);

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: updateWhatsAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      toast.success("Settings updated");
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: saveAutomationTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      setSelectedTemplate(null);
      toast.success("Template saved successfully");
    },
  });

  const saveBrandingMutation = useMutation({
    mutationFn: updateGymBranding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-branding"] });
      toast.success("Gym branding updated");
    },
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-logs"] });
      toast.success(`Broadcast sent to ${data.recipientCount} member(s)!`);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setPreviewData(null);
    },
    onError: () => toast.error("Failed to send broadcast."),
  });

  const createBmiMutation = useMutation({
    mutationFn: createBmiAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bmi-assessments"] });
      toast.success("BMI appointment scheduled!");
      setBmiModalOpen(false);
    },
  });

  const completeBmiMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BmiInput> }) => updateBmiAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bmi-assessments"] });
      toast.success("BMI assessment completed and report generated!");
      setCompleteBmiItem(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: sendWhatsAppTestMessage,
    onSuccess: (data) => {
      setTestSuccessMsg(data.message || "Test message sent successfully!");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-logs"] });
      setTimeout(() => setTestSuccessMsg(null), 4000);
    },
  });

  // TESTING PHASE BYPASS: Disable UI feature lock during testing
  const isLocked = false; // Original check: (settingsQuery.error as any)?.response?.data?.error?.code === "FEATURE_LOCKED";

  if (isLocked) {
    return <PlanLockedState featureName="WhatsApp Automation & Messaging" requiredPlan="Pro" />;
  }

  if (settingsQuery.isLoading || templatesQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-sm text-slate-500 font-medium">
        Loading WhatsApp Automation Engine...
      </div>
    );
  }

  const settings = settingsQuery.data;
  const logs = logsQuery.data ?? [];
  const stats: AutomationStats = statsQuery.data ?? { total: 0, sent: 0, failed: 0, today: 0, month: 0 };
  const templates = templatesQuery.data ?? [];
  const broadcasts = broadcastHistoryQuery.data ?? [];
  const bmiAppointments = bmiListQuery.data ?? [];
  const members = membersQuery.data?.members ?? [];
  const plans = plansQuery.data ?? [];
  const classes = classesQuery.data ?? [];

  const handlePreviewBroadcast = async () => {
    setIsPreviewing(true);
    try {
      const data = await previewBroadcast(audienceType, {
        planId: selectedPlanId || undefined,
        classId: selectedClassId || undefined,
        memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
      });
      setPreviewData(data);
    } catch (_err) {
      toast.error("Failed to calculate audience count.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecuteBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Title and Message body are required.");
      return;
    }
    sendBroadcastMutation.mutate({
      title: broadcastTitle.trim(),
      messageBody: broadcastMessage.trim(),
      mediaUrl: broadcastMediaUrl.trim() || undefined,
      audienceType,
      audienceFilter: {
        planId: selectedPlanId || undefined,
        classId: selectedClassId || undefined,
        memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Visual Header */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1600&auto=format&fit=crop"
            alt="WhatsApp Messaging Background"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-extrabold text-amber-300 border border-amber-400/30 uppercase tracking-wider">
              <Crown className="h-3.5 w-3.5 fill-amber-300" /> PRO PLAN EXCLUSIVE
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">WhatsApp Communication & Automation Engine</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Event-driven WhatsApp receipts, welcome onboarding, FitBhuz member app invites, class schedules, and targeted management notices.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => updateSettingsMutation.mutate({ is_enabled: !settings?.is_enabled })}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold shadow-lg transition ${
                settings?.is_enabled ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              <Zap className={`h-4 w-4 ${settings?.is_enabled ? "fill-slate-950" : ""}`} />
              {settings?.is_enabled ? "Automation Engine Active" : "Engine Disabled"}
            </button>
          </div>
        </div>
      </section>

      {/* KPI Overview Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Messages Sent", value: stats.total, icon: Send, color: "text-blue-600" },
          { label: "Delivered Messages", value: stats.sent, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Failed / Invalid", value: stats.failed, icon: ShieldAlert, color: "text-rose-600" },
          { label: "Today's Delivery", value: stats.today, icon: Clock, color: "text-amber-600" },
          { label: "This Month Total", value: stats.month, icon: Calendar, color: "text-indigo-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</p>
          </div>
        ))}
      </section>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "automations", label: "Automated Triggers", icon: Zap },
          { id: "templates", label: "Message Templates", icon: FileText },
          { id: "broadcast", label: "Manual Broadcast Notice", icon: Megaphone },
          { id: "bmi", label: "BMI Appointments", icon: Heart },
          { id: "branding", label: "Gym Branding & FitBhuz", icon: Globe },
          { id: "logs", label: "Delivery Logs", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: AUTOMATED TRIGGERS */}
      {activeTab === "automations" && (
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">Event-Driven Automation Workflows</h2>
            <p className="text-xs text-slate-500 font-medium">
              Every event triggers ONE consolidated WhatsApp message using stored gym branding. Duplicate prevention is enforced server-side.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { event: "MEMBER_CREATED", title: "Member Joined (Welcome + Branding)", desc: "Triggers ONE consolidated welcome message containing Gym address, contact, Instagram, T&C, and management details." },
                { event: "MEMBERSHIP_CREATED", title: "Membership Plan Assigned", desc: "Triggers membership plan details, duration, start/expiry dates, and member ID." },
                { event: "PAYMENT_RECEIPT", title: "Payment Receipt", desc: "Generates complete receipt (Total, Paid, Remaining Dues, Method, Receipt #). Receipt-first communication." },
                { event: "FITBHUZ_INTRO", title: "FitBhuz Member App Invite", desc: "Triggers ONCE after member's first payment. Provides Play Store, iOS links & Member ID login steps." },
                { event: "CLASS_ASSIGNED", title: "Class Subscription & Schedule", desc: "Triggers ONLY to assigned member with exact class category, instructor, and selected schedule days." },
                { event: "CLASS_REMINDER", title: "Targeted Class Reminder", desc: "Reminds ONLY members booked or assigned for upcoming class sessions." },
                { event: "CLASS_SCHEDULE_CHANGED", title: "Class Schedule Updated", desc: "Notifies ONLY affected members when management updates a class timetable." },
                { event: "BMI_APPOINTMENT", title: "BMI Assessment Appointment", desc: "Notifies member of scheduled FREE or PAID BMI assessment date and time." },
                { event: "BMI_COMPLETED", title: "BMI Assessment Completed", desc: "Sends BMI score, health metric report, and advice to member." },
                { event: "BIRTHDAY_WISHES", title: "Birthday Wishes", desc: "Automated birthday wish sent once per year on member's date of birth." },
                { event: "RENEWAL_7D", title: "7 Days Expiry Reminder", desc: "Triggers 7 days before membership expiry date." },
                { event: "MEMBERSHIP_EXPIRED", title: "Membership Expired Notice", desc: "Triggers when membership status reaches expired." },
              ].map((item) => {
                const t = templates.find((x) => x.event_type === item.event);
                const isEnabled = t ? t.is_enabled : true;

                return (
                  <div key={item.event} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-extrabold text-[10px] text-blue-700 border border-blue-200">
                          {item.event}
                        </span>
                        <button
                          onClick={() => saveTemplateMutation.mutate({ eventType: item.event, isEnabled: !isEnabled, templateBody: t?.template_body || t?.default_body || "" })}
                          className={`rounded-full px-3 py-1 text-[11px] font-extrabold border transition ${
                            isEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-200 text-slate-600 border-slate-300"
                          }`}
                        >
                          {isEnabled ? "ENABLED" : "DISABLED"}
                        </button>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTemplate(t || { event_type: item.event, is_enabled: true, template_body: item.event, default_body: item.event, is_customized: false });
                        setEditingTemplateBody(t?.template_body || "");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-3.5 w-3.5" /> Customize Template
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: MESSAGE TEMPLATES */}
      {activeTab === "templates" && (
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">Custom Template Editor</h2>
            <p className="text-xs text-slate-500 font-medium">
              Customize dynamic wording. Supported variables: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{member_name}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{member_id}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{gym_name}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{gym_contact}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{total_amount}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{paid_amount}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{remaining_amount}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{class_name}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{class_schedule}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{"{{bmi_date}}"}</code>.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((tpl) => (
                <div key={tpl.event_type} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-xs text-slate-900 uppercase">{tpl.event_type}</span>
                    <button
                      onClick={() => {
                        setSelectedTemplate(tpl);
                        setEditingTemplateBody(tpl.template_body);
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      Edit
                    </button>
                  </div>
                  <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                    {tpl.template_body}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: MANUAL BROADCAST NOTICE */}
      {activeTab === "broadcast" && (
        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Create Broadcast Tool */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Send Management Broadcast Notice</h2>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Notice Title *
                  <input
                    type="text"
                    placeholder="e.g. Gym Holiday Notice / CrossFit Workshop"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Target Audience *
                  <select
                    value={audienceType}
                    onChange={(e) => {
                      setAudienceType(e.target.value as any);
                      setPreviewData(null);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="ALL">All Active & Registered Members</option>
                    <option value="EXPIRING">Members Expiring in Next 7 Days</option>
                    <option value="OUTSTANDING">Members with Outstanding Payment Dues</option>
                    <option value="PLAN">Members in Specific Membership Plan</option>
                    <option value="CLASS">Members Enrolled in Specific Class</option>
                  </select>
                </label>

                {audienceType === "PLAN" && (
                  <label className="block text-xs font-bold text-slate-700">
                    Select Plan:
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    >
                      <option value="">Choose Plan...</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.planName}</option>
                      ))}
                    </select>
                  </label>
                )}

                {audienceType === "CLASS" && (
                  <label className="block text-xs font-bold text-slate-700">
                    Select Class:
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    >
                      <option value="">Choose Class...</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block text-xs font-bold text-slate-700">
                  Notice Message Content *
                  <textarea
                    rows={5}
                    placeholder="Write your announcement..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-sans"
                  />
                </label>

                <div className="flex items-center gap-3 border-t border-slate-200 pt-3">
                  <button
                    onClick={handlePreviewBroadcast}
                    disabled={isPreviewing}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-800 hover:bg-slate-50 shadow-xs"
                  >
                    {isPreviewing ? "Calculating..." : "Calculate Audience Count"}
                  </button>

                  <button
                    onClick={handleExecuteBroadcast}
                    disabled={sendBroadcastMutation.isPending}
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-slate-800 disabled:opacity-50"
                  >
                    {sendBroadcastMutation.isPending ? "Sending..." : "Send WhatsApp Broadcast"}
                  </button>
                </div>

                {previewData && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-2 text-xs font-semibold text-blue-900">
                    <p className="font-extrabold text-blue-950">
                      🎯 Recipient Count: {previewData.recipientCount} Member(s) Selected
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Targeted members: {previewData.members.slice(0, 5).map((m) => m.name).join(", ")}
                      {previewData.members.length > 5 ? ` + ${previewData.members.length - 5} more` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Broadcast Log */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Broadcast History</h2>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {broadcasts.length === 0 ? (
                  <p className="text-xs text-slate-500">No manual broadcasts sent yet.</p>
                ) : (
                  broadcasts.map((b) => (
                    <div key={b.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{b.title}</span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 uppercase">
                          {b.recipient_count} Recipients
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{b.message_body}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Sent on {new Date(b.sent_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: BMI APPOINTMENTS */}
      {activeTab === "bmi" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">BMI Assessment Appointments</h2>
              <p className="text-xs text-slate-500 font-medium">
                Schedule FREE or PAID BMI assessments. Completed assessments automatically send health reports to member via WhatsApp.
              </p>
            </div>

            <button
              onClick={() => setBmiModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Schedule BMI Assessment
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Member Code</th>
                  <th className="px-5 py-4">Member Name</th>
                  <th className="px-5 py-4">Type / Fee</th>
                  <th className="px-5 py-4">Appointment Date & Time</th>
                  <th className="px-5 py-4">BMI Score</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {bmiAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No BMI appointments scheduled yet.
                    </td>
                  </tr>
                ) : (
                  bmiAppointments.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">{b.member_code || "—"}</td>
                      <td className="px-5 py-4 font-extrabold text-slate-900">
                        {b.first_name} {b.last_name}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {b.assessment_type === "FREE" ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-[10px] text-emerald-700 border border-emerald-200">FREE</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-bold text-[10px] text-amber-800 border border-amber-200">PAID (₹{b.price})</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {b.appointment_date} {b.appointment_time ? `@ ${b.appointment_time}` : ""}
                      </td>
                      <td className="px-5 py-4 font-extrabold text-blue-700">
                        {b.bmi_score ? `${b.bmi_score} BMI` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${
                          b.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {b.status !== "Completed" && (
                          <button
                            onClick={() => {
                              setCompleteBmiItem(b);
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1 font-bold text-white text-[11px] hover:bg-emerald-700 shadow-xs"
                          >
                            Mark Completed & Send Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: GYM BRANDING & FITBHUZ */}
      {activeTab === "branding" && (
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-w-3xl">
            <h2 className="text-lg font-extrabold text-slate-900">Gym Branding & WhatsApp Profile Settings</h2>
            <p className="text-xs text-slate-500 font-medium">
              These stored details are dynamically inserted into every WhatsApp welcome message, receipt, and class schedule notification.
            </p>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  WhatsApp Support Number
                  <input
                    type="text"
                    value={brandingForm.whatsapp_number || ""}
                    onChange={(e) => setBrandingForm({ ...brandingForm, whatsapp_number: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    placeholder="e.g. +91 98765 43210"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Instagram Handle / Link
                  <input
                    type="text"
                    value={brandingForm.instagram_url || ""}
                    onChange={(e) => setBrandingForm({ ...brandingForm, instagram_url: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    placeholder="e.g. @gympulse_official"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  FitBhuz Android PlayStore Link
                  <input
                    type="text"
                    value={brandingForm.fitbhuz_playstore_url || ""}
                    onChange={(e) => setBrandingForm({ ...brandingForm, fitbhuz_playstore_url: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  FitBhuz iOS App Store Link
                  <input
                    type="text"
                    value={brandingForm.fitbhuz_ios_url || ""}
                    onChange={(e) => setBrandingForm({ ...brandingForm, fitbhuz_ios_url: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-mono"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-700">
                Terms & Conditions Summary
                <textarea
                  rows={3}
                  value={brandingForm.terms_and_conditions || ""}
                  onChange={(e) => setBrandingForm({ ...brandingForm, terms_and_conditions: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  placeholder="e.g. Non-refundable fees, personal towel required."
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Management Contact Details
                <input
                  type="text"
                  value={brandingForm.management_contact || ""}
                  onChange={(e) => setBrandingForm({ ...brandingForm, management_contact: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  placeholder="e.g. Gym Manager: Rahul Sharma (+91 9988776655)"
                />
              </label>

              <button
                onClick={() => saveBrandingMutation.mutate(brandingForm)}
                disabled={saveBrandingMutation.isPending}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-xs font-extrabold text-white shadow-md hover:bg-slate-800"
              >
                {saveBrandingMutation.isPending ? "Saving..." : "Save Gym Branding & Settings"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 6: DELIVERY LOGS */}
      {activeTab === "logs" && (
        <section className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-extrabold text-sm text-slate-900">Real-Time Delivery Logs</h2>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Sent Timestamp</th>
                  <th className="px-5 py-3.5">Automation Event</th>
                  <th className="px-5 py-3.5">Member Name</th>
                  <th className="px-5 py-3.5">Recipient Phone</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No WhatsApp delivery logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">{new Date(log.sent_at).toLocaleString()}</td>
                      <td className="px-5 py-3 font-extrabold text-slate-900">{log.automation_type}</td>
                      <td className="px-5 py-3 font-semibold">{log.first_name ? `${log.first_name} ${log.last_name || ''}` : "Guest / Owner"}</td>
                      <td className="px-5 py-3 font-mono">{log.phone_number}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${
                          log.status === "SENT" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : log.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SCHEDULE BMI MODAL */}
      <AnimatePresence>
        {bmiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">Schedule BMI Assessment</h3>
                <button onClick={() => setBmiModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Member *
                  <select
                    value={bmiMemberId}
                    onChange={(e) => setBmiMemberId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  >
                    <option value="">Select Member...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.memberId})</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Assessment Type
                    <select
                      value={bmiType}
                      onChange={(e) => setBmiType(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    >
                      <option value="FREE">FREE Assessment</option>
                      <option value="PAID">PAID Assessment</option>
                    </select>
                  </label>

                  {bmiType === "PAID" && (
                    <label className="block text-xs font-bold text-slate-700">
                      Fee Amount (₹)
                      <input
                        type="number"
                        value={bmiPrice}
                        onChange={(e) => {
                          setBmiPrice(e.target.value);
                          setBmiPaidAmount(e.target.value);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                      />
                    </label>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Appointment Date *
                    <input
                      type="date"
                      value={bmiDate}
                      onChange={(e) => setBmiDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    />
                  </label>

                  <label className="block text-xs font-bold text-slate-700">
                    Appointment Time
                    <input
                      type="time"
                      value={bmiTime}
                      onChange={(e) => setBmiTime(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button onClick={() => setBmiModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button
                  onClick={() => {
                    if (!bmiMemberId) {
                      toast.error("Please select a member.");
                      return;
                    }
                    createBmiMutation.mutate({
                      memberId: bmiMemberId,
                      assessmentType: bmiType,
                      price: Number(bmiPrice),
                      paidAmount: Number(bmiPaidAmount),
                      appointmentDate: bmiDate,
                      appointmentTime: bmiTime,
                    });
                  }}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                >
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPLETE BMI MODAL */}
      <AnimatePresence>
        {completeBmiItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">Record BMI Assessment Results</h3>
                <button onClick={() => setCompleteBmiItem(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Height (cm) *
                    <input
                      type="number"
                      value={completeHeight}
                      onChange={(e) => setCompleteHeight(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    />
                  </label>

                  <label className="block text-xs font-bold text-slate-700">
                    Weight (kg) *
                    <input
                      type="number"
                      value={completeWeight}
                      onChange={(e) => setCompleteWeight(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    />
                  </label>
                </div>

                <label className="block text-xs font-bold text-slate-700">
                  Assessment Advice & Notes
                  <textarea
                    rows={3}
                    placeholder="e.g. Recommended cardio flow and strength training."
                    value={completeNotes}
                    onChange={(e) => setCompleteNotes(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button onClick={() => setCompleteBmiItem(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button
                  onClick={() => {
                    completeBmiMutation.mutate({
                      id: completeBmiItem.id,
                      data: {
                        status: "Completed",
                        height: Number(completeHeight),
                        weight: Number(completeWeight),
                        notes: completeNotes,
                      },
                    });
                  }}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-md"
                >
                  Save & Send WhatsApp Report
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
