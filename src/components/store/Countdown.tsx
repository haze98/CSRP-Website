"use client";
import { useEffect, useState } from "react";

/** Launch countdown — only rendered when server.config store.launchDate is set. */
export function Countdown({ target }: { target: string }) {
  const end = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (Number.isNaN(end)) return null;
  const left = now === null ? null : Math.max(0, end - now);
  const parts = [
    { k: "Days", v: left === null ? null : Math.floor(left / 86400000) },
    { k: "Hours", v: left === null ? null : Math.floor(left / 3600000) % 24 },
    { k: "Minutes", v: left === null ? null : Math.floor(left / 60000) % 60 },
    { k: "Seconds", v: left === null ? null : Math.floor(left / 1000) % 60 },
  ];
  return (
    <div role="timer" aria-label="Time until store launch" className="flex gap-3">
      {parts.map((p) => (
        <div key={p.k} className="card min-w-[78px] px-4 py-3 text-center">
          <p className="font-display text-4xl font-bold tabular-nums text-snow">{p.v === null ? "--" : String(p.v).padStart(2, "0")}</p>
          <p className="tag !text-[0.58rem]">{p.k}</p>
        </div>
      ))}
    </div>
  );
}
