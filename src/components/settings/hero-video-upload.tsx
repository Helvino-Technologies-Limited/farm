"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { saveHeroVideoUrlAction, removeHeroVideoAction } from "@/app/(dashboard)/settings/actions";

export function HeroVideoUpload({ currentVideoUrl }: { currentVideoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await upload(`branding/hero-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: "hero-video",
      });
      await saveHeroVideoUrlAction(blob.url);
      toast.success("Entrance video updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload video.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    try {
      await removeHeroVideoAction();
      toast.success("Entrance video removed.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove video.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Plays as the background/entrance video on the public welcome page. MP4 or WebM, up to 200MB.
      </p>
      {currentVideoUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={currentVideoUrl} controls className="w-full max-w-md rounded-lg border" />
      )}
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onChange} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Uploading..." : currentVideoUrl ? "Replace Video" : "Upload Entrance Video"}
        </Button>
        {currentVideoUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
