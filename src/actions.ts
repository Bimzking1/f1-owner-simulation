// ============================================================================
// F1 Owner — Player actions during the season (market, crew, sponsors, dev)
// Each takes a SimulationState and returns a user-facing message.
// ============================================================================

import type { Driver, DriverBoost, DriverState, SimulationState, TestReport, TestType } from "@/simulation/types";
import type { DevOption } from "@/simulation/systems";
import {
  generateDevOptions,
  replaceComponent,
  startProject,
  prizeMoney,
} from "@/simulation/systems";
import { resolveNewsAction } from "@/simulation/sim";
import { createRng, clamp } from "@/simulation/rng";
import { driverById, engineerById, mechanicById, sponsorById } from "@/data";
import { difficultyOf } from "./state";

export type ActionResult = { ok: boolean; message: string };

/** Move paddock trust after a decision; returns the delta for messaging. */
function addTrust(t: SimulationState["team"], delta: number): number {
  if (!t) return 0;
  t.trust = Math.max(0, Math.min(100, (t.trust ?? 50) + delta));
  return delta;
}

const trustNote = (delta: number) => (delta !== 0 ? ` Trust ${delta > 0 ? "+" : ""}${delta}.` : "");

function msg(result: ActionResult, ok: boolean, message: string): ActionResult {
  result.ok = ok;
  result.message = message;
  return result;
}

export function hireEngineer(state: SimulationState, engineerId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (t.engineerIds.includes(engineerId)) return msg(result, false, "Already on the books.");
  if (t.engineerIds.length >= 5) return msg(result, false, "Engineering staff is full (5 max).");
  const eng = engineerById(engineerId);
  if (!eng) return msg(result, false, "Unknown engineer.");
  t.engineerIds.push(engineerId);
  t.history.push({
    round: state.completedRounds + 1,
    label: `Hire ${eng.name}`,
    amount: 0,
    category: "staff",
    detail: `${eng.name} signed.\nNo up-front fee — the $${eng.cost}M seasonal salary is paid per race weekend.\nThat's $${Math.round((eng.cost / (state.calendar.length || 19)) * 100) / 100}M/weekend.`,
  });
  return msg(result, true, `${eng.name} signed. Salary paid per weekend.`);
}

export function fireEngineer(state: SimulationState, engineerId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (!t.engineerIds.includes(engineerId)) return msg(result, false, "Not on the books.");
  const eng = engineerById(engineerId)!;
  t.engineerIds = t.engineerIds.filter((id) => id !== engineerId);
  const cost = Math.round((eng.cost * 0.5) * 100) / 100; // severance
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.history.push({
    round: state.completedRounds + 1,
    label: `${eng.name} exit`,
    amount: -cost,
    category: "staff",
    detail: `${eng.name} released.\nOne-time severance = 50% of the $${eng.cost}M seasonal salary = $${cost}M.`,
  });
  return msg(result, true, `${eng.name} released (severance $${cost}M).${trustNote(addTrust(t, -1))}`);
}

export function hireMechanic(state: SimulationState, mechanicId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (t.mechanicIds.includes(mechanicId)) return msg(result, false, "Already on the crew.");
  if (t.mechanicIds.length >= 5) return msg(result, false, "Pit crew is full (5 max).");
  const mech = mechanicById(mechanicId);
  if (!mech) return msg(result, false, "Unknown mechanic.");
  t.mechanicIds.push(mechanicId);
  t.history.push({
    round: state.completedRounds + 1,
    label: `Hire ${mech.name}`,
    amount: 0,
    category: "staff",
    detail: `${mech.name} signed.\nNo up-front fee — the $${mech.cost}M seasonal salary is paid per race weekend.\nThat's $${Math.round((mech.cost / (state.calendar.length || 19)) * 100) / 100}M/weekend.`,
  });
  return msg(result, true, `${mech.name} joined the crew. Salary paid per weekend.`);
}

export function fireMechanic(state: SimulationState, mechanicId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (!t.mechanicIds.includes(mechanicId)) return msg(result, false, "Not on the crew.");
  const mech = mechanicById(mechanicId)!;
  t.mechanicIds = t.mechanicIds.filter((id) => id !== mechanicId);
  const cost = Math.round((mech.cost * 0.5) * 100) / 100;
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.history.push({
    round: state.completedRounds + 1,
    label: `${mech.name} exit`,
    amount: -cost,
    category: "staff",
    detail: `${mech.name} released.\nOne-time severance = 50% of the $${mech.cost}M seasonal salary = $${cost}M.`,
  });
  return msg(result, true, `${mech.name} released (severance $${cost}M).${trustNote(addTrust(t, -1))}`);
}

