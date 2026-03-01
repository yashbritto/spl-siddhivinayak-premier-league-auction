import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { useAuctionData } from "../hooks/useAuctionData";
import { playBidSound, playSoldSound, unlockAudio } from "../utils/audio";
import { getLeagueConfig, getLiveLayout } from "./SettingsPage";

// ─── Category badge ───────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Batsman: "oklch(0.7 0.15 140)",
  Bowler: "oklch(0.65 0.18 25)",
  Allrounder: "oklch(0.78 0.165 85)",
};

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────
interface CustomTooltipPayload {
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const item = payload[0] as unknown as CustomTooltipPayload;
    return (
      <div
        className="px-3 py-2 text-xs"
        style={{
          background: "oklch(0.13 0.035 265)",
          border: "1px solid oklch(0.78 0.165 85 / 0.3)",
          color: "oklch(0.96 0.015 90)",
        }}
      >
        <p className="font-broadcast tracking-wider mb-1">{label}</p>
        <p style={{ color: "oklch(0.78 0.165 85)" }}>
          {Number(item.value).toLocaleString()} pts
        </p>
      </div>
    );
  }
  return null;
}

// ─── SOLD Overlay ─────────────────────────────────────────────────────────────
function SoldOverlay({
  show,
  teamName,
  playerName,
  soldPrice,
}: {
  show: boolean;
  teamName: string;
  playerName: string;
  soldPrice: number;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "oklch(0.05 0.02 265 / 0.96)",
            backdropFilter: "blur(6px)",
          }}
        >
          {/* Multi-layer radial burst */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                "radial-gradient(ellipse 50% 40% at 50% 50%, oklch(0.78 0.165 85 / 0.22) 0%, transparent 60%)",
                "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.65 0.14 75 / 0.08) 0%, transparent 80%)",
              ].join(", "),
            }}
          />
          {/* Horizontal light beam */}
          <div
            className="absolute inset-x-0 pointer-events-none"
            style={{
              top: "50%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, oklch(0.78 0.165 85 / 0.6) 30%, oklch(0.85 0.18 88) 50%, oklch(0.78 0.165 85 / 0.6) 70%, transparent 100%)",
              transform: "translateY(-50%)",
              boxShadow: "0 0 40px 20px oklch(0.78 0.165 85 / 0.15)",
            }}
          />

          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 14, stiffness: 220 }}
            className="relative z-10 text-center px-8"
          >
            {/* SOLD! word */}
            <motion.div
              initial={{ letterSpacing: "0.5em", opacity: 0 }}
              animate={{ letterSpacing: "-0.02em", opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-broadcast"
              style={{
                fontSize: "clamp(90px, 18vw, 200px)",
                color: "oklch(0.78 0.165 85)",
                textShadow: [
                  "0 0 30px oklch(0.85 0.18 88 / 0.9)",
                  "0 0 60px oklch(0.78 0.165 85 / 0.6)",
                  "0 0 120px oklch(0.78 0.165 85 / 0.3)",
                ].join(", "),
                lineHeight: 0.9,
              }}
            >
              SOLD!
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-6"
            >
              {/* Divider */}
              <div
                className="w-48 h-px mx-auto mb-5"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, oklch(0.78 0.165 85 / 0.7), transparent)",
                }}
              />
              <div
                className="font-broadcast mb-2"
                style={{
                  fontSize: "clamp(20px, 3.5vw, 44px)",
                  color: "oklch(0.94 0.02 90)",
                  letterSpacing: "-0.01em",
                }}
              >
                {playerName}
              </div>
              <div
                className="font-broadcast mb-5"
                style={{
                  fontSize: "clamp(16px, 2.5vw, 32px)",
                  color: "oklch(0.78 0.165 85)",
                  letterSpacing: "0.06em",
                }}
              >
                TO {teamName.toUpperCase()}
              </div>
              <div
                className="font-digital inline-block px-8 py-3"
                style={{
                  fontSize: "clamp(28px, 5vw, 64px)",
                  color: "oklch(0.08 0.025 265)",
                  background:
                    "linear-gradient(135deg, oklch(0.85 0.18 88), oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
                  fontWeight: 700,
                }}
              >
                {soldPrice.toLocaleString()} PTS
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Live Page ────────────────────────────────────────────────────────────────
export default function LivePage() {
  const { auctionState, teams, players } = useAuctionData(1500);
  const leagueConfig = getLeagueConfig();
  const layout = getLiveLayout();
  const shortName = leagueConfig.shortName || "SPL";
  const fullName = leagueConfig.fullName || "Siddhivinayak Premier League";
  const logoUrl =
    leagueConfig.logoUrl || "/assets/generated/spl-logo.dim_400x400.png";

  // Compute scaled sizes from layout config
  const logoSizePx = layout.headerLogoSize * (leagueConfig.logoSize / 100);
  const shortNameFontScale = leagueConfig.shortNameSize / 100;
  const fullNameFontScale = leagueConfig.fullNameSize / 100;

  const prevBidRef = useRef(0);
  const prevActiveRef = useRef(false);
  const [bidBumping, setBidBumping] = useState(false);

  const [soldOverlay, setSoldOverlay] = useState(false);
  const [soldInfo, setSoldInfo] = useState({
    teamName: "",
    playerName: "",
    soldPrice: 0,
  });

  const currentBid = Number(auctionState?.current_bid ?? 0);

  const currentPlayer = auctionState?.current_player_id
    ? players.find((p) => p.id === auctionState.current_player_id)
    : null;

  const leadingTeam = auctionState?.leading_team_id
    ? teams.find((t) => t.id === auctionState.leading_team_id)
    : null;

  // Unlock audio on interaction
  useEffect(() => {
    const handler = () => unlockAudio();
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, []);

  // Detect bid change → sound + bump animation
  useEffect(() => {
    if (
      currentBid > 0 &&
      currentBid !== prevBidRef.current &&
      prevBidRef.current !== 0
    ) {
      playBidSound();
      setBidBumping(true);
      setTimeout(() => setBidBumping(false), 400);
    }
    prevBidRef.current = currentBid;
  }, [currentBid]);

  // Detect sold (active goes false with a sold player)
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isActive = !!auctionState?.is_active;
    prevActiveRef.current = isActive;

    if (wasActive && !isActive && currentPlayer && leadingTeam) {
      const soldP = players.find(
        (p) =>
          p.id === auctionState?.current_player_id ||
          (currentPlayer && p.id === currentPlayer.id),
      );
      if (soldP) {
        playSoldSound();
        setSoldInfo({
          teamName: leadingTeam.name,
          playerName: soldP.name,
          soldPrice:
            soldP.sold_price !== undefined
              ? Number(soldP.sold_price)
              : currentBid,
        });
        setSoldOverlay(true);
        setTimeout(() => setSoldOverlay(false), 3500);
      }
    }
  }, [
    auctionState?.is_active,
    currentPlayer,
    leadingTeam,
    players,
    currentBid,
    auctionState?.current_player_id,
  ]);

  const chartData = teams.map((team) => ({
    name: team.name.length > 10 ? `${team.name.substring(0, 10)}…` : team.name,
    purse: Number(team.purse_remaining),
    id: Number(team.id),
  }));

  return (
    <div className="min-h-screen bg-background overflow-hidden broadcast-overlay">
      {/* Background atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.13 0.06 265 / 0.7) 0%, transparent 70%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.78 0.165 85 / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.78 0.165 85 / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top bar */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-3"
        style={{
          background: "oklch(0.09 0.03 265 / 0.95)",
          borderBottom: "1px solid oklch(0.78 0.165 85 / 0.25)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt={shortName}
            style={{
              width: `${logoSizePx}px`,
              height: `${logoSizePx}px`,
              objectFit: "contain",
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "/assets/generated/spl-logo.dim_400x400.png";
            }}
          />
          <div>
            <div
              className="font-broadcast tracking-widest leading-none"
              style={{
                color: "oklch(0.78 0.165 85)",
                fontSize: `${1.125 * shortNameFontScale}rem`,
              }}
            >
              {shortName}
            </div>
            <div
              className="tracking-widest leading-none mt-0.5"
              style={{
                color: "oklch(0.45 0.02 90)",
                fontSize: `${0.75 * fullNameFontScale}rem`,
              }}
            >
              {fullName.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="text-xs font-broadcast tracking-widest px-3 py-1"
            style={{
              background: "oklch(0.78 0.165 85 / 0.1)",
              border: "1px solid oklch(0.78 0.165 85 / 0.3)",
              color: "oklch(0.78 0.165 85)",
            }}
          >
            PLAYER AUCTION 2025
          </div>
          {auctionState?.is_active && (
            <div
              className="flex items-center gap-2 text-xs font-broadcast tracking-widest px-3 py-1"
              style={{
                background: "oklch(0.62 0.22 25 / 0.15)",
                border: "1px solid oklch(0.62 0.22 25 / 0.4)",
                color: "oklch(0.75 0.15 25)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "oklch(0.75 0.15 25)" }}
              />
              LIVE
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* ─── CENTER PLAYER SECTION ───────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-4">
          {currentPlayer ? (
            <>
              {/* Player photo + name row */}
              <div className="flex flex-col items-center mb-4">
                <motion.div
                  key={String(currentPlayer.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="relative mb-4"
                >
                  <div
                    className="overflow-hidden"
                    style={{
                      width: layout.playerImageWidth,
                      height: layout.playerImageHeight,
                      border: "2px solid oklch(0.78 0.165 85 / 0.6)",
                      boxShadow: [
                        "0 0 0 1px oklch(0.78 0.165 85 / 0.15)",
                        "0 0 40px oklch(0.78 0.165 85 / 0.25)",
                        "0 0 80px oklch(0.78 0.165 85 / 0.1)",
                        "0 20px 60px oklch(0 0 0 / 0.6)",
                      ].join(", "),
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
                  {/* Gold corner brackets — extended */}
                  {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                    <div
                      key={corner}
                      className="absolute w-5 h-5"
                      style={{
                        top: corner.startsWith("t") ? -2 : "auto",
                        bottom: corner.startsWith("b") ? -2 : "auto",
                        left: corner.endsWith("l") ? -2 : "auto",
                        right: corner.endsWith("r") ? -2 : "auto",
                        borderTop: corner.startsWith("t")
                          ? "3px solid oklch(0.85 0.18 88)"
                          : undefined,
                        borderBottom: corner.startsWith("b")
                          ? "3px solid oklch(0.85 0.18 88)"
                          : undefined,
                        borderLeft: corner.endsWith("l")
                          ? "3px solid oklch(0.85 0.18 88)"
                          : undefined,
                        borderRight: corner.endsWith("r")
                          ? "3px solid oklch(0.85 0.18 88)"
                          : undefined,
                      }}
                    />
                  ))}
                </motion.div>

                {/* Player name */}
                <motion.h1
                  key={`name-${String(currentPlayer.id)}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-broadcast text-center mb-1"
                  style={{
                    fontSize: `clamp(${Math.round((22 * layout.playerNameSize) / 100)}px, ${(3.5 * layout.playerNameSize) / 100}vw, ${Math.round((44 * layout.playerNameSize) / 100)}px)`,
                    color: "oklch(0.97 0.01 90)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {currentPlayer.name}
                </motion.h1>

                {/* Category + base price */}
                <div className="flex items-center gap-3 mb-0">
                  <span
                    className="inline-block font-broadcast tracking-widest"
                    style={{
                      fontSize: `${(0.75 * layout.categoryBadgeSize) / 100}rem`,
                      padding: `${(3 * layout.categoryBadgeSize) / 100}px ${(12 * layout.categoryBadgeSize) / 100}px`,
                      background: `${CATEGORY_COLORS[currentPlayer.category] ?? "oklch(0.55 0.02 90)"}22`,
                      border: `1px solid ${CATEGORY_COLORS[currentPlayer.category] ?? "oklch(0.55 0.02 90)"}66`,
                      color:
                        CATEGORY_COLORS[currentPlayer.category] ??
                        "oklch(0.55 0.02 90)",
                    }}
                  >
                    {currentPlayer.category.toUpperCase()}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "oklch(0.45 0.02 90)" }}
                  >
                    BASE{" "}
                    <span
                      className="font-digital"
                      style={{ color: "oklch(0.65 0.12 82)" }}
                    >
                      {Number(currentPlayer.base_price).toLocaleString()}
                    </span>
                  </span>
                </div>

                {/* ═══ BID STAGE — full-width dramatic counter ═══ */}
                <motion.div
                  key={`bid-stage-${String(currentPlayer.id)}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="w-full max-w-xl relative"
                  style={{
                    background: "oklch(0.065 0.025 265)",
                    border: "1px solid oklch(0.78 0.165 85 / 0.2)",
                    boxShadow: [
                      "0 0 0 1px oklch(0.78 0.165 85 / 0.06)",
                      "inset 0 1px 0 oklch(0.78 0.165 85 / 0.08)",
                      "0 20px 60px oklch(0 0 0 / 0.5)",
                    ].join(", "),
                  }}
                >
                  {/* Top label bar */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-1">
                    <span
                      className="text-xs font-broadcast tracking-widest"
                      style={{ color: "oklch(0.38 0.02 90)" }}
                    >
                      CURRENT BID
                    </span>
                  </div>

                  {/* Gold separator */}
                  <div
                    className="mx-5 mb-3"
                    style={{
                      height: "1px",
                      background:
                        "linear-gradient(90deg, oklch(0.78 0.165 85 / 0.5), oklch(0.78 0.165 85 / 0.15) 70%, transparent)",
                    }}
                  />

                  {/* The number */}
                  <div className="px-5 pb-3 flex items-end gap-3">
                    <div
                      className={`font-digital leading-none ${bidBumping ? "bid-bump" : ""} pulse-gold`}
                      style={{
                        fontSize: `clamp(${Math.round((64 * layout.bidCounterSize) / 100)}px, ${(10 * layout.bidCounterSize) / 100}vw, ${Math.round((120 * layout.bidCounterSize) / 100)}px)`,
                        fontWeight: 800,
                        color: "oklch(0.82 0.17 87)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {currentBid.toLocaleString()}
                    </div>
                    <div
                      className="font-broadcast pb-2"
                      style={{
                        fontSize: `clamp(${Math.round((14 * layout.bidCounterSize) / 100)}px, ${(2 * layout.bidCounterSize) / 100}vw, ${Math.round((22 * layout.bidCounterSize) / 100)}px)`,
                        color: "oklch(0.5 0.08 80)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      PTS
                    </div>
                  </div>

                  {/* Leading team ribbon */}
                  <div
                    className="px-5 py-3 flex items-center gap-3"
                    style={{
                      borderTop: "1px solid oklch(0.78 0.165 85 / 0.12)",
                      background: "oklch(0.78 0.165 85 / 0.05)",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {leadingTeam ? (
                        <motion.div
                          key={String(leadingTeam.id)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 w-full"
                        >
                          <span
                            className="w-2 h-2 flex-shrink-0"
                            style={{ background: "oklch(0.78 0.165 85)" }}
                          />
                          <span
                            className="text-xs font-broadcast tracking-widest"
                            style={{ color: "oklch(0.45 0.02 90)" }}
                          >
                            LEADING
                          </span>
                          <span
                            className="font-broadcast tracking-wide"
                            style={{
                              fontSize: `clamp(${Math.round((14 * layout.leadingTeamSize) / 100)}px, ${(2 * layout.leadingTeamSize) / 100}vw, ${Math.round((22 * layout.leadingTeamSize) / 100)}px)`,
                              color: "oklch(0.85 0.165 85)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {leadingTeam.name.toUpperCase()}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="no-bid"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs font-broadcast tracking-widest"
                          style={{ color: "oklch(0.3 0.02 90)" }}
                        >
                          AWAITING FIRST BID
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div
                className="text-8xl mb-6 opacity-20"
                style={{ filter: "grayscale(1)" }}
              >
                🏏
              </div>
              <div
                className="font-broadcast text-xl tracking-widest"
                style={{ color: "oklch(0.35 0.02 90)" }}
              >
                AUCTION STARTING SOON
              </div>
              <div
                className="text-sm mt-2"
                style={{ color: "oklch(0.3 0.02 90)" }}
              >
                Waiting for admin to select a player
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL ────────────────────────────── */}
        <div
          className="w-full flex flex-col"
          style={{
            width: `${layout.rightPanelWidth}px`,
            minWidth: `${layout.rightPanelWidth}px`,
            background: "oklch(0.085 0.025 265)",
            borderLeft: "1px solid oklch(0.78 0.165 85 / 0.18)",
          }}
        >
          {/* Team Purse Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Section header with gold left-bar */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid oklch(0.16 0.035 265)" }}
            >
              <div
                className="w-0.5 h-4 flex-shrink-0"
                style={{ background: "oklch(0.78 0.165 85)" }}
              />
              <span
                className="font-broadcast text-xs tracking-widest"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                TEAM PURSE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table
                className="w-full"
                style={{
                  fontSize: `${(0.75 * layout.teamTableFontSize) / 100}rem`,
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid oklch(0.16 0.035 265)" }}
                  >
                    <th
                      className="px-4 py-2 text-left font-broadcast tracking-widest"
                      style={{ color: "oklch(0.38 0.02 90)" }}
                    >
                      TEAM
                    </th>
                    <th
                      className="px-2 py-2 text-right font-broadcast tracking-widest"
                      style={{ color: "oklch(0.38 0.02 90)" }}
                    >
                      PURSE
                    </th>
                    <th
                      className="px-2 py-2 text-right font-broadcast tracking-widest"
                      style={{ color: "oklch(0.38 0.02 90)" }}
                    >
                      SLOTS
                    </th>
                    <th
                      className="px-3 py-2 text-right font-broadcast tracking-widest"
                      style={{ color: "oklch(0.38 0.02 90)" }}
                    >
                      PL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const isLeading =
                      auctionState?.leading_team_id !== undefined &&
                      team.id === auctionState.leading_team_id;
                    const slots = 7 - Number(team.players_bought);
                    return (
                      <tr
                        key={String(team.id)}
                        style={{
                          borderBottom: "1px solid oklch(0.12 0.025 265)",
                          background: isLeading
                            ? "oklch(0.78 0.165 85 / 0.07)"
                            : "transparent",
                          position: "relative",
                        }}
                      >
                        <td
                          className="py-2.5 font-medium"
                          style={{
                            paddingLeft: isLeading ? "0" : "16px",
                            color: isLeading
                              ? "oklch(0.88 0.14 87)"
                              : team.is_locked
                                ? "oklch(0.32 0.02 90)"
                                : "oklch(0.78 0.02 90)",
                          }}
                        >
                          <div className="flex items-center gap-0">
                            {/* Gold left-edge bar for leading team */}
                            {isLeading && (
                              <div
                                className="w-1 self-stretch flex-shrink-0 mr-3"
                                style={{ background: "oklch(0.78 0.165 85)" }}
                              />
                            )}
                            <span className="truncate max-w-[100px]">
                              {team.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-2 py-2.5 text-right font-digital"
                          style={{
                            color: isLeading
                              ? "oklch(0.82 0.16 86)"
                              : "oklch(0.65 0.02 90)",
                          }}
                        >
                          {Number(team.purse_remaining).toLocaleString()}
                        </td>
                        <td
                          className="px-2 py-2.5 text-right font-digital"
                          style={{
                            color:
                              slots === 0
                                ? "oklch(0.32 0.02 90)"
                                : "oklch(0.65 0.18 25)",
                          }}
                        >
                          {slots}
                        </td>
                        <td
                          className="px-3 py-2.5 text-right font-digital"
                          style={{ color: "oklch(0.65 0.15 140)" }}
                        >
                          {Number(team.players_bought)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purse Bar Chart */}
          <div
            className="p-4"
            style={{ borderTop: "1px solid oklch(0.16 0.035 265)" }}
          >
            {/* Section header with gold left-bar */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-0.5 h-4 flex-shrink-0"
                style={{ background: "oklch(0.78 0.165 85)" }}
              />
              <span
                className="font-broadcast text-xs tracking-widest"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                PURSE REMAINING
              </span>
            </div>
            {teams.length > 0 && (
              <ResponsiveContainer width="100%" height={layout.chartHeight}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: "oklch(0.32 0.02 90)", fontSize: 9 }}
                    axisLine={{ stroke: "oklch(0.18 0.03 265)" }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "oklch(0.5 0.02 90)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={65}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "oklch(0.78 0.165 85 / 0.05)" }}
                  />
                  <Bar dataKey="purse" radius={[0, 2, 2, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={
                          auctionState?.leading_team_id !== undefined &&
                          BigInt(entry.id) === auctionState.leading_team_id
                            ? "oklch(0.78 0.165 85)"
                            : "oklch(0.32 0.07 265)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2 text-center text-xs"
            style={{
              borderTop: "1px solid oklch(0.14 0.03 265)",
              color: "oklch(0.28 0.02 90)",
            }}
          >
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              style={{ color: "oklch(0.5 0.08 80)" }}
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </div>

      {/* SOLD! Overlay */}
      <SoldOverlay
        show={soldOverlay}
        teamName={soldInfo.teamName}
        playerName={soldInfo.playerName}
        soldPrice={soldInfo.soldPrice}
      />
    </div>
  );
}
