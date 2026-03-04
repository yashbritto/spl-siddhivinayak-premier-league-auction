import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Monitor, Shield } from "lucide-react";
import { motion } from "motion/react";

// ─── League settings helpers ──────────────────────────────────────────────────
export interface LeagueSettings {
  shortName: string;
  fullName: string;
  logoUrl: string;
  logoSize: number; // 50–200, default 100
  nameSize: number; // 50–200, default 100
  auctionYear: string; // e.g. "PLAYER AUCTION 2026"
}

export const LEAGUE_KEY = "spl_league_settings";

export function getLeagueSettings(): LeagueSettings {
  const defaults: LeagueSettings = {
    shortName: "SPL",
    fullName: "Siddhivinayak Premier League 2026",
    logoUrl: "",
    logoSize: 100,
    nameSize: 100,
    auctionYear: "PLAYER AUCTION 2026",
  };
  try {
    const raw = localStorage.getItem(LEAGUE_KEY);
    if (raw)
      return { ...defaults, ...(JSON.parse(raw) as Partial<LeagueSettings>) };
  } catch {
    // ignore
  }
  return defaults;
}

export function saveLeagueSettings(s: LeagueSettings) {
  try {
    localStorage.setItem(LEAGUE_KEY, JSON.stringify(s));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("Storage full — try a smaller logo image (under 200KB)");
    }
    throw e;
  }
}

// ─── Team logos helpers ───────────────────────────────────────────────────────
export const TEAM_LOGOS_KEY = "spl_team_logos";

export function getTeamLogos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TEAM_LOGOS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  return {};
}

export function saveTeamLogos(logos: Record<string, string>) {
  try {
    localStorage.setItem(TEAM_LOGOS_KEY, JSON.stringify(logos));
    // Notify same-tab listeners (storage event only fires cross-tab natively)
    window.dispatchEvent(new StorageEvent("storage", { key: TEAM_LOGOS_KEY }));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("Storage full — try a smaller image (under 200KB)");
    }
    throw e;
  }
}

// ─── Owner photos helpers ─────────────────────────────────────────────────────
export const OWNER_PHOTOS_KEY = "spl_owner_photos";

export function getOwnerPhotos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(OWNER_PHOTOS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  return {};
}

export function saveOwnerPhotos(photos: Record<string, string>) {
  try {
    localStorage.setItem(OWNER_PHOTOS_KEY, JSON.stringify(photos));
    window.dispatchEvent(
      new StorageEvent("storage", { key: OWNER_PHOTOS_KEY }),
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("Storage full — try a smaller image (under 200KB)");
    }
    throw e;
  }
}

// ─── Icon player photos helpers ───────────────────────────────────────────────
export const ICON_PHOTOS_KEY = "spl_icon_photos";

export function getIconPhotos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ICON_PHOTOS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  return {};
}

export function saveIconPhotos(photos: Record<string, string>) {
  try {
    localStorage.setItem(ICON_PHOTOS_KEY, JSON.stringify(photos));
    window.dispatchEvent(new StorageEvent("storage", { key: ICON_PHOTOS_KEY }));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("Storage full — try a smaller image (under 200KB)");
    }
    throw e;
  }
}

// ─── Live Colour Theme helpers ────────────────────────────────────────────────
export interface LiveColorTheme {
  // Backgrounds
  pageBg: string; // main page background
  headerBg: string; // header bar background
  rightPanelBg: string; // right panel background
  playerImageBg: string; // player photo placeholder bg
  // Accents & highlights
  goldAccent: string; // primary gold/accent colour (bid counter, headings)
  silverAccent: string; // secondary accent colour
  // Text colours
  primaryText: string; // player name, main labels
  secondaryText: string; // sub-labels, captions
  // Bid counter
  bidCounterColor: string; // bid number colour
  bidCounterGlow: string; // bid glow colour
  // Leading team banner
  leadingTeamBg: string;
  leadingTeamText: string;
  // Team table
  teamRowBg: string;
  teamRowLeadingBg: string;
  teamRowLeadingBorder: string;
  teamRowText: string;
  teamRowLeadingText: string;
  // Chart bars
  chartBarDefault: string;
  chartBarLeading: string;
  // Category badges
  batsmanColor: string;
  bowlerColor: string;
  allrounderColor: string;
  // SOLD overlay
  soldBannerBg: string;
  soldBannerBorder: string;
  soldTextColor: string;
  // LIVE indicator dot
  liveDotColor: string;
  // Decorative grid
  gridColor: string;
  atmosphereBg: string;
}

