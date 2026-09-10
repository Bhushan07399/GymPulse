import type { ReactNode } from "react";
import { ProtectedAdminLayout } from "@/src/components/admin/protected-admin-layout";

export default function AdminAuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedAdminLayout>{children}</ProtectedAdminLayout>;
}
