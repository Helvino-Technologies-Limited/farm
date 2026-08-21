import { getYouTubeVideoId } from "@/lib/youtube";

export function HeroBackgroundVideo({ url }: { url: string }) {
  const youtubeId = getYouTubeVideoId(url);

  if (youtubeId) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`}
          title="Entrance video"
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.77vh] min-w-full -translate-x-1/2 -translate-y-1/2 opacity-40"
          allow="autoplay; encrypted-media"
          frameBorder={0}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" src={url} />
  );
}
