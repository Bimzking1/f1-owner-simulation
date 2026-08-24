// ============================================================================
// F1 Owner — Season orchestrator (spec §53-54, §60-68)
// createSeason: finalize setup choices into a runnable SimulationState.
// runRound: one race weekend — sim, apply systems, advance the calendar.
// ============================================================================

import type {
  DifficultyId,
  Driver,
  Phase,
  RaceEntry,
  RaceEvent,
  RaceWeekendResult,
  Seat,
  SimulationState,
  SponsorSpec,
  TeamState,
  Track,
  WeatherId,
} from "./types";
import { createRng, clamp, rand, type Rng } from "./rng";
import { computeCarStats, carRating, driverAbility, trackWeights } from "./perf";
import {
  assembleWeekend,
  beginRace,
  advanceRace,
  completeRace,
  generateForecast,
  rollWeather,
  simulateQualifying,
  type Competitor,
  type RaceInput,
  type RaceSession,
} from "./race";
import { buildGridLineups } from "./grid";
import { applyChatResponse } from "./systems";
import {
  advanceDevelopment,
  advanceWear,
  applyMorale,
  applyRaceFinance,
  applyReputation,
  applyStandings,
  bankruptcyCheck,
  carParts,
  effectiveCarStats,
  effectivePuHealth,
  evaluateSponsors,
  generateDriverChallenge,
  generateDriverChat,
  generatePaddockNews,
  resolveDriverChallenge,
  scheduleSponsorObjectives,
} from "./systems";
import {
  constructorById,
  driverById,
  engineerById,
  engineById,
  enginesForSeason,
  gearboxById,
  gearboxesForSeason,
  mechanicById,
  sponsorById,
  techPackageById,
  techPackagesForSeason,
  seasonCalendar,
} from "@/data";

// ---------------------------------------------------------------------------

/** Setup draft → initialized season state. Mutates the draft. */
export function createSeason(draft: SimulationState, seed: string): SimulationState {
  const t = draft.team;
  if (!t) return draft;
  const season = draft.season;

  const ctor = constructorById(t.constructorId, season);
  const engine = engineById(t.engineId);
  const gearbox = gearboxById(t.gearboxId);
  const tech = techPackageById(t.techPackageId);
  if (!ctor || !engine || !gearbox || !tech) return draft;

  const car = computeCarStats(t, ctor.dna, tech, engine, gearbox);
  t.car = { ...t.car, ...car };
  t.startCash = t.cash;

  // live driver moods from real driver data
  t.drivers = [t.driver1Id, t.driver2Id]
    .map(driverById)
    .filter(Boolean)
    .map((d) => {
      const drv = d as Driver;
      const base = 55 + Math.round((drv.attributes.pressure - 50) / 6);
      return {
        driverId: drv.id,
        confidence: Math.round(((drv.overall - 60) * 2 + base) / 2),
        morale: Math.round((base + drv.attributes.racecraft) / 2),
        frustration: Math.round((100 - drv.attributes.consistency) * 0.4),
        form: 0,
        dnfs: 0,
        points: 0,
      };
    });

  // sponsors (spec §46-48): attach signed sponsors. Signing is free — no
  // up-front fee; sponsors pay their race rate every weekend.
  const rng0 = createRng(seed + ":sponsors");
  const signed = t.sponsorIds
    .map(sponsorById)
    .filter(Boolean)
    .sort((a, b) => (a as SponsorSpec).tier.localeCompare((b as SponsorSpec).tier)) as SponsorSpec[];
  t.sponsors = signed.map((spec) => ({
    sponsorId: spec.id,
    progress: 0,
    required: 0,
    deadlineRound: 0,
    patience: spec.patience,
    active: true,
    totalPaid: 0,
  }));
  t.pitCrew = Math.round(mechanicsPitSkill(t) * 100);
  scheduleSponsorObjectives(draft, rng0);

  // championship scaffolding (spec §53): the grid is a solved line-up where
  // only the player's two seats are customized — displaced drivers were
  // re-seated randomly into the vacancies their signings created.
  const gridRng = createRng(seed + ":grid");
  const grid = buildGridLineups(season, t.constructorId, [t.driver1Id, t.driver2Id], gridRng);
  draft.lineups = grid.lineups;
  draft.unattachedDrivers = grid.unattached;
  const driverList = Object.entries(grid.lineups)
    .flatMap(([teamId, ids]) => ids.map((id) => ({ id, teamId })))
    .map(({ id, teamId }) => ({ d: driverById(id, season), teamId }))
    .filter((x): x is { d: Driver; teamId: string } => !!x.d);
  draft.standingsDrivers = driverList.map(({ d, teamId }) => ({
    driverId: d.id,
    teamId,
    points: 0,
    wins: 0,
    podiums: 0,
    dnfs: 0,
    best: 0,
  }));
  draft.standingsConstructors = Object.keys(grid.lineups).map((teamId) => ({
    teamId,
    points: 0,
    wins: 0,
    podiums: 0,
    dnfs: 0,
  }));
  draft.calendar = seasonCalendar(season);
  draft.round = 0;
  draft.completedRounds = 0;
  draft.phase = "season";
  draft.seed = seed;
  draft.news.unshift({
    id: "welcome",
    round: 0,
    tag: "breaking",
    title: "Season preview",
    body: `The ${season} season is underway. Keep the team solvent and aim high.`,
    bodyEnjoyer: `It's ${season}. Make it count.`,
  });
  return draft;
}

