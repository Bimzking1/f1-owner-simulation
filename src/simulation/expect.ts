// ============================================================================
// F1 Owner — Season expectations projector
// Deterministic multi-pass projection of the built season: replays the field
// strength model (same DNA/tech/difficulty scaling as buildCompetitors) over
// the calendar with seeded noise to produce expected points, wins, podiums and
// a predicted WCC order. Pure — no state mutation.
// ============================================================================

import type { Driver, DriverState, SimulationState } from "./types";
import {
  constructorById,
  driverById,
  enginesForSeason,
  gearboxesForSeason,
  techPackagesForSeason,
} from "@/data";
import { carRating, computeCarStats, driverAbility, trackWeights, type CarStats } from "./perf";
import { createRng, rand } from "./rng";

export interface ProjectionEntry {
  teamId: string;
  pointsAvg: number;
  pointsBest: number;
  pointsWorst: number;
}

export interface DriverProjection {
  driverId: string;
  pointsBest: number;
  pointsWorst: number;
}

export interface SeasonExpectation {
  points: [number, number]; // [worst, best] season totals for the player team
  wins: [number, number];
  podiums: [number, number];
  wccPos: [number, number]; // [best case position, worst case]
  wccPoints: [number, number];
  drivers: DriverProjection[];
  teams: ProjectionEntry[]; // sorted by average points, desc
}

interface ProjCar {
  teamId: string;
  driverId: string;
  car: CarStats;
  reliability: number;
  driver: Driver;
  state?: DriverState | null;
}

const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];
const PASSES = 7;
const NOISE = 3.4; // per-weekend form swing in rating points

function difficultyFactor(difficulty: SimulationState["difficulty"]): number {
  switch (difficulty) {
    case "ruthless": return 0.82;
    case "rookie": return 0.9;
    case "professional": return 0.96;
    default: return 1;
  }
}

/** Mirror of buildCompetitors' field model, deterministic (no per-car rng rolls). */
function buildField(state: SimulationState): ProjCar[] {
  const t = state.team!;
  const season = state.season;
  const factor = difficultyFactor(state.difficulty);
  const list: ProjCar[] = [];

  for (const did of [t.driver1Id, t.driver2Id]) {
    const driver = driverById(did, season);
    if (!driver) continue;
    list.push({
      teamId: t.constructorId,
      driverId: did,
      car: t.car,
      reliability: t.car.reliability,
      driver,
      state: t.drivers.find((ds) => ds.driverId === did) ?? null,
    });
  }

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
    const car = computeCarStats({ constructorId: teamId, philosophy: "balanced" }, ctor.dna, techPkg, engine, gearbox);
    const scale = (v: number) => Math.max(30, Math.round(v * factor));
    const scaledCar: CarStats = {
      aero: scale(car.aero),
      chassis: scale(car.chassis),
      reliability: scale(car.reliability),
      tireBehavior: scale(car.tireBehavior),
      power: scale(car.power),
      gearboxPerf: scale(car.gearboxPerf),
    };
    const drivers = (state.lineups?.[teamId] ?? []).map(driverById).filter(Boolean) as Driver[];
    for (const d of drivers) {
      list.push({ teamId, driverId: d.id, car: scaledCar, reliability: car.reliability, driver: d, state: null });
    }
  }
  return list;
}

interface RankedRow {
  driverId: string;
  teamId: string;
}

