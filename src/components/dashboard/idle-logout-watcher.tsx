"use client";

import { useEffect, useRef } from "react";
import { idleLogoutAction } from "@/app/actions";
import { IDLE_TIMEOUT_MS } from "@/lib/session-config";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "scroll", "touchstart"] as const;

/** Signs a staff member out after IDLE_TIMEOUT_MS with no mouse/keyboard/touch activity, so an
 *  unattended, still-logged-in dashboard tab doesn't stay open indefinitely. Mounted once in the
 *  dashboard layout — not used on the public site or the customer portal. */
export function IdleLogoutWatcher() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        idleLogoutAction();
      }, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, []);

  return null;
}
