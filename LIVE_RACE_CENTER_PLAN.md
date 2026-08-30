# Live Race Center — Execution Plan

Companion to `f1-owner-next-feature-brainstorm.md`. That doc is a good
feature wishlist and its own "Strongest Recommendation" (Live Race Center)
is the right call — but it's written as mockup text, not as data. Before
anything gets built, opencode's simulation and my UI need to agree on
**exactly what fields exist per tick**. That's what this doc nails down.

---

## 0. Reality check first

The brainstorm doc says "based on the current README" — I don't have
visibility into what opencode has actually shipped since our last UI
handoff, only what's in my own notes (20 static UI screens + asset
dictionary, no live simulation wired in yet). Before picking a starting
point, confirm with opencode which of these already exist as real
simulation output vs. which are still just bullet points in a README:

- Lap-by-lap position/gap data — confirm it exists
- Sector-level timing (not just lap time) — likely does NOT exist yet, this
  is new granularity
- Track-progress coordinate (`trackProgress: 0.0–1.0` per car per tick) —
  likely does NOT exist, needed for the circuit map
- Battery/DRS state — only relevant if the sim is 2025-era hybrid, confirm
  it's modeled at all currently
- Pit crew variance (elite/midfield/poor) — confirm crew skill actually
  feeds into a pit-stop-duration roll today, or if pit stops are currently
  a flat number

Anything on this list opencode confirms as "not yet modeled" is a
**simulation task**, not a UI task — no amount of UI slicing fixes a
missing data field.

---

## 1. The shared data contract

This is the single most important artifact for this phase. Both opencode
(producing it) and I (rendering it) build against this shape. Nothing else
should be started until this is agreed:

```typescript
interface RaceTick {
  lap: number;
  totalLaps: number;
  flagState: "green" | "yellow" | "vsc" | "safetyCar" | "red" | "chequered";
  weather: { condition: "dry" | "intermittent" | "wet"; trackWetness: number };

  cars: CarTick[];
  raceControlEvents: RaceControlEvent[];   // new events since last tick only
}

interface CarTick {
  driverId: string;
  position: number;
  gapToLeaderSec: number;
  gapAheadSec: number;
  lastLapSec: number;
  bestLapSec: number;
  sectorTimes: [number, number, number];        // this lap, in progress or final
  sectorDeltas: ["pb" | "faster" | "similar" | "slower", ...];  // vs own best
  trackProgress: number;                          // 0.0–1.0 around the lap, for the map
  tireCompound: "soft" | "medium" | "hard" | "intermediate" | "wet";
  tireAgeLaps: number;
  carHealth: number;          // 0–100
  driverFrustration: number;  // 0–100, already exists per README
  drsAvailable: boolean;
  batteryPct: number;         // omit/ignore if not 2025-era hybrid
  pitStatus: "out" | "in-pit" | "pitting";
  status: "running" | "retired" | "dnf-mechanical" | "dnf-incident";
}

interface RaceControlEvent {
  lap: number;
  type: "overtake" | "pit" | "incident" | "flag" | "mechanical" | "radio";
  driverId?: string;
  text: string;   // pre-formatted, geek/enjoyer already resolved by sim or by UI — pick one, see §4
}
```

Two decisions to make with opencode before coding starts:

1. **Tick granularity** — is this emitted once per lap, or multiple times
   per lap (needed for smooth car movement on the circuit map and for
   sub-lap events like a mid-lap overtake)? The brainstorm's circuit map
   idea requires sub-lap granularity; timing tower alone doesn't.
2. **Where does Geek/Enjoyer translation happen** — in the sim (two text
   variants per event) or in the UI (raw structured data, UI phrases it)?
   Strongly recommend UI-side, same pattern as the existing `geekText.ts`
   helper — keeps the sim's output pure data, not presentation strings.

---

## 2. What's UI-only vs. needs new simulation work

Going through the brainstorm list against the contract above:

