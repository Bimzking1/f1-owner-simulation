// ============================================================================
// F1 Owner — Race simulation (spec §35-42, §69-71)
// Lap-by-lap numeric simulation → grid, race, events, explanation.
// Skill dominates; chaos occasionally writes headlines.
// ============================================================================

import type {
  DifficultyId,
  GameLengthId,
  RaceEntry,
  RaceEvent,
  RaceWeekendResult,
  SeasonId,
  Track,
  WeatherId,
} from "./types";
import { carRating, driverAbility, qualifyingAbility, ratingToSeconds, trackWeights } from "./perf";
import type { CarStats } from "./perf";
import type { Driver, DriverState } from "./types";
import { chance, clamp, noise, rand, randInt, type Rng } from "./rng";

// ---------------------------------------------------------------------------

export interface Competitor {
  driverId: string;
  teamId: string;
  driver: Driver;
  driverState?: DriverState | null;
  car: CarStats;
  reliability: number;
  engineCond: number;
  gearboxCond: number;
  pitStop: number;
  errorChance: number;
  strategyRating: number;
  isPlayer: boolean;
}

export interface RaceInput {
  season: SeasonId;
  difficulty: DifficultyId;
  gameLength: GameLengthId;
  track: Track;
  rng: Rng;
  competitors: Competitor[];
  playerTeamId: string;
  runSprint?: boolean;
  wetHint?: { start: number; length: number };
}

export interface WetWindow {
  start: number;
  length: number;
}

export const WEATHER_META: Record<WeatherId, { label: string; enjoyer: string; volatility: number }> = {
  dry: { label: "Dry", enjoyer: "Dry conditions", volatility: 0.1 },
  lightRain: { label: "Light Rain", enjoyer: "Light rain", volatility: 0.17 },
  heavyRain: { label: "Heavy Rain", enjoyer: "Heavy rain", volatility: 0.27 },
  changing: { label: "Changeable", enjoyer: "Rain incoming", volatility: 0.24 },
};

// ---------------------------------------------------------------------------
// Weather (spec §37-38)

export function generateForecast(
  track: Track,
  rng: Rng,
  difficulty: DifficultyId,
): RaceWeekendResult["forecast"] & { windowStart?: number; windowLength?: number } {
  const c = track.characteristics;
  const diffRoll = difficulty === "rookie" ? 0.8 : difficulty === "expert" || difficulty === "ruthless" ? 1.25 : 1;
  const rainProbability = Math.round(clamp(c.weatherRisk * 0.55 + rand(rng, 0, 18) * diffRoll, 3, 92));
  const confidence =
    rainProbability > 62 || rainProbability < 25 ? "high" : chance(rng, 0.5) ? "medium" : "low";
  let windowStart: number | undefined;
  if (chance(rng, 0.55)) {
    windowStart = Math.round(track.laps * rand(rng, 0.15, 0.45));
  }
  return {
    rainProbability,
    confidence,
    window: windowStart !== undefined ? `Lap ${windowStart}–${windowStart + Math.round(track.laps * 0.25)}` : undefined,
    windowStart,
    windowLength: windowStart !== undefined ? Math.round(track.laps * 0.4) : undefined,
  };
}

export function rollWeather(
  track: Track,
  forecast: { rainProbability: number },
  rng: Rng,
): WeatherId {
  void track;
  const roll = rng() * 100;
  if (roll > forecast.rainProbability) return "dry";
  if (chance(rng, 0.3)) return "changing";
  return chance(rng, 0.6) ? "lightRain" : "heavyRain";
}

/** Wet grip factor 0..1 at a given lap. */
function wetAt(lap: number, weather: WeatherId, window: WetWindow): number {
  if (weather === "dry") return 0;
  if (weather === "lightRain") return 0.45;
  if (weather === "heavyRain") return 0.85;
  const delta = lap - window.start;
  if (delta <= 0) return 0;
  const rampUp = Math.min(1, delta / 6);
  const rampDown = Math.max(0, Math.min(1, (window.length - delta) / 8));
  return clamp(rampUp * rampDown, 0, 1);
}

