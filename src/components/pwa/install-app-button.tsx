"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, Share, SquarePlus, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent) && !("MSStream" in window));

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setInstructionsOpen(true);
  }

  return (
    <>
      <Button
        size="sm"
        onClick={handleClick}
        className={className ?? "bg-avepo-green text-white hover:bg-avepo-green-light"}
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </Button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Avepo Smart Farm</DialogTitle>
          </DialogHeader>
          {isIos ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avepo-yellow font-semibold text-avepo-green">1</span>
                <span className="flex items-center gap-1.5">
                  Tap the <Share className="h-4 w-4" /> Share button in Safari's toolbar.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avepo-yellow font-semibold text-avepo-green">2</span>
                <span className="flex items-center gap-1.5">
                  Scroll down and tap <SquarePlus className="h-4 w-4" /> &quot;Add to Home Screen&quot;.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avepo-yellow font-semibold text-avepo-green">3</span>
                <span>Tap &quot;Add&quot; — the Avepo icon appears on your home screen.</span>
              </li>
            </ol>
          ) : (
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avepo-yellow font-semibold text-avepo-green">1</span>
                <span className="flex items-center gap-1.5">
                  Open your browser menu <MoreVertical className="h-4 w-4" /> (top right).
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avepo-yellow font-semibold text-avepo-green">2</span>
                <span>Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-avepo-yellow font-semibold text-avepo-green">3</span>
                <span>Confirm — Avepo Smart Farm installs like a native app.</span>
              </li>
            </ol>
          )}
          <DialogFooter>
            <Button onClick={() => setInstructionsOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
