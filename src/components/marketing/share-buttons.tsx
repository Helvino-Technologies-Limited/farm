"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Share2, Mail, Link as LinkIcon, MessageCircle } from "lucide-react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // user cancelled — no-op
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  }

  const text = encodeURIComponent(`${title} — ${url}`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Share:</span>
      {canNativeShare && (
        <Button type="button" variant="outline" size="icon" onClick={nativeShare} title="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      )}
      <Button render={<a href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer" />} nativeButton={false} variant="outline" size="icon" title="Share on WhatsApp">
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button render={<a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" />} nativeButton={false} variant="outline" size="icon" title="Share on Facebook">
        <span className="text-sm font-bold">f</span>
      </Button>
      <Button render={<a href={`https://twitter.com/intent/tweet?text=${text}`} target="_blank" rel="noopener noreferrer" />} nativeButton={false} variant="outline" size="icon" title="Share on X">
        <span className="text-sm font-bold">X</span>
      </Button>
      <Button render={<a href={`mailto:?subject=${encodeURIComponent(title)}&body=${text}`} />} nativeButton={false} variant="outline" size="icon" title="Share via Email">
        <Mail className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={copyLink} title="Copy link">
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
