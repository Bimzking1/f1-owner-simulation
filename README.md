# F1 Owner

A team-management simulation for text-and-numbers enjoyers: take over a Formula 1 constructor and run a full season — the money, the staff, the sponsors, the car and two very demanding drivers.

Built with **React 19 + TypeScript + Vite**, styled with **Tailwind CSS 4**. No backend, no accounts — everything runs and autosaves locally in your browser.

---

## Features

### Splash screen
- A **cinematic splash screen** greets the player on launch: the F1 Owner logo centered on a dark backdrop with a radial vignette and a pulsing glow. Clicking anywhere plays the box-box SFX, unlocks browser audio, and fades smoothly into the main landing page with the opening theme already playing.

### Career setup
- **Two eras**: the 2013 V8 season (19 races, no sprints) or 2025 (24 races, six sprint weekends, fastest-lap point).
- **Four difficulties** — Rookie, Professional, Expert, Ruthless — scaling your budget, part prices, failure rates, sponsor patience and how much information the sim reveals. Difficulty also sets how many **sponsor slots** you get: Rookie 7 · Professional 5 · Expert 4 · Ruthless 3.
- **Season detail level** — Short (summarized GPs) up to Hardcore (practice, full qualifying, event logs).
- **Deterministic seeds** — same seed + same choices = same season. Share a seed and race a friend's save.
- **Team principal profile** — name, photo and what the paddock calls you ("Boss", "Sir", custom…). It shows up in messages and on your season report.
- **Full team draft under a setup budget**: constructor, both drivers, engine + gearbox + tech package, workshop engineers, pit crew, car philosophy (Performance / Reliability / Balanced / Development Gamble) and title/major/minor sponsors.

### Season preview
- An **Expectations report** between setup and testing: expected points, wins, podiums and WCC finishing range from a deterministic multi-pass projector, a pundit verdict, the predicted constructors' table, your entry card (car, engine supplier, gearbox, tech), drivers with projected points and your sponsor board.

### Race weekends
- Practice forecast → qualifying → race (with sprint sessions in 2025), weather and track chaos.
- **Live racing on desktop**: RUN GP opens a mode picker — **Follow LIVE TIMING** streams the race lap-by-lap with a live circuit map (a sector-coloured track — cyan/red/yellow with a black border — driver dots moving around it at realistic pace, adjustable 1x–16x speed), a full timing tower, and a **pause/resume button** directly on the circuit map. The **pit wall notification** appears on the Live Timing tab too — when the sim pauses for checkpoint orders or you pause manually, a pulsing banner with resume button shows up and the radio notification SFX plays. **Follow RACE** runs the fast sim with checkpoint orders. The Race tab's position chart builds lap by lap while the race-control log scrolls. At two checkpoints the pit wall is yours: a loud decision panel takes over with big order buttons per driver (**Push** for pace at real mechanical/accident risk, **Steady**, **Conserve** to save car and tires, a one-shot **Motivate** pep talk, or **Retire** the car), then throw the green flag — or hit **⏸ Pause any time** to halt the race and open the pit wall on your own schedule. Retiring a car opens a **briefing modal** first: live context (position, gap, laps left, tires, health, frustration), a paddock verdict on your call (*Wise call → Out of mind*), a driver-rage forecast and the cost of a refusal. Retired cars dim into a RETIRED card that explains why they're out ("forced to retire by the team owner", accident or mechanical failure), every order answers with a toast confirmation, and each live car shows its own telemetry strip (position, gap, tyre life, car health, form, frustration — which moves **instantly** when a driver answers a retirement call: +7 if he refuses, +4 if he obeys). Skip to the result any time; mobile keeps instant simulation.
- While the race runs, the **Race tab button pulses like a siren** and every other tab shows a race-in-progress strip (live lap counter, pause alerts) — one click jumps you back to the action.
- **Track Racing-Line Tracer** (at `http://localhost:5174/track-tracer`): interactive canvas tool for tracing racing lines and pitlane paths on track layout images. Points auto-normalize to 0–1 coordinates. Modes for race track and pitlane, close-loop toggle, drag to nudge dots. Double-click to label turns (auto-numbered), finish line, pit entry/exit, pitstop lane, paddock area, and sector boundaries (S1/S2/S3). Sector markers carve the track: mark where **sector 2 begins** as "Sector 2 boundary" and where **sector 3 begins** as "Sector 3 boundary", and the racing line colours itself cyan/red/yellow per sector (close the loop so sector 3 wraps back to 1). Full JSON export with racingLine[] and pitlane[] arrays including is_sector/sector fields — Live Timing reads those same markers to place the real sector cut lines on the circuit map and fill the S1/S2/S3 timing columns as drivers cross them.
- After the flag, the desktop Race tab keeps the **position-movement chart** (playback + scrubber, click a line to isolate a driver) and the full race log without opening Replay. During the race the chart spans the full GP distance and fills in lap by lap, with a **★ marking each of your drivers' lines**. The result card only appears once the GP is actually finished, and the weekend classification hides while a race runs.
- **AUTO** simulates weekends until something needs its owner — broken parts, a driver demanding a meeting, bankruptcy or the flag.
- Points, podiums, fastest laps, sprint points and prize money all feed the championship and your accounts.

