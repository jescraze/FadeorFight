import Link from "next/link";
import { boutLabel } from "@/components/FightRow";
import { LocalTime } from "@/components/LocalTime";
import { getAnalysts, getEventCard, getEvents, getLive, getViewer, splitEvents } from "@/lib/data";
import { displayName } from "@/lib/format";

export default async function Home() {
  const [viewer, analysts, events, live] = await Promise.all([
    getViewer(),
    getAnalysts(),
    getEvents(),
    getLive(),
  ]);
  const next = splitEvents(events).upcoming[0];
  const card = next ? await getEventCard(next.slug, viewer) : null;
  const headliner = card?.fights.find((f) => boutLabel(f) === "Main event") ?? card?.fights[0];
  const names = analysts.map((a) => displayName(a));
  const duo = names.length === 2 ? `${names[0]} and ${names[1]}` : "our analysts";

  return (
    <div className="home">
      {live.is_live && live.live_url && (
        <Link href="/watch" className="live-banner">
          <span className="live-dot" aria-hidden="true" /> We're live now. Watch the stream
        </Link>
      )}

      <section className="landing-hero">
        <p className="kicker">Welcome to FadeorFight</p>
        <h1>
          <span>Fade</span> or <span>fight.</span>
        </h1>
        <p className="intro">UFC picks from {duo} on every fight of every card.</p>
        <div className="hero-actions">
          {viewer ? (
            <Link href="/events" className="button primary">See the fight cards</Link>
          ) : (
            <>
              <Link href="/signup" className="button primary">Join free</Link>
              <Link href="/login" className="button">Log in</Link>
            </>
          )}
        </div>
      </section>

      {card && headliner && (
        <Link href={`/events/${card.slug}`} className="next-card">
          <span className="kicker">Next card · <LocalTime iso={card.starts_at} /></span>
          <span className="next-bout">
            {headliner.fighter_a} <span className="vs">vs</span> {headliner.fighter_b}
          </span>
          <span className="next-cta">See the picks</span>
        </Link>
      )}
    </div>
  );
}
