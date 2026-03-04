import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useImageUpload } from "../hooks/useImageUpload";
import type { IDBCategory, IDBPlayer, IDBTeam } from "../idbStore";
import { IDB_CHANGE_EVENT, idbStore } from "../idbStore";
import {
  type AllSettings,
  saveSettingsToBackend,
} from "../utils/settingsStore";
import {
  DEFAULT_LIVE_COLORS,
  DEFAULT_LIVE_LAYOUT,
  LIVE_LAYOUT_KEY,
  type LeagueSettings,
  type LiveColorTheme,
  type LiveLayoutConfig,
  getLeagueSettings,
  getLiveColors,
  getLiveLayout,
  saveLeagueSettings,
  saveLiveColors,
} from "./LandingPage";

// ─── Auth guard ────────────────────────────────────────────────────────────────
const AUTH_KEY = "spl_admin_auth";

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "1";
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = "league" | "teams" | "players" | "layout" | "colours";

// ─── Upload button ────────────────────────────────────────────────────────────
function UploadBtn({
  onUrl,
  label = "UPLOAD",
  circle = false,
}: {
  onUrl: (url: string) => void;
  label?: string;
  circle?: boolean;
}) {
  const { upload, progress, isUploading } = useImageUpload();
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) onUrl(url);
    e.target.value = "";
  };

  return (
    <label
      className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-broadcast tracking-wider transition-all hover:opacity-80 active:scale-95"
      style={{
        background: "oklch(0.78 0.165 85 / 0.12)",
        border: "1px solid oklch(0.78 0.165 85 / 0.4)",
        color: "oklch(0.78 0.165 85)",
        borderRadius: circle ? "9999px" : 0,
      }}
    >
      {isUploading ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          {progress}%
        </>
      ) : (
        <>
          <Upload size={12} />
          {label}
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </label>
  );
}

// ─── Photo preview ────────────────────────────────────────────────────────────
function PhotoPreview({
  url,
  size = 48,
  circle = false,
  fallback,
}: {
  url: string;
  size?: number;
  circle?: boolean;
  fallback?: string;
}) {
  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: circle ? "50%" : 0,
          background: "oklch(0.14 0.04 255)",
          border: "1px solid oklch(0.22 0.04 255)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.35,
          color: "oklch(0.35 0.02 90)",
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        {fallback ?? "?"}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: circle ? "50%" : 0,
        border: "1px solid oklch(0.78 0.165 85 / 0.3)",
        flexShrink: 0,
      }}
    />
  );
}