export function chaosOf(track: Track, weather: WeatherId): number {
  const c = track.characteristics;
  return clamp(
    Math.round(
      c.reliabilityRisk * 0.14 +
        c.tireStress * 0.1 +
        c.overtaking * 0.08 +
        (WEATHER_META[weather].volatility / 0.27) * 32 +
        c.weatherRisk * 0.1,
    ),
    3,
    98,
  );
}

export function lapTimeBase(track: Track): number {
  return 62 + track.lengthKm * 3.4;
}

// ---------------------------------------------------------------------------
// Qualifying

export function simulateQualifying(input: RaceInput): RaceEntry[] {
  const { track, rng, competitors } = input;
  const w = trackWeights(track);
  const baseLap = lapTimeBase(track);
  const entries: RaceEntry[] = competitors.map((comp) => {
    const ability =
      carRating(comp.car, w) * (1 - w.driverWeight) +
      qualifyingAbility(comp.driver, comp.driverState ?? undefined) * w.driverWeight;
    const t =
      baseLap + ratingToSeconds(ability, baseLap) + noise(rng) * 0.55 + rand(rng, 0, 0.3);
    return {
      driverId: comp.driverId,
      teamId: comp.teamId,
      gridPosition: 0,
      position: 0,
      points: 0,
      dnf: false,
      time: t,
    };
  });
  entries.sort((a, b) => a.time - b.time);
  entries.forEach((e, i) => {
    e.gridPosition = i + 1;
    e.time = Math.round(e.time * 1000) / 1000;
  });
  return entries;
}

// ---------------------------------------------------------------------------
// The race

type FailComponent = "engine" | "gearbox" | "hydraulics" | "brakes" | "electrics";

interface RunningCar {
  comp: Competitor;
  cum: number;
  lapInStint: number;
  stintLen: number;
  out: boolean;
  dnfReason?: string;
  fastestLap: number;
  lastPos: number;
  strategySwing: number;
  tireWarned: boolean;
}