// ---------------------------------------------------------------------------

export interface RoundOutcome {
  weekend: RaceWeekendResult;
  phase: Phase;
  bankruptNow: boolean;
}

/** Everything decided before the feature race starts: forecast, weather,
 *  qualifying, sprint. The returned session is resumable lap-by-lap so the
 *  UI can run a live race with owner interventions. Keep out of saves —
 *  the session holds closures (Rng). */
export interface PreparedRound {
  roundIdx: number;
  track: Track;
  input: RaceInput;
  weatherId: WeatherId;
  forecast: { rainProbability: number; confidence: "low" | "medium" | "high"; window?: string };
  qualifying: RaceEntry[];
  sprint?: RaceEntry[];
  preRaceEvents: RaceEvent[];
  gridPenaltyApplied: number;
  session: RaceSession;
}

/** Set the weekend up through the start of the feature race. Mutates state
 *  only by clearing lastSwap (a race locks in the line-up). */
export function prepareRound(state: SimulationState): PreparedRound | null {
  state.lastSwap = null; // a race locks in the line-up — no refunds once it counts
  const t = state.team;
  if (!t) return null;
  const idx = state.round;
  const track = state.calendar[idx];
  if (!track) return null;

  const rng = createRng(`${state.seed}:r${idx}`);
  const competitors = buildCompetitors(state, rng);

  // per-car stewards' penalties ride on each player Competitor (v0.10)
  const gridPenalty = Math.max(t.gridPenaltyBySeat?.car1 ?? t.gridPenalty ?? 0, t.gridPenaltyBySeat?.car2 ?? 0);
  const input: RaceInput = {
    season: state.season,
    difficulty: state.difficulty,
    gameLength: state.gameLength,
    track,
    rng,
    competitors,
    playerTeamId: t.constructorId,
    runSprint: track.sprint && state.gameLength !== "short",
    gridPenalty,
  };

  const forecast = generateForecast(track, rng, state.difficulty);
  const weatherId = rollWeather(track, forecast, rng);
  const preRaceEvents: RaceEvent[] = [];

  let grid = simulateQualifying(input);
  preRaceEvents.push({
    lap: 0,
    type: "info",
    severity: "info",
    text: `Qualifying complete — ${grid[0].driverId} on pole.`,
    textEnjoyer: "Qualifying done — the grid is set.",
  });

  let sprint: RaceEntry[] | undefined;
  if (input.runSprint && state.season === 2025) {
    const sprintSession = beginRace(input, weatherId, grid, [8, 7, 6, 5, 4, 3, 2, 1], false);
    advanceRace(sprintSession, sprintSession.laps);
    for (const e of sprintSession.events) preRaceEvents.push(e);
    sprint = completeRace(sprintSession);
    grid = sprint.map((s) => ({ ...s, points: 0 })).sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
    grid.forEach((g, i) => (g.gridPosition = i + 1));
    preRaceEvents.push({
      lap: Math.round(track.laps * 0.4),
      type: "info",
      severity: "success",
      text: "SPRINT complete — its order sets tomorrow's grid.",
      textEnjoyer: "SPRINT done — the grid is set.",
    });
  }

  const session = beginRace(input, weatherId, grid, [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], state.season === 2025);
  // Live handle for order consequences — same objects finalizeRound commits.
  session.team = state.team!;

  return {
    roundIdx: idx,
    track,
    input,
    weatherId,
    forecast: {
      rainProbability: forecast.rainProbability,
      confidence: forecast.confidence,
      window: forecast.window,
    },
    qualifying: grid,
    sprint,
    preRaceEvents,
    gridPenaltyApplied: gridPenalty,
    session,
  };
}

