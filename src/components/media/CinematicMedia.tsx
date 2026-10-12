"use client";
import Image from "next/image";
import { useState } from "react";
import type { ResolvedMedia } from "@/config/media";

/**
 * A homepage image (next/image, fills its container — no layout shift).
 * If the file is missing or fails to load, a clean black gradient with CSRP
 * red / blue glow is shown instead; callers keep their own title on top.
 * `tint` adds the subtle red/blue colour grade used on cards.
 */
export function CinematicMedia({ media, sizes, priority = false, tint = false, quality = 82, imgClassName = "", className = "" }: { media: ResolvedMedia; sizes: string; priority?: boolean; tint?: boolean; quality?: number; imgClassName?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const night = media.grade === "night";
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#06070b] ${className}`}>
      {media.src && !failed ? (
        <>
          <Image
            src={media.src}
            alt={media.alt}
            fill
            // Next 16: `preload` replaces the deprecated `priority` (hero = LCP image)
            preload={priority}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes={sizes}
            quality={quality}
            onError={() => setFailed(true)}
            className={`object-cover ${imgClassName} ${night ? "brightness-[0.55] saturate-[0.7] hue-rotate-[-12deg]" : tint ? "saturate-[0.88]" : ""}`}
            style={{ objectPosition: media.focus ?? "50% 50%" }}
          />
          {night && <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,60,0.55),rgba(5,6,8,0.35))] mix-blend-multiply" />}
          {tint && <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(120deg,rgba(47,91,255,0.12),transparent_45%,rgba(220,20,60,0.12))] mix-blend-soft-light" />}
        </>
      ) : (
        <Fallback />
      )}
    </div>
  );
}

/** Missing / broken image: black gradient + CSRP red/blue light. No text. */
function Fallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#07080c,#050608)]">
      <div className="glow-drift absolute -left-[15%] top-[5%] h-[90%] w-[60%] bg-[radial-gradient(closest-side,rgba(47,91,255,0.22),transparent)]" />
      <div className="glow-drift absolute -right-[15%] bottom-0 h-[90%] w-[60%] bg-[radial-gradient(closest-side,rgba(212,22,60,0.24),transparent)]" style={{ animationDelay: "-7s" }} />
    </div>
  );
}
