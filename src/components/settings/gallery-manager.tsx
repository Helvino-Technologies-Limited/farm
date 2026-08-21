"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteRecordButton } from "@/components/admin/delete-record-button";
import { createGalleryImageAction } from "@/app/(dashboard)/settings/actions";

type GalleryItem = { id: string; imageUrl: string; caption: string | null; category: string | null };

export function GalleryManager({ images }: { images: GalleryItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await upload(`gallery/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: "gallery",
      });
      await createGalleryImageAction({ imageUrl: blob.url, caption: caption || undefined, category: category || undefined });
      toast.success("Photo added to gallery.");
      setCaption(""); setCategory("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Caption (optional)</label><Input value={caption} onChange={(e) => setCaption(e.target.value)} className="w-48" /></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Category (optional)</label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Poultry, Seedlings..." className="w-48" /></div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Uploading..." : "Upload Photo"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <Image src={img.imageUrl} alt={img.caption ?? "Gallery photo"} fill className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 px-2 py-1">
              <span className="truncate text-[11px] text-white">{img.caption ?? img.category ?? ""}</span>
              <DeleteRecordButton module="gallery-images" id={img.id} label={img.caption ?? "photo"} size="icon" className="h-6 w-6 text-white hover:text-white" />
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No photos yet.</p>}
      </div>
    </div>
  );
}
