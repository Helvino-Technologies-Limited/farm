/** How long a staff session may sit with no activity before it's treated as expired.
 *  Shared between the server-side session check (src/lib/auth.ts) and the client-side
 *  inactivity watcher (src/components/dashboard/idle-logout-watcher.tsx) — kept in its own
 *  file (no "server-only") so both sides can import the same value. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
