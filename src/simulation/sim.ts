// ============================================================================
// F1 Owner — Season orchestrator (spec §53-54, §60-68)
// createSeason: finalize setup choices into a runnable SimulationState.
// runRound: one race weekend — sim, apply systems, advance the calendar.
// ============================================================================

import type {
  DifficultyId,
  Driver,
  Phase,
  RaceWeekendResult,
  SimulationState,
  SponsorSpec,
  TeamState,
} from "./types";
import { computeCarStats, carRating, driverAbility, trackWeights } from "./perf";
import { simulateRaceWeekend, type Competitor, type RaceInput } from "./race";
import { buildGridLineups } from "./grid";
import { applyChatResponse } from "./systems";
import {
  advanceDevelopment,
  advanceWear,
  applyMorale,
  applyRaceFinance,
  applyStandings,
  bankruptcyCheck,
  evaluateSponsors,
  generateDriverChat,
  generatePaddockNews,
  scheduleSponsorObjectives,
} from "./systems";
import { createRng, rand, type Rng } from "./rng";
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

/** Run the next race weekend of the season. Mutates state. */
export function runRound(state: SimulationState): RoundOutcome {
  state.lastSwap = null; // a race locks in the line-up — no refunds once it counts
  const t = state.team;
  if (!t) return { weekend: state.lastWeekend!, phase: state.phase, bankruptNow: false };
  const idx = state.round;
  const track = state.calendar[idx];
  if (!track) return { weekend: state.lastWeekend!, phase: "finished", bankruptNow: false };

  const rng = createRng(`${state.seed}:r${idx}`);
  const competitors = buildCompetitors(state, rng);

  const input: RaceInput = {
    season: state.season,
    difficulty: state.difficulty,
    gameLength: state.gameLength,
    track,
    rng,
    competitors,
    playerTeamId: t.constructorId,
    runSprint: track.sprint && state.gameLength !== "short",
  };
  const weekend = simulateRaceWeekend(input);
  weekend.round = idx + 1;

  applyStandings(state, weekend);
  applyMorale(state, weekend);
  advanceWear(state, weekend, rng);
  const finance = applyRaceFinance(state, weekend);
  void finance;
  evaluateSponsors(state);
  advanceDevelopment(state);
  generatePaddockNews(state, rng);
  generateDriverChat(state, rng);
  bankruptcyCheck(state);
  pushRaceNews(state, weekend);

  state.lastWeekend = weekend;
  state.completedRounds = idx + 1;
  state.round = state.completedRounds;
  state.updatedAt = Date.now();

  const prePhase = state.phase;
  if (state.round >= state.calendar.length) state.phase = "finished";
  const bankruptNow = prePhase !== "bankrupt" && state.phase === "bankrupt";
  return { weekend, phase: state.phase, bankruptNow };
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

  for (const did of [t.driver1Id, t.driver2Id]) {
    const driver = driverById(did, season);
    if (!driver) continue;
    list.push({
      driverId: did,
      teamId: t.constructorId,
      driver,
      driverState: t.drivers.find((ds) => ds.driverId === did),
      car: t.car,
      reliability: t.car.reliability,
      engineCond: t.components.engine.condition,
      gearboxCond: t.components.gearbox.condition,
      pitStop: Math.round(mechPit * (1 - pitBonus) * 100) / 100,
      errorChance: mechErr * (1 - pitBonus),
      strategyRating: Math.round(strategy),
      isPlayer: true,
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