import { cache } from "react";
import { demoAnalysts, demoEvents, demoFights, demoLeaders, demoPicks, demoRecaps, demoSplit } from "./demo";
import { isConfigured } from "./env";
import { gradePick } from "./format";
import { createClient } from "./supabase/server";
import type {
  AnalystPick,
  AnalystPickWithFight,
  AnalystRecord,
  Corner,
  EventCard,
  EventRow,
  Fight,
  Leader,
  LiveSettings,
  Person,
  Recap,
  Viewer,
} from "./types";

const SEGMENT_ORDER = { main: 0, prelims: 1, early_prelims: 2 } as const;

function sortFights(fights: Fight[]) {
  return [...fights].sort(
    (x, y) => SEGMENT_ORDER[x.segment] - SEGMENT_ORDER[y.segment] || x.position - y.position,
  );
}

// ---------- Viewer ----------

/** The signed-in user, with role and subscription status. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer> => {
  if (!isConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, bio, role").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .limit(1),
  ]);
  if (!profile) return null;
  return { ...profile, subscribed: Boolean(sub?.length) } as Viewer;
});

// ---------- Analysts ----------

export const getAnalysts = cache(async (): Promise<Person[]> => {
  if (!isConfigured) return demoAnalysts;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("role", "analyst")
    .order("created_at");
  return (data ?? []) as Person[];
});

export async function getAnalystRecords(): Promise<AnalystRecord[]> {
  if (!isConfigured) {
    return demoAnalysts.map((a) => {
      const tally = { wins: 0, losses: 0, pushes: 0 };
      for (const pick of demoPicks.filter((x) => x.analyst_id === a.id)) {
        const fight = demoFights.find((x) => x.id === pick.fight_id)!;
        const g = gradePick(pick, fight);
        if (g === "win") tally.wins++;
        if (g === "loss") tally.losses++;
        if (g === "push") tally.pushes++;
      }
      return { ...a, ...tally };
    });
  }

  const supabase = await createClient();
  const { data } = await supabase.from("analyst_records").select("*");
  return (data ?? []) as AnalystRecord[];
}

export async function getAnalystPicks(username: string): Promise<{
  analyst: Person | null;
  picks: AnalystPickWithFight[];
}> {
  if (!isConfigured) {
    const analyst = demoAnalysts.find((a) => a.username === username) ?? null;
    if (!analyst) return { analyst, picks: [] };
    const picks = demoPicks
      .filter((p) => p.analyst_id === analyst.id)
      .map((p) => {
        const fight = demoFights.find((x) => x.id === p.fight_id)!;
        const event = demoEvents.find((e) => e.id === fight.event_id)!;
        return { ...p, fight, event };
      });
    return { analyst, picks };
  }

  const supabase = await createClient();
  const { data: analyst } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("username", username)
    .in("role", ["analyst", "admin"])
    .maybeSingle();
  if (!analyst) return { analyst: null, picks: [] };

  const { data } = await supabase
    .from("analyst_picks")
    .select("fight_id, analyst_id, pick, method, odds, write_up, fight:fights!inner(*, event:events!inner(id, slug, name, venue, starts_at))")
    .eq("analyst_id", analyst.id)
    .limit(200);

  const picks = (data ?? []).map((row) => {
    const { fight, ...pick } = row as unknown as AnalystPick & { fight: Fight & { event: EventRow } };
    const { event, ...fightOnly } = fight;
    return { ...pick, fight: fightOnly, event };
  });
  return { analyst: analyst as Person, picks };
}

// ---------- Events ----------

export async function getEvents(): Promise<EventRow[]> {
  if (!isConfigured) return demoEvents;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, slug, name, venue, starts_at")
    .order("starts_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as EventRow[];
}

/** Splits events into upcoming (soonest first) and past (latest first). */
export function splitEvents(events: EventRow[]) {
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.starts_at).getTime() > now - 8 * 3_600_000)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = events
    .filter((e) => !upcoming.includes(e))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return { upcoming, past };
}

export async function getEventCard(slug: string, viewer: Viewer): Promise<EventCard | null> {
  if (!isConfigured) {
    const event = demoEvents.find((e) => e.slug === slug);
    if (!event) return null;
    const fights = sortFights(demoFights.filter((f) => f.event_id === event.id));
    const mainIds = new Set(fights.filter((f) => f.segment === "main").map((f) => f.id));
    const picks = demoPicks.filter((p) => mainIds.has(p.fight_id));
    const split = Object.fromEntries(fights.map((f) => [f.id, demoSplit[f.id]]));
    return { ...event, fights, picks, split, mine: {} };
  }

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, name, venue, starts_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!event) return null;

  const { data: fightRows } = await supabase.from("fights").select("*").eq("event_id", event.id);
  const fights = sortFights((fightRows ?? []) as Fight[]);
  const ids = fights.map((f) => f.id);
  if (!ids.length) return { ...(event as EventRow), fights, picks: [], split: {}, mine: {} };

  const [{ data: picks }, { data: splitRows }, { data: mineRows }] = await Promise.all([
    supabase
      .from("analyst_picks")
      .select("fight_id, analyst_id, pick, method, odds, write_up")
      .in("fight_id", ids),
    supabase.from("community_split").select("*").in("fight_id", ids),
    viewer
      ? supabase.from("community_picks").select("fight_id, pick").in("fight_id", ids).eq("user_id", viewer.id)
      : Promise.resolve({ data: [] as { fight_id: number; pick: Corner }[] }),
  ]);

  const split: EventCard["split"] = {};
  for (const r of splitRows ?? []) split[r.fight_id] = { a: Number(r.picks_a), b: Number(r.picks_b) };
  const mine: EventCard["mine"] = {};
  for (const r of mineRows ?? []) mine[r.fight_id] = r.pick as Corner;

  return { ...(event as EventRow), fights, picks: (picks ?? []) as AnalystPick[], split, mine };
}

// ---------- Community ----------

export async function getLeaders(): Promise<Leader[]> {
  if (!isConfigured) return demoLeaders;

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_leaders")
    .select("*")
    .order("wins", { ascending: false })
    .limit(10);
  return (data ?? []) as Leader[];
}

// ---------- Recaps and livestream ----------

const RECAP_COLUMNS =
  "id, event_id, author_id, went_well, went_wrong, video_url, created_at, event:events!inner(id, slug, name, venue, starts_at), author:profiles!inner(id, username, display_name, bio)";

export async function getRecaps(eventSlug?: string): Promise<Recap[]> {
  if (!isConfigured) {
    return demoRecaps
      .map((r) => ({
        ...r,
        event: demoEvents.find((e) => e.id === r.event_id)!,
        author: demoAnalysts.find((a) => a.id === r.author_id)!,
      }))
      .filter((r) => !eventSlug || r.event.slug === eventSlug);
  }

  const supabase = await createClient();
  let query = supabase.from("recaps").select(RECAP_COLUMNS);
  if (eventSlug) query = query.eq("event.slug", eventSlug);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Recap[];
}

export const getLive = cache(async (): Promise<LiveSettings> => {
  if (!isConfigured) return { live_url: null, live_title: null, is_live: false };

  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("live_url, live_title, is_live").eq("id", 1).maybeSingle();
  return (data as LiveSettings) ?? { live_url: null, live_title: null, is_live: false };
});
