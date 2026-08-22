import { getYouTubeVideoId } from "@/lib/youtube";

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const youtubeId = getYouTubeVideoId(url);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-sm">
      {youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={url} controls className="h-full w-full object-cover" />
      )}
    </div>
  );
}
