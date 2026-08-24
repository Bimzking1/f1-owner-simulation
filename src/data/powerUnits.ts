// ============================================================================
// F1 Owner — Era-aware power-unit configuration (2013 V8+KERS / 2025 V6 hybrid)
// Data + pure display math only: no simulation logic lives here.
// ============================================================================

import type { ComponentKey, ComponentState, EraComponentId, SeasonId } from "@/simulation/types";

/** The stats a garage component exposes, rendered by kind in the Garage tab. */
export type PuStatKind =
  | "condition"
  | "wearRate"
  | "reliability"
  | "output"
  | "recovery"
  | "deployment"
  | "electrical"
  | "heatRecovery"
  | "capacity"
  | "degradation"
  | "usageRaces"
  | "usageKm";

export interface PuStatSpec {
  kind: PuStatKind;
  label: string;
  hint: string;
}

export interface PuComponentConfig {
  id: EraComponentId;
  name: string;
  /** Geek hardware spec line, shown when the row is expanded. */
  spec: string;
  /** What the part does in this era — historical flavour, kept honest. */
  role: string;
  stats: PuStatSpec[];
  /** [min,max] % condition lost per race weekend (mirrors engine/gearbox wear). */
  wear: [number, number];
  /** How much condition per point of age costs on derived performance stats. */
  ageDrag: number;
  /** One-time purchase price for a fresh unit ($M). */
  replaceCost: number;
}

export interface PowerUnitConfig {
  /** Card heading — "Power system" (2013) vs "Power unit" (2025). */
  heading: string;
  /** Headline technology label — "2.4L V8 + KERS" vs "1.6L V6 Turbo Hybrid". */
  title: string;
  blurb: string;
  /** How the shared `engine` slot is named in this era. */
  engineName: string;
  engineSpec: string;
  engineRole: string;
  components: PuComponentConfig[];
}

const USAGE_KM_PER_RACE = 305; // ≈ typical GP distance incl. formation laps

const s = (kind: PuStatKind, label: string, hint: string): PuStatSpec => ({ kind, label, hint });

// ---------------------------------------------------------------------------
// 2013 — final naturally-aspirated V8 era. Engine + KERS + gearbox. No turbo,
// no MGU-K/MGU-H, no energy store: those do not exist yet.
// ---------------------------------------------------------------------------

const PU_2013: PowerUnitConfig = {
  heading: "Power system",
  title: "2.4L V8 + KERS",
  blurb:
    "Final year of the naturally aspirated V8 formula: a screaming 2.4L V8, a hydraulic 7-speed box and a driver-operated KERS boost. Simple, loud, mechanical.",
  engineName: "Engine — 2.4L NA V8",
  engineSpec: "2.4L naturally aspirated V8 · 18,000 rpm limit · ≈750 hp · ~160 kg",
  engineRole:
    "The heartbeat of the car. Cylinder deactivation, pneumatic valves and an exhaust that sings to 18,000 rpm. Wear shows up as power fade and, eventually, smoke.",
  components: [
    {
      id: "kers",
      name: "KERS",
      spec: "60 kW motor-generator on the crankshaft · 400 kJ deployable per lap",
      role:
        "Rear-axle electric boost harvested under braking and deployed by steering-wheel button. When it fails you simply lose the button — and the lap time that came with it.",
      stats: [
        s("condition", "Condition", "Health of the motor-generator, battery pack and power electronics."),
        s("reliability", "Reliability", "Estimated odds the system survives the weekend without a fault."),
        s("recovery", "Harvesting", "How efficiently braking energy is fed back into the batteries."),
        s("deployment", "Boost delivery", "Quality of the 6.7s-per-lap 60 kW push when the driver asks for it."),
        s("usageRaces", "Usage", "Race weekends completed on this unit."),
      ],
      wear: [0.7, 1.3],
      ageDrag: 0.6,
      replaceCost: 2.5,
    },
  ],
};

// ---------------------------------------------------------------------------
// 2025 — mature V6 turbo-hybrid era. Seven subsystems around one oil supply.
// ---------------------------------------------------------------------------

