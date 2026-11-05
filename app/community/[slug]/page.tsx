import Link from "next/link";
import { notFound } from "next/navigation";
import { saveCommunityPick } from "@/app/actions";
import { FightMeta, FightResult } from "@/components/FightRow";
import { LocalTime } from "@/components/LocalTime";
import { Notice } from "@/components/Notice";
import { getEventCard, getViewer } from "@/lib/data";
import { isConfigured } from "@/lib/env";
import { fighterName, gradePick, hasStarted } from "@/lib/format";
import { SEGMENTS, type Corner, type Fight } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

const GRADE_LABEL = { win: "You got it", loss: "Missed", push: "Push" } as const;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const card = await getEventCard(slug, null);
  return { title: card ? `Community picks: ${card.name}` : "Community picks" };
}

function Split({ a, b }: { a: number; b: number }) {
  const total = a + b;
  if (!total) return <p className="split-empty">No community picks yet</p>;
  const pa = Math.round((a / total) * 100);
  return (
    <div className="split" aria-label={`Community: ${pa}% to ${100 - pa}%`}>
      <span className="split-num">{pa}%</span>
      <div className="split-bar"><span style={{ width: `${pa}%` }} /></div>
      <span className="split-num">{100 - pa}%</span>
    </div>
  );
}

function PickButtons({
  fight,
  slug,
  mine,
  open,
}: {
  fight: Fight;
  slug: string;
  mine?: Corner;
  open: boolean;
}) {
  const button = (c: Corner) => (
    <button
      name="pick"
      value={c}
      disabled={!open}
      aria-pressed={mine === c}
      className={`fighter-button ${mine === c ? "is-picked" : ""} ${fight.winner === c ? "won" : ""}`}
    >
      {fighterName(fight, c)}
    </button>
  );
  return (
    <form action={saveCommunityPick} className="pick-buttons">
      <input type="hidden" name="fight_id" value={fight.id} />
      <input type="hidden" name="slug" value={slug} />
      {button("a")}
      <span className="vs">vs</span>
      {button("b")}
    </form>
  );
}

export default async function CommunityCardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error, notice } = await searchParams;
  const viewer = await getViewer();
  const card = await getEventCard(slug, viewer);
  if (!card) notFound();

  const started = hasStarted(card.starts_at);
  const picked = Object.keys(card.mine).length;

  return (
    <section className="page">
      <header className="card-head">
        <p className="kicker"><Link href="/community">Community</Link></p>
        <h1>{card.name}</h1>
        <p className="muted">
          <LocalTime iso={card.starts_at} style="full" />
          {card.venue && <> at {card.venue}</>}
        </p>
        <div className="card-actions">
          <Link href={`/events/${card.slug}`} className="button small">See the analysts' picks</Link>
        </div>
      </header>

      <Notice error={error} notice={notice} />

      {started ? (
        <p className="status-note">Picks are locked for this card.</p>
      ) : viewer ? (
        <p className="status-note">
          Tap a fighter to pick them. You've picked {picked} of {card.fights.length} fights. You can
          change picks until the first fight starts.
        </p>
      ) : (
        <p className="status-note">
          <Link href="/login">Log in</Link> or <Link href="/signup">join free</Link> to make your picks.
          {!isConfigured && " (Demo mode: picking turns on once the database is connected.)"}
        </p>
      )}

      {SEGMENTS.map((s) => {
        const fights = card.fights.filter((f) => f.segment === s.key);
        if (!fights.length) return null;
        return (
          <section key={s.key} className="segment" aria-labelledby={`c-${s.key}`}>
            <h2 id={`c-${s.key}`}>{s.label}</h2>
            <div className="fights">
              {fights.map((f) => {
                const mine = card.mine[f.id];
                const grade = mine ? gradePick({ pick: mine }, f) : null;
                const split = card.split[f.id] ?? { a: 0, b: 0 };
                return (
                  <article key={f.id} id={`fight-${f.id}`} className="fight community-fight">
                    <FightMeta fight={f} />
                    <PickButtons fight={f} slug={card.slug} mine={mine} open={!started} />
                    <Split a={split.a} b={split.b} />
                    <FightResult fight={f} />
                    {grade && <p className={`your-grade is-${grade}`}>{GRADE_LABEL[grade]}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}
