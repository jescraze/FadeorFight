"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data";
import { isConfigured } from "@/lib/env";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

/** Redirect back to a page with a message. `path` may include a #hash. */
function back(path: string, message: string, kind: "error" | "notice" = "error"): never {
  const [base, hash] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  redirect(`${base}${sep}${kind}=${encodeURIComponent(message)}${hash ? `#${hash}` : ""}`);
}

function requireSetup(path: string) {
  if (!isConfigured) back(path, "This needs the database connected first. The README walks you through it.");
}

/** Turns a datetime-local value plus the browser's UTC offset into an ISO time. */
function toIso(local: string, offsetMinutes: string) {
  const t = Date.parse(`${local}:00Z`) + Number(offsetMinutes || 0) * 60_000;
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function refreshAll() {
  revalidatePath("/", "layout");
}

// ---------- Accounts ----------

export async function signUp(form: FormData) {
  requireSetup("/signup");
  const username = field(form, "username").toLowerCase();
  const email = field(form, "email");
  const password = field(form, "password");

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    back("/signup", "Usernames are 3 to 20 characters: lowercase letters, numbers and underscores.");
  }
  if (password.length < 8) back("/signup", "Use a password of at least 8 characters.");

  const supabase = await createClient();
  const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) back("/signup", `The username ${username} is taken. Try another.`);

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: field(form, "display_name") || username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) back("/signup", error.message);
  if (!data.session) back("/login", "Check your email for a confirmation link, then log in.", "notice");
  redirect("/events");
}

export async function logIn(form: FormData) {
  requireSetup("/login");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: field(form, "email"),
    password: field(form, "password"),
  });
  if (error) back("/login", "That email and password don't match an account.");
  redirect("/events");
}

export async function logOut() {
  if (isConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function updateProfile(form: FormData) {
  requireSetup("/dashboard");
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: field(form, "display_name") || null,
      bio: field(form, "bio").slice(0, 280) || null,
    })
    .eq("id", viewer.id);
  if (error) back("/dashboard", error.message);
  refreshAll();
  back("/dashboard", "Profile saved.", "notice");
}

export async function setRole(form: FormData) {
  requireSetup("/dashboard");
  const viewer = await getViewer();
  if (viewer?.role !== "admin") back("/dashboard", "Only admins can change access.");

  const username = field(form, "username").toLowerCase().replace(/^@/, "");
  const role = field(form, "role");
  if (!["member", "analyst", "admin"].includes(role)) back("/dashboard", "Choose a role.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update({ role }).eq("username", username).select("id");
  if (error) back("/dashboard", error.message);
  if (!data?.length) back("/dashboard", `No account has the username ${username}. They need to sign up first.`);
  refreshAll();
  back("/dashboard", `${username} is now ${role === "member" ? "a" : "an"} ${role}.`, "notice");
}

// ---------- Events and fights (admins) ----------

export async function createEvent(form: FormData) {
  requireSetup("/dashboard");
  const name = field(form, "name");
  const slug = slugify(field(form, "slug") || name);
  const startsAt = toIso(field(form, "starts_at"), field(form, "tz_offset"));
  if (!name) back("/dashboard", "Give the event a name.");
  if (slug.length < 3) back("/dashboard", "The web address needs at least 3 letters or numbers.");
  if (!startsAt) back("/dashboard", "Choose when the first fight starts.");

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    name,
    slug,
    venue: field(form, "venue") || null,
    starts_at: startsAt,
  });
  if (error) {
    back("/dashboard", error.code === "23505" ? `An event already uses the address ${slug}.` : error.message);
  }
  refreshAll();
  back(`/dashboard/events/${slug}`, "Event created. Add the fights next.", "notice");
}

