import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { VideoEmbed } from "@/components/VideoEmbed";
import { getLive, getRecaps } from "@/lib/data";
import { displayName, possessive } from "@/lib/format";
import { embedUrl } from "@/lib/video";

export const metadata = { title: "Watch" };

export default async function WatchPage() {
  const [live, recaps] = await Promise.all([getLive(), getRecaps()]);
  const videos = recaps.filter((r) => embedUrl(r.video_url, "localhost"));
  const showLive = live.is_live && live.live_url;

  return (
    <section className="page">
      <h1>Watch</h1>

      {showLive ? (
        <section className="live" aria-labelledby="live-heading">
          <p className="live-badge">Live now</p>
          <h2 id="live-heading">{live.live_title || "FadeorFight live"}</h2>
          <VideoEmbed url={live.live_url} title={live.live_title || "FadeorFight livestream"} />
        </section>
      ) : (
        <p className="lede">
          We're not live right now. When we go live for a card, the stream shows up here. In the
          meantime, catch up on recap videos below.
        </p>
      )}

      <h2 className="section-gap">Recap videos</h2>
      {videos.length ? (
        <div className="video-grid">
          {videos.map((r) => (
            <article key={r.id} className="video-card">
              <VideoEmbed url={r.video_url} title={`${possessive(displayName(r.author))} recap of ${r.event.name}`} />
              <h3>
                <Link href={`/recaps#${r.event.slug}`}>
                  {possessive(displayName(r.author))} recap: {r.event.name}
                </Link>
              </h3>
              <p className="muted"><LocalTime iso={r.event.starts_at} style="date" /></p>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No videos yet. Recap videos appear here as soon as they're posted.</p>
      )}
    </section>
  );
}
