"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react";
import { loginAdmin } from "@/src/services/admin.service";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginAdmin({ email: email.trim(), password });
      router.replace("/admin");
    } catch (err: any) {
      console.error("Super admin login error:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Invalid Super Admin credentials or unauthorized access.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 antialiased">
      <div className="relative w-full max-w-md">
        {/* Brand Card Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <Image
              src="/assets/branding/symbol/symbol-dark.png"
              alt="obo"
              width={48}
              height={48}
              className="size-12 object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            obo Control Center
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Internal Super Admin Authentication
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Smart Gym Management Software &bull; Company Administration
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl ring-1 ring-white/5">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@obo.fit"
                  className="block w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Master Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Enter Control Center</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Security Warning Footer */}
        <div className="mt-8 text-center text-[11px] text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-400">RESTRICTED INTERNAL AREA</p>
          <p className="mt-1">
            This console is strictly for authorized obo platform operators. All access attempts, IP addresses, and operational actions are immutably logged for security auditing.
          </p>
        </div>
      </div>
    </div>
  );
}