export async function updateEvent(form: FormData) {
  requireSetup("/dashboard");
  const slug = field(form, "slug");
  const path = `/dashboard/events/${slug}`;
  const startsAt = toIso(field(form, "starts_at"), field(form, "tz_offset"));
  if (!startsAt) back(path, "Choose when the first fight starts.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ name: field(form, "name"), venue: field(form, "venue") || null, starts_at: startsAt })
    .eq("id", Number(field(form, "event_id")));
  if (error) back(path, error.message);
  refreshAll();
  back(path, "Event updated.", "notice");
}

export async function deleteEvent(form: FormData) {
  requireSetup("/dashboard");
  if (field(form, "confirm") !== "delete") {
    back(`/dashboard/events/${field(form, "slug")}`, "Type delete in the box to confirm.");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", Number(field(form, "event_id")));
  if (error) back(`/dashboard/events/${field(form, "slug")}`, error.message);
  refreshAll();
  back("/dashboard", "Event deleted.", "notice");
}

export async function addFight(form: FormData) {
  requireSetup("/dashboard");
  const path = `/dashboard/events/${field(form, "slug")}`;
  const fighterA = field(form, "fighter_a");
  const fighterB = field(form, "fighter_b");
  if (!fighterA || !fighterB) back(path, "Enter both fighters' names.");

  const supabase = await createClient();
  const { error } = await supabase.from("fights").insert({
    event_id: Number(field(form, "event_id")),
    segment: field(form, "segment"),
    position: Number(field(form, "position")) || 1,
    fighter_a: fighterA,
    fighter_b: fighterB,
    weight_class: field(form, "weight_class") || null,
    rounds: field(form, "rounds") === "5" ? 5 : 3,
  });
  if (error) back(path, error.message);
  refreshAll();
  back(path, `Added ${fighterA} vs. ${fighterB}.`, "notice");
}

export async function deleteFight(form: FormData) {
  requireSetup("/dashboard");
  const path = `/dashboard/events/${field(form, "slug")}`;
  const supabase = await createClient();
  const { error } = await supabase.from("fights").delete().eq("id", Number(field(form, "fight_id")));
  if (error) back(path, error.message);
  refreshAll();
  back(path, "Fight removed.", "notice");
}

export async function setResult(form: FormData) {
  requireSetup("/dashboard");
  const fightId = field(form, "fight_id");
  const path = `/dashboard/events/${field(form, "slug")}#fight-${fightId}`;
  const winner = field(form, "winner");

  const supabase = await createClient();
  const { error } = await supabase
    .from("fights")
    .update({
      winner: winner || null,
      result_method: winner ? field(form, "result_method") || null : null,
    })
    .eq("id", Number(fightId));
  if (error) back(path, error.message);
  refreshAll();
  back(path, winner ? "Result saved. Every pick on this fight is now graded." : "Result cleared.", "notice");
}

// ---------- Picks ----------

export async function saveAnalystPick(form: FormData) {
  requireSetup("/dashboard");
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const fightId = Number(field(form, "fight_id"));
  const path = `/dashboard/events/${field(form, "slug")}#fight-${fightId}`;
  if (viewer.role === "member") back(path, "Only analysts can post picks.");

  const supabase = await createClient();
  const pick = field(form, "pick");

  if (!pick) {
    await supabase.from("analyst_picks").delete().eq("fight_id", fightId).eq("analyst_id", viewer.id);
    refreshAll();
    back(path, "Pick removed.", "notice");
  }

  const oddsText = field(form, "odds").replace("+", "");
  const odds = oddsText ? Number(oddsText) : null;
  if (odds !== null && (!Number.isInteger(odds) || (odds > -100 && odds < 100))) {
    back(path, "Enter American odds like -150 or +175, or leave odds blank.");
  }

  const { error } = await supabase.from("analyst_picks").upsert(
    {
      fight_id: fightId,
      analyst_id: viewer.id,
      pick,
      method: field(form, "method") || null,
      odds,
      write_up: field(form, "write_up") || null,
    },
    { onConflict: "fight_id,analyst_id" },
  );
  if (error) back(path, error.message);
  refreshAll();
  back(path, "Pick saved.", "notice");
}

export async function saveCommunityPick(form: FormData) {
  const fightId = Number(field(form, "fight_id"));
  const path = `/community/${field(form, "slug")}#fight-${fightId}`;
  requireSetup(path);
  const viewer = await getViewer();
  if (!viewer) back("/login", "Log in or join free to make your picks.", "notice");

  const supabase = await createClient();
  const pick = field(form, "pick");
  const { error } =
    pick === "clear"
      ? await supabase.from("community_picks").delete().eq("fight_id", fightId).eq("user_id", viewer.id)
      : await supabase
          .from("community_picks")
          .upsert({ fight_id: fightId, user_id: viewer.id, pick }, { onConflict: "fight_id,user_id" });
  if (error) back(path, error.message.includes("locked") ? "Picks for this card are locked." : error.message);
  revalidatePath(`/community/${field(form, "slug")}`);
  redirect(path);
}

// ---------- Recaps and livestream ----------

export async function saveRecap(form: FormData) {
  requireSetup("/dashboard");
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const slug = field(form, "slug");
  const path = `/dashboard/events/${slug}#recap`;
  if (viewer.role === "member") back(path, "Only analysts can write recaps.");

  const wentWell = field(form, "went_well");
  const wentWrong = field(form, "went_wrong");
  const videoUrl = field(form, "video_url");
  const supabase = await createClient();

  if (!wentWell && !wentWrong && !videoUrl) {
    await supabase.from("recaps").delete().eq("event_id", Number(field(form, "event_id"))).eq("author_id", viewer.id);
    refreshAll();
    back(path, "Recap removed.", "notice");
  }
  if (videoUrl && !/^https:\/\//.test(videoUrl)) back(path, "Paste the full video link, starting with https://");

  const { error } = await supabase.from("recaps").upsert(
    {
      event_id: Number(field(form, "event_id")),
      author_id: viewer.id,
      went_well: wentWell || null,
      went_wrong: wentWrong || null,
      video_url: videoUrl || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,author_id" },
  );
  if (error) back(path, error.message);
  refreshAll();
  back(path, "Recap published.", "notice");
}

export async function saveLive(form: FormData) {
  requireSetup("/dashboard");
  const viewer = await getViewer();
  if (viewer?.role !== "admin") back("/dashboard", "Only admins can change the livestream.");

  const liveUrl = field(form, "live_url");
  if (liveUrl && !/^https:\/\//.test(liveUrl)) back("/dashboard#live", "Paste the full link, starting with https://");

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      live_url: liveUrl || null,
      live_title: field(form, "live_title") || null,
      is_live: form.get("is_live") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) back("/dashboard#live", error.message);
  refreshAll();
  back("/dashboard#live", form.get("is_live") === "on" ? "You're live. The stream is on the Watch page." : "Livestream settings saved.", "notice");
}
