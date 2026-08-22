"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { saveVideoUrlAction, saveVideoLinkAction, removeVideoAction, type VideoSlot } from "@/app/(dashboard)/settings/actions";
import { getYouTubeVideoId, isYouTubeUrl } from "@/lib/youtube";

export function VideoUpload({
  slot,
  currentVideoUrl,
  helpText,
  uploadLabel,
}: {
  slot: VideoSlot;
  currentVideoUrl: string | null;
  helpText: string;
  uploadLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savingLink, setSavingLink] = useState(false);
  const router = useRouter();

  const currentYouTubeId = currentVideoUrl && isYouTubeUrl(currentVideoUrl) ? getYouTubeVideoId(currentVideoUrl) : null;

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await upload(`branding/${slot}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: `${slot}-video`,
      });
      await saveVideoUrlAction(slot, blob.url);
      toast.success("Video updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload video.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onSaveLink() {
    if (!isYouTubeUrl(youtubeUrl)) {
      toast.error("Enter a valid YouTube video link.");
      return;
    }
    setSavingLink(true);
    try {
      await saveVideoLinkAction(slot, youtubeUrl);
      toast.success("Video updated from YouTube.");
      setYoutubeUrl("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save YouTube link.");
    } finally {
      setSavingLink(false);
    }
  }

  async function onRemove() {
    try {
      await removeVideoAction(slot);
      toast.success("Video removed.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove video.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{helpText}</p>

      {currentVideoUrl && (
        currentYouTubeId ? (
          <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border">
            <iframe
              src={`https://www.youtube.com/embed/${currentYouTubeId}`}
              title="Video preview"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={currentVideoUrl} controls className="w-full max-w-md rounded-lg border" />
        )
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onChange} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Uploading..." : currentVideoUrl ? "Replace with Uploaded Video" : uploadLabel}
        </Button>
        {currentVideoUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="max-w-sm"
        />
        <Button type="button" variant="outline" size="sm" disabled={savingLink || !youtubeUrl} onClick={onSaveLink}>
          {savingLink ? "Saving..." : "Use YouTube Link"}
        </Button>
      </div>
    </div>
  );
}