export interface SwapQuote {
  currentId: string;
  target: Driver;
  prorated: number;
  fee: number;
  total: number;
  canAfford: boolean;
}

/** Transfer cost for a seat swap: prorated salary delta + $2M break fee. */
export function swapQuote(state: SimulationState, slot: 1 | 2, driverId: string): SwapQuote | null {
  const t = state.team!;
  const currentId = slot === 1 ? t.driver1Id : t.driver2Id;
  const target = driverById(driverId, state.season);
  if (!target) return null;
  const old = driverById(currentId, state.season);
  const roundsLeft = Math.max(1, state.calendar.length - state.round);
  const prorated = Math.max(0, ((target.salary - (old?.salary ?? 4)) / state.calendar.length) * roundsLeft);
  const fee = 2; // $M break fee
  const total = Math.round((prorated + fee) * 100) / 100;
  return { currentId, target, prorated, fee, total, canAfford: t.cash >= total };
}

/** Swap one of the two seats (spec §45 driver market). */
export function swapDriver(state: SimulationState, slot: 1 | 2, driverId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  const currentId = slot === 1 ? t.driver1Id : t.driver2Id;
  const otherId = slot === 1 ? t.driver2Id : t.driver1Id;
  if (currentId === driverId) return msg(result, false, "Already driving.");
  if (driverId === otherId) return msg(result, false, `${driverById(driverId, state.season)?.shortName ?? driverId} already drives for the team.`);
  const target = driverById(driverId, state.season);
  if (!target) return msg(result, false, "Unknown driver.");
  const old = driverById(currentId, state.season);
  const quote = swapQuote(state, slot, driverId)!;
  const total = quote.total;
  if (t.cash < total) return msg(result, false, `Need $${total}M for the transfer.`);
  t.cash = Math.round((t.cash - total) * 100) / 100;
  const previousState = t.drivers.find((d) => d.driverId === currentId) ?? null;
  if (slot === 1) t.driver1Id = driverId; else t.driver2Id = driverId;
  if (state.lineups) state.lineups[t.constructorId] = [t.driver1Id, t.driver2Id];
  t.drivers = t.drivers.filter((d) => d.driverId !== currentId);
  const newState: DriverState = {
    driverId,
    confidence: 50,
    morale: 60,
    frustration: 20,
    form: 0,
    dnfs: 0,
    points: 0,
  };
  t.drivers.push(newState);
  t.history.push({
    round: state.completedRounds + 1,
    label: `${old?.shortName ?? currentId} out, ${target.shortName} in`,
    amount: -total,
    category: "other",
    detail: `Seat change.\nBreak fee: $${quote.fee}M\nProrated salary delta (${state.calendar.length - state.completedRounds} remaining rounds): $${quote.prorated}M\nTotal: $${total}M`,
  });
  state.news.unshift({
    id: `swap-${state.completedRounds + 1}-${driverId}`,
    round: state.completedRounds + 1,
    tag: "driver",
    title: `${target.shortName} joins the team`,
    body: `Transfer fee $${total}M.`,
    bodyEnjoyer: `${target.shortName} is in. That cost $${total}M.`,
  });
  state.lastSwap = {
    slot,
    previousDriverId: currentId,
    previousState,
    newDriverId: driverId,
    newState,
    fee: total,
    round: state.completedRounds + 1,
  };
  return msg(result, true, `${target.name} signed ($${total}M).${trustNote(addTrust(t, -2))}`);
}

