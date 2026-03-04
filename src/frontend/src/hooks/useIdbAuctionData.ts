/**
 * useIdbAuctionData — React hook that reads auction data from IndexedDB.
 * Works 100% offline. Updates instantly via IDB_CHANGE_EVENT and BroadcastChannel.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type IDBAuctionState,
  type IDBDashboard,
  type IDBPlayer,
  type IDBTeam,
  IDB_CHANGE_EVENT,
  idbStore,
} from "../idbStore";

export interface IdbAuctionData {
  teams: IDBTeam[];
  players: IDBPlayer[];
  auctionState: IDBAuctionState;
  dashboard: IDBDashboard;
  isLoading: boolean;
  refetch: () => Promise<void>;
  pausePolling: (ms: number) => void;
}

const DEFAULT_AUCTION_STATE: IDBAuctionState = {
  currentBid: 0,
  isActive: false,
};
const DEFAULT_DASHBOARD: IDBDashboard = {
  totalSpent: 0,
  remainingPlayers: 0,
  soldPlayers: 0,
  unsoldPlayers: 0,
};

export function useIdbAuctionData(): IdbAuctionData {
  const [teams, setTeams] = useState<IDBTeam[]>([]);
  const [players, setPlayers] = useState<IDBPlayer[]>([]);
  const [auctionState, setAuctionState] = useState<IDBAuctionState>(
    DEFAULT_AUCTION_STATE,
  );
  const [dashboard, setDashboard] = useState<IDBDashboard>(DEFAULT_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);

  const mountedRef = useRef(true);
  const pausedUntilRef = useRef<number>(0);
  const isFetchingRef = useRef(false);

  const loadAll = useCallback(async () => {
    if (!mountedRef.current) return;
    if (Date.now() < pausedUntilRef.current) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const [teamsData, playersData, stateData, dashData] = await Promise.all([
        idbStore.getTeams(),
        idbStore.getPlayers(),
        idbStore.getAuctionState(),
        idbStore.getDashboard(),
      ]);

      if (!mountedRef.current) return;

      setTeams(teamsData);
      setPlayers(playersData);
      setAuctionState(stateData);
      setDashboard(dashData);
      setIsLoading(false);
    } catch (err) {
      console.warn("useIdbAuctionData load failed:", err);
      if (mountedRef.current) setIsLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Init IDB and load on mount
  useEffect(() => {
    mountedRef.current = true;

    idbStore.init().then(() => {
      if (mountedRef.current) {
        loadAll();
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [loadAll]);

  // Listen for same-tab IDB change events
  useEffect(() => {
    const handler = () => {
      if (mountedRef.current) loadAll();
    };
    window.addEventListener(IDB_CHANGE_EVENT, handler);
    return () => window.removeEventListener(IDB_CHANGE_EVENT, handler);
  }, [loadAll]);

  // Listen for cross-tab BroadcastChannel messages
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("spl_auction");
      channel.onmessage = () => {
        if (mountedRef.current) loadAll();
      };
    } catch {
      // BroadcastChannel not supported
    }
    return () => {
      try {
        channel?.close();
      } catch {
        // ignore
      }
    };
  }, [loadAll]);

  const refetch = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const pausePolling = useCallback((ms: number) => {
    pausedUntilRef.current = Date.now() + ms;
  }, []);

  return {
    teams,
    players,
    auctionState,
    dashboard,
    isLoading,
    refetch,
    pausePolling,
  };
}
