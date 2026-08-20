// ============================================================================
// F1 Owner — Player actions during the season (market, crew, sponsors, dev)
// Each takes a SimulationState and returns a user-facing message.
// ============================================================================

import type { Driver, DriverState, SimulationState, TestReport, TestType } from "@/simulation/types";
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
  const cost = Math.round(eng.cost * 100) / 100;
  if (t.cash < cost) return msg(result, false, `Need $${cost}M.`);
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.engineerIds.push(engineerId);
  t.history.push({ round: state.completedRounds + 1, label: `Hire ${eng.name}`, amount: -cost, category: "staff" });
  return msg(result, true, `${eng.name} signed.`);
}

export function fireEngineer(state: SimulationState, engineerId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (!t.engineerIds.includes(engineerId)) return msg(result, false, "Not on the books.");
  const eng = engineerById(engineerId)!;
  t.engineerIds = t.engineerIds.filter((id) => id !== engineerId);
  const cost = Math.round((eng.cost * 0.5) * 100) / 100; // severance
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.history.push({ round: state.completedRounds + 1, label: `${eng.name} exit`, amount: -cost, category: "staff" });
  return msg(result, true, `${eng.name} released (severance $${cost}M).`);
}

export function hireMechanic(state: SimulationState, mechanicId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (t.mechanicIds.includes(mechanicId)) return msg(result, false, "Already on the crew.");
  if (t.mechanicIds.length >= 5) return msg(result, false, "Pit crew is full (5 max).");
  const mech = mechanicById(mechanicId);
  if (!mech) return msg(result, false, "Unknown mechanic.");
  const cost = Math.round(mech.cost * 100) / 100;
  if (t.cash < cost) return msg(result, false, `Need $${cost}M.`);
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.mechanicIds.push(mechanicId);
  t.history.push({ round: state.completedRounds + 1, label: `Hire ${mech.name}`, amount: -cost, category: "staff" });
  return msg(result, true, `${mech.name} joined the crew.`);
}

export function fireMechanic(state: SimulationState, mechanicId: string): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  if (!t.mechanicIds.includes(mechanicId)) return msg(result, false, "Not on the crew.");
  const mech = mechanicById(mechanicId)!;
  t.mechanicIds = t.mechanicIds.filter((id) => id !== mechanicId);
  const cost = Math.round((mech.cost * 0.5) * 100) / 100;
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.history.push({ round: state.completedRounds + 1, label: `${mech.name} exit`, amount: -cost, category: "staff" });
  return msg(result, true, `${mech.name} released (severance $${cost}M).`);
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
  const target = driverById(driverId);
  if (!target) return null;
  const old = driverById(currentId);
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
  if (driverId === otherId) return msg(result, false, `${driverById(driverId)?.shortName ?? driverId} already drives for the team.`);
  const target = driverById(driverId);
  if (!target) return msg(result, false, "Unknown driver.");
  const old = driverById(currentId);
  const quote = swapQuote(state, slot, driverId)!;
  const total = quote.total;
  if (t.cash < total) return msg(result, false, `Need $${total}M for the transfer.`);
  t.cash = Math.round((t.cash - total) * 100) / 100;
  const previousState = t.drivers.find((d) => d.driverId === currentId) ?? null;
  if (slot === 1) t.driver1Id = driverId; else t.driver2Id = driverId;
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
  return msg(result, true, `${target.name} signed ($${total}M).`);
}

/** Refund the last driver swap before any race has been run (undo). */
export function undoDriverSwap(state: SimulationState): ActionResult {
  const result: ActionResult = { ok: false, message: "" };
  const t = state.team!;
  const log = state.lastSwap;
  if (!log) return msg(result, false, "Nothing to undo.");
  const currentId = log.slot === 1 ? t.driver1Id : t.driver2Id;
  if (currentId !== log.newDriverId) return msg(result, false, "Line-up changed since the swap.");
  const target = driverById(log.newDriverId);
  if (log.slot === 1) t.driver1Id = log.previousDriverId; else t.driver2Id = log.previousDriverId;
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
  if (t.cash < spec.signingBonus) return msg(result, false, `Need $${spec.signingBonus}M signing money.`);
  t.cash = Math.round((t.cash - spec.signingBonus) * 100) / 100;
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
  t.history.push({ round, label: `${spec.name} signing`, amount: -spec.signingBonus, category: "sponsor" });
  return msg(result, true, `${spec.name} signed.`);
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
  t.history.push({ round: state.completedRounds + 1, label: `${spec.name} terminated`, amount: -fee, category: "sponsor" });
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
    const d = t.drivers[0] ? driverById(t.drivers[0].driverId) : undefined;
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