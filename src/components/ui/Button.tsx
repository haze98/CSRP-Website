import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "crimson" | "royal" | "discord" | "outline" | "light" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg font-display font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  // Surya — primary action
  crimson:
    "bg-crimson-500 text-white shadow-[0_10px_30px_-12px_rgba(212,22,60,0.75),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-crimson-400 hover:shadow-[0_12px_36px_-10px_rgba(240,70,100,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]",
  // Chandra — secondary emphasis
  royal: "bg-royal-500 text-white shadow-[0_10px_30px_-12px_rgba(47,91,255,0.75),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-royal-400",
  discord: "bg-[#5865F2] text-white shadow-[0_10px_30px_-12px_rgba(88,101,242,0.8),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-[#6d78f5]",
  // dark fill, clear white border (secondary actions on imagery)
  light: "border border-white/60 bg-[#06070a]/70 text-snow backdrop-blur-sm hover:border-white hover:bg-white/[0.08]",
  outline: "border border-white/14 bg-white/[0.03] text-snow hover:border-white/30 hover:bg-white/[0.07]",
  ghost: "text-silver-300 hover:text-snow",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.82rem]",
  md: "h-12 px-6 text-[0.92rem]",
  lg: "h-14 px-7 text-base",
};

export const btn = (variant: Variant = "crimson", size: Size = "md", extra = "") => `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

/** Light sweep shown on hover for filled buttons. */
const Sheen = () => (
  <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.22)_50%,transparent_70%)] transition-transform duration-700 group-hover:translate-x-full" />
);

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode; magnetic?: boolean };

/** Internal links via next/link; http(s)/fivem links open natively (http in a new tab). */
export function ButtonLink({ href, variant = "crimson", size, className, children, magnetic = true, ...rest }: Common & { href: string } & Omit<ComponentProps<"a">, "href" | "className">) {
  const cls = btn(variant, size, className);
  const filled = variant === "crimson" || variant === "royal" || variant === "discord";
  const m = magnetic ? { "data-magnetic": "" } : {};
  if (/^(https?:|fivem:)/.test(href)) {
    return (
      <a href={href} className={cls} {...m} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {filled && <Sheen />}
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...m} {...rest}>
      {filled && <Sheen />}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </Link>
  );
}

export function Button({ variant = "crimson", size, className, children, magnetic = false, type = "button", ...rest }: Common & Omit<ComponentProps<"button">, "className">) {
  const filled = variant === "crimson" || variant === "royal" || variant === "discord";
  return (
    <button type={type} className={btn(variant, size, className)} {...(magnetic ? { "data-magnetic": "" } : {})} {...rest}>
      {filled && <Sheen />}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
