import { ShieldX } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

/** HTTP 403 — shown when someone without website admin access opens /admin. Sends them home after a few seconds. */
export default function Forbidden() {
  return (
    <section className="grid min-h-[100svh] place-items-center px-5 pb-16 pt-32 text-center">
      <meta httpEquiv="refresh" content="5;url=/" />
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-crimson-500/30 bg-crimson-500/10 text-crimson-400">
          <ShieldX size={26} aria-hidden="true" />
        </span>
        <p className="tag mt-8">[ Error 403 ]</p>
        <h1 className="h-display mt-4 text-6xl text-snow sm:text-7xl">Unauthorized</h1>
        <p className="mx-auto mt-4 max-w-md text-silver-400">This area is restricted to authorized CSRP staff. Taking you back to the city…</p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/">Back to the city</ButtonLink>
        </div>
      </div>
    </section>
  );
}