/** Refund the last driver swap before any race has been run (undo). */
export function undoDriverSwap(state: SimulationState): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  const log = state.lastSwap;
  if (!log) return msg(result, false, "Nothing to undo.");
  const currentId = log.slot === 1 ? t.driver1Id : t.driver2Id;
  if (currentId !== log.newDriverId) return msg(result, false, "Line-up changed since the swap.");
  const target = driverById(log.newDriverId, state.season);
  if (log.slot === 1) t.driver1Id = log.previousDriverId; else t.driver2Id = log.previousDriverId;
  if (state.lineups) state.lineups[t.constructorId] = [t.driver1Id, t.driver2Id];
  const newsIdx = state.news.findIndex((n) => n.id.startsWith(`swap-${log.round}-`));
  if (newsIdx >= 0) state.news.splice(newsIdx, 1);
  const histIdx = [...t.history].reverse().findIndex((h) => (h.amount + log.fee) < 0.001 && h.label.includes("out, "));
  if (histIdx >= 0) t.history.splice(t.history.length - 1 - histIdx, 1);
  t.cash = Math.round((t.cash + log.fee) * 100) / 100;
  const rest = t.drivers.filter((d) => d.driverId !== log.newDriverId);
  if (log.previousState && !rest.some((d) => d.driverId === log.previousState!.driverId)) {
    rest.push(log.previousState);
  }
  t.drivers = rest;
  state.lastSwap = null;
  return msg(result, true, `${target?.shortName ?? "Swap"} cancelled — $${log.fee}M refunded.`);
}

export function signSponsor(state: SimulationState, sponsorId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (t.sponsors.some((s) => s.sponsorId === sponsorId)) return msg(result, false, "Already signed.");
  if (t.sponsors.filter((s) => s.active).length >= 5) return msg(result, false, "Max 5 sponsor slots.");
  const spec = sponsorById(sponsorId);
  if (!spec) return msg(result, false, "Unknown sponsor.");
  if (t.reputation < (spec.tier === "title" ? 30 : 0)) return msg(result, false, "Reputation too low for a title sponsor.");
  t.sponsors.push({
    sponsorId: spec.id,
    progress: 0,
    required: 0,
    deadlineRound: 0,
    patience: spec.patience,
    active: true,
    totalPaid: 0,
  });
  const round = state.completedRounds + 1;
  scheduleObjective(state, spec.id, round);
  if (!state.lastWeekend) scheduleObjective(state, spec.id, 1);
  t.history.push({
    round,
    label: `${spec.name} signing`,
    amount: 0,
    category: "sponsor",
    detail: `${spec.name} signed.\nNo up-front fee — pays $${spec.racePayment}M per race weekend.\nBonus: +$${Math.round(spec.bonus * 100) / 100}M if the objective is met.`,
  });
  return msg(result, true, `${spec.name} signed. No up-front fee — pays per race.${trustNote(addTrust(t, 1))}`);
}

function scheduleObjective(state: SimulationState, sponsorId: string, round: number) {
  const sp = state.team!.sponsors.find((s) => s.sponsorId === sponsorId);
  if (!sp) return;
  const spec = sponsorById(sponsorId);
  if (!spec) return;
  switch (spec.objective) {
    case "pointsNextRaces": sp.required = 3; sp.deadlineRound = round + 4; break;
    case "top10NextRaces": sp.required = 4; sp.deadlineRound = round + 6; break;
    case "podiumByRound": sp.required = 1; sp.deadlineRound = Math.max(4, state.calendar.length - (state.season === 2013 ? 4 : 8)); break;
    case "pointsConsecutive": sp.required = state.season === 2013 ? 2 : 3; sp.deadlineRound = round + 12; break;
    case "beatRival": sp.required = 1; sp.deadlineRound = round + 5; break;
    case "wccPosition": sp.required = state.season === 2013 ? 6 : 8; sp.deadlineRound = state.calendar.length; break;
  }
}

export function terminateSponsor(state: SimulationState, sponsorId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  const s = t.sponsors.find((x) => x.sponsorId === sponsorId);
  if (!s) return msg(result, false, "Not signed.");
  const spec = sponsorById(sponsorId)!;
  s.active = false;
  const fee = Math.round(spec.bonus * 0.4 * 100) / 100;
  t.cash = Math.round((t.cash - fee) * 100) / 100;
  t.reputation = Math.max(0, t.reputation - 5);
  t.history.push({
    round: state.completedRounds + 1,
    label: `${spec.name} terminated`,
    amount: -fee,
    category: "sponsor",
    detail: `${spec.name} terminated.\nExit fee = 40% of the $${Math.round(spec.bonus * 100) / 100}M objective bonus = $${fee.toFixed(2)}M.\nReputation −5.`,
  });
  return msg(result, true, `${spec.name} terminated ($${fee}M exit fee).`);
}

// ---------------------------------------------------------------------------
// Testing (spec §79)

const TEST_COSTS: Record<TestType, number> = {
  performance: 1.5,
  reliability: 1.2,
  tire: 0.8,
  driver: 0.5,
};

