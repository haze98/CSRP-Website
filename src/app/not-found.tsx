import { CsrpCrest } from "@/components/brand/CsrpLogo";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="grid min-h-[100svh] place-items-center px-5 pb-16 pt-32 text-center">
      <div>
        <div className="mx-auto w-fit opacity-80">
          <CsrpCrest size={72} />
        </div>
        <p className="tag mt-8">[ Error 404 ]</p>
        <h1 className="h-display mt-4 text-[4.5rem] text-snow sm:text-[8rem]">Off the map</h1>
        <p className="mx-auto mt-4 max-w-md text-silver-400">This street doesn&apos;t exist in Chandra Surya. It may have moved, or the link was mistyped.</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Back to the city</ButtonLink>
          <ButtonLink href="/support" variant="outline">Contact support</ButtonLink>
        </div>
      </div>
    </section>
  );
}
