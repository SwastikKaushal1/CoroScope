import type { Metadata } from "next";
import { BRAND } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND} - coronary risk`,
  description: "Interactive 3D coronary artery risk visualization (decision support only).",
  icons: { icon: [{ url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" }, { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-icon.png" },
};

// Root layout: wraps every page. No custom fonts, so there is nothing to download.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
