import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HostelPro - Hostel/PG/Co-living ERP Management System",
  description: "Complete ERP SaaS platform for PG owners, hostel owners, co-living operators, and property managers. Manage properties, tenants, payments, complaints, and more.",
  keywords: ["HostelPro", "Hostel Management", "PG Management", "Co-living", "ERP", "Property Management", "SaaS"],
  authors: [{ name: "HostelPro Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
