"use client";
import { LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ApiResult } from "@/types";

/** Reply box shown when staff requested more information on a whitelist application. */
export function ApplicantReply({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/applications/${applicationId}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
    const j = (await r.json()) as ApiResult<unknown>;
    setBusy(false);
    if (!j.ok) return setErr(j.error);
    setText("");
    router.refresh();
  };
  return (
    <div className="mt-5">
      <label htmlFor="app-reply" className="text-sm font-medium text-snow">Reply to staff</label>
      <textarea id="app-reply" value={text} onChange={(e) => setText(e.target.value.slice(0, 1500))} rows={4} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-void/70 px-4 py-3 text-sm text-snow outline-none focus:border-royal-400/70" placeholder="Add the information staff asked for…" />
      {err && <p role="alert" className="mt-2 text-sm text-crimson-400">{err}</p>}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-silver-500">{text.length} / 1500</span>
        <Button variant="royal" size="sm" disabled={busy || text.trim().length < 10} onClick={send}>
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />} Send reply
        </Button>
      </div>
    </div>
  );
}