export function runTest(state: SimulationState, type: TestType): TestReport {
  const t = state.team!;
  const cost = TEST_COSTS[type];
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.history.push({ round: state.completedRounds + 1, label: `${labelOf(type)} test`, amount: -cost, category: "testing" });
  const rng = createRng(`${state.seed}:test:${state.completedRounds}:${type}`);
  const test = buildTestReport(state, type, rng);
  if (type === "driver") {
    for (const ds of t.drivers) {
      ds.confidence = clamp(ds.confidence + 4, 0, 100);
      ds.morale = clamp(ds.morale + 3, 0, 100);
    }
  }
  state.testing.unshift(test);
  return test;
}

function labelOf(type: TestType): string {
  return ({ performance: "Performance", reliability: "Reliability", tire: "Tire wear", driver: "Driver" } as const)[type];
}

function buildTestReport(state: SimulationState, type: TestType, rng: () => number): TestReport {
  const t = state.team!;
  let value: number;
  if (type === "driver") {
    const d = t.drivers[0] ? driverById(t.drivers[0].driverId, state.season) : undefined;
    value = Math.round((d ? d.overall + t.drivers[0].form * 2 : 70) * (0.94 + rng() * 0.12));
  } else {
    const base = {
      performance: Math.round((t.car.aero * 0.5 + t.car.chassis * 0.3 + t.car.power * 0.2) * (0.9 + rng() * 0.2)),
      reliability: Math.round(t.car.reliability * (0.9 + rng() * 0.2)),
      tire: Math.round(t.car.tireBehavior * (0.9 + rng() * 0.2)),
    };
    value = base[type];
  }
  value = clamp(value, 30, 100);
  const confidence = Math.round(55 + rng() * 40);
  const insight = type === "performance"
    ? "Other teams are developing faster than expected."
    : type === "reliability"
      ? "Component inspection shows normal degradation curves."
      : type === "tire"
        ? "Tire behavior is predictable; degradation is average."
        : "The simulator showed no bad habits.";
  return {
    type,
    label: labelOf(type),
    labelEnjoyer: labelOf(type),
    value: `${value}`,
    confidence,
    insight,
    insightEnjoyer: "Read the numbers as you like.",
    cost: TEST_COSTS[type],
  };
}

// ---------------------------------------------------------------------------

export { generateDevOptions, startProject, replaceComponent, resolveNewsAction };

export function startDev(state: SimulationState, option: DevOption): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  if (!startProject(state, option)) return msg(result, false, "Not enough cash.");
  return msg(result, true, `${option.name} started ($${option.cost}M).`);
}

export function replaceEngine(state: SimulationState): ActionResult {
  return doReplace(state, "engine");
}
export function replaceGearbox(state: SimulationState): ActionResult {
  return doReplace(state, "gearbox");
}

// ---------------------------------------------------------------------------
// Team management — owner interventions on driver morale (spec: owner tools)

export type MgmtAction = "speech" | "bonus" | "fine" | "rant";

export const MGMT_INFO: Record<MgmtAction, { label: string; cost: number; cooldown: number; desc: string }> = {
  speech: { label: "Motivational speech", cost: 0, cooldown: 3, desc: "Rally the driver in front of the garage. Free, small morale + confidence boost." },
  bonus: { label: "Performance bonus", cost: 2, cooldown: 5, desc: "A $2M cash sweetener paid now. Big morale + confidence boost." },
  fine: { label: "Fine", cost: 1, cooldown: 6, desc: "Formally fine the driver — $1M lands in the team account. Resets frustration hard, hurts morale." },
  rant: { label: "Private rant", cost: 0, cooldown: 4, desc: "Let them have it behind closed doors. Crushes frustration but damages morale and confidence." },
};

/** How each owner decision moves paddock trust. */
const TRUST_DELTA: Record<MgmtAction, number> = {
  speech: 1,
  bonus: 2,
  fine: -3,
  rant: -4,
};

/** Rounds remaining before the action is available again (0 = ready). */
export function mgmtCooldown(state: SimulationState, driverId: string, action: MgmtAction): number {
  const t = state.team!;
  const last = [...(t.mgmt ?? [])].reverse().find((m) => m.driverId === driverId && m.action === action);
  if (!last) return 0;
  const elapsed = state.completedRounds - last.round;
  return Math.max(0, MGMT_INFO[action].cooldown - elapsed);
}

