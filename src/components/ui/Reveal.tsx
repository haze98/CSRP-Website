import type { ReactNode } from "react";

/**
 * Scroll reveal that can NEVER leave content invisible.
 *
 * Content is server-rendered fully visible. A tiny inline script in <head>
 * (see revealScript) adds `js-reveal` to <html> only when JavaScript and
 * IntersectionObserver are available and the user hasn't asked for reduced
 * motion; only then are `.reveal` elements pre-hidden, and the same script
 * reveals them as they enter the viewport. It does not depend on React
 * hydration, data fetching or Framer Motion, and a 3s failsafe reveals
 * everything regardless. The script adds data-in before React hydrates, so
 * .reveal elements carry suppressHydrationWarning (their own attributes only).
 */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <div suppressHydrationWarning className={`reveal ${className}`} style={delay ? ({ ["--rd" as string]: `${delay}s` } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}

/** Container whose direct RevealItem children reveal with a stagger (CSS nth-child delays). */
export function Stagger({ children, className = "" }: { children: ReactNode; className?: string; gap?: number }) {
  return <div className={`stagger ${className}`}>{children}</div>;
}

export function RevealItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div suppressHydrationWarning className={`reveal ${className}`}>
      {children}
    </div>
  );
}

/** Inline <head> script — plain JS, runs before paint, independent of React. */
export const revealScript = `(function(){try{
var d=document.documentElement;
if(!('IntersectionObserver' in window)||!('MutationObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
d.classList.add('js-reveal');
var show=function(el){el.setAttribute('data-in','')};
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:0.01});
var seen=new WeakSet();
var track=function(el){if(seen.has(el)||el.hasAttribute('data-in'))return;seen.add(el);io.observe(el)};
var scan=function(n){if(n.nodeType!==1)return;if(n.classList.contains('reveal'))track(n);n.querySelectorAll('.reveal').forEach(track)};
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(scan)})}).observe(d,{childList:true,subtree:true});
document.querySelectorAll('.reveal').forEach(track);
setTimeout(function(){document.querySelectorAll('.reveal:not([data-in])').forEach(function(el){if(el.getBoundingClientRect().top<innerHeight*1.2)show(el)})},3000);
}catch(e){document.documentElement.classList.remove('js-reveal')}})();`;
