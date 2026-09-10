"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Filter, Printer, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getGymProfile } from "@/src/services/gym-settings.service";
import { listActiveMembershipPlans } from "@/src/services/membership-plans.service";
import {
  exportReportData,
  getReport,
  type ReportParams,
  type ReportRow,
  type ReportType,
} from "@/src/services/reports.service";
import { getClassKPIs, listGymClasses } from "@/src/services/classes.service";
import {
  formatBusinessDate,
  formatDateTime,
  formatMoney,
  getGymInitials,
  renderReportDocumentHtml,
} from "@/src/utils/business-document";

const input =
  "w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-medium text-[#0F172A] outline-none transition focus:border-[#94A3B8] focus:bg-white focus:ring-4 focus:ring-slate-100";

function statusBadge(row: ReportRow) {
  const expiry = String(row.expiry_date ?? "");
  if (!row.is_active) return "Expired";
  const days = Math.ceil((new Date(`${expiry}T00:00:00`).getTime() - Date.now()) / 86400000);
  return days < 0 ? "Expired" : days <= 7 ? "Expiring Soon" : "Active";
}

function Badge({ label }: { label: string }) {
  const colors =
    label === "Active" || label === "Paid"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : label === "Expiring Soon" || label === "Pending"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-rose-50 text-rose-700 border border-rose-200";
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors}`}>{label}</span>;
}

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>("member");
  const [range, setRange] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [planId, setPlanId] = useState("");
  const [memberStatus, setMemberStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ReportParams["sortBy"]>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  // Timezone-safe local calendar dates (no UTC shift)
  const dates = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;

    if (range === "today") return { startDate: todayStr, endDate: todayStr };
    if (range === "week") {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      const sy = startOfWeek.getFullYear();
      const sm = String(startOfWeek.getMonth() + 1).padStart(2, "0");
      const sd = String(startOfWeek.getDate()).padStart(2, "0");
      return { startDate: `${sy}-${sm}-${sd}`, endDate: todayStr };
    }
    if (range === "month") return { startDate: `${y}-${m}-01`, endDate: todayStr };
    return { startDate: customStart || undefined, endDate: customEnd || undefined };
  }, [range, customStart, customEnd]);

  const params: ReportParams = {
    type,
    page,
    limit,
    sortBy,
    order,
    ...dates,
    ...(planId && { planId }),
    ...(memberStatus && { memberStatus: memberStatus as "active" | "expired" | "due" }),
    ...(paymentStatus && { paymentStatus: paymentStatus as "Pending" | "Paid" | "Failed" | "Refunded" }),
    ...(search && { search }),
  };

  const gymProfileQuery = useQuery({ queryKey: ["gym-profile"], queryFn: getGymProfile });
  const hasClassesEnabled = Boolean(gymProfileQuery.data?.hasClassesEnabled);

  const report = useQuery({
    queryKey: ["reports", params],
    queryFn: () => getReport(params),
    enabled: type !== "class",
  });

  const classKpisQuery = useQuery({
    queryKey: ["classes", "dashboard-kpis"],
    queryFn: getClassKPIs,
    enabled: type === "class" && hasClassesEnabled,
  });

  const classesListQuery = useQuery({
    queryKey: ["classes", "list"],
    queryFn: listGymClasses,
    enabled: type === "class" && hasClassesEnabled,
  });

  const plans = useQuery({ queryKey: ["membership-plans", "active"], queryFn: listActiveMembershipPlans });

  const rows = report.data?.rows ?? [];

  const heading = useMemo(() => {
    switch (type) {
      case "member":
        return "Member Report";
      case "attendance":
        return "Attendance Report";
      case "payment":
        return "Payment Report";
      case "membership":
        return "Membership Report";
      case "revenue":
        return "Revenue Report";
      case "business":
        return "Business Performance Report";
      case "class":
        return "Class & Session Report";
      default:
        return "Business Report";
    }
  }, [type]);

  const clear = () => {
    setRange("month");
    setCustomStart("");
    setCustomEnd("");
    setPlanId("");
    setMemberStatus("");
    setPaymentStatus("");
    setSearch("");
    setPage(1);
  };

  // Dynamic KPI summary cards tailored to active report type
  const summaryCards = useMemo(() => {
    if (type === "class") {
      const kpis = classKpisQuery.data;
      return [
        { label: "Total Classes", value: kpis?.totalClasses ?? 0 },
        { label: "Active Classes", value: kpis?.activeClasses ?? 0 },
        { label: "Classes Today", value: kpis?.classesToday ?? 0 },
        { label: "Today's Bookings", value: kpis?.totalBookingsToday ?? 0 },
        { label: "Class Memberships", value: kpis?.totalClassMemberships ?? 0 },
      ];
    }

    const s = (report.data?.summary ?? {}) as Record<string, any>;
    if (type === "member") {
      return [
        { label: "Total Members", value: s.totalMembers ?? 0 },
        { label: "Active Members", value: s.activeMembers ?? 0 },
        { label: "Expired Members", value: s.expiredMembers ?? 0 },
        { label: "Renewals Due (7 Days)", value: s.renewalsDue ?? 0 },
        { label: "Total Paid", value: formatMoney(s.totalRevenue ?? 0) },
      ];
    }
    if (type === "attendance") {
      return [
        { label: "Total Check-ins", value: s.totalAttendance ?? 0 },
        { label: "Unique Members", value: s.uniqueMembers ?? 0 },
        { label: "Today's Check-ins", value: s.todayAttendance ?? 0 },
        { label: "Currently Present", value: s.currentlyIn ?? 0 },
      ];
    }
    if (type === "membership") {
      return [
        { label: "Total Registered", value: s.totalMembers ?? 0 },
        { label: "Active Memberships", value: s.activeMembers ?? 0 },
        { label: "Expired Memberships", value: s.expiredMembers ?? 0 },
        { label: "Renewals Due", value: s.renewalsDue ?? 0 },
        { label: "Membership Revenue", value: formatMoney(s.totalRevenue ?? 0) },
      ];
    }
    if (type === "business") {
      return [
        { label: "Total Business Revenue", value: formatMoney(s.totalRevenue ?? 0) },
        { label: "This Month Revenue", value: formatMoney(s.monthRevenue ?? 0) },
        { label: "Paid Invoices", value: s.paidPayments ?? 0 },
        { label: "Outstanding Dues", value: formatMoney(s.pendingAmount ?? 0) },
      ];
    }
    if (type === "revenue") {
      return [
        { label: "Total Revenue Collected", value: formatMoney(s.totalRevenue ?? 0) },
        { label: "This Month Revenue", value: formatMoney(s.monthRevenue ?? 0) },
        { label: "Completed Payments", value: s.paidPayments ?? 0 },
        { label: "Pending/Due Amount", value: formatMoney(s.pendingAmount ?? 0) },
      ];
    }
    // type === "payment"
    return [
      { label: "Total Transactions", value: s.totalPayments ?? 0 },
      { label: "Paid Transactions", value: s.paidPayments ?? 0 },
      { label: "Pending / Partial", value: s.pendingPayments ?? 0 },
      { label: "Total Revenue Collected", value: formatMoney(s.totalRevenue ?? 0) },
    ];
  }, [report.data?.summary, classKpisQuery.data, type]);

  // Report Period Label
  const reportPeriodLabel = useMemo(() => {
    if (range === "today") return `Today (${formatBusinessDate(dates.startDate)})`;
    if (range === "week") return `This Week (${formatBusinessDate(dates.startDate)} – ${formatBusinessDate(dates.endDate)})`;
    if (range === "month") return `This Month (${formatBusinessDate(dates.startDate)} – ${formatBusinessDate(dates.endDate)})`;
    if (dates.startDate && dates.endDate) return `${formatBusinessDate(dates.startDate)} – ${formatBusinessDate(dates.endDate)}`;
    return "All Time";
  }, [range, dates]);

  // Applied filter pills for user visibility
  const appliedPills = useMemo(() => {
    const pills: { key: string; label: string; value: string; onRemove?: () => void }[] = [];
    pills.push({ key: "period", label: "Period", value: reportPeriodLabel });

    if (planId) {
      const planName = plans.data?.find((p) => p.id === planId)?.planName || "Selected Plan";
      pills.push({ key: "plan", label: "Plan", value: planName, onRemove: () => setPlanId("") });
    }
    if (memberStatus && (type === "member" || type === "membership")) {
      pills.push({
        key: "mStatus",
        label: "Member Status",
        value: memberStatus === "due" ? "Due in 7 Days" : memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1),
        onRemove: () => setMemberStatus(""),
      });
    }
    if (paymentStatus && (type === "payment" || type === "revenue" || type === "business")) {
      pills.push({ key: "pStatus", label: "Payment Status", value: paymentStatus, onRemove: () => setPaymentStatus("") });
    }
    if (search) {
      pills.push({ key: "search", label: "Search", value: `"${search}"`, onRemove: () => setSearch("") });
    }
    return pills;
  }, [reportPeriodLabel, planId, memberStatus, paymentStatus, search, plans.data, type]);

  // Full Filtered CSV Export Handler using Active Gym Name
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const gymName = (gymProfileQuery.data?.name || "Gym").replace(/[^a-zA-Z0-9]/g, "_");

      if (type === "class") {
        const classes = classesListQuery.data ?? [];
        const csvHeader = "Class ID,Class Name,Category,Instructor,Capacity,Monthly Price (INR),Drop-in Price (INR),Status";
        const csvLines = classes.map((c) =>
          `"${c.id}","${c.name}","${c.category}","${c.instructorName || ''}","${c.capacity}","${c.monthlyPrice}","${c.dropInPrice || 0}","${c.isActive ? 'Active' : 'Inactive'}"`
        );
        const csvContent = [csvHeader, ...csvLines].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${gymName}_class_report.csv`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const fullData = await exportReportData(params);
      const allRows = fullData.rows;

      let csvHeader = "";
      let csvLines: string[] = [];

      if (type === "payment" || type === "revenue" || type === "business") {
        csvHeader = "Payment ID,Member ID,First Name,Last Name,Phone,Plan Name,Payment Date,Payment Method,Payment Status,Total Amount (INR)";
        csvLines = allRows.map((r: any) =>
          `"${r.id}","${r.member_id}","${r.first_name}","${r.last_name}","${r.phone}","${r.plan_name || ''}","${r.payment_date || ''}","${r.payment_method || ''}","${r.payment_status || ''}","${r.total_amount || 0}"`
        );
      } else if (type === "attendance") {
        csvHeader = "Attendance ID,Member ID,First Name,Last Name,Phone,Plan Name,Attendance Date,Check In Time,Check Out Time,Method";
        csvLines = allRows.map((r: any) =>
          `"${r.id}","${r.member_id}","${r.first_name}","${r.last_name}","${r.phone}","${r.plan_name || ''}","${r.attendance_date || ''}","${r.check_in_time || ''}","${r.check_out_time || ''}","${r.attendance_method || ''}"`
        );
      } else {
        csvHeader = "Member ID,First Name,Last Name,Phone,Plan Name,Join Date,Expiry Date,Is Active,Total Paid (INR),Last Payment Date";
        csvLines = allRows.map((r: any) =>
          `"${r.member_id}","${r.first_name}","${r.last_name}","${r.phone}","${r.plan_name || ''}","${r.join_date || ''}","${r.expiry_date || ''}","${r.is_active ? 'Active' : 'Inactive'}","${r.total_paid || 0}","${r.last_payment_date || ''}"`
        );
      }

      const csvContent = [csvHeader, ...csvLines].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${gymName}_${type}_report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (_err) {
      alert("Failed to export report CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  // Full High-Resolution PDF & Print Handler with Real Gym Identity
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const printWin = window.open("", "_blank", "width=850,height=950");
      if (!printWin) {
        alert("Popup blocked! Please allow popups to print/export PDF.");
        return;
      }

      const appliedFiltersList: { label: string; value: string }[] = [];
      appliedFiltersList.push({ label: "Period", value: reportPeriodLabel });

      const activePlanName = plans.data?.find((p) => p.id === planId)?.planName;
      if (activePlanName) appliedFiltersList.push({ label: "Plan", value: activePlanName });
      if (memberStatus && (type === "member" || type === "membership")) {
        appliedFiltersList.push({
          label: "Member Status",
          value: memberStatus === "due" ? "Due in 7 Days" : memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1),
        });
      }
      if (paymentStatus && (type === "payment" || type === "revenue" || type === "business")) {
        appliedFiltersList.push({ label: "Payment Status", value: paymentStatus });
      }
      if (search) appliedFiltersList.push({ label: "Search", value: `"${search}"` });

      let exportSummaryCards: { label: string; value: string | number }[] = [];
      let tableHeaders: string[] = [];
      let tableRows: (string | number)[][] = [];

      if (type === "class") {
        const kpis = classKpisQuery.data;
        exportSummaryCards = [
          { label: "Total Classes", value: kpis?.totalClasses ?? 0 },
          { label: "Active Classes", value: kpis?.activeClasses ?? 0 },
          { label: "Classes Today", value: kpis?.classesToday ?? 0 },
          { label: "Today's Bookings", value: kpis?.totalBookingsToday ?? 0 },
        ];
        tableHeaders = ["Class Name", "Category", "Instructor", "Capacity", "Monthly Fee", "Drop-in Fee", "Status"];
        tableRows = (classesListQuery.data ?? []).map((c) => [
          c.name,
          c.category,
          c.instructorName || "—",
          c.capacity,
          formatMoney(c.monthlyPrice),
          formatMoney(c.dropInPrice || 0),
          c.isActive ? "Active" : "Inactive",
        ]);
      } else {
        const fullData = await exportReportData(params);
        const allRows = fullData.rows;
        const s = (fullData.summary ?? {}) as Record<string, any>;

        if (type === "member" || type === "membership") {
          exportSummaryCards = [
            { label: "Total Members", value: s.totalMembers ?? allRows.length },
            { label: "Active Members", value: s.activeMembers ?? 0 },
            { label: "Expired Members", value: s.expiredMembers ?? 0 },
            { label: "Total Paid", value: formatMoney(s.totalRevenue ?? 0) },
          ];
          tableHeaders = ["Member ID", "Name", "Phone", "Plan", "Join Date", "Expiry Date", "Status", "Total Paid"];
          tableRows = allRows.map((r: any) => [
            r.member_id ?? "—",
            `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Member",
            r.phone ?? "—",
            r.plan_name || "Standard",
            formatBusinessDate(r.join_date),
            formatBusinessDate(r.expiry_date),
            r.is_active ? "Active" : "Expired",
            formatMoney(r.total_paid),
          ]);
        } else if (type === "attendance") {
          exportSummaryCards = [
            { label: "Total Check-ins", value: s.totalAttendance ?? allRows.length },
            { label: "Unique Members", value: s.uniqueMembers ?? 0 },
            { label: "Today's Check-ins", value: s.todayAttendance ?? 0 },
          ];
          tableHeaders = ["Member ID", "Name", "Phone", "Plan", "Attendance Date", "Check-in", "Check-out", "Method"];
          tableRows = allRows.map((r: any) => [
            r.member_id ?? "—",
            `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Member",
            r.phone ?? "—",
            r.plan_name || "Standard",
            formatBusinessDate(r.attendance_date),
            formatDateTime(r.check_in_time),
            r.check_out_time ? formatDateTime(r.check_out_time) : "Present",
            r.attendance_method ?? "Manual",
          ]);
        } else {
          exportSummaryCards = [
            { label: "Total Transactions", value: s.totalPayments ?? allRows.length },
            { label: "Paid Count", value: s.paidPayments ?? 0 },
            { label: "Total Revenue", value: formatMoney(s.totalRevenue ?? 0) },
          ];
          tableHeaders = ["Txn / Payment ID", "Member ID", "Name", "Phone", "Plan", "Payment Date", "Method", "Status", "Amount Paid"];
          tableRows = allRows.map((r: any) => [
            r.id ? String(r.id).slice(0, 8).toUpperCase() : "—",
            r.member_id ?? "—",
            `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Member",
            r.phone ?? "—",
            r.plan_name || "Membership",
            formatBusinessDate(r.payment_date),
            r.payment_method ?? "Cash",
            r.payment_status ?? "Paid",
            formatMoney(r.total_amount),
          ]);
        }
      }

      const gym = gymProfileQuery.data
        ? {
            name: gymProfileQuery.data.name,
            logoUrl: gymProfileQuery.data.logoUrl,
            address: gymProfileQuery.data.address,
            city: gymProfileQuery.data.city,
            state: gymProfileQuery.data.state,
            country: gymProfileQuery.data.country,
            pincode: gymProfileQuery.data.pincode,
            phone: gymProfileQuery.data.phone,
            gstNumber: gymProfileQuery.data.gstNumber,
          }
        : null;

      const htmlContent = renderReportDocumentHtml({
        gymProfile: gym,
        reportTitle: heading,
        reportPeriod: reportPeriodLabel,
        generatedAt: formatDateTime(new Date()),
        appliedFilters: appliedFiltersList,
        summaryCards: exportSummaryCards,
        tableHeaders,
        tableRows,
        footerNote: `Official business report issued by ${gym?.name || "Fitness Center"}.`,
        autoPrint: true,
      });

      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
    } catch (_err) {
      alert("Failed to generate PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  const gymName = gymProfileQuery.data?.name || "Fitness Center";
  const gymInitials = getGymInitials(gymName);
  const gymAddress = [
    gymProfileQuery.data?.address,
    gymProfileQuery.data?.city,
    gymProfileQuery.data?.state,
    gymProfileQuery.data?.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "India";

  // Report navigation tabs
  const reportTabs = useMemo(() => {
    const tabs: { key: ReportType; label: string }[] = [
      { key: "member", label: "Member Report" },
      { key: "attendance", label: "Attendance Report" },
      { key: "payment", label: "Payment Report" },
      { key: "membership", label: "Membership Report" },
      { key: "revenue", label: "Revenue Report" },
      { key: "business", label: "Business Performance" },
    ];
    if (hasClassesEnabled) {
      tabs.push({ key: "class", label: "Class Report" });
    }
    return tabs;
  }, [hasClassesEnabled]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Unified Gym Document Header Card */}
      <section className="rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {gymProfileQuery.data?.logoUrl ? (
              <img
                src={gymProfileQuery.data.logoUrl}
                alt={gymName}
                className="size-16 rounded-2xl object-contain border border-slate-100 p-1 bg-white shadow-xs"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#0F172A] text-lg font-black text-white shadow-md">
                {gymInitials}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">
                {gymName}
              </h1>
              <p className="mt-1 text-xs text-slate-500 max-w-lg leading-relaxed">
                {gymAddress}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                {gymProfileQuery.data?.phone && (
                  <span>Phone: <strong className="text-slate-700">{gymProfileQuery.data.phone}</strong></span>
                )}
                {gymProfileQuery.data?.gstNumber && (
                  <span>• GSTIN: <strong className="text-slate-700">{gymProfileQuery.data.gstNumber}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCsv}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
              >
                <Download className="size-4 text-slate-600" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
              >
                <FileText className="size-4 text-blue-600" />
                Export PDF
              </button>
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Printer className="size-4 text-slate-200" />
                Print Report
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                {heading}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Period: <strong className="text-slate-700">{reportPeriodLabel}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {reportTabs.map((tab) => {
            const isActive = type === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setType(tab.key);
                  setPage(1);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#0F172A] text-white shadow-md shadow-slate-900/10"
                    : "bg-[#F8FAFC] text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Dynamic KPI Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              {type === "class" ? (classKpisQuery.isLoading ? "..." : card.value) : (report.isLoading ? "..." : card.value)}
            </p>
          </div>
        ))}
      </section>

      {/* Filter Controls Bar (for report types supporting server filtering) */}
      {type !== "class" && (
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                setPage(1);
              }}
              className={input}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>

            <select
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                setPage(1);
              }}
              className={input}
            >
              <option value="">All Membership Plans</option>
              {plans.data?.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.planName}
                </option>
              ))}
            </select>

            <label className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#94A3B8]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={`${input} pl-9`}
                placeholder="Search ID, name, or phone..."
              />
            </label>

            {range === "custom" && (
              <>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className={input}
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className={input}
                />
              </>
            )}

            {(type === "member" || type === "membership") && (
              <select
                value={memberStatus}
                onChange={(e) => {
                  setMemberStatus(e.target.value);
                  setPage(1);
                }}
                className={input}
              >
                <option value="">All Member Statuses</option>
                <option value="active">Active</option>
                <option value="due">Due in 7 Days</option>
                <option value="expired">Expired</option>
              </select>
            )}

            {(type === "payment" || type === "revenue" || type === "business") && (
              <select
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setPage(1);
                }}
                className={input}
              >
                <option value="">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending / Partial</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            )}

            <button
              onClick={clear}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              Reset Filters
            </button>
          </div>

          {/* Applied Filters Pill Banner */}
          {appliedPills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Filter className="size-3" />
                Active Filters:
              </span>
              {appliedPills.map((pill) => (
                <span
                  key={pill.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  <strong className="text-slate-900">{pill.label}:</strong> {pill.value}
                  {pill.onRemove && (
                    <button
                      onClick={pill.onRemove}
                      className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Report Data Table */}
      <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-extrabold text-[#0F172A] text-base">{heading}</h2>
            <p className="mt-0.5 text-xs text-[#64748B] font-medium">
              {type === "class"
                ? `Showing ${(classesListQuery.data ?? []).length} registered classes`
                : `Showing ${rows.length} of ${report.data?.pagination.total ?? 0} total records`}
            </p>
          </div>

          {type !== "class" && (
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ReportParams["sortBy"])}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A]"
              >
                <option value="name">Sort: Name</option>
                <option value="expiry">Sort: Expiry</option>
                <option value="joinDate">Sort: Join Date</option>
                <option value="revenue">Sort: Revenue</option>
              </select>
              <button
                onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-xs font-bold hover:bg-slate-50 transition"
              >
                {order === "asc" ? "↑ ASC" : "↓ DESC"}
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {type === "class" ? (
            <table className="min-w-[900px] w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200">
                <tr>
                  {["Class Name", "Category", "Instructor", "Capacity", "Monthly Fee", "Drop-in Fee", "Status"].map((x) => (
                    <th key={x} className="px-4 py-3.5 whitespace-nowrap">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-slate-700">
                {classesListQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#64748B]">
                      Loading class data...
                    </td>
                  </tr>
                ) : (classesListQuery.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#64748B]">
                      No classes configured yet.
                    </td>
                  </tr>
                ) : (
                  (classesListQuery.data ?? []).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{c.category}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{c.instructorName || "—"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{c.capacity} members</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">{formatMoney(c.monthlyPrice)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{formatMoney(c.dropInPrice || 0)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge label={c.isActive ? "Active" : "Inactive"} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-[1000px] w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200">
                <tr>
                  {type === "member" || type === "membership"
                    ? ["Member ID", "Name", "Phone", "Membership Plan", "Join Date", "Expiry Date", "Status", "Total Paid", "Last Payment"].map((x) => (
                        <th key={x} className="px-4 py-3.5 whitespace-nowrap">
                          {x}
                        </th>
                      ))
                    : type === "attendance"
                    ? ["Member ID", "Name", "Phone", "Membership Plan", "Attendance Date", "Check-in", "Check-out", "Method"].map((x) => (
                        <th key={x} className="px-4 py-3.5 whitespace-nowrap">
                          {x}
                        </th>
                      ))
                    : ["Payment ID", "Member ID", "Name", "Phone", "Membership Plan", "Payment Date", "Method", "Payment Status", "Amount Paid"].map((x) => (
                        <th key={x} className="px-4 py-3.5 whitespace-nowrap">
                          {x}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium text-slate-700">
                {report.isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[#64748B]">
                      Loading report data...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[#64748B]">
                      No matching report data found for selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) =>
                    type === "member" || type === "membership" ? (
                      <tr key={String(row.id)} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 font-mono whitespace-nowrap">{row.member_id}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          {row.first_name} {row.last_name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{row.phone}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{row.plan_name || "Standard"}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatBusinessDate(row.join_date)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatBusinessDate(row.expiry_date)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge label={statusBadge(row)} />
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">{formatMoney(row.total_paid)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatBusinessDate(row.last_payment_date)}</td>
                      </tr>
                    ) : type === "attendance" ? (
                      <tr key={String(row.id)} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 font-mono whitespace-nowrap">{row.member_id}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          {row.first_name} {row.last_name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{row.phone}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{row.plan_name || "Standard"}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatBusinessDate(row.attendance_date)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatDateTime(row.check_in_time)}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                          {row.check_out_time ? (
                            formatDateTime(row.check_out_time)
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Present
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-medium whitespace-nowrap">{row.attendance_method || "Manual"}</td>
                      </tr>
                    ) : (
                      <tr key={String(row.id)} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {row.id ? String(row.id).slice(0, 8).toUpperCase() : "—"}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 font-mono whitespace-nowrap">{row.member_id}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          {row.first_name} {row.last_name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{row.phone}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{row.plan_name || "Membership"}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatBusinessDate(row.payment_date)}</td>
                        <td className="px-4 py-3.5 font-medium whitespace-nowrap">{row.payment_method}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              row.payment_status === "Paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.payment_status === "Pending"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {row.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {formatMoney(row.total_amount)}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {type !== "class" && (
          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-3 text-xs">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-[#E2E8F0] px-2 py-1 text-xs font-semibold"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <div className="flex items-center gap-3">
              <button
                disabled={!report.data?.pagination.hasPreviousPage}
                onClick={() => setPage(page - 1)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs font-semibold text-[#64748B]">
                Page {report.data?.pagination.page ?? 1} of {report.data?.pagination.totalPages ?? 1}
              </span>
              <button
                disabled={!report.data?.pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Clean Document Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-8 border-t border-slate-200 text-xs text-slate-400">
        <p>
          Official business report issued by <strong className="text-slate-600">{gymName}</strong>. Real-time data.
        </p>
        <p className="text-[11px] text-slate-400">
          Powered by <strong className="text-slate-600 font-semibold">GymPulse</strong>
        </p>
      </footer>
    </div>
  );
}