export function manageDriver(state: SimulationState, driverId: string, action: MgmtAction): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  const ds = t.drivers.find((x) => x.driverId === driverId);
  if (!ds) return msg(result, false, "Driver not under contract.");
  if (mgmtCooldown(state, driverId, action) > 0)
    return msg(result, false, `${MGMT_INFO[action].label} available in ${mgmtCooldown(state, driverId, action)} round(s).`);
  const info = MGMT_INFO[action];
  if (t.cash < info.cost) return msg(result, false, `Need $${info.cost}M for that.`);

  t.mgmt ??= [];
  t.mgmt.push({ driverId, action, round: state.completedRounds });
  if (action === "bonus") {
    t.cash = Math.round((t.cash - info.cost) * 100) / 100;
    t.history.push({
      round: state.completedRounds + 1,
      label: `${info.label} payment`,
      amount: -info.cost,
      category: "other",
      detail: `${info.label} for ${driverById(driverId, state.season)?.name ?? driverId}.\nOne-time owner intervention costing $${info.cost}M.`,
    });
  }
  if (action === "fine") {
    // the driver pays the fine into the team's account
    t.cash = Math.round((t.cash + info.cost) * 100) / 100;
    t.history.push({
      round: state.completedRounds + 1,
      label: `Fine collected`,
      amount: info.cost,
      category: "other",
      detail: `${driverById(driverId, state.season)?.name ?? driverId} fined $${info.cost}M for a formal disciplinary breach.\nThe money is deducted from the driver's next payout and lands in the team account.`,
    });
  }

  let effect = "";
  let tail: DriverBoost | null = null;
  switch (action) {
    case "speech":
      ds.morale = clamp(ds.morale + 5, 0, 100);
      ds.confidence = clamp(ds.confidence + 2, 0, 100);
      tail = { label: "Speech", morale: 2, racesLeft: 2 };
      effect = "morale +5, confidence +2";
      break;
    case "bonus":
      ds.morale = clamp(ds.morale + 10, 0, 100);
      ds.confidence = clamp(ds.confidence + 5, 0, 100);
      tail = { label: "Bonus", morale: 3, confidence: 2, racesLeft: 4 };
      effect = "morale +10, confidence +5";
      break;
    case "fine":
      ds.frustration = clamp(ds.frustration - 10, 0, 100);
      ds.morale = clamp(ds.morale - 5, 0, 100);
      tail = { label: "Fine", morale: -2, racesLeft: 3 };
      effect = "frustration −10, morale −5";
      break;
    case "rant":
      ds.frustration = clamp(ds.frustration - 6, 0, 100);
      ds.morale = clamp(ds.morale - 8, 0, 100);
      ds.confidence = clamp(ds.confidence - 2, 0, 100);
      tail = { label: "Rant", morale: -2, racesLeft: 3 };
      effect = "frustration −6, morale −8, confidence −2";
      break;
  }
  if (tail) {
    ds.boosts ??= [];
    const existing = ds.boosts.find((b) => b.label === tail.label);
    if (existing) existing.racesLeft = Math.max(existing.racesLeft, tail.racesLeft);
    else ds.boosts.push(tail);
  }
  return msg(result, true, `${info.label}: ${effect}.${tail ? ` Lingering: ${boostDesc(tail)}.` : ""}${trustNote(addTrust(t, TRUST_DELTA[action]))}`);
}

/** Human-readable summary of a lingering boost, e.g. "morale +2 per weekend ×3". */
export function boostDesc(b: DriverBoost): string {
  const parts: string[] = [];
  const sign = (v: number) => `${v > 0 ? "+" : ""}${v}`;
  if (b.morale) parts.push(`morale ${sign(b.morale)}`);
  if (b.confidence) parts.push(`confidence ${sign(b.confidence)}`);
  if (b.frustration) parts.push(`frustration ${sign(b.frustration)}`);
  return `${parts.join(", ")} per weekend ×${b.racesLeft}`;
}

// ---------------------------------------------------------------------------
// Team activities — paid whole-team boosts (team building, training camp, ...)

export type TeamAction = "teambuilding" | "trainingcamp" | "psych";

