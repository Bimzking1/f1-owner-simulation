// ============================================================================
// F1 Owner — data aggregator: season-scoped lookups used by sim + UI.
// ============================================================================

import type { SeasonId } from "@/simulation/types";
import { CONSTRUCTORS, ENGINES, GEARBOXES, TECH_PACKAGES, constructorsBySeason, enginesForSeason, gearboxesForSeason, techPackagesForSeason } from "./constructors";
import { DRIVERS_2013, DRIVERS_2025, driversForSeason } from "./drivers";
import { ENGINEERS, MECHANICS, engineersForSeason, mechanicsForSeason } from "./staff";
import { SPONSORS, sponsorsForSeason } from "./sponsors";
import { TRACKS_2013, TRACKS_2025, calendarForSeason } from "./tracks";

export { constructorsBySeason, enginesForSeason, gearboxesForSeason, techPackagesForSeason, engineersForSeason, mechanicsForSeason, sponsorsForSeason, calendarForSeason, driversForSeason };
export { DRIVERS_2013, DRIVERS_2025, TRACKS_2013, TRACKS_2025 };

export const ALL_DRIVERS = [...DRIVERS_2013, ...DRIVERS_2025];
export const ALL_CONSTRUCTORS = CONSTRUCTORS;
export const ALL_ENGINES = ENGINES;
export const ALL_GEARBOXES = GEARBOXES;
export const ALL_TECH_PACKAGES = TECH_PACKAGES;
export const ALL_ENGINEERS = ENGINEERS;
export const ALL_MECHANICS = MECHANICS;
export const ALL_SPONSORS = SPONSORS;
export const ALL_TRACKS = [...TRACKS_2013, ...TRACKS_2025];

export function driverById(id: string, season?: number) {
  if (season !== undefined) {
    const hit = ALL_DRIVERS.find((d) => d.id === id && d.season === season);
    if (hit) return hit;
  }
  return ALL_DRIVERS.find((d) => d.id === id);
}
export function constructorById(id: string, season?: number) {
  if (season !== undefined) {
    const hit = ALL_CONSTRUCTORS.find((c) => c.id === id && c.season === season);
    if (hit) return hit;
  }
  return ALL_CONSTRUCTORS.find((c) => c.id === id);
}
export function engineById(id: string) {
  return ALL_ENGINES.find((e) => e.id === id);
}
export function gearboxById(id: string) {
  return ALL_GEARBOXES.find((g) => g.id === id);
}
export function techPackageById(id: string) {
  return ALL_TECH_PACKAGES.find((t) => t.id === id);
}
export function engineerById(id: string) {
  return ALL_ENGINEERS.find((e) => e.id === id);
}
export function mechanicById(id: string) {
  return ALL_MECHANICS.find((m) => m.id === id);
}
export function sponsorById(id: string) {
  return ALL_SPONSORS.find((s) => s.id === id);
}
export function trackById(id: string) {
  return ALL_TRACKS.find((t) => t.id === id);
}

export function seasonCalendar(season: SeasonId) {
  return calendarForSeason(season);
}

/** All drivers for a season indexed by team id. */
export function driversByTeam(season: SeasonId): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const d of driversForSeason(season)) {
    (map[d.teamId] ??= []).push(d.id);
  }
  return map;
}

/** Teams available for the player to take over in a season. */
export function takeoverOptions(season: SeasonId) {
  return constructorsBySeason(season);
}

/** Sponsor pool scaled to a team's reputation (spec §47). */
export function availableSponsors(season: SeasonId, reputation: number, cash: number) {
  const all = sponsorsForSeason(season);
  return all.filter((s) => {
    const tierGate = s.tier === "title" ? reputation >= 30 : true;
    return tierGate && s.signingBonus <= cash + 2;
  });
}