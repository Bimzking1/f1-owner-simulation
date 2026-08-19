# F1 Owner — UI Slices (handoff to opencode)

All 20 screens from spec §66 are built and verified (`npx tsc -b --noEmit`
and `npx vite build` both pass clean). This is UI only — no game state,
no simulation logic, no persistence. That's your job.

## Run it

    npm install
    npm run dev

A screen switcher (top-left dropdown, `src/App.tsx`) lets you preview any
of the 20 screens in isolation — it is NOT app routing, replace it with
real navigation driven by game state.

## What's wired up already

- Dark/light theme toggle (`src/context/ThemeContext.tsx`) — flips a
  `.light` class on `<html>`, all colors are CSS vars in `src/index.css`.
- F1 Geek/Enjoyer toggle — same context, `src/lib/geekText.ts` has the
  translation helpers. Wired into `TelemetryStat` already; extend the same
  pattern (`metricLabel()` / `metricDisplay()`) anywhere else you add
  numbers.
- Asset dictionary (`src/lib/assetMap.tsx`) — every image reference goes
  through here per spec §100. Currently uses `<AssetPlaceholder>` blocks;
  swap for real `<img src={assetMap.drivers.x}>` once art lands, no
  component changes needed elsewhere.
- Shared primitives in `src/components/ui/`: `Card`, `Badge`, `Button`,
  `TelemetryStat` (the signature timing-tower stat readout — reuse this
  for every rating/metric rather than inventing new stat displays).

## What YOU need to wire up

- Replace all data in `src/lib/mockData.ts` with real game state
  (context/store/whatever you choose).
- Replace `onClick`/`useState` selection logic in each screen with actual
  game-state mutations and validation (budget checks, 2-driver limit, etc.
  — the UI enforces shape, not game rules).
- Wire the screen switcher in `App.tsx` into a real flow: Landing → Setup
  (season/difficulty/length) → Constructor → Consequences → Driver → Staff
  → Engine → Gearbox → Sponsor → Testing → [season loop: Dashboard → Race
  Weekend → Development/Paddock News as needed] → Championship → Final
  Report → Share.
- Race Weekend's event timeline and Result tab currently render static
  mock events/position — this is where your simulation engine's output
  plugs in (see `F1_OWNER_BUILD_SLICES.md` §5 in the other handoff doc for
  the actual simulation formulas).
- `Development` and `PreSeasonTesting` cost values need to deduct from
  real budget state.

## File map

    src/
      context/ThemeContext.tsx   theme + geek/enjoyer state
      lib/
        assetMap.tsx             asset dictionary + placeholder component
        geekText.ts              geek/enjoyer translation helpers
        mockData.ts              ← replace with real state
      components/
        ui/                      Card, Badge, Button, TelemetryStat
        layout/                  NavBar, Page, StickyAction
      screens/
        LandingPage.tsx
        setup/SetupSeason.tsx
        setup/SetupDifficulty.tsx
        setup/SetupGameLength.tsx
        ConstructorSelection.tsx
        ConstructorConsequences.tsx
        DriverSelection.tsx
        StaffSelection.tsx
        EngineSelection.tsx
        GearboxSelection.tsx
        TechnicalPackage.tsx
        SponsorSelection.tsx
        PreSeasonTesting.tsx
        SeasonDashboard.tsx
        RaceWeekend.tsx
        Development.tsx
        PaddockNews.tsx
        Championship.tsx
        FinalSeasonReport.tsx
        ShareResult.tsx
      App.tsx                    screen registry / preview switcher
