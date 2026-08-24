// ============================================================================
// F1 Owner — Season systems (spec §42-50, §53)
// Component wear, finances, morale, sponsors, development, news, bankruptcy.
// All functions mutate a draft SimulationState (the caller clones first).
// ============================================================================

import type {
  CarParts,
  ComponentKey,
  ComponentState,
  DevSeat,
  DriverChallenge,
  EraComponentId,
  NewsPriority,
  RaceWeekendResult,
  Seat,
  SimulationState,
  TeamState,
} from "./types";
import { constructorById, driverById, engineById, engineerById, mechanicById, sponsorById } from "@/data";
import { DIFFICULTIES } from "@/data/config";
import { componentLabel, powerUnitForSeason, puComponentConfig } from "@/data/powerUnits";
import { chance, clamp, type Rng } from "./rng";

// ---------------------------------------------------------------------------
// Reputation (moves all season: results, driver mood, owner conduct)

/**
 * Apply a fractional reputation delta; whole points land immediately, the
 * remainder accumulates on the team so small weekly moves are not lost.
 * Returns the integer amount actually applied.
 */
export function addReputation(t: TeamState, delta: number): number {
  if (!delta) return 0;
  t.repAcc = Math.round(((t.repAcc ?? 0) + delta) * 100) / 100;
  let applied = 0;
  while (t.repAcc >= 1) {
    applied++;
    t.repAcc -= 1;
  }
  while (t.repAcc <= -1) {
    applied--;
    t.repAcc += 1;
  }
  if (applied !== 0) t.reputation = clamp(t.reputation + applied, 0, 100);
  return applied;
}

/** Post-weekend reputation drift from results, driver mood and owner standing. */
export function applyReputation(state: SimulationState, weekend: RaceWeekendResult) {
  const t = state.team;
  if (!t) return;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const mult = diff.sponsorMultiplier;

  const entries = weekend.playerEntries;
  const wins = entries.filter((e) => e.position === 1).length;
  const podiums = entries.filter((e) => !e.dnf && e.position <= 3).length;
  const scorers = entries.filter((e) => e.points > 0).length;
  const scored = scorers > 0;

  let delta = 0;
  // results
  delta += wins * 2.2;
  delta += (podiums - wins) * 0.9;
  delta += (scorers - podiums) * 0.35;
  if (!scored) delta -= 0.9;
  if (entries.length > 0 && entries.every((e) => e.dnf)) delta -= 0.6;

  // driver feedback — the squad's mood leaks into the paddock narrative
  if (t.drivers.length) {
    const avgMorale = t.drivers.reduce((a, d) => a + d.morale, 0) / t.drivers.length;
    const avgFrustration = t.drivers.reduce((a, d) => a + d.frustration, 0) / t.drivers.length;
    if (avgMorale >= 72) delta += 0.4;
    else if (avgMorale < 38) delta -= 0.4;
    if (avgFrustration >= 60) delta -= 0.4;
  }

  // team feedback — how the garage rates its owner colors the coverage
  const trust = t.trust ?? 50;
  if (trust >= 70) delta += 0.3;
  else if (trust <= 32) delta -= 0.3;

  // leading the championship carries its own glow
  const wccPos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
  if (wccPos === 1 && state.completedRounds > 2) delta += 0.5;

  const applied = addReputation(t, delta * mult);
  if (Math.abs(applied) >= 2) {
    const round = state.completedRounds + 1;
    state.news.unshift({
      id: `rep-${round}`,
      round,
      tag: "info",
      priority: "info" satisfies NewsPriority,
      title: applied > 0 ? `Reputation rising — ${t.reputation}/100` : `Reputation slipping — ${t.reputation}/100`,
      body:
        applied > 0
          ? `Strong weekend: the paddock rates the operation higher (${applied >= 3 ? "+" : "+"}${applied} this round). Better results keep sponsors and drivers interested.`
          : `A rough weekend: questions are being asked upstairs (${applied} this round). Points and happier drivers turn it around.`,
      bodyEnjoyer:
        applied > 0 ? "The paddock is warming to your outfit." : "The paddock's patience with your team is thinning.",
    });
  }
}

// ---------------------------------------------------------------------------
// Championship (spec §53)

