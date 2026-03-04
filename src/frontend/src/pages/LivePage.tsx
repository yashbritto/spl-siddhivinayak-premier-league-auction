import { Crown, Loader2, Star, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuctionState, Player, Team } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useIdbAuctionData } from "../hooks/useIdbAuctionData";
import {
  type IDBAuctionState,
  type IDBCategory,
  type IDBPlayer,
  type IDBStatus,
  type IDBTeam,
  IDB_CHANGE_EVENT,
  idbStore,
} from "../idbStore";
import {
  applySettingsToLocalStorage,
  loadSettingsFromBackend,
} from "../utils/settingsStore";
import {
  DEFAULT_LIVE_COLORS,
  DEFAULT_LIVE_LAYOUT,
  type LiveColorTheme,
  type LiveLayoutConfig,
  getIconPhotos,
  getLeagueSettings,
  getLiveColors,
  getLiveLayout,
  getOwnerPhotos,
  getTeamLogos,
} from "./LandingPage";

// ─── Backend → IDB type converters ────────────────────────────────────────────
function convertCategory(cat: unknown): IDBCategory {
  if (typeof cat === "string") {
    const c = cat.toLowerCase();
    if (c === "batsman") return "batsman";
    if (c === "bowler") return "bowler";
    return "allrounder";
  }
  if (cat && typeof cat === "object") {
    if ("batsman" in cat) return "batsman";
    if ("bowler" in cat) return "bowler";
  }
  return "allrounder";
}

function convertStatus(s: unknown): IDBStatus {
  if (typeof s === "string") {
    const c = s.toLowerCase();
    if (c === "upcoming") return "upcoming";
    if (c === "live") return "live";
    if (c === "sold") return "sold";
    if (c === "unsold") return "unsold";
  }
  if (s && typeof s === "object") {
    if ("upcoming" in s) return "upcoming";
    if ("live" in s) return "live";
    if ("sold" in s) return "sold";
    if ("unsold" in s) return "unsold";
  }
  return "upcoming";
}

function convertTeam(t: Team): IDBTeam {
  return {
    id: Number(t.id),
    name: t.name,
    purseAmountTotal: Number(t.purseAmountTotal),
    purseAmountLeft: Number(t.purseAmountLeft),
    numberOfPlayers: Number(t.numberOfPlayers),
    ownerName: t.ownerName,
    teamIconPlayer: t.teamIconPlayer,
    isTeamLocked: t.isTeamLocked,
  };
}

function convertPlayer(p: Player): IDBPlayer {
  return {
    id: Number(p.id),
    name: p.name,
    category: convertCategory(p.category),
    basePrice: Number(p.basePrice),
    imageUrl: p.imageUrl,
    soldPrice: p.soldPrice != null ? Number(p.soldPrice) : undefined,
    soldTo: p.soldTo != null ? Number(p.soldTo) : undefined,
    status: convertStatus(p.status),
    rating: Number(p.rating),
  };
}

function convertState(s: AuctionState): IDBAuctionState {
  return {
    currentPlayerId:
      s.currentPlayerId != null ? Number(s.currentPlayerId) : undefined,
    currentBid: Number(s.currentBid),
    leadingTeamId:
      s.leadingTeamId != null ? Number(s.leadingTeamId) : undefined,
    isActive: s.isActive,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return Number(n).toLocaleString();
}

function displayCategory(cat: string) {
  const c = cat.toLowerCase();
  if (c === "batsman") return "BATSMAN";
  if (c === "bowler") return "BOWLER";
  if (c === "allrounder") return "ALLROUNDER";
  return cat.toUpperCase();
}

function getCategoryColor(cat: string, colors: LiveColorTheme) {
  const c = cat.toLowerCase();
  if (c === "batsman") return colors.batsmanColor;
  if (c === "bowler") return colors.bowlerColor;
  if (c === "allrounder") return colors.allrounderColor;
  return "oklch(0.55 0.02 90)";
}

function teamInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 3)
    .join("")
    .toUpperCase();
}

// ─── SOLD Overlay ─────────────────────────────────────────────────────────────
interface SoldOverlayProps {
  visible: boolean;
  player: IDBPlayer | null;
  team: IDBTeam | null;
  teamLogoUrl: string;
  colors: LiveColorTheme;
}

