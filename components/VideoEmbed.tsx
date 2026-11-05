import { headers } from "next/headers";
import { embedUrl } from "@/lib/video";

export async function VideoEmbed({ url, title }: { url: string | null; title: string }) {
  const host = (await headers()).get("host") ?? "localhost";
  const src = embedUrl(url, host);
  if (!src) return null;
  return (
    <div className="video">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