export const LIVE_COLOR_KEY = "spl_live_colors";

export const DEFAULT_LIVE_COLORS: LiveColorTheme = {
  pageBg: "#0a0c1a",
  headerBg: "#0e1128",
  rightPanelBg: "#080a17",
  playerImageBg: "#111830",
  goldAccent: "#d4af37",
  silverAccent: "#a8b4c4",
  primaryText: "#f5f0e8",
  secondaryText: "#6b7080",
  bidCounterColor: "#d4af37",
  bidCounterGlow: "#d4af3788",
  leadingTeamBg: "#d4af3718",
  leadingTeamText: "#e8c84a",
  teamRowBg: "#0f1225",
  teamRowLeadingBg: "#d4af3714",
  teamRowLeadingBorder: "#d4af3766",
  teamRowText: "#9099aa",
  teamRowLeadingText: "#e8c84a",
  chartBarDefault: "#1e2a5e",
  chartBarLeading: "#d4af37",
  batsmanColor: "#4ade80",
  bowlerColor: "#f87171",
  allrounderColor: "#d4af37",
  soldBannerBg: "#0d1020",
  soldBannerBorder: "#d4af37",
  soldTextColor: "#d4af37",
  liveDotColor: "#ef4444",
  gridColor: "#d4af37",
  atmosphereBg: "#1a2a6c",
};

export function getLiveColors(): LiveColorTheme {
  try {
    const raw = localStorage.getItem(LIVE_COLOR_KEY);
    if (raw)
      return {
        ...DEFAULT_LIVE_COLORS,
        ...(JSON.parse(raw) as Partial<LiveColorTheme>),
      };
  } catch {
    // ignore
  }
  return { ...DEFAULT_LIVE_COLORS };
}

export function saveLiveColors(c: LiveColorTheme) {
  localStorage.setItem(LIVE_COLOR_KEY, JSON.stringify(c));
}

// ─── Live Layout helpers ──────────────────────────────────────────────────────
export interface LiveLayoutConfig {
  playerImageWidth: number;
  playerImageHeight: number;
  playerNameSize: number;
  categoryBadgeSize: number;
  bidCounterSize: number;
  leadingTeamSize: number;
  rightPanelWidth: number;
  teamTableFontSize: number;
  chartHeight: number;
  headerLogoSize: number;
}

export const LIVE_LAYOUT_KEY = "spl_live_layout";

export const DEFAULT_LIVE_LAYOUT: LiveLayoutConfig = {
  playerImageWidth: 208,
  playerImageHeight: 260,
  playerNameSize: 100,
  categoryBadgeSize: 100,
  bidCounterSize: 100,
  leadingTeamSize: 100,
  rightPanelWidth: 380,
  teamTableFontSize: 100,
  chartHeight: 200,
  headerLogoSize: 36,
};

