"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";

const STORAGE_KEY = "avepo-cookie-consent";
const REOPEN_EVENT = "avepo-open-cookie-settings";

type StoredConsent = { status: "all" | "necessary"; version: string };

export function openCookieSettings() {
  window.dispatchEvent(new Event(REOPEN_EVENT));
}

function readConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CURRENT_TERMS_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readConsent());
    const reopen = () => setVisible(true);
    window.addEventListener(REOPEN_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_EVENT, reopen);
  }, []);

  function choose(status: StoredConsent["status"]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, version: CURRENT_TERMS_VERSION }));
    } catch {
      // Private browsing or storage disabled — the banner will simply reappear next visit.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use strictly necessary cookies to keep our website and customer portal working and secure. With your
          permission, we&apos;d also like to use optional cookies to understand how our site is used — these stay
          off unless you accept them. See our{" "}
          <Link href="/cookies" className="text-avepo-green underline underline-offset-2">Cookie Policy</Link>.
        </p>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => choose("necessary")}>
            Necessary Only
          </Button>
          <Button className="flex-1 bg-avepo-green text-white hover:bg-avepo-green-light sm:flex-none" onClick={() => choose("all")}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
