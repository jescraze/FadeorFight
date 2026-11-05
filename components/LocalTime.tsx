"use client";

import { useEffect, useState } from "react";

const STYLES = {
  full: { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" },
  short: { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  date: { month: "short", day: "numeric", year: "numeric" },
} as const;

/** Shows a time in the visitor's own time zone. */
export function LocalTime({ iso, style = "short" }: { iso: string; style?: keyof typeof STYLES }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(new Intl.DateTimeFormat(undefined, STYLES[style]).format(new Date(iso)));
  }, [iso, style]);
  return <time dateTime={iso}>{text ?? new Date(iso).toUTCString().slice(0, 16)}</time>;
}
