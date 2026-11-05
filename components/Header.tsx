import Link from "next/link";
import { logOut } from "@/app/actions";
import { getAnalysts, getLive, getViewer } from "@/lib/data";
import { displayName, possessive } from "@/lib/format";

export async function Header() {
  const [viewer, analysts, live] = await Promise.all([getViewer(), getAnalysts(), getLive()]);

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="wordmark" aria-label="FadeorFight home">
          Fade<span>or</span>Fight
        </Link>

        <nav className="main-nav" aria-label="Main">
          <Link href="/events">Fight cards</Link>
          {analysts.map((a) => (
            <Link key={a.id} href={`/picks/${a.username}`}>
              {possessive(displayName(a))} picks
            </Link>
          ))}
          <Link href="/recaps">Recaps</Link>
          <Link href="/watch" className={live.is_live ? "is-live" : undefined}>
            Watch{live.is_live && <span className="live-dot" aria-label="(live now)" />}
          </Link>
          <Link href="/community">Community</Link>
          <Link href="/about">About</Link>
        </nav>

        <div className="account-nav">
          {viewer ? (
            <>
              <Link href="/dashboard">{viewer.role === "member" ? "Account" : "Dashboard"}</Link>
              <form action={logOut}>
                <button className="linklike" type="submit">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="button primary small">Join free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