export function projectSeason(state: SimulationState): SeasonExpectation {
  const t = state.team!;
  const field = buildField(state);
  const sprintsOn = state.gameLength !== "short" && state.season === 2025;

  const playerIds = new Set([t.driver1Id, t.driver2Id]);
  const teamIds = Array.from(new Set(field.map((c) => c.teamId)));

  const teamTotals = new Map<string, number[]>(); // teamId → points per pass
  const driverTotals = new Map<string, number[]>(); // driverId → points per pass
  const playerWins: number[] = [];
  const playerPodiums: number[] = [];
  const playerRank: number[] = [];

  for (let p = 0; p < PASSES; p++) {
    const rng = createRng(`${state.seed}:proj:${p}`);
    const totals = new Map<string, number>(teamIds.map((id) => [id, 0]));
    const dp = new Map<string, number>();
    let wins = 0;
    let podiums = 0;

    /** Rank by ability + seeded weekend noise (+ optional sprint grid bias), then pay out. */
    const runSession = (entries: ProjCar[], weights: ReturnType<typeof trackWeights>, table: number[], amp: number, bias?: Map<string, number>): RankedRow[] => {
      const ranked: (RankedRow & { v: number })[] = entries.map((c) => ({
        driverId: c.driverId,
        teamId: c.teamId,
        v:
          carRating(c.car, weights) * (1 - weights.driverWeight) +
          driverAbility(c.driver, c.state ?? undefined, weights) * weights.driverWeight +
          rand(rng, -amp, amp) -
          (bias?.get(c.driverId) ?? 0),
      }));
      ranked.sort((a, b) => b.v - a.v);
      ranked.forEach((r, i) => {
        const pts = table[i] ?? 0;
        if (pts === 0) return;
        totals.set(r.teamId, (totals.get(r.teamId) ?? 0) + pts);
        dp.set(r.driverId, (dp.get(r.driverId) ?? 0) + pts);
      });
      return ranked.map(({ driverId, teamId }) => ({ driverId, teamId }));
    };

    for (const track of state.calendar) {
      const w = trackWeights(track);

      if (track.sprint && sprintsOn) {
        const sprintOrder = runSession(field, w, SPRINT_POINTS, NOISE);
        // sprint result sets Sunday's grid — a small carry into race ordering
        const gridBias = new Map(sprintOrder.map((r, i) => [r.driverId, i * 0.3]));
        const raceTop = runSession(field, w, POINTS, NOISE, gridBias);
        // count wins/podiums from the race's point positions only
        raceTop.slice(0, POINTS.length).forEach((r, i) => {
          if (!playerIds.has(r.driverId)) return;
          if (i === 0) wins++;
          if (i <= 2) podiums++;
        });
      } else {
        const top = runSession(field, w, POINTS, NOISE);
        top.forEach((r, i) => {
          if (!playerIds.has(r.driverId)) return;
          if (i === 0) wins++;
          if (i <= 2) podiums++;
        });
      }
    }

    for (const [id, v] of totals) {
      if (!teamTotals.has(id)) teamTotals.set(id, []);
      teamTotals.get(id)!.push(v);
    }
    for (const [id, v] of dp) {
      if (!driverTotals.has(id)) driverTotals.set(id, []);
      driverTotals.get(id)!.push(v);
    }
    playerWins.push(wins);
    playerPodiums.push(podiums);
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    playerRank.push(Math.max(1, sorted.findIndex(([id]) => id === t.constructorId) + 1));
  }

  const rangeOf = (arr: number[]): [number, number] =>
    arr.length ? [Math.min(...arr), Math.max(...arr)] : [0, 0];

  const teams: ProjectionEntry[] = [...teamTotals.entries()]
    .map(([teamId, arr]) => ({
      teamId,
      pointsAvg: Math.round(arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length)),
      pointsBest: Math.max(...arr),
      pointsWorst: Math.min(...arr),
    }))
    .sort((a, b) => b.pointsAvg - a.pointsAvg);

  const drivers: DriverProjection[] = [...driverTotals.entries()]
    .filter(([id]) => playerIds.has(id))
    .map(([driverId, arr]) => ({
      driverId,
      pointsBest: Math.max(...arr),
      pointsWorst: Math.min(...arr),
    }));

  const mine = teams.find((x) => x.teamId === t.constructorId);
  const posRange = rangeOf(playerRank);
  return {
    points: rangeOf(teamTotals.get(t.constructorId) ?? []),
    wins: rangeOf(playerWins),
    podiums: rangeOf(playerPodiums),
    wccPos: [posRange[0], posRange[1]], // best case first
    wccPoints: [mine?.pointsWorst ?? 0, mine?.pointsBest ?? 0],
    drivers,
    teams,
  };
}
