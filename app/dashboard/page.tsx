import Link from "next/link";
import { redirect } from "next/navigation";
import { createEvent, saveLive, setRole, updateProfile } from "@/app/actions";
import { LocalTime } from "@/components/LocalTime";
import { Notice } from "@/components/Notice";
import { LocalDateTimeInput, TzForm } from "@/components/TzForm";
import { getEvents, getLive, getViewer, splitEvents } from "@/lib/data";
import { isConfigured } from "@/lib/env";
import { displayName } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  if (!isConfigured) {
    return (
      <section className="page narrow">
        <h1>Dashboard</h1>
        <p className="notice">
          This is where admins add fight cards and results, and where Welly and Gordon post their
          picks. It needs the database connected first. The README walks you through it.
        </p>
      </section>
    );
  }

  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const isAnalyst = viewer.role !== "member";
  const isAdmin = viewer.role === "admin";
  const { upcoming, past } = isAnalyst ? splitEvents(await getEvents()) : { upcoming: [], past: [] };
  const live = isAdmin ? await getLive() : null;

  return (
    <section className="page">
      <h1>{isAnalyst ? "Dashboard" : "Your account"}</h1>
      <p className="lede">Signed in as {displayName(viewer)} ({viewer.role}).</p>
      <Notice error={error} notice={notice} />

      <div className="dash">
        {isAnalyst && (
          <div className="panel">
            <h2>Fight cards</h2>
            <p className="hint">
              {isAdmin
                ? "Open a card to add fights, post your picks or enter results."
                : "Open a card to post your picks. They lock when the first fight starts."}
            </p>
            {upcoming.length + past.length ? (
              <ul className="event-list compact">
                {[...upcoming, ...past.slice(0, 6)].map((e) => (
                  <li key={e.id}>
                    <Link href={`/dashboard/events/${e.slug}`}>
                      <span className="event-name">{e.name}</span>
                      <span className="event-when"><LocalTime iso={e.starts_at} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">No cards yet.{isAdmin && " Create the first one."}</p>
            )}
          </div>
        )}

        <div className="dash-side">
          {isAdmin && (
            <div className="panel">
              <h2>Create a card</h2>
              <TzForm action={createEvent} className="form">
                <label>
                  Event name
                  <input name="name" required maxLength={120} placeholder="UFC Fight Night: Okafor vs. Lindqvist" />
                </label>
                <label>
                  Web address <span className="optional">optional, made from the name if blank</span>
                  <input name="slug" maxLength={80} placeholder="fight-night-okafor-vs-lindqvist" />
                </label>
                <label>
                  Venue <span className="optional">optional</span>
                  <input name="venue" maxLength={120} placeholder="Apex, Las Vegas" />
                </label>
                <label>
                  First fight starts (your time)
                  <LocalDateTimeInput required />
                </label>
                <button className="button primary" type="submit">Create card</button>
              </TzForm>
            </div>
          )}

          {live && (
            <div className="panel" id="live">
              <h2>Livestream</h2>
              <p className="hint">
                Paste your YouTube or Twitch link and tick "We're live" when you start. The stream
                shows on the Watch page and a banner appears on the home page.
              </p>
              <form action={saveLive} className="form">
                <label>
                  Stream link
                  <input name="live_url" type="url" defaultValue={live.live_url ?? ""} placeholder="https://www.youtube.com/live/..." />
                </label>
                <label>
                  Title <span className="optional">optional</span>
                  <input name="live_title" defaultValue={live.live_title ?? ""} maxLength={100} placeholder="Fight night watch-along" />
                </label>
                <label className="check">
                  <input type="checkbox" name="is_live" defaultChecked={live.is_live} /> We're live
                </label>
                <button className="button" type="submit">Save livestream</button>
              </form>
            </div>
          )}

          {isAdmin && (
            <div className="panel">
              <h2>Manage access</h2>
              <p className="hint">Have the person sign up first, then enter their username here.</p>
              <form action={setRole} className="form">
                <label>
                  Username
                  <input name="username" required placeholder="welly" />
                </label>
                <label>
                  Access
                  <select name="role" defaultValue="analyst">
                    <option value="analyst">Analyst (posts picks, gets a picks page)</option>
                    <option value="member">Member (regular account)</option>
                    <option value="admin">Admin (manages cards, results and access)</option>
                  </select>
                </label>
                <button className="button" type="submit">Update access</button>
              </form>
            </div>
          )}

          <div className="panel">
            <h2>Your profile</h2>
            <form action={updateProfile} className="form">
              <label>
                Display name
                <input name="display_name" defaultValue={viewer.display_name ?? ""} maxLength={40} />
              </label>
              <label>
                Bio <span className="optional">{isAnalyst ? "shown on your picks page" : "optional"}</span>
                <textarea name="bio" rows={2} maxLength={280} defaultValue={viewer.bio ?? ""} />
              </label>
              <button className="button" type="submit">Save profile</button>
            </form>
          </div>

          {!isAnalyst && (
            <div className="panel">
              <h2>Your picks</h2>
              <p className="hint">Make your own picks on any upcoming card in the community section.</p>
              <Link href="/community" className="button">Go to community</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