function SoldOverlay({
  visible,
  player,
  team,
  teamLogoUrl,
  colors,
}: SoldOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sold-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Dimmed background */}
          <div
            className="absolute inset-0"
            style={{ background: `${colors.soldBannerBg}dd` }}
          />

          {/* Main banner */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative z-10 flex flex-col items-center gap-6 px-16 py-12"
            style={{
              background: `${colors.soldBannerBg}f2`,
              border: `3px solid ${colors.soldBannerBorder}`,
              boxShadow: `0 0 80px ${colors.soldBannerBorder}99, 0 0 160px ${colors.soldBannerBorder}40`,
            }}
          >
            {/* SOLD! text */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                duration: 0.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 0.8,
              }}
              className="font-broadcast text-8xl font-black tracking-widest"
              style={{
                color: colors.soldTextColor,
                textShadow: `0 0 40px ${colors.soldTextColor}cc, 0 0 80px ${colors.soldTextColor}66`,
              }}
            >
              SOLD!
            </motion.div>

            {/* Player name */}
            {player && (
              <div
                className="font-broadcast text-4xl tracking-wider"
                style={{ color: colors.primaryText }}
              >
                {player.name.toUpperCase()}
              </div>
            )}

            {/* Team info */}
            {team && (
              <div className="flex items-center gap-4">
                {teamLogoUrl ? (
                  <img
                    src={teamLogoUrl}
                    alt={team.name}
                    className="rounded-full"
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                      border: `2px solid ${colors.goldAccent}99`,
                    }}
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center font-broadcast font-black text-sm"
                    style={{
                      width: 64,
                      height: 64,
                      background: colors.playerImageBg,
                      border: `2px solid ${colors.goldAccent}99`,
                      color: colors.goldAccent,
                    }}
                  >
                    {teamInitials(team.name)}
                  </div>
                )}
                <div>
                  <div
                    className="font-broadcast text-2xl tracking-wider"
                    style={{ color: colors.leadingTeamText }}
                  >
                    {team.name.toUpperCase()}
                  </div>
                  {player?.soldPrice != null && (
                    <div
                      className="font-digital text-xl"
                      style={{ color: colors.goldAccent }}
                    >
                      {fmt(player.soldPrice)} PTS
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── UNSOLD Overlay ───────────────────────────────────────────────────────────
interface UnsoldOverlayProps {
  visible: boolean;
  player: IDBPlayer | null;
}

function UnsoldOverlay({ visible, player }: UnsoldOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="unsold-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Dark red tinted background */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0.08 0.06 25 / 0.92)" }}
          />

          {/* Panel slides down from top */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative z-10 flex flex-col items-center gap-5 px-16 py-12"
            style={{
              background: "oklch(0.08 0.06 25 / 0.97)",
              border: "3px solid oklch(0.65 0.22 25)",
              boxShadow:
                "0 0 80px oklch(0.65 0.22 25 / 0.5), 0 0 160px oklch(0.65 0.22 25 / 0.2)",
            }}
          >
            {/* Shaking ✗ icon */}
            <motion.div
              animate={{ x: [-8, 8, -8, 8, 0] }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="font-broadcast font-black"
              style={{
                fontSize: 72,
                color: "oklch(0.65 0.22 25)",
                textShadow: "0 0 30px oklch(0.65 0.22 25 / 0.8)",
                lineHeight: 1,
              }}
            >
              ✗
            </motion.div>

            {/* UNSOLD text - flickering red */}
            <motion.div
              animate={{ opacity: [1, 0.5, 1, 0.6, 1] }}
              transition={{
                duration: 0.7,
                repeat: Number.POSITIVE_INFINITY,
              }}
              className="font-broadcast font-black tracking-widest"
              style={{
                fontSize: 72,
                color: "oklch(0.72 0.22 25)",
                textShadow:
                  "0 0 40px oklch(0.72 0.22 25 / 0.9), 0 0 80px oklch(0.65 0.22 25 / 0.5)",
              }}
            >
              UNSOLD
            </motion.div>

            {/* Subtitle */}
            <div
              className="font-broadcast tracking-widest"
              style={{
                fontSize: 14,
                color: "oklch(0.55 0.12 25)",
              }}
            >
              NO BIDS RECEIVED
            </div>

            {/* Player name */}
            {player && (
              <div
                className="font-broadcast text-3xl tracking-wider"
                style={{ color: "oklch(0.88 0.015 90)" }}
              >
                {player.name.toUpperCase()}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Team table row ───────────────────────────────────────────────────────────
function TeamTableRow({
  team,
  isLeading,
  logoUrl,
  colors,
}: {
  team: IDBTeam;
  isLeading: boolean;
  logoUrl: string;
  colors: LiveColorTheme;
}) {
  const slots = 7 - Number(team.numberOfPlayers);
  const pct =
    Number(team.purseAmountTotal) > 0
      ? (Number(team.purseAmountLeft) / Number(team.purseAmountTotal)) * 100
      : 0;

  return (
    <motion.div
      layout
      className="flex items-center gap-2 px-2 py-2.5 rounded transition-all"
      style={{
        background: isLeading ? colors.teamRowLeadingBg : colors.teamRowBg,
        border: isLeading
          ? `1px solid ${colors.teamRowLeadingBorder}`
          : "1px solid transparent",
      }}
    >
      {/* Logo */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={team.name}
          className="rounded-full flex-shrink-0"
          style={{ width: 28, height: 28, objectFit: "cover" }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-broadcast text-xs flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            background: colors.playerImageBg,
            color: colors.goldAccent,
            fontSize: 9,
            fontWeight: 900,
          }}
        >
          {teamInitials(team.name).slice(0, 2)}
        </div>
      )}

      {/* Name */}
      <span
        className="font-broadcast tracking-wide truncate flex-1 text-left"
        style={{
          fontSize: 13,
          color: isLeading ? colors.teamRowLeadingText : colors.teamRowText,
        }}
      >
        {team.name}
      </span>

      {/* Purse bar + value */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className="rounded-full overflow-hidden"
          style={{ width: 50, height: 5, background: colors.playerImageBg }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct > 40 ? colors.goldAccent : colors.bowlerColor,
            }}
          />
        </div>
        <span
          className="font-digital"
          style={{
            fontSize: 11,
            color: isLeading ? colors.goldAccent : colors.secondaryText,
          }}
        >
          {fmt(team.purseAmountLeft)}
        </span>
        <span
          className="font-broadcast"
          style={{ color: colors.secondaryText, fontSize: 11 }}
        >
          {slots}SL
        </span>
      </div>
    </motion.div>
  );
}

// ─── Squad overlay helpers ────────────────────────────────────────────────────
type SquadSlotType = "owner" | "icon" | "auction-filled" | "auction-empty";

interface SquadSlotProps {
  type: SquadSlotType;
  name?: string;
  photo?: string;
  category?: string;
  soldPrice?: number;
  slotNumber?: number;
}

function getSquadCatColor(cat: string) {
  const c = cat.toLowerCase();
  if (c === "batsman") return "oklch(0.7 0.15 140)";
  if (c === "bowler") return "oklch(0.65 0.18 25)";
  if (c === "allrounder") return "oklch(0.78 0.165 85)";
  return "oklch(0.55 0.02 90)";
}

function SquadPlayerSlot({
  type,
  name,
  photo,
  category,
  soldPrice,
  slotNumber,
}: SquadSlotProps) {
  const isFixed = type === "owner" || type === "icon";
  const isEmpty = type === "auction-empty";
  const catColor = category
    ? getSquadCatColor(category)
    : "oklch(0.55 0.02 90)";

  return (
    <div
      className="flex flex-col items-center flex-shrink-0"
      style={{ width: 66 }}
    >
      <div
        className="relative"
        style={{
          width: 52,
          height: 64,
          background: isEmpty
            ? "oklch(0.10 0.025 255)"
            : "oklch(0.14 0.04 255)",
          border: isEmpty
            ? "1px dashed oklch(0.22 0.04 255)"
            : isFixed
              ? `1px solid ${type === "owner" ? "oklch(0.78 0.165 85 / 0.5)" : "oklch(0.7 0.12 60 / 0.5)"}`
              : "1px solid oklch(0.35 0.06 255 / 0.5)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {isEmpty ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "oklch(0.22 0.04 255)" }}
          >
            <span className="font-broadcast" style={{ fontSize: 8 }}>
              {slotNumber ?? ""}
            </span>
          </div>
        ) : photo ? (
          <img
            src={photo}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-broadcast font-black"
            style={{ color: "oklch(0.25 0.04 255)", fontSize: 16 }}
          >
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        {type === "owner" && (
          <div
            className="absolute top-0.5 right-0.5 rounded-full p-0.5"
            style={{ background: "oklch(0.78 0.165 85 / 0.9)" }}
          >
            <Crown size={6} style={{ color: "oklch(0.08 0.02 265)" }} />
          </div>
        )}
        {type === "icon" && (
          <div
            className="absolute top-0.5 right-0.5 rounded-full p-0.5"
            style={{ background: "oklch(0.7 0.12 60 / 0.9)" }}
          >
            <Star size={6} style={{ color: "oklch(0.08 0.02 265)" }} />
          </div>
        )}

        {type === "auction-filled" && category && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 2, background: catColor }}
          />
        )}
      </div>

      <div
        className="font-broadcast tracking-wide text-center leading-tight mt-0.5"
        style={{
          fontSize: 7,
          color: isEmpty
            ? "oklch(0.25 0.02 90)"
            : isFixed
              ? "oklch(0.72 0.08 82)"
              : "oklch(0.72 0.015 90)",
          maxWidth: 64,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isEmpty ? "OPEN" : (name?.toUpperCase() ?? "")}
      </div>

      <div
        className="font-digital text-center"
        style={{
          fontSize: 6,
          color: isEmpty
            ? "oklch(0.2 0.02 90)"
            : type === "owner"
              ? "oklch(0.78 0.165 85)"
              : type === "icon"
                ? "oklch(0.7 0.12 60)"
                : "oklch(0.5 0.12 82)",
        }}
      >
        {isEmpty
          ? "—"
          : type === "owner"
            ? "200 PTS"
            : type === "icon"
              ? "300 PTS"
              : soldPrice != null
                ? `${fmt(soldPrice)}`
                : ""}
      </div>
    </div>
  );
}

interface SquadTeamRowProps {
  team: IDBTeam;
  players: IDBPlayer[];
  teamLogoUrl: string;
  ownerPhotoUrl: string;
  iconPhotoUrl: string;
}

function SquadTeamRow({
  team,
  players,
  teamLogoUrl,
  ownerPhotoUrl,
  iconPhotoUrl,
}: SquadTeamRowProps) {
  const boughtPlayers = players
    .filter((p) => p.status === "sold" && Number(p.soldTo) === Number(team.id))
    .sort((a, b) => Number(b.soldPrice ?? 0) - Number(a.soldPrice ?? 0));

  const isLocked = team.isTeamLocked;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded"
      style={{
        background: isLocked
          ? "oklch(0.55 0.15 140 / 0.06)"
          : "oklch(0.10 0.025 255)",
        border: isLocked
          ? "1px solid oklch(0.55 0.15 140 / 0.3)"
          : "1px solid oklch(0.18 0.04 255 / 0.6)",
      }}
    >
      {/* Team info */}
      <div
        className="flex flex-col items-center gap-1 flex-shrink-0"
        style={{ width: 72 }}
      >
        {teamLogoUrl ? (
          <img
            src={teamLogoUrl}
            alt={team.name}
            className="rounded-full"
            style={{
              width: 34,
              height: 34,
              objectFit: "cover",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
            }}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center font-broadcast font-black"
            style={{
              width: 34,
              height: 34,
              background: "oklch(0.15 0.05 255)",
              border: "1px solid oklch(0.78 0.165 85 / 0.3)",
              color: "oklch(0.78 0.165 85)",
              fontSize: 9,
            }}
          >
            {teamInitials(team.name).slice(0, 2)}
          </div>
        )}
        <div
          className="font-broadcast tracking-wide text-center leading-tight"
          style={{
            fontSize: 7,
            color: "oklch(0.65 0.02 90)",
            maxWidth: 70,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {team.name.toUpperCase()}
        </div>
        <div
          className="font-broadcast tracking-widest"
          style={{
            fontSize: 6,
            color: isLocked ? "oklch(0.65 0.18 140)" : "oklch(0.4 0.02 90)",
          }}
        >
          {Number(team.numberOfPlayers)}/7 {isLocked ? "✓ FULL" : "BOUGHT"}
        </div>
      </div>

      {/* Player slots */}
      <div
        className="flex gap-1.5 overflow-x-auto flex-1 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        <SquadPlayerSlot
          type="owner"
          name={team.ownerName}
          photo={ownerPhotoUrl}
        />
        <SquadPlayerSlot
          type="icon"
          name={team.teamIconPlayer}
          photo={iconPhotoUrl}
        />
        {Array.from({ length: 7 }).map((_, i) => {
          const player = boughtPlayers[i];
          const slotNum = i + 3;
          if (player) {
            return (
              <SquadPlayerSlot
                key={String(player.id)}
                type="auction-filled"
                name={player.name}
                photo={player.imageUrl}
                category={player.category}
                soldPrice={player.soldPrice}
              />
            );
          }
          return (
            <SquadPlayerSlot
              key={`slot-${slotNum}`}
              type="auction-empty"
              slotNumber={slotNum}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Connection indicator ──────────────────────────────────────────────────────
function ConnectionDot({
  backendOnline,
  isLoading,
}: {
  backendOnline: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2
          size={10}
          className="animate-spin"
          style={{ color: "oklch(0.75 0.12 82)" }}
        />
        <span
          className="font-broadcast tracking-widest"
          style={{ fontSize: 9, color: "oklch(0.55 0.02 90)" }}
        >
          LOADING...
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: backendOnline
            ? "oklch(0.65 0.18 140)"
            : "oklch(0.75 0.14 82)",
          boxShadow: backendOnline
            ? "0 0 6px oklch(0.65 0.18 140 / 0.8)"
            : "0 0 6px oklch(0.75 0.14 82 / 0.6)",
        }}
      />
      <span
        className="font-broadcast tracking-widest"
        style={{
          fontSize: 9,
          color: backendOnline ? "oklch(0.65 0.18 140)" : "oklch(0.75 0.14 82)",
        }}
      >
        {backendOnline ? "IDB SYNC" : "LOCAL"}
      </span>
    </div>
  );
}

// ─── Main LivePage ────────────────────────────────────────────────────────────
export default function LivePage() {
  // Primary source: IDB (instant, works offline on same device via BroadcastChannel)
  const idbData = useIdbAuctionData();
  const { teams, players, auctionState, isLoading } = idbData;

  // Secondary source: backend poll (for cross-device sync to projector laptop)
  const { actor } = useActor();
  const [backendOnline, setBackendOnline] = useState(false);

  // Background backend poll — writes to IDB, never blocks UI
  useEffect(() => {
    if (!actor) return;

    const poll = async () => {
      try {
        const [stateData, teamsData, playersData] = await Promise.all([
          actor.getAuctionState(),
          actor.getTeams(),
          actor.getPlayers(),
        ]);

        // Write backend data to IDB so it's available offline and via BroadcastChannel
        await idbStore.seedFromBackend(
          teamsData.map(convertTeam),
          playersData.map(convertPlayer),
          convertState(stateData),
        );

        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };

    // Run immediately
    void poll();

    // Poll every 2 seconds for cross-device sync
    const interval = setInterval(() => void poll(), 2000);
    return () => clearInterval(interval);
  }, [actor]);

  // Settings state
  const [layout, setLayout] = useState<LiveLayoutConfig>(() => getLiveLayout());
  const [colors, setColors] = useState<LiveColorTheme>(() => getLiveColors());
  const [showSquads, setShowSquads] = useState(false);
  const [league, setLeague] = useState(() => getLeagueSettings());
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>(() =>
    getTeamLogos(),
  );
  const [ownerPhotos, setOwnerPhotos] = useState<Record<string, string>>(() =>
    getOwnerPhotos(),
  );
  const [iconPhotos, setIconPhotos] = useState<Record<string, string>>(() =>
    getIconPhotos(),
  );

  const sortedSquadTeams = [...teams].sort(
    (a, b) => Number(a.id) - Number(b.id),
  );

  // Track sold / unsold overlay state — triggered by auction active→inactive transition
  const prevAuctionActiveRef = useRef<boolean>(false);
  const isFirstRenderRef = useRef<boolean>(true);
  const prevLeadingTeamIdRef = useRef<number | null>(null);
  const prevCurrentPlayerIdRef = useRef<number | null>(null);
  const prevCurrentBidRef = useRef<number>(0);

  const [soldOverlayVisible, setSoldOverlayVisible] = useState(false);
  const [lastSoldPlayer, setLastSoldPlayer] = useState<IDBPlayer | null>(null);
  const [lastSoldTeam, setLastSoldTeam] = useState<IDBTeam | null>(null);
  const soldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [unsoldOverlayVisible, setUnsoldOverlayVisible] = useState(false);
  const [lastUnsoldPlayer, setLastUnsoldPlayer] = useState<IDBPlayer | null>(
    null,
  );
  const unsoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply settings from all sources into state — memoized so it can be
  // safely included in useEffect dependency arrays without causing re-renders.
  const applySettingsToState = useCallback(
    (settings: {
      liveLayout: LiveLayoutConfig;
      liveColors: LiveColorTheme;
      league: ReturnType<typeof getLeagueSettings>;
      teamLogos: Record<string, string>;
      ownerPhotos: Record<string, string>;
      iconPhotos: Record<string, string>;
    }) => {
      setLayout(settings.liveLayout);
      setColors(settings.liveColors);
      setLeague(settings.league);
      setTeamLogos(settings.teamLogos);
      setOwnerPhotos(settings.ownerPhotos);
      setIconPhotos(settings.iconPhotos);
    },
    [],
  );

  // Load settings from backend on mount (and when actor becomes available).
  // Key fix for projector device: its localStorage is empty, so we pull the
  // canonical settings from ICP and populate both state and localStorage so
  // all subsequent localStorage reads are warm.
  const settingsLoadedRef = useRef(false);
  useEffect(() => {
    if (!actor || settingsLoadedRef.current) return;
    settingsLoadedRef.current = true;

    loadSettingsFromBackend(actor).then((settings) => {
      if (!settings) return;
      // Warm up localStorage on the projector device
      applySettingsToLocalStorage(settings);
      // Apply directly to React state — no round-trip through localStorage reads
      applySettingsToState({
        liveLayout: settings.liveLayout,
        liveColors: settings.liveColors,
        league: settings.league,
        teamLogos: settings.teamLogos,
        ownerPhotos: settings.ownerPhotos,
        iconPhotos: settings.iconPhotos,
      });
    });
  }, [actor, applySettingsToState]);

  // Re-sync settings from backend every 10 seconds — settings change infrequently
  // so we don't need to hammer the backend every 1.5s. This ensures logo/colour
  // changes made in Settings mid-event eventually appear on the projector.
  useEffect(() => {
    if (!actor) return;

    const interval = setInterval(() => {
      loadSettingsFromBackend(actor).then((settings) => {
        if (!settings) return;
        applySettingsToLocalStorage(settings);
        applySettingsToState({
          liveLayout: settings.liveLayout,
          liveColors: settings.liveColors,
          league: settings.league,
          teamLogos: settings.teamLogos,
          ownerPhotos: settings.ownerPhotos,
          iconPhotos: settings.iconPhotos,
        });
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [actor, applySettingsToState]);

  // Refresh layout + colors + league + logos from IDB (primary) + localStorage (fallback)
  // IDB is the canonical store — Settings always writes there first.
  // localStorage is kept as fallback for backend-synced projector devices.
  useEffect(() => {
    const refreshFromIdb = async () => {
      try {
        const [logosRaw, ownerRaw, iconRaw, leagueRaw, layoutRaw, colorsRaw] =
          await Promise.all([
            idbStore.getSetting("spl_team_logos"),
            idbStore.getSetting("spl_owner_photos"),
            idbStore.getSetting("spl_icon_photos"),
            idbStore.getSetting("spl_league_settings"),
            idbStore.getSetting("spl_live_layout"),
            idbStore.getSetting("spl_live_colors"),
          ]);

        const logos = logosRaw
          ? (JSON.parse(logosRaw) as Record<string, string>)
          : getTeamLogos();
        const owners = ownerRaw
          ? (JSON.parse(ownerRaw) as Record<string, string>)
          : getOwnerPhotos();
        const icons = iconRaw
          ? (JSON.parse(iconRaw) as Record<string, string>)
          : getIconPhotos();

        setTeamLogos((prev) => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(logos);
          return hasChanged ? logos : prev;
        });
        setOwnerPhotos((prev) => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(owners);
          return hasChanged ? owners : prev;
        });
        setIconPhotos((prev) => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(icons);
          return hasChanged ? icons : prev;
        });

        // League settings
        if (leagueRaw) {
          try {
            const leagueParsed = JSON.parse(leagueRaw) as typeof league;
            setLeague((prev) => {
              const hasChanged =
                JSON.stringify(prev) !== JSON.stringify(leagueParsed);
              return hasChanged ? leagueParsed : prev;
            });
          } catch {
            /* ignore */
          }
        }

        // Layout
        if (layoutRaw) {
          try {
            const layoutParsed = JSON.parse(layoutRaw) as LiveLayoutConfig;
            setLayout((prev) => {
              const hasChanged =
                JSON.stringify(prev) !== JSON.stringify(layoutParsed);
              return hasChanged
                ? { ...DEFAULT_LIVE_LAYOUT, ...layoutParsed }
                : prev;
            });
          } catch {
            /* ignore */
          }
        }

        // Colors
        if (colorsRaw) {
          try {
            const colorsParsed = JSON.parse(colorsRaw) as LiveColorTheme;
            setColors((prev) => {
              const hasChanged =
                JSON.stringify(prev) !== JSON.stringify(colorsParsed);
              return hasChanged
                ? { ...DEFAULT_LIVE_COLORS, ...colorsParsed }
                : prev;
            });
          } catch {
            /* ignore */
          }
        }
      } catch {
        // IDB not available — fall back to localStorage
        setLayout(getLiveLayout());
        setColors(getLiveColors());
        setLeague(getLeagueSettings());
        setTeamLogos(getTeamLogos());
        setOwnerPhotos(getOwnerPhotos());
        setIconPhotos(getIconPhotos());
      }
    };

    // Run immediately on mount
    void refreshFromIdb();

    // Poll every 3 seconds
    const interval = setInterval(() => void refreshFromIdb(), 3000);

    // React to IDB changes fired by Settings (same-device, same or different tab)
    const onIdbChange = () => void refreshFromIdb();
    window.addEventListener(IDB_CHANGE_EVENT, onIdbChange);

    // Also react to localStorage storage events (cross-tab fallback)
    const onStorage = () => void refreshFromIdb();
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener(IDB_CHANGE_EVENT, onIdbChange);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPlayer = auctionState?.currentPlayerId
    ? (players.find(
        (p) => Number(p.id) === Number(auctionState.currentPlayerId),
      ) ?? null)
    : null;

  const leadingTeam = auctionState?.leadingTeamId
    ? (teams.find((t) => Number(t.id) === Number(auctionState.leadingTeamId)) ??
      null)
    : null;

  // Detect sold / unsold: auction goes from active → inactive
  // Skip the very first render to avoid false positives on page load.
  useEffect(() => {
    if (!auctionState) return;

    const wasActive = prevAuctionActiveRef.current;
    const isNowActive = auctionState.isActive;

    if (
      !isFirstRenderRef.current &&
      wasActive === true &&
      isNowActive === false
    ) {
      const prevLeadingId = prevLeadingTeamIdRef.current;
      const prevPlayerId = prevCurrentPlayerIdRef.current;
      const prevBid = prevCurrentBidRef.current;

      if (prevLeadingId != null && prevPlayerId != null && prevBid > 0) {
        // Player was SOLD
        const soldPlayer =
          players.find(
            (p) => Number(p.id) === prevPlayerId && p.status === "sold",
          ) ??
          players.find((p) => Number(p.id) === prevPlayerId) ??
          null;
        const soldTeam =
          teams.find((t) => Number(t.id) === prevLeadingId) ?? null;

        setLastSoldPlayer(soldPlayer);
        setLastSoldTeam(soldTeam);
        setSoldOverlayVisible(true);

        if (soldTimerRef.current) clearTimeout(soldTimerRef.current);
        soldTimerRef.current = setTimeout(() => {
          setSoldOverlayVisible(false);
        }, 4000);
      } else {
        // Player went UNSOLD — no bids or no leading team
        const unsoldPlayer =
          prevPlayerId != null
            ? (players.find((p) => Number(p.id) === prevPlayerId) ?? null)
            : null;

        setLastUnsoldPlayer(unsoldPlayer);
        setUnsoldOverlayVisible(true);

        if (unsoldTimerRef.current) clearTimeout(unsoldTimerRef.current);
        unsoldTimerRef.current = setTimeout(() => {
          setUnsoldOverlayVisible(false);
        }, 3500);
      }
    }

    // Mark first render processed
    isFirstRenderRef.current = false;

    // Track current values for next comparison
    prevAuctionActiveRef.current = isNowActive;
    if (auctionState.leadingTeamId != null) {
      prevLeadingTeamIdRef.current = Number(auctionState.leadingTeamId);
    }
    prevCurrentPlayerIdRef.current =
      auctionState.currentPlayerId != null
        ? Number(auctionState.currentPlayerId)
        : null;
    prevCurrentBidRef.current = auctionState.currentBid;
  }, [auctionState, players, teams]);

  const sortedTeams = [...teams].sort(
    (a, b) => Number(b.purseAmountLeft) - Number(a.purseAmountLeft),
  );

  const catColor = currentPlayer
    ? getCategoryColor(currentPlayer.category, colors)
    : "oklch(0.55 0.02 90)";
  const rp = layout.rightPanelWidth;

  return (
    <div
      className="min-h-screen overflow-hidden relative broadcast-overlay"
      style={{ fontFamily: "inherit", background: colors.pageBg }}
    >
      {/* Background atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${colors.atmosphereBg}b3 0%, transparent 70%)`,
        }}
      />
      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${colors.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${colors.gridColor} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* SOLD Overlay */}
      <SoldOverlay
        visible={soldOverlayVisible}
        player={lastSoldPlayer}
        team={lastSoldTeam}
        teamLogoUrl={
          lastSoldTeam ? (teamLogos[String(lastSoldTeam.id)] ?? "") : ""
        }
        colors={colors}
      />

      {/* UNSOLD Overlay */}
      <UnsoldOverlay visible={unsoldOverlayVisible} player={lastUnsoldPlayer} />

      {/* Squads Overlay — z-40 so SOLD/UNSOLD overlay (z-50) still appears on top */}
      <AnimatePresence>
        {showSquads && (
          <motion.div
            key="squads-overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col"
            style={{ background: colors.pageBg }}
          >
            {/* Overlay header */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{
                background: colors.headerBg,
                borderBottom: `1px solid ${colors.goldAccent}33`,
              }}
            >
              <div className="flex items-center gap-3">
                {league.logoUrl ? (
                  <img
                    src={league.logoUrl}
                    alt={league.shortName}
                    style={{ height: 28, objectFit: "contain" }}
                  />
                ) : (
                  <div
                    className="font-broadcast font-black"
                    style={{
                      fontSize: 18,
                      color: colors.goldAccent,
                      textShadow: `0 0 16px ${colors.goldAccent}80`,
                    }}
                  >
                    {league.shortName || "SPL"}
                  </div>
                )}
                <div>
                  <div
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 14, color: colors.goldAccent }}
                  >
                    ALL SQUADS
                  </div>
                  <div
                    className="font-broadcast tracking-wide"
                    style={{ fontSize: 9, color: colors.secondaryText }}
                  >
                    {(
                      league.fullName || "SIDDHIVINAYAK PREMIER LEAGUE 2026"
                    ).toUpperCase()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSquads(false)}
                data-ocid="live.close_button"
                className="flex items-center gap-1.5 px-3 py-1.5 transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: `${colors.goldAccent}18`,
                  border: `1px solid ${colors.goldAccent}66`,
                  color: colors.goldAccent,
                }}
              >
                <X size={12} />
                <span
                  className="font-broadcast tracking-widest"
                  style={{ fontSize: 10 }}
                >
                  CLOSE
                </span>
              </button>
            </div>

            {/* Background atmosphere */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${colors.atmosphereBg}80 0%, transparent 70%)`,
              }}
            />

            {/* Scrollable squads content */}
            <div className="flex-1 overflow-y-auto relative z-10 px-3 py-3 space-y-2">
              {sortedSquadTeams.map((team) => (
                <SquadTeamRow
                  key={String(team.id)}
                  team={team}
                  players={players}
                  teamLogoUrl={teamLogos[String(team.id)] ?? ""}
                  ownerPhotoUrl={ownerPhotos[String(team.id)] ?? ""}
                  iconPhotoUrl={iconPhotos[String(team.id)] ?? ""}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-3"
        style={{
          background: colors.headerBg,
          borderBottom: `1px solid ${colors.goldAccent}33`,
        }}
      >
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          {league.logoUrl ? (
            <img
              src={league.logoUrl}
              alt={league.shortName}
              style={{ height: layout.headerLogoSize, objectFit: "contain" }}
            />
          ) : (
            <div
              className="font-broadcast font-black"
              style={{
                fontSize: layout.headerLogoSize * 0.8,
                color: colors.goldAccent,
                textShadow: `0 0 20px ${colors.goldAccent}80`,
              }}
            >
              {league.shortName || "SPL"}
            </div>
          )}
          <div>
            <div
              className="font-broadcast tracking-widest text-xs"
              style={{ color: colors.goldAccent }}
            >
              {(league.shortName || "SPL").toUpperCase()}
            </div>
            <div
              className="font-broadcast tracking-wide"
              style={{ fontSize: 10, color: colors.secondaryText }}
            >
              {(
                league.fullName || "SIDDHIVINAYAK PREMIER LEAGUE 2026"
              ).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Right side: SQUADS button + connection + Live indicator */}
        <div className="flex items-center gap-4">
          {/* SQUADS toggle button */}
          <button
            type="button"
            onClick={() => setShowSquads((v) => !v)}
            data-ocid="live.squads.toggle"
            className="flex items-center gap-1.5 px-3 py-1.5 transition-all hover:opacity-90 active:scale-95"
            style={{
              background: showSquads ? `${colors.goldAccent}22` : "transparent",
              border: `1px solid ${colors.goldAccent}${showSquads ? "aa" : "55"}`,
              color: colors.goldAccent,
              boxShadow: showSquads
                ? `0 0 12px ${colors.goldAccent}44`
                : "none",
            }}
          >
            {showSquads ? <X size={12} /> : <Users size={12} />}
            <span
              className="font-broadcast tracking-widest"
              style={{ fontSize: 10 }}
            >
              {showSquads ? "CLOSE" : "SQUADS"}
            </span>
          </button>

          {/* Connection indicator */}
          <ConnectionDot backendOnline={backendOnline} isLoading={isLoading} />

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: colors.liveDotColor }}
            />
            <span
              className="font-broadcast tracking-widest text-xs"
              style={{ color: colors.liveDotColor }}
            >
              LIVE
            </span>
            <span
              className="font-broadcast text-xs"
              style={{ color: colors.secondaryText }}
            >
              · {league.auctionYear || "PLAYER AUCTION 2026"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col md:flex-row h-[calc(100vh-57px)]">
        {/* Left: Player display */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 gap-4 md:gap-6 min-h-0">
          <AnimatePresence mode="wait">
            {currentPlayer ? (
              <motion.div
                key={String(currentPlayer.id)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Player photo */}
                <div className="relative">
                  {/* Gold corner brackets */}
                  {[
                    "top-0 left-0 border-t-2 border-l-2",
                    "top-0 right-0 border-t-2 border-r-2",
                    "bottom-0 left-0 border-b-2 border-l-2",
                    "bottom-0 right-0 border-b-2 border-r-2",
                  ].map((cls) => (
                    <div
                      key={cls}
                      className={`absolute w-5 h-5 ${cls}`}
                      style={{ borderColor: colors.goldAccent }}
                    />
                  ))}
                  <div
                    style={{
                      width: layout.playerImageWidth,
                      height: layout.playerImageHeight,
                      overflow: "hidden",
                      background: colors.playerImageBg,
                      position: "relative",
                    }}
                  >
                    {currentPlayer.imageUrl ? (
                      <img
                        src={currentPlayer.imageUrl}
                        alt={currentPlayer.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-broadcast text-6xl"
                        style={{ color: colors.secondaryText }}
                      >
                        {currentPlayer.name[0]?.toUpperCase()}
                      </div>
                    )}

                    {/* SOLD ribbon - bottom-left diagonal */}
                    <AnimatePresence>
                      {soldOverlayVisible &&
                        Number(lastSoldPlayer?.id) ===
                          Number(currentPlayer.id) && (
                          <motion.div
                            key="sold-ribbon"
                            initial={{ opacity: 0, x: -40, y: 40 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0"
                            style={{
                              width: "180%",
                              transform:
                                "rotate(-35deg) translateX(-40%) translateY(60%)",
                              transformOrigin: "bottom left",
                              background:
                                "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.2 25))",
                              padding: "6px 0",
                              textAlign: "center",
                            }}
                          >
                            <span
                              className="font-broadcast font-black tracking-widest"
                              style={{
                                fontSize: 22,
                                color: "oklch(0.08 0.02 265)",
                              }}
                            >
                              SOLD!
                            </span>
                          </motion.div>
                        )}
                    </AnimatePresence>

                    {/* UNSOLD ribbon - top-right diagonal */}
                    <AnimatePresence>
                      {unsoldOverlayVisible &&
                        Number(lastUnsoldPlayer?.id) ===
                          Number(currentPlayer.id) && (
                          <motion.div
                            key="unsold-ribbon"
                            initial={{ opacity: 0, x: 40, y: -40 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-0 right-0"
                            style={{
                              width: "180%",
                              transform:
                                "rotate(-35deg) translateX(20%) translateY(-40%)",
                              transformOrigin: "top right",
                              background:
                                "linear-gradient(135deg, oklch(0.65 0.22 25), oklch(0.45 0.18 25))",
                              padding: "6px 0",
                              textAlign: "center",
                            }}
                          >
                            <span
                              className="font-broadcast font-black tracking-widest"
                              style={{
                                fontSize: 18,
                                color: "oklch(0.95 0.01 90)",
                              }}
                            >
                              UNSOLD
                            </span>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  {/* Category badge */}
                  <div
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 font-broadcast tracking-widest"
                    style={{
                      background: `${catColor}22`,
                      border: `1px solid ${catColor}66`,
                      color: catColor,
                      fontSize: Math.round(
                        11 * (layout.categoryBadgeSize / 100),
                      ),
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayCategory(currentPlayer.category)}
                  </div>
                </div>

                {/* Player name */}
                <div
                  className="font-broadcast tracking-wider text-center mt-4"
                  style={{
                    fontSize: Math.round(36 * (layout.playerNameSize / 100)),
                    color: colors.primaryText,
                    textShadow: `0 2px 20px ${colors.pageBg}cc`,
                  }}
                >
                  {currentPlayer.name.toUpperCase()}
                </div>

                {/* Base price */}
                <div
                  className="flex items-center gap-2 px-4 py-1"
                  style={{
                    background: `${colors.playerImageBg}b3`,
                    border: `1px solid ${colors.silverAccent}33`,
                  }}
                >
                  <span
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 11, color: colors.secondaryText }}
                  >
                    BASE PRICE
                  </span>
                  <span
                    className="font-digital"
                    style={{ fontSize: 14, color: colors.goldAccent }}
                  >
                    {fmt(currentPlayer.basePrice)} PTS
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-player"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div
                  className="font-broadcast text-2xl tracking-widest mb-2"
                  style={{ color: colors.secondaryText }}
                >
                  AWAITING
                </div>
                <div
                  className="font-broadcast text-xl tracking-widest"
                  style={{ color: `${colors.goldAccent}55` }}
                >
                  NEXT PLAYER
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bid counter area */}
          {auctionState && (
            <div className="flex flex-col items-center gap-3">
              {/* Current bid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={String(auctionState.currentBid)}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="font-digital font-bold"
                  style={{
                    fontSize: Math.round(80 * (layout.bidCounterSize / 100)),
                    color: auctionState.isActive
                      ? colors.bidCounterColor
                      : colors.secondaryText,
                    textShadow: auctionState.isActive
                      ? `0 0 40px ${colors.bidCounterGlow}, 0 0 80px ${colors.bidCounterGlow}66`
                      : "none",
                    lineHeight: 1,
                  }}
                >
                  {fmt(auctionState.currentBid)}
                </motion.div>
              </AnimatePresence>
              <div
                className="font-broadcast tracking-widest"
                style={{ fontSize: 11, color: colors.secondaryText }}
              >
                CURRENT BID (PTS)
              </div>

              {/* Leading team */}
              <AnimatePresence mode="wait">
                {leadingTeam ? (
                  <motion.div
                    key={String(leadingTeam.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 px-5 py-2"
                    style={{
                      background: colors.leadingTeamBg,
                      border: `1px solid ${colors.goldAccent}66`,
                    }}
                  >
                    {teamLogos[String(leadingTeam.id)] ? (
                      <img
                        src={teamLogos[String(leadingTeam.id)]}
                        alt={leadingTeam.name}
                        className="rounded-full"
                        style={{ width: 32, height: 32, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded-full flex items-center justify-center font-broadcast text-xs font-black"
                        style={{
                          width: 32,
                          height: 32,
                          background: colors.playerImageBg,
                          color: colors.goldAccent,
                          fontSize: 10,
                        }}
                      >
                        {teamInitials(leadingTeam.name).slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div
                        className="font-broadcast tracking-widest"
                        style={{
                          fontSize: Math.round(
                            13 * (layout.leadingTeamSize / 100),
                          ),
                          color: colors.leadingTeamText,
                        }}
                      >
                        {leadingTeam.name.toUpperCase()}
                      </div>
                      <div
                        className="font-broadcast tracking-widest"
                        style={{
                          fontSize: 9,
                          color: `${colors.leadingTeamText}88`,
                        }}
                      >
                        LEADING BID
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-leader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-broadcast tracking-widest"
                    style={{ fontSize: 11, color: colors.secondaryText }}
                  >
                    NO BIDS YET
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right panel: teams — desktop vertical, mobile horizontal strip */}
        {/* Desktop */}
        <div
          className="hidden md:flex flex-col gap-3 py-4 px-3 overflow-hidden"
          style={{
            width: rp,
            minWidth: rp,
            borderLeft: `1px solid ${colors.goldAccent}1f`,
            background: colors.rightPanelBg,
          }}
        >
          <div
            className="font-broadcast tracking-widest"
            style={{ fontSize: 10, color: colors.secondaryText }}
          >
            TEAM STANDINGS
          </div>

          {/* Team list — no scroll, all 10 teams fill the panel */}
          <div className="flex flex-col gap-1.5 flex-1">
            {sortedTeams.map((team) => (
              <TeamTableRow
                key={String(team.id)}
                team={team}
                isLeading={
                  Number(team.id) === Number(auctionState?.leadingTeamId ?? -1)
                }
                logoUrl={teamLogos[String(team.id)] ?? ""}
                colors={colors}
              />
            ))}
          </div>
        </div>

        {/* Mobile: compact horizontal team strip at bottom */}
        <div
          className="md:hidden flex-shrink-0 py-2 px-2 overflow-x-auto"
          style={{
            borderTop: `1px solid ${colors.goldAccent}1f`,
            background: colors.rightPanelBg,
            scrollbarWidth: "none",
          }}
        >
          <div className="flex gap-2 min-w-max">
            {sortedTeams.map((team) => {
              const isLeading =
                Number(team.id) === Number(auctionState?.leadingTeamId ?? -1);
              const logoUrl = teamLogos[String(team.id)] ?? "";
              return (
                <div
                  key={String(team.id)}
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded"
                  style={{
                    background: isLeading
                      ? colors.teamRowLeadingBg
                      : "transparent",
                    border: isLeading
                      ? `1px solid ${colors.teamRowLeadingBorder}`
                      : "1px solid transparent",
                    minWidth: 52,
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={team.name}
                      className="rounded-full"
                      style={{ width: 22, height: 22, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-full flex items-center justify-center font-broadcast"
                      style={{
                        width: 22,
                        height: 22,
                        background: colors.playerImageBg,
                        color: colors.goldAccent,
                        fontSize: 7,
                        fontWeight: 900,
                      }}
                    >
                      {teamInitials(team.name).slice(0, 2)}
                    </div>
                  )}
                  <span
                    className="font-broadcast tracking-wide text-center"
                    style={{
                      fontSize: 7,
                      color: isLeading
                        ? colors.teamRowLeadingText
                        : colors.teamRowText,
                      maxWidth: 50,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {teamInitials(team.name)}
                  </span>
                  <span
                    className="font-digital"
                    style={{
                      fontSize: 8,
                      color: isLeading
                        ? colors.goldAccent
                        : colors.secondaryText,
                    }}
                  >
                    {fmt(team.purseAmountLeft)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