/** Apply post-race systems and advance the calendar. Consumes the prepared
 *  round's finished session. */
export function finalizeRound(state: SimulationState, prep: PreparedRound): RoundOutcome {
  const classified = completeRace(prep.session);
  const weekend = assembleWeekend(prep.input, {
    track: prep.track,
    weather: prep.weatherId,
    forecast: prep.forecast,
    qualifying: prep.qualifying,
    sprint: prep.sprint,
    race: classified,
    events: [...prep.preRaceEvents, ...prep.session.events],
    lapOrder: prep.session.lapOrder,
  });
  weekend.round = prep.roundIdx + 1;

  applyStandings(state, weekend);
  applyMorale(state, weekend, createRng(`${state.seed}:mor:r${prep.roundIdx}`));
  applyReputation(state, weekend);
  advanceWear(state, weekend, createRng(`${state.seed}:wear:r${prep.roundIdx}`));
  const finance = applyRaceFinance(state, weekend, createRng(`${state.seed}:fin:r${prep.roundIdx}`));
  void finance;
  evaluateSponsors(state);
  resolveDriverChallenge(state, weekend);
  // drivers who refused a team retirement call get a news story — the
  // frustration/trust cost was already applied live in advanceRace
  for (const id of prep.session.retireRefusals) {
    const d = driverById(id, state.season);
    state.news.unshift({
      id: `refuse-${prep.roundIdx}-${id}`,
      round: prep.roundIdx + 1,
      tag: "info",
      priority: "warning",
      title: `${d?.shortName ?? id} ignored a team order`,
      body: `The pit wall called him in and ${d?.shortName ?? id} refused, bringing the car home at his own pace. Frustration +7 — he believes he was throwing away a result.`,
      bodyEnjoyer: `Team orders? Not today. The driver knows better — apparently.`,
    });
  }
  advanceDevelopment(state);
  generatePaddockNews(state, createRng(`${state.seed}:news:r${prep.roundIdx}`));
  generateDriverChat(state, createRng(`${state.seed}:chat:r${prep.roundIdx}`));
  generateDriverChallenge(state, createRng(`${state.seed}:chal:r${prep.roundIdx}`));
  bankruptcyCheck(state);
  pushRaceNews(state, weekend);

  const t = state.team!;
  t.gridPenalty = undefined; // penalties served at this GP
  t.gridPenaltyBySeat = { car1: 0, car2: 0 };
  state.lastWeekend = weekend;
  state.completedRounds = prep.roundIdx + 1;
  state.round = state.completedRounds;
  state.updatedAt = Date.now();

  const prePhase = state.phase;
  if (state.round >= state.calendar.length) state.phase = "finished";
  const bankruptNow = prePhase !== "bankrupt" && state.phase === "bankrupt";
  return { weekend, phase: state.phase, bankruptNow };
}

/** Run the next race weekend of the season. Mutates state. */
export function runRound(state: SimulationState): RoundOutcome {
  const prep = prepareRound(state);
  if (!prep) return { weekend: state.lastWeekend!, phase: state.phase, bankruptNow: false };
  advanceRace(prep.session, prep.session.laps);
  return finalizeRound(state, prep);
}

// ---------------------------------------------------------------------------
// Competitors

function teamStrengthFactor(difficulty: DifficultyId): number {
  switch (difficulty) {
    case "ruthless": return 0.82;
    case "rookie": return 0.9;
    case "professional": return 0.96;
    default: return 1;
  }
}

