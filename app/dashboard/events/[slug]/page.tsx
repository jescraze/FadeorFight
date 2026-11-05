import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addFight,
  deleteEvent,
  deleteFight,
  saveAnalystPick,
  saveRecap,
  setResult,
  updateEvent,
} from "@/app/actions";
import { FightMeta, FightResult } from "@/components/FightRow";
import { LocalTime } from "@/components/LocalTime";
import { Notice } from "@/components/Notice";
import { LocalDateTimeInput, TzForm } from "@/components/TzForm";
import { getEventCard, getRecaps, getViewer } from "@/lib/data";
import { isConfigured } from "@/lib/env";
import { hasStarted } from "@/lib/format";
import { SEGMENTS } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export const metadata = { title: "Manage card" };

export default async function ManageCard({ params, searchParams }: Props) {
  const { slug } = await params;
  const { error, notice } = await searchParams;
  if (!isConfigured) redirect("/dashboard");

  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role === "member") redirect("/dashboard");

  const card = await getEventCard(slug, viewer);
  if (!card) notFound();

  const isAdmin = viewer.role === "admin";
  const myRecap = (await getRecaps(card.slug)).find((r) => r.author_id === viewer.id);
  const locked = hasStarted(card.starts_at);
  const nextPosition = (seg: string) =>
    card.fights.filter((f) => f.segment === seg).reduce((m, f) => Math.max(m, f.position), 0) + 1;

  return (
    <section className="page">
      <header className="card-head">
        <p className="kicker"><Link href="/dashboard">Dashboard</Link></p>
        <h1>{card.name}</h1>
        <p className="muted">
          <LocalTime iso={card.starts_at} style="full" />
          {card.venue && <> at {card.venue}</>}
        </p>
        <div className="card-actions">
          <Link href={`/events/${card.slug}`} className="button small">View public page</Link>
        </div>
      </header>

      <Notice error={error} notice={notice} />
      {locked && !isAdmin && <p className="status-note">This card has started, so picks are locked.</p>}

      {isAdmin && (
        <div className="dash">
          <div className="panel">
            <h2>Add a fight</h2>
            <form action={addFight} className="form">
              <input type="hidden" name="event_id" value={card.id} />
              <input type="hidden" name="slug" value={card.slug} />
              <div className="row">
                <label>
                  Fighter
                  <input name="fighter_a" required maxLength={60} />
                </label>
                <label>
                  Opponent
                  <input name="fighter_b" required maxLength={60} />
                </label>
              </div>
              <div className="row">
                <label>
                  Part of the card
                  <select name="segment" defaultValue="main">
                    {SEGMENTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </label>
                <label>
                  Order <span className="optional">1 = top</span>
                  <input name="position" type="number" min={1} max={30} defaultValue={nextPosition("main")} />
                </label>
              </div>
              <div className="row">
                <label>
                  Weight class <span className="optional">optional</span>
                  <input name="weight_class" maxLength={40} placeholder="Lightweight" />
                </label>
                <label>
                  Rounds
                  <select name="rounds" defaultValue="3">
                    <option value="3">3</option>
                    <option value="5">5</option>
                  </select>
                </label>
              </div>
              <p className="hint">On the main card, order 1 shows as the main event and 2 as the co-main.</p>
              <button className="button primary" type="submit">Add fight</button>
            </form>
          </div>

          <div className="panel">
            <h2>Card details</h2>
            <TzForm action={updateEvent} className="form">
              <input type="hidden" name="event_id" value={card.id} />
              <input type="hidden" name="slug" value={card.slug} />
              <label>
                Event name
                <input name="name" required defaultValue={card.name} maxLength={120} />
              </label>
              <label>
                Venue
                <input name="venue" defaultValue={card.venue ?? ""} maxLength={120} />
              </label>
              <label>
                First fight starts (your time)
                <LocalDateTimeInput iso={card.starts_at} required />
              </label>
              <button className="button" type="submit">Save details</button>
            </TzForm>

            <details className="danger-zone">
              <summary>Delete this card</summary>
              <form action={deleteEvent} className="form">
                <input type="hidden" name="event_id" value={card.id} />
                <input type="hidden" name="slug" value={card.slug} />
                <label>
                  This removes every fight and pick on it. Type delete to confirm.
                  <input name="confirm" autoComplete="off" />
                </label>
                <button className="button danger" type="submit">Delete card</button>
              </form>
            </details>
          </div>
        </div>
      )}

      {SEGMENTS.map((s) => {
        const fights = card.fights.filter((f) => f.segment === s.key);
        if (!fights.length) return null;
        return (
          <section key={s.key} className="segment">
            <h2>{s.label}</h2>
            <div className="fights">
              {fights.map((f) => {
                const mine = card.picks.find((p) => p.fight_id === f.id && p.analyst_id === viewer.id);
                const canPick = !locked || isAdmin;
                return (
                  <article key={f.id} id={`fight-${f.id}`} className="fight manage-fight">
                    <FightMeta fight={f} />
                    <p className="manage-bout">
                      {f.fighter_a} <span className="vs">vs</span> {f.fighter_b}
                    </p>
                    <FightResult fight={f} />

                    <form action={saveAnalystPick} className="form pick-entry">
                      <input type="hidden" name="fight_id" value={f.id} />
                      <input type="hidden" name="slug" value={card.slug} />
                      <fieldset disabled={!canPick}>
                        <legend>Your pick</legend>
                        <div className="corner-choice">
                          <label><input type="radio" name="pick" value="a" defaultChecked={mine?.pick === "a"} /> {f.fighter_a}</label>
                          <label><input type="radio" name="pick" value="b" defaultChecked={mine?.pick === "b"} /> {f.fighter_b}</label>
                          <label><input type="radio" name="pick" value="" defaultChecked={!mine} /> No pick</label>
                        </div>
                        <div className="row">
                          <label>
                            Method <span className="optional">optional</span>
                            <input name="method" defaultValue={mine?.method ?? ""} maxLength={40} placeholder="by KO" />
                          </label>
                          <label>
                            Odds <span className="optional">optional</span>
                            <input name="odds" defaultValue={mine?.odds ?? ""} inputMode="numeric" placeholder="-150" />
                          </label>
                        </div>
                        <label>
                          Write-up <span className="optional">optional</span>
                          <textarea name="write_up" rows={2} maxLength={1000} defaultValue={mine?.write_up ?? ""} />
                        </label>
                        <button className="button primary small" type="submit">Save pick</button>
                      </fieldset>
                    </form>

                    {isAdmin && (
                      <div className="admin-fight">
                        <form action={setResult} className="form result-entry">
                          <input type="hidden" name="fight_id" value={f.id} />
                          <input type="hidden" name="slug" value={card.slug} />
                          <div className="row">
                            <label>
                              Result
                              <select name="winner" defaultValue={f.winner ?? ""}>
                                <option value="">Not decided yet</option>
                                <option value="a">{f.fighter_a} won</option>
                                <option value="b">{f.fighter_b} won</option>
                                <option value="draw">Draw</option>
                                <option value="nc">No contest</option>
                              </select>
                            </label>
                            <label>
                              How <span className="optional">optional</span>
                              <input name="result_method" defaultValue={f.result_method ?? ""} maxLength={60} placeholder="KO R2" />
                            </label>
                          </div>
                          <button className="button small" type="submit">Save result</button>
                        </form>
                        <form action={deleteFight}>
                          <input type="hidden" name="fight_id" value={f.id} />
                          <input type="hidden" name="slug" value={card.slug} />
                          <button className="linklike danger" type="submit">Remove fight</button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <section id="recap" className="segment">
        <h2>Your recap</h2>
        <div className="panel">
          <p className="hint">
            Write this once the card is over. It shows on the Recaps page and at the bottom of the
            card. Clear every box and save to remove it.
          </p>
          <form action={saveRecap} className="form">
            <input type="hidden" name="event_id" value={card.id} />
            <input type="hidden" name="slug" value={card.slug} />
            <label>
              What went well
              <textarea name="went_well" rows={4} maxLength={4000} defaultValue={myRecap?.went_well ?? ""} />
            </label>
            <label>
              What didn't
              <textarea name="went_wrong" rows={4} maxLength={4000} defaultValue={myRecap?.went_wrong ?? ""} />
            </label>
            <label>
              Video <span className="optional">optional YouTube or Twitch link</span>
              <input name="video_url" type="url" defaultValue={myRecap?.video_url ?? ""} placeholder="https://youtu.be/..." />
            </label>
            <button className="button primary" type="submit">{myRecap ? "Update recap" : "Publish recap"}</button>
          </form>
        </div>
      </section>

      {!card.fights.length && (
        <p className="empty section-gap">
          {isAdmin ? "Add the first fight above. Start with the main event." : "No fights on this card yet."}
        </p>
      )}
    </section>
  );
}
