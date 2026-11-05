/**
 * Turns a YouTube or Twitch link into an embeddable player URL.
 * `host` is your site's domain; Twitch requires it.
 */
export function embedUrl(link: string | null | undefined, host: string): string | null {
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  const h = url.hostname.replace(/^www\.|^m\./, "");

  if (h === "youtu.be") return yt(url.pathname.slice(1));
  if (h === "youtube.com" || h === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v) return yt(v);
    const m = url.pathname.match(/^\/(?:live|shorts|embed)\/([\w-]{6,})/);
    if (m) return yt(m[1]);
    return null;
  }
  if (h === "twitch.tv") {
    const parent = host.split(":")[0] || "localhost";
    const video = url.pathname.match(/^\/videos\/(\d+)/);
    if (video) return `https://player.twitch.tv/?video=${video[1]}&parent=${parent}&autoplay=false`;
    const channel = url.pathname.split("/").filter(Boolean)[0];
    if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false`;
  }
  return null;
}

function yt(id: string) {
  return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
