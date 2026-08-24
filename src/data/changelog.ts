// ============================================================================
// F1 Owner — development change log
// Every entry documents one round of changes shipped to the game, newest first.
// The newest entry carries the exact date & time it was completed.
// ============================================================================

export type ChangeKind = "new" | "improve" | "fix" | "docs";

export interface ChangeItem {
  kind: ChangeKind;
  text: string;
}

export interface ChangeLogEntry {
  version: string;
  title: string;
  /** Human-readable timestamp shown on the timeline. Newest entry uses day-month-year + clock. */
  when: string;
  summary: string;
  items: ChangeItem[];
}

export const CHANGE_LOG: ChangeLogEntry[] = [
  {
    version: "v0.6",
    title: "Breakdowns, urgent repairs & a meaner economy",
    when: "24 August 2026 · 09:44",
    summary:
      "Components can now fail outright — a blown MGU-H, cracked exhaust or cooked gearbox is flagged as broken and blocks the next Grand Prix until you replace it. The Garage gets an urgent-repair banner, the tab bar shows a repair counter, and RUN GP opens an explanation modal instead of starting the weekend. Alongside that, a balance overhaul makes blind play expensive: random part failures scale with wear and difficulty, sponsor income wobbles, random operating incidents bite, and morale collapses faster during pointless streaks.",
    items: [
      { kind: "new", text: "Component breakage system. Every power-unit part, the engine and the gearbox can bust mid-season: independent per-weekend failure rolls (base risk per part × difficulty multiplier × wear factor up to ≈2.6× for clapped-out hardware), plus DNF feedback — race-ending failures and crashes hammer specific components (engine/gearbox/electronics dead, hydraulics/brakes/contact impacts). A busted part sits at 8–16% condition with a damage note until replaced." },
      { kind: "new", text: "Urgent repairs gate the race weekend. With broken hardware on the car, RUN GP buttons (header, Overview, Race tab) open a red alert listing every damaged part with its note, condition and replacement cost instead of running the round; a ⚠ marks the button, and the Garage tab badge shows the number of repairs waiting." },
      { kind: "new", text: "Emergency supplier credit. If cash can't cover a broken part's replacement, the purchase still goes through and the account goes into the red (ledger explains it) — feeding the normal bankruptcy watch instead of soft-locking the season." },
      { kind: "improve", text: "Garage layout rebalanced: urgent repairs on top, development window + programmes + upgrades in the wide left column; Testing and Car philosophy move to a shorter right column so pages stop stretching. The gearbox rejoins the power-system tile grid, which now flows two tiles per row." },
      { kind: "improve", text: "Income uncertainty: sponsor payments now vary ±(−15%/+8%) per weekend, and each weekend carries a 9% chance of a random operating incident ($1.5–4M × cost multiplier) — freight damage, hospitality fire, fine — logged in finance history under operations." },
      { kind: "improve", text: "Slump-amplified morale: consecutive pointless weekends stack a slump counter (reset on scoring) that amplifies negative confidence/morale deltas up to ×2, and the baseline got harsher — DNFs now cost −3 confidence / −7 morale / +8 frustration, points finishes outside P15 hurt, being out-qualified by your teammate stings, and broken hardware in the garage frustrates drivers further." },
    ],
  },
  {
    version: "v0.5",
    title: "Era-aware Garage & geekier Technical draft",
    when: "24 August 2026 · 02:20",
    summary:
      "The Garage now speaks the technology of your season: 2013 shows a 2.4L V8 + KERS power system, 2025 shows the full seven-part 1.6L V6 turbo-hybrid power unit. Every component carries condition, wear rate, reliability estimates and mileage — and the setup Technical step explains the era before you spend a dollar.",
    items: [
      { kind: "new", text: "Era-aware Garage power sections. 2013 renders POWER SYSTEM — \"2.4L V8 + KERS\": engine (2.4L NA V8 spec) plus a dedicated KERS part (harvesting, boost delivery). No turbocharger, MGU-K/MGU-H or energy store anywhere in 2013 — those parts simply don't exist in that era." },
      { kind: "new", text: "2025 renders POWER UNIT — \"1.6L V6 Turbo Hybrid\": ICE, Turbocharger, MGU-K (electrical performance, energy recovery), MGU-H (heat recovery, hybrid response), Energy Store (capacity, degradation), Control Electronics and Exhaust, each with its own hardware spec line, wear profile and replacement price." },
      { kind: "improve", text: "Every garage component row is expandable: geek spec line (rpm limits, kJ allowances, bar pressure…), an honest role description, and live stat tiles — condition, ≈wear per race, reliability estimate from supplier base × health, output/effectiveness with usage fatigue, age in races and mileage in km. A blended system-health meter summarizes the whole installed power unit." },
      { kind: "improve", text: "Any component can be replaced mid-season for a one-time fee (KERS $2.5M; turbo $3M, MGU-K $3.5M, MGU-H $3M, store $4.5M, electronics $2M, exhaust $1.5M) via the same confirm modal as engine/gearbox swaps. Ledger entries use proper part names." },
      { kind: "improve", text: "The race engine now reads whole-power-system health instead of raw engine condition: a worn MGU-H, degraded battery or cracked exhaust raises mechanical DNF risk through the existing failure channels. 2013 blends V8 (80%) + KERS (20%); 2025 weights all seven subsystems by criticality. Old saves migrate lazily — era parts appear with plausible inherited wear after the next race weekend." },
      { kind: "improve", text: "Setup Technical step gains an era banner (POWER SYSTEM vs POWER UNIT) listing that season's components with a plain-language tech explainer, season-specific Engine/Gearbox card titles, an Efficiency stat on engine picks, and expanded tooltips covering KERS mechanics (2013) and PU subsystem anatomy (2025)." },
    ],
  },
  {
    version: "v0.4",
    title: "Sponsor slots by difficulty, garage & management reshuffle, image lightbox",
    when: "24 August 2026 · 01:51",
    summary:
      "Seven-item feedback batch: difficulty-scaled sponsor slot limits, clickable car/circuit images with a full-screen lightbox, Testing moved to the Garage and Team Orders to Management, weekly training programmes exempt from the development freeze, a termination confirmation for sponsors and a compact team principal card.",
    items: [
      { kind: "improve", text: "Sponsor slots now scale with difficulty instead of being fixed at five: Rookie 7 · Professional 5 · Expert 4 · Ruthless 3. The limit is enforced in team setup, on the Sponsors tab (board shows \"full\" when reached) and when signing mid-season, and is explained in the setup hints." },
      { kind: "new", text: "Image lightbox: clicking your car photo in Overview — or any circuit map (Race tab next-race card and result card) — opens the image full-screen at up to 80% viewport height / 80% width, whichever binds first. Click anywhere, ✕ or Esc to close." },
      { kind: "improve", text: "Testing programme moved from the Market tab to the Garage tab (right column, under component swaps) — it always belonged with the workshop tools." },
      { kind: "improve", text: "Team orders moved from the Market tab to the Management tab (right column), next to driver interventions where those calls belong." },
      { kind: "improve", text: "Development freeze now only blocks car upgrades (aero, chassis, reliability, gearbox). Pit crew training and driver training are weekly programmes: runnable every race weekend, once per programme per weekend, regardless of the development window." },
      { kind: "new", text: "Terminating a sponsor mid-season now opens a confirmation modal spelling out the exit fee (40% of the objective bonus), the −5 reputation hit, income lost over the remaining rounds and cash before/after." },
      { kind: "improve", text: "Team principal card on the season Overview compacted: smaller avatar, inline reputation chip and trust bar — no more tall stat block." },
    ],
  },
  {
    version: "v0.3",
    title: "Change log page & README",
    when: "23 August 2026 · 18:41",
    summary: "Added an in-game change log so players can track what changed between updates, plus a proper README.",
    items: [
      { kind: "new", text: "New Change Log screen (/change-log route) with a vertical timeline of every update, color-coded by change type." },
      { kind: "new", text: "\"Change log\" button added to the landing page, top-right corner, available before starting a career." },
      { kind: "docs", text: "README.md rewritten to describe the actual game: features, systems, controls, tech stack and scripts." },
    ],
  },
  {
    version: "v0.2",
    title: "Season preview, living reputation & UI polish",
    when: "23 August 2026",
    summary:
      "A six-part feedback batch: a pre-season expectations report, reputation that moves all season long, clearer tab navigation, consistent workshop styling, sponsor objective badges and a stacked-modal fix.",
    items: [
      { kind: "new", text: "Expectations screen between setup review and pre-season testing — expected points / wins / podiums / WCC finish range, pundit verdict, predicted constructors' table, entry card (car, engine supplier, gearbox, tech package), driver photos with projected points and the sponsor board." },
      { kind: "new", text: "Deterministic season projector behind it: replays the field-strength model over the calendar across 7 passes for stable best/worst ranges." },
      { kind: "new", text: "Reputation now moves every race weekend: wins, podiums and points raises raise it; scoreless weekends and double DNFs lower it. Driver morale/frustration, garage trust and leading the championship add further drift. Fractional deltas accumulate so small moves are not lost." },
      { kind: "improve", text: "Driver chat responses and management actions (speech, bonus, fine, rant, team building, training camp, psychologist) now nudge reputation too." },
      { kind: "improve", text: "Season tab navigation restyled: solid active pill with shadow, bordered inactive tabs, larger touch targets that wrap three-per-row on mobile." },
      { kind: "improve", text: "Market workshop engineers/mechanics now use the same seniority badge styling as team-setup staff selection, with hired rows highlighted green." },
      { kind: "new", text: "Sponsors notification badge on the tab bar — green count when an objective is met, yellow when close (≥2/3 progress)." },
      { kind: "fix", text: "Finance tab: clicking a transaction inside the 'cash flow by round' modal no longer opens the detail modal behind it — modals now stack correctly." },
    ],
  },
  {
    version: "v0.1",
    title: "Initial playable build",
    when: "Initial release",
    summary: "The complete core game: take over a constructor and run a full F1 season.",
    items: [
      { kind: "new", text: "Landing page with season (2013 / 2025), difficulty and season-detail selection, deterministic season seed, and team-principal profile (name, photo, paddock callout)." },
      { kind: "new", text: "Team setup flow: constructor, drivers, technical package (engine/gearbox/tech), staff hiring, philosophy, sponsors and review — all under a setup budget." },
      { kind: "new", text: "Pre-season testing programme: performance, reliability, tire and driver tests with confidence levels." },
      { kind: "new", text: "Race weekend simulation: practice forecast, qualifying, races and sprint weekends (2025), weather and chaos, live overtake/DNF ticker and full result review." },
      { kind: "new", text: "Season management tabs: Overview, Race, Management (driver chats & interventions), Market (driver swaps, engineers, pit crew, testing, team orders), Sponsors (objectives with deadlines), Garage (component wear, repairs, upgrades), Finance (cash flow, ledger)." },
      { kind: "new", text: "Under-the-hood systems: driver morale/confidence/frustration, owner trust, component wear & failures, mid-season development projects, prize money and sponsor payouts, bankruptcy rescue, news feed and end-of-season settlement." },
      { kind: "new", text: "Autosave to localStorage with continue-save support." },
    ],
  },
];
