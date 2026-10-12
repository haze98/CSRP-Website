import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a second local instance (e.g. a verification run) use its own build folder.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  poweredByHeader: false,
  // Dev only: let phones/other PCs on your LAN (http://192.168.x.x:3000) load the
  // dev scripts. Without this Next blocks them, React never starts, and the page
  // can't hydrate. Add tunnels/hostnames via ALLOWED_DEV_ORIGINS (comma-separated).
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.*.*.*", ...(process.env.ALLOWED_DEV_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)],
  images: {
    formats: ["image/avif", "image/webp"],
    // Discord avatars for logged-in users and developer cards.
    remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }],
  },
  // authInterrupts enables forbidden() → real 403 for non-admins on /admin
  experimental: { optimizePackageImports: ["motion", "lucide-react"], authInterrupts: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