function buildCompetitors(state: SimulationState, rng: Rng): Competitor[] {
  const t = state.team!;
  const season = state.season;
  const factor = teamStrengthFactor(state.difficulty);
  const list: Competitor[] = [];

  // player cars
  const pMechs = t.mechanicIds
    .map(mechanicById)
    .filter((m): m is NonNullable<ReturnType<typeof mechanicById>> => !!m);
  const mechPit = pMechs.length ? pMechs.reduce((a, m) => a + m.pitStop, 0) / pMechs.length : 3.1;
  const mechErr = pMechs.length ? pMechs.reduce((a, m) => a + m.errorChance, 0) / pMechs.length : 2;
  const pitBonus = (t.pitCrew - 50) / 300;
  const players = t.engineerIds
    .map(engineerById)
    .filter((m): m is NonNullable<ReturnType<typeof engineerById>> => !!m);
  const strategy = players.length
    ? Math.round(70 + (players.reduce((a, e) => a + e.expertise, 0) / players.length - 70) * 0.3)
    : 70;

  for (const [seatIdx, did] of [t.driver1Id, t.driver2Id].entries()) {
    const driver = driverById(did, season);
    if (!driver) continue;
    const seat: Seat = seatIdx === 0 ? "car1" : "car2";
    list.push({
      driverId: did,
      teamId: t.constructorId,
      driver,
      driverState: t.drivers.find((ds) => ds.driverId === did),
      // seat-targeted development projects give each car its own stats
      car: effectiveCarStats(t, season, seat),
      reliability: effectiveCarStats(t, season, seat).reliability,
      // Whole installed power system (2013: V8+KERS · 2025: all 7 PU parts),
      // now PER CAR — a tired MGU-H on one car doesn't drag the other down.
      engineCond: effectivePuHealth(state, seat),
      gearboxCond: carParts(t, seat).gearbox.condition,
      pitStop: Math.round(mechPit * (1 - pitBonus) * 100) / 100,
      errorChance: mechErr * (1 - pitBonus),
      strategyRating: Math.round(strategy),
      isPlayer: true,
      gridPenalty: t.gridPenaltyBySeat?.[seat] ?? t.gridPenalty ?? 0,
    });
  }

  // AI cars — fixed DNA + default tech, scaled by difficulty.
  const engines = enginesForSeason(season);
  const gearboxes = gearboxesForSeason(season);
  const techs = techPackagesForSeason(season);
  const engine = engines[0];
  const gearbox = gearboxes[0];
  const techPkg = techs[1] ?? techs[0];
  if (!engine || !gearbox || !techPkg) return list;

  for (const teamId of Object.keys(state.lineups ?? {})) {
    if (teamId === t.constructorId) continue;
    const ctor = constructorById(teamId, season);
    if (!ctor || ctor.season !== season) continue;
    const car = computeCarStats(
      { constructorId: teamId, philosophy: "balanced" },
      ctor.dna,
      techPkg,
      engine,
      gearbox,
    );
    const scalable = car as { aero: number; chassis: number; reliability: number; tireBehavior: number; power: number; gearboxPerf: number };
    const scale = (v: number) => Math.max(30, Math.round(v * factor));
    const scaledCar: Competitor["car"] = {
      aero: scale(scalable.aero),
      chassis: scale(scalable.chassis),
      reliability: scale(scalable.reliability),
      tireBehavior: scale(scalable.tireBehavior),
      power: scale(scalable.power),
      gearboxPerf: scale(scalable.gearboxPerf),
    };
    const drivers = (state.lineups?.[teamId] ?? []).map(driverById).filter(Boolean) as Driver[];
    for (const d of drivers) {
      const stable = (d.id.charCodeAt(0) * 31 + d.id.charCodeAt(1) * 7) % 10;
      list.push({
        driverId: d.id,
        teamId,
        driver: d,
        driverState: null,
        car: scaledCar,
        reliability: car.reliability,
        engineCond: 100 - (stable % 4) * 2,
        gearboxCond: 100 - ((stable + 1) % 5) * 2,
        pitStop: Math.round((rand(rng, 2.85, 3.25) * (2 - factor)) * 100) / 100,
        errorChance: Math.round(rand(rng, 0.6, 2.8) * 100) / 100,
        strategyRating: Math.round(58 + ctor.dna.engineering * 0.22 + rand(rng, -3, 5)),
        isPlayer: false,
      });
    }
  }
  return list;
}

// ---------------------------------------------------------------------------

function mechanicsPitSkill(t: TeamState): number {
  const mechs = t.mechanicIds
    .map(mechanicById)
    .filter((m): m is NonNullable<ReturnType<typeof mechanicById>> => !!m);
  if (!mechs.length) return 0.8;
  const sum = mechs.reduce((a, m) => a + 4 - m.pitStop + m.repairEfficiency / 300, 0);
  return Math.max(0.4, Math.min(1, sum / mechs.length / 3.6));
}

// ---------------------------------------------------------------------------
// News from the weekend (spec §45)

