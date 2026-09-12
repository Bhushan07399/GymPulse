import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/src/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "obo — Smart Gym Management Software",
  description: "Smart gym management software for member operations, billing, attendance, classes, analytics, and WhatsApp automation.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/pwa-192x192.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
