import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Player {
    id: PlayerId;
    status: Status;
    soldTo?: TeamId;
    name: string;
    soldPrice?: Amount;
    imageUrl: string;
    category: Category;
    rating: Rating;
    basePrice: Amount;
}
export type TeamLogo = ExternalBlob | null;
export type Rating = bigint;
export type Amount = bigint;
export type TeamId = bigint;
export type PlayerId = bigint;
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface PlayerWithTeam {
    player: Player;
    team?: Team;
}
export interface Dashboard {
    remainingPlayers: bigint;
    unsoldPlayers: bigint;
    totalSpent: Amount;
    mostExpensivePlayer?: Player;
    soldPlayers: bigint;
}
export interface AuctionState {
    currentPlayerId?: PlayerId;
    leadingTeamId?: TeamId;
    isActive: boolean;
    currentBid: Amount;
}
export interface Team {
    id: TeamId;
    purseAmountLeft: Amount;
    teamIconPlayer: string;
    teamLogo: TeamLogo;
    isTeamLocked: boolean;
    ownerName: string;
    name: string;
    purseAmountTotal: Amount;
    numberOfPlayers: bigint;
}
export enum Category {
    bowler = "bowler",
    allrounder = "allrounder",
    batsman = "batsman"
}
export enum Status {
    upcoming = "upcoming",
    live = "live",
    sold = "sold",
    unsold = "unsold"
}
export interface backendInterface {
    addPlayer(name: string, category: Category, basePrice: Amount, imageUrl: string, rating: Rating): Promise<Result>;
    adminLogin(password: string): Promise<boolean>;
    deletePlayer(playerId: PlayerId): Promise<Result>;
    editTeamPurse(teamId: TeamId, newPurse: Amount): Promise<Result>;
    getAuctionState(): Promise<AuctionState>;
    getDashboard(): Promise<Dashboard>;
    getPlayerById(playerId: PlayerId): Promise<Player | null>;
    getPlayers(): Promise<Array<Player>>;
    getPlayersByCategory(category: Category): Promise<Array<Player>>;
    getRemainingPurse(teamId: TeamId): Promise<Amount | null>;
    getResults(): Promise<Array<PlayerWithTeam>>;
    getSettings(): Promise<string>;
    getTeamById(teamId: TeamId): Promise<Team | null>;
    getTeams(): Promise<Array<Team>>;
    initialize(): Promise<boolean>;
    markPlayerUnsold(): Promise<Result>;
    placeBid(teamId: TeamId): Promise<Result>;
    putPlayerBackToAuction(playerId: PlayerId): Promise<Result>;
    resetAuction(): Promise<void>;
    saveSettings(json: string): Promise<void>;
    selectPlayer(playerId: PlayerId): Promise<Result>;
    sellPlayer(): Promise<Result>;
    unsellPlayer(playerId: PlayerId): Promise<Result>;
    updatePlayer(playerId: PlayerId, name: string, category: Category, basePrice: Amount, imageUrl: string, rating: Rating): Promise<Result>;
    updateTeam(teamId: TeamId, name: string, ownerName: string, iconPlayerName: string): Promise<Result>;
    uploadTeamLogo(teamId: TeamId, blob: ExternalBlob): Promise<Result>;
}
