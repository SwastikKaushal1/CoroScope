import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BRAND } from "@/config/brand";
import "./globals.css";

// Self-hosted at build time by next/font: no request to Google from the visitor's browser.
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: `${BRAND} · See your heart risk`,
  description: "Explainable AI that maps coronary artery disease risk onto an interactive 3D heart. Decision support only.",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
