// ============================================================================
// F1 Owner — Domain types (spec §87)
// The simulation engine is UI-agnostic: screens consume these shapes.
// ============================================================================

export type SeasonId = 2013 | 2025;
export type DifficultyId = "rookie" | "professional" | "expert" | "ruthless";
export type GameLengthId = "short" | "standard" | "long" | "hardcore";
export type WeatherId = "dry" | "lightRain" | "heavyRain" | "changing";
export type Phase = "landing" | "setup" | "testing" | "season" | "finished" | "bankrupt";

export type PersonalityId =
  | "aggressive"
  | "calm"
  | "competitive"
  | "teamPlayer"
  | "perfectionist"
  | "riskTaker"
  | "technical"
  | "tireWhisperer"
  | "qualifyingSpecialist"
  | "wetSpecialist";

export const PERSONALITY_LABELS: Record<PersonalityId, string> = {
  aggressive: "Aggressive",
  calm: "Calm",
  competitive: "Competitive",
  teamPlayer: "Team Player",
  perfectionist: "Perfectionist",
  riskTaker: "Risk Taker",
  technical: "Technical",
  tireWhisperer: "Tire Whisperer",
  qualifyingSpecialist: "Qualifying Specialist",
  wetSpecialist: "Wet Specialist",
};

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export interface DriverAttributes {
  pace: number;
  qualifying: number;
  racecraft: number;
  consistency: number;
  tireManagement: number;
  wetSkill: number;
  adaptability: number;
  feedback: number;
  pressure: number;
  aggression: number;
}

export interface Driver {
  id: string;
  name: string;
  shortName: string;
  number: number;
  nationality: string;
  age: number;
  season: SeasonId;
  teamId: string;
  attributes: DriverAttributes;
  overall: number;
  careerValue: number;
  seasonForm: number;
  potential: number;
  experience: number;
  reputation: number;
  salary: number; // $M per season
  sponsorAppeal: number;
  personality: PersonalityId;
  variance: number; // mood variance (gacha), spec §21
  rookie: boolean;
  reserve: boolean; // third/reserve driver — not guaranteed a grid seat
  image: string;
}

/** Live per-season driver mood/state — varies per run, ability does not. */
export interface DriverState {
  driverId: string;
  confidence: number;
  morale: number;
  frustration: number;
  form: number; // -10..+10 seasonal form offset
  dnfs: number;
  points: number;
  /** Owner interventions with lingering per-weekend effects (spec §24). */
  boosts?: DriverBoost[];
}

/** A temporary morale effect applied once per weekend for `racesLeft` weekends. */
export interface DriverBoost {
  label: string;
  morale?: number;
  confidence?: number;
  frustration?: number;
  racesLeft: number;
}

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

export interface ConstructorDna {
  chassis: number;
  aero: number;
  factory: number;
  engineering: number;
  reliability: number;
  developmentCapacity: number;
  budgetEfficiency: number;
  reputation: number;
  sponsorAppeal: number;
}

export interface Constructor {
  id: string;
  name: string;
  fullName: string;
  season: SeasonId;
  nationality: string;
  dna: ConstructorDna;
  allowedEngines: string[]; // historically valid engine supplier ids
  startCash: number; // $M the owner receives at takeover
  operatingCost: number; // $M per race overhead
  image: string;
  carImage: string;
  colors: { primary: string; secondary: string };
}

// ---------------------------------------------------------------------------
// Technical supply
// ---------------------------------------------------------------------------

export interface EngineSpec {
  id: string;
  name: string;
  supplier: string;
  season: SeasonId;
  status: "works" | "customer";
  power: number;
  reliability: number;
  efficiency: number;
  cost: number; // $M season lease
  image: string;
  description: string;
}

export interface GearboxSpec {
  id: string;
  name: string;
  season: SeasonId;
  performance: number;
  reliability: number;
  cost: number;
  image: string;
  description: string;
}

