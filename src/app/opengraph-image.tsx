import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { serverConfig } from "@/config/server.config";

export const alt = `${serverConfig.name} — ${serverConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const [mark, moon, sun] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/csrp-logo-512.png")),
    readFile(join(process.cwd(), "public/art/moon.webp")).catch(() => null),
    readFile(join(process.cwd(), "public/art/sun.webp")).catch(() => null),
  ]);
  const src = (b: Buffer, t: string) => `data:${t};base64,${b.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(60% 80% at 10% 40%, #10204f 0%, #030304 60%), #030304", position: "relative", color: "#f4f5f7", fontFamily: "sans-serif" }}>
        {moon && <img src={src(moon, "image/webp")} width={460} height={460} style={{ position: "absolute", left: -150, top: 80, opacity: 0.85 }} alt="" />}
        {sun && <img src={src(sun, "image/webp")} width={520} height={520} style={{ position: "absolute", right: -190, top: 50 }} alt="" />}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={src(mark, "image/png")} width={120} height={120} alt="" />
          <div style={{ marginTop: 26, fontSize: 84, fontWeight: 800, letterSpacing: -1, textTransform: "uppercase" }}>Chandra Surya</div>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -1, textTransform: "uppercase", color: "#f04664", marginTop: -14 }}>Roleplay</div>
          <div style={{ marginTop: 22, fontSize: 28, letterSpacing: 8, textTransform: "uppercase", color: "#b0b6c3" }}>{serverConfig.tagline}</div>
        </div>
      </div>
    ),
    size,
  );
}
