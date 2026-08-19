// Runtime smoke test: builds a 2025 season and runs it end to end.
// Run via: node dist-smoke/smoke.cjs (built with esbuild --alias)

import type { TeamState } from "../src/simulation/types";
import { buildSimulation } from "../src/state";
import { runRound } from "../src/simulation/sim";

const team: TeamState = {
  constructorId: "ferrari",
  philosophy: "balanced",
  teamOrders: "equal",
  driver1Id: "leclerc",
  driver2Id: "hamilton",
  engineerIds: ["eng-aero-sr25", "eng-dyn-sr25", "eng-race-sr25"],
  mechanicIds: ["mech-standard25", "mech-elite25"],
  engineId: "ferrari25-works",
  gearboxId: "gb-balanced-25",
  techPackageId: "tech-race-25",
  sponsorIds: ["sponsor-orbit25", "sponsor-velo25"],
  cash: 120,
  reputation: 70,
  startCash: 120,
  car: { aero: 0, chassis: 0, reliability: 0, tireBehavior: 0, power: 0, gearboxPerf: 0 },
  components: {
    engine: { condition: 100, age: 0, replacements: 0 },
    gearbox: { condition: 100, age: 0, replacements: 0 },
  },
  upgrades: [],
  drivers: [],
  sponsors: [],
  pitCrew: 72,
  history: [],
  points: 0,
  wins: 0,
  podiums: 0,
  dnfs: 0,
  lastRoundCompleted: 0,
};

function check(name: string, cond: boolean, detail = "") {
  if (!cond) {
    console.error(`FAIL ${name} ${detail}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${name} ${detail}`);
  }
}

const seed = "F1-2025-123456";
const state = buildSimulation({ season: 2025, difficulty: "professional", gameLength: "standard", team }, seed);

check("phase=season", state.phase === "season");
check("calendar 24 rounds", state.calendar.length === 24, `got ${state.calendar.length}`);
check("team exists", !!state.team);
check("drivers init", state.team!.drivers.length === 2, `got ${state.team!.drivers.length}`);
check("sponsors init", state.team!.sponsors.length === 2, `got ${state.team!.sponsors.length}`);
check("car stats computed", state.team!.car.aero > 0 && state.team!.car.power > 0);
check("standings 22 drivers", state.standingsDrivers.length === 20, `got ${state.standingsDrivers.length}`);
check("standings 11 teams", state.standingsConstructors.length === 10, `got ${state.standingsConstructors.length}`);
check("pit crew", state.team!.pitCrew > 0, `got ${state.team!.pitCrew}`);

const startCash = state.team!.cash;

for (let i = 0; i < 24; i++) {
  const beforeRound = state.round;
  const outcome = runRound(state);
  check(
    `round ${i + 1} advanced (r${beforeRound}->${state.round})`,
    state.round === beforeRound + 1,
    `outcome.phase=${outcome.phase}`,
  );
  check(`round ${i + 1} weekend present`, !!state.lastWeekend);
  const w = state.lastWeekend!;
  check(`round ${i + 1} race has 20 entries`, w.race.length === 20, `got ${w.race.length}`);
  check(`round ${i + 1} qualifying grid ok`, w.qualifying.length === 20 && w.qualifying.every((e) => e.gridPosition >= 1));
  check(`round ${i + 1} player 2 entries`, w.playerEntries.length === 2, `got ${w.playerEntries.length}`);
  const badPts = w.race.some((e) => Number.isNaN(e.points) || e.points < 0);
  check(`round ${i + 1} points valid`, !badPts);
  check(`round ${i + 1} cash finite`, Number.isFinite(state.team!.cash), `cash=${state.team!.cash}`);
  check(`round ${i + 1} standings updated`, state.standingsConstructors.every((c) => c.points >= 0));
  check(
    `round ${i + 1} player totals match`,
    Math.abs(state.team!.points - state.standingsConstructors.find((c) => c.teamId === state.team!.constructorId)!.points) < 0.001,
  );
}

check("season finished", state.phase === "finished");
check("all rounds completed", state.completedRounds === 24);
const cashDelta = state.team!.cash - startCash;
check("cash moved over season", Math.abs(cashDelta) > 0.01, `delta=${cashDelta.toFixed(2)}`);
check("news feed populated", state.news.length > 30, `got ${state.news.length}`);
check("history has transactions", state.team!.history.length > 24, `got ${state.team!.history.length}`);
check("components worn", state.team!.components.engine.condition < 100, `engine=${state.team!.components.engine.condition}`);

const driverWins = state.standingsDrivers.filter((d) => d.wins > 0).length;
check("some driver wins", driverWins >= 1, `winners=${driverWins}`);
check("WCC points total sane", state.standingsConstructors.reduce((a, c) => a + c.points, 0) > 500);

console.log(`\nFINAL: cash=${state.team!.cash} pts=${state.team!.points} WCC pos=${state.standingsConstructors.findIndex((c) => c.teamId === state.team!.constructorId) + 1}`);
console.log(process.exitCode ? "SMOKE TEST FAILED" : "SMOKE TEST PASSED");