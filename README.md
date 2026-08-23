# F1 Owner

A team-management simulation for text-and-numbers enjoyers: take over a Formula 1 constructor and run a full season — the money, the staff, the sponsors, the car and two very demanding drivers.

Built with **React 19 + TypeScript + Vite**, styled with **Tailwind CSS 4**. No backend, no accounts — everything runs and autosaves locally in your browser.

---

## Features

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
- Live ticker of overtakes, pit stops, off-track moments and DNFs; full result review after the flag.
- Points, podiums, fastest laps, sprint points and prize money all feed the championship and your accounts.

### Running the team
- **Overview** — owner card (cash, reputation, trust), standings, next-race briefing, latest news. Your car photo is clickable for a full-screen look.
- **Management** — driver chats that need answers (support or tough love), interventions (speech, bonus, fine, rant) with lingering morale boosts and cooldowns, plus garage-wide actions (team building, training camp, psychologist). Team orders live here too: equal treatment or a designated lead driver. Everything moves driver morale, confidence and frustration — and now the team's public reputation too.
- **Market** — mid-season driver swaps (prorated salaries, break fee, one undo) plus hiring/firing engineers per department and pit crews.
- **Sponsors** — live objectives with deadlines and patience; meet them for bonuses or lose them for good. The tab badge shows green when an objective is met, yellow when you're close. Slot count depends on difficulty, and terminating a contract mid-season asks for confirmation with the full cost breakdown.
- **Garage** — component wear, failures and repair bills, engine/gearbox replacement, paid circuit testing, weekly pit-crew/driver training programmes, and development projects between rounds shaped by your engineers (upgrades wait for the dev window; trainings don't).
- **Finance** — round-by-round cash flow, a categorized ledger with drill-down detail modals, season totals and bankruptcy watch.

Car and circuit images anywhere in the season open in a lightbox — click the image, then click away / ✕ / Esc to dismiss.

### Living systems
- **Reputation (0–100)** moves every weekend: wins, podiums and points raise it; scoreless weekends and double DNFs cost it. Driver moods, garage trust, your management conduct and leading the championship all add drift — and reputation gates title sponsors.
- Component reliability, tire behavior and power interact with each circuit's characteristics and the weather.
- A news feed with driver messages, paddock stories and sponsor events; some require decisions.
- End-of-season settlement: final standings review, prize money and your report card.
- Autosave to `localStorage` — close the tab, come back, continue.

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
│   └── season/            # SeasonScreen + tabs (Overview, Race, Management,
│                         #   Market, Sponsors, Garage, Finance) & end screens
├── ui/              # design kit (cards, modals, tags, meters), hooks, formatters
├── actions.ts       # player actions on top of the sim layer
├── state.ts         # draft factory, buildSimulation, save/load
└── App.tsx          # screen router, autosave, toast
public/assets/       # images (drivers, cars, sponsors, tracks…)
```

## Changelog

See the in-game **Change log** button on the landing page — it renders `src/data/changelog.ts`. Current build: **v0.3** (23 August 2026 · 18:41).

---

*F1 Owner is a fan-made management sim. Not affiliated with Formula 1 or any team, driver or sponsor named within.*
