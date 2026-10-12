import Image from "next/image";

/** Discord avatar, or initials on a dark crimson/royal gradient when none exists. */
export function Avatar({ name, src, size = 48, className = "" }: { name: string; src?: string | null; size?: number; className?: string }) {
  const hue = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 2;
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-full w-full place-items-center font-display font-bold text-snow/90"
          style={{ fontSize: size * 0.4, background: hue ? "linear-gradient(145deg,#1f44c9,#0b0c10)" : "linear-gradient(145deg,#a8102f,#0b0c10)" }}
        >
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
