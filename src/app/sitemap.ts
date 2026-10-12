import type { MetadataRoute } from "next";
import { serverConfig } from "@/config/server.config";
import { legalDocs } from "@/data/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = serverConfig.siteUrl.replace(/\/$/, "");
  const pages = ["", "/applications", "/rules", "/store", "/status", "/discord", "/support", ...legalDocs.map((d) => `/legal/${d.slug}`)];
  return pages.map((p) => ({ url: `${base}${p}`, changeFrequency: p === "/status" ? "hourly" : "weekly", priority: p === "" ? 1 : 0.7 }));
}
