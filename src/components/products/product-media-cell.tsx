"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImagePlus, Video, X } from "lucide-react";
import {
  saveProductImageUrlAction,
  saveProductVideoUrlAction,
  removeProductVideoAction,
} from "@/app/(dashboard)/products/actions";

export function ProductMediaCell({
  productId,
  imageUrl,
  videoUrl,
}: {
  productId: string;
  imageUrl: string | null;
  videoUrl: string | null;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const router = useRouter();

  async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const blob = await upload(`products/${productId}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: "image",
      });
      await saveProductImageUrlAction(productId, blob.url);
      toast.success("Photo updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const blob = await upload(`products/${productId}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: "video",
      });
      await saveProductVideoUrlAction(productId, blob.url);
      toast.success("Video uploaded.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload video.");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function onRemoveVideo() {
    try {
      await removeProductVideoAction(productId);
      toast.success("Video removed.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove video.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImagePlus className="h-4 w-4" />
          </div>
        )}
      </div>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
      <Button type="button" variant="ghost" size="sm" disabled={uploadingImage} onClick={() => imageInputRef.current?.click()}>
        {uploadingImage ? "Uploading..." : imageUrl ? "Change" : "Add Photo"}
      </Button>

      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={onVideoChange} />
      <Button type="button" variant="ghost" size="icon" title={videoUrl ? "Replace video" : "Add video"} disabled={uploadingVideo} onClick={() => videoInputRef.current?.click()}>
        <Video className={videoUrl ? "h-4 w-4 text-avepo-green" : "h-4 w-4"} />
      </Button>
      {videoUrl && (
        <Button type="button" variant="ghost" size="icon" title="Remove video" onClick={onRemoveVideo}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
