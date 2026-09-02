"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { AUTH_TOKEN_KEY } from "@/src/lib/api-client";
import { AUTH_ROLE_KEY, canAccessDashboard, isDevelopmentMode } from "@/src/lib/subscription-state";
import { login } from "@/src/services/auth.service";
import type { LoginCredentials } from "@/src/types/api";
import { getApiErrorMessage } from "@/src/utils/get-api-error-message";

const gymImageUrl =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=85&w=1800";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const pageTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] } as const;

function GymPulseMark() {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3" aria-label="GymPulse">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#0F172A] shadow-[0_10px_26px_rgba(15,23,42,0.2)]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-white stroke-[2.4]">
            <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-xl font-bold tracking-[-0.05em] text-[#0F172A]">GymPulse</span>
      </div>

      <a href="/" className="text-xs font-bold text-[#64748B] hover:text-[#0F172A]">
        ← Role Selection
      </a>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token, owner }) => {
      queryClient.clear();
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(AUTH_ROLE_KEY, owner.role);
      toast.success("Login successful.");
      if (owner.role === "Receptionist") {
        router.replace("/dashboard/reception");
      } else {
        router.replace(isDevelopmentMode || canAccessDashboard(owner.role) ? "/dashboard" : "/subscription");
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const onSubmit = (credentials: LoginCredentials) => loginMutation.mutate(credentials);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={pageTransition}
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] lg:grid lg:grid-cols-[minmax(0,0.94fr)_minmax(520px,1.06fr)]"
    >
      <section className="relative flex min-h-screen px-5 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-[clamp(3rem,7vw,8rem)]">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(203,213,225,0.55),transparent_68%)]" />
        <div className="relative mx-auto flex w-full max-w-[28rem] flex-1 flex-col">
          <GymPulseMark />

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...pageTransition, delay: 0.1 }}
            className="my-auto py-12 sm:py-16 lg:py-12"
          >
            <div className="mb-9">
              <p className="mb-3 text-xs font-bold tracking-[0.18em] text-[#64748B]">GYM MANAGEMENT PLATFORM</p>
              <h1 className="max-w-sm text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#0F172A] sm:text-5xl">Welcome back to your momentum.</h1>
              <p className="mt-4 max-w-md text-[15px] leading-6 text-[#64748B]">Sign in to keep your members, operations, and growth moving in one direction.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <motion.div whileFocus={{ y: -1 }} transition={{ duration: 0.18 }}>
                <label className="mb-2 block text-sm font-semibold text-[#334155]" htmlFor="email">Email address</label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 text-[15px] text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.02)] outline-none transition duration-200 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#334155] focus:ring-4 focus:ring-slate-200"
                />
                {errors.email && <p id="email-error" className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
              </motion.div>

              <motion.div whileFocus={{ y: -1 }} transition={{ duration: 0.18 }}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold text-[#334155]" htmlFor="password">Password</label>
                  <a href="mailto:support@gympulse.com?subject=Password%20reset" className="text-sm font-semibold text-[#475569] transition hover:text-[#0F172A] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#334155]">Forgot password?</a>
                </div>
                <div className="relative">
                  <input
                    {...register("password")}
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 pr-20 text-[15px] text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.02)] outline-none transition duration-200 placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#334155] focus:ring-4 focus:ring-slate-200"
                  />
                  <button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-2 my-auto rounded-lg px-3 text-sm font-semibold text-[#64748B] transition hover:text-[#0F172A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#334155]" aria-label={isPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isPasswordVisible}>
                    {isPasswordVisible ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <p id="password-error" className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
              </motion.div>

              <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium text-[#64748B]">
                <input type="checkbox" name="remember" className="size-4 rounded border-[#CBD5E1] accent-[#334155] focus:ring-2 focus:ring-slate-300" />
                Remember me
              </label>

              <motion.button
                whileHover={{ y: -2, boxShadow: "0 16px 32px rgba(15, 23, 42, 0.22)" }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.18 }}
                className="w-full rounded-xl bg-[#0F172A] px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)] outline-none transition-colors hover:bg-[#1E293B] focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In to Management"}
              </motion.button>

              <div className="pt-2 text-center text-xs text-[#64748B]">
                Need a gym workspace?{" "}
                <a href="/create-account" className="font-bold text-[#0F172A] hover:underline">
                  Create Gym Account
                </a>
              </div>
            </form>
          </motion.div>

          <p className="text-xs text-[#94A3B8]">© {new Date().getFullYear()} GymPulse. Built for stronger businesses.</p>
        </div>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden lg:block" aria-label="Gym training space">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={gymImageUrl}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-man-runs-on-a-treadmill-at-the-gym-41562-large.mp4" type="video/mp4" />
          <Image src={gymImageUrl} alt="Premium modern gym with strength training equipment" fill sizes="(min-width: 1024px) 55vw, 0px" className="object-cover" priority />
        </video>
        <div className="absolute inset-0 bg-[#0F172A]/65" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.4),rgba(15,23,42,0.85))]" />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...pageTransition, delay: 0.25 }}
          className="absolute inset-x-0 bottom-0 p-10 xl:p-16"
        >
          <div className="max-w-xl border-l-2 border-amber-400 pl-6">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
              GYMPULSE ENTERPRISE PLATFORM
            </span>
            <p className="mt-3 text-3xl font-bold leading-[1.15] tracking-[-0.04em] text-white xl:text-4xl">
              Elevate every member experience. Stay ahead of every operation.
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-6 text-slate-300">
              One clear view of member check-ins, automated payments, class schedules, and business growth.
            </p>
          </div>
        </motion.div>
      </aside>
    </motion.main>
  );
}
