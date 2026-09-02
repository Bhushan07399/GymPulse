"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { listActiveMembershipPlans } from "@/src/services/membership-plans.service";
import {
  exportReportData,
  getReport,
  type ReportParams,
  type ReportRow,
  type ReportType,
} from "@/src/services/reports.service";
import { BusinessRevenueOverviewCard } from "@/src/components/dashboard/business-revenue";

const input =
  "w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#94A3B8] focus:bg-white focus:ring-4 focus:ring-slate-100";

const date = (value: unknown, time = false) =>
  value
    ? new Intl.DateTimeFormat("en-IN", time ? { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" } : { day: "2-digit", month: "short", year: "numeric" }).format(new Date(String(value)))
    : "—";

const money = (value: unknown) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value ?? 0));

function status(row: ReportRow) {
  const expiry = String(row.expiry_date ?? "");
  if (!row.is_active) return "Expired";
  const days = Math.ceil((new Date(`${expiry}T00:00:00`).getTime() - Date.now()) / 86400000);
  return days < 0 ? "Expired" : days <= 7 ? "Expiring Soon" : "Active";
}

function Badge({ label }: { label: string }) {
  const colors =
    label === "Active"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : label === "Expiring Soon"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-red-50 text-red-700 border border-red-200";
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${colors}`}>{label}</span>;
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

  const dates = useMemo(() => {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    if (range === "today") return { startDate: end, endDate: end };
    if (range === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { startDate: start.toISOString().slice(0, 10), endDate: end };
    }
    if (range === "month") return { startDate: `${end.slice(0, 7)}-01`, endDate: end };
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

  const report = useQuery({ queryKey: ["reports", params], queryFn: () => getReport(params) });
  const plans = useQuery({ queryKey: ["membership-plans", "active"], queryFn: listActiveMembershipPlans });

  const rows = report.data?.rows ?? [];
  const heading =
    type === "member"
      ? "Member Report"
      : type === "attendance"
      ? "Attendance Report"
      : type === "revenue"
      ? "Revenue Report"
      : "Payment Report";

  const clear = () => {
    setRange("month");
    setPlanId("");
    setMemberStatus("");
    setPaymentStatus("");
    setSearch("");
    setPage(1);
  };

  // Full Filtered CSV Export Handler
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const fullData = await exportReportData(params);
      const allRows = fullData.rows;

      let csvHeader = "";
      let csvLines: string[] = [];

      if (type === "payment" || type === "revenue") {
        csvHeader = "Payment ID,Member ID,First Name,Last Name,Phone,Plan Name,Payment Date,Payment Method,Payment Status,Total Amount (INR)";
        csvLines = allRows.map(
          (r: any) =>
            `"${r.id ?? ""}","${r.member_id ?? ""}","${r.first_name ?? ""}","${r.last_name ?? ""}","${r.phone ?? ""}","${r.plan_name ?? ""}","${r.payment_date ?? ""}","${r.payment_method ?? ""}","${r.payment_status ?? ""}","${r.total_amount ?? 0}"`
        );
      } else if (type === "attendance") {
        csvHeader = "Attendance ID,Member ID,First Name,Last Name,Phone,Plan Name,Attendance Date,Check In Time,Check Out Time,Method";
        csvLines = allRows.map(
          (r: any) =>
            `"${r.id ?? ""}","${r.member_id ?? ""}","${r.first_name ?? ""}","${r.last_name ?? ""}","${r.phone ?? ""}","${r.plan_name ?? ""}","${r.attendance_date ?? ""}","${r.check_in_time ?? ""}","${r.check_out_time ?? ""}","${r.attendance_method ?? ""}"`
        );
      } else {
        csvHeader = "Member ID,First Name,Last Name,Phone,Plan Name,Join Date,Expiry Date,Is Active,Total Paid (INR),Last Payment Date";
        csvLines = allRows.map(
          (r: any) =>
            `"${r.member_id ?? ""}","${r.first_name ?? ""}","${r.last_name ?? ""}","${r.phone ?? ""}","${r.plan_name ?? ""}","${r.join_date ?? ""}","${r.expiry_date ?? ""}","${r.is_active ? "Active" : "Inactive"}","${r.total_paid ?? 0}","${r.last_payment_date ?? ""}"`
        );
      }

      const csvContent = [csvHeader, ...csvLines].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GymPulse_${heading.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (_err) {
      alert("Failed to export CSV report.");
    } finally {
      setIsExporting(false);
    }
  };

  // Professional Printable PDF Layout Handler
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const fullData = await exportReportData(params);
      const allRows = fullData.rows;
      const summaryData = fullData.summary;

      const printWin = window.open("", "_blank");
      if (!printWin) return;

      const tableHeaders =
        type === "member"
          ? ["Member ID", "Member Name", "Phone", "Plan Name", "Join Date", "Expiry Date", "Status", "Total Paid"]
          : type === "attendance"
          ? ["Member ID", "Member Name", "Phone", "Plan Name", "Date", "Check-In", "Check-Out", "Method"]
          : ["Payment ID", "Member ID", "Member Name", "Phone", "Plan Name", "Date", "Method", "Status", "Amount"];

      const tableBody = allRows
        .map((r: any) => {
          if (type === "member") {
            const memberStatusText = r.is_active ? "Active" : "Expired";
            return `<tr>
              <td style="font-weight:bold">${r.member_id}</td>
              <td>${r.first_name} ${r.last_name}</td>
              <td>${r.phone}</td>
              <td>${r.plan_name || "Standard"}</td>
              <td>${date(r.join_date)}</td>
              <td>${date(r.expiry_date)}</td>
              <td><strong>${memberStatusText}</strong></td>
              <td style="font-weight:bold">${money(r.total_paid)}</td>
            </tr>`;
          } else if (type === "attendance") {
            return `<tr>
              <td style="font-weight:bold">${r.member_id}</td>
              <td>${r.first_name} ${r.last_name}</td>
              <td>${r.phone}</td>
              <td>${r.plan_name || "Standard"}</td>
              <td>${date(r.attendance_date)}</td>
              <td>${date(r.check_in_time, true)}</td>
              <td>${r.check_out_time ? date(r.check_out_time, true) : "Checked In"}</td>
              <td>${r.attendance_method}</td>
            </tr>`;
          } else {
            return `<tr>
              <td style="font-size:10px">${r.id}</td>
              <td style="font-weight:bold">${r.member_id}</td>
              <td>${r.first_name} ${r.last_name}</td>
              <td>${r.phone}</td>
              <td>${r.plan_name || "Membership"}</td>
              <td>${date(r.payment_date)}</td>
              <td>${r.payment_method}</td>
              <td><strong>${r.payment_status}</strong></td>
              <td style="font-weight:bold">${money(r.total_amount)}</td>
            </tr>`;
          }
        })
        .join("");

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GymPulse Report - ${heading}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0F172A; }
              .header { display: flex; justify-content: space-between; align-items: center; border-b: 3px solid #0F172A; padding-bottom: 15px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: 900; background: #0F172A; color: #fff; padding: 6px 12px; border-radius: 8px; }
              .title { font-size: 22px; font-weight: 800; margin: 0; }
              .meta { font-size: 11px; color: #64748B; margin-top: 4px; }
              .kpi-container { display: flex; gap: 15px; margin-bottom: 20px; }
              .kpi-card { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; }
              .kpi-title { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; }
              .kpi-value { font-size: 18px; font-weight: 800; color: #0F172A; margin-top: 4px; }
              .filter-box { background: #F1F5F9; border-radius: 8px; padding: 10px; font-size: 11px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
              th { background: #0F172A; color: #ffffff; padding: 8px 10px; text-align: left; text-transform: uppercase; font-size: 10px; }
              td { padding: 8px 10px; border-bottom: 1px solid #E2E8F0; }
              tr:nth-child(even) { background: #F8FAFC; }
              .footer { margin-top: 30px; border-top: 1px solid #E2E8F0; pt: 10px; font-size: 10px; color: #94A3B8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="title">${heading}</h1>
                <div class="meta">Generated on ${new Date().toLocaleString()} | Official GymPulse Management Report</div>
              </div>
              <div class="logo">GymPulse</div>
            </div>

            <div class="filter-box">
              <strong>Applied Filters:</strong> Range: ${range.toUpperCase()} | Plan: ${planId || "All"} | Status: ${memberStatus || paymentStatus || "All"} | Search: ${search || "None"} | Total Records: ${fullData.total}
            </div>

            <div class="kpi-container">
              <div class="kpi-card"><div class="kpi-title">Total Members</div><div class="kpi-value">${summaryData.totalMembers}</div></div>
              <div class="kpi-card"><div class="kpi-title">Active Members</div><div class="kpi-value">${summaryData.activeMembers}</div></div>
              <div class="kpi-card"><div class="kpi-title">Expired Members</div><div class="kpi-value">${summaryData.expiredMembers}</div></div>
              <div class="kpi-card"><div class="kpi-title">Total Revenue</div><div class="kpi-value">${money(summaryData.totalRevenue)}</div></div>
            </div>

            <table>
              <thead>
                <tr>${tableHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${tableBody}
              </tbody>
            </table>

            <div class="footer">
              © ${new Date().getFullYear()} GymPulse SaaS Platform. Confidential & Proprietary Report.
            </div>

            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } catch (_err) {
      alert("Failed to generate PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Premium Reports & Analytics Hero Visual Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1600&auto=format&fit=crop"
            alt="Reports Background"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-extrabold text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Business Intelligence & Exports
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reports, Analytics & Data Exports</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Live member growth analytics, revenue reports, class attendance totals, and printable PDF / CSV exports.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-slate-900 shadow-md hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              <Download className="size-4" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-white/20 transition-all disabled:opacity-50"
            >
              <FileText className="size-4 text-blue-300" />
              Export PDF
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-white/20 transition-all"
            >
              <Printer className="size-4 text-slate-300" />
              Print Report
            </button>
          </div>
        </div>
      </section>

      {/* Combined Business Revenue Overview */}
      <BusinessRevenueOverviewCard />

      {/* KPI Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total Members", value: report.data?.summary.totalMembers },
          { label: "Active Members", value: report.data?.summary.activeMembers },
          { label: "Expired Members", value: report.data?.summary.expiredMembers },
          { label: "Renewals Due in 7 Days", value: report.data?.summary.renewalsDue },
          { label: "Total Revenue Collected", value: money(report.data?.summary.totalRevenue) },
          { label: "This Month Revenue", value: money(report.data?.summary.monthRevenue) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-1">
            <p className="text-xs font-semibold text-[#64748B]">{card.label}</p>
            <p className="text-3xl font-extrabold text-[#0F172A]">
              {report.isLoading ? "..." : card.value}
            </p>
          </div>
        ))}
      </section>

      {/* Filter Controls Bar */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as ReportType);
              setPage(1);
            }}
            className={input}
          >
            <option value="member">Member Report</option>
            <option value="payment">Payment Report</option>
            <option value="attendance">Attendance Report</option>
            <option value="revenue">Revenue Report</option>
          </select>

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
            <Search className="absolute left-3 top-3 size-4 text-[#94A3B8]" />
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
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>

          <button
            onClick={clear}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Report Data Table */}
      <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-extrabold text-[#0F172A] text-base">{heading}</h2>
            <p className="mt-0.5 text-xs text-[#64748B] font-medium">
              Showing {rows.length} of {report.data?.pagination.total ?? 0} total records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ReportParams["sortBy"])}
              className={input}
            >
              <option value="name">Sort: Name</option>
              <option value="expiry">Sort: Expiry</option>
              <option value="joinDate">Sort: Join Date</option>
              <option value="revenue">Sort: Revenue</option>
            </select>
            <button
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-xs font-bold"
            >
              {order === "asc" ? "↑ ASC" : "↓ DESC"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] border-b border-slate-200">
              <tr>
                {type === "member"
                  ? ["Member ID", "Name", "Phone", "Membership Plan", "Join Date", "Expiry Date", "Status", "Total Paid", "Last Payment"].map((x) => (
                      <th key={x} className="px-4 py-3.5">
                        {x}
                      </th>
                    ))
                  : ["Member ID", "Name", "Phone", "Membership Plan", "Date", "Status / Method", "Amount / Check-in"].map((x) => (
                      <th key={x} className="px-4 py-3.5">
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
                  type === "member" ? (
                    <tr key={String(row.id)} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{row.member_id}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {row.first_name} {row.last_name}
                      </td>
                      <td className="px-4 py-3.5">{row.phone}</td>
                      <td className="px-4 py-3.5">{row.plan_name}</td>
                      <td className="px-4 py-3.5">{date(row.join_date)}</td>
                      <td className="px-4 py-3.5">{date(row.expiry_date)}</td>
                      <td className="px-4 py-3.5">
                        <Badge label={status(row)} />
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{money(row.total_paid)}</td>
                      <td className="px-4 py-3.5">{date(row.last_payment_date)}</td>
                    </tr>
                  ) : (
                    <tr key={String(row.id)} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{row.member_id}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {row.first_name} {row.last_name}
                      </td>
                      <td className="px-4 py-3.5">{row.phone}</td>
                      <td className="px-4 py-3.5">{row.plan_name}</td>
                      <td className="px-4 py-3.5">{date(row.payment_date ?? row.attendance_date)}</td>
                      <td className="px-4 py-3.5 font-semibold">{row.payment_status ?? row.attendance_method}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {row.total_amount ? money(row.total_amount) : date(row.check_in_time, true)}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
      </section>
    </div>
  );
}
