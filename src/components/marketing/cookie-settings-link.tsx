"use client";

import { openCookieSettings } from "@/components/marketing/cookie-consent";

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="hover:text-foreground hover:underline"
    >
      Cookie Settings
    </button>
  );
}
