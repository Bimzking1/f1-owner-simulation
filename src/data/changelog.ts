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
    version: "v0.28",
    title: "Dot-perfect sector fills, fluctuating lap times, no phantom LEADER rows",
    when: "30 August 2026 · 18:05",
    summary:
      "Changing the speed multiplier no longer scrambles the driver dots — the interpolation clock is re-anchored on speed change so the current lap fraction is preserved exactly, and the same latent jump after a long pause/resume is fixed by re-anchoring at the moment of resume. Lap recording now covers the VERY FIRST completed lap for every driver (the 0→1 transition no longer skips everyone). Sector columns now fill the exact instant the dot crosses the colour boundary: instead of a polling loop that could lag the crossing, S1/S2/S3 are computed directly from each driver's own track progress every table refresh, so when the dot passes the end of the blue segment S1 flips to the current lap's estimate (same for S2 at the end of red), and S3 fills on lap completion. Lap times now fluctuate per driver and per lap — deterministic per-driver, per-lap variation (± up to ~1.5s per lap, ~0.7s per sector) — so the fastest S1, S2, S3, BEST and LAST can genuinely belong to different drivers and keep changing hands instead of everyone converging on the same base time. And no two drivers show LEADER anymore: the gap cell reads LEADER only for the actual race leader, shows DNF for retired drivers, and the relative gap for everyone else.",
    items: [
      { kind: "fix", text: "Changing the speed multiplier no longer throws driver dots to random wrapped positions — the in-lap fraction is preserved and only the wrapping speed changes." },
      { kind: "fix", text: "Resuming after a long pause no longer leaves dots scattered around the track — the interpolation clock re-anchors at the moment of resume before scaling the frozen fraction across the next interval." },
      { kind: "fix", text: "S1/S2/S3 now fill the exact moment the dot crosses the sector boundary — computed directly from each driver's track progress every refresh, not by a polling gate that could lag behind." },
      { kind: "fix", text: "No more phantom LEADER rows: the gap column shows LEADER only for the race leader, DNF for retired drivers, and the relative gap for everyone else." },
      { kind: "fix", text: "LAST, BEST, S1, S2 and S3 now fill after the FIRST completed lap for every driver — the first-lap transition records using a zero gap delta instead of skipping drivers that had no previous reading." },
      { kind: "fix", text: "When pausing then resuming, the dot continues from its exact paused position on circuit instead of snapping back to the start/finish line — the interpolation clock re-anchors using the saved lap fraction without advancing the lap counter." },
      { kind: "improve", text: "Lap times fluctuate per driver, per lap and per sector (deterministic noise up to ~1.5s / ~0.7s), so the fastest S1, S2, S3, BEST and LAST can belong to different drivers and trade hands across laps." },
      { kind: "improve", text: "Fastest in each column highlighted red — BEST, LAST, S1, S2 and S3 show the quickest time in red, and a red dot sits beside the fastest BEST." },
    ],
  },
  {
    version: "v0.27",
    title: "Dots keep moving in background, no finish-line parking, sectors fill correctly",
    when: "30 August 2026 · 17:00",
    summary:
      "Driver dots no longer stop dead at the finish line after a completed lap, and they keep moving even when you switch to another tab or app. The map animation was driven by requestAnimationFrame, which the browser completely freezes while a tab is hidden — it now runs on a throttled setInterval, so background tabs still advance the dots at ~1 frame per second (wall-clock based, so they're always exactly where the race is when you return). The position clamp that made dots park on the line between engine ticks (and after resume) is gone while the race is running — interpolated progress now wraps around the circuit freely — and a resume now scales the frozen fraction across the engine's full next interval, so resumed dots reach the lap boundary at the exact moment the engine ticks instead of arriving early and idling. LAST and BEST were empty after the first completed lap because lap recording skipped the very first transition (0→1); the lap-tracking pass now records every completion, BEST still only overwrites an existing best. S1/S2/S3 no longer go blank mid-lap: on lap N+1 each sector shows lap N's time until the dot crosses that real sector cut, then flips to that driver's live estimate for the current lap. The DRV column is wider again (110px) so double-barrel driver tags fit without clipping.",
    items: [
      { kind: "fix", text: "Driver dots no longer park on the finish line — interpolated progress wraps instead of clamping while the race is running (the clamp is kept only once a race finishes)." },
      { kind: "fix", text: "Dots keep advancing when you switch to another tab or app — the animation loop now uses setInterval, which browsers still throttle-run in the background instead of freezing like requestAnimationFrame." },
      { kind: "fix", text: "Resume pacing fixed: after unpausing, dots scale the frozen fraction across the engine's full next tick interval, so they cross the lap line exactly when the engine ticks instead of arriving early and sitting there." },
      { kind: "fix", text: "LAST and BEST now fill after the FIRST completed lap (lap recording previously skipped the 0→1 transition). BEST still updates only when a new lap beats the existing best." },
      { kind: "fix", text: "S1/S2/S3 columns no longer go blank during a lap — each sector shows the previous lap's time until the dot crosses that sector's real cut, then switches to the driver's live estimate for the current lap." },
      { kind: "improve", text: "DRV column widened to 110px so driver codes never clip; timing tower still scrolls horizontally on small screens." },
    ],
  },
  {
    version: "v0.26",
    title: "Seamless pause/resume dots, labelled corners, full-width timing tower",
    when: "30 August 2026 · 16:45",
    summary:
      "Driver dots now resume exactly where they froze instead of snapping back to the start/finish line. Pausing captures the car's fraction of the lap; resuming pre-winds the interpolation clock by that fraction, so the dots carry on from their exact spot on the circuit (whether you resume from Live Timing or the Race tab) and reach the next lap boundary precisely when the engine ticks. Turn labels no longer overlap the racing line: each T-number is placed along the outward normal of the track at that corner, with a short leader line pointing at the corner itself, so labels sit cleanly beside the layout instead of on top of it. Sector boundary marks (S2/S3) got the same outward placement. The timing tower is now a single full-width grid on every screen size — POS and DRV widened again (40px/84px) and TEAM gets a flexible share, and on small screens the whole table scrolls horizontally (no more columns being squeezed or hidden).",
    items: [
      { kind: "fix", text: "Driver dots continue from their paused spot when you Resume — from Live Timing or the Race tab — instead of resetting to the finish line." },
      { kind: "fix", text: "Turn labels are placed outside the track along the outward normal with a leader to the corner, so they never sit on top of the circuit layout." },
      { kind: "improve", text: "Sector boundary marks (S2/S3) placed outward of the track line with a halo for readability." },
      { kind: "improve", text: "Timing tower is one full-width grid everywhere: POS 40px, DRV 84px, TEAM flexible, and on mobile the table scrolls horizontally so no column is squeezed." },
    ],
  },
  {
    version: "v0.25",
    title: "Circuit map aspect fix, wider timing tower, reliable pause/resume",
    when: "30 August 2026 · 16:10",
    summary:
      "The circuit map now always renders as a true top-down view. Previously the canvas had a fixed 700px-wide backing store while the CSS let it shrink to the card width at a fixed height — on narrower windows the layout got squished into a thin strip that looked like a broken circuit. The map now resizes itself to its container with a ResizeObserver, preserving the track's aspect ratio at every window size (backing store tracks devicePixelRatio, so it stays crisp). The timing tower gives POS, DRV and TEAM proper room — DRV is 68px (was 44px) and TEAM gets a flexible 110–140px+ share, so driver names and team names no longer crowd each other; LAST/BEST/GAP also widened. Race pause/resume is now rock-solid across tabs: if you pause from Live Timing and resume from the Race tab (or vice versa), the clock restarts cleanly. A long pause previously kept the interpolation clock anchored at the pre-pause engine tick, so after resuming, driver dots could jump a full lap ahead and sit parked at the finish line until the next lap tick — that anchor is now reset on pause and resume. The Race tab's live panel also gained its own 🟢 Resume button so the control is never hidden away.",
    items: [
      { kind: "fix", text: "Circuit map keeps its true top-down aspect ratio at any window size — ResizeObserver fits the canvas to the card instead of squishing a fixed-size canvas." },
      { kind: "fix", text: "Dots no longer jump to the finish line and freeze after resuming from a long pause — the interpolation clock re-anchors on pause and resume." },
      { kind: "improve", text: "Timing tower columns widened: POS 32px, DRV 68px, TEAM flexible 110–140px+, GAP/LAST/BEST wider — driver and team names no longer fight for space." },
      { kind: "improve", text: "Race tab live panel now shows its own 🟢 Resume button when the race is paused, next to ⏸ Pause." },
    ],
  },
  {
    version: "v0.24",
    title: "Tab-switch dot fix, live-filling sector table, sectors track, legend",
    when: "30 August 2026 · 15:05",
    summary:
      "Driver dots no longer reset to the start line when you switch away from Live Timing and back. LiveTimingScreen now stays mounted across tab switches (hidden via CSS instead of unmounted), so its interpolation refs keep syncing with the live engine's ticks even while you're on other tabs, and the animation loops (plus the demo loop) stop while the tab is hidden to save CPU. The timing tower was not filling LAST/BEST/S1/S2/S3 — the table was being built from the integer lap so every driver's track progress looked like zero, and the columns only gated on it. Now the table uses the same interpolated lap progress as the canvas and refreshes at ~7Hz while visible, so S1/S2/S3 fill live as the dots cross each real sector cut, and pauses freeze progress instead of letting it creep. Live Timing now loads the newer Australian GP circuit file (australian-gp-track-racing-line-sectors.json) which carries real sector boundaries, pitstop lane, entry/outro gates, and turns. A track legend (sector colours, checkered finish, dashed pitlane) sits on the circuit map so the colours are self-explanatory.",
    items: [
      { kind: "fix", text: "Driver dots no longer reset to the start/finish line when switching tabs — LiveTimingScreen stays mounted (hidden via CSS) and its tick-refs keep updating from the engine while hidden, so dots appear exactly where the race is when you return." },
      { kind: "fix", text: "Animation and demo loops now stop while the tab is hidden, avoiding background CPU burn." },
      { kind: "fix", text: "Timing tower LAST/BEST/S1/S2/S3 columns now fill — the table uses the interpolated lap progress (same as the canvas) instead of the integer lap, so track progress is no longer stuck at zero." },
      { kind: "fix", text: "Table updates at ~7Hz while visible, so S1/S2/S3 fill live as each driver crosses the real sector cut positions." },
      { kind: "fix", text: "Paused races freeze interpolated progress — dots and table stay put at the pause moment instead of creeping toward the next tick." },
      { kind: "new", text: "Live Timing now loads australian-gp-track-racing-line-sectors.json — Australian GP with real sector boundaries, pitstop lanes, pit entry/outro gates and labelled turns." },
      { kind: "improve", text: "Track legend overlay on the circuit map: sector 1/2/3 colour swatches, checkered finish square and dashed pitlane key so the map is self-explanatory." },
    ],
  },
  {
    version: "v0.23",
    title: "Sector-coloured track with black border",
    when: "30 August 2026 · 14:40",
    summary:
      "The circuit map track line is now painted in the live sector colours — cyan #00CBFF for sector 1, red #FE0101 for sector 2, yellow #FEDE01 for sector 3 — with a black border drawn around the left and right edges of the track. Each segment inherits its colour from the sector cuts in the circuit JSON (falling back to the standard sector proportions when no markers exist), and contiguous same-sector runs are stroked as single smooth paths. The S2/S3 boundary ticks use the matching colours, and turn labels gained a dark outline so they stay readable over the bright track.",
    items: [
      { kind: "improve", text: "Circuit track line now coloured by sector: sector 1 cyan #00CBFF, sector 2 red #FE0101, sector 3 yellow #FEDE01 — matching the sector cuts from the circuit JSON." },
      { kind: "new", text: "Black border drawn on the left and right edges of the circuit line — a wider black underlay strokes the full loop, then the sector colours are painted on top." },
      { kind: "improve", text: "S2/S3 boundary ticks on the circuit map now use the new sector colours (red / yellow)." },
      { kind: "fix", text: "Turn labels got a dark outline so white text stays readable over the bright cyan/red/yellow track." },
    ],
  },
  {
    version: "v0.22",
    title: "Sector carving end-to-end: tracer colours + real timing boundaries",
    when: "30 August 2026 · 14:10",
    summary:
      "Sector markers in the Track Tracer now drive everything. In the tracer, the racing line is coloured automatically by sector: cyan from start until the Sector 2 boundary (end of sector 1), purple until the Sector 3 boundary (end of sector 2), orange back to the finish line for sector 3. The sidebar shows a colour legend plus validation — the line needs exactly one S2 cut and one S3 cut with Close loop enabled to wrap properly; JSON marks each cut with is_sector: true, sector: N. Live Timing now reads those real boundary points from the circuit JSON and converts them to arc-length fractions on the track spline, replacing the old hardcoded 29.5%/64% sector weights. S1/S2/S3 columns fill as each driver crosses the true cut positions, sector times are split by the real boundary distances, and the circuit map draws small S2/S3 boundary ticks at the actual cut locations.",
    items: [
      { kind: "new", text: "Track tracer: racing line now coloured by sector between cut points — cyan (sector 1), purple (sector 2), orange (sector 3) auto-derived from the sector boundary markers." },
      { kind: "new", text: "Track tracer: sidebar sector legend with the three sector colours and a validation banner — exactly one Sector 2 boundary and one Sector 3 boundary required, with a reminder to enable Close loop so sector 3 wraps back to sector 1." },
      { kind: "new", text: "Live Timing: sector boundaries now read from the circuit JSON (is_sector/sector points) and converted to real arc-length fractions along the track spline, replacing hardcoded SECTOR_WEIGHTS." },
      { kind: "new", text: "Live Timing: circuit map draws small S2/S3 boundary ticks with labels at the true cut positions, using the same cyan/purple/orange language." },
      { kind: "improve", text: "S1/S2/S3 timing columns fill when each driver crosses the real sector cuts (arc-length fractions), not a fixed percentage." },
      { kind: "improve", text: "Approximate sector times in live buildFromLive split by the real boundary distances (S1 = cut1, S2 = cut2−cut1, S3 = 1−cut2)." },
      { kind: "docs", text: "README updated: sector boundary workflow documented in the Track Tracer feature description." },
    ],
  },
  {
    version: "v0.21",
    title: "Pause freeze, progressive sectors, track tracer sectors, map restyle",
    when: "26 August 2026 · 19:45",
    summary:
      "Driver dots now freeze in place when the race is paused — no more creeping forward. Timing tower columns refined: DRV column widened, S1/S2/S3 fill progressively as drivers cross each sector boundary in the current lap (based on trackProgress). LAST/BEST/S1/S2/S3 columns only appear once a driver has completed at least one lap. Track tracer gains sector flagging — three new label types (S1, S2, S3) let you mark sector boundaries on the racing line; these render as colored perpendicular dashed lines and export with is_sector/sector fields. Circuit map restyled: track line in clean silver-grey with slate glow, turn labels enlarged to 11px bold white, finish line replaced with a small checkered pattern (black/white squares), pitlane and pit labels in muted silver.",
    items: [
      { kind: "fix", text: "Driver dots freeze in place when the race is paused — animation loop stops rAF when isLivePaused is true, preventing dots from creeping forward." },
      { kind: "fix", text: "DRV column widened from 36px to 44px in both mobile and desktop timing tower layouts." },
      { kind: "fix", text: "S1/S2/S3 columns fill progressively during each lap — S1 appears when trackProgress crosses the first sector boundary, S2 at the second, S3 after lap completion. Based on previous lap's approximate sector times." },
      { kind: "fix", text: "LAST/BEST columns only show when driver has completed at least one full lap (lastLap > 0), not just based on current race lap count." },
      { kind: "new", text: "Track tracer: sector flagging — three new label types (S1/S2/S3) in context menu, each with a distinctive color (cyan/purple/orange). Sector markers render as perpendicular dashed lines across the track." },
      { kind: "new", text: "Track tracer: sector data included in JSON export — is_sector: true, sector: 1/2/3 fields on racingLine points." },
      { kind: "new", text: "Track tracer: sector marker count shown in sidebar stats." },
      { kind: "improve", text: "Circuit map restyled: track line in clean silver (#cbd5e1) with slate glow, turn labels at 11px bold white for visibility, pitlane in muted silver, pit labels in slate-400." },
      { kind: "improve", text: "Finish line replaced with small checkered pattern (3x5 black/white squares) instead of the X marker." },
    ],
  },
  {
    version: "v0.20",
    title: "Table fit, smooth finish-line crossing, speed-change fix, map restyle",
    when: "26 August 2026 · 19:12",
    summary:
      "Timing tower table now fills the full container width — TEAM column uses flexible sizing, all text columns use whitespace-nowrap to prevent wrapping. Dots now cross the finish line smoothly (frac goes 0→1, getSplinePos wraps via modulo). Speed multiplier changes no longer reset progress — the timer isn't restarted, just the speed ref updates. Circuit map restyled: track line uses cyan (#0e7490) with subtle glow, turn labels in slate grey, finish line in silver, pitlane in muted slate dashed line, pitstop markers as subtle circles.",
    items: [
      { kind: "fix", text: "Timing tower table fills full container width — TEAM column uses minmax(50px, 1fr), all text columns use whitespace-nowrap. No more wrapping or half-width tables." },
      { kind: "fix", text: "Dots now cross the finish line smoothly — interpolation fraction goes 0→1.0 (not clamped to 0.99), getSplinePos wraps via modulo for seamless lap transitions." },
      { kind: "fix", text: "Speed multiplier changes no longer reset dot progress — timer isn't restarted on speed change, just the speed ref updates." },
      { kind: "improve", text: "Circuit map restyled: track line in cyan (#0e7490) with soft glow, turn labels in muted slate, finish line in silver, pitlane in slate dashed, pitstop markers as subtle circles." },
    ],
  },
  {
    version: "v0.19",
    title: "Dot animation fix, pitwall sync, empty state, and table polish",
    when: "26 August 2026 · 18:05",
    summary:
      "Fixed the yo-yo dot animation — engine ticks now fire once per lap at the correct interval (LAP_TIME_BASE / speed), so the interpolation covers exactly one full track traversal between ticks. No more teleporting backward mid-lap. Live Timing now shows a proper empty state when no race is running (no circuit map, just a message). Choosing 'Follow LIVE TIMING' from the run modal automatically switches to the Live Timing tab. The pit wall notification (pulsing red dot, pause/resume button) now appears on the Live Timing tab too, with radio notification SFX when the sim pauses automatically. Pause and Resume buttons are available directly on the Live Timing circuit map overlay. Timing tower hides LAST/BEST/S1/S2/S3 columns when no laps have been completed yet.",
    items: [
      { kind: "fix", text: "Fixed dot yo-yo animation — tick interval now matches lap time so interpolation completes a full lap between engine ticks. Dots move smoothly around the track without teleporting." },
      { kind: "fix", text: "Pit wall notification now appears on the Live Timing tab — pulsing banner with pause/resume button, radio notification SFX on auto-pause." },
      { kind: "new", text: "Pause and Resume buttons on the Live Timing circuit map overlay — pause the race directly from Live Timing." },
      { kind: "new", text: "Empty state when no race is running — clean message with 'Run GP' instructions and a Demo button, no circuit map shown." },
      { kind: "new", text: "Choosing 'Follow LIVE TIMING' from the run modal automatically switches to the Live Timing tab." },
      { kind: "fix", text: "Timing tower hides LAST/BEST/S1/S2/S3 when no laps completed yet — no empty dash columns." },
      { kind: "fix", text: "Timing tower columns properly responsive — mobile (POS/DRV/GAP/LAST), tablet adds TEAM/BEST, desktop adds S1/S2/S3." },
    ],
  },
  {
    version: "v0.18",
    title: "Race mode modal, smooth dot animation, responsive timing tower",
    when: "26 August 2026 · 17:22",
    summary:
      "Race mode selection modal lets the owner choose between 'Follow LIVE TIMING' (realistic pace, 1 lap per tick, adjustable speed multiplier) and 'Follow RACE' (fast sim, existing behavior). Dot animation fixed — canvas redraws directly in requestAnimationFrame without going through React state, producing smooth continuous movement. Timing tower is now fully responsive: mobile shows POS/DRV/GAP/LAST, tablet adds TEAM/BEST, desktop adds S1/S2/S3. TEAM column now shows actual constructor name. Pitlane renders as a linear path from Entry pitstop through Pitstop lane markers to Outro pitstop gate. Circuit map shows empty/waiting state when no race is running. Speed multiplier changes propagate to the live engine tick rate.",
    items: [
      { kind: "new", text: "Race mode selection modal — clicking Run GP opens a choice between 'Follow LIVE TIMING' (realistic pace) and 'Follow RACE' (fast sim)." },
      { kind: "new", text: "Live-timing mode advances 1 lap per engine tick (4s base) instead of 2, scaled by speed multiplier." },
      { kind: "new", text: "Speed multiplier changes now propagate to the engine via onSetLiveSpeed — tick interval dynamically adjusts." },
      { kind: "new", text: "Pitlane path now renders as a linear connection from Entry pitstop through Pitstop lane markers to Outro pitstop gate, with pitstop lane circles marking allowed stopping positions." },
      { kind: "new", text: "Empty/waiting state on Live Timing — circuit map dims with 'No race in progress' overlay when idle." },
      { kind: "fix", text: "Driver dots now animate smoothly — canvas redraw runs directly in requestAnimationFrame without React state overhead. No more frozen or jumpy dots." },
      { kind: "fix", text: "Timing tower now fully responsive — mobile shows POS/DRV/GAP/LAST, tablet adds TEAM/BEST, desktop shows all S1/S2/S3 columns." },
      { kind: "fix", text: "TEAM column now shows actual constructor/team name." },
      { kind: "fix", text: "Pitlane no longer renders as a rounded loop — draws a straight-line path from entry to exit." },
      { kind: "fix", text: "Speed multiplier dropdown only shown during active race, not when idle." },
    ],
  },
  {
    version: "v0.17",
    title: "Live Timing page with circuit map and timing tower",
    when: "26 August 2026 · 15:36",
    summary:
      "Live Timing now connects to the real race engine — positions, gaps, DNF status, and retirement reasons all sync with the Race tab in real time. When a race is not running, the Live Timing tab shows a demo mode with Start/Stop controls. Dot positions on the circuit map accurately reflect real timing gaps (3s gap = 3/76.5s of track separation). The tab pauses and shows chequered flag when the race ends or is paused. Catmull-Rom splines produce smooth track rendering. Demo mode lap times corrected to Australian GP range (1:15-1:18).",
    items: [
      { kind: "new", text: "New 'Live Timing' tab in the season screen — renders the circuit track from JSON coordinates with driver dots moving along the racing line in real time." },
      { kind: "new", text: "F1-style timing tower below the circuit map showing position, driver code, team color, gap to leader, last lap, best lap, S1/S2/S3 sector times, tyre compound and tyre age." },
      { kind: "new", text: "Speed multiplier overlay on the circuit map — 1x, 1.5x, 2x, 4x, 8x, 16x to control simulation speed." },
      { kind: "new", text: "Flag state banner (green/yellow/VSC/safety car/red/chequered) and weather indicator on the live timing page." },
      { kind: "new", text: "Connected to real race engine — positions, gaps, DNF status, and retirement reasons sync with the Race tab. If a driver DNFs or pits in RACE, it reflects in LIVE TIMING." },
      { kind: "improve", text: "Circuit map now uses Catmull-Rom splines for smooth, accurate track rendering instead of linear interpolation." },
      { kind: "improve", text: "Canvas aspect ratio auto-calculated from coordinate bounding box — track renders with correct proportions." },
      { kind: "improve", text: "Pitlane rendering connects Entry pitstop through pitlane path to Outro pitstop gate with labeled pit-in/pit-out markers." },
      { kind: "improve", text: "Finish line (FL) marker and grid position indicators on the circuit map." },
      { kind: "improve", text: "Dynamic timing tower — positions update with overtakes, gaps change in real time, sector times highlight purple for overall best." },
      { kind: "improve", text: "Demo mode lap times corrected to Australian GP range (1:15-1:18)." },
      { kind: "fix", text: "Context menu popup now only closes via Escape key or clicking a menu item." },
      { kind: "fix", text: "Track tracer empty-state overlay no longer blocks navbar buttons." },
      { kind: "fix", text: "Live Timing no longer runs before a race starts — shows Start/Stop demo controls when idle." },
      { kind: "fix", text: "Live Timing pauses when race is paused and shows final classification when race ends." },
      { kind: "fix", text: "Dot positions on circuit map accurately reflect real timing gaps — 3s gap shows as correct track separation, not uniform spacing." },
      { kind: "new", text: "Track tracer pitlane mode with auto-sorted pitlane points in JSON output." },
    ],
  },
  {
    version: "v0.16",
    title: "Audio polish, UI sounds across all screens, and driver easter egg fix",
    when: "25 August 2026 · 19:50",
    summary:
      "The audio system got a round of polish: the opening theme now loops continuously from the splash screen all the way through setup, expectations, testing, and the season overview — only fading out when the first GP Start button is clicked. Race ambience now properly loops and stops cleanly when the race ends or is skipped, transitioning seamlessly into the post-race theme. The 'Pit wall — decision required' pause now triggers the radio notification SFX while ambience keeps playing underneath. Charles Leclerc's forced-retirement scream now actually works (driver ID was wrong). The final season classification plays the post-race theme as background music. Sci-fi UI sounds from uisfx are now wired across all interactive screens: Setup wizard, Market, Garage, Sponsors, Management, and Finance tabs.",
    items: [
      { kind: "improve", text: "Opening theme now loops continuously from splash screen through setup, expectations, testing, and season overview — fades out only when the first GP Start button is clicked." },
      { kind: "fix", text: "Race ambience now uses a dedicated looping audio channel separate from music. It stops cleanly when the race ends or is skipped, then the post-race theme starts." },
      { kind: "new", text: "'Pit wall — decision required' pause now triggers the radio notification SFX while race ambience continues playing underneath." },
      { kind: "fix", text: "Charles Leclerc forced-retirement scream now triggers correctly — driver ID was 'charles-leclerc' but the data uses 'leclerc'." },
      { kind: "new", text: "Final season classification now plays the post-race theme as background music." },
      { kind: "new", text: "UISFX sci-fi sounds wired across all interactive screens: Setup wizard (constructor/driver/engine/philosophy/sponsor selection), MarketTab (hire/fire/swap), GarageTab (dev starts, part replacements, test runs), SponsorsTab (sign/terminate), ManagementTab (chat responses, driver/team actions, team orders), FinanceTab (round detail views)." },
      { kind: "improve", text: "Ambience audio channel added to AudioManager — ambience and music are now independently controllable, so ambience can stop while music continues and vice versa." },
      { kind: "fix", text: "Pause button no longer double-plays box-box + radio notification — radio notification only fires on automatic pit wall pauses, not owner-initiated pauses." },
      { kind: "fix", text: "Post-race theme now plays when the race finishes naturally (all laps complete) — previously it only played on 'Skip to Result'. Ambience stops and post-race theme starts via the App-level engine." },
      { kind: "fix", text: "Post-race theme stops and ambience starts when the next GP is started — seamless audio transition between races." },
      { kind: "fix", text: "UISFX AudioContext is now properly unlocked from the splash screen click, and the pack name was corrected from 'sci-fi' to 'scifi'. UI sounds now play on all interactive selections." },
    ],
  },
  {
    version: "v0.15",
    title: "Splash screen, audio fixes and polish",
    when: "25 August 2026 · 18:05",
    summary:
      "A sleek splash screen greets the player on launch — click anywhere to play the box-box SFX, which unlocks browser audio. Three seconds later the opening theme starts and the main landing page fades in. The audio settings button moved to top-right to avoid clashing with any buttons.",
    items: [
      { kind: "new", text: "Splash screen: dark cinematic landing with the F1 Owner logo, vignette overlay and pulsing glow. Click anywhere to play the box-box SFX (unlocks browser audio), then 3 seconds later the opening theme fades in and the landing page appears." },
      { kind: "fix", text: "Opening theme now plays reliably on first page load — the splash screen click satisfies the browser autoplay policy so music starts immediately instead of requiring a round-trip through the setup screens." },
      { kind: "fix", text: "Audio settings button moved from bottom-left to bottom-right to avoid overlapping the Setup wizard Back button." },
      { kind: "docs", text: "README updated with splash screen documentation." },
    ],
  },
  {
    version: "v0.14",
    title: "Full audio system, teammate mood dynamics, and quality-of-life fixes",
    when: "25 August 2026 · 17:15",
    summary:
      "The game now has a complete audio system with separate volume controls for background music, sound effects, and UI interaction sounds. All six MP3 files are wired to their specific triggers, and sci-fi UI sounds from uisfx.com provide tactile feedback for buttons, tabs, and notifications. Driver morale now factors in teammate performance and upgrades, the Weekend classification defaults to race results, and the Setup wizard scrolls to top on every step change.",
    items: [
      { kind: "new", text: "Full audio management system with separate volume sliders and mute toggles for music, SFX, and UI sounds — settings persist in localStorage." },
      { kind: "new", text: "SFX triggers wired: opening theme plays on landing until first GP, box-box on pause/race weekend decisions, radio notification on new management/sponsor/finance/garage alerts, post-race theme on classification screen, race ambience during live simulation, and Charles Leclerc scream on forced retirement." },
      { kind: "new", text: "UI interaction sounds from uisfx.com (sci-fi feel): button clicks, tab switches, hover feedback, and notification alerts — generated at runtime, no MP3 files needed." },
      { kind: "new", text: "Teammate mood dynamics: driver morale now factors in teammate confidence, frustration, and upgrade status — getting upgrades while your teammate doesn't causes frustration." },
      { kind: "fix", text: "2013 Marussia now uses the correct Cosworth CA2013 engine instead of Ferrari customer spec." },
      { kind: "fix", text: "Weekend classification now defaults to race results instead of qualifying." },
      { kind: "fix", text: "Setup wizard: Technical→Staff and Review→Expectation step transitions now scroll the page to top." },
      { kind: "docs", text: "README updated with audio system documentation." },
    ],
  },
  {
    version: "v0.13",
    title: "Radio answers in real time — and no more clipped labels",
    when: "24 August 2026 · 16:06",
    summary:
      "Retirement orders now bite instantly: the moment a driver answers the radio his frustration moves (+7 if he refuses, +4 if he grudgingly complies) along with a trust hit, visible immediately in the pit-wall telemetry's new Frustration cell, in the retirement briefing, and spelled out in the confirmation toasts — no more waiting for the GP to finish. Layout polish across the car panels: the Race tab's per-car headers wrap gracefully (long driver names truncate instead of pushing 'broken' tags off-screen), and long part names like 'ICE — Internal Combustion' scroll like a marquee while you hover, both in the Race tab's power-unit panel and in the Garage.",
    items: [
      { kind: "improve", text: "Immediate consequences: forced retirements apply frustration (+7 refused / +4 obeyed) and trust (−1 / −2) the second the order is given — shown live in the pit-wall Frustration cell, the retire briefing and the toast; finalizeRound only adds the news story now." },
      { kind: "fix", text: "Race-tab POWER UNIT headers: flex-wrap layout so the 'N broken' tag wraps below instead of overflowing, and long driver names truncate cleanly." },
      { kind: "new", text: "Hover marquee: truncated part names (e.g. 'ICE — Internal Combu…') scroll sideways while hovered until fully readable — applied to every part row in the Race tab panel and the Garage power-system cards." },
      { kind: "docs", text: "README notes live frustration feedback." },
    ],
  },
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
