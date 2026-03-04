/**
 * idbStore — All auction data stored in IndexedDB (2GB capacity).
 * This is the primary offline-first store for the admin device.
 *
 * Uses BroadcastChannel for cross-tab sync on the same device,
 * and a custom DOM event for same-tab updates.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type IDBCategory = "batsman" | "bowler" | "allrounder";
export type IDBStatus = "upcoming" | "live" | "sold" | "unsold";

export interface IDBTeam {
  id: number;
  name: string;
  purseAmountTotal: number;
  purseAmountLeft: number;
  numberOfPlayers: number;
  ownerName: string;
  teamIconPlayer: string;
  isTeamLocked: boolean;
}

export interface IDBPlayer {
  id: number;
  name: string;
  category: IDBCategory;
  basePrice: number;
  imageUrl: string;
  soldPrice?: number;
  soldTo?: number;
  status: IDBStatus;
  rating: number;
}

export interface IDBAuctionState {
  currentPlayerId?: number;
  currentBid: number;
  leadingTeamId?: number;
  isActive: boolean;
}

export interface IDBDashboard {
  totalSpent: number;
  mostExpensivePlayer?: IDBPlayer;
  remainingPlayers: number;
  soldPlayers: number;
  unsoldPlayers: number;
}

export type IDBResult = { ok: true } | { ok: false; err: string };

// ─── Event / Channel ──────────────────────────────────────────────────────────
export const IDB_CHANGE_EVENT = "spl_idb_change";

let broadcastChannel: BroadcastChannel | null = null;
function getBroadcastChannel(): BroadcastChannel | null {
  try {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel("spl_auction");
    }
    return broadcastChannel;
  } catch {
    return null;
  }
}

function notifyChange() {
  // Same-tab
  window.dispatchEvent(new Event(IDB_CHANGE_EVENT));
  // Cross-tab / cross-window on same device
  try {
    getBroadcastChannel()?.postMessage({ type: "change", ts: Date.now() });
  } catch {
    // ignore
  }
}

// ─── DB Setup ─────────────────────────────────────────────────────────────────
const DB_NAME = "spl_auction_db";
const DB_VERSION = 1;
const STORE_TEAMS = "spl_teams";
const STORE_PLAYERS = "spl_players";
const STORE_AUCTION = "spl_auction";
const STORE_SETTINGS = "spl_settings";

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_TEAMS)) {
        db.createObjectStore(STORE_TEAMS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_PLAYERS)) {
        db.createObjectStore(STORE_PLAYERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_AUCTION)) {
        db.createObjectStore(STORE_AUCTION, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };
  });
}

function dbGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      }),
  );
}

function dbGetAll<T>(storeName: string): Promise<T[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      }),
  );
}

function dbPut(storeName: string, value: unknown): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const req = tx.objectStore(storeName).put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

function dbPutMultiple(storeName: string, values: unknown[]): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        for (const v of values) {
          store.put(v);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function dbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const req = tx.objectStore(storeName).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
function seedTeams(): IDBTeam[] {
  return [
    {
      id: 1,
      name: "Mumbai Warriors",
      ownerName: "Team Owner 1",
      teamIconPlayer: "Icon Player 1",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 2,
      name: "Chennai Kings",
      ownerName: "Team Owner 2",
      teamIconPlayer: "Icon Player 2",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 3,
      name: "Delhi Capitals",
      ownerName: "Team Owner 3",
      teamIconPlayer: "Icon Player 3",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 4,
      name: "Bangalore Challengers",
      ownerName: "Team Owner 4",
      teamIconPlayer: "Icon Player 4",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 5,
      name: "Kolkata Knight Riders",
      ownerName: "Team Owner 5",
      teamIconPlayer: "Icon Player 5",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 6,
      name: "Punjab Kings",
      ownerName: "Team Owner 6",
      teamIconPlayer: "Icon Player 6",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 7,
      name: "Hyderabad Sunrisers",
      ownerName: "Team Owner 7",
      teamIconPlayer: "Icon Player 7",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 8,
      name: "Jaipur Royals",
      ownerName: "Team Owner 8",
      teamIconPlayer: "Icon Player 8",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 9,
      name: "Lucknow Super Giants",
      ownerName: "Team Owner 9",
      teamIconPlayer: "Icon Player 9",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
    {
      id: 10,
      name: "Gujarat Titans",
      ownerName: "Team Owner 10",
      teamIconPlayer: "Icon Player 10",
      purseAmountTotal: 20500,
      purseAmountLeft: 20000,
      numberOfPlayers: 0,
      isTeamLocked: false,
    },
  ];
}

function seedPlayers(): IDBPlayer[] {
  const names = [
    "Rohit Sharma",
    "Virat Kohli",
    "MS Dhoni",
    "Ravindra Jadeja",
    "Jasprit Bumrah",
    "KL Rahul",
    "Hardik Pandya",
    "Suryakumar Yadav",
    "Shubman Gill",
    "Rishabh Pant",
    "Sanju Samson",
    "Jos Buttler",
    "Yashasvi Jaiswal",
    "Rinku Singh",
    "Shikhar Dhawan",
    "Yuzvendra Chahal",
    "Mohammed Shami",
    "Axar Patel",
    "Washington Sundar",
    "Kuldeep Yadav",
    "Bhuvneshwar Kumar",
    "Deepak Chahar",
    "Dinesh Karthik",
    "Venkatesh Iyer",
    "Krunal Pandya",
    "Ruturaj Gaikwad",
    "Arshdeep Singh",
    "Harshal Patel",
    "Shardul Thakur",
    "Trent Boult",
    "Shimron Hetmyer",
    "Ravichandran Ashwin",
    "Varun Chakravarthy",
    "Quinton de Kock",
    "Marcus Stoinis",
    "Jason Holder",
    "Devdutt Padikkal",
    "Prasidh Krishna",
    "Avesh Khan",
    "T Natarajan",
    "Shahbaz Ahmed",
    "Tushar Deshpande",
    "Riyan Parag",
    "Tilak Varma",
    "Rahul Tewatia",
    "Shivam Mavi",
    "Harpreet Brar",
    "Mohit Sharma",
    "Karun Nair",
    "Dhruv Jurel",
    "Mayank Agarwal",
    "Ravi Bishnoi",
    "Nicholas Pooran",
    "Alzarri Joseph",
    "Amit Mishra",
    "Sandeep Sharma",
    "Luvnith Sisodia",
    "Raj Bawa",
    "Rajat Patidar",
    "Naman Dhir",
    "Umesh Yadav",
    "Manish Pandey",
    "Kedar Jadhav",
    "Ambati Rayudu",
    "Robin Uthappa",
    "Nitish Rana",
    "Srikar Bharat",
    "Prithvi Shaw",
    "Shreyas Iyer",
    "Ishan Kishan",
  ];

  const data: [IDBCategory, number, number][] = [
    ["batsman", 500, 5],
    ["batsman", 500, 5],
    ["batsman", 400, 5],
    ["allrounder", 400, 5],
    ["bowler", 400, 5],
    ["batsman", 400, 4],
    ["allrounder", 400, 5],
    ["batsman", 400, 5],
    ["batsman", 400, 5],
    ["batsman", 400, 5],
    ["batsman", 400, 4],
    ["batsman", 400, 5],
    ["batsman", 400, 4],
    ["batsman", 300, 4],
    ["batsman", 300, 4],
    ["bowler", 300, 4],
    ["bowler", 300, 4],
    ["allrounder", 300, 4],
    ["allrounder", 300, 4],
    ["bowler", 300, 4],
    ["bowler", 300, 4],
    ["bowler", 300, 4],
    ["batsman", 300, 4],
    ["allrounder", 300, 4],
    ["allrounder", 300, 3],
    ["batsman", 300, 4],
    ["bowler", 300, 4],
    ["bowler", 300, 4],
    ["allrounder", 300, 4],
    ["bowler", 400, 4],
    ["batsman", 300, 4],
    ["bowler", 300, 4],
    ["bowler", 300, 4],
    ["batsman", 300, 4],
    ["allrounder", 300, 4],
    ["allrounder", 300, 4],
    ["batsman", 200, 3],
    ["bowler", 200, 3],
    ["bowler", 200, 3],
    ["bowler", 200, 3],
    ["allrounder", 200, 3],
    ["bowler", 200, 3],
    ["allrounder", 200, 3],
    ["batsman", 200, 3],
    ["allrounder", 200, 3],
    ["bowler", 200, 3],
    ["allrounder", 200, 3],
    ["bowler", 200, 3],
    ["batsman", 200, 3],
    ["batsman", 200, 3],
    ["batsman", 200, 3],
    ["bowler", 200, 3],
    ["batsman", 200, 3],
    ["bowler", 200, 3],
    ["bowler", 200, 3],
    ["bowler", 200, 3],
    ["batsman", 200, 3],
    ["allrounder", 200, 3],
    ["batsman", 300, 4],
    ["allrounder", 200, 3],
    ["bowler", 200, 3],
    ["batsman", 200, 3],
    ["allrounder", 200, 3],
    ["batsman", 200, 3],
    ["batsman", 200, 3],
    ["batsman", 200, 3],
    ["batsman", 200, 3],
    ["batsman", 300, 3],
    ["batsman", 300, 4],
    ["batsman", 300, 4],
  ];

  return names.map((name, i) => {
    const [category, basePrice, rating] = data[i] ?? [
      "batsman" as IDBCategory,
      200,
      3,
    ];
    return {
      id: i + 1,
      name,
      category,
      basePrice,
      imageUrl: "",
      soldPrice: undefined,
      soldTo: undefined,
      status: "upcoming" as IDBStatus,
      rating,
    };
  });
}

// ─── Init flag ───────────────────────────────────────────────────────────────
const INIT_KEY = "spl_idb_initialized";

// ─── Public API ───────────────────────────────────────────────────────────────
export const idbStore = {
  /**
   * Seed data on first run. Safe to call multiple times — only seeds if empty.
   */
  async init(): Promise<void> {
    try {
      const db = await openDB();

      // Check if already seeded using a settings flag
      const initFlag = await dbGet<{ key: string; value: string }>(
        STORE_SETTINGS,
        INIT_KEY,
      );

      if (!initFlag) {
        // Seed teams
        const existingTeams = await dbGetAll<IDBTeam>(STORE_TEAMS);
        if (existingTeams.length === 0) {
          await dbPutMultiple(STORE_TEAMS, seedTeams());
        }

        // Seed players
        const existingPlayers = await dbGetAll<IDBPlayer>(STORE_PLAYERS);
        if (existingPlayers.length === 0) {
          await dbPutMultiple(STORE_PLAYERS, seedPlayers());
        }

        // Seed auction state
        const existingAuction = await dbGet(STORE_AUCTION, "state");
        if (!existingAuction) {
          await dbPut(STORE_AUCTION, {
            key: "state",
            currentBid: 0,
            isActive: false,
          });
        }

        // Mark as initialized
        await dbPut(STORE_SETTINGS, { key: INIT_KEY, value: "1" });
      }

      void db; // just to avoid unused variable
    } catch (err) {
      console.warn("idbStore.init failed:", err);
    }
  },

  async getTeams(): Promise<IDBTeam[]> {
    const teams = await dbGetAll<IDBTeam>(STORE_TEAMS);
    return teams.sort((a, b) => a.id - b.id);
  },

  async getPlayers(): Promise<IDBPlayer[]> {
    const players = await dbGetAll<IDBPlayer>(STORE_PLAYERS);
    return players.sort((a, b) => a.id - b.id);
  },

  async getAuctionState(): Promise<IDBAuctionState> {
    const state = await dbGet<{ key: string } & IDBAuctionState>(
      STORE_AUCTION,
      "state",
    );
    if (!state) return { currentBid: 0, isActive: false };
    const { key: _key, ...rest } = state;
    void _key;
    return rest;
  },

  async getDashboard(): Promise<IDBDashboard> {
    const players = await this.getPlayers();
    const sold = players.filter((p) => p.status === "sold");
    const totalSpent = sold.reduce((s, p) => s + (p.soldPrice ?? 0), 0);
    const mostExpensivePlayer = sold.reduce<IDBPlayer | undefined>(
      (best, p) => {
        if (!best || (p.soldPrice ?? 0) > (best.soldPrice ?? 0)) return p;
        return best;
      },
      undefined,
    );
    return {
      totalSpent,
      mostExpensivePlayer,
      remainingPlayers: players.filter((p) => p.status === "upcoming").length,
      soldPlayers: sold.length,
      unsoldPlayers: players.filter((p) => p.status === "unsold").length,
    };
  },

  async getTeamById(id: number): Promise<IDBTeam | null> {
    const team = await dbGet<IDBTeam>(STORE_TEAMS, id);
    return team ?? null;
  },

  async getResults(): Promise<Array<{ player: IDBPlayer; team?: IDBTeam }>> {
    const players = (await this.getPlayers()).filter(
      (p) => p.status === "sold",
    );
    const teams = await this.getTeams();
    return players.map((player) => ({
      player,
      team:
        player.soldTo != null
          ? teams.find((t) => t.id === player.soldTo)
          : undefined,
    }));
  },

  // ── Mutations ────────────────────────────────────────────────────────────────

  async selectPlayer(playerId: number): Promise<IDBResult> {
    const players = await this.getPlayers();
    const player = players.find((p) => p.id === playerId);
    if (!player) return { ok: false, err: "Player not found" };
    if (player.status !== "upcoming")
      return { ok: false, err: "Player is not available for auction" };

    const updatedPlayer = { ...player, status: "live" as IDBStatus };
    await dbPut(STORE_PLAYERS, updatedPlayer);

    const state = await this.getAuctionState();
    await dbPut(STORE_AUCTION, {
      key: "state",
      ...state,
      currentPlayerId: playerId,
      currentBid: player.basePrice,
      leadingTeamId: undefined,
      isActive: true,
    });

    notifyChange();
    return { ok: true };
  },

  async placeBid(teamId: number): Promise<IDBResult> {
    const team = await dbGet<IDBTeam>(STORE_TEAMS, teamId);
    if (!team) return { ok: false, err: "Team not found" };
    if (team.isTeamLocked)
      return { ok: false, err: "Team is already locked (squad full)" };

    const state = await this.getAuctionState();
    if (!state.isActive) return { ok: false, err: "No active auction" };

    const newBid = state.currentBid + 100;
    const remainingSlots = 7 - team.numberOfPlayers;
    const minRequired = remainingSlots > 1 ? (remainingSlots - 1) * 100 : 0;

    if (team.purseAmountLeft < newBid)
      return { ok: false, err: "Insufficient purse for this bid" };
    if (team.purseAmountLeft - newBid < minRequired)
      return { ok: false, err: "Bid would violate minimum slot balance rule" };

    await dbPut(STORE_AUCTION, {
      key: "state",
      ...state,
      currentBid: newBid,
      leadingTeamId: teamId,
    });

    notifyChange();
    return { ok: true };
  },

  async sellPlayer(): Promise<IDBResult> {
    const state = await this.getAuctionState();
    if (!state.isActive) return { ok: false, err: "No active auction" };
    if (!state.currentPlayerId || !state.leadingTeamId)
      return { ok: false, err: "No leading team" };

    const team = await dbGet<IDBTeam>(STORE_TEAMS, state.leadingTeamId);
    const player = await dbGet<IDBPlayer>(STORE_PLAYERS, state.currentPlayerId);
    if (!team) return { ok: false, err: "Team not found" };
    if (!player) return { ok: false, err: "Player not found" };

    const newCount = team.numberOfPlayers + 1;
    await dbPut(STORE_TEAMS, {
      ...team,
      purseAmountLeft: team.purseAmountLeft - state.currentBid,
      numberOfPlayers: newCount,
      isTeamLocked: newCount >= 7,
    });
    await dbPut(STORE_PLAYERS, {
      ...player,
      soldPrice: state.currentBid,
      soldTo: state.leadingTeamId,
      status: "sold" as IDBStatus,
    });
    await dbPut(STORE_AUCTION, {
      key: "state",
      currentBid: 0,
      isActive: false,
    });

    notifyChange();
    return { ok: true };
  },

  async markPlayerUnsold(): Promise<IDBResult> {
    const state = await this.getAuctionState();
    if (!state.isActive || !state.currentPlayerId)
      return { ok: false, err: "No active auction" };

    const player = await dbGet<IDBPlayer>(STORE_PLAYERS, state.currentPlayerId);
    if (!player) return { ok: false, err: "Player not found" };

    await dbPut(STORE_PLAYERS, { ...player, status: "unsold" as IDBStatus });
    await dbPut(STORE_AUCTION, {
      key: "state",
      currentBid: 0,
      isActive: false,
    });

    notifyChange();
    return { ok: true };
  },

  async putPlayerBackToAuction(playerId: number): Promise<IDBResult> {
    const player = await dbGet<IDBPlayer>(STORE_PLAYERS, playerId);
    if (!player) return { ok: false, err: "Player not found" };
    if (player.status !== "unsold")
      return { ok: false, err: "Player must be unsold to put back" };

    await dbPut(STORE_PLAYERS, { ...player, status: "upcoming" as IDBStatus });
    notifyChange();
    return { ok: true };
  },

  async unsellPlayer(playerId: number): Promise<IDBResult> {
    const player = await dbGet<IDBPlayer>(STORE_PLAYERS, playerId);
    if (!player) return { ok: false, err: "Player not found" };
    if (player.status !== "sold")
      return { ok: false, err: "Player is not sold" };
    if (player.soldTo == null || player.soldPrice == null)
      return { ok: false, err: "Invalid sold data" };

    const team = await dbGet<IDBTeam>(STORE_TEAMS, player.soldTo);
    if (!team) return { ok: false, err: "Team not found" };

    await dbPut(STORE_TEAMS, {
      ...team,
      purseAmountLeft: team.purseAmountLeft + player.soldPrice,
      numberOfPlayers: Math.max(0, team.numberOfPlayers - 1),
      isTeamLocked: false,
    });
    await dbPut(STORE_PLAYERS, {
      ...player,
      soldPrice: undefined,
      soldTo: undefined,
      status: "upcoming" as IDBStatus,
    });

    notifyChange();
    return { ok: true };
  },

  async resetAuction(): Promise<void> {
    const teams = await this.getTeams();
    await dbPutMultiple(
      STORE_TEAMS,
      teams.map((t) => ({
        ...t,
        purseAmountLeft: 20000,
        numberOfPlayers: 0,
        isTeamLocked: false,
      })),
    );

    const players = await this.getPlayers();
    await dbPutMultiple(
      STORE_PLAYERS,
      players.map((p) => ({
        ...p,
        status: "upcoming" as IDBStatus,
        soldPrice: undefined,
        soldTo: undefined,
      })),
    );

    await dbPut(STORE_AUCTION, {
      key: "state",
      currentBid: 0,
      isActive: false,
    });
    notifyChange();
  },

  async editTeamPurse(teamId: number, newPurse: number): Promise<IDBResult> {
    const team = await dbGet<IDBTeam>(STORE_TEAMS, teamId);
    if (!team) return { ok: false, err: "Team not found" };
    await dbPut(STORE_TEAMS, { ...team, purseAmountLeft: newPurse });
    notifyChange();
    return { ok: true };
  },

  async updateTeam(
    teamId: number,
    name: string,
    ownerName: string,
    iconPlayerName: string,
  ): Promise<IDBResult> {
    const team = await dbGet<IDBTeam>(STORE_TEAMS, teamId);
    if (!team) return { ok: false, err: "Team not found" };
    await dbPut(STORE_TEAMS, {
      ...team,
      name,
      ownerName,
      teamIconPlayer: iconPlayerName,
    });
    notifyChange();
    return { ok: true };
  },

  async addPlayer(
    name: string,
    category: IDBCategory,
    basePrice: number,
    imageUrl: string,
    rating: number,
  ): Promise<IDBResult> {
    const players = await this.getPlayers();
    const maxId = players.reduce((m, p) => Math.max(m, p.id), 0);
    const newId = maxId + 1;

    await dbPut(STORE_PLAYERS, {
      id: newId,
      name,
      category,
      basePrice,
      imageUrl,
      soldPrice: undefined,
      soldTo: undefined,
      status: "upcoming" as IDBStatus,
      rating,
    });

    notifyChange();
    return { ok: true };
  },

  async updatePlayer(
    playerId: number,
    name: string,
    category: IDBCategory,
    basePrice: number,
    imageUrl: string,
    rating: number,
  ): Promise<IDBResult> {
    const player = await dbGet<IDBPlayer>(STORE_PLAYERS, playerId);
    if (!player) return { ok: false, err: "Player not found" };
    if (player.status === "live")
      return { ok: false, err: "Cannot update player during live auction" };

    await dbPut(STORE_PLAYERS, {
      ...player,
      name,
      category,
      basePrice,
      imageUrl,
      rating,
    });
    notifyChange();
    return { ok: true };
  },

  async deletePlayer(playerId: number): Promise<IDBResult> {
    const player = await dbGet<IDBPlayer>(STORE_PLAYERS, playerId);
    if (!player) return { ok: false, err: "Player not found" };
    if (player.status === "live")
      return { ok: false, err: "Cannot delete player during live auction" };

    await dbDelete(STORE_PLAYERS, playerId);
    notifyChange();
    return { ok: true };
  },

  // ── Settings (2GB capable) ────────────────────────────────────────────────

  async getSetting(key: string): Promise<string> {
    const record = await dbGet<{ key: string; value: string }>(
      STORE_SETTINGS,
      key,
    );
    return record?.value ?? "";
  },

  async setSetting(key: string, value: string): Promise<void> {
    await dbPut(STORE_SETTINGS, { key, value });
    notifyChange();
  },

  async getAllSettings(): Promise<Record<string, string>> {
    const records = await dbGetAll<{ key: string; value: string }>(
      STORE_SETTINGS,
    );
    const result: Record<string, string> = {};
    for (const r of records) {
      if (r.key !== INIT_KEY) {
        result[r.key] = r.value;
      }
    }
    return result;
  },

  /**
   * Bulk-write teams and players from the backend — used to seed IDB
   * from backend data on first connection.
   */
  async seedFromBackend(
    teams: IDBTeam[],
    players: IDBPlayer[],
    state: IDBAuctionState,
  ): Promise<void> {
    try {
      if (teams.length > 0) await dbPutMultiple(STORE_TEAMS, teams);
      if (players.length > 0) await dbPutMultiple(STORE_PLAYERS, players);
      await dbPut(STORE_AUCTION, { key: "state", ...state });
      // Mark as initialized so we don't overwrite with seed data
      await dbPut(STORE_SETTINGS, { key: INIT_KEY, value: "1" });
      notifyChange();
    } catch {
      // ignore
    }
  },
};
