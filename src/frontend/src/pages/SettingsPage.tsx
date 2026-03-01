import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit3,
  ImageIcon,
  Loader2,
  Lock,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Star,
  Trash2,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Player, Team } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useImageUpload } from "../hooks/useImageUpload";

// ─── League Settings localStorage helpers ────────────────────────────────────

export interface LeagueConfig {
  shortName: string;
  fullName: string;
  logoUrl: string;
  logoSize: number; // percentage 50–200, default 100
  shortNameSize: number; // percentage 50–200, default 100
  fullNameSize: number; // percentage 50–200, default 100
}

const LEAGUE_SETTINGS_KEY = "spl_league_settings";
const TEAM_LOGOS_KEY = "spl_team_logos";

export function getLeagueConfig(): LeagueConfig {
  try {
    const raw = localStorage.getItem(LEAGUE_SETTINGS_KEY);
    if (raw) {
      return {
        shortName: "SPL",
        fullName: "Siddhivinayak Premier League",
        logoUrl: "",
        logoSize: 100,
        shortNameSize: 100,
        fullNameSize: 100,
        ...(JSON.parse(raw) as Partial<LeagueConfig>),
      };
    }
  } catch {
    // fall through
  }
  return {
    shortName: "SPL",
    fullName: "Siddhivinayak Premier League",
    logoUrl: "",
    logoSize: 100,
    shortNameSize: 100,
    fullNameSize: 100,
  };
}

// ─── Live Layout Config ───────────────────────────────────────────────────────

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
  playerImageHeight: 256,
  playerNameSize: 100,
  categoryBadgeSize: 100,
  bidCounterSize: 100,
  leadingTeamSize: 100,
  rightPanelWidth: 384,
  teamTableFontSize: 100,
  chartHeight: 200,
  headerLogoSize: 36,
};

export function getLiveLayout(): LiveLayoutConfig {
  try {
    const raw = localStorage.getItem(LIVE_LAYOUT_KEY);
    if (raw) return { ...DEFAULT_LIVE_LAYOUT, ...JSON.parse(raw) };
  } catch {
    // fall through
  }
  return { ...DEFAULT_LIVE_LAYOUT };
}

function saveLeagueConfig(config: LeagueConfig) {
  localStorage.setItem(LEAGUE_SETTINGS_KEY, JSON.stringify(config));
}

export function getTeamLogos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TEAM_LOGOS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // fall through
  }
  return {};
}

