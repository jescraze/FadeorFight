import Link from "next/link";
import { displayName, fighterName, formatOdds, gradePick, possessive } from "@/lib/format";
import type { AnalystPick, Fight, Person } from "@/lib/types";

const GRADE_LABEL = { win: "Hit", loss: "Miss", push: "Push" } as const;

export function boutLabel(fight: Fight) {
  if (fight.segment !== "main") return null;
  if (fight.position === 1) return "Main event";
  if (fight.position === 2) return "Co-main";
  return null;
}

function Bout({ fight }: { fight: Fight }) {
  const won = (c: "a" | "b") => (fight.winner === c ? "won" : fight.winner ? "lost" : "");
  return (
    <div className="bout">
      <span className={`fighter ${won("a")}`}>{fight.fighter_a}</span>
      <span className="vs">vs</span>
      <span className={`fighter ${won("b")}`}>{fight.fighter_b}</span>
    </div>
  );
}

export function FightMeta({ fight }: { fight: Fight }) {
  const label = boutLabel(fight);
  return (
    <p className="fight-meta">
      {label && <span className="bout-label">{label}</span>}
      {fight.weight_class && <span>{fight.weight_class}</span>}
      <span>{fight.rounds} rounds</span>
    </p>
  );
}

export function FightResult({ fight }: { fight: Fight }) {
  if (!fight.winner) return null;
  const text =
    fight.winner === "draw"
      ? "Draw"
      : fight.winner === "nc"
        ? "No contest"
        : `${fighterName(fight, fight.winner)} wins`;
  return (
    <p className="fight-result">
      {text}
      {fight.result_method && <span>{fight.result_method}</span>}
    </p>
  );
}

function PickCard({ analyst, pick, fight }: { analyst: Person; pick?: AnalystPick; fight: Fight }) {
  const name = displayName(analyst);
  if (!pick) {
    return (
      <div className="pick is-empty">
        <p className="pick-who"><Link href={`/picks/${analyst.username}`}>{name}</Link></p>
        <p className="pick-none">No pick yet</p>
      </div>
    );
  }
  const grade = gradePick(pick, fight);
  return (
    <div className={`pick ${grade ? `is-${grade}` : ""}`}>
      <p className="pick-who">
        <Link href={`/picks/${analyst.username}`}>{name}</Link>
        {grade && <span className="grade">{GRADE_LABEL[grade]}</span>}
      </p>
      <p className="pick-choice">
        <strong>{fighterName(fight, pick.pick)}</strong>
        {pick.method && <span> {pick.method}</span>}
        {pick.odds != null && <span className="odds"> {formatOdds(pick.odds)}</span>}
      </p>
      {pick.write_up && <p className="pick-writeup">{pick.write_up}</p>}
    </div>
  );
}

function LockedPicks({ analysts }: { analysts: Person[] }) {
  return (
    <div className="picks locked">
      <div className="picks-blur" aria-hidden="true">
        {analysts.map((a) => (
          <div className="pick" key={a.id}>
            <p className="pick-who">{displayName(a)}</p>
            <p className="pick-choice"><strong>Xxxxxxx Xxxxxx</strong> <span>by xxxxxxxx</span></p>
            <p className="pick-writeup">Xxxx xxxxxx xxx xxxxxx xx xxxxx xxxxx xxx xxxxxx.</p>
          </div>
        ))}
      </div>
      <p className="lock-note">Members only</p>
    </div>
  );
}

/** One explanation per locked section, instead of repeating it on every fight. */
export function LockedSectionNote({ analysts, signedIn }: { analysts: Person[]; signedIn: boolean }) {
  const names = analysts.map((a) => displayName(a));
  const who = names.length === 2 ? `${names[0]} and ${possessive(names[1])}` : "Our analysts'";
  return (
    <div className="lock-banner">
      <p>{who} picks on these fights are for paid members. Memberships are coming soon.</p>
      {!signedIn && <Link href="/signup" className="button small">Join free for the main card</Link>}
    </div>
  );
}

export function FightRow({
  fight,
  analysts,
  picks,
  locked,
}: {
  fight: Fight;
  analysts: Person[];
  picks: AnalystPick[];
  locked: boolean;
  signedIn?: boolean;
}) {
  return (
    <article className={`fight ${boutLabel(fight) === "Main event" ? "is-headliner" : ""}`} id={`fight-${fight.id}`}>
      <FightMeta fight={fight} />
      <Bout fight={fight} />
      <FightResult fight={fight} />
      {locked ? (
        <LockedPicks analysts={analysts} />
      ) : (
        <div className="picks">
          {analysts.map((a) => (
            <PickCard key={a.id} analyst={a} fight={fight} pick={picks.find((p) => p.analyst_id === a.id)} />
          ))}
        </div>
      )}
    </article>
  );
}

export { Bout };
