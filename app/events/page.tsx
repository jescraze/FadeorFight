import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { getAnalysts, getEvents, splitEvents } from "@/lib/data";
import { displayName, possessive } from "@/lib/format";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "Fight cards" };

function EventList({ events }: { events: EventRow[] }) {
  return (
    <ul className="event-list">
      {events.map((e) => (
        <li key={e.id}>
          <Link href={`/events/${e.slug}`}>
            <span className="event-name">{e.name}</span>
            <span className="event-when">
              <LocalTime iso={e.starts_at} />
              {e.venue && <> at {e.venue}</>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function EventsPage() {
  const [events, analysts] = await Promise.all([getEvents(), getAnalysts()]);
  const { upcoming, past } = splitEvents(events);
  const names = analysts.map((a) => possessive(displayName(a)));
  const whose = names.length ? names.join(" and ").replace(/'s and /, " and ") : "our analysts'";

  return (
    <section className="page">
      <h1>Fight cards</h1>
      <p className="lede">Open a card to see {whose} pick on every fight.</p>

      <h2 className="section-gap">Upcoming</h2>
      {upcoming.length ? (
        <EventList events={upcoming} />
      ) : (
        <p className="empty">The next card goes up as soon as the fights are announced.</p>
      )}

      {past.length > 0 && (
        <>
          <h2 className="section-gap">Past cards</h2>
          <EventList events={past} />
        </>
      )}
    </section>
  );
}
