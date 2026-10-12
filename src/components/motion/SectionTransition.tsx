/**
 * Thin moon→sun hairline between sections that draws in from the centre
 * when it enters view (safe reveal: visible without JS).
 */
export function SectionTransition({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`mx-auto w-full max-w-[1440px] px-5 sm:px-8 ${className}`}>
      <div suppressHydrationWarning className="reveal reveal-line relative h-px">
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#a9bdd8]/40 to-transparent" />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson-500 shadow-[0_0_10px_rgba(220,20,60,0.8)]" />
      </div>
    </div>
  );
}
