"use client";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="grid min-h-[100svh] place-items-center px-5 pb-16 pt-32 text-center">
      <div>
        <p className="tag">[ Something broke ]</p>
        <h1 className="h-display mt-4 text-6xl text-snow sm:text-7xl">Signal lost</h1>
        <p className="mx-auto mt-4 max-w-md text-silver-400">An unexpected error happened while loading this page. Try again — if it keeps happening, let staff know.</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-silver-500">Ref {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="outline">Home</ButtonLink>
        </div>
      </div>
    </section>
  );
}