| # | Feature | Needs from sim | Verdict |
|---|---|---|---|
| 1 | Live Timing Tower | `CarTick` mostly as-is | **UI-only**, once contract confirmed |
| 2 | Circuit Map + car tracking | `trackProgress` (new), racing-line coordinate data per track (new content, not code) | **New sim field + new content** (racing-line points per track, likely hand-authored) |
| 3 | Sector Timing | `sectorTimes`, `sectorDeltas` (new granularity) | **New sim work** — lap sim needs to become sector-aware |
| 4 | Pit Stop Visualization | pit duration roll driven by crew skill (may already exist per README's "per-car components") | **Mostly UI**, confirm crew-variance roll exists |
| 5 | Team Radio | none structurally — needs a content/copy system keyed off personality+morale+event | **New system**, content-heavy not logic-heavy — good candidate for me to draft the copy bank, opencode to trigger it |
| 6 | DRS/Overtake System | `drsAvailable`, `batteryPct`, and an actual overtake-probability roll exposed as an event, not just a result | **New sim work** if not already resolved as pure position-swap |
| 7 | Weather Radar | forecast data (rain arriving in N laps, % chance) — this is a *prediction* system, not just current weather | **New sim work** — needs a weather-forecast model, not just weather state |
| 8 | Live Strategy Computer | requires the sim to expose an "expected finish" projection per strategy — genuinely hard, this is a mini-simulation-within-the-simulation | **New sim work, hardest item on this list** |
| 9 | Race Director/Stewards | incident classification + penalty resolution — currently "mechanical failures" exist per README but not driver-fault incidents | **New sim work** |
| 10 | Broadcast Mode | pure UI — three presentational layouts over the same `RaceTick` stream | **UI-only** |
| 11 | Race Replay | needs `RaceTick` history persisted/replayable with a seed — check if the existing scrubber already does this | **Mostly UI**, confirm replay-by-seed already works per README ("Race playback/scrubber") |
| 12 | Safety Car/VSC/Red Flag | `flagState` (new enum), and gap-compression logic when SC deploys | **New sim work** |
| 13 | "Why Did I Lose?" Analysis | needs the sim to expose a *decomposition* of the result (car vs driver vs tire vs strategy vs reliability deltas) — this is an attribution model on top of the race, not free | **New sim work**, but valuable — ties directly to the Team Score formulas from the earlier build-slices doc |
| 14 | Historical "What If" | needs real historical results data as a comparison baseline (external data, one-time content task) | **Content task**, not sim/UI — needs a results dataset sourced once |
| 15 | Driver Battle View | pure derived view over two `CarTick` streams | **UI-only** |

Rough split: **5 items are UI-only** once the contract exists (1, 4, 10,
11, 15), **1 is a content task** (14), and **9 items require new
simulation modeling**, several of them (7, 8, 9, 13) non-trivial. That's
the opposite ratio of the previous UI-slicing phase — this phase is
sim-heavy, and my part is smaller until opencode's data catches up.

---

## 3. Recommended build order

Don't build in the brainstorm's Phase 1/2/3 order as written — it front-loads
circuit map and sector timing, both of which need new sim granularity
before any UI work is useful. Sequence by **what's buildable now**:

1. **Lock the `RaceTick` contract** (§1) — blocking everything else.
2. **Live Timing Tower [UI]** — buildable immediately against the contract
   even with sim fields stubbed/mocked, same pattern as the last handoff.
   This alone gets you most of the "feels like a broadcast" effect for the
   least sim work.
3. **Pit Stop Visualization [mostly UI]** + **Driver Battle View [UI]** —
   cheap, high payoff, minimal new sim surface.
4. **Safety Car/VSC/Red Flag [sim]** — this one's worth prioritizing on the
   sim side early because it retroactively makes the Timing Tower and
   Race Control log (already built) far more dramatic, without needing
   any *new* UI beyond a flag-state badge.
5. **Sector Timing [sim]** → once shipped, **Sector Timing UI**.
6. **Circuit Map [sim: trackProgress + racing lines] → [UI]** — the
   racing-line authoring (one polyline per track) is the slow part; start
   it in parallel once 1–2 tracks are prioritized rather than all of them.
7. **Team Radio [content + light sim trigger]** — good filler task, doesn't
   block on anything above.
8. Everything else (DRS/Overtake detail, Weather Radar forecasting,
   Strategy Computer, Race Director, Race Analysis, Historical What-If,
   Broadcast Mode) — genuinely Phase 2/3 material, revisit once 2–7 are
   real and you can see what the timing tower actually needs to feel
   complete.

---

## 4. What I'd do next, concretely

Two options, your call:

- **A.** I draft the `RaceTick`/`CarTick` TypeScript contract as an actual
  file (not just the sketch above) plus a mock tick-generator so I can
  build the Live Timing Tower UI against realistic fake data right now,
  independent of opencode's timeline. Opencode swaps the mock generator
  for the real one later — same pattern as the mock data in the last
  handoff.
- **B.** Hold UI work until you've confirmed with opencode which sim
  fields already exist, so I build against confirmed reality instead of
  a contract that might need revising.

A is faster and matches how we did the first 20 screens (mock data now,
real wiring later); B avoids any rework if opencode's actual data shape
differs from my guess above. I'd lean A — the contract is disposable if
wrong, the UI patterns aren't — but it's your project.
