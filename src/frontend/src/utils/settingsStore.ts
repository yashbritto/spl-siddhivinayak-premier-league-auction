/**
 * settingsStore — Persists all app settings (league name, logos, colours,
 * layout) to the ICP backend canister so they survive across devices and
 * browser resets.
 *
 * Strategy: store settings in a special "config" player record whose
 * imageUrl field starts with SETTINGS_PLAYER_PREFIX followed by JSON.
 * This is completely invisible to the auction system — it is filtered out
 * everywhere players are listed.
 *
 * Local localStorage remains the fast-read cache; the backend is the
 * persistence / cross-device sync layer.
 */

import { Category, type backendInterface } from "../backend.d";
import {
  DEFAULT_LIVE_COLORS,
  DEFAULT_LIVE_LAYOUT,
  ICON_PHOTOS_KEY,
  LEAGUE_KEY,
  LIVE_COLOR_KEY,
  LIVE_LAYOUT_KEY,
  type LeagueSettings,
  type LiveColorTheme,
  type LiveLayoutConfig,
  OWNER_PHOTOS_KEY,
  TEAM_LOGOS_KEY,
  getIconPhotos,
  getLeagueSettings,
  getLiveColors,
  getLiveLayout,
  getOwnerPhotos,
  getTeamLogos,
} from "../pages/LandingPage";

// ─── Constants ─────────────────────────────────────────────────────────────────

export const SETTINGS_PLAYER_NAME = "__SPL_CONFIG__";
export const SETTINGS_PLAYER_PREFIX = "__SPL_SETTINGS__:";

// ─── Combined settings type ────────────────────────────────────────────────────

export interface AllSettings {
  league: LeagueSettings;
  teamLogos: Record<string, string>;
  ownerPhotos: Record<string, string>;
  iconPhotos: Record<string, string>;
  liveColors: LiveColorTheme;
  liveLayout: LiveLayoutConfig;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function buildSettingsPayload(settings: AllSettings): string {
  return SETTINGS_PLAYER_PREFIX + JSON.stringify(settings);
}

export function parseSettingsPayload(imageUrl: string): AllSettings | null {
  if (!imageUrl.startsWith(SETTINGS_PLAYER_PREFIX)) return null;
  try {
    const json = imageUrl.slice(SETTINGS_PLAYER_PREFIX.length);
    const parsed = JSON.parse(json) as Partial<AllSettings>;

    // Merge with defaults so partial saves still work
    const defaults = getDefaultSettings();
    return {
      league: { ...defaults.league, ...(parsed.league ?? {}) },
      teamLogos: parsed.teamLogos ?? defaults.teamLogos,
      ownerPhotos: parsed.ownerPhotos ?? defaults.ownerPhotos,
      iconPhotos: parsed.iconPhotos ?? defaults.iconPhotos,
      liveColors: { ...defaults.liveColors, ...(parsed.liveColors ?? {}) },
      liveLayout: { ...defaults.liveLayout, ...(parsed.liveLayout ?? {}) },
    };
  } catch {
    return null;
  }
}

export function getDefaultSettings(): AllSettings {
  return {
    league: getLeagueSettings(),
    teamLogos: getTeamLogos(),
    ownerPhotos: getOwnerPhotos(),
    iconPhotos: getIconPhotos(),
    liveColors: getLiveColors(),
    liveLayout: getLiveLayout(),
  };
}

export function applySettingsToLocalStorage(settings: AllSettings): void {
  try {
    // League
    const leagueDefaults: LeagueSettings = {
      shortName: "SPL",
      fullName: "Siddhivinayak Premier League 2026",
      logoUrl: "",
      logoSize: 100,
      nameSize: 100,
      auctionYear: "PLAYER AUCTION 2026",
    };
    localStorage.setItem(
      LEAGUE_KEY,
      JSON.stringify({ ...leagueDefaults, ...settings.league }),
    );

    // Team logos / owner photos / icon photos
    localStorage.setItem(TEAM_LOGOS_KEY, JSON.stringify(settings.teamLogos));
    localStorage.setItem(
      OWNER_PHOTOS_KEY,
      JSON.stringify(settings.ownerPhotos),
    );
    localStorage.setItem(ICON_PHOTOS_KEY, JSON.stringify(settings.iconPhotos));

    // Live colours
    localStorage.setItem(
      LIVE_COLOR_KEY,
      JSON.stringify({ ...DEFAULT_LIVE_COLORS, ...settings.liveColors }),
    );

    // Live layout
    localStorage.setItem(
      LIVE_LAYOUT_KEY,
      JSON.stringify({ ...DEFAULT_LIVE_LAYOUT, ...settings.liveLayout }),
    );
  } catch {
    // Silently ignore quota errors — localStorage is best-effort cache
  }
}

// ─── Backend read / write ──────────────────────────────────────────────────────

export async function loadSettingsFromBackend(
  actor: backendInterface,
): Promise<AllSettings | null> {
  try {
    const players = await actor.getPlayers();
    const configPlayer = players.find(
      (p) =>
        p.name === SETTINGS_PLAYER_NAME ||
        p.imageUrl.startsWith(SETTINGS_PLAYER_PREFIX),
    );
    if (!configPlayer) return null;
    return parseSettingsPayload(configPlayer.imageUrl);
  } catch {
    return null;
  }
}

export async function saveSettingsToBackend(
  actor: backendInterface,
  settings: AllSettings,
): Promise<void> {
  try {
    const payload = buildSettingsPayload(settings);
    const players = await actor.getPlayers();
    const existing = players.find(
      (p) =>
        p.name === SETTINGS_PLAYER_NAME ||
        p.imageUrl.startsWith(SETTINGS_PLAYER_PREFIX),
    );

    if (existing) {
      // Update the existing config record
      await actor.updatePlayer(
        existing.id,
        SETTINGS_PLAYER_NAME,
        Category.batsman,
        0n,
        payload,
        0n,
      );
    } else {
      // Create a new config record
      await actor.addPlayer(
        SETTINGS_PLAYER_NAME,
        Category.batsman,
        0n,
        payload,
        0n,
      );
    }
  } catch {
    // Completely silent — never block the UI
  }
}

// ─── Filter helper ─────────────────────────────────────────────────────────────

/** Returns true if this player is the hidden settings record. */
export function isSettingsPlayer(player: {
  name: string;
  imageUrl: string;
}): boolean {
  return (
    player.name === SETTINGS_PLAYER_NAME ||
    player.imageUrl.startsWith(SETTINGS_PLAYER_PREFIX)
  );
}
