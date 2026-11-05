import Link from "next/link";
import { notFound } from "next/navigation";
import { FightRow, LockedSectionNote } from "@/components/FightRow";
import { LocalTime } from "@/components/LocalTime";
import { RecapCard } from "@/components/RecapCard";
import { getAnalysts, getEventCard, getRecaps, getViewer } from "@/lib/data";
import { canSeeAllPicks, hasStarted, picksFor } from "@/lib/format";
import { SEGMENTS } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const card = await getEventCard(slug, null);
  return { title: card?.name ?? "Fight card" };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const viewer = await getViewer();
  const [card, analysts, recaps] = await Promise.all([getEventCard(slug, viewer), getAnalysts(), getRecaps(slug)]);
  if (!card) notFound();

  const unlocked = canSeeAllPicks(viewer);
  const segments = SEGMENTS.map((s) => ({ ...s, fights: card.fights.filter((f) => f.segment === s.key) }))
    .filter((s) => s.fights.length);
  const started = hasStarted(card.starts_at);

  return (
    <section className="page">
      <header className="card-head">
        <p className="kicker"><Link href="/events">Fight cards</Link></p>
        <h1>{card.name}</h1>
        <p className="muted">
          <LocalTime iso={card.starts_at} style="full" />
          {card.venue && <> at {card.venue}</>}
          {started && <> · Picks locked</>}
        </p>
        <div className="card-actions">
          {segments.length > 1 && (
            <nav className="jump" aria-label="Card sections">
              {segments.map((s) => <a key={s.key} href={`#${s.key}`}>{s.label}</a>)}
            </nav>
          )}
          {recaps.length > 0 && <a href="#recaps" className="button small">Read the recaps</a>}
          <Link href={`/community/${card.slug}`} className="button small">
            {started ? "See community picks" : "Make your own picks"}
          </Link>
        </div>
      </header>

      {segments.length ? (
        segments.map((s) => (
          <section key={s.key} id={s.key} className="segment" aria-labelledby={`${s.key}-heading`}>
            <h2 id={`${s.key}-heading`}>{s.label}</h2>
            {s.key !== "main" && !unlocked && <LockedSectionNote analysts={analysts} signedIn={Boolean(viewer)} />}
            <div className="fights">
              {s.fights.map((f) => (
                <FightRow
                  key={f.id}
                  fight={f}
                  analysts={analysts}
                  picks={picksFor(card.picks, f.id)}
                  locked={s.key !== "main" && !unlocked}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="empty">The fights for this card haven't been added yet.</p>
      )}

      {recaps.length > 0 && (
        <section id="recaps" className="segment" aria-labelledby="recaps-heading">
          <h2 id="recaps-heading">Recaps</h2>
          <div className="recaps">
            {recaps.map((r) => <RecapCard key={r.id} recap={r} />)}
          </div>
        </section>
      )}
    </section>
  );
}
