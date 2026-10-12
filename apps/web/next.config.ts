import type { NextConfig } from "next";

/** Where the FastAPI backend runs, as seen from the Next.js server (not the browser). */
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // The browser calls /api/* on the same origin and Next.js forwards it to FastAPI. One address
  // for everything, so a phone that scans the share QR code can reach the API too, with no CORS.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/:path*` }];
  },
  // Dev only: let phones and laptops on the same home/office network open the dev server.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