export function simulateRace(
  input: RaceInput,
  weather: WeatherId,
  grid: RaceEntry[],
  points: number[],
  getFastestPoint: boolean,
  events: RaceEvent[],
): RaceEntry[] {
  const { track, rng, competitors } = input;
  const c = track.characteristics;
  const laps = track.laps;
  const baseLap = lapTimeBase(track);
  const w = trackWeights(track);
  const volatility = WEATHER_META[weather].volatility;

  const wetWindow: WetWindow = input.wetHint ?? { start: Math.ceil(laps * 0.3), length: Math.ceil(laps * 0.4) };

  const running: RunningCar[] = grid.map((g) => {
    const comp = competitors.find((x) => x.driverId === g.driverId)!;
    const stops = c.tireStress > 70 ? 2 : c.tireStress > 45 ? 1 : chance(rng, 0.5) ? 1 : 2;
    const stintLen = laps / (stops + 1);
    return {
      comp,
      cum: g.time,
      lapInStint: 1,
      stintLen,
      out: false,
      fastestLap: Infinity,
      lastPos: g.gridPosition,
      strategySwing: 0,
      tireWarned: false,
    };
  });

  // Pre-roll reliability failures (spec §41-42): probability from reliability +
  // track stress + component condition + difficulty.
  const failPool: { component: FailComponent; base: number }[] = [
    { component: "engine", base: 0.34 },
    { component: "gearbox", base: 0.22 },
    { component: "hydraulics", base: 0.18 },
    { component: "brakes", base: 0.14 },
    { component: "electrics", base: 0.12 },
  ];
  const failMult =
    input.difficulty === "rookie" ? 0.55 : input.difficulty === "professional" ? 1 : input.difficulty === "expert" ? 1.3 : 1.5;
  const failures: { car: RunningCar; lap: number; component: FailComponent }[] = [];
  for (const car of running) {
    const rel = car.comp.reliability;
    for (const f of failPool) {
      const cond =
        f.component === "engine"
          ? 0.6 + (100 - car.comp.engineCond) * 0.009
          : f.component === "gearbox"
            ? 0.6 + (100 - car.comp.gearboxCond) * 0.009
            : 1;
      const p = clamp(
        0.021 * f.base * (1.7 - rel / 100) * (0.55 + rel / 100) * cond * failMult,
        0.004,
        0.3,
      );
      if (chance(rng, p)) {
        failures.push({
          car,
          lap: randInt(rng, Math.ceil(laps * 0.12), laps + 2),
          component: f.component,
        });
      }
    }
  }

  // Safety car deployment
  const scAt: number[] = [];
  if (chance(rng, clamp(0.32 + c.overtaking / 100 + volatility * 0.6, 0.15, 0.75))) {
    const when = randInt(rng, Math.ceil(laps * 0.15), Math.max(laps - 5, laps * 0.6));
    for (let i = 0; i < 4; i++) scAt.push(Math.min(laps, when + i));
  }

  const push = (e: RaceEvent) => events.push(e);

  const byPos = (lap: number): RunningCar[] => {
    const alive = running.filter((r) => !r.out).sort((a, b) => a.cum - b.cum);
    void lap;
    return alive;
  };

  for (let lap = 1; lap <= laps; lap++) {
    const wet = wetAt(lap, weather, wetWindow);
    const scActive = scAt.includes(lap);

    for (const car of running) {
      if (car.out) continue;

      // 1. mechanical failure
      const fail = failures.find((f) => f.car === car && f.lap === lap);
      if (fail) {
        car.out = true;
        car.dnfReason = failMessage(fail.component);
        push({
          lap,
          type: "mechanical",
          severity: "danger",
          actor: car.comp.driverId,
          text: `${car.comp.driver.shortName} retires — ${car.dnfReason}.`,
          textEnjoyer: `${car.comp.driver.shortName} is out — ${car.dnfReason}.`,
        });
        continue;
      }

      // 2. driver incident (spec §24): aggression up, consistency down, wet, track
      if (scActive) {
        // neutralised — no driving errors
      } else if (car.comp.isPlayer || chance(rng, 0.35)) {
        const a = car.comp.driver.attributes;
        const prob =
          0.004 +
          ((100 - a.consistency) / 100) * 0.014 +
          (a.aggression / 100) * 0.007 +
          wet * 0.02 +
          (c.reliabilityRisk / 100) * 0.012 +
          (a.pressure / 100) * 0.005;
        if (chance(rng, prob)) {
          const crash = chance(rng, car.comp.isPlayer ? 0.18 : 0.12);
          if (crash && car.comp.isPlayer) {
            car.out = true;
            car.dnfReason = "contact damages the floor beyond repair";
            push({
              lap,
              type: "driver",
              severity: "danger",
              actor: car.comp.driverId,
              text: `${car.comp.driver.shortName} crashes — the car is too damaged to continue.`,
              textEnjoyer: `${car.comp.driver.shortName} smashes into the barriers and is out.`,
            });
            continue;
          }
          const loss = crash ? rand(rng, 0.6, 1.4) : rand(rng, 0.02, 0.16);
          car.cum += loss;
          if (car.comp.isPlayer) {
            push({
              lap,
              type: "driver",
              severity: "warning",
              actor: car.comp.driverId,
              text: `${car.comp.driver.shortName} has ${crash ? "contact and loses time" : "an off-track moment"}.`,
              textEnjoyer: `${car.comp.driver.shortName} ${crash ? "makes contact and falls back" : "runs wide"}.`,
            });
          }
        }
      }

      // 3. tire wear
      car.lapInStint++;
      if (car.lapInStint >= car.stintLen && lap < laps - 1 && !scActive) {
        const stopTime = car.comp.pitStop + 1.1;
        const err = chance(rng, car.comp.errorChance / 100);
        car.cum += stopTime + (err ? 3 : 0);
        car.lapInStint = 1;
        if (car.comp.isPlayer) {
          push({
            lap,
            type: "strategy",
            severity: err ? "warning" : "info",
            actor: car.comp.driverId,
            text: `Pit stop ${stopTime.toFixed(2)}s${err ? " — a slow wheel!" : ""}.`,
            textEnjoyer: `Pit stop ${stopTime.toFixed(2)}s${err ? " — a slow wheel costs time" : ""}.`,
          });
        }
      } else {
        const tirePenalty =
          0.16 *
          (c.tireStress / 100) *
          (1.18 - car.comp.car.tireBehavior / 100) *
          Math.pow((car.lapInStint / Math.max(1, car.stintLen)) * 1.15, 2.4);
        if (
          car.lapInStint > car.stintLen * 0.78 &&
          !car.tireWarned &&
          car.comp.isPlayer
        ) {
          car.tireWarned = true;
          push({
            lap,
            type: "strategy",
            severity: "warning",
            actor: car.comp.driverId,
            text: `${car.comp.driver.shortName} reports front tire degradation.`,
            textEnjoyer: `${car.comp.driver.shortName} warns the fronts are gone.`,
          });
        }
        car.cum += tirePenalty;
      }

      // 4. wet factor
      if (wet > 0) {
        const wetSwing = wet * ((72 - car.comp.driver.attributes.wetSkill) / 60) * 0.55;
        car.cum += wetSwing;
        if (car.comp.isPlayer && lap === wetWindow.start && weather === "changing") {
          push({
            lap,
            type: "external",
            severity: "warning",
            text: "Rain arrives — the pit wall calls for intermediates.",
            textEnjoyer: "Rain hits the circuit — everyone scrambles for intermediates.",
          });
        }
      }

      // 5. base pace + noise + strategy swing (applied once)
      if (car.strategySwing === 0) {
        car.strategySwing = (72 - car.comp.strategyRating) * 0.02 + rand(rng, -0.12, 0.12);
        if (chance(rng, ((100 - car.comp.strategyRating) / 100) * 0.18)) {
          car.strategySwing -= rand(rng, 0.1, 0.35);
        }
      }
      const ability =
        carRating(car.comp.car, w) * (1 - w.driverWeight) +
        driverAbility(car.comp.driver, car.comp.driverState ?? undefined, w, wet * 30) *
          w.driverWeight;
      const paceDelta = ratingToSeconds(ability, baseLap);
      const lapTime =
        baseLap * (scActive ? 1.35 : 1) + paceDelta + car.strategySwing + noise(rng) * volatility * 1.15;
      if (lapTime < car.fastestLap) car.fastestLap = lapTime;
      car.cum += lapTime;
    }

    // safety car packs the field
    if (scActive && lap === scAt[0]) {
      const alive = byPos(lap);
      alive.forEach((car, idx) => {
        car.cum = alive[0].cum + 2.8 + idx * 0.06;
      });
      push({
        lap,
        type: "external",
        severity: "warning",
        text: "SAFETY CAR — the field bunches up.",
        textEnjoyer: "SAFETY CAR — the pack closes right up.",
      });
    }

    // player overtake / loss events
    const alive = byPos(lap);
    const posMap = new Map(alive.map((a, i) => [a.comp.driverId, i + 1]));
    for (const car of running) {
      if (car.out) continue;
      const pos = posMap.get(car.comp.driverId)!;
      if (car.comp.isPlayer && pos < car.lastPos) {
        push({
          lap,
          type: "driver",
          severity: "success",
          actor: car.comp.driverId,
          text: `OVERTAKE — ${car.comp.driver.shortName} moves up to P${pos}.`,
          textEnjoyer: `${car.comp.driver.shortName} makes a move stick — P${pos}.`,
        });
      } else if (car.comp.isPlayer && pos > car.lastPos + 1) {
        push({
          lap,
          type: "driver",
          severity: "warning",
          actor: car.comp.driverId,
          text: `${car.comp.driver.shortName} drops from P${car.lastPos} to P${pos}.`,
          textEnjoyer: `${car.comp.driver.shortName} loses ground to P${pos}.`,
        });
      }
      car.lastPos = pos;
    }
  }

  // Classification
  const classified: RaceEntry[] = running.map((r) => {
    const gridPos = grid.find((g) => g.driverId === r.comp.driverId)?.gridPosition ?? 0;
    return {
      driverId: r.comp.driverId,
      teamId: r.comp.teamId,
      gridPosition: gridPos,
      position: 0,
      points: 0,
      dnf: r.out,
      dnfReason: r.out ? r.dnfReason : undefined,
      time: r.out ? Number.POSITIVE_INFINITY : r.cum,
      fastestLap: false,
    };
  });
  classified.sort((a, b) => a.time - b.time);

  let fastestLapDriver: string | undefined;
  {
    let fl = Infinity;
    for (const r of running) {
      if (!r.out && r.fastestLap < fl) {
        fl = r.fastestLap;
        fastestLapDriver = r.comp.driverId;
      }
    }
  }

  const nonDnf = classified.filter((e) => !e.dnf);
  const winTime = nonDnf[0]?.time ?? 0;
  nonDnf.forEach((e, i) => {
    e.position = i + 1;
    e.points = points[i] ?? 0;
    if (e.driverId === fastestLapDriver && getFastestPoint && e.points > 0) e.points += 1;
    e.time = i === 0 ? 0 : Math.round((e.time - winTime) * 100) / 100;
  });
  classified
    .filter((e) => e.dnf)
    .forEach((e) => {
      e.position = null;
      e.points = 0;
      e.time = -1;
    });

  if (fastestLapDriver) {
    const flComp = competitors.find((x) => x.driverId === fastestLapDriver);
    push({
      lap: laps,
      type: "info",
      severity: "success",
      text: `FASTEST LAP — ${flComp ? flComp.driver.shortName : fastestLapDriver}.`,
      textEnjoyer: "FASTEST LAP secured.",
    });
  }

  if (nonDnf[0]) {
    const winnerComp = competitors.find((x) => x.driverId === nonDnf[0].driverId);
    push({
      lap: laps,
      type: "info",
      severity: "success",
      text: `🏁 CHEQUERED FLAG — ${winnerComp ? winnerComp.driver.shortName : nonDnf[0].driverId} wins the ${track.grandPrix}.`,
      textEnjoyer: `🏁 The ${track.grandPrix} is won.`,
    });
  }

  return classified;
}

