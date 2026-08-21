// ============================================================================
// F1 Owner — Staff: engineers + mechanics (spec §27-30)
// ============================================================================

import type { EngineerSpec, MechanicSpec, SeasonId } from "@/simulation/types";
import { assetPaths } from "./assets";

export const ENGINEERS: EngineerSpec[] = [
  // ---- 2013
  { id: "eng-aero-jr13", name: "Junior Aerodynamicist", department: "aero", season: 2013, expertise: 74, experience: 68, innovation: 76, developmentSpeed: 70, reliabilityFocus: 62, cost: 2, image: assetPaths.engines.engineers },
  { id: "eng-aero-sr13", name: "Senior Aerodynamicist", department: "aero", season: 2013, expertise: 90, experience: 88, innovation: 86, developmentSpeed: 88, reliabilityFocus: 72, cost: 5, image: assetPaths.engines.engineers },
  { id: "eng-aero-el13", name: "Head of Aerodynamics", department: "aero", season: 2013, expertise: 96, experience: 94, innovation: 93, developmentSpeed: 94, reliabilityFocus: 76, cost: 9, image: assetPaths.engines.engineers },
  { id: "eng-dyn-jr13", name: "Junior Vehicle Dynamicist", department: "dynamics", season: 2013, expertise: 72, experience: 66, innovation: 74, developmentSpeed: 68, reliabilityFocus: 64, cost: 2, image: assetPaths.engines.engineers },
  { id: "eng-dyn-sr13", name: "Senior Vehicle Dynamicist", department: "dynamics", season: 2013, expertise: 88, experience: 86, innovation: 84, developmentSpeed: 86, reliabilityFocus: 76, cost: 5, image: assetPaths.engines.engineers },
  { id: "eng-dyn-el13", name: "Chassis Director", department: "dynamics", season: 2013, expertise: 94, experience: 92, innovation: 90, developmentSpeed: 92, reliabilityFocus: 80, cost: 8, image: assetPaths.engines.engineers },
  { id: "eng-pow-jr13", name: "Junior Powertrain Engineer", department: "powertrain", season: 2013, expertise: 73, experience: 67, innovation: 72, developmentSpeed: 68, reliabilityFocus: 70, cost: 2, image: assetPaths.engines.engineers },
  { id: "eng-pow-sr13", name: "Senior Powertrain Engineer", department: "powertrain", season: 2013, expertise: 89, experience: 87, innovation: 85, developmentSpeed: 87, reliabilityFocus: 82, cost: 5, image: assetPaths.engines.engineers },
  { id: "eng-race-jr13", name: "Junior Race Engineer", department: "race", season: 2013, expertise: 74, experience: 70, innovation: 70, developmentSpeed: 66, reliabilityFocus: 72, cost: 2, image: assetPaths.engines.engineers },
  { id: "eng-race-sr13", name: "Senior Race Engineer", department: "race", season: 2013, expertise: 90, experience: 90, innovation: 82, developmentSpeed: 80, reliabilityFocus: 84, cost: 5, image: assetPaths.engines.engineers },
  { id: "eng-rel-sr13", name: "Reliability Engineer", department: "reliability", season: 2013, expertise: 88, experience: 86, innovation: 80, developmentSpeed: 82, reliabilityFocus: 94, cost: 4, image: assetPaths.engines.engineers },
  { id: "eng-cto13", name: "Chief Technical Officer", department: "cto", season: 2013, expertise: 93, experience: 94, innovation: 90, developmentSpeed: 90, reliabilityFocus: 80, cost: 11, image: assetPaths.engines.engineers },

  // ---- 2025
  { id: "eng-aero-jr25", name: "Junior Aerodynamicist", department: "aero", season: 2025, expertise: 76, experience: 70, innovation: 78, developmentSpeed: 72, reliabilityFocus: 64, cost: 3, image: assetPaths.engines.engineers },
  { id: "eng-aero-sr25", name: "Senior Aerodynamicist", department: "aero", season: 2025, expertise: 91, experience: 89, innovation: 88, developmentSpeed: 89, reliabilityFocus: 74, cost: 7, image: assetPaths.engines.engineers },
  { id: "eng-aero-el25", name: "Head of Aerodynamics", department: "aero", season: 2025, expertise: 97, experience: 95, innovation: 95, developmentSpeed: 95, reliabilityFocus: 78, cost: 12, image: assetPaths.engines.engineers },
  { id: "eng-dyn-jr25", name: "Junior Vehicle Dynamicist", department: "dynamics", season: 2025, expertise: 74, experience: 68, innovation: 76, developmentSpeed: 70, reliabilityFocus: 66, cost: 3, image: assetPaths.engines.engineers },
  { id: "eng-dyn-sr25", name: "Senior Vehicle Dynamicist", department: "dynamics", season: 2025, expertise: 89, experience: 87, innovation: 86, developmentSpeed: 88, reliabilityFocus: 78, cost: 7, image: assetPaths.engines.engineers },
  { id: "eng-dyn-el25", name: "Chassis Director", department: "dynamics", season: 2025, expertise: 95, experience: 93, innovation: 92, developmentSpeed: 93, reliabilityFocus: 82, cost: 11, image: assetPaths.engines.engineers },
  { id: "eng-pow-jr25", name: "Junior Powertrain Engineer", department: "powertrain", season: 2025, expertise: 75, experience: 69, innovation: 74, developmentSpeed: 70, reliabilityFocus: 72, cost: 3, image: assetPaths.engines.engineers },
  { id: "eng-pow-sr25", name: "Senior Powertrain Engineer", department: "powertrain", season: 2025, expertise: 90, experience: 88, innovation: 87, developmentSpeed: 88, reliabilityFocus: 83, cost: 7, image: assetPaths.engines.engineers },
  { id: "eng-race-jr25", name: "Junior Race Engineer", department: "race", season: 2025, expertise: 76, experience: 72, innovation: 72, developmentSpeed: 68, reliabilityFocus: 74, cost: 3, image: assetPaths.engines.engineers },
  { id: "eng-race-sr25", name: "Senior Race Engineer", department: "race", season: 2025, expertise: 91, experience: 91, innovation: 84, developmentSpeed: 82, reliabilityFocus: 86, cost: 7, image: assetPaths.engines.engineers },
  { id: "eng-rel-sr25", name: "Reliability Engineer", department: "reliability", season: 2025, expertise: 90, experience: 88, innovation: 82, developmentSpeed: 84, reliabilityFocus: 95, cost: 6, image: assetPaths.engines.engineers },
  { id: "eng-cto25", name: "Chief Technical Officer", department: "cto", season: 2025, expertise: 95, experience: 96, innovation: 93, developmentSpeed: 92, reliabilityFocus: 82, cost: 16, image: assetPaths.engines.engineers },
];

