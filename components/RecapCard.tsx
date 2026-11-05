import Link from "next/link";
import { displayName, possessive } from "@/lib/format";
import type { Recap } from "@/lib/types";
import { VideoEmbed } from "./VideoEmbed";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
    </>
  );
}

export function RecapCard({ recap }: { recap: Recap }) {
  const name = displayName(recap.author);
  return (
    <article className="recap">
      <h3>
        <Link href={`/picks/${recap.author.username}`}>{possessive(name)} recap</Link>
      </h3>
      <VideoEmbed url={recap.video_url} title={`${possessive(name)} recap of ${recap.event.name}`} />
      {recap.went_well && (
        <div className="recap-part is-well">
          <h4>What went well</h4>
          <Paragraphs text={recap.went_well} />
        </div>
      )}
      {recap.went_wrong && (
        <div className="recap-part is-wrong">
          <h4>What didn't</h4>
          <Paragraphs text={recap.went_wrong} />
        </div>
      )}
    </article>
  );
}

/** Groups recaps by event, keeping the newest event first. */
export function groupByEvent(recaps: Recap[]) {
  const groups = new Map<number, Recap[]>();
  for (const r of [...recaps].sort((a, b) => b.event.starts_at.localeCompare(a.event.starts_at))) {
    groups.set(r.event_id, [...(groups.get(r.event_id) ?? []), r]);
  }
  return [...groups.values()];
}
