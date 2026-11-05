import Link from "next/link";
import { notFound } from "next/navigation";
import { FightMeta, FightResult } from "@/components/FightRow";
import { LocalTime } from "@/components/LocalTime";
import { getAnalystPicks, getAnalystRecords, getViewer } from "@/lib/data";
import {
  canSeeAllPicks,
  displayName,
  fighterName,
  formatOdds,
  formatRecord,
  gradePick,
  possessive,
  winRate,
} from "@/lib/format";
import type { AnalystPickWithFight } from "@/lib/types";

type Props = { params: Promise<{ username: string }> };

const SEGMENT_ORDER = { main: 0, prelims: 1, early_prelims: 2 } as const;
const GRADE_LABEL = { win: "Hit", loss: "Miss", push: "Push" } as const;

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `${possessive(username)} picks` };
}

export default async function AnalystPage({ params }: Props) {
  const { username } = await params;
  const viewer = await getViewer();
  const [{ analyst, picks: allPicks }, records] = await Promise.all([
    getAnalystPicks(username),
    getAnalystRecords(),
  ]);
  if (!analyst) notFound();

  const unlocked = canSeeAllPicks(viewer);
  // The database already hides prelim picks from free members; demo data is filtered here.
  const picks = unlocked ? allPicks : allPicks.filter((p) => p.fight.segment === "main");
  const record = records.find((r) => r.id === analyst.id) ?? { wins: 0, losses: 0, pushes: 0 };
  const rate = winRate(record);
  const name = displayName(analyst);

  // Group by event, latest event first; fights in card order.
  const byEvent = new Map<number, AnalystPickWithFight[]>();
  for (const p of [...picks].sort((a, b) => b.event.starts_at.localeCompare(a.event.starts_at))) {
    byEvent.set(p.event.id, [...(byEvent.get(p.event.id) ?? []), p]);
  }

  return (
    <section className="page">
      <h1>{possessive(name)} picks</h1>
      {analyst.bio && <p className="lede">{analyst.bio}</p>}

      <dl className="statline">
        <div><dt>Record</dt><dd>{formatRecord(record)}</dd></div>
        <div><dt>Hit rate</dt><dd>{rate === null ? "–" : `${rate}%`}</dd></div>
        <div><dt>Graded fights</dt><dd>{Number(record.wins) + Number(record.losses) + Number(record.pushes)}</dd></div>
      </dl>
      <p className="hint">Record counts every graded fight, including prelims. Draws and no contests count as pushes.</p>

      {byEvent.size ? (
        [...byEvent.values()].map((eventPicks) => {
          const event = eventPicks[0].event;
          const sorted = eventPicks.sort(
            (a, b) =>
              SEGMENT_ORDER[a.fight.segment] - SEGMENT_ORDER[b.fight.segment] ||
              a.fight.position - b.fight.position,
          );
          return (
            <section key={event.id} className="analyst-event">
              <h2>
                <Link href={`/events/${event.slug}`}>{event.name}</Link>
              </h2>
              <p className="muted"><LocalTime iso={event.starts_at} style="date" /></p>
              <ul className="pick-list">
                {sorted.map((p) => {
                  const grade = gradePick(p, p.fight);
                  return (
                    <li key={p.fight_id} className={grade ? `is-${grade}` : ""}>
                      <FightMeta fight={p.fight} />
                      <p className="pick-line">
                        <strong>{fighterName(p.fight, p.pick)}</strong>
                        {p.method && <span> {p.method}</span>}
                        {p.odds != null && <span className="odds"> {formatOdds(p.odds)}</span>}
                        <span className="over"> over {fighterName(p.fight, p.pick === "a" ? "b" : "a")}</span>
                        {grade && <span className="grade">{GRADE_LABEL[grade]}</span>}
                      </p>
                      <FightResult fight={p.fight} />
                      {p.write_up && <p className="pick-writeup">{p.write_up}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      ) : (
        <p className="empty">{name} hasn't posted any picks yet.</p>
      )}

      {!unlocked && picks.length > 0 && (
        <div className="lock-banner">
          <p>{possessive(name)} prelim and early prelim picks are for paid members. Memberships are coming soon.</p>
        </div>
      )}
    </section>
  );
}
