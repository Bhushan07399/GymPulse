import type { ReactNode } from "react";

import { ProtectedDashboardLayout } from "@/src/components/protected-dashboard-layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>;
}
