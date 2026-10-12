"use client";
import { ChevronDown } from "lucide-react";
import { useId } from "react";
import type { AppField } from "@/config/applications";

const input =
  "w-full rounded-lg border bg-void/70 px-4 py-3 text-[0.95rem] text-snow placeholder:text-silver-500 outline-none transition-[border-color,box-shadow] duration-200 focus:border-royal-400/70 focus:shadow-[0_0_0_3px_rgba(95,134,255,0.16)]";

/** Labelled control for a configured field, with counter, help and error. */
export function FormField({ field, value, error, onChange, onBlur, autoFocus }: { field: AppField; value: string; error?: string | null; onChange: (v: string) => void; onBlur?: () => void; autoFocus?: boolean }) {
  const id = useId();
  const errId = `${id}-e`;
  const border = error ? "border-crimson-500/70" : "border-white/10";
  const common = {
    id,
    name: field.key,
    value,
    onBlur,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errId : undefined,
    "aria-required": field.required || undefined,
    ...(autoFocus ? { "data-autofocus": "" } : {}),
  };
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-snow">
          {field.label}
          {field.required ? <span className="ml-0.5 text-crimson-400" aria-hidden="true">*</span> : <span className="ml-2 text-xs text-silver-500">optional</span>}
        </label>
        {field.kind === "textarea" && field.max && <span className={`shrink-0 text-xs tabular-nums ${value.length > field.max ? "text-crimson-400" : "text-silver-500"}`}>{value.length}/{field.max}</span>}
      </div>
      {field.kind === "textarea" ? (
        <textarea {...common} rows={4} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={`${input} ${border} min-h-[120px] resize-y`} />
      ) : field.kind === "select" ? (
        <div className="relative">
          <select {...common} onChange={(e) => onChange(e.target.value)} className={`${input} ${border} appearance-none pr-10 ${value ? "" : "text-silver-500"}`}>
            <option value="">Choose…</option>
            {field.options?.map((o) => (
              <option key={o} value={o} className="bg-charcoal text-snow">
                {o}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-silver-500" aria-hidden="true" />
        </div>
      ) : (
        <input
          {...common}
          type={field.kind === "number" ? "number" : field.kind === "url" ? "url" : "text"}
          inputMode={field.kind === "number" ? "numeric" : undefined}
          min={field.kind === "number" ? field.min : undefined}
          max={field.kind === "number" ? field.max : undefined}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${input} ${border}`}
        />
      )}
      {field.help && <p className="mt-2 text-xs text-silver-500">{field.help}</p>}
      {error && (
        <p id={errId} role="alert" className="mt-2 text-sm text-crimson-400">
          {error}
        </p>
      )}
    </div>
  );
}
