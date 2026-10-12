import Image from "next/image";

/**
 * The official CSRP crest (source: Logo/CSRP_1.7.webp, exported to
 * public/brand by scripts/export-logo.mjs). Small sizes use the 256px file.
 */
export function CsrpCrest({ size = 48, priority = false, eager = false, className = "", alt = "" }: { size?: number; priority?: boolean; eager?: boolean; className?: string; alt?: string; animate?: boolean }) {
  return (
    <Image
      src={size <= 128 ? "/brand/csrp-logo-256.webp" : "/brand/csrp-logo.webp"}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      loading={priority || eager ? "eager" : undefined}
      sizes={`${size}px`}
      className={`select-none object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)] ${className}`}
      draggable={false}
    />
  );
}

/** Crest + wordmark lockup for the navbar. */
export function CsrpLogo({ compact = false }: { compact?: boolean; animate?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      {/* eager, not priority: a preload <link> for this tiny image only produced "preloaded but not used" warnings */}
      <CsrpCrest size={60} eager className="h-12 w-12 sm:h-[60px] sm:w-[60px]" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.55rem] font-bold tracking-[0.08em] text-snow">CSRP</span>
        {!compact && <span className="mt-1 hidden text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-silver-300 sm:block">Chandra Surya Roleplay</span>}
      </span>
    </span>
  );
}
