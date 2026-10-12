import type { MetadataRoute } from "next";
import { serverConfig } from "@/config/server.config";

export default function robots(): MetadataRoute.Robots {
  const base = serverConfig.siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api/", "/login"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
