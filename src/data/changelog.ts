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
