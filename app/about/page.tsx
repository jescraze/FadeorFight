import Link from "next/link";
import { getAnalysts } from "@/lib/data";
import { displayName } from "@/lib/format";

export const metadata = { title: "About us" };

// Edit the text on this page to tell your own story.
export default async function AboutPage() {
  const analysts = await getAnalysts();

  return (
    <section className="page prose">
      <h1>About us</h1>

      <p className="lede">
        FadeorFight is where we put our UFC picks on the record, every fight, every card.
      </p>

      <h2>Why we started</h2>
      <p>
        We've been breaking down fights together for years. Plenty of people post picks after the
        fact; we wanted somewhere our calls are locked before the first bell and graded honestly
        afterwards, wins and misses alike.
      </p>

      <h2>The name</h2>
      <p>
        Every fight comes down to a choice: fade a fighter or ride with them. That's the whole idea.
        For every bout we tell you which way we're going and why.
      </p>

      {analysts.length > 0 && (
        <>
          <h2>Who's picking</h2>
          <ul className="team">
            {analysts.map((a) => (
              <li key={a.id}>
                <Link href={`/picks/${a.username}`}>{displayName(a)}</Link>
                {a.bio && <span>{a.bio}</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Play it smart</h2>
      <p>
        Our picks are opinions, not guarantees. If you bet, bet only what you can afford to lose,
        and only if you're of legal age where you live.
      </p>
    </section>
  );
}