export function applyStandings(state: SimulationState, weekend: RaceWeekendResult) {
  const driverStanding = new Map(state.standingsDrivers.map((s) => [s.driverId, s]));
  const teamStanding = new Map(state.standingsConstructors.map((s) => [s.teamId, s]));

  const apply = (entries: { driverId: string; teamId: string; position: number | null; points: number }[]) => {
    for (const e of entries) {
      const ds = driverStanding.get(e.driverId);
      if (ds) {
        ds.points += e.points;
        if (e.position === 1) ds.wins++;
        if (e.position !== null && e.position <= 3) ds.podiums++;
        if (e.position === null) ds.dnfs++;
        if (e.position !== null && (ds.best === 0 || e.position < ds.best)) ds.best = e.position;
      }
      const ts = teamStanding.get(e.teamId);
      if (ts) {
        ts.points += e.points;
        if (e.position === 1) ts.wins++;
        if (e.position !== null && e.position <= 3) ts.podiums++;
        if (e.position === null) ts.dnfs++;
      }
    }
  };

  if (weekend.sprint) {
    apply(weekend.sprint.map((e) => ({ driverId: e.driverId, teamId: e.teamId, position: e.position, points: e.points })));
  }
  apply(weekend.race.map((e) => ({ driverId: e.driverId, teamId: e.teamId, position: e.position, points: e.points })));

  state.standingsDrivers = [...driverStanding.values()].sort((a, b) => b.points - a.points);
  state.standingsConstructors = [...teamStanding.values()].sort((a, b) => b.points - a.points);

  if (state.team) {
    const t = state.team;
    const teamStand = state.standingsConstructors.find((s) => s.teamId === t.constructorId);
    t.points = teamStand?.points ?? 0;
    t.wins = teamStand?.wins ?? 0;
    t.podiums = teamStand?.podiums ?? 0;
    t.dnfs = teamStand?.dnfs ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Component wear (spec §42) — era-aware power-unit parts included, one full
// hardware set PER CAR since v0.10 (each driver runs their own parts).

export const SEATS: readonly Seat[] = ["car1", "car2"];

/** Which seat a driver occupies. */
export function seatOf(t: TeamState, driverId: string): Seat {
  return driverId === t.driver1Id ? "car2" : "car1";
}

/**
 * Migrate + return the per-car hardware map. Old saves stored ONE shared set —
 * both seats inherit a copy of it on first touch.
 */
export function ensureCarParts(t: TeamState): Record<Seat, CarParts> {
  if (!t.components.cars) {
    const fresh: () => ComponentState = () => ({ condition: 100, age: 0, replacements: 0 });
    const eng = t.components.engine ?? fresh();
    const gb = t.components.gearbox ?? fresh();
    const pu = t.components.powerUnit ?? {};
    t.components.cars = {
      car1: { engine: { ...eng }, gearbox: { ...gb }, powerUnit: structuredClone(pu) },
      car2: { engine: { ...eng }, gearbox: { ...gb }, powerUnit: structuredClone(pu) },
    };
  }
  return t.components.cars;
}

/** Hardware of one specific car. */
export function carParts(t: TeamState, seat: Seat): CarParts {
  return ensureCarParts(t)[seat];
}

function freshPart(): ComponentState {
  return { condition: 100, age: 0, replacements: 0 };
}

/**
 * Make sure every power-unit component of the current era is tracked on BOTH
 * cars. Fresh saves start everything at 100%; saves resumed mid-season inherit
 * plausible wear from the engine's mileage so the garage never shows a
 * brand-new MGU-H inside a 10-race-old car.
 */
export function ensurePuComponents(state: SimulationState): void {
  const t = state.team;
  if (!t) return;
  const cfg = powerUnitForSeason(state.season);
  for (const seat of SEATS) {
    const parts = carParts(t, seat);
    for (const part of cfg.components) {
      if (!parts.powerUnit[part.id]) {
        parts.powerUnit[part.id] =
          parts.engine.age === 0
            ? { condition: 100, age: 0, replacements: 0 }
            : {
                condition: Math.max(70, Math.round(96 - parts.engine.age * 1.2)),
                age: parts.engine.age,
                replacements: 0,
              };
      }
    }
  }
}

/**
 * Single health number for one car's installed power system, used by the race
 * engine wherever it used to read raw engine condition. 2013 blends V8 + KERS;
 * 2025 weights all seven subsystems by how hard each failure hits the unit.
 */
export function effectivePuHealth(state: SimulationState, seat: Seat): number {
  const t = state.team;
  if (!t) return 100;
  const parts = carParts(t, seat);
  const eng = parts.engine.condition;
  const val = (id: EraComponentId): number => parts.powerUnit[id]?.condition ?? eng;
  return state.season === 2013
    ? clamp(eng * 0.8 + val("kers") * 0.2, 1, 100)
    : clamp(
        eng * 0.45 +
          val("turbo") * 0.18 +
          val("mguK") * 0.12 +
          val("mguH") * 0.08 +
          val("energyStore") * 0.1 +
          val("controlElectronics") * 0.03 +
          val("exhaust") * 0.04,
        1,
        100,
      );
}

/** Wear one era part over a weekend. */
function wearPuPart(part: { wear: [number, number] }, c: { condition: number }, rng: Rng, wearMult: number, stress: number): void {
  const loss = (part.wear[0] + rng() * (part.wear[1] - part.wear[0])) * wearMult * stress;
  c.condition = Math.round(clamp(c.condition - loss, 5, 100) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Component failures — random blow-ups plus crash/impact damage. A busted part
// must be replaced in the Garage before the next GP can be started.

export interface UrgentRepair {
  key: ComponentKey;
  name: string;
  note?: string;
  condition: number;
  cost: number;
  /** Which car needs the part. */
  seat: Seat;
}

function bustPart(c: ComponentState, note: string, rng: Rng): void {
  c.condition = Math.round((8 + rng() * 8) * 10) / 10;
  c.damaged = true;
  c.damagedNote = note;
}

/** All parts currently flagged as broken and blocking the next race, per car. */
export function urgentRepairs(state: SimulationState): UrgentRepair[] {
  const t = state.team;
  if (!t) return [];
  ensurePuComponents(state);
  const list: UrgentRepair[] = [];
  const check = (seat: Seat, key: ComponentKey, c: ComponentState | undefined) => {
    if (!c?.damaged) return;
    list.push({
      key,
      seat,
      name: componentLabel(key, state.season),
      note: c.damagedNote,
      condition: c.condition,
      cost: replacementCost(key, state) ?? 0,
    });
  };
  for (const seat of SEATS) {
    const parts = carParts(t, seat);
    check(seat, "engine", parts.engine);
    check(seat, "gearbox", parts.gearbox);
    for (const p of powerUnitForSeason(state.season).components) {
      check(seat, p.id, parts.powerUnit[p.id]);
    }
  }
  return list;
}

/**
 * Post-weekend damage pass:
 *  1. every tracked part can fail outright at random — odds rise sharply with
 *     wear and with the difficulty's failure multiplier;
 *  2. DNF reasons feed back into hardware — an engine failure leaves a dead
 *     ICE behind, crashes hammer random parts, electrical gremlins kill the
 *     era's electronics.
 */
export function applyPartDamage(state: SimulationState, weekend: RaceWeekendResult, rng: Rng): void {
  const t = state.team;
  if (!t) return;
  ensurePuComponents(state);
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const failMult = diff.failureMultiplier;
  const gp = state.calendar.find((tr) => tr.id === weekend.trackId)?.grandPrix ?? `round ${weekend.round}`;

  interface Damageable {
    key: ComponentKey;
    c: ComponentState;
    base: number;
  }
  // one damageable list per car
  const partsOf = (seat: Seat): Damageable[] => {
    const parts = carParts(t, seat);
    return [
      { key: "engine", c: parts.engine, base: 0.006 },
      { key: "gearbox", c: parts.gearbox, base: 0.005 },
      ...powerUnitForSeason(state.season).components.map(
        (p): Damageable => ({ key: p.id, c: parts.powerUnit[p.id]!, base: p.failRisk }),
      ),
    ];
  };
  const allSeats = SEATS.map((seat) => ({ seat, parts: partsOf(seat) }));
  const eraElectronics = (): EraComponentId => (state.season === 2013 ? "kers" : "controlElectronics");

  // 1. independent random failures — worn parts are far more likely to let go
  for (const { parts } of allSeats) {
    for (const p of parts) {
      if (p.c.damaged) continue;
      const wearFactor = 1 + Math.max(0, 100 - p.c.condition) / 70; // up to ≈2.6×
      if (rng() < p.base * failMult * wearFactor) {
        bustPart(p.c, `Busted at ${gp} — mechanical failure`, rng);
      }
    }
  }

  // 2. DNF reason feedback (full race entries carry the failure description)
  const bust = (seat: Seat, key: ComponentKey, note: string) => {
    const group = allSeats.find((s) => s.seat === seat)!;
    const p = group.parts.find((x) => x.key === key);
    if (p && !p.c.damaged && rng() < 0.9) bustPart(p.c, note, rng);
  };
  const impact = (seat: Seat, minLoss: number, maxLoss: number, note: string) => {
    const group = allSeats.find((s) => s.seat === seat)!;
    const intact = group.parts.filter((p) => !p.c.damaged);
    if (!intact.length || rng() > Math.min(failMult, 1.3)) return;
    const target = intact[Math.floor(rng() * intact.length)]!;
    target.c.condition = Math.round(clamp(target.c.condition - (minLoss + rng() * (maxLoss - minLoss)), 5, 100) * 10) / 10;
    if (target.c.condition < 22) bustPart(target.c, note, rng);
  };

  for (const entry of [...(weekend.sprint ?? []), ...weekend.race]) {
    if (!entry.dnf || !entry.dnfReason || !entry.driverId) continue;
    if (entry.driverId !== t.driver1Id && entry.driverId !== t.driver2Id) continue;
    const seat = seatOf(t, entry.driverId);
    const r = entry.dnfReason.toLowerCase();
    if (/power unit|engine/.test(r)) bust(seat, "engine", `Engine failure at ${gp}`);
    else if (/gearbox|transmission/.test(r)) bust(seat, "gearbox", `Gearbox failure at ${gp}`);
    else if (/electr/.test(r)) bust(seat, eraElectronics(), `Electrical failure at ${gp}`);
    else if (/hydraulic/.test(r)) impact(seat, 28, 46, `Hydraulic failure damaged it at ${gp}`);
    else if (/brake/.test(r)) impact(seat, 12, 26, `Brake failure shook it up at ${gp}`);
    else if (/contact|crash|collision|accident|damage/.test(r)) {
      if (rng() < 0.75) impact(seat, 30, 55, `Crash damage at ${gp}`);
    } else {
      // unknown retirement cause — something took a hit
      impact(seat, 15, 35, `Damaged before retirement at ${gp}`);
    }
  }
}

export function advanceWear(state: SimulationState, weekend: RaceWeekendResult, rng: Rng) {
  const t = state.team;
  if (!t) return;
  const rel = t.car.reliability;
  const wearMult = 1.15 - rel / 150;
  const stress = t.car.reliability < 60 ? 1.35 : 1.0;

  ensurePuComponents(state);
  const cfg = powerUnitForSeason(state.season);

  // how far each driver actually went — a lap-12 retirement hammers its own
  // hardware far less than a full race distance
  const distanceOf = (driverId: string): number => {
    const e = weekend.race.find((r) => r.driverId === driverId);
    if (!e || !e.dnf) return 1;
    return 0.55; // retired mid-race — partial distance
  };

  for (const seat of SEATS) {
    const dist = distanceOf(seat === "car1" ? t.driver1Id : t.driver2Id);
    const parts = carParts(t, seat);
    const eLoss = (2.4 + rng() * 1.6) * wearMult * stress * dist;
    const gLoss = (1.9 + rng() * 1.2) * wearMult * stress * dist;
    parts.engine.condition = Math.round(clamp(parts.engine.condition - eLoss, 5, 100) * 10) / 10;
    parts.gearbox.condition = Math.round(clamp(parts.gearbox.condition - gLoss, 5, 100) * 10) / 10;
    parts.engine.age++;
    parts.gearbox.age++;

    for (const part of cfg.components) {
      const c = parts.powerUnit[part.id];
      if (c) {
        wearPuPart(part, c, rng, wearMult * dist, stress);
        c.age++;
      }
    }
  }

  // random blow-ups + crash/impact damage feed back into the garage
  applyPartDamage(state, weekend, rng);
}

/** Cost in $M to replace a component; null if unavailable this season. */
export function replacementCost(component: ComponentKey, state: SimulationState): number | null {
  if (!state.team) return null;
  if (component === "engine") return state.season === 2013 ? 4.5 : 6;
  if (component === "gearbox") return state.season === 2013 ? 3 : 3.5;
  return puComponentConfig(state.season, component)?.replaceCost ?? null;
}

export function replaceComponent(draft: SimulationState, component: ComponentKey, seat: Seat): void {
  const t = draft.team;
  if (!t) return;
  const cost = replacementCost(component, draft);
  if (cost === null) return;
  const parts = carParts(t, seat);
  // A busted part can be bought on supplier credit even without cash —
  // going into debt feeds the normal bankruptcy watch instead of soft-locking.
  const cur: ComponentState =
    component === "engine" || component === "gearbox"
      ? parts[component]
      : (parts.powerUnit[component] ?? freshPart());
  const isUrgent = cur.damaged === true;
  if (t.cash < cost && !isUrgent) return;
  const onCredit = t.cash < cost;

  // FIA-style grid penalty: changing the internal combustion engine costs
  // 10 places at the next GP, a gearbox 5. Broken hardware is no excuse —
  // the stewards only see a new unit going in. The penalty hits the car
  // whose part changed.
  let penalty = 0;
  if (component === "engine") penalty = 10;
  else if (component === "gearbox") penalty = 5;
  if (penalty > 0) {
    t.gridPenaltyBySeat ??= { car1: 0, car2: 0 };
    t.gridPenaltyBySeat[seat] = Math.min(20, (t.gridPenaltyBySeat[seat] ?? 0) + penalty);
    t.gridPenalty = Math.max(t.gridPenaltyBySeat.car1, t.gridPenaltyBySeat.car2);
  }

  t.cash = Math.round((t.cash - cost) * 100) / 100;
  const drv = driverById(seat === "car1" ? t.driver1Id : t.driver2Id, draft.season);
  const label = componentLabel(component, draft.season);

  if (component === "engine" || component === "gearbox") {
    parts[component] = {
      condition: 100,
      age: 0,
      replacements: parts[component].replacements + 1,
    };
  } else {
    ensurePuComponents(draft);
    const prev = parts.powerUnit[component]!;
    parts.powerUnit[component] = {
      condition: 100,
      age: 0,
      replacements: prev.replacements + 1,
    };
  }

  t.history.push({
    round: draft.completedRounds + 1,
    label: `${label} replacement — ${drv?.shortName ?? seat}`,
    amount: -cost,
    category: "other",
    detail:
      (onCredit
        ? `${label} unit purchased on supplier credit for ${drv?.shortName ?? "one car"} — cash went negative.\nOne-time part purchase. The team's account is now in the red; the bank is watching.`
        : `${label} unit purchased for ${drv?.shortName ?? "one car"}.\nPaid in full up front — one-time part purchase, not a recurring fee.`) +
      (penalty > 0 ? `\nStewards' ruling: −${penalty} grid places at the next Grand Prix (${drv?.shortName ?? "that car"}).` : ""),
  });
}

// ---------------------------------------------------------------------------
// Finances (spec §48-49 cash flow)

export interface RaceFinanceBreakdown {
  sponsorIncome: number;
  promoterShare: number;
  salaries: number;
  operations: number;
  supplier: number;
  staff: number;
}

export function applyRaceFinance(state: SimulationState, weekend: RaceWeekendResult, rng?: Rng): RaceFinanceBreakdown {
  const t = state.team;
  if (!t)
    return { sponsorIncome: 0, promoterShare: 0, salaries: 0, operations: 0, supplier: 0, staff: 0 };
  const totalRounds = state.calendar.length || 19;
  const round = state.completedRounds + 1;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];

  // sponsor race payments — activation money fluctuates weekend to weekend
  // (image-rights timing, hospitality targets, currency swings). Higher
  // difficulty = wider bands: on Ruthless a partner can pay 40% short.
  let sponsorIncome = 0;
  const sponsorLines: string[] = [];
  const band: [number, number] =
    state.difficulty === "rookie"
      ? [0.85, 1.08]
      : state.difficulty === "professional"
        ? [0.8, 1.12]
        : state.difficulty === "expert"
          ? [0.72, 1.18]
          : [0.6, 1.28];
  for (const s of t.sponsors) {
    if (!s.active) continue;
    const spec = sponsorById(s.sponsorId);
    if (!spec) continue;
    const variance = rng ? band[0] + rng() * (band[1] - band[0]) : 1;
    const pay = Math.round(spec.racePayment * variance * 100) / 100;
    sponsorIncome += pay;
    s.totalPaid = Math.round((s.totalPaid + pay) * 100) / 100;
    sponsorLines.push(`${spec.name} — $${pay.toFixed(2)}M${rng && pay !== spec.racePayment ? ` (target $${spec.racePayment}M)` : ""}`);
  }
  sponsorIncome = Math.round(sponsorIncome * 100) / 100;

  // random operating shocks — freight damage, paddock fines, failed inspections.
  // Frequency and severity scale with the difficulty's cost multiplier.
  let incidentCost = 0;
  let incidentLabel = "";
  if (rng) {
    const incidentChance =
      state.difficulty === "rookie" ? 0.06 : state.difficulty === "professional" ? 0.09 : state.difficulty === "expert" ? 0.14 : 0.19;
    if (chance(rng, incidentChance)) {
      const incidents = [
        "Freight damage — spare parts lost in transit",
        "Paddock fine — pit-lane safety breach",
        "Failed scrutineering paperwork — re-submission costs",
        "Hospitality unit repair bill",
        "Wind-tunnel time overage invoiced by the FIA partner",
      ];
      if (state.difficulty === "expert" || state.difficulty === "ruthless") {
        incidents.push(
          "Supplier price hike — mid-season invoice adjustment",
          "Sponsor activation audit — clawback of unpaid bonuses",
          "FIA travel and logistics surcharge",
          "Staff overtime settlement after a triple-header",
        );
      }
      incidentLabel = incidents[Math.floor(rng() * incidents.length)]!;
      incidentCost = Math.round((1.5 + rng() * (state.difficulty === "ruthless" ? 3.5 : 2.5)) * diff.costMultiplier * 100) / 100;
    }
  }

  // promoter share from race points — base rate $0.45M per point, but
  // promoters pay a premium when an unfancied team or driver lands big:
  // the weaker the machinery and the lower-rated the drivers, the bigger
  // the story — and the bigger the gate/TV share cheque.
  const teamPoints = weekend.playerEntries.reduce((a, e) => a + e.points, 0);
  let upset = 1;
  if (teamPoints > 0) {
    const ctor = constructorById(t.constructorId, state.season);
    const finishes = weekend.playerEntries.filter((e) => !e.dnf).map((e) => e.position);
    const bestPos = finishes.length ? Math.min(...finishes) : 99;
    if (ctor && bestPos <= 3) {
      const carTier = (ctor.dna.aero + ctor.dna.chassis) / 2; // ~85 top teams · ~65 backmarkers
      const scoring = weekend.playerEntries
        .filter((e) => !e.dnf && e.position <= 3)
        .map((e) => driverById(e.driverId, state.season)?.overall ?? 75);
      const driverTier = scoring.length ? scoring.reduce((a, b) => a + b, 0) / scoring.length : 80;
      upset = clamp(1 + Math.max(0, 78 - carTier) * 0.016 + Math.max(0, 80 - driverTier) * 0.014, 1, 1.7);
    }
  }
  const promVar = rng ? 0.88 + rng() * 0.24 : 1; // ±12% gate/TV noise
  const promoterShare = Math.round(teamPoints * 0.45 * promVar * upset * 100) / 100;

  const perRace = (seasonTotal: number) => Math.round((seasonTotal / totalRounds) * 100) / 100;
  const d1 = driverById(t.driver1Id, state.season);
  const d2 = driverById(t.driver2Id, state.season);
  const salaries = perRace((d1?.salary ?? 4) + (d2?.salary ?? 4));
  const opsSeason = teamOperatingCost(t);
  const operations = perRace(opsSeason);
  const leaseSeason = state.season === 2013 ? 11 : 14;
  const supplier = perRace(leaseSeason);
  const staffTotal =
    t.engineerIds.reduce((a, id) => a + (engineerById(id)?.cost ?? 0), 0) +
    t.mechanicIds.reduce((a, id) => a + (mechanicById(id)?.cost ?? 0), 0);
  const staff = perRace(staffTotal);

  const income = Math.round((sponsorIncome + promoterShare) * 100) / 100;
  const expense = Math.round((salaries + operations + supplier + staff + incidentCost) * 100) / 100;
  t.cash = Math.round((t.cash + income - expense) * 100) / 100;

  const sponsorBreakdown = sponsorLines.join("\n");
  const engName = engineById(t.engineId)?.supplier ?? "engine";
  const staffLines = [
    ...t.engineerIds.map((id) => {
      const e = engineerById(id);
      return e ? `${e.name} — $${e.cost}M/season` : null;
    }),
    ...t.mechanicIds.map((id) => {
      const m = mechanicById(id);
      return m ? `${m.name} — $${m.cost}M/season` : null;
    }),
  ].filter((x): x is string => Boolean(x));

  t.history.push(
    {
      round,
      label: "Sponsor payments",
      amount: sponsorIncome,
      category: "sponsor",
      detail: sponsorBreakdown
        ? `Active sponsors pay per race weekend — no upfront sign fees.\n${sponsorBreakdown}`
        : "No active sponsor contracts this weekend.",
    },
    {
      round,
      label: "Promoter share",
      amount: promoterShare,
      category: "prize",
      detail:
        `${teamPoints} point(s) × $0.45M base rate${promVar !== 1 ? ` × ${promVar.toFixed(2)} gate/TV variance` : ""}` +
        (upset > 1.01
          ? ` × ${upset.toFixed(2)} upset bonus — promoters pay a premium when a low-rated team/driver lands a big result`
          : "") +
        ` = $${promoterShare.toFixed(2)}M.`,
    },
    {
      round,
      label: "Driver salaries",
      amount: -salaries,
      category: "salary",
      detail: `Driver contracts are paid per weekend, not up front.\n${d1?.name ?? t.driver1Id} — $${d1?.salary ?? 4}M/season\n${d2?.name ?? t.driver2Id} — $${d2?.salary ?? 4}M/season\nTotal $${(d1?.salary ?? 4) + (d2?.salary ?? 4)}M ÷ ${totalRounds} race weekends = $${salaries.toFixed(2)}M this weekend.`,
    },
    {
      round,
      label: "Staff salaries",
      amount: -staff,
      category: "staff",
      detail: `Staff are paid per weekend, not at hiring.\n${staffLines.join("\n")}\nTotal $${staffTotal}M/season ÷ ${totalRounds} race weekends = $${staff.toFixed(2)}M this weekend.`,
    },
    {
      round,
      label: "Team operations",
      amount: -operations,
      category: "operations",
      detail: `Operations run at 8% of the starting fund (min $3.6M).\n$${t.startCash}M × 8% = $${opsSeason}M/season\n÷ ${totalRounds} weekends = $${operations.toFixed(2)}M this weekend.\nCovers logistics, rent, travel.`,
    },
    {
      round,
      label: "Power unit lease",
      amount: -supplier,
      category: "supplier",
      detail: `${engName} power unit — $${leaseSeason}M annual lease.\n÷ ${totalRounds} weekends = $${supplier.toFixed(2)}M this weekend.\nEquipment lease fees are spread per race.`,
    },
    ...(incidentCost > 0
      ? [
          {
            round,
            label: incidentLabel,
            amount: -incidentCost,
            category: "operations" as const,
            detail: "Random operating shock — bad weekends happen to good teams too.\nBudget for these; they are part of running a team.",
          },
        ]
      : []),
  );
  return { sponsorIncome, promoterShare, salaries, operations, supplier, staff };
}

function teamOperatingCost(t: TeamState): number {
  // derived from constructor size — stored implicitly via startCash tier.
  // 8% of the starting fund (min $3.6M) covers the weekly running bill now
  // that staff wages are paid per weekend instead of up front.
  return Math.max(3.6, Math.round(t.startCash * 0.08 * 10) / 10);
}

/** Season-end prize money by projected WCC position. */
export function prizeMoney(teamsCount: number, position: number): number {
  const table = [60, 50, 42, 36, 30, 25, 20, 16, 12, 9, 6, 4];
  return table[Math.min(position - 1, table.length - 1, teamsCount - 1)] ?? 3;
}

// ---------------------------------------------------------------------------
// Driver morale (spec §22)

export function applyMorale(state: SimulationState, weekend: RaceWeekendResult, rng?: Rng) {
  const t = state.team;
  if (!t) return;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const mult = diff.moraleMultiplier;

  // Slump pressure: pointless weekends stack. Each extra bad weekend in a row
  // makes the next negative swing land harder (up to ×2), so a spiral of poor
  // results genuinely damages drivers instead of washing out.
  const weekendPoints = weekend.playerEntries.reduce((a, e) => a + e.points, 0);
  t.slump = weekendPoints > 0 ? 0 : (t.slump ?? 0) + 1;
  const slumpAmp = Math.min(2, 1 + 0.35 * Math.max(0, (t.slump ?? 1) - 1));
  const amp = (v: number) => Math.round((v < 0 ? v * slumpAmp : v) * mult);

  // owner interventions: lingering boosts apply once per weekend, then expire
  for (const ds of t.drivers) {
    if (!ds.boosts?.length) continue;
    for (const b of ds.boosts) {
      if (b.morale) ds.morale = clamp(ds.morale + Math.round(b.morale * mult), 0, 100);
      if (b.confidence) ds.confidence = clamp(ds.confidence + Math.round(b.confidence * mult), 0, 100);
      if (b.frustration) ds.frustration = clamp(ds.frustration + Math.round(b.frustration * mult), 0, 100);
      b.racesLeft -= 1;
    }
    ds.boosts = ds.boosts.filter((b) => b.racesLeft > 0);
  }

  for (const ds of t.drivers) {
    const entry = weekend.playerEntries.find((e) => e.driverId === ds.driverId);
    if (!entry) continue;
    const pos = entry.position;
    let conf = 0, mor = 0, frust = 0;

    if (entry.dnf) {
      conf -= 3; mor -= 7; frust += 9;
    } else if (pos === 1) { conf += 9; mor += 8; frust -= 6; }
    else if (pos <= 3) { conf += 6; mor += 5; frust -= 4; }
    else if (pos <= 6) { conf += 3; mor += 3; frust -= 2; }
    else if (pos <= 10) { conf += 1; mor += 1; }
    else if (pos <= 15) { mor -= 2; }
    else { conf -= 3; mor -= 4; frust += 4; }

    const other = t.drivers.find((x) => x.driverId !== ds.driverId);
    const otherEntry = weekend.playerEntries.find((e) => e.driverId === other?.driverId);
    if (otherEntry && !otherEntry.dnf && !entry.dnf) {
      if (pos < otherEntry.position) conf += 2;
      else if (pos > otherEntry.position + 1) { mor -= 3; frust += 2; }
    }

    // an accepted challenge turns every race into a pressure cooker
    const ch = t.driverChallenge;
    if (ch?.accepted && ch.driverId === ds.driverId) {
      frust += 2;
    }

    // unrepaired broken hardware grinds everyone down — nobody trusts a broken car
    const brokenParts = urgentRepairs(state).length;
    if (brokenParts > 0) {
      frust += 2 + brokenParts;
      mor -= 1;
    }

    ds.confidence = clamp(ds.confidence + amp(conf), 0, 100);
    ds.morale = clamp(ds.morale + amp(mor), 0, 100);
    ds.frustration = clamp(ds.frustration + amp(frust), 0, 100);
    if (entry.dnf) ds.dnfs++;
    ds.points += entry.points;
  }

  // Boiling-over drivers go public: a furious star ranting to the media
  // bleeds reputation and garage trust until the root cause is fixed.
  if (rng) {
    for (const ds of t.drivers) {
      if (ds.frustration < 72 || !chance(rng, 0.5)) continue;
      const d = driverById(ds.driverId, state.season);
      if (!d) continue;
      addReputation(t, -1);
      t.trust = clamp((t.trust ?? 50) - 2, 0, 100);
      state.news.unshift({
        id: `rant-${weekend.round}-${ds.driverId}`,
        round: weekend.round,
        tag: "driver",
        priority: "warning" satisfies NewsPriority,
        title: `${d.shortName} slams the team in the media`,
        body: `"I am done pretending everything is fine. Frustration ${ds.frustration}/100 — either things change or I will change them myself." The interview is everywhere; paddock trust −2, reputation −1.`,
        bodyEnjoyer: `${d.shortName} torched the team in a tell-all interview. Fix it, or fire him.`,
        options: [{ label: "Open team management", action: "goto:management" }],
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Driver challenges (spec §22b) — bossy stars demand cash for promises

/** A frustrated/ambitious high-rated driver demands an up-front bonus and
 *  promises a podium within N races. Owner can accept or reject. */
export function generateDriverChallenge(state: SimulationState, rng: Rng) {
  const t = state.team;
  if (!t || t.driverChallenge) return;
  if (state.completedRounds < 2) return;
  const round = state.completedRounds + 1;
  const slump = t.slump ?? 0;

  for (const ds of t.drivers) {
    const d = driverById(ds.driverId, state.season);
    if (!d || d.overall < 78) continue;
    // stars get bossy when results, morale or patience run out
    const entitled = ds.frustration >= 58 || ds.morale <= 42 || slump >= 2;
    if (!entitled || !chance(rng, 0.22)) continue;

    const amount = clamp(Math.round(((d.overall - 70) * 0.35 + d.salary * 0.18) * 10) / 10, 1.5, 8);
    const roundsLeft = chance(rng, 0.5) ? 3 : 2;
    const challenge: DriverChallenge = { driverId: ds.driverId, amount, roundsLeft, accepted: false };
    t.driverChallenge = challenge;
    state.news.unshift({
      id: `chal-${round}-${ds.driverId}`,
      round,
      tag: "driver",
      kind: "chat",
      priority: "warning" satisfies NewsPriority,
      title: `${d.shortName} wants a bonus — and promises a podium`,
      body:
        `"Let's be honest, ${t.owner?.callout?.trim() || "Boss"}: I am worth more than this car shows. ` +
        `Pay me a $${amount}M bonus now and I promise a podium within the next ${roundsLeft} race${roundsLeft > 1 ? "s" : ""}. ` +
        `No podium — you can put it on my head."`,
      bodyEnjoyer: `${d.shortName} puts $${amount}M on the table against his own podium within ${roundsLeft} race(s). Your call.`,
      options: [
        { label: `Accept — pay $${amount}M`, action: "challenge-accept", payload: ds.driverId },
        { label: "Reject the demand", action: "challenge-reject", payload: ds.driverId },
      ],
    });
    return;
  }
}

/** Weekend resolution for an active challenge. Ignoring a demand also has a cost. */
export function resolveDriverChallenge(state: SimulationState, weekend: RaceWeekendResult) {
  const t = state.team;
  if (!t) return;
  const ch = t.driverChallenge;
  if (!ch) return;
  const ds = t.drivers.find((x) => x.driverId === ch.driverId);
  const d = driverById(ch.driverId, state.season);
  if (!ds || !d) {
    t.driverChallenge = undefined;
    return;
  }

  // pending demand ignored through a full weekend → insulted driver
  if (!ch.accepted) {
    ds.frustration = clamp(ds.frustration + 6, 0, 100);
    t.trust = clamp((t.trust ?? 50) - 1, 0, 100);
    t.driverChallenge = undefined;
    return;
  }

  const entry = weekend.playerEntries.find((p) => p.driverId === ch.driverId);
  const delivered = !!entry && !entry.dnf && entry.position <= 3;
  ch.roundsLeft -= 1;

  if (delivered) {
    ds.morale = clamp(ds.morale + 7, 0, 100);
    ds.confidence = clamp(ds.confidence + 6, 0, 100);
    ds.frustration = clamp(ds.frustration - 10, 0, 100);
    t.trust = clamp((t.trust ?? 50) + 3, 0, 100);
    addReputation(t, 1.2);
    state.news.unshift({
      id: `chal-ok-${weekend.round}`,
      round: weekend.round,
      tag: "driver",
      priority: "info" satisfies NewsPriority,
      title: `${d.shortName} delivered the promised podium`,
      body: `P${entry!.position} — exactly what he guaranteed for his $${ch.amount}M. Morale soars, trust +3.`,
      bodyEnjoyer: `${d.shortName} banked his bonus with interest — P${entry!.position}.`,
    });
    t.driverChallenge = undefined;
  } else if (ch.roundsLeft <= 0) {
    ds.frustration = clamp(ds.frustration + 12, 0, 100);
    ds.confidence = clamp(ds.confidence - 4, 0, 100);
    ds.morale = clamp(ds.morale - 5, 0, 100);
    t.trust = clamp((t.trust ?? 50) - 4, 0, 100);
    addReputation(t, -0.8);
    state.news.unshift({
      id: `chal-fail-${weekend.round}`,
      round: weekend.round,
      tag: "driver",
      priority: "warning" satisfies NewsPriority,
      title: `${d.shortName} failed his own promise`,
      body: `No podium in the window despite the $${ch.amount}M bonus. He is angry at everyone — mostly himself. Trust −4.`,
      bodyEnjoyer: `${d.shortName} took the money and vanished when it mattered. Awkward.`,
    });
    t.driverChallenge = undefined;
  }
}

// ---------------------------------------------------------------------------
// Sponsors (spec §46-48)

export function scheduleSponsorObjectives(state: SimulationState, rng: Rng) {
  const t = state.team;
  if (!t) return;
  for (const s of t.sponsors) {
    if (!s.active || s.deadlineRound > 0) continue;
    const spec = sponsorById(s.sponsorId);
    if (!spec) continue;
    switch (spec.objective) {
      case "pointsNextRaces":
        s.required = 3; s.deadlineRound = state.completedRounds + 4; break;
      case "top10NextRaces":
        s.required = 4; s.deadlineRound = state.completedRounds + 6; break;
      case "podiumByRound":
        s.required = 1; s.deadlineRound = state.calendar.length - (state.season === 2013 ? 4 : 8); break;
      case "pointsConsecutive":
        s.required = state.season === 2013 ? 2 : 3; s.deadlineRound = state.completedRounds + 12; break;
      case "beatRival":
        s.required = 1; s.deadlineRound = state.completedRounds + 5; break;
      case "wccPosition":
        s.required = state.season === 2013 ? 6 : 8;
        s.deadlineRound = state.calendar.length;
        break;
    }
    if (spec.risk === "high" && rng() < 0.15) {
      // tougher immediate ask
      s.required += 1;
    }
  }
}

export function evaluateSponsors(state: SimulationState) {
  const t = state.team;
  if (!t) return;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const specMult = diff.sponsorMultiplier;
  const round = state.completedRounds + 1;
  const weekend = state.lastWeekend;
  if (!weekend) return;

  const scored = (round as number) >= 0 && weekend.playerEntries.some((e) => e.points > 0);
  const top10 = weekend.playerEntries.some((e) => !e.dnf && e.position <= 10);
  const podium = weekend.playerEntries.some((e) => e.position !== null && e.position <= 3);
  const isRuthless = state.difficulty === "ruthless";
  void isRuthless;

  for (const s of t.sponsors) {
    if (!s.active || s.deadlineRound <= 0) continue;
    const spec = sponsorById(s.sponsorId);
    if (!spec) continue;

    switch (spec.objective) {
      case "pointsNextRaces":
        if (scored) s.progress++;
        break;
      case "top10NextRaces":
        if (top10) s.progress++;
        break;
      case "podiumByRound":
        if (podium) s.progress++;
        break;
      case "pointsConsecutive":
        if (scored) s.progress++;
        else s.progress = 0;
        break;
      case "wccPosition":
      case "beatRival":
        s.progress++; // evaluated at deadline instead
        break;
    }

    if (round >= s.deadlineRound) {
      const targetRival = state.standingsConstructors.find((c) => c.teamId !== t.constructorId);
      let met = s.progress >= s.required;
      if (spec.objective === "wccPosition") {
        const pos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
        met = pos <= s.required;
      } else if (spec.objective === "beatRival") {
        const my = t.points;
        const rival = targetRival ? targetRival.points : 0;
        met = my >= rival;
      }

      if (met) {
        s.patience = clamp(spec.patience + 1, 1, 6);
        t.cash = Math.round((t.cash + spec.bonus) * 100) / 100;
        t.reputation = clamp(t.reputation + Math.round(2 * specMult), 0, 100);
        t.history.push({
          round,
          label: `${spec.name} bonus`,
          amount: spec.bonus,
          category: "sponsor",
          detail: `Objective met for ${spec.name}.\nContract bonus $${spec.bonus}M paid by the sponsor.`,
        });
        state.news.unshift({
          id: `bonus-${round}-${s.sponsorId}`,
          round,
          tag: "sponsor",
          priority: "info" satisfies NewsPriority,
          title: `${spec.name} pays the bonus`,
          body: `Objective met (${s.progress}/${s.required}). +$${spec.bonus}M bonus, reputation +${Math.round(2 * specMult)}. A new target will be set on the contract.`,
          bodyEnjoyer: `${spec.name} is thrilled and paid out. A new target appears on the contract.`,
          options: [{ label: "Review sponsors", action: "goto:sponsors" }],
        });
        s.progress = 0;
        s.deadlineRound = round + (spec.objective === "pointsNextRaces" || spec.objective === "top10NextRaces" ? 5 : 8);
        s.required = Math.max(1, Math.round(s.required * 0.9 * specMult));
      } else {
        s.patience--;
        if (s.patience <= 0) {
          s.active = false;
          t.reputation = Math.max(0, t.reputation - Math.round(6 * specMult));
          state.news.unshift({
            id: `exit-${round}-${s.sponsorId}`,
            round,
            tag: "sponsor",
            priority: "urgent" satisfies NewsPriority,
            title: `${spec.name} pulls out`,
            body: `CONTRACT TERMINATED at round ${round} — objective missed (${s.progress}/${s.required}: ${spec.objectiveText}). Reputation -${Math.round(6 * specMult)}. You lose $${spec.racePayment}M per race income.`,
            bodyEnjoyer: `${spec.name} walked. Your reputation took a hit.`,
            options: [{ label: "Find a new sponsor", action: "goto:sponsors" }],
          });
        } else {
          const roundsLeft = Math.max(0, s.deadlineRound - round);
          state.news.unshift({
            id: `warn-${round}-${s.sponsorId}`,
            round,
            tag: "sponsor",
            priority: "warning" satisfies NewsPriority,
            title: `${spec.name} is unimpressed`,
            body: `Objective missed at evaluation: ${s.progress}/${s.required} — "${spec.objectiveText}". Patience left: ${s.patience}. If it hits 0 they terminate the deal (−$${spec.racePayment}M/race income).`,
            bodyEnjoyer: `They wanted ${spec.objectiveTextEnjoyer}. Patience left: ${s.patience}.`,
            options: [{ label: "Review sponsors", action: "goto:sponsors" }],
          });
          void roundsLeft;
        }
        s.progress = 0;
        s.deadlineRound = 0;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Development (spec §43-44)

export interface DevOption {
  id: string;
  name: string;
  cost: number;
  duration: number;
  effect: number;
  target: "aero" | "chassis" | "reliability" | "gearbox" | "pitCrew" | "driverTraining";
  risk: number;
  description: string;
  driverId?: string;
  /** Car-stat projects can target one car (cheaper) or both. */
  seat?: DevSeat;
}

/** Car-stat targets can be aimed at a single car. */
export const isSeatTarget = (target: DevOption["target"]): boolean =>
  target === "aero" || target === "chassis" || target === "reliability" || target === "gearbox";

/** Price of a dev option for a given car allocation — single-car work costs ~60%. */
export function devCostFor(option: DevOption, seat: DevSeat | undefined): number {
  if (!isSeatTarget(option.target) || !seat || seat === "both") return option.cost;
  return Math.round(option.cost * 0.6 * 100) / 100;
}

export function generateDevOptions(state: SimulationState): DevOption[] {
  const t = state.team;
  if (!t) return [];
  const season = state.season;
  const engSpeed =
    t.engineerIds.reduce((a, id) => a + (engineerById(id)?.developmentSpeed ?? 60), 0) /
    Math.max(1, t.engineerIds.length);
  const engInnov =
    t.engineerIds.reduce((a, id) => a + (engineerById(id)?.innovation ?? 50), 0) /
    Math.max(1, t.engineerIds.length);
  const dur = (base: number) => Math.max(2, Math.round(base * (1.25 - engSpeed / 400)));
  const risk = Math.max(0.03, 0.16 - engInnov / 900);
  const k = season === 2013 ? 1 : 1.1;

  const opts: DevOption[] = [];
  if (t.car.aero < 97)
    opts.push({ id: "dev-aero", name: "Aero Upgrade", cost: Math.round(6 * k), duration: dur(6), effect: 3, target: "aero", risk: risk * 1.1, description: "New front wing + floor. More downforce, still legal." });
  if (t.car.chassis < 95)
    opts.push({ id: "dev-chassis", name: "Chassis Upgrade", cost: Math.round(7 * k), duration: dur(7), effect: 3, target: "chassis", risk: risk * 1.2, description: "Revised suspension. Mechanical grip gains." });
  if (t.car.reliability < 97)
    opts.push({ id: "dev-rel", name: "Reliability Upgrade", cost: Math.round(4.5 * k), duration: dur(4), effect: 6, target: "reliability", risk: risk * 0.8, description: "Stronger seals and cooling. Fewer breakdowns." });
  if (t.car.gearboxPerf < 92)
    opts.push({ id: "dev-gb", name: "Gearbox Upgrade", cost: Math.round(5 * k), duration: dur(5), effect: 3, target: "gearbox", risk, description: "Lower internal drag. Better ratios." });
  opts.push({ id: "dev-pit", name: "Pit Crew Training", cost: Math.round(2.2 * k), duration: dur(2), effect: 3, target: "pitCrew", risk: 0.04, description: "Pit lane practice. Faster, safer stops." });
  for (const ds of t.drivers) {
    const drv = driverById(ds.driverId, state.season);
    if (drv && ds.form < 4)
      opts.push({
        id: `dev-train-${ds.driverId}`,
        name: `${drv.shortName} Training`,
        cost: Math.round(2 * k),
        duration: dur(3),
        effect: 2,
        target: "driverTraining",
        risk: 0.08,
        description: "Simulator miles + coaching.",
        driverId: ds.driverId,
      });
  }
  return opts;
}

export function startProject(draft: SimulationState, option: DevOption, seat?: DevSeat): boolean {
  const t = draft.team;
  if (!t) return false;
  const seatChoice: DevSeat | undefined = isSeatTarget(option.target) ? (seat ?? "both") : undefined;
  const cost = devCostFor(option, seatChoice);
  if (t.cash < cost) return false;
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.upgrades.push({
    id: option.id,
    name: option.name,
    cost,
    remainingRaces: option.duration,
    totalRaces: option.duration,
    target: option.target,
    effect: option.effect,
    driverId: option.driverId,
    seat: seatChoice === "both" ? undefined : seatChoice,
    risk: option.risk,
  });
  const drvName = seatChoice && seatChoice !== "both" ? driverById(seatChoice === "car1" ? t.driver1Id : t.driver2Id, draft.season)?.shortName : null;
  t.history.push({
    round: draft.completedRounds + 1,
    label: option.name + (drvName ? ` — ${drvName} only` : ""),
    amount: -cost,
    category: "development",
    detail:
      `${option.name}${drvName ? ` (fitted to ${drvName}'s car only)` : ""} — development project.\n` +
      `Cost $${cost}M paid up front.\nUpgrades land in ${option.duration} race(s).`,
  });
  return true;
}

/** Base car stats plus the accumulated single-car upgrade bonuses for a seat. */
export function effectiveCarStats(t: TeamState, season: number, seat: Seat) {
  void season;
  const bonus = t.seatUpgrades?.[seat] ?? {};
  return {
    aero: clamp(t.car.aero + (bonus.aero ?? 0), 30, 100),
    chassis: clamp(t.car.chassis + (bonus.chassis ?? 0), 30, 100),
    reliability: clamp(t.car.reliability + (bonus.reliability ?? 0), 30, 100),
    tireBehavior: t.car.tireBehavior,
    power: clamp(t.car.power + (bonus.power ?? 0), 30, 100),
    gearboxPerf: clamp(t.car.gearboxPerf + (bonus.gearboxPerf ?? 0), 30, 100),
  };
}

export function advanceDevelopment(state: SimulationState) {
  const t = state.team;
  if (!t) return;
  const round = state.completedRounds + 1;
  for (const p of [...t.upgrades]) {
    p.remainingRaces--;
    if (p.remainingRaces > 0) continue;
    const under = Math.random() < p.risk;
    const gain = under ? Math.round(p.effect * 0.35) : p.effect;
    const seatOnly = p.seat != null;
    const statKey =
      p.target === "aero" || p.target === "chassis" || p.target === "reliability" || p.target === "gearbox"
        ? (p.target === "gearbox" ? "gearboxPerf" : p.target)
        : null;
    if (seatOnly && statKey) {
      t.seatUpgrades ??= { car1: {}, car2: {} };
      const bucket = t.seatUpgrades[p.seat as Seat] ?? {};
      bucket[statKey] = Math.round(((bucket[statKey] ?? 0) + gain) * 10) / 10;
      t.seatUpgrades[p.seat as Seat] = bucket;
    } else
    switch (p.target) {
      case "aero": t.car.aero = clamp(t.car.aero + gain, 30, 100); break;
      case "chassis": t.car.chassis = clamp(t.car.chassis + gain, 30, 100); break;
      case "reliability": t.car.reliability = clamp(t.car.reliability + gain, 30, 100); break;
      case "gearbox": t.car.gearboxPerf = clamp(t.car.gearboxPerf + gain, 30, 100); break;
      case "pitCrew": t.pitCrew = clamp(t.pitCrew + Math.round(gain * 2.5), 0, 100); break;
      case "driverTraining": {
        const ds = t.drivers.find((x) => x.driverId === p.driverId);
        if (ds) ds.form = clamp(ds.form + gain, -10, 10);
        break;
      }
    }
    const where = p.seat ? ` (${p.seat === "car1" ? driverById(t.driver1Id, state.season)?.shortName : driverById(t.driver2Id, state.season)?.shortName}'s car only)` : "";
    state.news.unshift({
      id: `dev-${round}-${p.id}`,
      round,
      tag: "info",
      priority: (under ? "warning" : "info") satisfies NewsPriority,
      title: `${p.name} complete${under ? " — underperformed" : ""}`,
      body: under
        ? `Poor correlation in the wind tunnel/sim: the ${p.name}${where} delivered only +${gain} of the expected +${p.effect}. The rest of the budget didn't translate.`
        : `${p.name}${where} is on the car and working: +${gain} to ${p.target === "pitCrew" ? "pit crew" : p.target === "driverTraining" ? "driver form" : p.target}.`,
      bodyEnjoyer: under
        ? `The upgrade arrived but it's not quite right. Partial gains only.`
        : `The upgrade is on the car and it's real.`,
    });
    t.upgrades = t.upgrades.filter((u) => u.id !== p.id);
  }
}

/** Every N races opens a development window (spec §43). */
export function isDevWindow(state: SimulationState): boolean {
  const interval = Math.max(3, Math.round(state.calendar.length / 4));
  return state.completedRounds > 0 && state.completedRounds % interval === 0;
}

// ---------------------------------------------------------------------------
// Paddock news (spec §45)

export function generatePaddockNews(state: SimulationState, rng: Rng) {
  const t = state.team;
  if (!t) return;
  const round = state.completedRounds + 1;
  const roll = rng();
  if (roll < 0.3) {
    const cost = state.season === 2013 ? 4.5 : 6.5;
    state.news.unshift({
      id: `supplier-${round}`,
      round,
      tag: "supplier",
      priority: "warning" satisfies NewsPriority,
      title: "Engine supplier offers an upgrade",
      body: `ACTION AVAILABLE: ${engineById(t.engineId)?.supplier ?? "Your engine maker"} offers an energy-recovery upgrade for $${cost}M — +3 power, +2 reliability for the rest of the season. Offer expires when you respond.`,
      bodyEnjoyer: `Your engine maker has a faster, sturdier spec ready — $${cost}M.`,
      options: [
        { label: `Purchase ($${cost}M)`, action: "engineUpgrade" },
        { label: "Decline", action: "dismiss" },
      ],
    });
  } else if (roll < 0.48) {
    state.news.unshift({
      id: `rival-${round}`,
      round,
      tag: "rival",
      priority: "warning" satisfies NewsPriority,
      title: "Rival development warning",
      body: `Several midfield teams are filing new floor revisions this week. If your development pace stalls they will close the gap — consider starting an upgrade at the next development window (Garage tab).`,
      bodyEnjoyer: "Everyone in the midfield is working on a big upgrade.",
      options: [{ label: "Open garage", action: "goto:garage" }],
    });
  } else if (roll < 0.62) {
    const other = [
      "Your reliability engineer was approached by a rival team.",
      "A sponsor manager is fielding calls about your contract terms.",
      "Driver market rumors: several contracts expire this season.",
    ][Math.floor(rng() * 3)];
    state.news.unshift({
      id: `paddock-${round}`,
      round,
      tag: "staff",
      priority: "info" satisfies NewsPriority,
      title: "Paddock whisper",
      body: `${other} Nothing official yet — keep an eye on the Market tab.`,
      bodyEnjoyer: "The paddock is gossiping. Nothing official yet.",
      options: [{ label: "Open market", action: "goto:market" }],
    });
  }
}

// ---------------------------------------------------------------------------
// Driver → owner conversations (mid-championship interactions)

interface ChatMood {
  quote: string;
  priority: NewsPriority;
}

function chatLine(mood: string, shortName: string, morale: number, frustration: number, rng: Rng): ChatMood {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  if (mood === "complain") {
    return {
      priority: "warning",
      quote: pick([
        `"I can't do this alone. The car is miles off and nobody in the garage seems bothered." — ${shortName} is frustrated (frustration ${frustration}).`,
        `"We keep losing out in the stops. Either the crew steps up or I stop risking my neck every lap." — ${shortName} (frustration ${frustration}).`,
        `"My strategy calls have been a joke lately. I need answers, not apologies." — ${shortName} wants change (frustration ${frustration}).`,
      ]),
    };
  }
  if (mood === "praise") {
    return {
      priority: "info",
      quote: pick([
        `"Best car I've driven here. Whatever you're doing upstairs — keep going." — ${shortName} is happy (morale ${morale}).`,
        `"The team believes in itself again. You can feel it in the garage." — ${shortName} (morale ${morale}).`,
        `"Pit wall's been sharp lately. That's on leadership." — ${shortName}, impressed (morale ${morale}).`,
      ]),
    };
  }
  if (mood === "joke") {
    return {
      priority: "info",
      quote: pick([
        `"If we finish P4 again I'm charging you for my chiropractor." — ${shortName}, joking (morale ${morale}).`,
        `"My engineer promised me a sandwich if I beat the teammate. Hold him to it." — ${shortName} (morale ${morale}).`,
        `"The new floor is so slippery I nearly signed it 'the steward'." — ${shortName}, laughing (morale ${morale}).`,
      ]),
    };
  }
  return {
    priority: "info",
    quote: pick([
      `"Honest feedback: qualifying pace is there, race pace isn't. We need to look at tire management." — ${shortName}.`,
      `"I think one more development push and we're regularly in the points." — ${shortName} (morale ${morale}).`,
      `"Communication between me and the pit wall could be better on strategy calls." — ${shortName} (morale ${morale}).`,
    ]),
  };
}

/** After some weekends a driver asks the owner for a word — respond in Team Management. */
export function generateDriverChat(state: SimulationState, rng: Rng) {
  const t = state.team;
  if (!t || t.drivers.length === 0) return;
  if (state.completedRounds === 0 || rng() > 0.42) return;
  const round = state.completedRounds + 1;

  // unhappy drivers speak up more often
  const pool: typeof t.drivers = [];
  for (const ds of t.drivers) {
    const weight = ds.frustration >= 55 ? 3 : ds.morale <= 40 ? 2 : 1;
    for (let i = 0; i < weight; i++) pool.push(ds);
  }
  const ds = pool[Math.floor(rng() * pool.length)];
  const d = driverById(ds.driverId, state.season);
  if (!d) return;

  let mood = "feedback";
  if (ds.frustration >= 55) mood = "complain";
  else if (ds.morale >= 70 && ds.confidence >= 60) mood = rng() < 0.5 ? "praise" : "joke";
  const { quote, priority } = chatLine(mood, d.shortName, ds.morale, ds.frustration, rng);

  state.news.unshift({
    id: `chat-${round}-${ds.driverId}`,
    round,
    tag: "driver",
    kind: "chat",
    priority,
    title: `${d.shortName} wants a word`,
    body: quote,
    bodyEnjoyer: quote,
    options: [
      { label: "Back him publicly", action: "chat-support", payload: ds.driverId },
      { label: "Promise upgrades", action: "chat-promise", payload: ds.driverId },
      { label: "Tough love", action: "chat-tough", payload: ds.driverId },
    ],
  });
}

export function applyChatResponse(state: SimulationState, driverId: string, response: string): string | null {
    const t = state.team;
    if (!t) return null;
    const ds = t.drivers.find((x) => x.driverId === driverId);
    if (!ds) return null;
    switch (response) {
      case "chat-support": {
        ds.morale = clamp(ds.morale + 6, 0, 100);
        ds.confidence = clamp(ds.confidence + 3, 0, 100);
        t.trust = clamp((t.trust ?? 50) + 1, 0, 100);
        addReputation(t, 0.4);
      ds.boosts ??= [];
      const ex = ds.boosts.find((b) => b.label === "Public backing");
      if (ex) ex.racesLeft = Math.max(ex.racesLeft, 2);
      else ds.boosts.push({ label: "Public backing", morale: 2, racesLeft: 2 });
      return "Public backing delivered.";
    }
    case "chat-promise": {
      ds.morale = clamp(ds.morale + 4, 0, 100);
      ds.confidence = clamp(ds.confidence + 2, 0, 100);
      ds.frustration = clamp(ds.frustration + 2, 0, 100); // promises add pressure
      t.trust = clamp((t.trust ?? 50) - 1, 0, 100);
      ds.boosts ??= [];
      const ex = ds.boosts.find((b) => b.label === "Upgrade promise");
      if (ex) ex.racesLeft = Math.max(ex.racesLeft, 3);
      else ds.boosts.push({ label: "Upgrade promise", confidence: 2, racesLeft: 3 });
      return "Upgrade promise made — expectations rise.";
    }
      case "chat-tough": {
        ds.frustration = clamp(ds.frustration - 8, 0, 100);
        ds.morale = clamp(ds.morale - 3, 0, 100);
        ds.confidence = clamp(ds.confidence + 2, 0, 100);
        t.trust = clamp((t.trust ?? 50) + 1, 0, 100);
        addReputation(t, 0.3);
      ds.boosts ??= [];
      const ex = ds.boosts.find((b) => b.label === "Tough love");
      if (ex) ex.racesLeft = Math.max(ex.racesLeft, 2);
      else ds.boosts.push({ label: "Tough love", frustration: -2, racesLeft: 2 });
      return "Tough love. Frustration drops, mood dips.";
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Bankruptcy (spec §50)

export function bankruptcyCheck(state: SimulationState): SimulationState {
  const t = state.team;
  if (!t) return state;
  if (t.cash >= -8) return state;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const round = state.completedRounds + 1;

  if (diff.bankruptcyGrace && !state.bankrupt) {
    state.bankrupt = true;
    t.cash = Math.round((t.cash + 25) * 100) / 100;
    t.reputation = Math.max(0, t.reputation - 20);
    t.history.push({
      round,
      label: "Emergency bank guarantee",
      amount: 25,
      category: "other",
      detail: "One-time rescue injection of $25M from your bankers.\nReputation −20.",
    });
    state.news.unshift({
      id: `grace-${round}`,
      round,
      tag: "breaking",
      priority: "urgent" satisfies NewsPriority,
      title: "BANK GUARANTEE ACTIVATED",
      body: `URGENT: cash fell below −$8M after round ${round}. The bank stepped in once: +$25M, reputation -20. There will be no second rescue — cut costs or the team collapses.`,
      bodyEnjoyer: "Your bankers bailed you out with $25M. They won't do it again.",
      options: [{ label: "Open finance", action: "goto:finance" }],
    });
  } else {
    state.phase = "bankrupt";
    state.news.unshift({
      id: `collapse-${round}`,
      round,
      tag: "breaking",
      priority: "urgent" satisfies NewsPriority,
      title: "TEAM COLLAPSE",
      body: `URGENT: you could no longer finance the operation at round ${round}. Creditors move in — season terminated.`,
      bodyEnjoyer: "The money ran out. The season is over.",
    });
  }
  return state;
}