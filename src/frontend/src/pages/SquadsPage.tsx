import { Copy, Crown, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIdbAuctionData } from "../hooks/useIdbAuctionData";
import type { IDBPlayer, IDBTeam } from "../idbStore";
import {
  getIconPhotos,
  getLeagueSettings,
  getOwnerPhotos,
  getTeamLogos,
} from "./LandingPage";

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return Number(n).toLocaleString();
}

function teamInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 3)
    .join("")
    .toUpperCase();
}

function getCategoryColor(cat: string) {
  const c = cat.toLowerCase();
  if (c === "batsman") return "oklch(0.7 0.15 140)";
  if (c === "bowler") return "oklch(0.65 0.18 25)";
  if (c === "allrounder") return "oklch(0.78 0.165 85)";
  return "oklch(0.55 0.02 90)";
}

// ─── Hammer Animation ─────────────────────────────────────────────────────────
interface HammerAnimData {
  type: "sold" | "unsold";
  playerName: string;
  teamName?: string;
  teamLogoUrl?: string;
  soldPrice?: number;
}

function HammerOverlay({
  data,
  visible,
}: {
  data: HammerAnimData | null;
  visible: boolean;
}) {
  if (!data) return null;

  // ── SOLD animation ────────────────────────────────────────────────────────
  if (data.type === "sold") {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            key="hammer-sold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="absolute inset-0"
              style={{ background: "oklch(0.04 0.02 265 / 0.8)" }}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="relative z-10 flex flex-col items-center gap-5 px-12 py-10"
              style={{
                background: "oklch(0.1 0.04 255 / 0.97)",
                border: "3px solid oklch(0.78 0.165 85)",
                boxShadow: "0 0 80px oklch(0.78 0.165 85 / 0.5)",
              }}
            >
              {/* Hammer emoji */}
              <motion.div
                animate={{ rotate: [0, -30, 10, -15, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ fontSize: 72, lineHeight: 1 }}
              >
                🔨
              </motion.div>

              {/* SOLD! text */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 1,
                }}
                className="font-broadcast font-black tracking-widest"
                style={{
                  fontSize: 56,
                  color: "oklch(0.78 0.165 85)",
                  textShadow: "0 0 40px oklch(0.78 0.165 85 / 0.7)",
                }}
              >
                SOLD!
              </motion.div>

              {/* Player name */}
              <div
                className="font-broadcast text-2xl tracking-wider"
                style={{ color: "oklch(0.88 0.015 90)" }}
              >
                {data.playerName.toUpperCase()}
              </div>

              {/* Team info */}
              {data.teamName && (
                <div className="flex items-center gap-3">
                  {data.teamLogoUrl ? (
                    <img
                      src={data.teamLogoUrl}
                      alt={data.teamName}
                      className="rounded-full"
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        border: "2px solid oklch(0.78 0.165 85 / 0.6)",
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-full flex items-center justify-center font-broadcast font-black text-xs"
                      style={{
                        width: 48,
                        height: 48,
                        background: "oklch(0.18 0.06 255)",
                        border: "2px solid oklch(0.78 0.165 85 / 0.5)",
                        color: "oklch(0.78 0.165 85)",
                      }}
                    >
                      {teamInitials(data.teamName).slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div
                      className="font-broadcast text-xl tracking-wider"
                      style={{ color: "oklch(0.88 0.12 82)" }}
                    >
                      {data.teamName.toUpperCase()}
                    </div>
                    {data.soldPrice != null && (
                      <div
                        className="font-digital text-lg"
                        style={{ color: "oklch(0.78 0.165 85)" }}
                      >
                        {fmt(data.soldPrice)} PTS
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

  // ── UNSOLD animation — red theme, slides in from top ─────────────────────
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hammer-unsold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Dark red tinted background */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0.08 0.06 25 / 0.95)" }}
          />
          {/* Panel slides down from top */}
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative z-10 flex flex-col items-center gap-5 px-12 py-10"
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

            {/* UNSOLD! text — red, flickering */}
            <motion.div
              animate={{ opacity: [1, 0.5, 1, 0.6, 1] }}
              transition={{
                duration: 0.7,
                repeat: Number.POSITIVE_INFINITY,
              }}
              className="font-broadcast font-black tracking-widest"
              style={{
                fontSize: 56,
                color: "oklch(0.72 0.22 25)",
                textShadow:
                  "0 0 40px oklch(0.72 0.22 25 / 0.9), 0 0 80px oklch(0.65 0.22 25 / 0.5)",
              }}
            >
              UNSOLD!
            </motion.div>

            {/* Subtitle */}
            <div
              className="font-broadcast tracking-widest"
              style={{ fontSize: 14, color: "oklch(0.55 0.12 25)" }}
            >
              NO BIDS RECEIVED
            </div>

            {/* Player name */}
            <div
              className="font-broadcast text-2xl tracking-wider"
              style={{ color: "oklch(0.88 0.015 90)" }}
            >
              {data.playerName.toUpperCase()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Player slot ──────────────────────────────────────────────────────────────
type SlotType = "owner" | "icon" | "auction-filled" | "auction-empty";

interface PlayerSlotProps {
  type: SlotType;
  name?: string;
  photo?: string;
  category?: string;
  soldPrice?: number;
  slotNumber?: number;
}

function PlayerSlot({
  type,
  name,
  photo,
  category,
  soldPrice,
  slotNumber,
}: PlayerSlotProps) {
  const isFixed = type === "owner" || type === "icon";
  const isEmpty = type === "auction-empty";
  const catColor = category
    ? getCategoryColor(category)
    : "oklch(0.55 0.02 90)";

  return (
    <div
      className="flex flex-col items-center flex-shrink-0"
      style={{ width: 72 }}
    >
      {/* Photo/placeholder */}
      <div
        className="relative"
        style={{
          width: 56,
          height: 70,
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
            <span className="font-broadcast" style={{ fontSize: 9 }}>
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
            style={{ color: "oklch(0.25 0.04 255)", fontSize: 18 }}
          >
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        {/* Fixed slot icon */}
        {type === "owner" && (
          <div
            className="absolute top-0.5 right-0.5 rounded-full p-0.5"
            style={{ background: "oklch(0.78 0.165 85 / 0.9)" }}
          >
            <Crown size={7} style={{ color: "oklch(0.08 0.02 265)" }} />
          </div>
        )}
        {type === "icon" && (
          <div
            className="absolute top-0.5 right-0.5 rounded-full p-0.5"
            style={{ background: "oklch(0.7 0.12 60 / 0.9)" }}
          >
            <Star size={7} style={{ color: "oklch(0.08 0.02 265)" }} />
          </div>
        )}

        {/* Category color bar */}
        {type === "auction-filled" && category && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 2, background: catColor }}
          />
        )}
      </div>

      {/* Name */}
      <div
        className="font-broadcast tracking-wide text-center leading-tight mt-1"
        style={{
          fontSize: 8,
          color: isEmpty
            ? "oklch(0.25 0.02 90)"
            : isFixed
              ? "oklch(0.72 0.08 82)"
              : "oklch(0.72 0.015 90)",
          maxWidth: 70,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isEmpty ? "OPEN" : (name?.toUpperCase() ?? "")}
      </div>

      {/* Price / label */}
      <div
        className="font-digital text-center"
        style={{
          fontSize: 7,
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

// ─── Team row ─────────────────────────────────────────────────────────────────
function TeamRow({
  team,
  players,
  teamLogoUrl,
  ownerPhotoUrl,
  iconPhotoUrl,
}: {
  team: IDBTeam;
  players: IDBPlayer[];
  teamLogoUrl: string;
  ownerPhotoUrl: string;
  iconPhotoUrl: string;
}) {
  const boughtPlayers = players
    .filter((p) => p.status === "sold" && Number(p.soldTo) === Number(team.id))
    .sort((a, b) => Number(b.soldPrice ?? 0) - Number(a.soldPrice ?? 0));

  const isLocked = team.isTeamLocked;
  const shareUrl = `${window.location.origin}/team/${team.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Visual feedback handled by button
    });
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={{
        background: isLocked
          ? "oklch(0.55 0.15 140 / 0.06)"
          : "oklch(0.10 0.025 255)",
        border: isLocked
          ? "1px solid oklch(0.55 0.15 140 / 0.3)"
          : "1px solid oklch(0.18 0.04 255 / 0.6)",
      }}
    >
      {/* Team info (fixed width) */}
      <div
        className="flex flex-col items-center gap-1 flex-shrink-0"
        style={{ width: 80 }}
      >
        {teamLogoUrl ? (
          <img
            src={teamLogoUrl}
            alt={team.name}
            className="rounded-full"
            style={{
              width: 38,
              height: 38,
              objectFit: "cover",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
            }}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center font-broadcast font-black"
            style={{
              width: 38,
              height: 38,
              background: "oklch(0.15 0.05 255)",
              border: "1px solid oklch(0.78 0.165 85 / 0.3)",
              color: "oklch(0.78 0.165 85)",
              fontSize: 10,
            }}
          >
            {teamInitials(team.name).slice(0, 2)}
          </div>
        )}
        <div
          className="font-broadcast tracking-wide text-center leading-tight"
          style={{
            fontSize: 8,
            color: "oklch(0.65 0.02 90)",
            maxWidth: 78,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {team.name.toUpperCase()}
        </div>
        {isLocked && (
          <span
            className="font-broadcast tracking-widest"
            style={{ fontSize: 7, color: "oklch(0.65 0.18 140)" }}
          >
            ✓ FULL
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-0.5 transition-opacity hover:opacity-70 active:scale-90"
          title="Copy team link"
        >
          <Copy size={8} style={{ color: "oklch(0.4 0.02 90)" }} />
          <span
            className="font-broadcast"
            style={{ fontSize: 7, color: "oklch(0.35 0.02 90)" }}
          >
            SHARE
          </span>
        </button>
      </div>

      {/* Slots — horizontal scroll */}
      <div
        className="flex gap-2 overflow-x-auto flex-1 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Slot 1: Owner */}
        <PlayerSlot type="owner" name={team.ownerName} photo={ownerPhotoUrl} />
        {/* Slot 2: Icon */}
        <PlayerSlot
          type="icon"
          name={team.teamIconPlayer}
          photo={iconPhotoUrl}
        />
        {/* Slots 3-9: Auction */}
        {Array.from({ length: 7 }).map((_, i) => {
          const player = boughtPlayers[i];
          const slotNum = i + 3;
          if (player) {
            return (
              <PlayerSlot
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
            <PlayerSlot
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

// ─── Main SquadsPage ──────────────────────────────────────────────────────────
export default function SquadsPage() {
  const { teams, players, auctionState, isLoading } = useIdbAuctionData();
  const league = getLeagueSettings();
  const [teamLogos, setTeamLogos] = useState(() => getTeamLogos());
  const [ownerPhotos, setOwnerPhotos] = useState(() => getOwnerPhotos());
  const [iconPhotos, setIconPhotos] = useState(() => getIconPhotos());

  const refreshPhotos = useCallback(() => {
    setTeamLogos(getTeamLogos());
    setOwnerPhotos(getOwnerPhotos());
    setIconPhotos(getIconPhotos());
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refreshPhotos);
    document.addEventListener("visibilitychange", refreshPhotos);
    return () => {
      window.removeEventListener("storage", refreshPhotos);
      document.removeEventListener("visibilitychange", refreshPhotos);
    };
  }, [refreshPhotos]);

  // Hammer animation state
  const [hammerData, setHammerData] = useState<HammerAnimData | null>(null);
  const [hammerVisible, setHammerVisible] = useState(false);
  const hammerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAuctionActiveRef = useRef<boolean | null>(null);
  const prevLeadingTeamRef = useRef<number | null>(null);
  const prevCurrentPlayerIdRef = useRef<number | null>(null);

  // Detect sold / unsold transitions
  useEffect(() => {
    if (!auctionState) return;

    const wasActive = prevAuctionActiveRef.current;
    const isActive = auctionState.isActive;

    if (wasActive === true && isActive === false) {
      // Auction just ended
      const leadingTeamId = prevLeadingTeamRef.current;
      const prevPlayerId = prevCurrentPlayerIdRef.current;

      if (leadingTeamId != null && auctionState.currentBid > 0) {
        // Player was sold
        const team = teams.find((t) => Number(t.id) === Number(leadingTeamId));
        const currentPlayer =
          prevPlayerId != null
            ? players.find((p) => Number(p.id) === prevPlayerId)
            : null;

        setHammerData({
          type: "sold",
          playerName: currentPlayer?.name ?? "Player",
          teamName: team?.name,
          teamLogoUrl: team ? (teamLogos[String(team.id)] ?? "") : "",
          soldPrice: auctionState.currentBid,
        });
      } else {
        // Player went unsold
        const currentPlayer =
          prevPlayerId != null
            ? players.find((p) => Number(p.id) === prevPlayerId)
            : null;
        setHammerData({
          type: "unsold",
          playerName: currentPlayer?.name ?? "Player",
        });
      }
      setHammerVisible(true);
      if (hammerTimerRef.current) clearTimeout(hammerTimerRef.current);
      hammerTimerRef.current = setTimeout(() => setHammerVisible(false), 3500);
    }

    prevAuctionActiveRef.current = isActive;
    prevLeadingTeamRef.current =
      auctionState.leadingTeamId != null
        ? Number(auctionState.leadingTeamId)
        : null;
    prevCurrentPlayerIdRef.current =
      auctionState.currentPlayerId != null
        ? Number(auctionState.currentPlayerId)
        : null;
  }, [auctionState, teams, players, teamLogos]);

  const sortedTeams = [...teams].sort((a, b) => a.id - b.id);

  return (
    <div className="min-h-screen bg-background broadcast-overlay">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, oklch(0.14 0.05 255 / 0.5) 0%, transparent 70%)",
        }}
      />

      {/* Hammer overlay */}
      <HammerOverlay data={hammerData} visible={hammerVisible} />

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
        style={{
          background: "oklch(0.09 0.025 255 / 0.95)",
          borderBottom: "1px solid oklch(0.78 0.165 85 / 0.18)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-3">
          {league.logoUrl ? (
            <img
              src={league.logoUrl}
              alt={league.shortName}
              style={{ height: 32, objectFit: "contain" }}
            />
          ) : (
            <div
              className="font-broadcast font-black"
              style={{ fontSize: 20, color: "oklch(0.78 0.165 85)" }}
            >
              {league.shortName || "SPL"}
            </div>
          )}
          <div>
            <div
              className="font-broadcast tracking-widest"
              style={{ fontSize: 13, color: "oklch(0.78 0.165 85)" }}
            >
              SQUAD VIEW
            </div>
            <div
              className="font-broadcast tracking-wide"
              style={{ fontSize: 9, color: "oklch(0.42 0.02 90)" }}
            >
              ALL 10 TEAMS · {(league.fullName || "SPL 2026").toUpperCase()}
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
            className="w-2 h-2 rounded-full"
            style={{ background: "oklch(0.65 0.22 25)" }}
          />
          <span
            className="font-broadcast tracking-widest text-xs"
            style={{ color: "oklch(0.65 0.22 25)" }}
          >
            LIVE
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 px-3 py-3">
        {isLoading && sortedTeams.length === 0 ? (
          <div
            className="flex items-center justify-center h-64 gap-3"
            style={{ color: "oklch(0.45 0.02 90)" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              className="w-8 h-8 rounded-full border-2 border-t-transparent"
              style={{ borderColor: "oklch(0.78 0.165 85)" }}
            />
            <span className="font-broadcast tracking-widest text-sm">
              LOADING SQUADS...
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTeams.map((team) => (
              <TeamRow
                key={String(team.id)}
                team={team}
                players={players}
                teamLogoUrl={teamLogos[String(team.id)] ?? ""}
                ownerPhotoUrl={ownerPhotos[String(team.id)] ?? ""}
                iconPhotoUrl={iconPhotos[String(team.id)] ?? ""}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 text-center py-4 text-xs"
        style={{ color: "oklch(0.28 0.02 90)" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.52 0.1 82)" }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
