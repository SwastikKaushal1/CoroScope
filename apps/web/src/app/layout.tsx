import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND} - coronary risk`,
  description: "Interactive 3D coronary artery risk visualization (decision support only).",
};

// Root layout: wraps every page. No custom fonts, so there is nothing to download.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
