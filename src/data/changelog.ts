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
