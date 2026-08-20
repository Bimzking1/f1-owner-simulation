// ============================================================================
// F1 Owner — Grid solver (spec §53 extension)
// The player may sign any driver from any team for their two seats. Every
// other seat on the grid must still be filled: displaced drivers are re-seated
// into the vacancies created by the player's signings — randomly. Drivers that
// cannot be seated (e.g. a 3rd/reserve driver like Alpine's Colapinto when the
// player does not sign him) stay unattached off the grid.
// ============================================================================

import type { Driver, SeasonId } from "./types";
import { constructorsBySeason, driverById, driversForSeason } from "@/data";

export interface GridResult {
  lineups: Record<string, string[]>; // teamId → exactly 2 seated driver ids
  unattached: string[]; // contracted drivers without a grid seat
}

/**
 * Resolve the full grid for a season given the player's constructor and the
 * two drivers they signed. Deterministic for a fixed rng stream.
 */
export function buildGridLineups(
  season: SeasonId,
  playerTeamId: string,
  picked: string[],
  rng: () => number,
): GridResult {
  const teams = constructorsBySeason(season).map((c) => c.id);
  const roster = driversForSeason(season);
  const pickedSet = new Set(picked.filter(Boolean));
  const playerDrivers = picked.filter((id) => !!driverById(id, season)).slice(0, 2);

  // everyone else is up for grabs, minus anyone we have to bench to keep the
  // grid at exactly two cars per team.
  const left = roster.filter((d) => !pickedSet.has(d.id));
  const benched: Driver[] = [];
  const aiSeats = (teams.length - 1) * 2;
  while (left.length > aiSeats) {
    const reserve = left.find((d) => d.reserve);
    const benchIdx = reserve ? left.indexOf(reserve) : lowestOverallIndex(left);
    benched.push(...left.splice(benchIdx, 1));
  }

  const lineups: Record<string, string[]> = {};
  lineups[playerTeamId] = playerDrivers;

  // each AI team keeps its own best available pair (reserves last)
  const seated = new Set<string>(playerDrivers);
  for (const teamId of teams) {
    if (teamId === playerTeamId) continue;
    const own = left
      .filter((d) => d.teamId === teamId)
      .sort((a, b) => (a.reserve === b.reserve ? b.overall - a.overall : a.reserve ? 1 : -1));
    const retained = own.slice(0, 2);
    lineups[teamId] = retained.map((d) => d.id);
    for (const d of retained) seated.add(d.id);
  }

  // everyone without a seat is displaced into the pool
  const displaced = left.filter((d) => !seated.has(d.id));
  shuffle(displaced, rng);

  // displaced drivers fill the vacancies in random order
  for (const teamId of teams) {
    if (teamId === playerTeamId) continue;
    while (lineups[teamId].length < 2) {
      const d = displaced.shift();
      if (!d) break;
      lineups[teamId].push(d.id);
    }
  }

  return { lineups, unattached: [...benched, ...displaced].map((d) => d.id) };
}

function lowestOverallIndex(drivers: Driver[]): number {
  return drivers.reduce((lo, d, i) => (d.overall < drivers[lo].overall ? i : lo), 0);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}