### Running the team
- **Overview** — owner card (cash, reputation, trust), standings, next-race briefing, latest news. Your car photo is clickable for a full-screen look. Car performance stats are shown **per driver** (Car 1 / Car 2 columns), reflecting each seat's own upgrades.
- **Management** — driver chats that need answers (support or tough love), interventions (speech, bonus, fine, rant) with lingering morale boosts and cooldowns, plus garage-wide actions (team building, training camp, psychologist). Team orders live here too: equal treatment or a designated lead driver. Everything moves driver morale, confidence and frustration — and now the team's public reputation too.
- **Market** — mid-season driver swaps (prorated salaries, break fee + star markup, one undo) plus hiring/firing engineers per department and pit crews. The market has a **reputation gate**: drivers above OVR ~68 demand team reputation before they'll sign (Verstappen needs 68+), so champions must be earned, not just bought.
- **Sponsors** — live objectives with deadlines and patience; meet them for bonuses or lose them for good. The tab badge shows green when an objective is met, yellow when you're close. Slot count depends on difficulty, and terminating a contract mid-season asks for confirmation with the full cost breakdown.
- **Garage** — era-aware power technology, tracked **per car**: each driver owns his own engine, gearbox and every subsystem (2013: **2.4L V8 + KERS**; 2025: the full **1.6L V6 Turbo Hybrid** — ICE, turbocharger, MGU-K, MGU-H, energy store, control electronics, exhaust). The tab shows both cars side by side with independent condition, wear rate, reliability estimates and mileage, and any unit can be swapped for a fresh one on that car alone. Parts can **break outright**: a busted component is flagged with a damage note and **blocks the next Grand Prix** until you replace it — an urgent-repair banner names the affected driver and the RUN GP buttons route you there (broke teams get emergency supplier credit that can push the account into the red). Engine changes cost that driver **−10 grid places** at the next GP and gearbox **−5** (stacking to −20 per car); broken-part replacements count too. Development projects between rounds (shaped by your engineers) can be fitted to **both cars or one car for 60% of the price**, so a tight budget can prioritise your star. Plus paid circuit testing, weekly pit-crew/driver training programmes, and trainings that never wait for a dev window.
- **Upcoming** — the next Grand Prix briefing beside Finance: circuit map, characteristics, weather odds and any stewards' grid penalties listed per driver.
- **Finance** — round-by-round cash flow, a categorized ledger with drill-down detail modals, season totals and bankruptcy watch. Sponsor income swings weekend to weekend (wider bands on higher difficulties) and random operating incidents bite the budget. Promoter share pays $0.45M per point ±gate noise — with an **upset premium up to ×1.7** when a low-rated team or driver lands a podium, because promoters pay for a story.

Car and circuit images anywhere in the season open in a lightbox — click the image, then click away / ✕ / Esc to dismiss.

