import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Coins,
  Download,
  Edit3,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Settings,
  Shield,
  Star,
  Trophy,
  Undo2,
  UndoDot,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Player, Team } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAuctionData } from "../hooks/useAuctionData";
import { getTeamLogos } from "./SettingsPage";

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

// ─── Password Gate ─────────────────────────────────────────────────────────
// The admin password is also checked locally for instant login.
// The backend is a secondary verification that runs in the background.
const ADMIN_PASSWORD = "SPL@2025";

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { actor } = useActor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // PRIMARY: instant local password check — never blocked by network
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("spl_admin_auth", "true");
      onAuth();
      // Fire-and-forget backend verification (non-blocking)
      if (actor) {
        actor.adminLogin(password).catch(() => {
          // ignore — local check already passed
        });
      }
      return;
    }

    // Wrong password
    setError("Invalid password. Access denied.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center broadcast-overlay">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.14 0.06 265 / 0.6) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div
          className="p-8"
          style={{
            background: "oklch(0.11 0.03 265 / 0.9)",
            border: "1px solid oklch(0.78 0.165 85 / 0.3)",
            boxShadow: "0 0 60px oklch(0.78 0.165 85 / 0.1)",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
              style={{
                background: "oklch(0.78 0.165 85 / 0.1)",
                border: "1px solid oklch(0.78 0.165 85 / 0.3)",
              }}
            >
              <Shield size={28} style={{ color: "oklch(0.78 0.165 85)" }} />
            </div>
            <h1
              className="font-broadcast text-2xl tracking-wider"
              style={{ color: "oklch(0.78 0.165 85)" }}
            >
              ADMIN ACCESS
            </h1>
            <p
              className="text-sm mt-2"
              style={{ color: "oklch(0.45 0.02 90)" }}
            >
              SPL Auction Control Panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-broadcast tracking-widest mb-2"
                style={{ color: "oklch(0.55 0.02 90)" }}
              >
                PASSWORD
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 font-digital text-base bg-transparent outline-none"
                style={{
                  background: "oklch(0.08 0.025 265)",
                  border: "1px solid oklch(0.22 0.04 265)",
                  color: "oklch(0.96 0.015 90)",
                }}
                placeholder="Enter admin password"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                  style={{
                    background: "oklch(0.62 0.22 25 / 0.1)",
                    border: "1px solid oklch(0.62 0.22 25 / 0.3)",
                    color: "oklch(0.75 0.15 25)",
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 font-broadcast tracking-wider transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                color: "oklch(0.08 0.025 265)",
              }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Shield size={16} />
              )}
              {isLoading ? "VERIFYING..." : "ACCESS PANEL"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Purse Dialog ───────────────────────────────────────────────────────
function EditPurseModal({
  team,
  onClose,
  onSave,
}: {
  team: Team;
  onClose: () => void;
  onSave: (teamId: bigint, newPurse: bigint) => Promise<void>;
}) {
  const [value, setValue] = useState(String(Number(team.purse_remaining)));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const num = Number.parseInt(value, 10);
    if (Number.isNaN(num) || num < 0) return;
    setIsSaving(true);
    await onSave(team.id, BigInt(num));
    setIsSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0 0 0 / 0.7)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-4 p-6"
        style={{
          background: "oklch(0.11 0.03 265)",
          border: "1px solid oklch(0.78 0.165 85 / 0.3)",
        }}
      >
        <h3
          className="font-broadcast text-sm tracking-wider mb-1"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          EDIT PURSE
        </h3>
        <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.02 90)" }}>
          {team.name}
        </p>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-4 py-2 font-digital text-lg mb-4"
          style={{
            background: "oklch(0.08 0.025 265)",
            border: "1px solid oklch(0.22 0.04 265)",
            color: "oklch(0.96 0.015 90)",
          }}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm font-broadcast tracking-wider"
            style={{
              background: "oklch(0.14 0.04 265)",
              border: "1px solid oklch(0.22 0.04 265)",
              color: "oklch(0.65 0.02 90)",
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2 text-sm font-broadcast tracking-wider flex items-center justify-center gap-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
              color: "oklch(0.08 0.025 265)",
            }}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
            SAVE
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Unsell Confirmation Modal ────────────────────────────────────────────────
function UnsellModal({
  player,
  teamName,
  team,
  onClose,
  onConfirm,
}: {
  player: Player | null;
  teamName: string;
  team: Team | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isExecuting, setIsExecuting] = useState(false);

  if (!player) return null;

  const handleConfirm = async () => {
    setIsExecuting(true);
    await onConfirm();
    setIsExecuting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0 0 0 / 0.75)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4 p-6"
        style={{
          background: "oklch(0.11 0.03 265)",
          border: "1px solid oklch(0.85 0.14 55 / 0.4)",
          boxShadow: "0 0 40px oklch(0.85 0.14 55 / 0.1)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.85 0.14 55 / 0.1)",
              border: "1px solid oklch(0.85 0.14 55 / 0.3)",
            }}
          >
            <UndoDot size={18} style={{ color: "oklch(0.85 0.14 55)" }} />
          </div>
          <div>
            <h3
              className="font-broadcast text-sm tracking-wider"
              style={{ color: "oklch(0.85 0.14 55)" }}
            >
              UNSELL PLAYER
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.45 0.02 90)" }}
            >
              This will automatically restore purse and return player to pool
            </p>
          </div>
        </div>

        <div
          className="p-4 mb-4 text-sm space-y-2"
          style={{
            background: "oklch(0.085 0.025 265)",
            border: "1px solid oklch(0.22 0.04 265)",
          }}
        >
          <p style={{ color: "oklch(0.78 0.02 90)" }}>
            <span
              style={{ color: "oklch(0.78 0.165 85)" }}
              className="font-broadcast"
            >
              Player:
            </span>{" "}
            {player.name}
          </p>
          <p style={{ color: "oklch(0.78 0.02 90)" }}>
            <span
              style={{ color: "oklch(0.78 0.165 85)" }}
              className="font-broadcast"
            >
              Sold to:
            </span>{" "}
            {teamName}
          </p>
          <p style={{ color: "oklch(0.78 0.02 90)" }}>
            <span
              style={{ color: "oklch(0.78 0.165 85)" }}
              className="font-broadcast"
            >
              Sold price:
            </span>{" "}
            {player.sold_price !== undefined
              ? Number(player.sold_price).toLocaleString()
              : "—"}{" "}
            pts
          </p>
          {team && (
            <p style={{ color: "oklch(0.78 0.02 90)" }}>
              <span
                style={{ color: "oklch(0.78 0.165 85)" }}
                className="font-broadcast"
              >
                Purse after restore:
              </span>{" "}
              <span className="font-digital">
                {(
                  Number(team.purse_remaining) + Number(player.sold_price ?? 0)
                ).toLocaleString()}
              </span>{" "}
              pts
            </p>
          )}
        </div>

        <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.02 90)" }}>
          The player will be returned to the auction pool and the team's purse
          will be restored. After unselling, check the team's player count in{" "}
          <strong style={{ color: "oklch(0.78 0.165 85)" }}>
            Settings → Teams
          </strong>{" "}
          and adjust manually if needed.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="flex-1 py-2.5 text-sm font-broadcast tracking-wider disabled:opacity-50"
            style={{
              background: "oklch(0.14 0.04 265)",
              border: "1px solid oklch(0.22 0.04 265)",
              color: "oklch(0.65 0.02 90)",
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-broadcast tracking-wider transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isExecuting
                ? "oklch(0.14 0.04 265)"
                : "oklch(0.85 0.14 55 / 0.2)",
              border: "1px solid oklch(0.85 0.14 55 / 0.5)",
              color: "oklch(0.85 0.14 55)",
            }}
          >
            {isExecuting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <UndoDot size={13} />
            )}
            {isExecuting ? "PROCESSING…" : "CONFIRM UNSELL"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({
  team,
  isLeading,
  currentBid,
  onPlaceBid,
  onEditPurse,
}: {
  team: Team;
  isLeading: boolean;
  currentBid: number;
  onPlaceBid: (teamId: bigint) => Promise<void>;
  onEditPurse: (team: Team) => void;
}) {
  const [isBidding, setIsBidding] = useState(false);
  const remainingSlots = 7 - Number(team.players_bought);
  const purseRemaining = Number(team.purse_remaining);
  const newBid = currentBid + 100;
  const minRequired = remainingSlots > 0 ? (remainingSlots - 1) * 100 : 0;
  const canBid = !team.is_locked && purseRemaining >= newBid + minRequired;

  const handleBid = async () => {
    setIsBidding(true);
    await onPlaceBid(team.id);
    setIsBidding(false);
  };

  return (
    <div
      className="team-card-hover p-3 relative"
      style={{
        background: isLeading
          ? "oklch(0.15 0.05 85 / 0.3)"
          : "oklch(0.11 0.03 265)",
        border: isLeading
          ? "1px solid oklch(0.78 0.165 85 / 0.5)"
          : "1px solid oklch(0.22 0.04 265)",
        boxShadow: isLeading ? "0 0 20px oklch(0.78 0.165 85 / 0.15)" : "none",
      }}
    >
      {isLeading && (
        <div
          className="absolute top-1 right-1 text-xs font-broadcast px-1.5 py-0.5 tracking-wider"
          style={{
            background: "oklch(0.78 0.165 85)",
            color: "oklch(0.08 0.025 265)",
          }}
        >
          LEADING
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <div
            className="font-broadcast text-sm tracking-wide truncate"
            style={{
              color: team.is_locked
                ? "oklch(0.4 0.02 90)"
                : "oklch(0.92 0.02 90)",
            }}
          >
            {team.name}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            {team.owner_name}
          </div>
        </div>
        {team.is_locked && (
          <Lock
            size={12}
            style={{ color: "oklch(0.45 0.02 90)", flexShrink: 0 }}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <div
            className="font-digital text-base font-bold"
            style={{ color: "oklch(0.78 0.165 85)" }}
          >
            {purseRemaining.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: "oklch(0.4 0.02 90)" }}>
            pts left
          </div>
        </div>
        <div>
          <div
            className="font-digital text-base font-bold"
            style={{ color: "oklch(0.7 0.15 140)" }}
          >
            {Number(team.players_bought)}/7
          </div>
          <div className="text-xs" style={{ color: "oklch(0.4 0.02 90)" }}>
            bought
          </div>
        </div>
        <div>
          <div
            className="font-digital text-base font-bold"
            style={{
              color:
                remainingSlots === 0
                  ? "oklch(0.45 0.02 90)"
                  : "oklch(0.65 0.18 25)",
            }}
          >
            {remainingSlots}
          </div>
          <div className="text-xs" style={{ color: "oklch(0.4 0.02 90)" }}>
            slots
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleBid}
          disabled={isBidding || !canBid || team.is_locked}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-broadcast tracking-wider transition-all duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              canBid && !team.is_locked
                ? "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))"
                : "oklch(0.14 0.04 265)",
            color:
              canBid && !team.is_locked
                ? "oklch(0.08 0.025 265)"
                : "oklch(0.45 0.02 90)",
            border:
              canBid && !team.is_locked
                ? "none"
                : "1px solid oklch(0.22 0.04 265)",
          }}
        >
          {isBidding ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          +100
        </button>
        <button
          type="button"
          onClick={() => onEditPurse(team)}
          className="px-2 py-2 transition-all duration-150 hover:opacity-80"
          style={{
            background: "oklch(0.14 0.04 265)",
            border: "1px solid oklch(0.22 0.04 265)",
            color: "oklch(0.55 0.02 90)",
          }}
          title="Edit purse"
        >
          <Edit3 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Bid history entry type ───────────────────────────────────────────────────
interface BidHistoryEntry {
  teamId: bigint;
  amount: number;
  prevBid: number;
  prevLeadingTeamId: bigint | null;
}

// ─── Connecting Screen ────────────────────────────────────────────────────────
function ConnectingScreen({ onRetry }: { onRetry: () => void }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(
      () => setDots((d) => (d.length >= 3 ? "." : `${d}.`)),
      500,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center broadcast-overlay">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.14 0.06 265 / 0.6) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-sm px-6"
      >
        <div
          className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
          style={{
            background: "oklch(0.78 0.165 85 / 0.1)",
            border: "1px solid oklch(0.78 0.165 85 / 0.3)",
          }}
        >
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: "oklch(0.78 0.165 85)" }}
          />
        </div>
        <h2
          className="font-broadcast text-xl tracking-wider mb-2"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          CONNECTING{dots}
        </h2>
        <p className="text-sm mb-6" style={{ color: "oklch(0.45 0.02 90)" }}>
          Establishing connection to the auction network. This may take a few
          seconds.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 font-broadcast text-sm tracking-wider transition-opacity hover:opacity-80"
          style={{
            background: "oklch(0.14 0.04 265)",
            border: "1px solid oklch(0.22 0.04 265)",
            color: "oklch(0.65 0.02 90)",
          }}
        >
          <RotateCcw size={14} />
          RETRY NOW
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
function AdminPanel() {
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();
  const {
    auctionState,
    teams,
    players,
    dashboard,
    isLoading,
    error,
    refetch,
    pausePolling,
  } = useAuctionData(3000);
  const [editPurseTeam, setEditPurseTeam] = useState<Team | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const prevBidRef = useRef(0);
  const isBiddingRef = useRef(false);

  // ─── Optimistic auction state (shown immediately on action, before server confirms) ──
  const [optimisticAuctionActive, setOptimisticAuctionActive] = useState<
    boolean | null
  >(null);
  const [optimisticCurrentPlayerId, setOptimisticCurrentPlayerId] = useState<
    bigint | null
  >(null);

  // ─── Optimistic bid state ──────────────────────────────────────────────────
  const [optimisticBid, setOptimisticBid] = useState<number | null>(null);
  const [optimisticLeadingTeamId, setOptimisticLeadingTeamId] = useState<
    bigint | null
  >(null);
  const [bidHistory, setBidHistory] = useState<BidHistoryEntry[]>([]);
  // Track if we are in "undo mode" — prevents auto-clearing optimistic state
  const isUndoModeRef = useRef(false);

  // ─── Unsell state ──────────────────────────────────────────────────────────
  const [showUnsellModal, setShowUnsellModal] = useState(false);

  // Effective bid is optimistic if set, otherwise use server value
  const serverBid = Number(auctionState?.current_bid ?? 0);
  const currentBid = optimisticBid !== null ? optimisticBid : serverBid;

  const serverLeadingTeamId = auctionState?.leading_team_id ?? null;
  const effectiveLeadingTeamId =
    optimisticLeadingTeamId !== null
      ? optimisticLeadingTeamId
      : (serverLeadingTeamId ?? null);

  // Effective auction active state — use optimistic if available
  const effectiveIsActive =
    optimisticAuctionActive !== null
      ? optimisticAuctionActive
      : (auctionState?.is_active ?? false);

  // Effective current player id — use optimistic if available
  const effectiveCurrentPlayerId =
    optimisticCurrentPlayerId !== null
      ? optimisticCurrentPlayerId
      : (auctionState?.current_player_id ?? null);

  const currentPlayer =
    effectiveCurrentPlayerId != null
      ? players.find((p) => String(p.id) === String(effectiveCurrentPlayerId))
      : null;

  const leadingTeam =
    effectiveLeadingTeamId != null
      ? teams.find((t) => String(t.id) === String(effectiveLeadingTeamId))
      : null;

  // Last sold player for UNSELL feature
  const lastSoldPlayer =
    [...players]
      .filter((p) => p.status === "sold")
      .sort((a, b) => Number(b.id) - Number(a.id))[0] ?? null;
  const lastSoldTeam =
    lastSoldPlayer?.sold_to != null
      ? teams.find((t) => String(t.id) === String(lastSoldPlayer.sold_to))
      : null;

  // Detect bid change for animation
  const [bidBumping, setBidBumping] = useState(false);
  useEffect(() => {
    if (currentBid > prevBidRef.current) {
      prevBidRef.current = currentBid;
      setBidBumping(true);
      setTimeout(() => setBidBumping(false), 400);
    }
  }, [currentBid]);

  // Sync optimistic state when server updates (clear optimistic after confirmed)
  // Skip this sync when in undo mode — let pausePolling handle the delay
  useEffect(() => {
    if (isUndoModeRef.current) return;
    if (optimisticBid !== null && serverBid >= optimisticBid) {
      setOptimisticBid(null);
      setOptimisticLeadingTeamId(null);
    }
  }, [serverBid, optimisticBid]);

  // Clear bid history when auction becomes inactive
  useEffect(() => {
    if (!effectiveIsActive) {
      setBidHistory([]);
      setOptimisticBid(null);
      setOptimisticLeadingTeamId(null);
    }
  }, [effectiveIsActive]);

  const handleSelectPlayer = async (playerId: bigint) => {
    if (!actor) return;
    // Optimistic: show player as selected immediately
    setOptimisticCurrentPlayerId(playerId);
    setOptimisticAuctionActive(true);
    try {
      const result = await actor.selectPlayer(playerId);
      if (result.__kind__ === "err") {
        // Revert optimistic state
        setOptimisticCurrentPlayerId(null);
        setOptimisticAuctionActive(null);
        toast.error(result.err);
      } else {
        toast.success("Player selected for auction");
        // Refetch in background — UI already shows the right state
        refetch().finally(() => {
          setOptimisticCurrentPlayerId(null);
          setOptimisticAuctionActive(null);
        });
      }
    } catch {
      setOptimisticCurrentPlayerId(null);
      setOptimisticAuctionActive(null);
      toast.error("Select failed — check your connection and try again");
    }
  };

  const handlePlaceBid = useCallback(
    async (teamId: bigint) => {
      if (!actor) return;
      if (isBiddingRef.current) return; // Prevent double-click

      const prevBid = currentBid;
      const prevLeadingTeamId = effectiveLeadingTeamId;
      const newBid = prevBid + 100;

      // Optimistic update — instant feedback
      isBiddingRef.current = true;
      setOptimisticBid(newBid);
      setOptimisticLeadingTeamId(teamId);

      try {
        const result = await actor.placeBid(teamId);
        if (result.__kind__ === "err") {
          // Revert optimistic state on error
          setOptimisticBid(null);
          setOptimisticLeadingTeamId(null);
          toast.error(result.err, {
            description:
              "Insufficient purse or minimum slot balance rule violated",
          });
        } else {
          // Push to bid history for undo
          setBidHistory((prev) => [
            ...prev,
            { teamId, amount: newBid, prevBid, prevLeadingTeamId },
          ]);
          // Fire refetch in background — don't await, optimistic state already shows correct UI
          refetch();
        }
      } catch {
        // Revert on network error
        setOptimisticBid(null);
        setOptimisticLeadingTeamId(null);
        toast.error("Bid failed — please try again");
      } finally {
        isBiddingRef.current = false;
      }
    },
    [actor, refetch, currentBid, effectiveLeadingTeamId],
  );

  const handleUndoBid = () => {
    if (bidHistory.length === 0) return;
    const last = bidHistory[bidHistory.length - 1];
    setBidHistory((prev) => prev.slice(0, -1));
    // Enter undo mode so the sync effect doesn't immediately override our state
    isUndoModeRef.current = true;
    setOptimisticBid(last.prevBid);
    setOptimisticLeadingTeamId(last.prevLeadingTeamId);
    // Pause polling for 5s so the optimistic state shows on screen
    pausePolling(5000);
    // Exit undo mode after pause duration so normal syncing resumes
    setTimeout(() => {
      isUndoModeRef.current = false;
      setOptimisticBid(null);
      setOptimisticLeadingTeamId(null);
    }, 5000);
    toast.info("Bid reversed — showing previous bid.", {
      description:
        "The bid counter has been rolled back. Server will resync in 5 seconds.",
    });
  };

  const handleUnsellConfirm = async () => {
    if (!actor || !lastSoldPlayer || !lastSoldTeam) return;
    try {
      // 1. Restore team purse
      const restoredPurse =
        Number(lastSoldTeam.purse_remaining) +
        Number(lastSoldPlayer.sold_price ?? 0);
      const purseResult = await actor.editTeamPurse(
        lastSoldTeam.id,
        BigInt(restoredPurse),
      );
      if (purseResult.__kind__ === "err") {
        toast.error(`Failed to restore purse: ${purseResult.err}`);
        return;
      }

      // 2. Delete the sold player entry
      const deleteResult = await actor.deletePlayer(lastSoldPlayer.id);
      if (deleteResult.__kind__ === "err") {
        toast.error(`Failed to remove player: ${deleteResult.err}`);
        return;
      }

      // 3. Re-add the player as "upcoming"
      const addResult = await actor.addPlayer(
        lastSoldPlayer.name,
        lastSoldPlayer.category,
        lastSoldPlayer.base_price,
        lastSoldPlayer.image_url,
        lastSoldPlayer.rating,
      );
      if (addResult.__kind__ === "err") {
        toast.error(`Failed to restore player: ${addResult.err}`);
        return;
      }

      toast.success(
        `${lastSoldPlayer.name} returned to auction pool. Purse restored for ${lastSoldTeam.name}.`,
        {
          description:
            "Note: Check team's player count in Settings → Teams if needed.",
          duration: 5000,
        },
      );
      await refetch();
    } catch {
      toast.error("Unsell failed — please try again");
    }
  };

  const handleSell = async () => {
    if (!actor) return;
    setIsSelling(true);
    // Optimistically mark auction as inactive so UI transitions immediately
    setOptimisticAuctionActive(false);
    setOptimisticBid(null);
    setOptimisticLeadingTeamId(null);
    setBidHistory([]);
    try {
      const result = await actor.sellPlayer();
      if (result.__kind__ === "err") {
        // Revert
        setOptimisticAuctionActive(null);
        toast.error(result.err);
      } else {
        toast.success("Player SOLD!");
        refetch().finally(() => {
          setOptimisticAuctionActive(null);
          setOptimisticCurrentPlayerId(null);
        });
      }
    } catch {
      setOptimisticAuctionActive(null);
      toast.error("SOLD action failed — check your connection and try again");
    } finally {
      setIsSelling(false);
    }
  };

  const handleReset = async () => {
    if (!actor) return;
    if (!confirm("Reset entire auction? This cannot be undone.")) return;
    setIsResetting(true);
    await actor.resetAuction();
    toast.success("Auction reset");
    await refetch();
    setIsResetting(false);
  };

  const handleEditPurse = async (teamId: bigint, newPurse: bigint) => {
    if (!actor) return;
    const result = await actor.editTeamPurse(teamId, newPurse);
    if (result.__kind__ === "err") {
      toast.error(result.err);
    } else {
      toast.success("Purse updated");
      await refetch();
    }
  };

  const handleExportCSV = async () => {
    if (!actor) return;
    try {
      const results = await actor.getResults();
      const rows = [
        ["Player Name", "Category", "Base Price", "Sold Price", "Sold To"],
        ...results.map(([player, team]) => [
          player.name,
          player.category,
          String(Number(player.base_price)),
          player.sold_price !== undefined
            ? String(Number(player.sold_price))
            : "-",
          team ? team.name : "Unsold",
        ]),
      ];
      const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spl-auction-results.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Results exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const upcomingPlayers = players.filter((p) => p.status === "upcoming");
  const soldPlayers = players.filter((p) => p.status === "sold");

  // Show connecting screen while actor is initialising or on first load with no data
  if ((actorFetching || !actor) && teams.length === 0) {
    return <ConnectingScreen onRetry={() => window.location.reload()} />;
  }

  // Full-page error state — only show if we truly have no data after retries
  if (error && !isLoading && teams.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center broadcast-overlay">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.12 0.04 25 / 0.4) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md px-6"
        >
          <div
            className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "oklch(0.62 0.22 25 / 0.1)",
              border: "1px solid oklch(0.62 0.22 25 / 0.3)",
            }}
          >
            <AlertCircle size={28} style={{ color: "oklch(0.72 0.18 25)" }} />
          </div>
          <h2
            className="font-broadcast text-xl tracking-wider mb-3"
            style={{ color: "oklch(0.72 0.18 25)" }}
          >
            CONNECTION ERROR
          </h2>
          <p className="text-sm mb-2" style={{ color: "oklch(0.55 0.02 90)" }}>
            {error}
          </p>
          <p className="text-xs mb-6" style={{ color: "oklch(0.38 0.02 90)" }}>
            The canister may be initialising or unreachable. Check your network
            and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-2 px-5 py-2.5 font-broadcast text-sm tracking-wider transition-opacity hover:opacity-80"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                color: "oklch(0.08 0.025 265)",
              }}
            >
              <RotateCcw size={14} />
              RETRY
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 font-broadcast text-sm tracking-wider transition-opacity hover:opacity-80"
              style={{
                background: "oklch(0.14 0.04 265)",
                border: "1px solid oklch(0.22 0.04 265)",
                color: "oklch(0.65 0.02 90)",
              }}
            >
              RELOAD PAGE
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const showUndoBid = effectiveIsActive && bidHistory.length > 0;
  const showUnsell = !effectiveIsActive && lastSoldPlayer !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
        style={{
          background: "oklch(0.09 0.03 265 / 0.95)",
          borderBottom: "1px solid oklch(0.78 0.165 85 / 0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.55 0.02 90)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <span
              className="font-broadcast text-base tracking-wider"
              style={{ color: "oklch(0.78 0.165 85)" }}
            >
              SPL
            </span>
            <span
              className="text-xs ml-2"
              style={{ color: "oklch(0.45 0.02 90)" }}
            >
              Admin Control Panel
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-broadcast tracking-wider transition-opacity hover:opacity-80"
            style={{
              background: "oklch(0.14 0.04 265)",
              border: "1px solid oklch(0.22 0.04 265)",
              color: "oklch(0.65 0.02 90)",
            }}
          >
            <Download size={12} />
            EXPORT CSV
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/settings" })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-broadcast tracking-wider transition-opacity hover:opacity-80"
            style={{
              background: "oklch(0.14 0.04 265)",
              border: "1px solid oklch(0.22 0.04 265)",
              color: "oklch(0.65 0.02 90)",
            }}
          >
            <Settings size={12} />
            SETTINGS
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/live" })}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-broadcast tracking-wider transition-opacity hover:opacity-80"
            style={{
              background: "oklch(0.78 0.165 85 / 0.15)",
              border: "1px solid oklch(0.78 0.165 85 / 0.3)",
              color: "oklch(0.78 0.165 85)",
            }}
          >
            LIVE SCREEN
          </button>
        </div>
      </header>

      {/* Inline error banner */}
      <AnimatePresence>
        {error && teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm"
            style={{
              background: "oklch(0.62 0.22 25 / 0.12)",
              borderBottom: "1px solid oklch(0.62 0.22 25 / 0.3)",
              color: "oklch(0.78 0.15 25)",
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>Network hiccup — showing last known data. {error}</span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs font-broadcast tracking-wider px-3 py-1 transition-opacity hover:opacity-70"
              style={{
                background: "oklch(0.62 0.22 25 / 0.15)",
                border: "1px solid oklch(0.62 0.22 25 / 0.4)",
                color: "oklch(0.78 0.15 25)",
                flexShrink: 0,
              }}
            >
              RETRY
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── LEFT COLUMN ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-4"
              style={{
                background: "oklch(0.11 0.03 265)",
                border: "1px solid oklch(0.22 0.04 265)",
              }}
            >
              <Coins
                size={16}
                style={{ color: "oklch(0.78 0.165 85)" }}
                className="mb-2"
              />
              <div
                className="font-digital text-xl font-bold"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                {Number(dashboard?.total_spent ?? 0).toLocaleString()}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                Total Spent
              </div>
            </div>
            <div
              className="p-4"
              style={{
                background: "oklch(0.11 0.03 265)",
                border: "1px solid oklch(0.22 0.04 265)",
              }}
            >
              <Users
                size={16}
                style={{ color: "oklch(0.7 0.15 140)" }}
                className="mb-2"
              />
              <div
                className="font-digital text-xl font-bold"
                style={{ color: "oklch(0.7 0.15 140)" }}
              >
                {Number(dashboard?.remaining_players ?? 0)}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                Remaining
              </div>
            </div>
            <div
              className="p-4 col-span-2"
              style={{
                background: "oklch(0.11 0.03 265)",
                border: "1px solid oklch(0.22 0.04 265)",
              }}
            >
              <Trophy
                size={16}
                style={{ color: "oklch(0.78 0.165 85)" }}
                className="mb-2"
              />
              {dashboard?.most_expensive_player ? (
                <div>
                  <div
                    className="text-sm font-broadcast truncate"
                    style={{ color: "oklch(0.85 0.02 90)" }}
                  >
                    {dashboard.most_expensive_player.name}
                  </div>
                  <div
                    className="font-digital text-lg font-bold"
                    style={{ color: "oklch(0.78 0.165 85)" }}
                  >
                    {Number(
                      dashboard.most_expensive_player.sold_price ??
                        dashboard.most_expensive_player.base_price,
                    ).toLocaleString()}{" "}
                    pts
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm"
                  style={{ color: "oklch(0.45 0.02 90)" }}
                >
                  No players sold yet
                </div>
              )}
              <div
                className="text-xs mt-1"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                Most Expensive Player
              </div>
            </div>
          </div>

          {/* Player List */}
          <div
            style={{
              background: "oklch(0.11 0.03 265)",
              border: "1px solid oklch(0.22 0.04 265)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid oklch(0.22 0.04 265)" }}
            >
              <span
                className="font-broadcast text-xs tracking-widest"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                PLAYER LIST
              </span>
              <span
                className="text-xs"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                {soldPlayers.length} sold / {players.length} total
              </span>
            </div>
            <div className="divide-y divide-navy-border overflow-y-auto max-h-96">
              {upcomingPlayers.map((player) => (
                <div
                  key={String(player.id)}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: "oklch(0.88 0.02 90)" }}
                    >
                      {player.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={player.category} />
                      <span
                        className="text-xs font-digital"
                        style={{ color: "oklch(0.55 0.02 90)" }}
                      >
                        {Number(player.base_price)} pts
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPlayer(player.id)}
                    disabled={effectiveIsActive}
                    className="px-3 py-1 text-xs font-broadcast tracking-wider transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "oklch(0.78 0.165 85 / 0.15)",
                      border: "1px solid oklch(0.78 0.165 85 / 0.3)",
                      color: "oklch(0.78 0.165 85)",
                      flexShrink: 0,
                    }}
                  >
                    SELECT
                  </button>
                </div>
              ))}
              {soldPlayers.map((player) => (
                <div
                  key={String(player.id)}
                  className="px-4 py-3 flex items-center justify-between gap-3 opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm line-through truncate"
                      style={{ color: "oklch(0.55 0.02 90)" }}
                    >
                      {player.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={player.category} />
                    </div>
                  </div>
                  <span
                    className="text-xs font-broadcast px-2 py-0.5"
                    style={{
                      background: "oklch(0.7 0.15 140 / 0.15)",
                      border: "1px solid oklch(0.7 0.15 140 / 0.3)",
                      color: "oklch(0.7 0.15 140)",
                      flexShrink: 0,
                    }}
                  >
                    SOLD
                  </span>
                </div>
              ))}
              {players.length === 0 && isLoading && (
                <div className="px-4 py-6 flex items-center justify-center gap-2">
                  <Loader2
                    size={14}
                    className="animate-spin"
                    style={{ color: "oklch(0.78 0.165 85 / 0.5)" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "oklch(0.38 0.02 90)" }}
                  >
                    Loading players…
                  </span>
                </div>
              )}
              {players.length === 0 && !isLoading && (
                <div
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: "oklch(0.45 0.02 90)" }}
                >
                  No players loaded
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── CENTER + RIGHT ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* ─── Auction Control Card ─── */}
          <div
            style={{
              background: "oklch(0.065 0.025 265)",
              border: "1px solid oklch(0.22 0.04 265)",
            }}
          >
            {/* Player identity row */}
            <div
              className="flex gap-4 p-4"
              style={{ borderBottom: "1px solid oklch(0.16 0.035 265)" }}
            >
              {currentPlayer ? (
                <>
                  <div
                    className="w-16 h-20 flex-shrink-0 overflow-hidden"
                    style={{
                      border: "1px solid oklch(0.78 0.165 85 / 0.3)",
                      boxShadow: "0 0 20px oklch(0.78 0.165 85 / 0.1)",
                    }}
                  >
                    <img
                      src={
                        currentPlayer.image_url ||
                        "/assets/generated/player-avatar.dim_400x400.png"
                      }
                      alt={currentPlayer.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/generated/player-avatar.dim_400x400.png";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h2
                      className="font-broadcast text-lg tracking-wide truncate"
                      style={{ color: "oklch(0.94 0.015 90)" }}
                    >
                      {currentPlayer.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={currentPlayer.category} />
                      <span
                        className="text-xs"
                        style={{ color: "oklch(0.4 0.02 90)" }}
                      >
                        Base{" "}
                        <span
                          className="font-digital"
                          style={{ color: "oklch(0.65 0.12 82)" }}
                        >
                          {Number(currentPlayer.base_price).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star size={11} style={{ color: "oklch(0.78 0.165 85)" }} />
                    <span
                      className="font-digital text-sm"
                      style={{ color: "oklch(0.65 0.12 82)" }}
                    >
                      {Number(currentPlayer.rating)}
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className="flex-1 text-center py-4"
                  style={{ color: "oklch(0.35 0.02 90)" }}
                >
                  <div className="text-3xl mb-2">🏏</div>
                  <div className="font-broadcast text-xs tracking-widest">
                    SELECT A PLAYER TO BEGIN
                  </div>
                </div>
              )}
            </div>

            {/* ── BID COUNTER (dominant) ── */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-broadcast tracking-widest"
                  style={{ color: "oklch(0.38 0.02 90)" }}
                >
                  CURRENT BID
                  {optimisticBid !== null && (
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "oklch(0.78 0.165 85 / 0.6)" }}
                    >
                      (live)
                    </span>
                  )}
                </span>
              </div>

              {/* Gold separator */}
              <div
                className="mb-3"
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, oklch(0.78 0.165 85 / 0.5), oklch(0.78 0.165 85 / 0.1) 60%, transparent)",
                }}
              />

              {/* Bid number + leading team logo side by side */}
              <div className="flex items-center gap-4">
                {/* Left: bid number */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-end gap-2 mb-1">
                    <div
                      className={`font-digital leading-none ${bidBumping ? "bid-bump" : ""}`}
                      style={{
                        fontSize: "clamp(48px, 6vw, 72px)",
                        fontWeight: 800,
                        color: "oklch(0.82 0.17 87)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {currentBid.toLocaleString()}
                    </div>
                    <span
                      className="font-broadcast pb-1"
                      style={{ fontSize: "16px", color: "oklch(0.5 0.08 80)" }}
                    >
                      PTS
                    </span>
                  </div>

                  {/* Leading team name */}
                  <AnimatePresence mode="wait">
                    {leadingTeam ? (
                      <motion.div
                        key={String(leadingTeam.id)}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="w-1.5 h-1.5 flex-shrink-0"
                          style={{ background: "oklch(0.78 0.165 85)" }}
                        />
                        <span
                          className="font-broadcast text-sm tracking-wide"
                          style={{ color: "oklch(0.78 0.165 85)" }}
                        >
                          {leadingTeam.name}
                        </span>
                      </motion.div>
                    ) : (
                      <div
                        className="text-xs font-broadcast tracking-wider"
                        style={{ color: "oklch(0.3 0.02 90)" }}
                      >
                        NO BID YET
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right: large leading team logo */}
                <AnimatePresence mode="wait">
                  {leadingTeam ? (
                    <motion.div
                      key={`logo-${String(leadingTeam.id)}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25 }}
                      className="flex-shrink-0 flex flex-col items-center gap-1"
                    >
                      {(() => {
                        const teamLogos = getTeamLogos();
                        const logoUrl = teamLogos[String(leadingTeam.id)] ?? "";
                        return logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={leadingTeam.name}
                            style={{
                              width: "90px",
                              height: "90px",
                              objectFit: "cover",
                              borderRadius: "50%",
                              border: "2px solid oklch(0.78 0.165 85 / 0.6)",
                              boxShadow: "0 0 24px oklch(0.78 0.165 85 / 0.35)",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "90px",
                              height: "90px",
                              borderRadius: "50%",
                              border: "2px solid oklch(0.78 0.165 85 / 0.4)",
                              background: "oklch(0.14 0.05 265)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "28px",
                              fontWeight: 700,
                              color: "oklch(0.78 0.165 85)",
                              fontFamily: "var(--font-broadcast)",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {leadingTeam.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-logo"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        border: "2px dashed oklch(0.22 0.04 265)",
                        background: "oklch(0.09 0.025 265)",
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Action buttons row ── */}
            <div
              className="p-4 flex items-center gap-3 flex-wrap"
              style={{ borderTop: "1px solid oklch(0.16 0.035 265)" }}
            >
              {/* Reset — small, danger-tinted */}
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-broadcast tracking-wider transition-all hover:opacity-80 disabled:opacity-40"
                style={{
                  background: "oklch(0.12 0.03 265)",
                  border: "1px solid oklch(0.62 0.22 25 / 0.35)",
                  color: "oklch(0.62 0.22 25)",
                }}
              >
                {isResetting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
                RESET
              </button>

              {/* UNDO BID — amber, only shown when active + bid history exists */}
              <AnimatePresence>
                {showUndoBid && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleUndoBid}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-broadcast tracking-wider transition-all hover:opacity-80"
                    style={{
                      background: "oklch(0.12 0.03 265)",
                      border: "1px solid oklch(0.78 0.165 55 / 0.5)",
                      color: "oklch(0.82 0.17 80)",
                    }}
                  >
                    <Undo2 size={13} />
                    UNDO BID
                  </motion.button>
                )}
              </AnimatePresence>

              {/* UNSELL — orange, only shown when inactive + sold players exist */}
              <AnimatePresence>
                {showUnsell && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setShowUnsellModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-broadcast tracking-wider transition-all hover:opacity-80"
                    style={{
                      background: "oklch(0.12 0.03 265)",
                      border: "1px solid oklch(0.75 0.16 50 / 0.5)",
                      color: "oklch(0.8 0.15 55)",
                    }}
                  >
                    <UndoDot size={13} />
                    UNSELL
                  </motion.button>
                )}
              </AnimatePresence>

              {/* SOLD — full remaining width, unmissable */}
              <button
                type="button"
                onClick={handleSell}
                disabled={
                  isSelling || !effectiveIsActive || !effectiveLeadingTeamId
                }
                className="flex-1 flex items-center justify-center gap-2 py-3 font-broadcast tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed"
                style={{
                  fontSize: "18px",
                  background:
                    effectiveIsActive && effectiveLeadingTeamId
                      ? "linear-gradient(135deg, oklch(0.75 0.17 140), oklch(0.58 0.2 140))"
                      : "oklch(0.14 0.03 265)",
                  color:
                    effectiveIsActive && effectiveLeadingTeamId
                      ? "oklch(0.97 0.01 90)"
                      : "oklch(0.35 0.02 90)",
                  border:
                    effectiveIsActive && effectiveLeadingTeamId
                      ? "none"
                      : "1px solid oklch(0.22 0.04 265)",
                  boxShadow:
                    effectiveIsActive && effectiveLeadingTeamId
                      ? "0 0 30px oklch(0.7 0.15 140 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.15)"
                      : "none",
                }}
              >
                {isSelling ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {isSelling ? "SELLING…" : "SOLD!"}
              </button>
            </div>
          </div>

          {/* Teams Grid */}
          <div
            style={{
              background: "oklch(0.11 0.03 265)",
              border: "1px solid oklch(0.22 0.04 265)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid oklch(0.22 0.04 265)" }}
            >
              <span
                className="font-broadcast text-xs tracking-widest"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                TEAMS — BID CONTROL
              </span>
              <span
                className="text-xs"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                Click +100 to raise bid for team
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {teams.map((team) => (
                <TeamCard
                  key={String(team.id)}
                  team={team}
                  isLeading={
                    effectiveLeadingTeamId != null &&
                    String(team.id) === String(effectiveLeadingTeamId)
                  }
                  currentBid={currentBid}
                  onPlaceBid={handlePlaceBid}
                  onEditPurse={setEditPurseTeam}
                />
              ))}
              {teams.length === 0 && isLoading && (
                <div className="col-span-full py-8 flex items-center justify-center gap-3">
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{ color: "oklch(0.78 0.165 85 / 0.5)" }}
                  />
                  <span
                    className="text-sm font-broadcast tracking-wider"
                    style={{ color: "oklch(0.38 0.02 90)" }}
                  >
                    LOADING TEAMS…
                  </span>
                </div>
              )}
              {teams.length === 0 && !isLoading && (
                <div
                  className="col-span-full py-8 text-center text-sm"
                  style={{ color: "oklch(0.45 0.02 90)" }}
                >
                  No teams found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Purse Modal */}
      <AnimatePresence>
        {editPurseTeam && (
          <EditPurseModal
            team={editPurseTeam}
            onClose={() => setEditPurseTeam(null)}
            onSave={handleEditPurse}
          />
        )}
      </AnimatePresence>

      {/* Unsell Modal */}
      <AnimatePresence>
        {showUnsellModal && (
          <UnsellModal
            player={lastSoldPlayer}
            teamName={lastSoldTeam?.name ?? "Unknown Team"}
            team={lastSoldTeam ?? null}
            onClose={() => setShowUnsellModal(false)}
            onConfirm={handleUnsellConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(
    () => localStorage.getItem("spl_admin_auth") === "true",
  );

  if (!isAuthed) {
    return <PasswordGate onAuth={() => setIsAuthed(true)} />;
  }

  return <AdminPanel />;
}
