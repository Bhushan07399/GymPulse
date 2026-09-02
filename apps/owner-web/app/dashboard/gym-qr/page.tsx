"use client";

import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { getGymAttendanceQr } from "@/src/services/gym-settings.service";
import { PlanLockedState } from "@/src/components/common/plan-locked-state";

export default function ManagementGymQrPage() {
  const qrImageRef = useRef<HTMLImageElement>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gym-attendance-qr"],
    queryFn: getGymAttendanceQr,
  });

  // TESTING PHASE BYPASS: Disable UI feature lock during testing
  const isLocked = false; // Original check: (error as any)?.response?.data?.error?.code === "FEATURE_LOCKED";

  if (isLocked) {
    return <PlanLockedState featureName="Gym Attendance QR Code" requiredPlan="Growth" />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-sm text-slate-500 font-medium">
        Generating Gym Attendance QR Code...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-center text-xs text-red-600 space-y-3">
        <p className="font-bold">Failed to load Gym QR Code.</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const { gymName, gymQrString, instructions } = data;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
    gymQrString
  )}`;

  // High-Quality PNG Canvas Download Handler
  const handleDownloadPng = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill White Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 800, 1000);

    // Border Card
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 740, 940);

    // Header Gym Name
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 38px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(gymName.toUpperCase(), 400, 120);

    ctx.fillStyle = "#2563EB";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.fillText("SCAN TO CHECK IN & CHECK OUT", 400, 170);

    // Load and Draw QR Code Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 150, 220, 500, 500);

      // Instructions Footer
      ctx.fillStyle = "#475569";
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.fillText("Official Gym Attendance QR Code", 400, 780);

      ctx.fillStyle = "#64748B";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText("1. Open GymPulse Member Mobile App", 400, 820);
      ctx.fillText("2. Tap QR Camera Scanner at bottom navigation", 400, 850);
      ctx.fillText("3. Point camera at this QR Code to Check In or Check Out", 400, 880);

      // Trigger Download Link
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${gymName.replace(/[^a-zA-Z0-9]/g, "_")}_Attendance_QR.png`;
      a.click();
    };
    img.src = qrCodeImageUrl;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Controls (Hidden during print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 border border-blue-200">
              <Sparkles className="h-3.5 w-3.5 fill-blue-600" />
              GYM ATTENDANCE SYSTEM
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Official Gym Attendance QR Code
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Permanent reception QR code for member mobile check-in & check-out camera scanning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              Print QR Poster
            </button>
          </div>
        </div>

        {/* PRINTABLE QR POSTER CARD */}
        <div className="printable-qr-poster rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl text-center space-y-6">
          {/* Gym Branding Header */}
          <div className="space-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 font-extrabold text-sm text-white shadow-md">
              GP
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase pt-2">
              {gymName}
            </h2>
            <p className="text-sm font-extrabold text-blue-600 tracking-wider uppercase">
              SCAN TO CHECK IN & CHECK OUT
            </p>
          </div>

          {/* QR Code Container */}
          <div className="mx-auto flex w-fit items-center justify-center rounded-3xl border-4 border-slate-900 bg-white p-6 shadow-2xl">
            <img
              ref={qrImageRef}
              src={qrCodeImageUrl}
              alt={`${gymName} Official Attendance QR Code`}
              className="h-64 w-64 sm:h-80 sm:w-80 object-contain"
            />
          </div>

          {/* Member Instructions Footer */}
          <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Official Member Check-In & Check-Out QR
            </div>
            <ol className="text-[11px] text-slate-600 font-medium space-y-1 list-decimal list-inside">
              <li>Open your <strong>GymPulse Member App</strong> on mobile.</li>
              <li>Tap <strong>QR Scanner</strong> icon on the bottom navigation bar.</li>
              <li>Scan this QR Code at reception for instant entrance log.</li>
            </ol>
          </div>

          <p className="text-[10px] text-slate-400 font-mono no-print">
            Gym ID: {data.gymId} | Permanent Reception Code
          </p>
        </div>

        {/* Global Print Media Query Styles */}
        <style>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .no-print,
            header,
            aside,
            nav {
              display: none !important;
            }
            .printable-qr-poster {
              border: 4px solid #000000 !important;
              box-shadow: none !important;
              margin: 0 auto !important;
              padding: 2rem !important;
              width: 100% !important;
              max-width: 800px !important;
            }
          }
        `}</style>
    </div>
  );
}