export function getLiveLayout(): LiveLayoutConfig {
  try {
    const raw = localStorage.getItem(LIVE_LAYOUT_KEY);
    if (raw)
      return {
        ...DEFAULT_LIVE_LAYOUT,
        ...(JSON.parse(raw) as Partial<LiveLayoutConfig>),
      };
  } catch {
    // ignore
  }
  return { ...DEFAULT_LIVE_LAYOUT };
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const settings = getLeagueSettings();
  const shortName = settings.shortName || "SPL";
  const fullName = settings.fullName || "Siddhivinayak Premier League 2026";
  const logoUrl = settings.logoUrl;
  const logoSizePct = settings.logoSize / 100;
  const nameSizePct = settings.nameSize / 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden broadcast-overlay flex flex-col items-center justify-center">
      {/* Background atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.16 0.06 255 / 0.8) 0%, transparent 70%)",
        }}
      />
      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.78 0.165 85 / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.78 0.165 85 / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Diagonal accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.78 0.165 85 / 0.025) 0%, transparent 50%, oklch(0.78 0.165 85 / 0.04) 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={shortName}
              style={{
                width: `${Math.round(200 * logoSizePct)}px`,
                height: `${Math.round(200 * logoSizePct)}px`,
                objectFit: "contain",
                filter: "drop-shadow(0 0 40px oklch(0.78 0.165 85 / 0.4))",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: `${Math.round(180 * logoSizePct)}px`,
                height: `${Math.round(180 * logoSizePct)}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "radial-gradient(circle, oklch(0.18 0.07 255) 0%, oklch(0.11 0.03 255) 100%)",
                border: "2px solid oklch(0.78 0.165 85 / 0.6)",
                boxShadow:
                  "0 0 60px oklch(0.78 0.165 85 / 0.35), 0 0 120px oklch(0.78 0.165 85 / 0.12)",
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 900,
                fontSize: `${Math.round(60 * logoSizePct)}px`,
                color: "oklch(0.78 0.165 85)",
                letterSpacing: "-0.03em",
                margin: "0 auto",
              }}
            >
              {shortName.slice(0, 3)}
            </div>
          )}
        </motion.div>

        {/* Event badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <span
            className="inline-block px-4 py-1 text-xs font-broadcast tracking-widest"
            style={{
              background: "oklch(0.78 0.165 85 / 0.12)",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
              color: "oklch(0.88 0.18 88)",
            }}
          >
            ● LIVE AUCTION EVENT 2026
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-broadcast leading-none mb-2"
          style={{
            fontSize: `${Math.round(96 * nameSizePct)}px`,
            color: "oklch(0.78 0.165 85)",
            textShadow:
              "0 0 40px oklch(0.78 0.165 85 / 0.5), 0 0 80px oklch(0.78 0.165 85 / 0.2)",
          }}
        >
          {shortName}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="w-full max-w-lg h-px mb-4"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.165 85), transparent)",
          }}
        />

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="font-broadcast tracking-widest mb-2"
          style={{
            fontSize: `${Math.round(22 * nameSizePct)}px`,
            color: "oklch(0.72 0.04 90)",
          }}
        >
          {fullName.toUpperCase()}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-base mb-12"
          style={{ color: "oklch(0.5 0.02 90)" }}
        >
          Player Auction — Season 2026
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/live" })}
            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 text-base font-broadcast tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
              color: "oklch(0.08 0.025 265)",
              boxShadow: "0 0 30px oklch(0.78 0.165 85 / 0.4)",
            }}
          >
            <Monitor size={20} />
            LIVE SCREEN
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/admin" })}
            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 text-base font-broadcast tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "oklch(0.13 0.03 255 / 0.8)",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
              color: "oklch(0.78 0.165 85)",
              boxShadow: "0 0 20px oklch(0.78 0.165 85 / 0.08)",
            }}
          >
            <Shield size={20} />
            ADMIN PANEL
            <ChevronRight size={16} />
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          {[
            { value: "10", label: "TEAMS" },
            { value: "90", label: "PLAYERS" },
            { value: "20,000", label: "PURSE PTS" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                className="font-digital text-3xl font-bold"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs font-broadcast tracking-widest mt-1"
                style={{ color: "oklch(0.42 0.02 90)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-0 right-0 text-center text-xs z-10"
        style={{ color: "oklch(0.32 0.02 90)" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.58 0.12 82)" }}
        >
          caffeine.ai
        </a>
      </motion.footer>
    </div>
  );
}
