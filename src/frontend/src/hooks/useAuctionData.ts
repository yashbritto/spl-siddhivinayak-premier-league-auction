import { useCallback, useEffect, useRef, useState } from "react";
import type { AuctionState, Dashboard, Player, Team } from "../backend.d";
import { useActor } from "./useActor";

export interface AuctionData {
  auctionState: AuctionState | null;
  teams: Team[];
  players: Player[];
  dashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  pausePolling: (ms: number) => void;
}

// Slow-connection tolerant settings:
// - Poll every 3 seconds (was 1.5s) to reduce bandwidth usage
// - Only show error after 5 consecutive failures (was 3)
// - Back off aggressively on errors to avoid flooding the connection
const DEFAULT_POLL_MS = 3000;
const MAX_CONSECUTIVE_ERRORS = 5;

export function useAuctionData(intervalMs = DEFAULT_POLL_MS): AuctionData {
  const { actor, isFetching } = useActor();
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedUntilRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef(0);
  const isFetchingDataRef = useRef(false);
  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!actor) return;
    if (Date.now() < pausedUntilRef.current) return;
    if (isFetchingDataRef.current) return;

    isFetchingDataRef.current = true;
    try {
      // Sequential calls to avoid hammering a slow connection simultaneously.
      // Each call is awaited one at a time — this reduces peak bandwidth and
      // prevents timeouts from piling up on mobile hotspots.
      const state = await actor.getAuctionState();
      if (!mountedRef.current) return;

      const teamsData = await actor.getTeams();
      if (!mountedRef.current) return;

      const playersData = await actor.getPlayers();
      if (!mountedRef.current) return;

      const dashData = await actor.getDashboard();
      if (!mountedRef.current) return;

      setAuctionState(state);
      setTeams(teamsData);
      setPlayers(playersData);
      setDashboard(dashData);
      setError(null);
      consecutiveErrorsRef.current = 0;
      hasDataRef.current = true;
    } catch (err) {
      if (!mountedRef.current) return;
      consecutiveErrorsRef.current += 1;

      // Only surface error to UI after several consecutive failures
      // (transient hiccups on mobile should be invisible to the user)
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        const msg =
          err instanceof Error ? err.message : "Failed to connect to server";
        setError(msg);
      }

      // Backoff: wait longer between retries as failures accumulate
      // Max 30 seconds on repeated failures (important for mobile hotspot)
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        clearTimers();
        const backoffMs = Math.min(
          5000 * (consecutiveErrorsRef.current - MAX_CONSECUTIVE_ERRORS + 1),
          30000,
        );
        retryTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          // Keep the error count elevated so backoff continues, but reset
          // after a successful fetch inside fetchAll
          isFetchingDataRef.current = false;
          fetchAll().then(() => {
            if (mountedRef.current && !intervalRef.current) {
              intervalRef.current = setInterval(fetchAll, intervalMs);
            }
          });
        }, backoffMs);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
      isFetchingDataRef.current = false;
    }
  }, [actor, intervalMs, clearTimers]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!actor || isFetching) return;

    consecutiveErrorsRef.current = 0;
    setError(null);
    isFetchingDataRef.current = false;
    clearTimers();

    fetchAll();
    intervalRef.current = setInterval(fetchAll, intervalMs);

    return clearTimers;
  }, [actor, isFetching, fetchAll, intervalMs, clearTimers]);

  const pausePolling = useCallback((ms: number) => {
    pausedUntilRef.current = Date.now() + ms;
  }, []);

  const refetch = useCallback(async () => {
    consecutiveErrorsRef.current = 0;
    setError(null);
    isFetchingDataRef.current = false;
    clearTimers();
    await fetchAll();
    // Resume polling after manual refetch
    if (mountedRef.current && !intervalRef.current) {
      intervalRef.current = setInterval(fetchAll, intervalMs);
    }
  }, [fetchAll, clearTimers, intervalMs]);

  return {
    auctionState,
    teams,
    players,
    dashboard,
    isLoading,
    error,
    refetch,
    pausePolling,
  };
}
