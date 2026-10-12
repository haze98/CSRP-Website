import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { serverConfig } from "@/config/server.config";
import { resolveMedia } from "@/server/media";

export const alt = `${serverConfig.name} — ${serverConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  // the hero screenshot (when added as .jpg/.png) becomes the backdrop of the share card
  const hero = resolveMedia("hero");
  const [mark, photo] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/csrp-logo-512.png")),
    hero.src && /\.(jpe?g|png)$/.test(hero.src) ? readFile(join(process.cwd(), "public", hero.src)).catch(() => null) : Promise.resolve(null),
  ]);
  const src = (b: Buffer, t: string) => `data:${t};base64,${b.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(55% 80% at 0% 50%, rgba(47,91,255,0.35) 0%, transparent 70%), radial-gradient(55% 80% at 100% 50%, rgba(212,22,60,0.35) 0%, transparent 70%), #050608", position: "relative", color: "#f4f5f7", fontFamily: "sans-serif" }}>
        {photo && <img src={src(photo, hero.src!.endsWith(".png") ? "image/png" : "image/jpeg")} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.45 }} alt="" />}
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
