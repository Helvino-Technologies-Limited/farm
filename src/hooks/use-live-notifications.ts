"use client";

import { useEffect, useRef, useState } from "react";

export interface LiveNotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

interface PollResult {
  unreadCount: number;
  latest: LiveNotificationItem[];
}

function beep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio unavailable — skip the beep, voice announcement still runs.
  }
}

function speak(items: LiveNotificationItem[]) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  for (const item of items) {
    const utterance = new SpeechSynthesisUtterance(`${item.title}. ${item.message}`);
    utterance.rate = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
}

/** Polls a notification feed (staff or customer) and, when genuinely new items arrive since the
 *  last poll, plays a chime and speaks them aloud via the browser's speech synthesis — a live
 *  voice notification without needing websockets/push infrastructure. */
export function useLiveNotifications(poll: () => Promise<PollResult>, intervalMs = 20000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenId = useRef<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const result = await poll();
        if (cancelled) return;
        setUnreadCount(result.unreadCount);

        if (result.latest.length === 0) return;

        if (isFirstLoad.current) {
          lastSeenId.current = result.latest[0].id;
          isFirstLoad.current = false;
          return;
        }

        const knownIndex = result.latest.findIndex((n) => n.id === lastSeenId.current);
        const newItems = knownIndex === -1 ? result.latest : result.latest.slice(0, knownIndex);
        if (newItems.length > 0) {
          lastSeenId.current = result.latest[0].id;
          beep();
          speak([...newItems].reverse());
        }
      } catch {
        // Transient poll failure — try again on the next tick.
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [poll, intervalMs]);

  return { unreadCount };
}