const PU_2025: PowerUnitConfig = {
  heading: "Power unit",
  title: "1.6L V6 Turbo Hybrid",
  blurb:
    "A 1.6L V6 turbo ICE plus six interlocked electrical/hydraulic subsystems. Every part shares oil, heat and telemetry — a fault anywhere drags the whole unit down.",
  engineName: "ICE — Internal Combustion Engine",
  engineSpec: "1.6L V6 turbo · 15,000 rpm · fuel-flow limited ≈550 hp (+≈160 hp ERS)",
  engineRole:
    "Pre-chamber combustion under a strict fuel-flow ceiling. It feeds the turbine, the MGU-H and the hydraulics — ICE health sets the ceiling for everything else.",
  components: [
    {
      id: "turbo",
      name: "Turbocharger",
      spec: "single-stage radial turbine · shaft-driven compressor · up to ~3.5 bar abs",
      role:
        "Exhaust energy spins the turbine that drives the compressor. Bearing wear shows up as boost inconsistency — power that comes and goes mid-corner exit.",
      stats: [
        s("condition", "Condition", "Turbine, compressor and bearing health."),
        s("wearRate", "Wear rate", "Average condition loss per race weekend."),
        s("reliability", "Reliability", "Estimated odds of surviving the weekend at full boost."),
        s("output", "Boost consistency", "How predictably target boost pressure is held."),
        s("usageKm", "Mileage", "Distance covered since installation."),
      ],
      wear: [1.4, 2.2],
      ageDrag: 1.0,
      replaceCost: 3,
    },
    {
      id: "mguK",
      name: "MGU-K",
      spec: "120 kW motor-generator · ≤2 MJ recovery per lap · front-axle harvest",
      role:
        "The braking-energy workhorse: recovers up to 2 MJ per lap into the store and deploys 120 kW to the rear wheels. Torque delivery maps live and die by its health.",
      stats: [
        s("condition", "Condition", "Motor, inverter and gearing health."),
        s("electrical", "Electrical performance", "Conversion efficiency between braking energy, store and drive shaft."),
        s("recovery", "Energy recovery", "Braking energy actually captured per lap vs the 2 MJ allowance."),
        s("wearRate", "Wear rate", "Average condition loss per race weekend."),
        s("usageRaces", "Usage", "Race weekends completed on this unit."),
      ],
      wear: [1.0, 1.6],
      ageDrag: 0.8,
      replaceCost: 3.5,
    },
    {
      id: "mguH",
      name: "MGU-H",
      spec: "turbine-shaft motor-generator · unlimited harvest between H & K",
      role:
        "The controversial one: sits on the turbo shaft, harvests exhaust energy with no cap and uses surplus power to spin the turbo up — killing lag before the exhaust even lights.",
      stats: [
        s("condition", "Condition", "Rotor, windings and shaft coupling health."),
        s("heatRecovery", "Heat recovery", "Exhaust energy harvested per lap through the turbine shaft."),
        s("output", "Hybrid response", "Turbo pre-spin quality — how little lag the driver feels."),
        s("wearRate", "Wear rate", "Average condition loss per race weekend."),
        s("usageRaces", "Usage", "Race weekends completed on this unit."),
      ],
      wear: [0.9, 1.5],
      ageDrag: 0.9,
      replaceCost: 3,
    },
    {
      id: "energyStore",
      name: "Energy Store",
      spec: "lithium-ion battery · ≤4 MJ deployment per lap · weight-balanced cell modules",
      role:
        "The battery bank every other subsystem charges from and discharges into. Cells hate heat and cycles — degradation here quietly shrinks deployable energy everywhere.",
      stats: [
        s("condition", "Condition", "Cell, module and cooling-loop health."),
        s("capacity", "Usable capacity", "Deployable energy per lap vs the 4 MJ allowance."),
        s("degradation", "Degradation", "Capacity worn off since installation."),
        s("reliability", "Reliability", "Estimated odds of no cell/BSI fault this weekend."),
        s("usageKm", "Mileage", "Distance covered since installation."),
      ],
      wear: [1.2, 1.9],
      ageDrag: 1.2,
      replaceCost: 4.5,
    },
    {
      id: "controlElectronics",
      name: "Control Electronics",
      spec: "FIA-standard ECU + manufacturer PU control software · torque & deployment maps",
      role:
        "The brain blending ICE torque, K/M deployment and turbo targets thousands of times a second. Boring until it faults — then nothing works together anymore.",
      stats: [
        s("condition", "Condition", "ECU, sensors and harness health."),
        s("reliability", "Reliability", "Estimated odds of no software/sensor DNF this weekend."),
        s("usageRaces", "Usage", "Race weekends completed on this unit."),
      ],
      wear: [0.4, 0.8],
      ageDrag: 0.3,
      replaceCost: 2,
    },
    {
      id: "exhaust",
      name: "Exhaust",
      spec: "single exit · turbine-linked · wastegated",
      role:
        "Routes hot gas through the turbine at ~1000°C. Cracks and warping bleed turbine energy straight out of the tailpipe — and the MGU-H feels it first.",
      stats: [
        s("condition", "Condition", "Pipework, joints and wastegate health."),
        s("wearRate", "Wear rate", "Average condition loss per race weekend."),
        s("reliability", "Reliability", "Estimated odds of finishing the weekend crack-free."),
        s("usageKm", "Mileage", "Distance covered since installation."),
      ],
      wear: [1.6, 2.4],
      ageDrag: 1.4,
      replaceCost: 1.5,
    },
  ],
};