function pushRaceNews(state: SimulationState, weekend: RaceWeekendResult) {
  const t = state.team!;
  const playerIds = new Set(t.drivers.map((d) => d.driverId));
  const relevant = weekend.events.filter(
    (e) => e.severity === "danger" || (e.actor !== undefined && playerIds.has(e.actor)),
  );
  for (const e of relevant.slice(-4).reverse().slice(0, 3)) {
    state.news.unshift({
      id: `race-${weekend.round}-${e.lap}`,
      round: weekend.round,
      tag: e.severity === "danger" ? "breaking" : "driver",
      priority: e.severity === "danger" ? "urgent" : e.severity === "warning" ? "warning" : "info",
      title: e.text.replace(e.actor ?? "", "").trim().replace(/^,/, "").trim(),
      body: `Round ${weekend.round}, lap ${e.lap}: ${e.text}`,
      bodyEnjoyer: e.textEnjoyer,
    });
  }
  const finishes = weekend.playerEntries.map((p) => (p.dnf ? 999 : p.position));
  let summary = "No results recorded.";
  if (finishes.length) {
    const best = Math.min(...finishes);
    const worst = Math.max(...finishes);
    summary =
      best === 999
        ? "Both cars fail to finish."
        : best === worst
          ? `Best finish P${best}.`
          : `Best finish P${best}, worst P${worst}.`;
  }
  state.news.unshift({
    id: `result-${weekend.round}`,
    round: weekend.round,
    tag: "info",
    priority: "info",
    title: `Round ${weekend.round} report`,
    body: `${weekend.trackId} finished. ${summary} Full classification and replay on the Race tab.`,
    bodyEnjoyer: `That's the ${weekend.trackId} round done. ${summary}`,
    options: [{ label: "Open race tab", action: "goto:race" }],
  });
}

// ---------------------------------------------------------------------------
// News interactions

const CHAT_LABELS: Record<string, string> = {
  "chat-support": "Backed him publicly",
  "chat-promise": "Promised upgrades",
  "chat-tough": "Tough love",
};

const CHAT_ACKS: Record<string, string> = {
  "chat-support": "Thank you for standing by me",
  "chat-promise": "I'll hold you to that",
  "chat-tough": "...message received",
};

/** "Ms. Clark" / "Sir" / "Boss" — how characters address the owner. */
function ownerTitleOf(state: SimulationState): string {
  const o = state.team?.owner;
  return o?.callout?.trim() || o?.name?.trim() || "Boss";
}

