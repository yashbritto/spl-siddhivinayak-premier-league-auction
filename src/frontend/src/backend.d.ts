import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Player {
    id: bigint;
    status: string;
    image_url: string;
    name: string;
    base_price: bigint;
    sold_to?: bigint;
    category: string;
    rating: bigint;
    sold_price?: bigint;
}
export interface Dashboard {
    total_spent: bigint;
    remaining_players: bigint;
    most_expensive_player?: Player;
    sold_players: bigint;
}
export interface AuctionState {
    current_player_id?: bigint;
    current_bid: bigint;
    leading_team_id?: bigint;
    is_active: boolean;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface Team {
    id: bigint;
    name: string;
    purse_total: bigint;
    icon_player_name: string;
    purse_remaining: bigint;
    players_bought: bigint;
    owner_name: string;
    is_locked: boolean;
}
export interface backendInterface {
    addPlayer(name: string, category: string, basePrice: bigint, imageUrl: string, rating: bigint): Promise<Result>;
    adminLogin(password: string): Promise<boolean>;
    deletePlayer(playerId: bigint): Promise<Result>;
    editTeamPurse(teamId: bigint, newPurse: bigint): Promise<Result>;
    getAuctionState(): Promise<AuctionState>;
    getDashboard(): Promise<Dashboard>;
    getPlayers(): Promise<Array<Player>>;
    getResults(): Promise<Array<[Player, Team | null]>>;
    getTeams(): Promise<Array<Team>>;
    placeBid(teamId: bigint): Promise<Result>;
    resetAuction(): Promise<void>;
    selectPlayer(playerId: bigint): Promise<Result>;
    sellPlayer(): Promise<Result>;
    updatePlayer(playerId: bigint, name: string, category: string, basePrice: bigint, imageUrl: string, rating: bigint): Promise<Result>;
    updateTeam(teamId: bigint, name: string, ownerName: string, iconPlayerName: string): Promise<Result>;
}