export const POWER_UNITS: Record<SeasonId, PowerUnitConfig> = {
  2013: PU_2013,
  2025: PU_2025,
};

export function powerUnitForSeason(season: SeasonId): PowerUnitConfig {
  return POWER_UNITS[season];
}

/** Config for one era part; null when the season has no such component. */
export function puComponentConfig(season: SeasonId, id: EraComponentId): PuComponentConfig | null {
  return POWER_UNITS[season].components.find((c) => c.id === id) ?? null;
}

/** Human label used in ledger entries and confirm modals. */
export function componentLabel(key: ComponentKey, season: SeasonId): string {
  if (key === "engine") return POWER_UNITS[season].engineName;
  if (key === "gearbox") return "Gearbox";
  return puComponentConfig(season, key)?.name ?? key;
}

// ---------------------------------------------------------------------------
// Derived display stats — deterministic functions of tracked state, so the
// garage never contradicts itself between renders.
// ---------------------------------------------------------------------------

/** Effectiveness % of a subsystem: health minus fatigue proportional to usage. */
export function puEffectiveness(ageDrag: number, c: ComponentState): number {
  return Math.round(Math.min(100, Math.max(5, c.condition - c.age * ageDrag)));
}

/**
 * Estimated reliability rating (0-100): the supplier's base reliability,
 * discounted by how tired the installed unit currently is.
 */
export function reliabilityEstimate(baseRel: number, c: ComponentState): number {
  const factor = 0.55 + 0.45 * (c.condition / 100);
  return Math.round(Math.min(100, Math.max(1, baseRel * factor)));
}

/** Average wear per race weekend, formatted for display ("≈1.8%/race"). */
export function wearRateLabel(wear: [number, number]): string {
  const mid = (wear[0] + wear[1]) / 2;
  return `≈${mid.toFixed(1)}%/race`;
}

/** Approximate distance covered since installation. */
export function usageKm(age: number): number {
  return Math.round(age * USAGE_KM_PER_RACE);
}

/** Era-appropriate gearbox spec line for the garage card note. */
export function gearboxEraNote(season: SeasonId): string {
  return season === 2013
    ? "7-speed seamless-shift hydraulic box, structural titanium casing. Ratios are fixed for the season."
    : "7-speed seamless-shift box in a carbon-composite case, bolted structurally to the power unit. Ratios fixed per season.";
}
