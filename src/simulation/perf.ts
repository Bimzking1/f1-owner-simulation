// ============================================================================
// F1 Owner — Performance model (spec §36, §69)
// Effective car rating per track, driver effectiveness, track fit.
// All ratings 0-100; seconds-per-lap mapping happens in race.ts.
// ============================================================================

import type {
  Driver,
  DriverState,
  TeamState,
  Track,
} from "@/simulation/types";
import { clamp } from "./rng";

export interface CarStats {
  aero: number;
  chassis: number;
  reliability: number;
  tireBehavior: number;
  power: number;
  gearboxPerf: number;
}

export const RELIABILITY_WEIGHTS = {
  aero: 0.02,
  chassis: 0.06,
  reliability: 0.45,
  tireBehavior: 0.04,
  power: 0.24,
  gearboxPerf: 0.19,
};

/** Merge constructor DNA + tech package + engine + gearbox + philosophy. */
export function computeCarStats(
  team: Pick<TeamState, "constructorId" | "philosophy">,
  dna: { chassis: number; aero: number; reliability: number },
  tech: { aero: number; chassis: number; reliability: number; tireBehavior: number },
  engine: { power: number; reliability: number; efficiency: number },
  gearbox: { performance: number; reliability: number },
): CarStats {
  const phil = team.philosophy;
  const p = (v: number) => clamp(v, 30, 100);
  let aero = dna.aero * 0.5 + tech.aero * 0.5;
  let chassis = dna.chassis * 0.55 + tech.chassis * 0.45;
  let tire = tech.tireBehavior;
  let reliab =
    dna.reliability * 0.2 +
    tech.reliability * 0.25 +
    engine.reliability * 0.35 +
    gearbox.reliability * 0.2;
  const power = engine.power * 0.6 + engine.efficiency * 0.4;

  if (phil === "performance") {
    aero += 4; chassis += 2; reliab -= 8; tire -= 2;
  } else if (phil === "reliability") {
    reliab += 7; aero -= 3; chassis -= 2;
  } else if (phil === "gamble") {
    aero += 2; chassis += 1; reliab -= 4; tire -= 3;
  }

  return {
    aero: p(aero),
    chassis: p(chassis),
    reliability: p(reliab),
    tireBehavior: p(tire),
    power: p(power),
    gearboxPerf: p(gearbox.performance),
  };
}

export interface TrackWeights {
  carWeight: number;
  driverWeight: number;
  wAero: number;
  wChassis: number;
  wPower: number;
  wGearbox: number;
  wTire: number;
}

/** Track-fit weighting (spec §36): define how much each stat matters here. */
export function trackWeights(track: Track): TrackWeights {
  const c = track.characteristics;
  const driverWeight = clamp(0.3 + (c.driverImportance / 100) * 0.22, 0.3, 0.52);
  const raw = {
    wAero: 0.34 * (0.5 + c.downforce / 200 + c.highSpeed / 500),
    wChassis: 0.22 * (0.5 + c.mechanicalGrip / 200 + c.lowSpeed / 400),
    wPower: 0.18 * (0.5 + c.engineImportance / 200 + c.straightLine / 400),
    wGearbox: 0.1 * (0.5 + c.lowSpeed / 300),
    wTire: 0.16 * (0.5 + c.tireStress / 200),
  };
  const total = raw.wAero + raw.wChassis + raw.wPower + raw.wGearbox + raw.wTire;
  return {
    carWeight: 1 - driverWeight,
    driverWeight,
    wAero: raw.wAero / total,
    wChassis: raw.wChassis / total,
    wPower: raw.wPower / total,
    wGearbox: raw.wGearbox / total,
    wTire: raw.wTire / total,
  };
}

/** Combined car rating for a given track (0-100). */
export function carRating(car: CarStats, w: TrackWeights): number {
  return (
    car.aero * w.wAero +
    car.chassis * w.wChassis +
    car.power * w.wPower +
    car.gearboxPerf * w.wGearbox +
    car.tireBehavior * w.wTire
  );
}

/** Overall driver ability for a track (0-100), season form folded in. */
export function driverAbility(
  driver: Driver,
  state: DriverState | undefined,
  w: TrackWeights,
  wet?: number,
): number {
  const a = driver.attributes;
  const mood = state ? (state.confidence * 0.55 + state.morale * 0.45 - 50) / 100 : 0;
  const form = (driver.seasonForm + (state?.form ?? 0)) * 0.5;
  let base =
    a.pace * 0.4 +
    a.qualifying * 0.14 +
    a.racecraft * 0.16 +
    a.consistency * 0.1 +
    a.tireManagement * 0.2;
  if (wet !== undefined) base += (a.wetSkill - w.driverWeight * 100) * (wet / 300);
  return clamp(base + mood * 2 + form, 30, 100);
}

/** Qualifying effectiveness (one-lap speed). */
export function qualifyingAbility(
  driver: Driver,
  state: DriverState | undefined,
): number {
  const a = driver.attributes;
  const base =
    a.qualifying * 0.5 + a.pace * 0.4 + a.consistency * 0.1;
  const mood = state ? (state.confidence - 50) / 100 : 0;
  return clamp(base + mood * 2 + (driver.seasonForm + (state?.form ?? 0)) * 0.5, 30, 100);
}

/** Seconds-per-lap offset from a rating (centered so ~85 = pack median). */
export function ratingToSeconds(rating: number, baseLap: number): number {
  return (85 - rating) * 0.032 * (baseLap / 90);
}

/** Field-average rating helper. */
export function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
}