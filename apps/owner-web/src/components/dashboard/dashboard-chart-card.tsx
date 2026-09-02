import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

type DashboardChartCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function DashboardChartCard({ title, description, children }: DashboardChartCardProps) {
  return (
    <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold tracking-[-0.02em] text-[#0F172A]">{title}</h2>
          <p className="mt-1 text-sm text-[#64748B]">{description}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#64748B]"><BarChart3 className="size-3.5" /> Live data</span>
      </div>
      <div className="mt-6">{children ?? <ChartEmptyState />}</div>
    </article>
  );
}

export function ChartEmptyState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 text-center">
      <span className="grid size-10 place-items-center rounded-xl bg-white text-[#64748B] shadow-sm"><BarChart3 className="size-5" /></span>
      <p className="mt-3 text-sm font-semibold text-[#334155]">Trend data will appear here</p>
      <p className="mt-1 max-w-xs text-sm leading-5 text-[#64748B]">Visit Business Analytics or Reports for detailed historical trends and CSV exports.</p>
    </div>
  );
}