function saveTeamLogos(logos: Record<string, string>) {
  localStorage.setItem(TEAM_LOGOS_KEY, JSON.stringify(logos));
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamEditState {
  name: string;
  ownerName: string;
  iconPlayerName: string;
  purse: string;
  logoUrl: string;
  isDirty: boolean;
  isSaving: boolean;
}

interface PlayerEditState {
  name: string;
  category: string;
  basePrice: string;
  imageUrl: string;
  rating: string;
  isDirty: boolean;
  isSaving: boolean;
  isExpanded: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Batsman: "oklch(0.7 0.15 140)",
  Bowler: "oklch(0.65 0.18 25)",
  Allrounder: "oklch(0.78 0.165 85)",
};

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? "oklch(0.55 0.02 90)";
  return (
    <span
      className="text-xs font-broadcast tracking-widest px-2 py-0.5"
      style={{
        background: `${color}22`,
        border: `1px solid ${color}66`,
        color,
      }}
    >
      {category.toUpperCase()}
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          style={{
            color: i <= value ? "oklch(0.78 0.165 85)" : "oklch(0.25 0.03 265)",
            fill: i <= value ? "oklch(0.78 0.165 85)" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

// Inline field style
const fieldStyle: React.CSSProperties = {
  background: "oklch(0.08 0.025 265)",
  border: "1px solid oklch(0.22 0.04 265)",
  color: "oklch(0.96 0.015 90)",
  outline: "none",
};

const fieldFocusClass =
  "focus:ring-1 focus:ring-[oklch(0.78_0.165_85/0.4)] transition-shadow";

// ─── League Tab ───────────────────────────────────────────────────────────────

function LeagueTab() {
  const [config, setConfig] = useState<LeagueConfig>(getLeagueConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, progress } = useImageUpload();

  const update = (key: keyof LeagueConfig, val: string | number) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const url = await uploadImage(file);
      setConfig((prev) => ({ ...prev, logoUrl: url }));
      setIsDirty(true);
      toast.success("Logo uploaded successfully");
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    saveLeagueConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      toast.success(
        "League settings saved — refresh the main pages to see changes",
      );
    }, 300);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div
        className="px-1 flex items-center gap-2 text-xs"
        style={{ color: "oklch(0.45 0.02 90)" }}
      >
        <Trophy size={12} />
        <span>Configure league name and logo displayed across all screens</span>
      </div>

      {/* League details */}
      <div
        className="p-5 space-y-4"
        style={{
          background: "oklch(0.11 0.03 265)",
          border: isDirty
            ? "1px solid oklch(0.78 0.165 85 / 0.4)"
            : "1px solid oklch(0.22 0.04 265)",
          transition: "border-color 0.2s ease",
        }}
      >
        <div
          className="pb-3 mb-1"
          style={{ borderBottom: "1px solid oklch(0.16 0.035 265)" }}
        >
          <span
            className="font-broadcast text-xs tracking-widest"
            style={{ color: "oklch(0.78 0.165 85)" }}
          >
            LEAGUE IDENTITY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="league-short-name"
              className="block text-xs font-broadcast tracking-widest mb-1.5"
              style={{ color: "oklch(0.45 0.02 90)" }}
            >
              LEAGUE SHORT NAME (e.g. SPL)
            </label>
            <input
              id="league-short-name"
              type="text"
              value={config.shortName}
              onChange={(e) => update("shortName", e.target.value)}
              placeholder="SPL"
              className={`w-full px-3 py-2 text-sm font-broadcast tracking-wider ${fieldFocusClass}`}
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              htmlFor="league-full-name"
              className="block text-xs font-broadcast tracking-widest mb-1.5"
              style={{ color: "oklch(0.45 0.02 90)" }}
            >
              FULL LEAGUE NAME
            </label>
            <input
              id="league-full-name"
              type="text"
              value={config.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Siddhivinayak Premier League"
              className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <p
            className="block text-xs font-broadcast tracking-widest mb-3"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            LEAGUE LOGO (displays free-form, no clipping)
          </p>

          <div className="flex gap-4 items-start">
            {/* Preview area — free-form, no circle clip */}
            <div
              className="flex-shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                width: "120px",
                height: "120px",
                background: "oklch(0.085 0.025 265)",
                border: "1px solid oklch(0.22 0.04 265)",
              }}
            >
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="League logo preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Trophy size={28} style={{ color: "oklch(0.35 0.02 90)" }} />
                  <span
                    className="text-xs text-center"
                    style={{ color: "oklch(0.35 0.02 90)" }}
                  >
                    No logo
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {/* URL input */}
              <div>
                <label
                  htmlFor="league-logo-url"
                  className="block text-xs font-broadcast tracking-widest mb-1.5"
                  style={{ color: "oklch(0.38 0.02 90)" }}
                >
                  LOGO URL (or upload below)
                </label>
                <input
                  id="league-logo-url"
                  type="url"
                  value={
                    config.logoUrl.startsWith("data:") ? "" : config.logoUrl
                  }
                  onChange={(e) => update("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
                  style={{ ...fieldStyle, fontFamily: "inherit" }}
                />
              </div>

              {/* Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-broadcast tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isUploading
                    ? "oklch(0.14 0.04 265)"
                    : "oklch(0.12 0.03 265)",
                  border: "1px solid oklch(0.78 0.165 85 / 0.35)",
                  color: "oklch(0.78 0.165 85)",
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    UPLOADING {progress}%
                  </>
                ) : (
                  <>
                    <Upload size={12} />
                    UPLOAD LOGO FROM DEVICE
                  </>
                )}
              </button>

              {/* Progress bar */}
              {isUploading && (
                <div
                  className="h-0.5 overflow-hidden"
                  style={{ background: "oklch(0.22 0.04 265)" }}
                >
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${progress}%`,
                      background:
                        "linear-gradient(90deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                    }}
                  />
                </div>
              )}

              <p className="text-xs" style={{ color: "oklch(0.38 0.02 90)" }}>
                Logo is displayed without any shape clipping (free-form).
                Recommended: transparent background PNG.
              </p>
            </div>
          </div>
        </div>

        {/* Size Controls */}
        <div
          className="pt-4"
          style={{ borderTop: "1px solid oklch(0.16 0.035 265)" }}
        >
          <div className="mb-3">
            <span
              className="font-broadcast text-xs tracking-widest"
              style={{ color: "oklch(0.78 0.165 85)" }}
            >
              SIZE CONTROLS
            </span>
            <p
              className="text-xs mt-1"
              style={{ color: "oklch(0.38 0.02 90)" }}
            >
              Adjust sizes of logo and text displayed on all screens
            </p>
          </div>
          <div className="space-y-4">
            {(
              [
                {
                  key: "logoSize" as const,
                  label: "LOGO SIZE",
                  min: 50,
                  max: 200,
                },
                {
                  key: "shortNameSize" as const,
                  label: "SHORT NAME SIZE",
                  min: 50,
                  max: 200,
                },
                {
                  key: "fullNameSize" as const,
                  label: "FULL NAME SIZE",
                  min: 50,
                  max: 200,
                },
              ] as const
            ).map(({ key, label, min, max }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={`league-size-${key}`}
                    className="text-xs font-broadcast tracking-widest"
                    style={{ color: "oklch(0.45 0.02 90)" }}
                  >
                    {label}
                  </label>
                  <span
                    className="font-digital text-sm"
                    style={{ color: "oklch(0.78 0.165 85)" }}
                  >
                    {config[key]}%
                  </span>
                </div>
                <input
                  id={`league-size-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  step={5}
                  value={config[key]}
                  onChange={(e) => update(key, Number(e.target.value))}
                  className="w-full h-1.5 appearance-none cursor-pointer rounded-full"
                  style={{
                    background: `linear-gradient(to right, oklch(0.78 0.165 85) 0%, oklch(0.78 0.165 85) ${((config[key] - min) / (max - min)) * 100}%, oklch(0.22 0.04 265) ${((config[key] - min) / (max - min)) * 100}%, oklch(0.22 0.04 265) 100%)`,
                    accentColor: "oklch(0.78 0.165 85)",
                  }}
                />
                <div
                  className="flex justify-between text-xs mt-0.5"
                  style={{ color: "oklch(0.3 0.02 90)" }}
                >
                  <span>{min}%</span>
                  <span>{max}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div
          className="pt-3 flex justify-end"
          style={{ borderTop: "1px solid oklch(0.16 0.035 265)" }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-broadcast tracking-wider transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isDirty
                ? "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))"
                : "oklch(0.14 0.04 265)",
              color: isDirty ? "oklch(0.08 0.025 265)" : "oklch(0.45 0.02 90)",
              border: isDirty ? "none" : "1px solid oklch(0.22 0.04 265)",
            }}
          >
            {isSaving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            {isSaving ? "SAVING…" : "SAVE LEAGUE SETTINGS"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live Layout Slider ───────────────────────────────────────────────────────

function LayoutSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor={id}
          className="text-xs font-broadcast tracking-widest"
          style={{ color: "oklch(0.45 0.02 90)" }}
        >
          {label}
        </label>
        <span
          className="font-digital text-sm"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none cursor-pointer rounded-full"
        style={{
          background: `linear-gradient(to right, oklch(0.78 0.165 85) 0%, oklch(0.78 0.165 85) ${pct}%, oklch(0.22 0.04 265) ${pct}%, oklch(0.22 0.04 265) 100%)`,
          accentColor: "oklch(0.78 0.165 85)",
        }}
      />
      <div
        className="flex justify-between text-xs mt-0.5"
        style={{ color: "oklch(0.3 0.02 90)" }}
      >
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ─── Live Layout Tab ──────────────────────────────────────────────────────────

function LiveLayoutTab() {
  const [layout, setLayout] = useState<LiveLayoutConfig>(getLiveLayout);
  const [isSaved, setIsSaved] = useState(false);

  const update = (key: keyof LiveLayoutConfig, val: number) => {
    setLayout((prev) => ({ ...prev, [key]: val }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(LIVE_LAYOUT_KEY, JSON.stringify(layout));
    setIsSaved(true);
    toast.success("Live layout saved — refresh /live to apply", {
      description: "Open the Live screen to see the updated layout.",
    });
  };

  const handleReset = () => {
    setLayout({ ...DEFAULT_LIVE_LAYOUT });
    setIsSaved(false);
    toast.info("Reset to default layout");
  };

  // Preview scale: We'll show at 45% scale
  const SCALE = 0.45;
  // Full preview container size (the unscaled mock)
  const MOCK_W = 1100;
  const MOCK_H = 620;

  const sliderSections = [
    {
      title: "PLAYER SECTION",
      sliders: [
        {
          key: "playerImageWidth" as const,
          label: "IMAGE WIDTH",
          min: 80,
          max: 400,
          step: 8,
          unit: "px",
        },
        {
          key: "playerImageHeight" as const,
          label: "IMAGE HEIGHT",
          min: 100,
          max: 500,
          step: 8,
          unit: "px",
        },
        {
          key: "playerNameSize" as const,
          label: "NAME SIZE",
          min: 50,
          max: 200,
          step: 5,
          unit: "%",
        },
        {
          key: "categoryBadgeSize" as const,
          label: "CATEGORY BADGE SIZE",
          min: 50,
          max: 200,
          step: 5,
          unit: "%",
        },
      ],
    },
    {
      title: "BID COUNTER",
      sliders: [
        {
          key: "bidCounterSize" as const,
          label: "BID COUNTER SIZE",
          min: 50,
          max: 200,
          step: 5,
          unit: "%",
        },
        {
          key: "leadingTeamSize" as const,
          label: "LEADING TEAM TEXT",
          min: 50,
          max: 200,
          step: 5,
          unit: "%",
        },
      ],
    },
    {
      title: "TEAM PANEL",
      sliders: [
        {
          key: "rightPanelWidth" as const,
          label: "PANEL WIDTH",
          min: 200,
          max: 600,
          step: 8,
          unit: "px",
        },
        {
          key: "teamTableFontSize" as const,
          label: "TABLE FONT SIZE",
          min: 50,
          max: 200,
          step: 5,
          unit: "%",
        },
        {
          key: "chartHeight" as const,
          label: "CHART HEIGHT",
          min: 100,
          max: 400,
          step: 10,
          unit: "px",
        },
      ],
    },
    {
      title: "HEADER",
      sliders: [
        {
          key: "headerLogoSize" as const,
          label: "HEADER LOGO SIZE",
          min: 20,
          max: 120,
          step: 4,
          unit: "px",
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div
        className="px-1 flex items-center gap-2 text-xs"
        style={{ color: "oklch(0.45 0.02 90)" }}
      >
        <Monitor size={12} />
        <span>
          Adjust sizes of elements on the live broadcast screen. Changes preview
          instantly.
        </span>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        {/* ── Settings Panel (left) ── */}
        <div
          className="xl:w-[380px] flex-shrink-0 space-y-4"
          style={{
            background: "oklch(0.11 0.03 265)",
            border: "1px solid oklch(0.22 0.04 265)",
          }}
        >
          {/* Sticky action row */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
            style={{
              background: "oklch(0.11 0.03 265)",
              borderBottom: "1px solid oklch(0.16 0.035 265)",
            }}
          >
            <span
              className="font-broadcast text-xs tracking-widest"
              style={{ color: "oklch(0.78 0.165 85)" }}
            >
              LAYOUT CONTROLS
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-broadcast tracking-wider transition-all hover:opacity-80"
                style={{
                  background: "oklch(0.14 0.04 265)",
                  border: "1px solid oklch(0.22 0.04 265)",
                  color: "oklch(0.55 0.02 90)",
                }}
              >
                <RotateCcw size={11} />
                RESET
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-broadcast tracking-wider transition-all hover:opacity-90"
                style={{
                  background: isSaved
                    ? "oklch(0.7 0.15 140 / 0.2)"
                    : "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                  border: isSaved
                    ? "1px solid oklch(0.7 0.15 140 / 0.4)"
                    : "none",
                  color: isSaved
                    ? "oklch(0.7 0.15 140)"
                    : "oklch(0.08 0.025 265)",
                }}
              >
                <Save size={11} />
                {isSaved ? "SAVED" : "SAVE LAYOUT"}
              </button>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-5">
            {sliderSections.map((section) => (
              <div key={section.title}>
                <div
                  className="pb-2 mb-3"
                  style={{ borderBottom: "1px solid oklch(0.16 0.035 265)" }}
                >
                  <span
                    className="font-broadcast text-xs tracking-widest"
                    style={{ color: "oklch(0.78 0.165 85 / 0.7)" }}
                  >
                    {section.title}
                  </span>
                </div>
                <div className="space-y-3">
                  {section.sliders.map((s) => (
                    <LayoutSlider
                      key={s.key}
                      id={`layout-slider-${s.key}`}
                      label={s.label}
                      value={layout[s.key]}
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      unit={s.unit}
                      onChange={(v) => update(s.key, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Preview (right) ── */}
        <div className="flex-1 min-w-0">
          <div
            className="mb-2 flex items-center gap-2 px-1"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            <Monitor size={12} />
            <span className="text-xs font-broadcast tracking-wider">
              LIVE PREVIEW (scaled)
            </span>
          </div>
          <div
            className="overflow-hidden relative"
            style={{
              width: "100%",
              height: `${MOCK_H * SCALE}px`,
              background: "oklch(0.07 0.025 265)",
              border: "1px solid oklch(0.22 0.04 265)",
            }}
          >
            {/* The mock — rendered at full size, then scaled */}
            <div
              style={{
                width: `${MOCK_W}px`,
                height: `${MOCK_H}px`,
                transform: `scale(${SCALE})`,
                transformOrigin: "top left",
                background: "oklch(0.07 0.025 265)",
                position: "absolute",
                top: 0,
                left: 0,
                overflow: "hidden",
              }}
            >
              {/* Mock header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 24px",
                  height: "52px",
                  background: "oklch(0.09 0.03 265 / 0.95)",
                  borderBottom: "1px solid oklch(0.78 0.165 85 / 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Logo placeholder */}
                  <div
                    style={{
                      width: layout.headerLogoSize,
                      height: layout.headerLogoSize,
                      background: "oklch(0.78 0.165 85 / 0.2)",
                      border: "1px solid oklch(0.78 0.165 85 / 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: Math.max(8, layout.headerLogoSize * 0.35),
                      fontFamily: "monospace",
                      color: "oklch(0.78 0.165 85)",
                      flexShrink: 0,
                    }}
                  >
                    SPL
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 18 * (layout.headerLogoSize / 36),
                        color: "oklch(0.78 0.165 85)",
                        fontWeight: 700,
                      }}
                    >
                      SPL
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "oklch(0.45 0.02 90)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      SIDDHIVINAYAK PREMIER LEAGUE
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    padding: "4px 12px",
                    background: "oklch(0.78 0.165 85 / 0.1)",
                    border: "1px solid oklch(0.78 0.165 85 / 0.3)",
                    color: "oklch(0.78 0.165 85)",
                    letterSpacing: "0.1em",
                  }}
                >
                  PLAYER AUCTION 2025
                </div>
              </div>

              {/* Mock main content */}
              <div
                style={{
                  display: "flex",
                  height: `${MOCK_H - 52}px`,
                }}
              >
                {/* Center player section */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    gap: 12,
                  }}
                >
                  {/* Player image placeholder */}
                  <div
                    style={{
                      width: layout.playerImageWidth,
                      height: layout.playerImageHeight,
                      background: "oklch(0.15 0.04 265)",
                      border: "2px solid oklch(0.78 0.165 85 / 0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        color: "oklch(0.35 0.02 90)",
                        fontSize: 13,
                        fontFamily: "monospace",
                      }}
                    >
                      PLAYER PHOTO
                    </div>
                  </div>

                  {/* Player name */}
                  <div
                    style={{
                      fontSize: 32 * (layout.playerNameSize / 100),
                      fontFamily: "monospace",
                      color: "oklch(0.97 0.01 90)",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Virat Kohli
                  </div>

                  {/* Category badge */}
                  <div
                    style={{
                      fontSize: 12 * (layout.categoryBadgeSize / 100),
                      fontFamily: "monospace",
                      padding: "3px 10px",
                      background: "oklch(0.7 0.15 140 / 0.15)",
                      border: "1px solid oklch(0.7 0.15 140 / 0.4)",
                      color: "oklch(0.7 0.15 140)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    BATSMAN
                  </div>

                  {/* Bid counter */}
                  <div
                    style={{
                      background: "oklch(0.065 0.025 265)",
                      border: "1px solid oklch(0.78 0.165 85 / 0.2)",
                      padding: "12px 20px",
                      textAlign: "center",
                      minWidth: 220,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        fontFamily: "monospace",
                        color: "oklch(0.38 0.02 90)",
                        letterSpacing: "0.15em",
                        marginBottom: 4,
                      }}
                    >
                      CURRENT BID
                    </div>
                    <div
                      style={{
                        fontSize: 72 * (layout.bidCounterSize / 100),
                        fontFamily: "monospace",
                        color: "oklch(0.82 0.17 87)",
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      2,500
                    </div>
                    <div
                      style={{
                        fontSize: 14 * (layout.leadingTeamSize / 100),
                        fontFamily: "monospace",
                        color: "oklch(0.85 0.165 85)",
                        letterSpacing: "0.06em",
                        marginTop: 6,
                        fontWeight: 600,
                      }}
                    >
                      ▸ LEADING: MUMBAI WARRIORS
                    </div>
                  </div>
                </div>

                {/* Right panel */}
                <div
                  style={{
                    width: layout.rightPanelWidth,
                    flexShrink: 0,
                    background: "oklch(0.085 0.025 265)",
                    borderLeft: "1px solid oklch(0.78 0.165 85 / 0.18)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Table header */}
                  <div
                    style={{
                      padding: "8px 12px",
                      borderBottom: "1px solid oklch(0.16 0.035 265)",
                      fontSize: 9,
                      fontFamily: "monospace",
                      color: "oklch(0.78 0.165 85)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    TEAM PURSE
                  </div>

                  {/* Mock table rows */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    {[
                      { name: "Mumbai Warriors", purse: "19,200", slots: 5 },
                      { name: "Chennai Kings", purse: "17,500", slots: 4 },
                      { name: "Delhi Capitals", purse: "15,300", slots: 6 },
                      { name: "Bangalore", purse: "13,800", slots: 3 },
                      { name: "Kolkata KR", purse: "12,100", slots: 5 },
                      { name: "Punjab Kings", purse: "18,900", slots: 7 },
                      { name: "Hyderabad", purse: "16,400", slots: 4 },
                      { name: "Jaipur Royals", purse: "14,700", slots: 6 },
                    ].map((row, i) => (
                      <div
                        key={row.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 12px",
                          fontSize: 10 * (layout.teamTableFontSize / 100),
                          fontFamily: "monospace",
                          borderBottom: "1px solid oklch(0.12 0.025 265)",
                          background:
                            i === 0
                              ? "oklch(0.78 0.165 85 / 0.07)"
                              : "transparent",
                          color:
                            i === 0
                              ? "oklch(0.88 0.14 87)"
                              : "oklch(0.65 0.02 90)",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: layout.rightPanelWidth * 0.45,
                          }}
                        >
                          {row.name}
                        </span>
                        <span>{row.purse}</span>
                        <span style={{ color: "oklch(0.65 0.18 25)" }}>
                          {row.slots}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Mock chart */}
                  <div
                    style={{
                      height: layout.chartHeight,
                      padding: "8px 12px",
                      borderTop: "1px solid oklch(0.16 0.035 265)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        color: "oklch(0.78 0.165 85)",
                        letterSpacing: "0.1em",
                        marginBottom: 4,
                      }}
                    >
                      PURSE REMAINING
                    </div>
                    {[85, 70, 65, 60, 55, 80, 72, 66].map((pct, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: static mock data
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flex: 1,
                          minHeight: 0,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background:
                              i === 0
                                ? "oklch(0.78 0.165 85)"
                                : "oklch(0.32 0.07 265)",
                            borderRadius: "0 2px 2px 0",
                            minHeight: 4,
                            maxHeight: 14,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "oklch(0.35 0.02 90)" }}>
            Preview updates in real time. Click{" "}
            <strong style={{ color: "oklch(0.78 0.165 85)" }}>
              SAVE LAYOUT
            </strong>{" "}
            to apply, then refresh the /live page.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Team Row ────────────────────────────────────────────────────────────────

function TeamRow({
  team,
  onSave,
}: {
  team: Team;
  onSave: (
    id: bigint,
    data: {
      name: string;
      ownerName: string;
      iconPlayerName: string;
      newPurse: bigint | null;
    },
  ) => Promise<void>;
}) {
  const originalPurse = Number(team.purse_remaining);
  const teamLogos = getTeamLogos();

  const [state, setState] = useState<TeamEditState>({
    name: team.name,
    ownerName: team.owner_name,
    iconPlayerName: team.icon_player_name,
    purse: String(originalPurse),
    logoUrl: teamLogos[String(team.id)] ?? "",
    isDirty: false,
    isSaving: false,
  });
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadImage,
    isUploading: isLogoUploading,
    progress: logoProgress,
  } = useImageUpload();

  const update = (
    key: keyof Omit<TeamEditState, "isDirty" | "isSaving">,
    val: string,
  ) => {
    setState((prev) => ({ ...prev, [key]: val, isDirty: true }));
  };

  const handleLogoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const url = await uploadImage(file);
      setState((prev) => ({ ...prev, logoUrl: url, isDirty: true }));
      toast.success("Team logo uploaded");
    } catch {
      toast.error("Logo upload failed");
    }
  };

  const handleSave = async () => {
    setState((prev) => ({ ...prev, isSaving: true }));
    const newPurse = Number.parseInt(state.purse, 10);
    const purseChanged = !Number.isNaN(newPurse) && newPurse !== originalPurse;

    // Save logo to localStorage
    if (state.logoUrl !== (teamLogos[String(team.id)] ?? "")) {
      const logos = getTeamLogos();
      logos[String(team.id)] = state.logoUrl;
      saveTeamLogos(logos);
    }

    await onSave(team.id, {
      name: state.name.trim(),
      ownerName: state.ownerName.trim(),
      iconPlayerName: state.iconPlayerName.trim(),
      newPurse: purseChanged ? BigInt(newPurse) : null,
    });
    setState((prev) => ({ ...prev, isSaving: false, isDirty: false }));
  };

  const remainingSlots = 7 - Number(team.players_bought);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
      style={{
        background: "oklch(0.11 0.03 265)",
        border: state.isDirty
          ? "1px solid oklch(0.78 0.165 85 / 0.4)"
          : "1px solid oklch(0.22 0.04 265)",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid oklch(0.16 0.035 265)" }}
      >
        <div className="flex items-center gap-3">
          {/* Team logo preview (circle) */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: "oklch(0.14 0.04 265)",
              border: "1px solid oklch(0.22 0.04 265)",
            }}
          >
            {state.logoUrl ? (
              <img
                src={state.logoUrl}
                alt={`${team.name} logo`}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span
                className="font-digital text-xs"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                {String(Number(team.id)).padStart(2, "0")}
              </span>
            )}
          </div>
          <div>
            <div
              className="font-broadcast text-sm tracking-wide"
              style={{ color: "oklch(0.92 0.02 90)" }}
            >
              {team.name}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.45 0.02 90)" }}
            >
              {Number(team.players_bought)}/7 bought · {remainingSlots} slots
              left
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {team.is_locked && (
            <div
              className="flex items-center gap-1 text-xs px-2 py-0.5"
              style={{
                background: "oklch(0.62 0.22 25 / 0.1)",
                border: "1px solid oklch(0.62 0.22 25 / 0.3)",
                color: "oklch(0.75 0.15 25)",
              }}
            >
              <Lock size={10} />
              LOCKED
            </div>
          )}
          {state.isDirty && (
            <span
              className="text-xs font-broadcast tracking-wider"
              style={{ color: "oklch(0.78 0.165 85 / 0.7)" }}
            >
              UNSAVED
            </span>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label
            htmlFor={`team-name-${String(team.id)}`}
            className="block text-xs font-broadcast tracking-widest mb-1.5"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            TEAM NAME
          </label>
          <input
            id={`team-name-${String(team.id)}`}
            type="text"
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
            style={fieldStyle}
          />
        </div>
        <div>
          <label
            htmlFor={`team-owner-${String(team.id)}`}
            className="block text-xs font-broadcast tracking-widest mb-1.5"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            OWNER NAME
          </label>
          <input
            id={`team-owner-${String(team.id)}`}
            type="text"
            value={state.ownerName}
            onChange={(e) => update("ownerName", e.target.value)}
            className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
            style={fieldStyle}
          />
        </div>
        <div>
          <label
            htmlFor={`team-icon-${String(team.id)}`}
            className="block text-xs font-broadcast tracking-widest mb-1.5"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            ICON PLAYER
          </label>
          <input
            id={`team-icon-${String(team.id)}`}
            type="text"
            value={state.iconPlayerName}
            onChange={(e) => update("iconPlayerName", e.target.value)}
            className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
            style={fieldStyle}
          />
        </div>
        <div>
          <label
            htmlFor={`team-purse-${String(team.id)}`}
            className="block text-xs font-broadcast tracking-widest mb-1.5"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            PURSE REMAINING
          </label>
          <input
            id={`team-purse-${String(team.id)}`}
            type="number"
            value={state.purse}
            onChange={(e) => update("purse", e.target.value)}
            className={`w-full px-3 py-2 font-digital text-sm ${fieldFocusClass}`}
            style={fieldStyle}
            min={0}
          />
        </div>
      </div>

      {/* Team Logo Upload */}
      <div className="px-4 pb-4">
        <p
          className="block text-xs font-broadcast tracking-widest mb-2"
          style={{ color: "oklch(0.45 0.02 90)" }}
        >
          TEAM LOGO (circle crop)
        </p>
        <div className="flex items-center gap-3">
          {/* Circle preview */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
            style={{
              background: "oklch(0.14 0.04 265)",
              border: "1px solid oklch(0.22 0.04 265)",
            }}
          >
            {state.logoUrl ? (
              <img
                src={state.logoUrl}
                alt="Logo preview"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={14} style={{ color: "oklch(0.35 0.02 90)" }} />
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileChange}
          />

          {/* Upload button */}
          <button
            type="button"
            onClick={() => logoFileInputRef.current?.click()}
            disabled={isLogoUploading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-broadcast tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "oklch(0.12 0.03 265)",
              border: "1px solid oklch(0.78 0.165 85 / 0.35)",
              color: "oklch(0.78 0.165 85)",
            }}
          >
            {isLogoUploading ? (
              <>
                <Loader2 size={11} className="animate-spin" />
                {logoProgress}%
              </>
            ) : (
              <>
                <Upload size={11} />
                UPLOAD LOGO
              </>
            )}
          </button>

          {state.logoUrl && (
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, logoUrl: "", isDirty: true }))
              }
              className="text-xs px-2 py-2 transition-opacity hover:opacity-80"
              style={{
                background: "oklch(0.12 0.03 265)",
                border: "1px solid oklch(0.62 0.22 25 / 0.35)",
                color: "oklch(0.62 0.22 25)",
              }}
            >
              <Trash2 size={11} />
            </button>
          )}

          {isLogoUploading && (
            <div
              className="flex-1 h-0.5 overflow-hidden"
              style={{ background: "oklch(0.22 0.04 265)" }}
            >
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${logoProgress}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer action */}
      <div
        className="px-4 py-3 flex justify-end"
        style={{ borderTop: "1px solid oklch(0.16 0.035 265)" }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={state.isSaving || !state.isDirty}
          className="flex items-center gap-2 px-4 py-2 text-xs font-broadcast tracking-wider transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: state.isDirty
              ? "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))"
              : "oklch(0.14 0.04 265)",
            color: state.isDirty
              ? "oklch(0.08 0.025 265)"
              : "oklch(0.45 0.02 90)",
            border: state.isDirty ? "none" : "1px solid oklch(0.22 0.04 265)",
          }}
        >
          {state.isSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}
          {state.isSaving ? "SAVING…" : "SAVE TEAM"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Player Row ───────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  onSave,
  onDelete,
}: {
  player: Player;
  onSave: (
    id: bigint,
    data: {
      name: string;
      category: string;
      basePrice: bigint;
      imageUrl: string;
      rating: bigint;
    },
  ) => Promise<void>;
  onDelete: (id: bigint, status: string) => Promise<void>;
}) {
  const [state, setState] = useState<PlayerEditState>({
    name: player.name,
    category: player.category,
    basePrice: String(Number(player.base_price)),
    imageUrl: player.image_url,
    rating: String(Number(player.rating)),
    isDirty: false,
    isSaving: false,
    isExpanded: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, progress } = useImageUpload();

  const update = (
    key: keyof Omit<PlayerEditState, "isDirty" | "isSaving" | "isExpanded">,
    val: string,
  ) => {
    setState((prev) => ({ ...prev, [key]: val, isDirty: true }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const url = await uploadImage(file);
      setState((prev) => ({ ...prev, imageUrl: url, isDirty: true }));
      toast.success("Photo uploaded successfully");
    } catch {
      toast.error("Upload failed. Please try again or paste a URL.");
    }
  };

  const handleSave = async () => {
    const basePrice = Number.parseInt(state.basePrice, 10);
    const rating = Number.parseInt(state.rating, 10);
    if (Number.isNaN(basePrice) || Number.isNaN(rating)) {
      toast.error("Invalid base price or rating");
      return;
    }
    setState((prev) => ({ ...prev, isSaving: true }));
    await onSave(player.id, {
      name: state.name.trim(),
      category: state.category,
      basePrice: BigInt(basePrice),
      imageUrl: state.imageUrl.trim(),
      rating: BigInt(Math.min(5, Math.max(1, rating))),
    });
    setState((prev) => ({ ...prev, isSaving: false, isDirty: false }));
  };

  const handleDelete = async () => {
    await onDelete(player.id, player.status);
  };

  const isSold = player.status === "sold";
  const isLive = player.status === "live";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      style={{
        background: "oklch(0.11 0.03 265)",
        border: state.isDirty
          ? "1px solid oklch(0.78 0.165 85 / 0.4)"
          : "1px solid oklch(0.22 0.04 265)",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Collapsed row */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer select-none text-left"
        onClick={() =>
          setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }))
        }
      >
        {/* Photo thumbnail */}
        <div
          className="w-9 h-9 flex-shrink-0 overflow-hidden"
          style={{
            border: "1px solid oklch(0.22 0.04 265)",
          }}
        >
          {state.imageUrl ? (
            <img
              src={state.imageUrl}
              alt={state.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "oklch(0.14 0.04 265)" }}
            >
              <ImageIcon size={14} style={{ color: "oklch(0.35 0.02 90)" }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-broadcast text-sm tracking-wide truncate"
              style={{
                color: isSold ? "oklch(0.45 0.02 90)" : "oklch(0.92 0.02 90)",
                textDecoration: isSold ? "line-through" : "none",
              }}
            >
              {player.name}
            </span>
            <CategoryBadge category={player.category} />
            {isLive && (
              <span
                className="text-xs font-broadcast px-1.5 py-0.5 tracking-wider"
                style={{
                  background: "oklch(0.65 0.18 25 / 0.2)",
                  border: "1px solid oklch(0.65 0.18 25 / 0.4)",
                  color: "oklch(0.75 0.15 25)",
                }}
              >
                LIVE
              </span>
            )}
            {isSold && (
              <span
                className="text-xs font-broadcast px-1.5 py-0.5 tracking-wider"
                style={{
                  background: "oklch(0.7 0.15 140 / 0.15)",
                  border: "1px solid oklch(0.7 0.15 140 / 0.3)",
                  color: "oklch(0.7 0.15 140)",
                }}
              >
                SOLD
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="font-digital text-xs"
              style={{ color: "oklch(0.55 0.02 90)" }}
            >
              {Number(player.base_price).toLocaleString()} pts
            </span>
            <StarRating value={Number(player.rating)} />
            {state.isDirty && (
              <span
                className="text-xs font-broadcast tracking-wider"
                style={{ color: "oklch(0.78 0.165 85 / 0.7)" }}
              >
                UNSAVED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {state.isExpanded ? (
            <ChevronUp size={14} style={{ color: "oklch(0.45 0.02 90)" }} />
          ) : (
            <ChevronDown size={14} style={{ color: "oklch(0.45 0.02 90)" }} />
          )}
        </div>
      </button>

      {/* Expanded editor */}
      <AnimatePresence>
        {state.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: "hidden",
              borderTop: "1px solid oklch(0.16 0.035 265)",
            }}
          >
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`p-name-${String(player.id)}`}
                    className="block text-xs font-broadcast tracking-widest mb-1.5"
                    style={{ color: "oklch(0.45 0.02 90)" }}
                  >
                    PLAYER NAME
                  </label>
                  <input
                    id={`p-name-${String(player.id)}`}
                    type="text"
                    value={state.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`p-cat-${String(player.id)}`}
                    className="block text-xs font-broadcast tracking-widest mb-1.5"
                    style={{ color: "oklch(0.45 0.02 90)" }}
                  >
                    CATEGORY
                  </label>
                  <select
                    id={`p-cat-${String(player.id)}`}
                    value={state.category}
                    onChange={(e) => update("category", e.target.value)}
                    className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
                    style={fieldStyle}
                  >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="Allrounder">Allrounder</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`p-bp-${String(player.id)}`}
                    className="block text-xs font-broadcast tracking-widest mb-1.5"
                    style={{ color: "oklch(0.45 0.02 90)" }}
                  >
                    BASE PRICE (pts)
                  </label>
                  <input
                    id={`p-bp-${String(player.id)}`}
                    type="number"
                    value={state.basePrice}
                    onChange={(e) => update("basePrice", e.target.value)}
                    className={`w-full px-3 py-2 font-digital text-sm ${fieldFocusClass}`}
                    style={fieldStyle}
                    min={100}
                    step={100}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`p-rating-${String(player.id)}`}
                    className="block text-xs font-broadcast tracking-widest mb-1.5"
                    style={{ color: "oklch(0.45 0.02 90)" }}
                  >
                    RATING (1–5)
                  </label>
                  <input
                    id={`p-rating-${String(player.id)}`}
                    type="number"
                    value={state.rating}
                    onChange={(e) => update("rating", e.target.value)}
                    className={`w-full px-3 py-2 font-digital text-sm ${fieldFocusClass}`}
                    style={fieldStyle}
                    min={1}
                    max={5}
                  />
                </div>
              </div>
              {/* Image URL full width with preview + upload */}
              <div>
                <label
                  htmlFor={`p-img-${String(player.id)}`}
                  className="block text-xs font-broadcast tracking-widest mb-1.5"
                  style={{ color: "oklch(0.45 0.02 90)" }}
                >
                  PHOTO URL
                </label>
                <div className="flex gap-2 items-center">
                  {state.imageUrl && (
                    <div
                      className="w-10 h-10 flex-shrink-0 overflow-hidden"
                      style={{ border: "1px solid oklch(0.22 0.04 265)" }}
                    >
                      <img
                        src={state.imageUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <input
                    id={`p-img-${String(player.id)}`}
                    type="url"
                    value={state.imageUrl}
                    onChange={(e) => update("imageUrl", e.target.value)}
                    placeholder="https://example.com/player.jpg"
                    className={`flex-1 px-3 py-2 text-sm ${fieldFocusClass}`}
                    style={{ ...fieldStyle, fontFamily: "inherit" }}
                  />
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Upload photo from device"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-broadcast tracking-wider transition-all flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "oklch(0.12 0.03 265)",
                      border: "1px solid oklch(0.78 0.165 85 / 0.35)",
                      color: "oklch(0.78 0.165 85)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isUploading) {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "oklch(0.78 0.165 85 / 0.12)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "oklch(0.12 0.03 265)";
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={11} className="animate-spin" />
                        <span>{progress}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={11} />
                        UPLOAD
                      </>
                    )}
                  </button>
                </div>
                {isUploading && (
                  <div
                    className="mt-1.5 h-0.5 overflow-hidden"
                    style={{ background: "oklch(0.22 0.04 265)" }}
                  >
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${progress}%`,
                        background:
                          "linear-gradient(90deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: "1px solid oklch(0.16 0.035 265)" }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-broadcast tracking-wider transition-all hover:opacity-80"
                  style={{
                    background: "oklch(0.12 0.03 265)",
                    border: "1px solid oklch(0.62 0.22 25 / 0.35)",
                    color: "oklch(0.62 0.22 25)",
                  }}
                >
                  <Trash2 size={11} />
                  DELETE
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={state.isSaving || !state.isDirty}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-broadcast tracking-wider transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: state.isDirty
                      ? "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))"
                      : "oklch(0.14 0.04 265)",
                    color: state.isDirty
                      ? "oklch(0.08 0.025 265)"
                      : "oklch(0.45 0.02 90)",
                    border: state.isDirty
                      ? "none"
                      : "1px solid oklch(0.22 0.04 265)",
                  }}
                >
                  {state.isSaving ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Save size={11} />
                  )}
                  {state.isSaving ? "SAVING…" : "SAVE PLAYER"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Add Player Modal ─────────────────────────────────────────────────────────

function AddPlayerModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: {
    name: string;
    category: string;
    basePrice: bigint;
    imageUrl: string;
    rating: bigint;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "Batsman",
    basePrice: "500",
    imageUrl: "",
    rating: "3",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadImage,
    isUploading: isModalUploading,
    progress: modalProgress,
  } = useImageUpload();

  const handleModalFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Photo uploaded successfully");
    } catch {
      toast.error("Upload failed. Please try again or paste a URL.");
    }
  };

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    const bp = Number.parseInt(form.basePrice, 10);
    if (Number.isNaN(bp) || bp < 100) e.basePrice = "Minimum base price is 100";
    const r = Number.parseInt(form.rating, 10);
    if (Number.isNaN(r) || r < 1 || r > 5) e.rating = "Rating must be 1–5";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsAdding(true);
    await onAdd({
      name: form.name.trim(),
      category: form.category,
      basePrice: BigInt(Number.parseInt(form.basePrice, 10)),
      imageUrl: form.imageUrl.trim(),
      rating: BigInt(Number.parseInt(form.rating, 10)),
    });
    setIsAdding(false);
  };

  const upd = (k: string, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 w-full"
      style={{ background: "oklch(0 0 0 / 0.75)" }}
      onClick={onClose}
      aria-label="Close modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg"
        style={{
          background: "oklch(0.11 0.03 265)",
          border: "1px solid oklch(0.78 0.165 85 / 0.3)",
          boxShadow: "0 0 60px oklch(0.78 0.165 85 / 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid oklch(0.16 0.035 265)" }}
        >
          <div className="flex items-center gap-2">
            <Plus size={14} style={{ color: "oklch(0.78 0.165 85)" }} />
            <span
              className="font-broadcast text-sm tracking-wider"
              style={{ color: "oklch(0.78 0.165 85)" }}
            >
              ADD NEW PLAYER
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label
                htmlFor="add-player-name"
                className="block text-xs font-broadcast tracking-widest mb-1.5"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                PLAYER NAME *
              </label>
              <input
                id="add-player-name"
                ref={nameRef}
                type="text"
                value={form.name}
                onChange={(e) => upd("name", e.target.value)}
                placeholder="e.g. Virat Kohli"
                className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
                style={fieldStyle}
              />
              {errors.name && (
                <p
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: "oklch(0.75 0.15 25)" }}
                >
                  <AlertCircle size={10} />
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="add-player-category"
                className="block text-xs font-broadcast tracking-widest mb-1.5"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                CATEGORY
              </label>
              <select
                id="add-player-category"
                value={form.category}
                onChange={(e) => upd("category", e.target.value)}
                className={`w-full px-3 py-2 text-sm ${fieldFocusClass}`}
                style={fieldStyle}
              >
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="Allrounder">Allrounder</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="add-player-base-price"
                className="block text-xs font-broadcast tracking-widest mb-1.5"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                BASE PRICE *
              </label>
              <input
                id="add-player-base-price"
                type="number"
                value={form.basePrice}
                onChange={(e) => upd("basePrice", e.target.value)}
                className={`w-full px-3 py-2 font-digital text-sm ${fieldFocusClass}`}
                style={fieldStyle}
                min={100}
                step={100}
              />
              {errors.basePrice && (
                <p
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: "oklch(0.75 0.15 25)" }}
                >
                  <AlertCircle size={10} />
                  {errors.basePrice}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="add-player-rating"
                className="block text-xs font-broadcast tracking-widest mb-1.5"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                RATING (1–5) *
              </label>
              <input
                id="add-player-rating"
                type="number"
                value={form.rating}
                onChange={(e) => upd("rating", e.target.value)}
                className={`w-full px-3 py-2 font-digital text-sm ${fieldFocusClass}`}
                style={fieldStyle}
                min={1}
                max={5}
              />
              {errors.rating && (
                <p
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: "oklch(0.75 0.15 25)" }}
                >
                  <AlertCircle size={10} />
                  {errors.rating}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label
                htmlFor="add-player-image-url"
                className="block text-xs font-broadcast tracking-widest mb-1.5"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                PHOTO URL
              </label>
              <div className="flex gap-2 items-center">
                {form.imageUrl && (
                  <div
                    className="w-10 h-10 flex-shrink-0 overflow-hidden"
                    style={{ border: "1px solid oklch(0.22 0.04 265)" }}
                  >
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <input
                  id="add-player-image-url"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => upd("imageUrl", e.target.value)}
                  placeholder="https://example.com/player.jpg"
                  className={`flex-1 px-3 py-2 text-sm ${fieldFocusClass}`}
                  style={{ ...fieldStyle, fontFamily: "inherit" }}
                />
                {/* Hidden file input */}
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModalFileChange}
                />
                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  disabled={isModalUploading}
                  title="Upload photo from device"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-broadcast tracking-wider transition-all flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "oklch(0.12 0.03 265)",
                    border: "1px solid oklch(0.78 0.165 85 / 0.35)",
                    color: "oklch(0.78 0.165 85)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isModalUploading) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "oklch(0.78 0.165 85 / 0.12)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "oklch(0.12 0.03 265)";
                  }}
                >
                  {isModalUploading ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      <span>{modalProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Upload size={11} />
                      UPLOAD
                    </>
                  )}
                </button>
              </div>
              {isModalUploading && (
                <div
                  className="mt-1.5 h-0.5 overflow-hidden"
                  style={{ background: "oklch(0.22 0.04 265)" }}
                >
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${modalProgress}%`,
                      background:
                        "linear-gradient(90deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-broadcast tracking-wider transition-opacity hover:opacity-80"
              style={{
                background: "oklch(0.14 0.04 265)",
                border: "1px solid oklch(0.22 0.04 265)",
                color: "oklch(0.55 0.02 90)",
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-broadcast tracking-wider transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                color: "oklch(0.08 0.025 265)",
              }}
            >
              {isAdding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {isAdding ? "ADDING…" : "ADD PLAYER"}
            </button>
          </div>
        </form>
      </motion.div>
    </button>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────

function TeamsTab({
  teams,
  onRefresh,
}: {
  teams: Team[];
  onRefresh: () => Promise<void>;
}) {
  const { actor } = useActor();

  const handleSaveTeam = async (
    id: bigint,
    data: {
      name: string;
      ownerName: string;
      iconPlayerName: string;
      newPurse: bigint | null;
    },
  ) => {
    if (!actor) return;
    try {
      const [teamResult, purseResult] = await Promise.all([
        actor.updateTeam(id, data.name, data.ownerName, data.iconPlayerName),
        data.newPurse !== null
          ? actor.editTeamPurse(id, data.newPurse)
          : Promise.resolve({ __kind__: "ok" as const, ok: null }),
      ]);

      if (teamResult.__kind__ === "err") {
        toast.error(`Team update failed: ${teamResult.err}`);
        return;
      }
      if (purseResult.__kind__ === "err") {
        toast.error(`Purse update failed: ${purseResult.err}`);
        return;
      }

      toast.success("Team saved successfully");
      await onRefresh();
    } catch {
      toast.error("Failed to save team");
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="px-1 flex items-center gap-2 text-xs"
        style={{ color: "oklch(0.45 0.02 90)" }}
      >
        <Users size={12} />
        <span>
          {teams.length} teams · Edit fields then SAVE TEAM · Logos stored
          locally in browser
        </span>
      </div>
      {teams.map((team) => (
        <TeamRow key={String(team.id)} team={team} onSave={handleSaveTeam} />
      ))}
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────────────────────────────────

function PlayersTab({
  players,
  onRefresh,
}: {
  players: Player[];
  onRefresh: () => Promise<void>;
}) {
  const { actor } = useActor();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const sortedPlayers = [...players].sort(
    (a, b) => Number(a.id) - Number(b.id),
  );
  const filtered =
    filterCategory === "All"
      ? sortedPlayers
      : sortedPlayers.filter((p) => p.category === filterCategory);

  const handleSavePlayer = async (
    id: bigint,
    data: {
      name: string;
      category: string;
      basePrice: bigint;
      imageUrl: string;
      rating: bigint;
    },
  ) => {
    if (!actor) return;
    try {
      const result = await actor.updatePlayer(
        id,
        data.name,
        data.category,
        data.basePrice,
        data.imageUrl,
        data.rating,
      );
      if (result.__kind__ === "err") {
        toast.error(`Update failed: ${result.err}`);
        return;
      }
      toast.success("Player updated");
      await onRefresh();
    } catch {
      toast.error("Failed to update player");
    }
  };

  const handleDeletePlayer = async (id: bigint, status: string) => {
    if (status !== "upcoming") {
      const confirmed = confirm(
        `⚠️ This player has status "${status}". Deleting them may affect auction state. Proceed?`,
      );
      if (!confirmed) return;
    }
    if (!actor) return;
    try {
      const result = await actor.deletePlayer(id);
      if (result.__kind__ === "err") {
        toast.error(`Delete failed: ${result.err}`);
        return;
      }
      toast.success("Player deleted");
      await onRefresh();
    } catch {
      toast.error("Failed to delete player");
    }
  };

  const handleAddPlayer = async (data: {
    name: string;
    category: string;
    basePrice: bigint;
    imageUrl: string;
    rating: bigint;
  }) => {
    if (!actor) return;
    try {
      const result = await actor.addPlayer(
        data.name,
        data.category,
        data.basePrice,
        data.imageUrl,
        data.rating,
      );
      if (result.__kind__ === "err") {
        toast.error(`Add failed: ${result.err}`);
        return;
      }
      toast.success(`${data.name} added to player pool`);
      setShowAddModal(false);
      await onRefresh();
    } catch {
      toast.error("Failed to add player");
    }
  };

  const counts = {
    All: players.length,
    Batsman: players.filter((p) => p.category === "Batsman").length,
    Bowler: players.filter((p) => p.category === "Bowler").length,
    Allrounder: players.filter((p) => p.category === "Allrounder").length,
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filter + stats bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Batsman", "Bowler", "Allrounder"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className="px-3 py-1.5 text-xs font-broadcast tracking-wider transition-all"
              style={{
                background:
                  filterCategory === cat
                    ? cat === "All"
                      ? "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))"
                      : `${CATEGORY_COLORS[cat] ?? "oklch(0.78 0.165 85)"}22`
                    : "oklch(0.14 0.04 265)",
                border:
                  filterCategory === cat
                    ? cat === "All"
                      ? "none"
                      : `1px solid ${CATEGORY_COLORS[cat] ?? "oklch(0.78 0.165 85)"}66`
                    : "1px solid oklch(0.22 0.04 265)",
                color:
                  filterCategory === cat
                    ? cat === "All"
                      ? "oklch(0.08 0.025 265)"
                      : (CATEGORY_COLORS[cat] ?? "oklch(0.78 0.165 85)")
                    : "oklch(0.55 0.02 90)",
              }}
            >
              {cat} ({counts[cat as keyof typeof counts]})
            </button>
          ))}
          <span
            className="ml-auto text-xs"
            style={{ color: "oklch(0.35 0.02 90)" }}
          >
            Click any player row to expand & edit
          </span>
        </div>

        {/* Player list */}
        <AnimatePresence mode="popLayout">
          {filtered.map((player) => (
            <PlayerRow
              key={String(player.id)}
              player={player}
              onSave={handleSavePlayer}
              onDelete={handleDeletePlayer}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div
            className="py-12 text-center"
            style={{ color: "oklch(0.35 0.02 90)" }}
          >
            <div className="text-4xl mb-3">🏏</div>
            <div className="font-broadcast text-xs tracking-widest">
              NO PLAYERS FOUND
            </div>
          </div>
        )}
      </div>

      {/* Floating Add button */}
      <div className="fixed bottom-8 right-8 z-30">
        <motion.button
          type="button"
          onClick={() => setShowAddModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-3 font-broadcast text-sm tracking-wider"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
            color: "oklch(0.08 0.025 265)",
            boxShadow:
              "0 0 30px oklch(0.78 0.165 85 / 0.4), 0 4px 20px oklch(0 0 0 / 0.5)",
          }}
        >
          <Plus size={16} />
          ADD PLAYER
        </motion.button>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddPlayerModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddPlayer}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "league" | "teams" | "players" | "live-layout"
  >("league");

  // Auth guard
  const isAuthed = sessionStorage.getItem("spl_admin_auth") === "true";

  useEffect(() => {
    if (!isAuthed) {
      navigate({ to: "/admin" });
    }
  }, [isAuthed, navigate]);

  const fetchData = useCallback(async () => {
    if (!actor) return;
    try {
      const [teamsData, playersData] = await Promise.all([
        actor.getTeams(),
        actor.getPlayers(),
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchData();
  }, [actor, isFetching, fetchData]);

  if (!isAuthed) return null;

  const tabs = [
    {
      id: "league" as const,
      label: "LEAGUE",
      count: null,
      icon: <Trophy size={13} />,
    },
    {
      id: "teams" as const,
      label: "TEAMS",
      count: teams.length,
      icon: <Users size={13} />,
    },
    {
      id: "players" as const,
      label: "PLAYERS",
      count: players.length,
      icon: <Edit3 size={13} />,
    },
    {
      id: "live-layout" as const,
      label: "LIVE LAYOUT",
      count: null,
      icon: <Monitor size={13} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
        style={{
          background: "oklch(0.09 0.03 265 / 0.97)",
          borderBottom: "1px solid oklch(0.78 0.165 85 / 0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/admin" })}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.55 0.02 90)" }}
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline font-broadcast text-xs tracking-wider">
              BACK
            </span>
          </button>
          <div
            className="h-4 w-px"
            style={{ background: "oklch(0.22 0.04 265)" }}
          />
          <div className="flex items-center gap-2">
            <Settings size={15} style={{ color: "oklch(0.78 0.165 85)" }} />
            <span
              className="font-broadcast text-base tracking-wider"
              style={{ color: "oklch(0.78 0.165 85)" }}
            >
              SPL
            </span>
            <span className="text-xs" style={{ color: "oklch(0.45 0.02 90)" }}>
              — Settings
            </span>
          </div>
        </div>

        {/* Tab switcher in header (desktop) */}
        <div className="hidden sm:flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-broadcast tracking-wider transition-all"
              style={{
                background:
                  activeTab === tab.id
                    ? "oklch(0.78 0.165 85 / 0.15)"
                    : "transparent",
                border:
                  activeTab === tab.id
                    ? "1px solid oklch(0.78 0.165 85 / 0.35)"
                    : "1px solid transparent",
                color:
                  activeTab === tab.id
                    ? "oklch(0.78 0.165 85)"
                    : "oklch(0.45 0.02 90)",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== null && (
                <span
                  className="font-digital"
                  style={{
                    color:
                      activeTab === tab.id
                        ? "oklch(0.78 0.165 85 / 0.7)"
                        : "oklch(0.35 0.02 90)",
                  }}
                >
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Mobile tab bar */}
      <div
        className="sm:hidden flex"
        style={{ borderBottom: "1px solid oklch(0.22 0.04 265)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-broadcast tracking-wider transition-all"
            style={{
              background:
                activeTab === tab.id
                  ? "oklch(0.78 0.165 85 / 0.08)"
                  : "transparent",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid oklch(0.78 0.165 85)"
                  : "2px solid transparent",
              color:
                activeTab === tab.id
                  ? "oklch(0.78 0.165 85)"
                  : "oklch(0.45 0.02 90)",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== null && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "league" ? (
          <motion.div
            key="league"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
          >
            <LeagueTab />
          </motion.div>
        ) : activeTab === "live-layout" ? (
          <motion.div
            key="live-layout"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <LiveLayoutTab />
          </motion.div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 shimmer"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "teams" ? (
              <motion.div
                key="teams"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
              >
                <TeamsTab teams={teams} onRefresh={fetchData} />
              </motion.div>
            ) : (
              <motion.div
                key="players"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <PlayersTab players={players} onRefresh={fetchData} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