The Race tab's components panel mirrors the Garage at a glance, per car: every era part (V8/KERS or the seven-piece turbo-hybrid) with condition, Fresh/Worn/Broken status, age, mileage and damage notes, plus each car's own **performance form** (aero/chassis/power/reliability/tires/gearbox incl. that seat's upgrade bonuses — badges show where one-car dev has split the garage). **Tap any part card to jump straight to that hardware in the Garage**, where full specs and replacements live.

### Living systems
- **Audio system**: Full audio management with separate volume controls and mute toggles for background music, sound effects, and UI interaction sounds. Settings persist in localStorage. The opening theme loops continuously from splash through setup, expectations, testing, and season overview — fading only when the first GP Start is clicked. Race ambience loops during live races and stops cleanly on finish or skip, transitioning to the post-race theme. The 'Pit wall — decision required' pause triggers the radio notification SFX while ambience keeps playing. Sound effects include box-box on pause/race decisions, radio notifications for alerts, and Charles Leclerc's scream on forced retirement. The final season classification plays the post-race theme as background music. Sci-fi UI sounds from uisfx provide tactile feedback for constructor/driver/engine selection, hire/fire actions, part replacements, chat responses, sponsor signing, and team orders across all interactive screens.
- **Reputation (0–100)** moves every weekend: wins, podiums and points raise it; scoreless weekends and double DNFs cost it. Driver moods, garage trust, your management conduct and leading the championship all add drift — and reputation gates title sponsors **and star drivers**.
- **Frustration has teeth**: angry drivers bleed lap time (up to ~0.5s), invite incidents, and at 72+ may publicly slam the team. Slumping stars can confront you with **podium-bonus demands** — accept and deliver for big mood gains, miss the window and trust detonates.
- Driver morale swings harder during pointless streaks: consecutive scoreless weekends amplify confidence and morale drops (up to ×2), DNFs and broken hardware sting, and a designated lead driver changes how results are felt.
- Component reliability, tire behavior and power interact with each circuit's characteristics and the weather.
- A news feed with driver messages, paddock stories and sponsor events; some require decisions.
- End-of-season settlement: final standings review, prize money and your report card.
- Autosave to `localStorage` — close the tab, come back, continue. (During a season the browser also asks before an accidental refresh so an in-flight race weekend is never silently lost.)

### In-game change log
The landing page has a **Change log** button (top-right) opening `/change-log`: a timeline of every update shipped to the game, color-coded by change type, newest entry stamped with date and time.

---

## Getting started

```bash
npm install
npm run dev      # start dev server
```

Then open the printed localhost URL. Requires Node 18+.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production build to `dist/` |
| `npm run lint` | ESLint across the project |
| `npm run preview` | Serve the production build locally |
| `npm run assets:seed` | Regenerate asset path mappings (`tsx scripts/seed-assets.ts`) |

## Tech stack

- React 19 + TypeScript (~6.0), Vite 8, Tailwind CSS 4
- Path alias `@/` → `src/`
- State: a single immutable-ish `SimulationState` updated via `structuredClone` + pure mutation helpers; persisted to `localStorage`
- Simulation: seeded RNG (mulberry32) so seasons are reproducible; no external game/sim libraries

## Project structure

```
src/
├── data/            # static content: drivers, constructors, tracks, engines,
│                    #   gearboxes, tech packages, staff, sponsors, config, changelog
├── simulation/      # pure game logic: types, rng, perf model, grid builder,
│                    #   race sim, systems (morale/finance/wear/dev/news/reputation),
│                    #   season orchestrator (sim.ts), expectations projector
├── screens/
│   ├── LandingScreen      # session config, seed, owner profile, change-log button
│   ├── ChangeLogScreen    # /change-log timeline
│   ├── SetupScreen        # step-by-step team draft
│   ├── ExpectationsScreen # pre-season projections report
│   ├── TestingScreen      # pre-season test programme
│   └── season/            # SeasonScreen + tabs (Overview, Race, Live Timing,
│                         #   Management, Market, Sponsors, Garage, Finance, Upcoming) & end screens
├── TrackTracerScreen     # interactive track racing-line tracer (pitlane mode, sector markers, JSON export)
├── ui/              # design kit (cards, modals, tags, meters), hooks, formatters
├── actions.ts       # player actions on top of the sim layer
├── state.ts         # draft factory, buildSimulation, save/load
└── App.tsx          # screen router, autosave, toast
public/assets/       # images (drivers, cars, sponsors, tracks…)
```

## Changelog

See the in-game **Change log** button on the landing page — it renders `src/data/changelog.ts`. Current build: **v0.26** (30 August 2026 · 16:45).

---

*F1 Owner is a fan-made management sim. Not affiliated with Formula 1 or any team, driver or sponsor named within.*
