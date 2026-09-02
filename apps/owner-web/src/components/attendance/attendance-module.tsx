"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, CalendarDays, Check, ChevronDown, Clock3, LogIn, MoreHorizontal, Nfc, QrCode, Search, UserRoundCheck, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { createAttendance, listAttendance, updateAttendance } from "@/src/services/attendance.service";
import { listActiveMembershipPlans } from "@/src/services/membership-plans.service";
import { listMembers } from "@/src/services/members.service";
import type { Attendance } from "@/src/types/attendance";
import type { Member } from "@/src/types/member";

const today = () => new Date().toISOString().slice(0, 10);
const inputClass = "w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#94A3B8] focus:bg-white focus:ring-4 focus:ring-slate-100";
const emptyMembers: Member[] = [];

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function initials(member?: Member) {
  return member ? `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase() : "?";
}

function RecordAttendanceModal({ members, isSaving, onClose, onSubmit }: { members: Member[]; isSaving: boolean; onClose: () => void; onSubmit: (memberId: string) => void }) {
  const [memberId, setMemberId] = useState("");
  const selectedMember = members.find((member) => member.memberId === memberId);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-[#0F172A]/50 p-0 sm:items-center sm:justify-center sm:p-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-[#64748B]">Manual check-in</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#0F172A]">Record attendance</h2><p className="mt-2 text-sm leading-6 text-[#64748B]">Choose a member to add their check-in for today.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]" aria-label="Close"><X className="size-5" /></button></div>
      <label className="mt-6 block text-sm font-semibold text-[#334155]">Member ID<select value={memberId} onChange={(event) => setMemberId(event.target.value)} className={`${inputClass} mt-2`}><option value="">Select a Member ID</option>{members.map((member) => <option key={member.id} value={member.memberId}>{member.memberId} — {member.firstName} {member.lastName}</option>)}</select></label>
      {selectedMember && <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] p-4 text-sm"><p><span className="block text-xs text-[#64748B]">Name</span>{selectedMember.firstName} {selectedMember.lastName}</p><p><span className="block text-xs text-[#64748B]">Mobile</span>{selectedMember.phone}</p><p><span className="block text-xs text-[#64748B]">Membership</span>{selectedMember.membershipPlanId}</p><p><span className="block text-xs text-[#64748B]">Status</span>{selectedMember.isActive ? "Active" : "Inactive"}</p></div>}
      <div className="mt-6 flex justify-end gap-3 border-t border-[#E2E8F0] pt-5"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9]">Cancel</button><button type="button" disabled={!memberId || isSaving} onClick={() => onSubmit(memberId)} className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"><LogIn className="size-4" />{isSaving ? "Recording..." : "Record check-in"}</button></div>
    </motion.div>
  </motion.div>;
}

export function AttendanceModule() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(today());
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const attendanceQuery = useQuery({ queryKey: ["attendance"], queryFn: listAttendance });
  const membersQuery = useQuery({ queryKey: ["members", "attendance"], queryFn: () => listMembers({ page: 1, limit: 100 }) });
  const plansQuery = useQuery({ queryKey: ["membership-plans", "active"], queryFn: listActiveMembershipPlans });
  const members = membersQuery.data?.members ?? emptyMembers;
  const memberById = useMemo(() => new Map(members.map((member) => [member.memberId, member])), [members]);
  const planById = useMemo(() => new Map((plansQuery.data ?? []).map((plan) => [plan.id, plan])), [plansQuery.data]);
  const attendance = attendanceQuery.data?.attendance ?? [];
  const displayed = attendance.filter((record) => {
    const member = memberById.get(record.memberId);
    const memberIdentifier = member?.memberId.toLowerCase() ?? record.memberId.toLowerCase();
    const status = record.checkOutTime ? "checked-out" : "present";
    return record.attendanceDate === date && (!search || memberIdentifier.includes(search.toLowerCase())) && (planFilter === "all" || member?.membershipPlanId === planFilter) && (statusFilter === "all" || statusFilter === status);
  });
  const todayRecords = attendance.filter((record) => record.attendanceDate === today());
  const presentCount = todayRecords.filter((record) => !record.checkOutTime).length;
  const checkedInMemberIds = new Set(todayRecords.map((record) => record.memberId));
  const activeMembers = members.filter((member) => member.isActive);
  const absentCount = Math.max(activeMembers.length - checkedInMemberIds.size, 0);
  const attendanceRate = activeMembers.length ? Math.round((checkedInMemberIds.size / activeMembers.length) * 100) : 0;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["attendance"] });
  const recordMutation = useMutation({ mutationFn: (memberId: string) => createAttendance({ memberId, checkInTime: new Date().toISOString(), attendanceDate: today(), attendanceMethod: "Manual" }), onSuccess: () => { toast.success("Check-in recorded."); setIsModalOpen(false); refresh(); }, onError: (error) => { console.error("Unable to record attendance.", error); toast.error("Unable to record attendance. Please try again."); } });
  const checkoutMutation = useMutation({ mutationFn: (record: Attendance) => updateAttendance(record.id, { checkOutTime: new Date().toISOString() }), onSuccess: () => { toast.success("Check-out recorded."); refresh(); }, onError: (error) => { console.error("Unable to record check-out.", error); toast.error("Unable to record check-out. Please try again."); } });
  const latest = [...todayRecords].sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()).slice(0, 4);
  const peakHour = todayRecords.length
    ? Object.entries(todayRecords.reduce<Record<number, number>>((hours, record) => {
      const hour = new Date(record.checkInTime).getHours();
      hours[hour] = (hours[hour] ?? 0) + 1;
      return hours;
    }, {})).sort(([, left], [, right]) => right - left)[0][0]
    : null;
  const stats = [{ label: "Today's Check-ins", value: todayRecords.length, icon: Activity, note: "Across all entry methods" }, { label: "Present Members", value: presentCount, icon: UserRoundCheck, note: "Currently on the floor" }, { label: "Absent Members", value: absentCount, icon: Users, note: "Of active members" }, { label: "Attendance Rate", value: `${attendanceRate}%`, icon: Activity, note: "Today's active member rate" }];

  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mx-auto max-w-7xl space-y-6">
    {/* Premium Gym Attendance Hero Visual Banner */}
    <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white shadow-xl">
      <div className="absolute inset-0 opacity-20">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop"
          alt="Gym Floor Background"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
            Gym Entrance & Floor Activity
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Attendance Roster & Live Log</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
            Track daily member check-ins, floor presence, peak hours, and check-out timestamps.
          </p>
        </div>

        <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-slate-900 shadow-lg transition hover:bg-slate-100 shrink-0">
          <LogIn className="size-4" /> Record Check-In
        </button>
      </div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, note }) => <motion.article key={label} whileHover={{ y: -3 }} className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)] transition-shadow hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]"><span className="grid size-10 place-items-center rounded-xl bg-[#F1F5F9] text-[#475569] transition-colors group-hover:bg-[#E2E8F0]"><Icon className="size-5" strokeWidth={1.8} /></span><p className="mt-5 text-sm font-medium text-[#64748B]">{label}</p><p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#0F172A]">{attendanceQuery.isLoading ? "—" : value}</p><p className="mt-2 text-xs font-medium text-[#94A3B8]">{note}</p></motion.article>)}</section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"><div className="space-y-5"><section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.025)] sm:p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="relative block"><span className="sr-only">Search member</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member" className={`${inputClass} pl-9`} /></label><label className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={`${inputClass} pl-9`} aria-label="Attendance date" /></label><label className="relative block"><select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className={inputClass} aria-label="Membership filter"><option value="all">All memberships</option>{(plansQuery.data ?? []).map((plan) => <option key={plan.id} value={plan.id}>{plan.planName}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" /></label><label className="relative block"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass} aria-label="Status filter"><option value="all">All statuses</option><option value="present">Present</option><option value="checked-out">Checked out</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" /></label></div></section>
    <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_5px_rgba(15,23,42,0.025)]"><div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4"><div><h2 className="font-semibold text-[#0F172A]">Attendance log</h2><p className="mt-1 text-xs text-[#64748B]">{date === today() ? "Today’s member activity" : `Records for ${date}`}</p></div><span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#64748B]">{displayed.length} records</span></div>{attendanceQuery.isLoading || membersQuery.isLoading ? <div className="space-y-4 p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-[#F1F5F9]" />)}</div> : attendanceQuery.isError || membersQuery.isError ? <p className="p-6 text-sm text-[#64748B]">Unable to load attendance records. Please refresh and try again.</p> : displayed.length === 0 ? <div className="px-6 py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F1F5F9] text-[#475569]"><CalendarDays className="size-7" /></span><h3 className="mt-5 text-lg font-semibold text-[#0F172A]">No attendance records found.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748B]">When members check in, their activity will appear here with a clear record of their visit.</p></div> : <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left"><thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]"><tr><th className="px-5 py-3">Member</th><th className="px-4 py-3">Check-in</th><th className="px-4 py-3">Check-out</th><th className="px-4 py-3">Membership</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{displayed.map((record) => { const member = memberById.get(record.memberId); const plan = member ? planById.get(member.membershipPlanId) : undefined; const present = !record.checkOutTime; return <tr key={record.id} className="transition hover:bg-[#F8FAFC]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#E2E8F0] bg-cover bg-center text-xs font-bold text-[#475569]" style={member?.profilePhotoUrl ? { backgroundImage: `url(${member.profilePhotoUrl})` } : undefined}>{member?.profilePhotoUrl ? <span className="sr-only">{member.firstName} {member.lastName}</span> : initials(member)}</span><div><p className="text-sm font-semibold text-[#0F172A]">{member ? `${member.firstName} ${member.lastName}` : "Unknown member"}</p><p className="mt-0.5 text-xs text-[#94A3B8]">{record.attendanceMethod} check-in</p></div></div></td><td className="px-4 py-4 text-sm text-[#475569]">{formatTime(record.checkInTime)}</td><td className="px-4 py-4 text-sm text-[#475569]">{formatTime(record.checkOutTime)}</td><td className="px-4 py-4"><span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#475569]">{plan?.planName ?? "—"}</span></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${present ? "bg-emerald-50 text-emerald-700" : "bg-[#F1F5F9] text-[#475569]"}`}><span className={`size-1.5 rounded-full ${present ? "bg-emerald-500" : "bg-[#94A3B8]"}`} />{present ? "Present" : "Checked out"}</span></td><td className="px-5 py-4 text-right">{present ? <button type="button" onClick={() => checkoutMutation.mutate(record)} disabled={checkoutMutation.isPending} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]">Check out</button> : <button type="button" className="rounded-lg p-2 text-[#94A3B8] hover:bg-[#F1F5F9]" aria-label="Attendance actions"><MoreHorizontal className="size-4" /></button>}</td></tr>; })}</tbody></table></div>}</section></div>
    <aside className="space-y-5"><section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)]"><h2 className="font-semibold text-[#0F172A]">Today&apos;s summary</h2><div className="mt-5 space-y-4"><div className="flex justify-between text-sm"><span className="text-[#64748B]">Check-ins</span><span className="font-semibold text-[#0F172A]">{todayRecords.length}</span></div><div className="flex justify-between text-sm"><span className="text-[#64748B]">Currently present</span><span className="font-semibold text-[#0F172A]">{presentCount}</span></div><div className="flex justify-between text-sm"><span className="text-[#64748B]">Attendance rate</span><span className="font-semibold text-[#0F172A]">{attendanceRate}%</span></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#E2E8F0]"><div className="h-full rounded-full bg-[#334155] transition-all duration-500" style={{ width: `${attendanceRate}%` }} /></div></section><section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)]"><div className="flex items-center gap-2"><Clock3 className="size-4 text-[#64748B]" /><h2 className="font-semibold text-[#0F172A]">Peak hours</h2></div><p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">{peakHour === null ? "—" : new Intl.DateTimeFormat("en-IN", { hour: "numeric" }).format(new Date().setHours(Number(peakHour), 0, 0, 0))}</p><p className="mt-1 text-sm text-[#64748B]">{peakHour === null ? "Insights will appear as visits begin." : "Busiest recorded check-in hour today."}</p></section><section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.025)]"><h2 className="font-semibold text-[#0F172A]">Latest check-ins</h2><div className="mt-4 space-y-4">{latest.length ? latest.map((record) => { const member = memberById.get(record.memberId); return <div key={record.id} className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#E2E8F0] text-[10px] font-bold text-[#475569]">{initials(member)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#334155]">{member ? `${member.firstName} ${member.lastName}` : "Unknown member"}</p><p className="text-xs text-[#94A3B8]">{formatTime(record.checkInTime)}</p></div></div>; }) : <p className="text-sm leading-6 text-[#64748B]">No check-ins to show yet.</p>}</div></section><section className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Check-In Method</p><p className="mt-1 text-sm leading-5 text-[#64748B]">Manual attendance is ready. Additional methods are planned for a future release.</p></div><div className="mt-4 space-y-2">{[{ label: "Manual Check-In", detail: "Enabled", icon: LogIn, enabled: true }, { label: "QR Check-In", detail: "Coming soon", icon: QrCode, enabled: false }, { label: "Face Recognition", detail: "Future", icon: UserRoundCheck, enabled: false }, { label: "NFC Tap", detail: "Future", icon: Nfc, enabled: false }].map(({ label, detail, icon: Icon, enabled }) => <div key={label} className={`flex items-center gap-3 rounded-xl border p-3 ${enabled ? "border-[#CBD5E1] bg-white text-[#334155]" : "border-[#E2E8F0] bg-white/70 text-[#64748B]"}`}><span className={`grid size-8 place-items-center rounded-lg ${enabled ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label}</p><p className="text-xs text-[#94A3B8]">{detail}</p></div>{enabled ? <Check className="size-4 text-emerald-600" /> : <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{detail}</span>}</div>)}</div></section></aside></div>
    <AnimatePresence>{isModalOpen && <RecordAttendanceModal members={activeMembers} isSaving={recordMutation.isPending} onClose={() => setIsModalOpen(false)} onSubmit={(memberId) => recordMutation.mutate(memberId)} />}</AnimatePresence>
  </motion.div>;
}
