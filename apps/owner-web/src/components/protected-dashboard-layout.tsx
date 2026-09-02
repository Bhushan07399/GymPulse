"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "@/src/lib/i18n";
import {
  BadgePercent,
  BarChart3,
  CalendarCheck,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  QrCode,
  Settings,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import { getDashboardSummary } from "@/src/services/dashboard.service";
import { AUTH_TOKEN_KEY } from "@/src/lib/api-client";
import { AUTH_ROLE_KEY, canAccessDashboard, isDevelopmentMode } from "@/src/lib/subscription-state";
import { MobileBottomSheet } from "@/src/components/ui/mobile-bottom-sheet";

type NavItem = {
  key: string;
  defaultLabel: string;
  href: string;
  icon: any;
  requiresClassFeature?: boolean;
};

type NavGroup = {
  titleKey: string;
  defaultTitle: string;
  items: NavItem[];
};


const ownerNavGroups: NavGroup[] = [
  {
    titleKey: "nav.main",
    defaultTitle: "MAIN",
    items: [
      { key: "nav.dashboard", defaultLabel: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    titleKey: "nav.membership",
    defaultTitle: "MEMBERSHIP",
    items: [
      { key: "nav.members", defaultLabel: "Members", href: "/dashboard/members", icon: Users },
      { key: "nav.plans", defaultLabel: "Membership Plans", href: "/dashboard/membership-plans", icon: BadgePercent },
      { key: "nav.attendance", defaultLabel: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
      { key: "nav.qrCode", defaultLabel: "Gym QR Code", href: "/dashboard/gym-qr", icon: QrCode },
    ],
  },
  {
    titleKey: "nav.classesGroup",
    defaultTitle: "CLASSES",
    items: [
      { key: "nav.classes", defaultLabel: "Classes & Sessions", href: "/dashboard/classes", icon: Dumbbell, requiresClassFeature: true },
    ],
  },
  {
    titleKey: "nav.finance",
    defaultTitle: "FINANCE & ANALYTICS",
    items: [
      { key: "nav.payments", defaultLabel: "Payments", href: "/dashboard/payments", icon: Wallet },
      { key: "nav.analytics", defaultLabel: "Business Analytics", href: "/dashboard/business-analytics", icon: TrendingUp },
    ],
  },
  {
    titleKey: "nav.automation",
    defaultTitle: "AUTOMATION",
    items: [
      { key: "nav.whatsapp", defaultLabel: "WhatsApp Automation", href: "/dashboard/whatsapp", icon: MessageSquare },
    ],
  },
  {
    titleKey: "nav.management",
    defaultTitle: "MANAGEMENT",
    items: [
      { key: "nav.reports", defaultLabel: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { key: "nav.staff", defaultLabel: "Staff Management", href: "/dashboard/staff", icon: UserCog },
      { key: "nav.settings", defaultLabel: "Gym Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const receptionistNavGroups: NavGroup[] = [
  {
    titleKey: "nav.main",
    defaultTitle: "MAIN",
    items: [
      { key: "nav.reception", defaultLabel: "Dashboard", href: "/dashboard/reception", icon: LayoutDashboard },
    ],
  },
  {
    titleKey: "nav.membership",
    defaultTitle: "MEMBERSHIP",
    items: [
      { key: "nav.members", defaultLabel: "Members", href: "/dashboard/members", icon: Users },
      { key: "nav.attendance", defaultLabel: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
      { key: "nav.qrCode", defaultLabel: "Gym QR Code", href: "/dashboard/gym-qr", icon: QrCode },
    ],
  },
  {
    titleKey: "nav.classesGroup",
    defaultTitle: "CLASSES",
    items: [
      { key: "nav.classes", defaultLabel: "Classes", href: "/dashboard/classes", icon: Dumbbell, requiresClassFeature: true },
    ],
  },
  {
    titleKey: "nav.finance",
    defaultTitle: "FINANCE",
    items: [
      { key: "nav.payments", defaultLabel: "Payments", href: "/dashboard/payments", icon: Wallet },
    ],
  },
];

const subscribeToAuthToken = () => () => undefined;
const getAuthTokenSnapshot = () => Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
const getServerAuthTokenSnapshot = () => false;
const getRoleSnapshot = () => window.localStorage.getItem(AUTH_ROLE_KEY);
const getServerRoleSnapshot = () => null;

type ProtectedDashboardLayoutProps = { children: ReactNode };

export function ProtectedDashboardLayout({ children }: ProtectedDashboardLayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasAuthToken = useSyncExternalStore(subscribeToAuthToken, getAuthTokenSnapshot, getServerAuthTokenSnapshot);
  const role = useSyncExternalStore(subscribeToAuthToken, getRoleSnapshot, getServerRoleSnapshot);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const isAuthenticated = hasAuthToken && !isLoggingOut;
  const isReceptionist = role === "Receptionist";
  const hasDashboardAccess = isAuthenticated && (isDevelopmentMode || canAccessDashboard(role));

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    enabled: isAuthenticated && hasDashboardAccess,
  });

  const hasClassFeature = summaryQuery.data?.hasClassFeature !== false;
  const trialActive = Boolean((summaryQuery.data as any)?.isTrialActive);
  const trialExpired = Boolean((summaryQuery.data as any)?.isTrialExpired);
  const trialDaysRemaining = Number((summaryQuery.data as any)?.trialDaysRemaining ?? 0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasDashboardAccess) {
      router.replace("/subscription");
      return;
    }

    if (isReceptionist) {
      const ownerOnlyRoutes = [
        "/dashboard/staff",
        "/dashboard/reports",
        "/dashboard/settings",
        "/dashboard/membership-plans",
        "/dashboard/whatsapp",
        "/dashboard/business-analytics",
      ];

      const isOwnerOnly = ownerOnlyRoutes.some((route) => pathname.startsWith(route));

      if (isOwnerOnly || pathname === "/dashboard") {
        router.replace("/dashboard/reception");
      }
    }

    if (summaryQuery.data && !hasClassFeature && pathname.startsWith("/dashboard/classes")) {
      router.replace("/dashboard");
    }
  }, [hasDashboardAccess, hasClassFeature, isAuthenticated, isReceptionist, pathname, router, summaryQuery.data]);

  const handleLogout = () => {
    queryClient.clear();
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_ROLE_KEY);
    setIsLoggingOut(true);
    router.replace("/login");
  };

  if (!hasDashboardAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-sm text-[#64748B]">
        {t('common.pleaseWait', 'Checking your session...')}
      </div>
    );
  }

  const rawGroups = isReceptionist ? receptionistNavGroups : ownerNavGroups;
  const homeHref = isReceptionist ? "/dashboard/reception" : "/dashboard";

  const mobileBottomNavItems = [
    { label: t('nav.dashboard', 'Home'), href: homeHref, icon: LayoutDashboard },
    { label: t('nav.members', 'Members'), href: "/dashboard/members", icon: Users },
    { label: t('nav.attendance', 'Attendance'), href: "/dashboard/attendance", icon: CalendarCheck },
    { label: t('nav.payments', 'Payments'), href: "/dashboard/payments", icon: Wallet },
  ];

  const sidebar = (
    <aside className="flex h-full w-72 flex-col bg-[#0F172A] px-4 py-5 text-slate-100 border-r border-slate-800">
      {/* Top Branding Header */}
      <div className="flex items-center gap-3 px-3 pb-5 border-b border-slate-800 mb-4">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs shadow-md">
          GP
        </span>
        <div>
          <p className="text-base font-extrabold tracking-tight text-white leading-tight">GymPulse</p>
          <p className="text-[11px] text-slate-400 font-medium">
            {isReceptionist ? t('auth.signIn', 'Receptionist Portal') : t('nav.management', 'Gym Management SaaS')}
          </p>
        </div>
      </div>

      {/* Navigation Links with Grouping */}
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1" aria-label="Dashboard navigation">
        {rawGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.requiresClassFeature && !hasClassFeature) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.titleKey} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold tracking-wider uppercase text-slate-500">
                {t(group.titleKey, group.defaultTitle)}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/dashboard" || item.href === "/dashboard/reception"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? "bg-slate-800 text-white border-l-4 border-blue-500 pl-2.5 shadow-xs"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`size-4 transition-colors ${
                          isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span>{t(item.key, item.defaultLabel)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Gym Profile / Logout Snapshot */}
      <div className="border-t border-slate-800 pt-3 mt-auto">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-800 text-xs font-extrabold text-blue-400 border border-slate-700">
              {isReceptionist ? "RC" : "GA"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Gym Administrator</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {isReceptionist ? t('staff.receptionist', 'Receptionist') : t('staff.owner', 'Gym Owner')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={t('common.logout', 'Sign Out')}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-[#0F172A] px-4 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs">
            GP
          </span>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-white block">GymPulse</span>
            <span className="text-[10px] text-slate-400 font-medium block">
              {isReceptionist ? "Receptionist" : "Management"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] font-extrabold text-blue-300 border border-blue-400/30">
            {isReceptionist ? "Reception" : "Admin"}
          </span>
        </div>
      </header>

      {/* Desktop Main Layout */}
      <div className="lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
        <div className="hidden lg:block lg:h-screen lg:sticky lg:top-0">{sidebar}</div>
        <main className="px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 pb-24 lg:pb-10">
          {trialActive && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500 font-black text-xs text-white shadow-sm">
                  3D
                </span>
                <div>
                  <p className="text-xs font-extrabold tracking-tight">
                    Free Trial Active — {trialDaysRemaining === 1 ? "Ends Today" : `${trialDaysRemaining} days remaining`}
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium leading-normal">
                    You currently have Growth Plan features. Upgrade anytime to unlock Pro automation & Group Classes.
                  </p>
                </div>
              </div>
              <Link
                href="/subscription"
                className="inline-flex items-center justify-center rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-amber-950 shrink-0"
              >
                Choose Subscription Plan
              </Link>
            </div>
          )}

          {trialExpired && pathname !== "/subscription" && !pathname.startsWith("/dashboard/membership-plans") && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/70 p-4 backdrop-blur-sm">
              <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl border border-slate-200">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 font-bold text-xl">
                  ⌛
                </span>
                <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900">Your 3-Day Free Trial Has Expired</h2>
                <p className="mt-2 text-xs leading-5 text-slate-600 font-medium">
                  Your trial period has ended. Select a customer plan (Growth, Pro, or Gym + Classes) to reactivate your gym dashboard.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/subscription"
                    className="inline-flex items-center justify-center rounded-xl bg-[#0F172A] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-slate-800"
                  >
                    View Pricing Plans
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-slate-800 bg-[#0F172A] px-2 text-slate-400 lg:hidden">
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard" || item.href === "/dashboard/reception"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-extrabold transition ${
                isActive ? "text-blue-400" : "hover:text-slate-200"
              }`}
            >
              <Icon className={`size-5 ${isActive ? "text-blue-400 stroke-[2.5]" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More Tab Trigger */}
        <button
          type="button"
          onClick={() => setIsMoreSheetOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-extrabold transition ${
            isMoreSheetOpen ? "text-blue-400" : "hover:text-slate-200"
          }`}
        >
          <MoreHorizontal className={`size-5 ${isMoreSheetOpen ? "text-blue-400 stroke-[2.5]" : "text-slate-400"}`} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Bottom Sheet */}
      <MobileBottomSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        title="Management Modules"
        subtitle="Quick access to extended business tools"
      >
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          {[
            { label: "Membership Plans", href: "/dashboard/membership-plans", icon: BadgePercent, isOwnerOnly: false },
            { label: "Business Analytics", href: "/dashboard/business-analytics", icon: TrendingUp, isOwnerOnly: true },
            ...(hasClassFeature ? [{ label: "Classes & Sessions", href: "/dashboard/classes", icon: Dumbbell, isOwnerOnly: false }] : []),
            { label: "WhatsApp Auto", href: "/dashboard/whatsapp", icon: MessageSquare, isOwnerOnly: true },
            { label: "Reports", href: "/dashboard/reports", icon: BarChart3, isOwnerOnly: true },
            { label: "Staff Management", href: "/dashboard/staff", icon: UserCog, isOwnerOnly: true },
            { label: "Gym QR Code", href: "/dashboard/gym-qr", icon: QrCode, isOwnerOnly: false },
            { label: "Gym Settings", href: "/dashboard/settings", icon: Settings, isOwnerOnly: true },
          ]
            .filter((item) => !isReceptionist || !item.isOwnerOnly)
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition"
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-slate-800 text-blue-400">
                    <Icon className="size-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
        </div>

        <div className="border-t border-slate-800 pt-4 mt-2">
          <button
            type="button"
            onClick={() => {
              setIsMoreSheetOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
          >
            <LogOut className="size-4" /> Sign Out
          </button>
        </div>
      </MobileBottomSheet>
    </div>
  );
}