export const MECHANICS: MechanicSpec[] = [
  { id: "mech-budget13", name: "Budget Pit Crew", season: 2013, pitStop: 2.95, errorChance: 6, repairEfficiency: 68, cost: 2, image: assetPaths.engines.mechanics },
  { id: "mech-standard13", name: "Standard Pit Crew", season: 2013, pitStop: 2.7, errorChance: 3.5, repairEfficiency: 80, cost: 4, image: assetPaths.engines.mechanics },
  { id: "mech-elite13", name: "Elite Pit Crew", season: 2013, pitStop: 2.35, errorChance: 1.2, repairEfficiency: 94, cost: 7, image: assetPaths.engines.mechanics },
  { id: "mech-budget25", name: "Budget Pit Crew", season: 2025, pitStop: 2.85, errorChance: 5.5, repairEfficiency: 70, cost: 3, image: assetPaths.engines.mechanics },
  { id: "mech-standard25", name: "Standard Pit Crew", season: 2025, pitStop: 2.6, errorChance: 3, repairEfficiency: 82, cost: 6, image: assetPaths.engines.mechanics },
  { id: "mech-elite25", name: "Elite Pit Crew", season: 2025, pitStop: 2.25, errorChance: 1, repairEfficiency: 96, cost: 10, image: assetPaths.engines.mechanics },
];

