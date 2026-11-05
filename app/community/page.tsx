import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { getEvents, getLeaders, splitEvents } from "@/lib/data";
import { displayName, formatRecord, winRate } from "@/lib/format";

export const metadata = { title: "Community" };

export default async function CommunityPage() {
  const [events, leaders] = await Promise.all([getEvents(), getLeaders()]);
  const { upcoming, past } = splitEvents(events);

  return (
    <section className="page">
      <h1>Community</h1>
      <p className="lede">
        Pick a winner for every fight on the card, prelims included. Your picks lock when the first
        fight starts and count toward the leaderboard once results are in.
      </p>

      <div className="community-grid">
        <div>
          <h2>Make your picks</h2>
          {upcoming.length ? (
            <ul className="event-list">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/community/${e.slug}`}>
                    <span className="event-name">{e.name}</span>
                    <span className="event-when"><LocalTime iso={e.starts_at} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No upcoming cards yet. Check back once the next one is announced.</p>
          )}

          {past.length > 0 && (
            <>
              <h2 className="section-gap">Past cards</h2>
              <ul className="event-list">
                {past.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <Link href={`/community/${e.slug}`}>
                      <span className="event-name">{e.name}</span>
                      <span className="event-when"><LocalTime iso={e.starts_at} style="date" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="leaderboard" aria-labelledby="leaders-heading">
          <h2 id="leaders-heading">Leaderboard</h2>
          {leaders.length ? (
            <ol>
              {leaders.map((l) => (
                <li key={l.username}>
                  <span className="name">{displayName(l)}</span>
                  <span className="rec">{formatRecord(l)}</span>
                  <span className="rate">{winRate(l) ?? 0}%</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">The leaderboard fills in after the first graded card.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
