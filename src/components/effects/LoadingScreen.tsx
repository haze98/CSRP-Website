"use client";
import { useEffect, useState } from "react";
import { CsrpCrest } from "@/components/brand/CsrpLogo";

const KEY = "csrp-intro";

/**
 * Initial-load intro (once per browser session, ~1s): moonlight drifts in
 * from the left, sunlight from the right, the CSRP crest settles between
 * them, then the overlay fades. Timing is pure CSS and the overlay never
 * blocks clicks, so it always exits — even if JavaScript or any request
 * fails. JS only removes it from the DOM and remembers it was shown.
 */
export function LoadingScreen() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    const t = setTimeout(() => setGone(true), 1100);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="csrp-intro" aria-hidden="true">
      <div className="csrp-intro-moon" />
      <div className="csrp-intro-sun" />
      <div className="csrp-intro-crest relative">
        <CsrpCrest size={200} priority className="h-40 w-40 sm:h-[200px] sm:w-[200px]" />
      </div>
    </div>
  );
}

/** Inline (blocking) head script: skip the intro on repeat loads in this session. */
export const introScript = `try{if(sessionStorage.getItem("${KEY}"))document.documentElement.dataset.intro="done"}catch(e){}`;
