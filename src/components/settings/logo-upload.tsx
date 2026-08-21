"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveFarmLogoUrlAction } from "@/app/(dashboard)/settings/actions";

export function LogoUpload({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await upload(`branding/logo-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: "logo",
      });
      await saveFarmLogoUrlAction(blob.url);
      toast.success("Logo updated across the whole system.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-24 items-center justify-center rounded-lg border bg-muted/40 overflow-hidden">
        {currentLogoUrl && !currentLogoUrl.startsWith("data:") ? (
          <Image src={currentLogoUrl} alt="Farm logo" width={90} height={60} className="object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground px-2 text-center">Using default Avepo logo</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "Uploading..." : "Upload New Logo"}
      </Button>
    </div>
  );
}
