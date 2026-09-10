"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X
} from "lucide-react";

import { ADMIN_TOKEN_KEY } from "@/src/lib/api-client";
import { getAdminMe, getAdminAlerts, logoutAdmin, type AdminUser } from "@/src/services/admin.service";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Check alert count
  const { data: alerts = [] } = useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: () => getAdminAlerts({ status: "ACTIVE" }),
    refetchInterval: 30000,
  });

  const activeAlertCount = alerts.length;
  const urgentAlertCount = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH").length;

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    getAdminMe()
      .then((admin) => {
        setAdminUser(admin);
        setIsVerifying(false);
      })
      .catch(() => {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        router.replace("/admin/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await logoutAdmin();
    router.replace("/admin/login");
  };

  const navGroups: NavGroup[] = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "BUSINESS",
      items: [
        { name: "Gyms", href: "/admin/gyms", icon: Building2 },
        { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
        { name: "Revenue", href: "/admin/revenue", icon: TrendingUp },
        { name: "Usage & Costs", href: "/admin/usage-costs", icon: BarChart3 },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { name: "WhatsApp", href: "/admin/whatsapp", icon: MessageSquare },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Alerts", href: "/admin/alerts", icon: AlertTriangle, badge: activeAlertCount },
      ],
    },
    {
      title: "SECURITY",
      items: [
        { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { name: "System Health", href: "/admin/system-health", icon: Activity },
        { name: "Platform Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  if (isVerifying) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-slate-400">Verifying Super Admin Authorization...</p>
        </div>
      </div>
    );
  }

  // Get current page title
  let currentPageTitle = "Dashboard";
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))) {
        currentPageTitle = item.name;
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/90 lg:flex">
        {/* Brand Header */}
        <div className="border-b border-slate-800/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 font-black text-white shadow-lg shadow-emerald-500/20 text-lg">
              O
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white">OBO</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Control Center
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            Smart Gym Management Platform
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      {Boolean(item.badge && item.badge > 0) && (
                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          urgentAlertCount > 0 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / User Profile */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/60 p-2.5 border border-slate-800">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{adminUser?.name || "Super Admin"}</p>
              <p className="truncate text-[10px] text-slate-400">{adminUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">{currentPageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert Indicator */}
            <Link
              href="/admin/alerts"
              className={`relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                urgentAlertCount > 0
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                  : activeAlertCount > 0
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{activeAlertCount} {activeAlertCount === 1 ? "Alert" : "Alerts"}</span>
              {urgentAlertCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>

            {/* Admin Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>SUPER ADMIN</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-950">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-72 flex-col bg-slate-900 border-r border-slate-800 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white">
                  O
                </div>
                <div className="text-sm font-extrabold text-white">OBO Admin</div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase">{group.title}</div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                            isActive ? "bg-emerald-500/20 text-emerald-300" : "text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </div>
                          {Boolean(item.badge && item.badge > 0) && (
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}