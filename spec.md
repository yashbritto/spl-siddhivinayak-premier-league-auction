# SPL – Siddhivinayak Premier League Auction

## Current State

Full-stack cricket auction app with:
- Motoko backend on ICP for auction state, teams, players, settings
- React frontend with IndexedDB (idbStore) as primary offline data store
- Admin panel reads from IDB (useIdbAuctionData), writes to IDB then syncs to backend in background
- Live screen (LivePage) polls the ICP backend every 1.5s via useAuctionData hook — still 100% dependent on network for any data
- Settings stored in IDB (primary) + localStorage (fallback) + backend (for cross-device sync)
- SOLD and UNSOLD animations on /squads page both use same gold hammer style

## Requested Changes (Diff)

### Add
- Fully offline-first LivePage: reads from IndexedDB (same store as admin) instead of polling ICP backend — only requires network once to load the page, then all data comes from IDB via BroadcastChannel/IDB_CHANGE_EVENT
- Distinct UNSOLD animation: red-tinted overlay, slides in from top, shake/bounce ❌ icon, flickering red "UNSOLD!" text, "No bids received" label, no team logo — visually opposite of SOLD
- Network-free fallback on /live: if IDB has data, show it immediately; show subtle offline indicator if backend unreachable; live screen works on projector connected to same hotspot as admin device via BroadcastChannel sync

### Modify
- LivePage: replace useAuctionData (backend polling) with useIdbAuctionData (IndexedDB) so /live works offline via same IDB store that admin writes to
- LivePage: keep settings (logos, colors, layout) loading from IDB as already implemented — no change needed there
- LivePage SOLD overlay: retain existing gold/hammer animation, keep as-is
- LivePage: add distinct UNSOLD animation that triggers when auction goes from active→inactive with zero bid OR via markPlayerUnsold action
- SquadsPage: UNSOLD hammer animation already triggers on squads — apply same distinct red animation there too
- Backend: keep minimal — no changes needed since IDB is the primary store; backend just needs to stay in sync for multi-device scenarios

### Remove
- Nothing removed — backend stays for multi-device sync fallback

## Implementation Plan

1. Add `unsoldOverlayVisible` + `lastUnsoldPlayer` state to LivePage alongside existing sold overlay state
2. Detect UNSOLD trigger: auction goes active→inactive with prevBid === 0 OR currentPlayer had no leading team
3. Build `UnsoldOverlay` component with red color scheme, top-slide-in animation, shake ❌ icon, flickering "UNSOLD!" text
4. Replace `useAuctionData` with `useIdbAuctionData` in LivePage — same data shape already compatible
5. Add lightweight backend sync to LivePage: try actor.getAuctionState() in background every 10s just to keep backend warm; if IDB already has data, show it without waiting
6. Show subtle "OFFLINE" / "ONLINE" indicator on live screen header (small dot)
7. Apply same UnsoldOverlay to SquadsPage hammer animation section
8. Ensure BroadcastChannel in idbStore carries across to /live tab — already implemented, just needs LivePage to listen
