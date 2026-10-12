import type { MetadataRoute } from "next";
import { serverConfig } from "@/config/server.config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: serverConfig.name,
    short_name: serverConfig.shortName,
    description: serverConfig.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#030304",
    theme_color: "#030304",
    icons: [{ src: "/brand/csrp-logo-512.png", sizes: "512x512", type: "image/png" }],
  };
}