export const TEAM_INFO: Record<TeamAction, { label: string; cost: number; cooldown: number; desc: string }> = {
  teambuilding: {
    label: "Team building day",
    cost: 3,
    cooldown: 5,
    desc: "Karting, BBQ and a few beers with the whole crew. Both drivers feel the lift, frustration eases and the pit garage gels (+1 pit crew).",
  },
  trainingcamp: {
    label: "Training camp",
    cost: 5,
    cooldown: 8,
    desc: "A week at a private facility: simulator work, fitness and race-craft drills. Sharpens both drivers' confidence noticeably.",
  },
  psych: {
    label: "Sports psychology",
    cost: 2.5,
    cooldown: 6,
    desc: "One-on-one mental coaching for each driver. Clears heads, rebuilds self-belief and takes the edge off frustration.",
  },
};

/** Rounds remaining before the team activity is available again (0 = ready). */
export function teamCooldown(state: SimulationState, action: TeamAction): number {
  const t = state.team!;
  const last = [...(t.mgmt ?? [])].reverse().find((m) => m.driverId === "*team*" && m.action === action);
  if (!last) return 0;
  const elapsed = state.completedRounds - last.round;
  return Math.max(0, TEAM_INFO[action].cooldown - elapsed);
}

export function manageTeam(state: SimulationState, action: TeamAction): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (teamCooldown(state, action) > 0) {
    return msg(result, false, `${TEAM_INFO[action].label} available in ${teamCooldown(state, action)} round(s).`);
  }
  const info = TEAM_INFO[action];
  if (t.cash < info.cost) return msg(result, false, `Need $${info.cost}M for that.`);

  t.mgmt ??= [];
  t.mgmt.push({ driverId: "*team*", action, round: state.completedRounds });
  t.cash = Math.round((t.cash - info.cost) * 100) / 100;
  t.history.push({
    round: state.completedRounds + 1,
    label: info.label,
    amount: -info.cost,
    category: "other",
    detail: `${info.label} — whole-team activity costing $${info.cost}M.\nBoosts morale/confidence of both drivers${action === "teambuilding" ? " and +1 pit crew cohesion" : ""}.`,
  });

  let effect = "";
  const tails: Record<TeamAction, DriverBoost> = {
    teambuilding: { label: "Team building", morale: 2, racesLeft: 3 },
    trainingcamp: { label: "Training camp", confidence: 3, racesLeft: 4 },
    psych: { label: "Psychology", frustration: -3, confidence: 2, racesLeft: 3 },
  };
  for (const ds of t.drivers) {
    switch (action) {
      case "teambuilding":
        ds.morale = clamp(ds.morale + 6, 0, 100);
        ds.frustration = clamp(ds.frustration - 4, 0, 100);
        effect = "morale +6, frustration −4 (both drivers), pit crew +1";
        break;
      case "trainingcamp":
        ds.confidence = clamp(ds.confidence + 8, 0, 100);
        ds.morale = clamp(ds.morale + 3, 0, 100);
        effect = "confidence +8, morale +3 (both drivers)";
        break;
      case "psych":
        ds.confidence = clamp(ds.confidence + 5, 0, 100);
        ds.frustration = clamp(ds.frustration - 5, 0, 100);
        effect = "confidence +5, frustration −5 (both drivers)";
        break;
    }
    ds.boosts ??= [];
    ds.boosts.push({ ...tails[action] });
  }
  if (action === "teambuilding") t.pitCrew = clamp(t.pitCrew + 1, 0, 100);
  const teamTrust: Record<TeamAction, number> = { teambuilding: 2, trainingcamp: 2, psych: 1 };
  return msg(result, true, `${info.label}: ${effect}. Lingering: ${boostDesc(tails[action])} each.${trustNote(addTrust(t, teamTrust[action]))}`);
}

function doReplace(state: SimulationState, component: "engine" | "gearbox"): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  const before = t.components[component].condition;
  replaceComponent(state, component);
  if (t.components[component].condition === 100 && t.components[component].age === 0 && t.components[component].replacements > 0) {
    return msg(result, true, `${component === "engine" ? "Engine" : "Gearbox"} replaced.`);
  }
  void before;
  return msg(result, false, "Not enough cash.");
}

export function settleSeason(state: SimulationState): number {
  const t = state.team!;
  const pos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
  const money = prizeMoney(state.standingsConstructors.length, pos);
  t.cash = Math.round((t.cash + money) * 100) / 100;
  t.history.push({ round: state.calendar.length, label: `WCC P${pos} prize money`, amount: money, category: "prize" });
  return money;
}

export function difficultyCashMult(state: SimulationState): number {
  return difficultyOf(state).cashMultiplier;
}

export const testingBudget = () => TEST_COSTS;

export { clamp };