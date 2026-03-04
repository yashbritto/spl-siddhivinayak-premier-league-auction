/**
 * syncToOffline — Stub kept for backward compatibility.
 * The offline mode has been merged into the main app via IndexedDB (idbStore).
 * This file previously synced data to a separate offline localStorage store.
 * Now it is a no-op — the main routes (admin, live, settings) use IDB directly.
 */

import { type AllSettings, applySettingsToLocalStorage } from "./settingsStore";

// ─── Settings sync ────────────────────────────────────────────────────────────

/**
 * syncSettingsToOffline — Writes all settings into localStorage so the
 * live page on the same device sees up-to-date league name, logos, colours
 * and layout even when coming from IDB.
 */
export function syncSettingsToOffline(settings: AllSettings): void {
  try {
    applySettingsToLocalStorage(settings);
  } catch {
    // Best-effort — never throw
  }
}

/** No-op stub. IDB is the primary store now. */
export function syncToOffline(): void {
  // intentionally empty
}

/** Returns null — last sync time concept is deprecated. */
export function getLastSyncTime(): string | null {
  return null;
}