export const engineersForSeason = (season: SeasonId) => ENGINEERS.filter((e) => e.season === season);
export const mechanicsForSeason = (season: SeasonId) => MECHANICS.filter((m) => m.season === season);

export const DEPARTMENT_LABELS: Record<string, string> = {
  aero: "Aerodynamics",
  dynamics: "Vehicle Dynamics",
  powertrain: "Powertrain",
  race: "Race Engineering",
  reliability: "Reliability",
  cto: "Chief Technical Officer",
};

export interface StaffMeta {
  label: string;
  tone: "ink" | "telemetry" | "elite" | "caution";
}

export function engineerSeniority(e: EngineerSpec): StaffMeta {
  if (e.name.startsWith("Junior")) return { label: "Junior", tone: "ink" };
  if (e.name.startsWith("Head of") || e.name === "Chassis Director") return { label: "Head", tone: "elite" };
  if (e.name.startsWith("Chief")) return { label: "CTO", tone: "elite" };
  return { label: "Senior", tone: "telemetry" };
}

export function engineerRole(e: EngineerSpec): string {
  return e.department === "cto" ? "Technical leadership" : DEPARTMENT_LABELS[e.department];
}

export function mechanicTier(m: MechanicSpec): StaffMeta {
  if (m.name.startsWith("Budget")) return { label: "Budget", tone: "caution" };
  if (m.name.startsWith("Standard")) return { label: "Standard", tone: "telemetry" };
  return { label: "Elite", tone: "elite" };
}

// ---------------------------------------------------------------------------
// Explanations for setup-screen tooltips (departments, seniority, pit crews)

export const DEPARTMENT_INFO: Record<string, string> = {
  aero: "Aerodynamics — designs wings, floors and diffusers. Drives downforce gains from development projects: more downforce means faster corners. The single biggest performance department.",
  dynamics: "Vehicle Dynamics — suspension, weight transfer and platform behavior. Boosts chassis upgrades and how kindly the car treats its tires over a stint.",
  powertrain: "Powertrain — engine installation, cooling and energy recovery. Supports the power and reliability of whichever engine unit you lease.",
  race: "Race Engineering — runs the car at the track: strategy calls, setup sheets, driver feedback. Raises your strategy rating every weekend.",
  reliability: "Reliability — hunts failures before they happen. Directly reduces mechanical DNF risk and slows component wear across the season.",
  cto: "Chief Technical Officer — ties every department together. Big multipliers on development speed and innovation for all projects, whatever the area.",
};

export const SENIORITY_INFO: Record<string, string> = {
  Junior: "Junior — cheapest salary and lower ratings across the board, but decent innovation growth. Good filler when the budget is tight.",
  Senior: "Senior — the sweet spot: strong expertise and development speed at mid price. Most teams field seniors in their key departments.",
  Head: "Head of department — the best ratings money can buy plus a leadership aura that lifts the whole department. Costs roughly double a senior.",
  CTO: "CTO — one per team. Multiplies development output and innovation for every project, whatever the department. The most expensive hire on the list.",
};

export const MECHANIC_TIER_INFO: Record<string, string> = {
  Budget: "Budget pit crew — slow stops (~2.9s) and frequent errors (~6%). Cheap, but every fumbled wheel gun costs track position.",
  Standard: "Standard pit crew — solid ~2.6-2.7s stops with a moderate error rate (~3%). The sensible midfield choice.",
  Elite: "Elite pit crew — sub-2.4s stops and rare mistakes (~1%). Red Bull-level choreography; pays for itself in track position.",
};