export interface TechPackageSpec {
  id: string;
  name: string;
  season: SeasonId;
  aero: number;
  chassis: number;
  reliability: number;
  tireBehavior: number;
  cost: number;
  image: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export type Department = "aero" | "dynamics" | "powertrain" | "race" | "reliability" | "cto";

export interface EngineerSpec {
  id: string;
  name: string;
  department: Department;
  season: SeasonId;
  expertise: number;
  experience: number;
  innovation: number;
  developmentSpeed: number;
  reliabilityFocus: number;
  cost: number; // $M per season
  image: string;
}

export interface MechanicSpec {
  id: string;
  name: string;
  season: SeasonId;
  pitStop: number; // average stop in seconds
  errorChance: number; // %
  repairEfficiency: number;
  cost: number; // $M per season
  image: string;
}

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

export type SponsorObjectiveKind =
  | "pointsNextRaces" // score points in X of next Y races
  | "top10NextRaces" // top-10 finish in X of next Y races
  | "podiumByRound" // one podium before round X
  | "beatRival" // outscore rival team by round X
  | "pointsConsecutive" // points in N consecutive races
  | "wccPosition"; // finish WCC in top N

export interface SponsorSpec {
  id: string;
  name: string;
  category: string; // e.g. "Technology", "Energy", "Banking"
  season: SeasonId;
  tier: "title" | "major" | "minor";
  signingBonus: number; // $M
  racePayment: number; // $M per race
  objective: SponsorObjectiveKind;
  objectiveText: string; // geek
  objectiveTextEnjoyer: string;
  bonus: number; // $M if objective met
  patience: number; // evaluation windows before termination risk
  risk: "low" | "medium" | "high";
  image: string;
  description: string;
}

export interface SponsorState {
  sponsorId: string;
  progress: number; // objective progress counter
  required: number; // total required
  deadlineRound: number; // evaluation deadline (0 = none)
  patience: number;
  active: boolean;
  totalPaid: number;
}

// ---------------------------------------------------------------------------
// Tracks
// ---------------------------------------------------------------------------

export interface TrackCharacteristics {
  highSpeed: number;
  lowSpeed: number;
  flowing: number;
  technical: number;
  downforce: number;
  straightLine: number;
  mechanicalGrip: number;
  tireStress: number;
  overtaking: number;
  weatherRisk: number;
  reliabilityRisk: number;
  driverImportance: number;
  engineImportance: number;
}

export interface Track {
  id: string;
  name: string;
  grandPrix: string;
  country: string;
  season: SeasonId;
  laps: number;
  lengthKm: number;
  sprint: boolean;
  characteristics: TrackCharacteristics;
  image: string; // circuit layout
  heroImage: string; // race background
}

// ---------------------------------------------------------------------------
// Races
// ---------------------------------------------------------------------------

export interface RaceEntry {
  driverId: string;
  teamId: string;
  gridPosition: number;
  position: number | null; // null => unclassified DNF
  points: number;
  dnf: boolean;
  dnfReason?: string;
  fastestLap?: boolean;
  bestLapSeconds?: number; // fastest lap time of the race (set on the holder)
  time: number; // seconds behind winner (or DNF time)
}

export type RaceEventType = "mechanical" | "driver" | "strategy" | "external" | "business" | "info";
export type RaceEventSeverity = "info" | "warning" | "danger" | "success";

export interface RaceEvent {
  lap: number;
  type: RaceEventType;
  text: string;
  textEnjoyer: string;
  actor?: string; // driverId or teamId
  severity: RaceEventSeverity;
}

export interface RaceWeekendResult {
  round: number;
  trackId: string;
  weather: WeatherId;
  forecast: {
    rainProbability: number;
    confidence: "low" | "medium" | "high";
    window?: string;
  };
  qualifying: RaceEntry[];
  race: RaceEntry[];
  sprint?: RaceEntry[];
  events: RaceEvent[];
  /** Per-lap running order — index 0 is the starting grid, then one entry per completed lap. */
  lapOrder?: string[][];
  playerEntries: { driverId: string; position: number; points: number; dnf: boolean }[];
  breakdown: { car: number; driver: number; strategy: number; reliability: number; luck: number };
  chaos: number;
  expected: { min: number; max: number };
}

// ---------------------------------------------------------------------------
// Championship
// ---------------------------------------------------------------------------

export interface DriverStanding {
  driverId: string;
  teamId: string;
  points: number;
  wins: number;
  podiums: number;
  dnfs: number;
  best: number;
}

export interface ConstructorStanding {
  teamId: string;
  points: number;
  wins: number;
  podiums: number;
  dnfs: number;
}

// ---------------------------------------------------------------------------
// Team / game state
// ---------------------------------------------------------------------------

export type Philosophy = "performance" | "reliability" | "balanced" | "gamble";
export type TeamOrders = "equal" | "priority1" | "priority2";
export type UpgradeTarget =
  | "aero"
  | "chassis"
  | "reliability"
  | "gearbox"
  | "pitCrew"
  | "driverTraining";

export interface ComponentState {
  condition: number; // %
  age: number; // races used
  replacements: number;
  /** True when the part failed outright (busted/crash damage) and must be replaced before the next GP. */
  damaged?: boolean;
  /** Short human note about how/where it broke, shown in alerts. */
  damagedNote?: string;
}

/**
 * Era-specific power-unit parts tracked alongside the shared engine/gearbox.
 * 2013 (V8 era): kers · 2025 (turbo-hybrid era): turbo, mguK, mguH,
 * energyStore, controlElectronics, exhaust.
 */
export type EraComponentId =
  | "kers"
  | "turbo"
  | "mguK"
  | "mguH"
  | "energyStore"
  | "controlElectronics"
  | "exhaust";

/** Anything in the garage that can be swapped for a fresh unit. */
export type ComponentKey = "engine" | "gearbox" | EraComponentId;

/** The two car seats — every driver owns their own hardware since v0.10. */
export type Seat = "car1" | "car2";

/** One car's full hardware set: engine, gearbox and era power-unit parts. */
export interface CarParts {
  engine: ComponentState;
  gearbox: ComponentState;
  powerUnit: Partial<Record<EraComponentId, ComponentState>>;
}

/** Which car(s) a development project upgrades. Single-car projects cost ~60%. */
export type DevSeat = Seat | "both";

export interface UpgradeProject {
  id: string;
  name: string;
  cost: number;
  remainingRaces: number;
  totalRaces: number;
  target: UpgradeTarget;
  effect: number;
  driverId?: string;
  /** Which car this project upgrades — undefined = both (legacy projects). */
  seat?: DevSeat;
  risk: number; // % underperformance chance
  underperformed?: boolean;
}

/** Per-car stat bonuses from seat-targeted development projects. */
export type SeatBonus = Partial<{
  aero: number;
  chassis: number;
  reliability: number;
  power: number;
  gearboxPerf: number;
}>;

/** A training programme started during a race weekend (round = weekend index). */
export interface TrainingLog {
  id: string;
  round: number;
}

/** Owner → driver management actions (speech, bonus, fine, rant) for cooldowns. */
export interface MgmtLog {
  driverId: string; // "*team*" for whole-team activities
  action: "speech" | "bonus" | "fine" | "rant" | "teambuilding" | "trainingcamp" | "psych";
  round: number;
}

export type TransactionCategory =
  | "sponsor"
  | "salary"
  | "supplier"
  | "staff"
  | "operations"
  | "prize"
  | "development"
  | "testing"
  | "other";

export interface FinancialTransaction {
  round: number;
  label: string;
  amount: number; // +income / -expense $M
  category: TransactionCategory;
  detail?: string; // human-readable breakdown/formula, shown in FinanceTab ⓘ
}

/** The player's in-game identity — used for callouts ("Ms. Clark") and the report. */
export interface OwnerProfile {
  /** Full display name; required. */
  name: string;
  /** How the paddock addresses the owner, e.g. "Ms. Clark", "Sir", "Boss". */
  callout: string;
  /** Optional data-URL portrait, only set when the user uploads one. */
  image?: string;
}

export interface TeamState {
  constructorId: string;
  owner?: OwnerProfile;
  philosophy: Philosophy;
  teamOrders: TeamOrders;
  driver1Id: string;
  driver2Id: string;
  engineerIds: string[];
  mechanicIds: string[];
  engineId: string;
  gearboxId: string;
  techPackageId: string;
  sponsorIds: string[];
  cash: number;
  reputation: number;
  /** Fractional reputation accumulator — small weekly deltas land as integer rep. */
  repAcc?: number;
  /** Paddock trust in the owner, 0-100 — moves with every decision (spec §24). */
  trust?: number;
  startCash: number;
  car: {
    aero: number;
    chassis: number;
    reliability: number;
    tireBehavior: number;
    power: number;
    gearboxPerf: number;
  };
  components: {
    /** @deprecated pre-v0.10 shared hardware — migrated into `cars` on first touch. */
    engine?: ComponentState;
    gearbox?: ComponentState;
    /**
     * @deprecated Era-specific shared power-unit parts. Optional so pre-era
     * saves keep loading — parts are initialised lazily on the next race.
     */
    powerUnit?: Partial<Record<EraComponentId, ComponentState>>;
    /** Per-car hardware since v0.10: one full set per driver seat. */
    cars?: Record<Seat, CarParts>;
  };
  upgrades: UpgradeProject[];
  /** Accumulated stat gains from single-car development projects. */
  seatUpgrades?: Record<Seat, SeatBonus>;
  drivers: DriverState[];
  sponsors: SponsorState[];
  /** Training programmes (pit crew / driver) already run, keyed by round — one per weekend each. */
  trainings?: TrainingLog[];
  /** Consecutive pointless weekends — bad streaks amplify morale/confidence drops. */
  slump?: number;
  /**
   * A star driver's ultimatum: "pay me a bonus and I promise a podium within
   * N races." Accepted challenges are paid up front; failing the promise
   * frustrates the driver and costs trust.
   */
  driverChallenge?: DriverChallenge;
  /** Grid places lost at the next GP for changing engine (+10) or gearbox (+5). */
  gridPenalty?: number;
  /** Per-car grid penalties since v0.10 (single-car part changes). */
  gridPenaltyBySeat?: Record<Seat, number>;
  pitCrew: number; // 0-100 pit crew level (upgradeable)
  history: FinancialTransaction[];
  mgmt?: MgmtLog[]; // owner interventions per driver (cooldown tracking)
  points: number;
  wins: number;
  podiums: number;
  dnfs: number;
  lastRoundCompleted: number;
}

/** Driver → owner ultimatum (spec §22b): cash for a promised result. */
export interface DriverChallenge {
  driverId: string;
  /** Up-front bonus in $M the owner pays on acceptance. */
  amount: number;
  /** Races remaining to deliver the promised podium. */
  roundsLeft: number;
  accepted: boolean;
}

export type TestType = "performance" | "reliability" | "tire" | "driver";

export interface TestReport {
  type: TestType;
  label: string;
  labelEnjoyer: string;
  value: string;
  confidence: number;
  insight: string;
  insightEnjoyer: string;
  cost: number;
}

export type NewsPriority = "urgent" | "warning" | "info";

export interface NewsItem {
  id: string;
  round: number;
  tag: "breaking" | "sponsor" | "driver" | "staff" | "rival" | "supplier" | "info";
  title: string;
  body: string;
  bodyEnjoyer: string;
  options?: { label: string; action: string; payload?: string }[];
  resolved?: boolean;
  priority?: NewsPriority; // urgent = red alert, warning = amber, info = default
  kind?: "chat"; // driver → owner conversation (lives in Team Management)
}

export interface SimulationState {
  version: number;
  seed: string;
  season: SeasonId;
  difficulty: DifficultyId;
  gameLength: GameLengthId;
  phase: Phase;
  team: TeamState | null;
  calendar: Track[];
  round: number; // 0-based index of next round
  standingsDrivers: DriverStanding[];
  standingsConstructors: ConstructorStanding[];
  lineups: Record<string, string[]>; // teamId → seated driver ids (all teams, incl. player)
  unattachedDrivers: string[]; // contracted but not seated (e.g. reserved 3rd drivers)
  lastWeekend: RaceWeekendResult | null;
  news: NewsItem[];
  testing: TestReport[];
  completedRounds: number;
  bankrupt: boolean;
  lastSwap?: DriverSwapLog | null; // undo context for the driver market
  createdAt: number;
  updatedAt: number;
}

export interface DriverSwapLog {
  slot: 1 | 2;
  previousDriverId: string;
  previousState: DriverState | null; // null = seat was empty before
  newDriverId: string;
  newState: DriverState;
  fee: number; // $M paid for the swap
  round: number; // next round number when the swap happened
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  cashMultiplier: number;
  costMultiplier: number;
  failureMultiplier: number;
  sponsorMultiplier: number;
  /** How many concurrent sponsor contracts the team may hold. */
  sponsorSlots: number;
  infoLevel: "high" | "normal" | "low";
  bankruptcyGrace: boolean;
  moraleMultiplier: number;
  description: string;
  enjoyer: string;
}

export interface GameLengthConfig {
  id: GameLengthId;
  label: string;
  detail: number; // 0..3
  description: string;
}

export interface SeasonConfig {
  id: SeasonId;
  label: string;
  year: string;
  points: number[]; // P1..P10
  sprintPoints: number[] | null;
  fastestLapPoint: boolean;
  tagline: string;
  sprintLabel: string;
}
