"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/**
 * A form that adds the browser's UTC offset for its datetime-local field,
 * so times entered in your own time zone are saved correctly.
 */
export function TzForm({ children, ...props }: ComponentProps<"form">) {
  return (
    <form
      {...props}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const when = form.elements.namedItem("starts_at") as HTMLInputElement | null;
        const offset = form.elements.namedItem("tz_offset") as HTMLInputElement | null;
        if (when?.value && offset) offset.value = String(new Date(when.value).getTimezoneOffset());
      }}
    >
      <input type="hidden" name="tz_offset" defaultValue="0" />
      {children}
    </form>
  );
}

/** Formats an ISO time as a value for <input type="datetime-local"> in the browser's zone. */
export function LocalDateTimeInput({ iso, ...props }: { iso?: string } & ComponentProps<"input">) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!iso || !ref.current) return;
    const d = new Date(iso);
    ref.current.value = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }, [iso]);
  return <input ref={ref} type="datetime-local" name="starts_at" {...props} />;
}
