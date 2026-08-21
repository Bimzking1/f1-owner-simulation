// ============================================================================
// F1 Owner — Game state factory + persistence (spec §80)
// ============================================================================

import type {
  DifficultyId,
  GameLengthId,
  SeasonId,
  SimulationState,
  TeamState,
} from "@/simulation/types";
import { DIFFICULTIES } from "@/data/config";
import { constructorById, driverById, driversByTeam, engineById, gearboxById, techPackageById } from "@/data";
import { createSeason } from "@/simulation/sim";

export interface DraftConfig {
  season: SeasonId;
  difficulty: DifficultyId;
  gameLength: GameLengthId;
}

/** Fresh setup draft: only team + meta, no simulation yet. */
export function newDraft(cfg: DraftConfig): { meta: DraftConfig; team: TeamState | null } {
  return {
    meta: cfg,
    team: null,
  };
}

export interface DraftSpec extends DraftConfig {
  team: TeamState;
}

/** Construct the season SimulationState from a completed setup (spec §60). */
export function buildSimulation(spec: DraftSpec, seed: string): SimulationState {
  const base: SimulationState = {
    version: 1,
    seed,
    season: spec.season,
    difficulty: spec.difficulty,
    gameLength: spec.gameLength,
    phase: "season",
    team: spec.team,
    calendar: [],
    round: 0,
    standingsDrivers: [],
    standingsConstructors: [],
    lineups: {},
    unattachedDrivers: [],
    lastWeekend: null,
    news: [],
    testing: [],
    completedRounds: 0,
    bankrupt: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return createSeason(base, seed);
}

/** Effective setup budget after equipment + staff deductions (spec §32-ish). */
export function setupBudget(team: TeamState): { total: number; spent: number; remaining: number } {
  const engine = engineById(team.engineId);
  const gearbox = gearboxById(team.gearboxId);
  const tech = techPackageById(team.techPackageId);
  const spent = (engine?.cost ?? 0) + (gearbox?.cost ?? 0) + (tech?.cost ?? 0);
  return { total: team.startCash, spent, remaining: team.startCash - spent };
}

// ---------------------------------------------------------------------------
// Persistence

const KEY = "f1-owner-save-v1";

export function saveState(state: SimulationState | null) {
  try {
    if (!state) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function loadState(): SimulationState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SimulationState;
    if (!s || s.version !== 1 || !s.team) return null;
    sanitizeRoster(s);
    backfillLineups(s);
    return s;
  } catch {
    return null;
  }
}

/** Repair old saves where the driver roster drifted from the two seats. */
function sanitizeRoster(s: SimulationState): void {
  const t = s.team;
  if (!t) return;
  const seats = [t.driver1Id, t.driver2Id];
  const seen = new Set<string>();
  const kept = t.drivers.filter((d) => {
    if (!seats.includes(d.driverId)) return false;
    if (seen.has(d.driverId)) return false;
    seen.add(d.driverId);
    return true;
  });
  for (const id of seats) {
    if (kept.some((d) => d.driverId === id)) continue;
    kept.push({ driverId: id, confidence: 50, morale: 55, frustration: 25, form: 0, dnfs: 0, points: 0 });
  }
  t.drivers = kept;
}

/** Old saves predate grid solving: rebuild a legal every-team-2-cars line-up. */
function backfillLineups(s: SimulationState): void {
  const t = s.team;
  if (!t) return;
  if (s.lineups && Object.keys(s.lineups).length >= 2) {
    s.unattachedDrivers ??= [];
    return;
  }
  const byTeam = driversByTeam(s.season);
  const lineups: Record<string, string[]> = {};
  lineups[t.constructorId] = [t.driver1Id, t.driver2Id].filter((id) => !!driverById(id, s.season));
  for (const [teamId, ids] of Object.entries(byTeam)) {
    if (teamId === t.constructorId) continue;
    lineups[teamId] = ids.slice(0, 2);
  }
  s.lineups = lineups;
  s.unattachedDrivers = [];
}

// ---------------------------------------------------------------------------

export function difficultyOf(state: SimulationState) {
  return DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
}

export function constructorName(team: TeamState): string {
  return constructorById(team.constructorId)?.name ?? team.constructorId;
}

/** "Ms. Clark" — honorific + surname, used when characters address the owner. */
export function ownerTitle(state: SimulationState): string {
  const o = state.team?.owner;
  if (!o?.name) return "Boss";
  const parts = o.name.trim().split(/\s+/);
  return `${o.honorific} ${parts[parts.length - 1]}`;
}