export function resolveNewsAction(state: SimulationState, newsId: string, action: string) {
  const item = state.news.find((n) => n.id === newsId);
  if (!item || item.resolved) return;
  const t = state.team;
  if (!t) return;
  const round = state.completedRounds + 1;

  // UI navigation requests ("goto:sponsors") — nothing to simulate, just resolve.
  if (action.startsWith("goto:") || action === "dismiss") {
    item.resolved = true;
    return;
  }

  // Driver conversation responses (from the news feed or Team Management).
  if (action.startsWith("chat-")) {
    const driverId = item.options?.find((o) => o.action === action)?.payload;
    const ds = t.drivers.find((x) => x.driverId === driverId);
    const before = ds ? { morale: ds.morale, confidence: ds.confidence, frustration: ds.frustration } : null;
    const trustBefore = t.trust ?? 50;
    if (driverId) applyChatResponse(state, driverId, action);
    item.resolved = true;
    item.options = [];
    if (ds && before) {
      const delta = (k: "morale" | "confidence" | "frustration") => {
        const d = ds[k] - before[k];
        return `${k} ${d > 0 ? "+" : ""}${d}`;
      };
      const trustDelta = (t.trust ?? 50) - trustBefore;
      const label = CHAT_LABELS[action] ?? "You responded";
      const ack = CHAT_ACKS[action];
      item.body += `\n\n${label} — ${delta("morale")} · ${delta("confidence")} · ${delta("frustration")}.\nPaddock trust ${trustDelta > 0 ? "+" : ""}${trustDelta} (${t.trust ?? 50}/100).\nNow: morale ${ds.morale} · confidence ${ds.confidence} · frustration ${ds.frustration}.${ack ? `\n"${ack}, ${ownerTitleOf(state)}."` : ""}`;
    }
    return;
  }

  // Bossy-driver ultimatums: pay a bonus for a promised podium — or refuse.
  if (action === "challenge-accept" || action === "challenge-reject") {
    const ch = t.driverChallenge;
    const ds = t.drivers.find((x) => x.driverId === ch?.driverId);
    const d = ch ? driverById(ch.driverId, state.season) : null;
    if (!ch || !ds || !d || ch.accepted) {
      item.resolved = true;
      item.options = [];
      return;
    }
    if (action === "challenge-reject") {
      ds.frustration = clamp(ds.frustration + 10, 0, 100);
      ds.morale = clamp(ds.morale - 4, 0, 100);
      t.trust = clamp((t.trust ?? 50) - 1, 0, 100);
      item.body += `\n\nDemand rejected. "${d.shortName}" takes it badly: frustration +10 · morale −4 · trust −1.`;
      item.bodyEnjoyer = `You called ${d.shortName}'s bluff. He didn't like it.`;
      t.driverChallenge = undefined;
      item.resolved = true;
      item.options = [];
      return;
    }
    // accept
    if (t.cash < ch.amount) {
      item.body += `\n\nYou tried to accept but cannot cover $${ch.amount}M (cash $${t.cash.toFixed(2)}M). The demand still stands.`;
      item.bodyEnjoyer = `$${ch.amount}M needed — you have $${t.cash.toFixed(2)}M.`;
      return; // stays unresolved so the owner can free up cash or reject later
    }
    const round = state.completedRounds + 1;
    t.cash = Math.round((t.cash - ch.amount) * 100) / 100;
    t.history.push({
      round,
      label: `${d.shortName} podium bonus`,
      amount: -ch.amount,
      category: "other",
      detail: `Challenge accepted: $${ch.amount}M up front against a promised podium within ${ch.roundsLeft} race(s).\nDelivered → morale/trust reward. Missed → frustration +12 and trust −4.`,
    });
    ds.morale = clamp(ds.morale + 4, 0, 100);
    ds.confidence = clamp(ds.confidence + 3, 0, 100);
    ds.boosts ??= [];
    ds.boosts.push({ label: "Bonus challenge", confidence: 2, racesLeft: ch.roundsLeft + 1 });
    ch.accepted = true;
    item.body += `\n\nDeal. $${ch.amount}M paid up front — a podium is promised within ${ch.roundsLeft} race(s). Morale +4 · confidence +3. The whole paddock is watching.`;
    item.bodyEnjoyer = `${d.shortName} has ${ch.roundsLeft} race(s) to deliver. The money's gone either way.`;
    state.news.unshift({
      id: `chal-deal-${round}`,
      round,
      tag: "driver",
      priority: "info",
      title: `${d.shortName}'s challenge is on`,
      body: `The garage knows about the bet. Deliver or melt down.`,
      bodyEnjoyer: `A star wagered his own pride for $${ch.amount}M.`,
    });
    item.resolved = true;
    item.options = [];
    return;
  }

  if (action === "engineUpgrade") {
    const cost = state.season === 2013 ? 4.5 : 6.5;
    if (t.cash >= cost) {
      t.cash = Math.round((t.cash - cost) * 100) / 100;
      t.car.power = Math.min(100, t.car.power + 3);
      t.car.reliability = Math.min(100, t.car.reliability + 2);
      t.history.push({
        round,
        label: "Supplier engine upgrade",
        amount: -cost,
        category: "supplier",
        detail: `Supplier engine upgrade.\n$${cost}M one-time cost.\n+3 power, +2 reliability (${engineById(t.engineId)?.supplier ?? "Engine supplier"} unit).`,
      });
      item.title = "Engine upgrade purchased";
      item.body = `+3 power, +2 reliability. -$${cost}M.`;
      item.bodyEnjoyer = `Engine upgraded. That's $${cost}M gone.`;
      state.news.unshift({
        id: `upgraded-${round}`,
        round,
        tag: "supplier",
        title: "Engine upgrade on track",
        body: "The energy recovery upgrade is installed.",
        bodyEnjoyer: "The engine upgrade is bolted on.",
      });
    } else {
      item.title = "Engine upgrade — not enough cash";
      item.body = `You need $${cost}M; you have $${t.cash}M.`;
      item.bodyEnjoyer = `$${cost}M needed, $${t.cash}M available.`;
      item.options = [];
    }
  }
  item.resolved = true;
}

// ---------------------------------------------------------------------------

export function traceHelpers(state: SimulationState) {
  const t = state.team;
  if (!t) return null;
  const track = state.calendar[state.round] ?? state.calendar[0];
  if (!track) return null;
  const w = trackWeights(track);
  const rated = t.drivers.map((ds) => {
    const d = driverById(ds.driverId, state.season);
    return { driverId: ds.driverId, rating: d ? Math.round(driverAbility(d, ds, w)) : 0 };
  });
  return { carRating: carRating(t.car, w), rated };
}