import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { RecapCard, groupByEvent } from "@/components/RecapCard";
import { getRecaps } from "@/lib/data";

export const metadata = { title: "Recaps" };

export default async function RecapsPage() {
  const groups = groupByEvent(await getRecaps());

  return (
    <section className="page">
      <h1>Recaps</h1>
      <p className="lede">After every card: what we got right, what we got wrong, and what we'd change.</p>

      {groups.length ? (
        groups.map((recaps) => {
          const event = recaps[0].event;
          return (
            <section key={event.id} className="recap-group" id={event.slug}>
              <header>
                <h2><Link href={`/events/${event.slug}`}>{event.name}</Link></h2>
                <p className="muted"><LocalTime iso={event.starts_at} style="date" /></p>
              </header>
              <div className="recaps">
                {recaps.map((r) => <RecapCard key={r.id} recap={r} />)}
              </div>
            </section>
          );
        })
      ) : (
        <p className="empty">The first recap goes up after the next card.</p>
      )}
    </section>
  );
}