// ─── League Tab ───────────────────────────────────────────────────────────────
function LeagueTab() {
  const { actor } = useActor();
  const [settings, setSettings] = useState<LeagueSettings>(getLeagueSettings());
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const save = async () => {
    saveLeagueSettings(settings);
    // Also save to IDB for offline access
    await idbStore.setSetting("spl_league_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("League settings saved");
    // Background sync to backend (fire-and-forget, completely silent)
    if (actor) {
      setSyncing(true);
      // Get all settings to sync
      const [teamLogosRaw, ownerPhotosRaw, iconPhotosRaw] = await Promise.all([
        idbStore.getSetting("spl_team_logos"),
        idbStore.getSetting("spl_owner_photos"),
        idbStore.getSetting("spl_icon_photos"),
      ]);
      const allSettings: AllSettings = {
        league: settings,
        teamLogos: teamLogosRaw
          ? (JSON.parse(teamLogosRaw) as Record<string, string>)
          : {},
        ownerPhotos: ownerPhotosRaw
          ? (JSON.parse(ownerPhotosRaw) as Record<string, string>)
          : {},
        iconPhotos: iconPhotosRaw
          ? (JSON.parse(iconPhotosRaw) as Record<string, string>)
          : {},
        liveColors: getLiveColors(),
        liveLayout: getLiveLayout(),
      };
      saveSettingsToBackend(actor, allSettings).finally(() => {
        setSyncing(false);
      });
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h2
        className="font-broadcast text-lg tracking-widest"
        style={{ color: "oklch(0.78 0.165 85)" }}
      >
        LEAGUE SETTINGS
      </h2>

      {/* Logo */}
      <div className="space-y-2">
        <span
          className="font-broadcast text-xs tracking-widest"
          style={{ color: "oklch(0.55 0.02 90)" }}
        >
          LEAGUE LOGO
        </span>
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="logo"
              style={{ height: 80, maxWidth: 160, objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                background: "oklch(0.14 0.04 255)",
                border: "1px solid oklch(0.22 0.04 255)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "oklch(0.3 0.02 90)",
                fontSize: 11,
              }}
              className="font-broadcast tracking-widest"
            >
              NO LOGO
            </div>
          )}
          <div className="flex flex-col gap-2">
            <UploadBtn
              onUrl={(url) => setSettings((s) => ({ ...s, logoUrl: url }))}
            />
            {settings.logoUrl && (
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, logoUrl: "" }))}
                className="text-xs font-broadcast tracking-wider px-2 py-1 transition-opacity hover:opacity-70"
                style={{ color: "oklch(0.65 0.18 25)" }}
              >
                REMOVE
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logo size */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span
            className="font-broadcast text-xs tracking-widest"
            style={{ color: "oklch(0.55 0.02 90)" }}
          >
            LOGO SIZE
          </span>
          <span
            className="font-digital text-xs"
            style={{ color: "oklch(0.78 0.165 85)" }}
          >
            {settings.logoSize}%
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={200}
          value={settings.logoSize}
          onChange={(e) =>
            setSettings((s) => ({ ...s, logoSize: +e.target.value }))
          }
          className="w-full accent-amber-400"
        />
      </div>

      {/* Short name */}
      <div className="space-y-1">
        <span
          className="font-broadcast text-xs tracking-widest"
          style={{ color: "oklch(0.55 0.02 90)" }}
        >
          SHORT NAME (e.g. SPL)
        </span>
        <input
          value={settings.shortName}
          onChange={(e) =>
            setSettings((s) => ({ ...s, shortName: e.target.value }))
          }
          className="w-full px-3 py-2 font-broadcast tracking-wider text-sm"
          style={{
            background: "oklch(0.11 0.03 255)",
            border: "1px solid oklch(0.22 0.05 255)",
            color: "oklch(0.88 0.02 90)",
            outline: "none",
          }}
          placeholder="SPL"
        />
      </div>

      {/* Full name */}
      <div className="space-y-1">
        <span
          className="font-broadcast text-xs tracking-widest"
          style={{ color: "oklch(0.55 0.02 90)" }}
        >
          FULL NAME
        </span>
        <input
          value={settings.fullName}
          onChange={(e) =>
            setSettings((s) => ({ ...s, fullName: e.target.value }))
          }
          className="w-full px-3 py-2 font-broadcast tracking-wider text-sm"
          style={{
            background: "oklch(0.11 0.03 255)",
            border: "1px solid oklch(0.22 0.05 255)",
            color: "oklch(0.88 0.02 90)",
            outline: "none",
          }}
          placeholder="Siddhivinayak Premier League 2026"
        />
      </div>

      {/* Auction year / event label */}
      <div className="space-y-1">
        <span
          className="font-broadcast text-xs tracking-widest"
          style={{ color: "oklch(0.55 0.02 90)" }}
        >
          AUCTION YEAR / EVENT LABEL
        </span>
        <input
          value={settings.auctionYear ?? "PLAYER AUCTION 2026"}
          onChange={(e) =>
            setSettings((s) => ({ ...s, auctionYear: e.target.value }))
          }
          className="w-full px-3 py-2 font-broadcast tracking-wider text-sm"
          style={{
            background: "oklch(0.11 0.03 255)",
            border: "1px solid oklch(0.22 0.05 255)",
            color: "oklch(0.88 0.02 90)",
            outline: "none",
          }}
          placeholder="PLAYER AUCTION 2026"
        />
        <p
          className="font-broadcast text-xs"
          style={{ color: "oklch(0.42 0.02 90)" }}
        >
          Shown in the live screen header after the league name
        </p>
      </div>

      {/* Name size */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span
            className="font-broadcast text-xs tracking-widest"
            style={{ color: "oklch(0.55 0.02 90)" }}
          >
            NAME SIZE
          </span>
          <span
            className="font-digital text-xs"
            style={{ color: "oklch(0.78 0.165 85)" }}
          >
            {settings.nameSize}%
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={200}
          value={settings.nameSize}
          onChange={(e) =>
            setSettings((s) => ({ ...s, nameSize: +e.target.value }))
          }
          className="w-full accent-amber-400"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-2 px-6 py-2 font-broadcast tracking-widest text-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            background: saved
              ? "oklch(0.55 0.15 140)"
              : "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
            color: "oklch(0.08 0.02 265)",
            boxShadow: "0 0 20px oklch(0.78 0.165 85 / 0.25)",
          }}
        >
          <Save size={14} />
          {saved ? "SAVED!" : "SAVE LEAGUE"}
        </button>
        {syncing && (
          <span
            className="flex items-center gap-1.5 text-xs font-broadcast tracking-wider"
            style={{ color: "oklch(0.55 0.02 90)" }}
          >
            <Loader2 size={11} className="animate-spin" />
            Syncing…
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────
function TeamsTab() {
  const { actor } = useActor();
  const [teams, setTeams] = useState<IDBTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [ownerPhotos, setOwnerPhotos] = useState<Record<string, string>>({});
  const [iconPhotos, setIconPhotos] = useState<Record<string, string>>({});
  const [localEdits, setLocalEdits] = useState<
    Record<
      string,
      {
        name: string;
        ownerName: string;
        teamIconPlayer: string;
        purse: string;
        saving: boolean;
      }
    >
  >({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, logosRaw, ownerRaw, iconRaw] = await Promise.all([
        idbStore.getTeams(),
        idbStore.getSetting("spl_team_logos"),
        idbStore.getSetting("spl_owner_photos"),
        idbStore.getSetting("spl_icon_photos"),
      ]);
      setTeams(t);
      setTeamLogos(
        logosRaw ? (JSON.parse(logosRaw) as Record<string, string>) : {},
      );
      setOwnerPhotos(
        ownerRaw ? (JSON.parse(ownerRaw) as Record<string, string>) : {},
      );
      setIconPhotos(
        iconRaw ? (JSON.parse(iconRaw) as Record<string, string>) : {},
      );
      const edits: typeof localEdits = {};
      for (const team of t) {
        edits[String(team.id)] = {
          name: team.name,
          ownerName: team.ownerName,
          teamIconPlayer: team.teamIconPlayer,
          purse: String(team.purseAmountLeft),
          saving: false,
        };
      }
      setLocalEdits(edits);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const setEdit = (id: string, patch: Partial<(typeof localEdits)[string]>) => {
    setLocalEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveTeam = async (team: IDBTeam) => {
    const id = String(team.id);
    const edit = localEdits[id];
    if (!edit) return;
    setEdit(id, { saving: true });
    try {
      const newPurse = Number(edit.purse) || 0;
      await idbStore.updateTeam(
        team.id,
        edit.name,
        edit.ownerName,
        edit.teamIconPlayer,
      );
      if (newPurse !== team.purseAmountLeft) {
        await idbStore.editTeamPurse(team.id, newPurse);
      }
      toast.success(`${edit.name} saved`);
      setTeams((prev) =>
        prev.map((t) =>
          t.id === team.id
            ? {
                ...t,
                name: edit.name,
                ownerName: edit.ownerName,
                teamIconPlayer: edit.teamIconPlayer,
                purseAmountLeft: newPurse,
              }
            : t,
        ),
      );
      // Background sync to backend
      if (actor) {
        try {
          await actor.updateTeam(
            BigInt(team.id),
            edit.name,
            edit.ownerName,
            edit.teamIconPlayer,
          );
          if (newPurse !== team.purseAmountLeft) {
            await actor.editTeamPurse(BigInt(team.id), BigInt(newPurse));
          }
        } catch {
          /* silent */
        }
      }
    } catch {
      toast.error("Failed to save team");
    } finally {
      setEdit(id, { saving: false });
    }
  };

  // Helper: save photos to IDB and background-sync to backend
  const savePhotos = async (
    newLogos: Record<string, string>,
    newOwner: Record<string, string>,
    newIcon: Record<string, string>,
  ) => {
    await Promise.all([
      idbStore.setSetting("spl_team_logos", JSON.stringify(newLogos)),
      idbStore.setSetting("spl_owner_photos", JSON.stringify(newOwner)),
      idbStore.setSetting("spl_icon_photos", JSON.stringify(newIcon)),
    ]);
    // Also update localStorage for same-device LivePage reads
    try {
      localStorage.setItem("spl_team_logos", JSON.stringify(newLogos));
      localStorage.setItem("spl_owner_photos", JSON.stringify(newOwner));
      localStorage.setItem("spl_icon_photos", JSON.stringify(newIcon));
      window.dispatchEvent(
        new StorageEvent("storage", { key: "spl_team_logos" }),
      );
    } catch {
      /* ignore */
    }
    // Background sync settings to backend
    if (actor) {
      const leagueRaw = await idbStore.getSetting("spl_league_settings");
      const league = leagueRaw
        ? (JSON.parse(leagueRaw) as LeagueSettings)
        : getLeagueSettings();
      const allSettings: AllSettings = {
        league,
        teamLogos: newLogos,
        ownerPhotos: newOwner,
        iconPhotos: newIcon,
        liveColors: getLiveColors(),
        liveLayout: getLiveLayout(),
      };
      saveSettingsToBackend(actor, allSettings);
    }
  };

  const saveLogo = async (team: IDBTeam, url: string) => {
    const id = String(team.id);
    const newLogos = { ...teamLogos, [id]: url };
    setTeamLogos(newLogos);
    await savePhotos(newLogos, ownerPhotos, iconPhotos);
    toast.success("Logo saved");
  };

  const saveOwnerPhoto = async (teamId: string, url: string) => {
    const updated = { ...ownerPhotos, [teamId]: url };
    setOwnerPhotos(updated);
    await savePhotos(teamLogos, updated, iconPhotos);
    toast.success("Owner photo saved");
  };

  const saveIconPhoto = async (teamId: string, url: string) => {
    const updated = { ...iconPhotos, [teamId]: url };
    setIconPhotos(updated);
    await savePhotos(teamLogos, ownerPhotos, updated);
    toast.success("Icon photo saved");
  };

  if (loading) {
    return (
      <div
        className="flex items-center gap-3"
        style={{ color: "oklch(0.55 0.02 90)" }}
      >
        <Loader2 size={16} className="animate-spin" />
        <span className="font-broadcast text-xs tracking-widest">
          LOADING TEAMS...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2
        className="font-broadcast text-lg tracking-widest"
        style={{ color: "oklch(0.78 0.165 85)" }}
      >
        TEAM SETTINGS
      </h2>
      {teams.map((team) => {
        const id = String(team.id);
        const edit = localEdits[id] ?? {
          name: team.name,
          ownerName: team.ownerName,
          teamIconPlayer: team.teamIconPlayer,
          purse: String(team.purseAmountLeft),
          saving: false,
        };
        return (
          <div
            key={id}
            className="p-4 space-y-4"
            style={{
              background: "oklch(0.10 0.025 255)",
              border: "1px solid oklch(0.22 0.04 255 / 0.6)",
            }}
          >
            {/* Photos row */}
            <div className="flex gap-6 flex-wrap">
              {/* Team logo */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="font-broadcast text-xs tracking-widest"
                  style={{ color: "oklch(0.45 0.02 90)", fontSize: 9 }}
                >
                  TEAM LOGO
                </span>
                <PhotoPreview
                  url={teamLogos[id] ?? ""}
                  size={52}
                  circle
                  fallback={team.name[0]}
                />
                <UploadBtn
                  circle
                  onUrl={(url) => {
                    void saveLogo(team, url);
                  }}
                  label="LOGO"
                />
              </div>
              {/* Owner photo */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="font-broadcast text-xs tracking-widest"
                  style={{ color: "oklch(0.45 0.02 90)", fontSize: 9 }}
                >
                  OWNER
                </span>
                <PhotoPreview
                  url={ownerPhotos[id] ?? ""}
                  size={52}
                  circle
                  fallback={edit.ownerName[0] ?? "O"}
                />
                <UploadBtn
                  circle
                  onUrl={(url) => {
                    void saveOwnerPhoto(id, url);
                  }}
                  label="PHOTO"
                />
              </div>
              {/* Icon photo */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="font-broadcast text-xs tracking-widest"
                  style={{ color: "oklch(0.45 0.02 90)", fontSize: 9 }}
                >
                  ICON PLAYER
                </span>
                <PhotoPreview
                  url={iconPhotos[id] ?? ""}
                  size={52}
                  circle
                  fallback={edit.teamIconPlayer[0] ?? "I"}
                />
                <UploadBtn
                  circle
                  onUrl={(url) => {
                    void saveIconPhoto(id, url);
                  }}
                  label="PHOTO"
                />
              </div>
            </div>

            {/* Text fields */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "TEAM NAME", key: "name" as const },
                { label: "OWNER NAME", key: "ownerName" as const },
                { label: "ICON PLAYER", key: "teamIconPlayer" as const },
                { label: "PURSE REMAINING", key: "purse" as const },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <span
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                  >
                    {label}
                  </span>
                  <input
                    value={edit[key]}
                    onChange={(e) => setEdit(id, { [key]: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm"
                    style={{
                      background: "oklch(0.13 0.03 255)",
                      border: "1px solid oklch(0.22 0.05 255)",
                      color: "oklch(0.88 0.02 90)",
                      outline: "none",
                      fontFamily: key === "purse" ? "Geist Mono" : undefined,
                    }}
                    type={key === "purse" ? "number" : "text"}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                void saveTeam(team);
              }}
              disabled={edit.saving}
              className="flex items-center gap-2 px-5 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                color: "oklch(0.08 0.02 265)",
              }}
            >
              {edit.saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              SAVE TEAM
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────────────────────────────────
const CATEGORIES: { value: IDBCategory; label: string }[] = [
  { value: "batsman", label: "BATSMAN" },
  { value: "bowler", label: "BOWLER" },
  { value: "allrounder", label: "ALLROUNDER" },
];

interface PlayerEditState {
  name: string;
  category: IDBCategory;
  basePrice: string;
  imageUrl: string;
  rating: string;
  saving: boolean;
  expanded: boolean;
}

function PlayersTab() {
  const { actor } = useActor();
  const [players, setPlayers] = useState<IDBPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | IDBCategory>("all");
  const [edits, setEdits] = useState<Record<string, PlayerEditState>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    category: "batsman" as IDBCategory,
    basePrice: "100",
    imageUrl: "",
    rating: "3",
  });
  const [addSaving, setAddSaving] = useState(false);
  const { upload } = useImageUpload();

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const ps = await idbStore.getPlayers();
      // Filter upcoming/unsold/live only — exclude sold players and show numbered
      setPlayers(ps);
      setEdits((prev) => {
        const e: typeof edits = {};
        for (const p of ps) {
          const id = String(p.id);
          e[id] = {
            name: p.name,
            category: p.category,
            basePrice: String(p.basePrice),
            imageUrl: p.imageUrl,
            rating: String(p.rating),
            saving: false,
            expanded: prev[id]?.expanded ?? false,
          };
        }
        return e;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlayers();
  }, [fetchPlayers]);

  const setEdit = (id: string, patch: Partial<PlayerEditState>) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const savePlayer = async (player: IDBPlayer) => {
    const id = String(player.id);
    const edit = edits[id];
    if (!edit) return;
    setEdit(id, { saving: true });
    try {
      const r = await idbStore.updatePlayer(
        player.id,
        edit.name,
        edit.category,
        Number(edit.basePrice) || 100,
        edit.imageUrl,
        Number(edit.rating) || 3,
      );
      if (!r.ok) toast.error(r.err);
      else {
        toast.success(`${edit.name} saved`);
        // Background sync to backend
        if (actor) {
          try {
            const { Category } = await import("../backend.d");
            const catMap: Record<IDBCategory, unknown> = {
              batsman: Category.batsman,
              bowler: Category.bowler,
              allrounder: Category.allrounder,
            };
            await actor.updatePlayer(
              BigInt(player.id),
              edit.name,
              catMap[edit.category] as never,
              BigInt(Number(edit.basePrice) || 100),
              edit.imageUrl,
              BigInt(Number(edit.rating) || 3),
            );
          } catch {
            /* silent */
          }
        }
        await fetchPlayers();
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setEdit(id, { saving: false });
    }
  };

  const deletePlayer = async (player: IDBPlayer) => {
    if (!confirm(`Delete ${player.name}? This cannot be undone.`)) return;
    try {
      const r = await idbStore.deletePlayer(player.id);
      if (!r.ok) toast.error(r.err);
      else {
        toast.success("Player deleted");
        // Background sync to backend
        if (actor) {
          try {
            await actor.deletePlayer(BigInt(player.id));
          } catch {
            /* silent */
          }
        }
        await fetchPlayers();
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const addPlayer = async () => {
    if (!newPlayer.name.trim()) return toast.error("Name required");
    setAddSaving(true);
    try {
      const r = await idbStore.addPlayer(
        newPlayer.name.trim(),
        newPlayer.category,
        Number(newPlayer.basePrice) || 100,
        newPlayer.imageUrl,
        Number(newPlayer.rating) || 3,
      );
      if (!r.ok) toast.error(r.err);
      else {
        toast.success("Player added");
        // Background sync to backend
        if (actor) {
          try {
            const { Category } = await import("../backend.d");
            const catMap: Record<IDBCategory, unknown> = {
              batsman: Category.batsman,
              bowler: Category.bowler,
              allrounder: Category.allrounder,
            };
            await actor.addPlayer(
              newPlayer.name.trim(),
              catMap[newPlayer.category] as never,
              BigInt(Number(newPlayer.basePrice) || 100),
              newPlayer.imageUrl,
              BigInt(Number(newPlayer.rating) || 3),
            );
          } catch {
            /* silent */
          }
        }
        setNewPlayer({
          name: "",
          category: "batsman",
          basePrice: "100",
          imageUrl: "",
          rating: "3",
        });
        setShowAddForm(false);
        await fetchPlayers();
      }
    } catch {
      toast.error("Add failed");
    } finally {
      setAddSaving(false);
    }
  };

  const handleImageFile = async (file: File, id: string | null) => {
    const url = await upload(file);
    if (!url) return;
    if (id === null) {
      setNewPlayer((p) => ({ ...p, imageUrl: url }));
    } else {
      setEdit(id, { imageUrl: url });
    }
  };

  const filteredPlayers =
    filter === "all" ? players : players.filter((p) => p.category === filter);

  if (loading) {
    return (
      <div
        className="flex items-center gap-3"
        style={{ color: "oklch(0.55 0.02 90)" }}
      >
        <Loader2 size={16} className="animate-spin" />
        <span className="font-broadcast text-xs tracking-widest">
          LOADING PLAYERS...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className="font-broadcast text-lg tracking-widest"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          PLAYER SETTINGS ({filteredPlayers.length})
        </h2>
        {/* Filter */}
        <div className="flex gap-1">
          {(
            [["all", "ALL"], ...CATEGORIES.map((c) => [c.value, c.label])] as [
              string,
              string,
            ][]
          ).map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilter(val as typeof filter)}
              className="px-3 py-1 font-broadcast tracking-wider text-xs transition-all"
              style={{
                background:
                  filter === val
                    ? "oklch(0.78 0.165 85 / 0.2)"
                    : "oklch(0.11 0.03 255 / 0.6)",
                border:
                  filter === val
                    ? "1px solid oklch(0.78 0.165 85 / 0.6)"
                    : "1px solid oklch(0.22 0.04 255 / 0.5)",
                color:
                  filter === val ? "oklch(0.88 0.16 82)" : "oklch(0.5 0.02 90)",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Add player button */}
      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 font-broadcast tracking-widest text-xs transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "oklch(0.78 0.165 85 / 0.12)",
          border: "1px solid oklch(0.78 0.165 85 / 0.4)",
          color: "oklch(0.78 0.165 85)",
        }}
      >
        <Plus size={13} />
        ADD PLAYER
      </button>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-4 space-y-3"
              style={{
                background: "oklch(0.10 0.03 255)",
                border: "1px solid oklch(0.78 0.165 85 / 0.3)",
              }}
            >
              <div
                className="font-broadcast text-sm tracking-widest"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                ADD NEW PLAYER
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                  >
                    NAME *
                  </span>
                  <input
                    value={newPlayer.name}
                    onChange={(e) =>
                      setNewPlayer((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm"
                    style={{
                      background: "oklch(0.13 0.03 255)",
                      border: "1px solid oklch(0.22 0.05 255)",
                      color: "oklch(0.88 0.02 90)",
                      outline: "none",
                    }}
                    placeholder="Player name"
                  />
                </div>
                <div className="space-y-1">
                  <span
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                  >
                    CATEGORY
                  </span>
                  <select
                    value={newPlayer.category}
                    onChange={(e) =>
                      setNewPlayer((p) => ({
                        ...p,
                        category: e.target.value as IDBCategory,
                      }))
                    }
                    className="w-full px-2 py-1.5 text-sm"
                    style={{
                      background: "oklch(0.13 0.03 255)",
                      border: "1px solid oklch(0.22 0.05 255)",
                      color: "oklch(0.88 0.02 90)",
                      outline: "none",
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                  >
                    BASE PRICE (PTS)
                  </span>
                  <input
                    type="number"
                    value={newPlayer.basePrice}
                    onChange={(e) =>
                      setNewPlayer((p) => ({ ...p, basePrice: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm font-digital"
                    style={{
                      background: "oklch(0.13 0.03 255)",
                      border: "1px solid oklch(0.22 0.05 255)",
                      color: "oklch(0.88 0.02 90)",
                      outline: "none",
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <span
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                  >
                    RATING (1-5)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newPlayer.rating}
                    onChange={(e) =>
                      setNewPlayer((p) => ({ ...p, rating: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 text-sm font-digital"
                    style={{
                      background: "oklch(0.13 0.03 255)",
                      border: "1px solid oklch(0.22 0.05 255)",
                      color: "oklch(0.88 0.02 90)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              {/* Photo upload */}
              <div className="flex items-center gap-3 flex-wrap">
                {newPlayer.imageUrl && (
                  <img
                    src={newPlayer.imageUrl}
                    alt="preview"
                    style={{
                      width: 48,
                      height: 60,
                      objectFit: "cover",
                      border: "1px solid oklch(0.78 0.165 85 / 0.3)",
                    }}
                  />
                )}
                <label
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-broadcast tracking-wider hover:opacity-80"
                  style={{
                    background: "oklch(0.78 0.165 85 / 0.12)",
                    border: "1px solid oklch(0.78 0.165 85 / 0.4)",
                    color: "oklch(0.78 0.165 85)",
                  }}
                >
                  <Upload size={12} />
                  UPLOAD PHOTO
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageFile(f, null);
                      e.target.value = "";
                    }}
                  />
                </label>
                <span style={{ fontSize: 10, color: "oklch(0.4 0.02 90)" }}>
                  or paste URL:
                </span>
                <input
                  value={newPlayer.imageUrl}
                  onChange={(e) =>
                    setNewPlayer((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  className="flex-1 px-2 py-1.5 text-xs"
                  style={{
                    background: "oklch(0.13 0.03 255)",
                    border: "1px solid oklch(0.22 0.05 255)",
                    color: "oklch(0.88 0.02 90)",
                    outline: "none",
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addPlayer}
                  disabled={addSaving}
                  className="flex items-center gap-2 px-5 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                    color: "oklch(0.08 0.02 265)",
                  }}
                >
                  {addSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  ADD PLAYER
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-70"
                  style={{
                    background: "oklch(0.11 0.03 255)",
                    border: "1px solid oklch(0.22 0.04 255)",
                    color: "oklch(0.55 0.02 90)",
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player list */}
      <div className="space-y-2">
        {filteredPlayers.map((player) => {
          const id = String(player.id);
          const edit = edits[id];
          if (!edit) return null;
          return (
            <div
              key={id}
              style={{
                background: "oklch(0.10 0.025 255)",
                border: "1px solid oklch(0.22 0.04 255 / 0.6)",
              }}
            >
              {/* Header row */}
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 cursor-pointer select-none w-full text-left"
                onClick={() => setEdit(id, { expanded: !edit.expanded })}
              >
                {edit.imageUrl ? (
                  <img
                    src={edit.imageUrl}
                    alt={edit.name}
                    style={{
                      width: 36,
                      height: 44,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center font-broadcast font-black"
                    style={{
                      width: 36,
                      height: 44,
                      background: "oklch(0.14 0.04 255)",
                      color: "oklch(0.35 0.02 90)",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {player.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-broadcast tracking-wider truncate"
                    style={{ fontSize: 13, color: "oklch(0.85 0.015 90)" }}
                  >
                    {edit.name}
                  </div>
                  <div
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 9, color: "oklch(0.42 0.02 90)" }}
                  >
                    {edit.category.toUpperCase()} · {edit.basePrice} PTS · ★
                    {edit.rating}
                  </div>
                </div>
                <span
                  className="font-broadcast text-xs tracking-widest px-2 py-0.5"
                  style={{
                    background:
                      player.status === "sold"
                        ? "oklch(0.55 0.15 140 / 0.2)"
                        : player.status === "live"
                          ? "oklch(0.78 0.165 85 / 0.15)"
                          : "oklch(0.28 0.05 255 / 0.4)",
                    color:
                      player.status === "sold"
                        ? "oklch(0.7 0.18 140)"
                        : player.status === "live"
                          ? "oklch(0.88 0.16 82)"
                          : "oklch(0.5 0.02 90)",
                    fontSize: 9,
                  }}
                >
                  {player.status.toUpperCase()}
                </span>
                {edit.expanded ? (
                  <ChevronUp
                    size={14}
                    style={{ color: "oklch(0.45 0.02 90)", flexShrink: 0 }}
                  />
                ) : (
                  <ChevronDown
                    size={14}
                    style={{ color: "oklch(0.45 0.02 90)", flexShrink: 0 }}
                  />
                )}
              </button>

              {/* Expanded edit form */}
              {edit.expanded && (
                <div
                  className="px-3 pb-3 pt-1 space-y-3 border-t"
                  style={{ borderColor: "oklch(0.18 0.04 255 / 0.5)" }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span
                        className="font-broadcast tracking-widest"
                        style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                      >
                        NAME
                      </span>
                      <input
                        value={edit.name}
                        onChange={(e) => setEdit(id, { name: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm"
                        style={{
                          background: "oklch(0.13 0.03 255)",
                          border: "1px solid oklch(0.22 0.05 255)",
                          color: "oklch(0.88 0.02 90)",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span
                        className="font-broadcast tracking-widest"
                        style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                      >
                        CATEGORY
                      </span>
                      <select
                        value={edit.category}
                        onChange={(e) =>
                          setEdit(id, {
                            category: e.target.value as IDBCategory,
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm"
                        style={{
                          background: "oklch(0.13 0.03 255)",
                          border: "1px solid oklch(0.22 0.05 255)",
                          color: "oklch(0.88 0.02 90)",
                          outline: "none",
                        }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span
                        className="font-broadcast tracking-widest"
                        style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                      >
                        BASE PRICE
                      </span>
                      <input
                        type="number"
                        value={edit.basePrice}
                        onChange={(e) =>
                          setEdit(id, { basePrice: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm font-digital"
                        style={{
                          background: "oklch(0.13 0.03 255)",
                          border: "1px solid oklch(0.22 0.05 255)",
                          color: "oklch(0.88 0.02 90)",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span
                        className="font-broadcast tracking-widest"
                        style={{ fontSize: 9, color: "oklch(0.45 0.02 90)" }}
                      >
                        RATING (1-5)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={edit.rating}
                        onChange={(e) =>
                          setEdit(id, { rating: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm font-digital"
                        style={{
                          background: "oklch(0.13 0.03 255)",
                          border: "1px solid oklch(0.22 0.05 255)",
                          color: "oklch(0.88 0.02 90)",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                  {/* Photo */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {edit.imageUrl && (
                      <img
                        src={edit.imageUrl}
                        alt="preview"
                        style={{
                          width: 44,
                          height: 56,
                          objectFit: "cover",
                          border: "1px solid oklch(0.78 0.165 85 / 0.3)",
                        }}
                      />
                    )}
                    <label
                      className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-broadcast tracking-wider hover:opacity-80"
                      style={{
                        background: "oklch(0.78 0.165 85 / 0.12)",
                        border: "1px solid oklch(0.78 0.165 85 / 0.4)",
                        color: "oklch(0.78 0.165 85)",
                      }}
                    >
                      <Upload size={12} />
                      UPLOAD PHOTO
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFile(f, id);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <span style={{ fontSize: 10, color: "oklch(0.4 0.02 90)" }}>
                      or URL:
                    </span>
                    <input
                      value={edit.imageUrl}
                      onChange={(e) =>
                        setEdit(id, { imageUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="flex-1 min-w-0 px-2 py-1.5 text-xs"
                      style={{
                        background: "oklch(0.13 0.03 255)",
                        border: "1px solid oklch(0.22 0.05 255)",
                        color: "oklch(0.88 0.02 90)",
                        outline: "none",
                      }}
                    />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => savePlayer(player)}
                      disabled={edit.saving}
                      className="flex items-center gap-2 px-4 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                        color: "oklch(0.08 0.02 265)",
                      }}
                    >
                      {edit.saving ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Save size={11} />
                      )}
                      SAVE
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePlayer(player)}
                      className="flex items-center gap-2 px-3 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-90"
                      style={{
                        background: "oklch(0.65 0.18 25 / 0.15)",
                        border: "1px solid oklch(0.65 0.18 25 / 0.4)",
                        color: "oklch(0.75 0.18 25)",
                      }}
                    >
                      <Trash2 size={11} />
                      DELETE
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Live Layout Tab ──────────────────────────────────────────────────────────
interface LayoutSliderConfig {
  key: keyof LiveLayoutConfig;
  label: string;
  min: number;
  max: number;
  unit?: string;
}

const LAYOUT_SLIDERS: LayoutSliderConfig[] = [
  {
    key: "playerImageWidth",
    label: "Player Image Width",
    min: 100,
    max: 400,
    unit: "px",
  },
  {
    key: "playerImageHeight",
    label: "Player Image Height",
    min: 120,
    max: 500,
    unit: "px",
  },
  {
    key: "playerNameSize",
    label: "Player Name Size",
    min: 50,
    max: 200,
    unit: "%",
  },
  {
    key: "categoryBadgeSize",
    label: "Category Badge Size",
    min: 50,
    max: 200,
    unit: "%",
  },
  {
    key: "bidCounterSize",
    label: "Bid Counter Size",
    min: 50,
    max: 200,
    unit: "%",
  },
  {
    key: "leadingTeamSize",
    label: "Leading Team Size",
    min: 50,
    max: 200,
    unit: "%",
  },
  {
    key: "rightPanelWidth",
    label: "Right Panel Width",
    min: 240,
    max: 600,
    unit: "px",
  },
  {
    key: "teamTableFontSize",
    label: "Team Table Font",
    min: 50,
    max: 200,
    unit: "%",
  },
  { key: "chartHeight", label: "Chart Height", min: 80, max: 400, unit: "px" },
  {
    key: "headerLogoSize",
    label: "Header Logo Size",
    min: 20,
    max: 80,
    unit: "px",
  },
];

function LiveLayoutTab() {
  const { actor } = useActor();
  const [layout, setLayout] = useState<LiveLayoutConfig>(getLiveLayout);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const save = async () => {
    localStorage.setItem(LIVE_LAYOUT_KEY, JSON.stringify(layout));
    // Also save to IDB
    await idbStore.setSetting(LIVE_LAYOUT_KEY, JSON.stringify(layout));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Live layout saved — refresh /live to apply");
    // Background sync to backend
    if (actor) {
      setSyncing(true);
      const [logosRaw, ownerRaw, iconRaw, leagueRaw] = await Promise.all([
        idbStore.getSetting("spl_team_logos"),
        idbStore.getSetting("spl_owner_photos"),
        idbStore.getSetting("spl_icon_photos"),
        idbStore.getSetting("spl_league_settings"),
      ]);
      const allSettings: AllSettings = {
        league: leagueRaw
          ? (JSON.parse(leagueRaw) as LeagueSettings)
          : getLeagueSettings(),
        teamLogos: logosRaw
          ? (JSON.parse(logosRaw) as Record<string, string>)
          : {},
        ownerPhotos: ownerRaw
          ? (JSON.parse(ownerRaw) as Record<string, string>)
          : {},
        iconPhotos: iconRaw
          ? (JSON.parse(iconRaw) as Record<string, string>)
          : {},
        liveColors: getLiveColors(),
        liveLayout: layout,
      };
      saveSettingsToBackend(actor, allSettings).finally(() => {
        setSyncing(false);
      });
    }
  };

  const reset = () => {
    setLayout({ ...DEFAULT_LIVE_LAYOUT });
    toast.info("Reset to defaults (not saved yet)");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className="font-broadcast text-lg tracking-widest"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          LIVE SCREEN LAYOUT
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="px-4 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-80"
            style={{
              background: showPreview
                ? "oklch(0.78 0.165 85 / 0.2)"
                : "oklch(0.11 0.03 255)",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
              color: "oklch(0.78 0.165 85)",
            }}
          >
            {showPreview ? "HIDE PREVIEW" : "SHOW PREVIEW"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-3 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-70"
            style={{
              background: "oklch(0.11 0.03 255)",
              border: "1px solid oklch(0.22 0.04 255)",
              color: "oklch(0.5 0.02 90)",
            }}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-3"
              style={{
                background: "oklch(0.07 0.025 255)",
                border: "1px solid oklch(0.22 0.04 255)",
              }}
            >
              <div
                className="font-broadcast text-xs tracking-widest mb-2"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                PREVIEW (scaled 35%)
              </div>
              <div
                style={{
                  transform: "scale(0.35)",
                  transformOrigin: "top left",
                  width: "285%",
                  height: 260,
                  pointerEvents: "none",
                  overflow: "hidden",
                }}
              >
                {/* Mini preview of live screen layout */}
                <div
                  className="flex"
                  style={{
                    height: "100%",
                    background: "oklch(0.09 0.025 255)",
                    border: "1px solid oklch(0.22 0.04 255)",
                  }}
                >
                  {/* Left: player area */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div
                      style={{
                        width: layout.playerImageWidth,
                        height: layout.playerImageHeight,
                        background: "oklch(0.14 0.04 255)",
                        border: "2px solid oklch(0.78 0.165 85 / 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        color: "oklch(0.3 0.02 90)",
                      }}
                      className="font-broadcast"
                    >
                      PHOTO
                    </div>
                    <div
                      className="font-broadcast"
                      style={{
                        fontSize: 36 * (layout.playerNameSize / 100),
                        color: "oklch(0.88 0.02 90)",
                      }}
                    >
                      PLAYER NAME
                    </div>
                    <div
                      className="font-digital"
                      style={{
                        fontSize: 80 * (layout.bidCounterSize / 100),
                        color: "oklch(0.78 0.165 85)",
                      }}
                    >
                      5,200
                    </div>
                    <div
                      style={{
                        fontSize: Math.round(
                          13 * (layout.leadingTeamSize / 100),
                        ),
                        color: "oklch(0.88 0.14 82)",
                      }}
                      className="font-broadcast"
                    >
                      LEADING TEAM
                    </div>
                  </div>
                  {/* Right panel */}
                  <div
                    style={{
                      width: layout.rightPanelWidth,
                      background: "oklch(0.08 0.025 255)",
                      borderLeft: "1px solid oklch(0.22 0.04 255)",
                      padding: 8,
                    }}
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={`preview-team-row-${i + 1}`}
                        style={{
                          height: Math.round(
                            14 * (layout.teamTableFontSize / 100),
                          ),
                          background: "oklch(0.14 0.04 255)",
                          marginBottom: 3,
                        }}
                      />
                    ))}
                    <div
                      style={{
                        height: layout.chartHeight,
                        background: "oklch(0.12 0.03 255)",
                        marginTop: 8,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliders */}
      <div className="space-y-4">
        {LAYOUT_SLIDERS.map(({ key, label, min, max, unit }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <span
                className="font-broadcast tracking-wide text-sm"
                style={{ color: "oklch(0.65 0.02 90)" }}
              >
                {label}
              </span>
              <span
                className="font-digital text-sm"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                {layout[key]}
                {unit}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setLayout((l) => ({
                    ...l,
                    [key]: Math.max(min, l[key] - 10),
                  }))
                }
                className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-80"
                style={{
                  background: "oklch(0.13 0.03 255)",
                  border: "1px solid oklch(0.22 0.04 255)",
                  color: "oklch(0.55 0.02 90)",
                }}
              >
                <Minus size={12} />
              </button>
              <input
                type="range"
                min={min}
                max={max}
                value={layout[key]}
                onChange={(e) =>
                  setLayout((l) => ({ ...l, [key]: +e.target.value }))
                }
                className="flex-1 accent-amber-400"
              />
              <button
                type="button"
                onClick={() =>
                  setLayout((l) => ({
                    ...l,
                    [key]: Math.min(max, l[key] + 10),
                  }))
                }
                className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-80"
                style={{
                  background: "oklch(0.13 0.03 255)",
                  border: "1px solid oklch(0.22 0.04 255)",
                  color: "oklch(0.55 0.02 90)",
                }}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-2 px-6 py-2 font-broadcast tracking-widest text-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            background: saved
              ? "oklch(0.55 0.15 140)"
              : "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
            color: "oklch(0.08 0.02 265)",
            boxShadow: "0 0 20px oklch(0.78 0.165 85 / 0.25)",
          }}
        >
          <Save size={14} />
          {saved ? "SAVED!" : "SAVE LAYOUT"}
        </button>
        {syncing && (
          <span
            className="flex items-center gap-1.5 text-xs font-broadcast tracking-wider"
            style={{ color: "oklch(0.55 0.02 90)" }}
          >
            <Loader2 size={11} className="animate-spin" />
            Syncing…
          </span>
        )}
      </div>
      <p
        className="font-broadcast tracking-wide text-xs"
        style={{ color: "oklch(0.4 0.02 90)" }}
      >
        Refresh /live after saving to see the updated layout.
      </p>
    </div>
  );
}

// ─── Live Colours Tab ─────────────────────────────────────────────────────────
interface ColorGroup {
  label: string;
  fields: { key: keyof LiveColorTheme; label: string }[];
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: "BACKGROUNDS",
    fields: [
      { key: "pageBg", label: "Page Background" },
      { key: "headerBg", label: "Header Bar" },
      { key: "rightPanelBg", label: "Right Panel" },
      { key: "playerImageBg", label: "Player Image Placeholder" },
      { key: "atmosphereBg", label: "Atmosphere Glow" },
    ],
  },
  {
    label: "ACCENTS & TEXT",
    fields: [
      { key: "goldAccent", label: "Primary Accent (Gold)" },
      { key: "silverAccent", label: "Secondary Accent (Silver)" },
      { key: "primaryText", label: "Primary Text" },
      { key: "secondaryText", label: "Secondary Text / Captions" },
      { key: "gridColor", label: "Decorative Grid" },
      { key: "liveDotColor", label: "LIVE Indicator Dot" },
    ],
  },
  {
    label: "BID COUNTER",
    fields: [
      { key: "bidCounterColor", label: "Bid Number Colour" },
      { key: "bidCounterGlow", label: "Bid Number Glow" },
    ],
  },
  {
    label: "LEADING TEAM BANNER",
    fields: [
      { key: "leadingTeamBg", label: "Banner Background" },
      { key: "leadingTeamText", label: "Team Name Text" },
    ],
  },
  {
    label: "TEAM TABLE",
    fields: [
      { key: "teamRowBg", label: "Row Background" },
      { key: "teamRowLeadingBg", label: "Leading Row Background" },
      { key: "teamRowLeadingBorder", label: "Leading Row Border" },
      { key: "teamRowText", label: "Row Text" },
      { key: "teamRowLeadingText", label: "Leading Row Text" },
    ],
  },
  {
    label: "PURSE CHART",
    fields: [
      { key: "chartBarDefault", label: "Bar Colour (Default)" },
      { key: "chartBarLeading", label: "Bar Colour (Leading Team)" },
    ],
  },
  {
    label: "CATEGORY BADGES",
    fields: [
      { key: "batsmanColor", label: "Batsman Badge" },
      { key: "bowlerColor", label: "Bowler Badge" },
      { key: "allrounderColor", label: "Allrounder Badge" },
    ],
  },
  {
    label: "SOLD OVERLAY",
    fields: [
      { key: "soldBannerBg", label: "Banner Background" },
      { key: "soldBannerBorder", label: "Banner Border" },
      { key: "soldTextColor", label: "SOLD! Text Colour" },
    ],
  },
];

function LiveColoursTab() {
  const { actor } = useActor();
  const [colors, setColors] = useState<LiveColorTheme>(getLiveColors);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const set = (key: keyof LiveColorTheme, val: string) => {
    setColors((prev) => ({ ...prev, [key]: val }));
  };

  const save = async () => {
    saveLiveColors(colors);
    // Also save to IDB
    await idbStore.setSetting("spl_live_colors", JSON.stringify(colors));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Colours saved — refresh /live to apply");
    // Background sync to backend
    if (actor) {
      setSyncing(true);
      const [logosRaw, ownerRaw, iconRaw, leagueRaw] = await Promise.all([
        idbStore.getSetting("spl_team_logos"),
        idbStore.getSetting("spl_owner_photos"),
        idbStore.getSetting("spl_icon_photos"),
        idbStore.getSetting("spl_league_settings"),
      ]);
      const allSettings: AllSettings = {
        league: leagueRaw
          ? (JSON.parse(leagueRaw) as LeagueSettings)
          : getLeagueSettings(),
        teamLogos: logosRaw
          ? (JSON.parse(logosRaw) as Record<string, string>)
          : {},
        ownerPhotos: ownerRaw
          ? (JSON.parse(ownerRaw) as Record<string, string>)
          : {},
        iconPhotos: iconRaw
          ? (JSON.parse(iconRaw) as Record<string, string>)
          : {},
        liveColors: colors,
        liveLayout: getLiveLayout(),
      };
      saveSettingsToBackend(actor, allSettings).finally(() => {
        setSyncing(false);
      });
    }
  };

  const reset = () => {
    setColors({ ...DEFAULT_LIVE_COLORS });
    toast.info("Reset to defaults (not saved yet)");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className="font-broadcast text-lg tracking-widest"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          LIVE SCREEN COLOURS
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="px-4 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-80"
            style={{
              background: showPreview
                ? "oklch(0.78 0.165 85 / 0.2)"
                : "oklch(0.11 0.03 255)",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
              color: "oklch(0.78 0.165 85)",
            }}
          >
            {showPreview ? "HIDE PREVIEW" : "SHOW PREVIEW"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-3 py-1.5 font-broadcast tracking-widest text-xs transition-all hover:opacity-70"
            style={{
              background: "oklch(0.11 0.03 255)",
              border: "1px solid oklch(0.22 0.04 255)",
              color: "oklch(0.5 0.02 90)",
            }}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Mini preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-3"
              style={{
                background: "oklch(0.07 0.025 255)",
                border: "1px solid oklch(0.22 0.04 255)",
              }}
            >
              <div
                className="font-broadcast text-xs tracking-widest mb-2"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                COLOUR PREVIEW (scaled 45%)
              </div>
              <div
                style={{
                  transform: "scale(0.45)",
                  transformOrigin: "top left",
                  width: "222%",
                  height: 240,
                  pointerEvents: "none",
                  overflow: "hidden",
                }}
              >
                {/* Simulated live screen */}
                <div
                  className="flex"
                  style={{ height: "100%", background: colors.pageBg }}
                >
                  {/* Header */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 40,
                      background: colors.headerBg,
                      borderBottom: `1px solid ${colors.goldAccent}44`,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 12,
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: colors.liveDotColor,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: '"Bricolage Grotesque"',
                        fontWeight: 900,
                        fontSize: 12,
                        color: colors.goldAccent,
                      }}
                    >
                      SPL
                    </span>
                    <span
                      style={{
                        fontFamily: '"Bricolage Grotesque"',
                        fontSize: 10,
                        color: colors.secondaryText,
                      }}
                    >
                      LIVE
                    </span>
                  </div>

                  {/* Center: player + bid */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingTop: 40,
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 100,
                        background: colors.playerImageBg,
                        border: `2px solid ${colors.goldAccent}66`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.secondaryText,
                        fontSize: 10,
                        fontFamily: '"Bricolage Grotesque"',
                      }}
                    >
                      PHOTO
                    </div>
                    <span
                      style={{
                        fontFamily: '"Bricolage Grotesque"',
                        fontWeight: 900,
                        fontSize: 18,
                        color: colors.primaryText,
                      }}
                    >
                      PLAYER NAME
                    </span>
                    {/* Category badges */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {(
                        [
                          ["BATSMAN", colors.batsmanColor],
                          ["BOWLER", colors.bowlerColor],
                          ["ALLROUNDER", colors.allrounderColor],
                        ] as [string, string][]
                      ).map(([label, color]) => (
                        <span
                          key={label}
                          style={{
                            background: `${color}22`,
                            border: `1px solid ${color}66`,
                            color,
                            padding: "2px 6px",
                            fontSize: 9,
                            fontFamily: '"Bricolage Grotesque"',
                            fontWeight: 700,
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    <span
                      style={{
                        fontFamily: '"Geist Mono", monospace',
                        fontWeight: 700,
                        fontSize: 40,
                        color: colors.bidCounterColor,
                        textShadow: `0 0 20px ${colors.bidCounterGlow}`,
                      }}
                    >
                      5,200
                    </span>
                    <div
                      style={{
                        background: colors.leadingTeamBg,
                        border: `1px solid ${colors.goldAccent}55`,
                        padding: "4px 12px",
                        color: colors.leadingTeamText,
                        fontSize: 12,
                        fontFamily: '"Bricolage Grotesque"',
                        fontWeight: 700,
                      }}
                    >
                      LEADING TEAM
                    </div>
                  </div>

                  {/* Right panel */}
                  <div
                    style={{
                      width: 160,
                      background: colors.rightPanelBg,
                      borderLeft: `1px solid ${colors.goldAccent}22`,
                      padding: 8,
                      paddingTop: 48,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {(
                      [
                        "Team 1 (leading)",
                        "Team 2",
                        "Team 3",
                        "Team 4",
                        "Team 5",
                      ] as const
                    ).map((teamLabel, i) => {
                      const leading = i === 0;
                      return (
                        <div
                          key={teamLabel}
                          style={{
                            background: leading
                              ? colors.teamRowLeadingBg
                              : colors.teamRowBg,
                            border: `1px solid ${leading ? colors.teamRowLeadingBorder : "transparent"}`,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              color: leading
                                ? colors.teamRowLeadingText
                                : colors.teamRowText,
                              fontFamily: '"Bricolage Grotesque"',
                            }}
                          >
                            {teamLabel}
                          </span>
                        </div>
                      );
                    })}
                    {/* Mini chart bars */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 3,
                        marginTop: 8,
                        height: 40,
                      }}
                    >
                      {[
                        { h: 80, id: "bar-a" },
                        { h: 60, id: "bar-b" },
                        { h: 45, id: "bar-c" },
                        { h: 90, id: "bar-d-leading" },
                        { h: 55, id: "bar-e" },
                      ].map(({ h, id }) => (
                        <div
                          key={id}
                          style={{
                            flex: 1,
                            height: `${h}%`,
                            background:
                              id === "bar-d-leading"
                                ? colors.chartBarLeading
                                : colors.chartBarDefault,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Colour groups */}
      <div className="space-y-8">
        {COLOR_GROUPS.map((group) => (
          <div key={group.label} className="space-y-3">
            <div
              className="font-broadcast text-xs tracking-widest pb-1"
              style={{
                color: "oklch(0.55 0.02 90)",
                borderBottom: "1px solid oklch(0.18 0.04 255)",
              }}
            >
              {group.label}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {group.fields.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 px-3 py-2"
                  style={{
                    background: "oklch(0.10 0.025 255)",
                    border: "1px solid oklch(0.22 0.04 255 / 0.5)",
                  }}
                >
                  {/* Colour swatch + native picker */}
                  <div className="relative flex-shrink-0">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: colors[key],
                        border: "2px solid oklch(0.3 0.04 255)",
                        cursor: "pointer",
                      }}
                    />
                    <input
                      type="color"
                      value={
                        colors[key].startsWith("#")
                          ? colors[key].slice(0, 7)
                          : "#888888"
                      }
                      onChange={(e) => set(key, e.target.value)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </div>
                  {/* Label + hex input */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-broadcast tracking-wide text-xs truncate mb-1"
                      style={{ color: "oklch(0.65 0.02 90)" }}
                    >
                      {label}
                    </div>
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className="w-full px-2 py-0.5 font-digital text-xs"
                      style={{
                        background: "oklch(0.13 0.03 255)",
                        border: "1px solid oklch(0.22 0.05 255)",
                        color: "oklch(0.75 0.02 90)",
                        outline: "none",
                      }}
                      placeholder="#rrggbb or rgba(...)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-2 px-6 py-2 font-broadcast tracking-widest text-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            background: saved
              ? "oklch(0.55 0.15 140)"
              : "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
            color: "oklch(0.08 0.02 265)",
            boxShadow: "0 0 20px oklch(0.78 0.165 85 / 0.25)",
          }}
        >
          <Save size={14} />
          {saved ? "SAVED!" : "SAVE COLOURS"}
        </button>
        {syncing && (
          <span
            className="flex items-center gap-1.5 text-xs font-broadcast tracking-wider"
            style={{ color: "oklch(0.55 0.02 90)" }}
          >
            <Loader2 size={11} className="animate-spin" />
            Syncing…
          </span>
        )}
      </div>
      <p
        className="font-broadcast tracking-wide text-xs"
        style={{ color: "oklch(0.4 0.02 90)" }}
      >
        Refresh /live after saving to see the updated colours.
      </p>
    </div>
  );
}

// ─── Not Authenticated view ────────────────────────────────────────────────────
function NotAuthenticatedView() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center broadcast-overlay">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.15 0.06 255 / 0.6) 0%, transparent 70%)",
        }}
      />
      <div
        className="relative z-10 text-center max-w-sm px-6 py-12"
        style={{
          background: "oklch(0.12 0.03 255 / 0.95)",
          border: "1px solid oklch(0.78 0.165 85 / 0.3)",
          boxShadow: "0 0 60px oklch(0.78 0.165 85 / 0.08)",
        }}
      >
        <div
          className="font-broadcast text-xl tracking-widest mb-3"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          ACCESS REQUIRED
        </div>
        <p className="text-sm mb-6" style={{ color: "oklch(0.45 0.02 90)" }}>
          Please log in via the admin panel first.
        </p>
        <a
          href="/admin"
          className="inline-flex items-center gap-2 px-6 py-2.5 font-broadcast tracking-widest text-sm transition-all hover:opacity-90"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
            color: "oklch(0.08 0.02 265)",
            boxShadow: "0 0 20px oklch(0.78 0.165 85 / 0.25)",
          }}
        >
          GO TO ADMIN
        </a>
      </div>
    </div>
  );
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("league");
  // Read auth from localStorage on mount — NO automatic redirect (per spec)
  const [authed] = useState(() => isAuthenticated());

  // If not authenticated, show a styled message with a link — DO NOT redirect
  if (!authed) {
    return <NotAuthenticatedView />;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "league", label: "LEAGUE" },
    { id: "teams", label: "TEAMS" },
    { id: "players", label: "PLAYERS" },
    { id: "layout", label: "LIVE LAYOUT" },
    { id: "colours", label: "COLOURS" },
  ];

  return (
    <div className="min-h-screen bg-background broadcast-overlay">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 10%, oklch(0.14 0.05 255 / 0.6) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-4 px-5 py-3"
        style={{
          background: "oklch(0.09 0.025 255 / 0.95)",
          borderBottom: "1px solid oklch(0.78 0.165 85 / 0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <a
          href="/admin"
          className="flex items-center gap-2 font-broadcast tracking-wider text-sm transition-opacity hover:opacity-70"
          style={{ color: "oklch(0.55 0.02 90)" }}
        >
          <ChevronLeft size={16} />
          ADMIN
        </a>
        <div
          className="font-broadcast text-lg tracking-widest"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          SETTINGS
        </div>
      </header>

      <div className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-57px)]">
        {/* Mobile: horizontal scrollable tabs */}
        <nav
          className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid oklch(0.18 0.04 255 / 0.6)" }}
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex-shrink-0 px-3 py-2 font-broadcast tracking-widest text-xs transition-all rounded"
              style={{
                background:
                  tab === id ? "oklch(0.78 0.165 85 / 0.15)" : "transparent",
                borderBottom:
                  tab === id
                    ? "2px solid oklch(0.78 0.165 85)"
                    : "2px solid transparent",
                color:
                  tab === id ? "oklch(0.88 0.16 82)" : "oklch(0.45 0.02 90)",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Desktop: vertical sidebar */}
        <nav
          className="hidden md:block w-44 flex-shrink-0 pt-4 px-2"
          style={{ borderRight: "1px solid oklch(0.18 0.04 255 / 0.6)" }}
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="w-full text-left px-3 py-2.5 mb-1 font-broadcast tracking-widest text-xs transition-all"
              style={{
                background:
                  tab === id ? "oklch(0.78 0.165 85 / 0.12)" : "transparent",
                borderLeft:
                  tab === id
                    ? "2px solid oklch(0.78 0.165 85)"
                    : "2px solid transparent",
                color:
                  tab === id ? "oklch(0.88 0.16 82)" : "oklch(0.45 0.02 90)",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "league" && <LeagueTab />}
              {tab === "teams" && <TeamsTab />}
              {tab === "players" && <PlayersTab />}
              {tab === "layout" && <LiveLayoutTab />}
              {tab === "colours" && <LiveColoursTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