// ---------------------------------------------------------------------------

function failMessage(component: FailComponent): string {
  switch (component) {
    case "engine":
      return "power unit lets go — smoke trails the car";
    case "gearbox":
      return "gearbox failure — the transmission seizes";
    case "hydraulics":
      return "hydraulic pressure drops — the car stops";
    case "brakes":
      return "brake disc failure under heavy load";
    case "electrics":
      return "an electrical gremlin switches the car off";
  }
}

// ---------------------------------------------------------------------------
// Full weekend orchestration

export function simulateRaceWeekend(input: RaceInput): RaceWeekendResult {
  const { track, rng, season, playerTeamId } = input;
  const forecast = generateForecast(track, rng, input.difficulty);
  const weather = rollWeather(track, forecast, rng);
  const events: RaceEvent[] = [];

  const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  const sprintPoints = season === 2013 ? null : [8, 7, 6, 5, 4, 3, 2, 1];

  let grid = simulateQualifying(input);
  events.push({
    lap: 0,
    type: "info",
    severity: "info",
    text: `Qualifying complete — ${grid[0].driverId} on pole.`,
    textEnjoyer: "Qualifying done — the grid is set.",
  });

  let sprint: RaceEntry[] | undefined;
  if (input.runSprint && season === 2025 && sprintPoints) {
    sprint = simulateRace(
      { ...input, rng, track },
      weather,
      grid,
      sprintPoints,
      false,
      events,
    );
    grid = sprint.map((s) => ({ ...s, points: 0 })).sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
    grid.forEach((g, i) => (g.gridPosition = i + 1));
    events.push({
      lap: Math.round(track.laps * 0.4),
      type: "info",
      severity: "success",
      text: "SPRINT complete — its order sets tomorrow's grid.",
      textEnjoyer: "SPRINT done — the grid is set.",
    });
  }

  const race = simulateRace(input, weather, grid, points, season === 2025, events);

  const playerEntries = race
    .filter((e) => e.teamId === playerTeamId)
    .map((e) => ({
      driverId: e.driverId,
      position: e.position ?? 21,
      points: e.points,
      dnf: e.dnf,
    }));

  // expected result from raw abilities (no noise)
  const w = trackWeights(track);
  const playerAbilities = input.competitors
    .filter((c) => c.teamId === playerTeamId)
    .map((c) => carRating(c.car, w) * (1 - w.driverWeight) + driverAbility(c.driver, c.driverState ?? undefined, w) * w.driverWeight);
  const allAbilities = input.competitors.map((c) =>
    carRating(c.car, w) * (1 - w.driverWeight) + driverAbility(c.driver, c.driverState ?? undefined, w) * w.driverWeight,
  );
  const playerAvg = playerAbilities.reduce((a, b) => a + b, 0) / Math.max(1, playerAbilities.length);
  const ranks = [...allAbilities].sort((a, b) => b - a);
  let playerRank = ranks.indexOf(playerAvg);
  if (playerRank < 0) playerRank = ranks.findIndex((r) => r <= playerAvg);
  const expectedPos = Math.max(1, playerRank + 1);
  const expected = { min: Math.max(1, expectedPos - 1), max: Math.min(20, expectedPos + 1) };

  // why-finished breakdown (spec §55)
  const playerCars = input.competitors.filter((c) => c.teamId === playerTeamId);
  const fieldCar = input.competitors.map((c) => carRating(c.car, w));
  const myCar = playerCars.length ? playerCars.reduce((a, c) => a + carRating(c.car, w), 0) / playerCars.length : 80;
  const avgCar = fieldCar.reduce((a, b) => a + b, 0) / fieldCar.length;
  const myDriver =
    playerCars.length ? (playerCars.reduce((a, c) => a + c.driver.overall, 0) / playerCars.length) : 80;
  const fieldDriver = input.competitors.map((c) => c.driver.overall);
  const avgDriver = fieldDriver.reduce((a, b) => a + b, 0) / fieldDriver.length;

  const hasMechanicalDnf = playerEntries.some((p) => p.dnf);
  const bestFinish = Math.min(...playerEntries.map((p) => (p.dnf ? 999 : p.position)));
  const luck =
    bestFinish === 999
      ? -35
      : clamp(Math.round((expectedPos - bestFinish) * 9), -30, 30);

  return {
    round: 0,
    trackId: track.id,
    weather,
    forecast: {
      rainProbability: forecast.rainProbability,
      confidence: forecast.confidence,
      window: forecast.window,
    },
    qualifying: grid,
    sprint,
    race,
    events,
    playerEntries,
    breakdown: {
      car: Math.round(clamp((myCar - avgCar) * 4.4, -45, 45)),
      driver: Math.round(clamp((myDriver - avgDriver) * 4.4, -45, 45)),
      strategy: 0,
      reliability: hasMechanicalDnf ? -22 : Math.round(clamp((avgCar - myCar) * 1.2, -14, 14)),
      luck,
    },
    chaos: chaosOf(track, weather),
    expected,
  };
}