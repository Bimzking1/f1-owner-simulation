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
    version: "v0.12",
    title: "Car form, per driver — the stat sheet catches up with per-car hardware",
    when: "24 August 2026 · 15:48",
    summary:
      "Since v0.10 each car owns its hardware and can receive its own upgrades — but the car's performance numbers were still shown as one shared set. Now the stats are differentiated per driver everywhere they matter. The Race tab's power-unit panel leads each car block with a 'car form' strip (aero, chassis, power, reliability, tires, gearbox) computed from that seat's own upgrade bonuses; when single-car development makes the cars differ, the higher value carries a +N badge and a 'single-car upgrades active' note appears. The Overview tab's car bars split into two per-driver columns with portraits, so you always see which car is genuinely quicker and where.",
    items: [
      { kind: "new", text: "Per-car form in the Race tab: every car block in the POWER UNIT panel now shows its own six performance stats derived from that seat's upgrade level, with +/− badges against the other car and an indicator whenever one-car dev projects have split the garage." },
      { kind: "improve", text: "Overview tab car stats split into CAR 1 / CAR 2 columns under each driver's portrait — base team stats plus that seat's bonuses instead of a single misleading set." },
      { kind: "docs", text: "README notes the per-driver car form displays." },
    ],
  },
  {
    version: "v0.11",
    title: "A pause button, a conscience for retirements & a clearer pit wall",
    when: "24 August 2026 · 15:38",
    summary:
      "Race-control polish from the latest feedback pass. Retiring a car is no longer a single twitchy click — it now opens a full briefing modal with the driver's live situation (position, gap, laps left, tires, health), a paddock verdict on your call (Wise call / Sensible / Debatable / Questionable / Out of mind), an honest driver-rage forecast, and the +7 frustration cost of a refusal. New ⏸ Pause button halts the race whenever you like so orders can be given any time, not just at checkpoints. Retired cars now explain themselves on the pit wall ('Forced to retire by the team owner', accident or mechanical failure). The previous GP's weekend classification hides while the new race runs — no more two-classifications confusion. The Garage's Replace buttons got real visual weight (green normally, red when the part is broken), and every power-unit card in the Race tab's components panel is now clickable, jumping straight to that hardware in the Garage.",
    items: [
      { kind: "new", text: "Retirement briefing: clicking 'Retire car' opens a confirmation modal with live context (P#, gap, laps remaining, tire life, car health, form), a paddock verdict rating the call from Wise call to Out of mind, a refusal-risk forecast in plain words, and Cancel/Confirm actions." },
      { kind: "new", text: "⏸ Pause at the pit wall: halt the race at any lap to open the pit wall and issue orders — no more waiting for the 33%/66% checkpoints. The panel reads 'race paused by you' (steady light instead of the alarm pulse) and the Green Flag button restarts the clock." },
      { kind: "new", text: "Retired cars tell you why: the pit wall's RETIRED card shows the reason — forced retirement by the owner, accident contact, or the exact mechanical failure." },
      { kind: "fix", text: "Weekend classification (the previous GP's quali/race/sprint tables) is hidden while a race is running in the Race tab, ending the confusion of last week's results sitting next to this week's live chart." },
      { kind: "improve", text: "Garage Replace buttons are impossible to miss: solid green normally, red when the part is broken, with a tooltip restating the price. No more hunting for the ghost button." },
      { kind: "improve", text: "Every part card in the Race tab's POWER UNIT panel is clickable and jumps straight to the Garage tab; the footnote says so. The race-in-progress strip now reads 'PIT WALL OPEN' when paused." },
      { kind: "docs", text: "README updated for the pause button, retirement briefings, tap-through component cards and hidden classification." },
    ],
  },
  {
    version: "v0.10",
    title: "Two cars, two sets of hardware — and drivers who talk back",
    when: "24 August 2026 · 15:13",
    summary:
      "The big one: hardware is now tracked per car. Each driver owns his own engine, gearbox and every turbo-hybrid subsystem — condition, wear, failures, replacements and grid penalties are all per seat (old saves migrate automatically). The Garage shows both cars side by side with independent system-health meters, urgent repairs name the affected driver, and chassis/aero/reliability/gearbox development projects can be fitted to ONE car for 60% of the price so a tight budget can prioritise your star. The pit wall gets real telemetry — position, gap, tyre life, car health and form per car — and Retire is no longer guaranteed: a proud driver near the front may refuse the call, nurse the car home on conserve, and take +7 frustration for being ordered aside. Owner cars get ★ markers on the live position chart, the result card only appears once the GP actually finishes (no more peeking mid-race), weekend classification hides while the race runs, and Upcoming now sits beside Finance in the tab strip.",
    items: [
      { kind: "new", text: "Per-car hardware: engine, gearbox and every era power-unit component are owned per driver. Wear scales with each car's race distance (a DNF's parts suffer less), random failures hit one car at a time, and replacement grid penalties stack per seat — only that driver drops places." },
      { kind: "new", text: "Garage rebuilt around the split: two car columns with portraits and per-car system health, urgent-repair banners naming the driver, and 'Fit to' pickers (Both / Car 1 / Car 2) on chassis-class upgrades with single-car projects priced at 60%." },
      { kind: "new", text: "Pit-wall telemetry strip under each live car: P#, gap to leader, tyre life %, car health % and current form, colour-coded as they degrade. The retire order can now be REFUSED — refusal chance grows near the front, the driver switches himself to conserve, and every refusal costs +7 frustration and −1 trust with a news story." },
      { kind: "improve", text: "Owner drivers wear a ★ at the head of their position-chart line (and in the legend), with a slightly heavier stroke so you can track your pair at a glance; lines are clickable." },
      { kind: "improve", text: "Race tab discipline: the result card appears only after the GP finishes, the weekend classification hides while a race is running, and the UPCOMING tab swapped beside FINANCE in the tab order. Steward penalty banners list penalties per driver." },
      { kind: "fix", text: "Old saves keep working: shared pre-v0.10 hardware migrates into both cars on load, and setup seeds fresh per-car components." },
      { kind: "docs", text: "README updated for per-car hardware, dev targeting, refusals and the new tab order." },
    ],
  },
  {
    version: "v0.9",
    title: "Pit-wall clarity, an Upcoming tab & a chart that fills the distance",
    when: "24 August 2026 · 14:07",
    summary:
      "Second feedback pass on race control: retired cars now leave the pit wall properly — their row dims to a RETIRED card with every order button disabled, so a DNF can never look like a stuck button. Every pit-wall order now answers immediately with a toast confirmation (\"PIT WALL: VER told to PUSH.\", \"VER RETIRED from the race.\"), and Motivate explains its once-per-race rule right on the button. The NEXT UP track card moved out of the Race tab into its own UPCOMING section beside Finance, the result card no longer fights itself on wide screens (vertical stack, circuit map centred below, highlights in a clean 2×2), and the live position chart now spans the full GP distance — the lines grow into empty track instead of rescaling every lap.",
    items: [
      { kind: "fix", text: "Retired drivers on the pit wall: a car that's out of the race shows as a dimmed RETIRED card (grayscale portrait, 'out of the race') with Push/Steady/Conserve/Motivate/Retire all disabled — no more dead-looking buttons after a retirement." },
      { kind: "new", text: "Order confirmations: every pit-wall command pops an immediate toast (push/steady/conserve/motivate/retire), and clicking Retire on an already-out car says so instead of doing nothing. Motivate's disabled state is labelled '✓ used (1 per race)' with a tooltip explaining the rule." },
      { kind: "new", text: "New UPCOMING tab beside Finance: home of the next-Grand Prix briefing (circuit map, characteristics, weather odds, grid-penalty chip) plus the stewards' penalty banner — decluttering the Race tab for pure race action." },
      { kind: "improve", text: "Race result layout fixed for desktop: player entries stack full-width above a centred circuit map instead of squeezing side-by-side; Fastest lap / Driver of the day / Most gained / Most lost sit in a tidy 2×2 grid (single column on mobile)." },
      { kind: "improve", text: "Live position chart axis now covers the full race distance of the GP — the field spreads across the whole width from the start and the drawing fills toward the flag, rather than stretching to always look complete." },
      { kind: "docs", text: "README updated for the Upcoming tab and the distance-aware chart." },
    ],
  },
  {
    version: "v0.8",
    title: "Race tab rework, siren alerts & a bulletproof pit wall",
    when: "24 August 2026 · 11:52",
    summary:
      "Feedback round on the live-race experience: the Race tab button pulses with a siren and every other tab shows a race-in-progress strip (lap counter, pause alerts) so you always know the team is on track. The Race section is rebuilt — chart, pit wall and classification now own the wide left column while track profile, result highlights and a Garage-grade components panel sit on the right. The pit-wall checkpoint is impossible to miss: a full-width decision panel with big Push/Steady/Conserve/Motivate/Retire buttons, tooltips explaining each order, plus a toast nudge. Under the hood the live-race clock was rewritten around an explicit timer chain with stale-engine guards and state healing, fixing reported stuck command buttons; and closing the browser mid-race now warns before discarding the weekend.",
    items: [
      { kind: "new", text: "Siren navigation. While a live race runs, the Race tab button pulses red with a 🏁 marker, and a dismiss-free strip under the tabs follows you across Overview/Management/etc. showing \"Race in progress — lap X/Y\" (plus \"PIT WALL DECISION REQUIRED\" when paused). Click it to jump straight back." },
      { kind: "improve", text: "Race tab layout rework: left column = run control, live position chart + streaming log, post-race chart/log, weekend classification; right column = next-GP track profile, full result card (fastest lap, driver of the day, most gained/lost, replay), detailed components and development projects." },
      { kind: "improve", text: "Components panel upgraded to Garage detail: every era part (2013 V8/KERS or 2025 ICE, turbo, MGU-K/H, energy store, control electronics, exhaust) with condition meter, Fresh/Worn/Broken status, age in races, approximate mileage, replacement count, damage notes and hardware spec lines, plus the pit-crew rating and an urgent-repairs chip." },
      { kind: "improve", text: "Pit-wall decisions are unmissable: when the race pauses at a checkpoint a large bordered panel takes over the top of the left column — pulsing indicator, lap counter, per-driver rows of big labelled order buttons with hover hints (Push = pace for risk, Conserve = save the car…), current stance echo, one-per-race Motivate, Retire car, and a full-width Green Flag resume button. A toast also announces the checkpoint." },
      { kind: "fix", text: "Live-race engine hardening (stuck buttons): the stepping interval was rebuilt as an explicit self-rescheduling timer chain owned by refs — immune to render/effect races — with stale-engine detection (an abandoned engine from a previous round is discarded instead of blocking new races), snapshot healing if view state ever desyncs, guaranteed timer cleanup on finish/skip/reset/unmount, and command handlers that no-op safely instead of wedging. Verified headlessly across consecutive rounds including retire-mid-race and abandoned-race recovery." },
      { kind: "new", text: "Refresh guard: during a season, closing/reloading the browser pops the native confirmation so an accidental F5 never silently throws away an in-flight race weekend (the season itself stays autosaved)." },
      { kind: "docs", text: "README updated with the siren/race-progress indicators, the reworked Race tab anatomy and the refresh warning." },
    ],
  },
  {
    version: "v0.7",
    title: "Live races, owner orders & a paddock that talks back",
    when: "24 August 2026 · 11:19",
    summary:
      "The biggest feedback batch yet: RUN GP on desktop is now a live race — the position chart builds lap by lap while the race-control log streams in, pausing at two checkpoints where you issue pit-wall orders (push, steady, conserve, one-shot motivate or retire the car; pushing buys pace with real mechanical and accident risk). An AUTO button simulates weekends until something demands you: broken parts, a driver wanting a word, or bankruptcy. The driver market gains a reputation gate — champions like Verstappen now demand reputation 68+ before they'll even talk — plus star signing markups, FIA-style grid penalties for engine/gearbox changes, an upset premium on promoter payouts for underdog podiums, wider income swings per difficulty, and frustration that finally slows drivers down: angry stars confront you demanding podium bonuses, rant to the press, and bleed lap time.",
    items: [
      { kind: "new", text: "Live race engine on desktop. Running a GP no longer resolves instantly: the Race tab streams qualifying → lights out → every lap, drawing the position-movement chart in real time. The race pauses at ~33% and ~66% distance checkpoints so you can set each driver's stance — PUSH (+pace, ×1.8 crash risk, extra tire wear and failures), STEADY, CONSERVE (−pace, calmer car), a one-per-race MOTIVATE pep talk, or RETIRE the car outright. Skip-to-result any time; mobile keeps the instant simulation." },
      { kind: "new", text: "Position chart & race log exposed post-race too. The desktop Race tab shows the finished race's lap-by-lap position chart (playback controls, scrubber, click a line to isolate a driver) and the full race-control log without opening Replay." },
      { kind: "new", text: "AUTO simulate. A header button runs weekends back-to-back and stops the moment something needs its owner: parts break, a driver demands a meeting, cash dies, or the season ends — with a toast explaining why it stopped." },
      { kind: "new", text: "Bossy-driver challenges. Frustrated or slumping stars (OVR 78+) may demand a podium bonus ($1.5–8M over 2–3 rounds) via a chat card in Management. Accept pays up front and buys morale/confidence/trust; delivering the podium supercharges it; missing the window detonates frustration, trust and reputation. Ignoring or rejecting has its own costs." },
      { kind: "new", text: "Reputation-gated driver market. Drivers above OVR 68 require team reputation (~2.2 pts of rep per rating point above 68): Verstappen needs 68, Hamilton/Alonso sit in the 50s — no more purple-lineup Aston Martins in week one. Stars also charge a growing signing markup over the $2M break fee." },
      { kind: "new", text: "Grid penalties, FIA-style. Replacing the engine drops both cars 10 grid places at the next GP, gearbox 5 (stacking to −20). Broken-part replacements count too — the stewards only see a new unit. The penalty appears on the Race tab, Next-race card and swap confirmations, then clears once served." },
      { kind: "improve", text: "Promoter share rework: base rate stays $0.45M/point ±12% gate noise, but underdog podiums pay a premium — the weaker your car DNA and the lower-rated your scoring drivers, the bigger the bonus (up to ×1.7), because promoters pay for a story. Ledger detail spells out the formula." },
      { kind: "improve", text: "Income uncertainty scaled by difficulty: sponsor payments swing within bands from rookie −15%/+8% to ruthless −40%/+28%, incident chance rises 6%→19%, and expert/ruthless add nastier shocks (supplier price hikes, sponsor clawbacks, FIA surcharges, overtime settlements)." },
      { kind: "improve", text: "Frustration bites for real. Above ~40 frustration drivers lose up to half a second of pace (race & quali); incidents become more likely as tempers fray; P16+ finishes, DNFs, teammate beatings and active bonus-demands all feed the fire; and at 72+ a star may publicly slam the team — costing reputation and trust until you manage them." },
      { kind: "docs", text: "README updated: live racing + AUTO button, reputation gate and star markups in the market, grid penalties and promoter economics documented alongside the existing Garage/Finance sections." },
    ],
  },
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
