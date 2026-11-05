import type { AnalystPick, Fight, Viewer } from "./types";

export function formatOdds(odds: number | null) {
  if (odds == null) return null;
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function displayName(p: { username: string; display_name: string | null }) {
  return p.display_name || p.username;
}

/** "Welly" → "Welly's" ; "Chris" → "Chris'" */
export function possessive(name: string) {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

export function formatRecord(r: { wins: number; losses: number; pushes?: number }) {
  return `${r.wins}-${r.losses}${r.pushes ? `-${r.pushes}` : ""}`;
}

export function winRate(r: { wins: number; losses: number }) {
  const decided = Number(r.wins) + Number(r.losses);
  return decided ? Math.round((Number(r.wins) / decided) * 100) : null;
}

export function fighterName(fight: Fight, corner: "a" | "b") {
  return corner === "a" ? fight.fighter_a : fight.fighter_b;
}

export type Grade = "win" | "loss" | "push" | null;

export function gradePick(pick: { pick: "a" | "b" }, fight: Fight): Grade {
  if (!fight.winner) return null;
  if (fight.winner === "draw" || fight.winner === "nc") return "push";
  return pick.pick === fight.winner ? "win" : "loss";
}

export function canSeeAllPicks(viewer: Viewer) {
  return Boolean(viewer && (viewer.subscribed || viewer.role !== "member"));
}

export function hasStarted(startsAt: string) {
  return new Date(startsAt) <= new Date();
}

export function picksFor(picks: AnalystPick[], fightId: number) {
  return picks.filter((p) => p.fight_id === fightId);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
