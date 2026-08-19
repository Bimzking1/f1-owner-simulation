// ============================================================================
// F1 Owner — Session configuration (spec §8-11, §31-32, §53)
// Difficulty / game length / season rules / philosophies.
// ============================================================================

import type {
  DifficultyConfig,
  GameLengthConfig,
  SeasonConfig,
  Philosophy,
} from "@/simulation/types";

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "rookie",
    label: "Rookie",
    cashMultiplier: 1.5,
    costMultiplier: 0.8,
    failureMultiplier: 0.6,
    sponsorMultiplier: 0.7,
    infoLevel: "high",
    bankruptcyGrace: true,
    moraleMultiplier: 1.0,
    description:
      "Generous pocket money and forged screws. Mechanical failures are forgiving, sponsors are patient, and the bank will step in once before you go under.",
    enjoyer:
      "A gentle first season. You have more money, cheap parts and forgiving sponsors — a safety net if things go wrong.",
  },
  {
    id: "professional",
    label: "Professional",
    cashMultiplier: 1.0,
    costMultiplier: 1.0,
    failureMultiplier: 1.0,
    sponsorMultiplier: 1.0,
    infoLevel: "normal",
    bankruptcyGrace: false,
    moraleMultiplier: 1.0,
    description:
      "Recommended. Balanced economy, realistic costs and reliability. Your decisions decide the season.",
    enjoyer:
      "The proper F1 business sim experience. Fair prices, fair risks, fair consequences.",
  },
  {
    id: "expert",
    label: "Expert",
    cashMultiplier: 0.8,
    costMultiplier: 1.15,
    failureMultiplier: 1.3,
    sponsorMultiplier: 1.25,
    infoLevel: "low",
    bankruptcyGrace: false,
    moraleMultiplier: 1.15,
    description:
      "A tighter wallet, pricier development and stricter sponsors. Reliability bites harder and morale swings are stronger. Less information is revealed.",
    enjoyer:
      "A real test of budget discipline. Parts break, sponsors complain, and the report card is written in red ink.",
  },
  {
    id: "ruthless",
    label: "Ruthless",
    cashMultiplier: 0.6,
    costMultiplier: 1.3,
    failureMultiplier: 1.5,
    sponsorMultiplier: 1.5,
    infoLevel: "low",
    bankruptcyGrace: false,
    moraleMultiplier: 1.3,
    description:
      "Hardcore. Own the cheapest rooms at the motorhome. Severe reliability, strict sponsors, strong morale effects — bankruptcy is a real ending.",
    enjoyer:
      "The paddock's wolf mode. If you survive the season with money left, you're already a legend.",
  },
];

export const GAME_LENGTHS: GameLengthConfig[] = [
  {
    id: "short",
    label: "Short",
    detail: 0,
    description:
      "For casual players. Each GP is summarized: qualifying, result, major event, standings, finances.",
  },
  {
    id: "standard",
    label: "Standard",
    detail: 1,
    description:
      "Recommended. Each GP includes qualifying, race, events, weather, strategy, finances and standings.",
  },
  {
    id: "long",
    label: "Long",
    detail: 2,
    description:
      "More detail: race briefing, phases, tire strategy, weather changes, component wear, sponsor and morale notes.",
  },
  {
    id: "hardcore",
    label: "Hardcore",
    detail: 3,
    description:
      "Maximum simulation detail: practice, full qualifying, full event log, component and tire condition, technical analysis.",
  },
];

export const SEASONS: SeasonConfig[] = [
  {
    id: 2013,
    label: "2013",
    year: "SEASON 2013",
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    sprintPoints: null,
    fastestLapPoint: false,
    tagline: "V8 thunder. DRS. KERS. The last of the screamers.",
    sprintLabel: "",
  },
  {
    id: 2025,
    label: "2025",
    year: "SEASON 2025",
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    sprintPoints: [8, 7, 6, 5, 4, 3, 2, 1],
    fastestLapPoint: true,
    tagline: "Turbo-hybrid power. Six sprints. Twenty-four races.",
    sprintLabel: "Sprint weekend",
  },
];

export const PHILOSOPHIES: {
  id: Philosophy;
  label: string;
  pros: string[];
  cons: string[];
  description: string;
}[] = [
  {
    id: "performance",
    label: "Performance First",
    pros: ["Performance development", "Qualifying output"],
    cons: ["Lower reliability", "Higher costs"],
    description: "Chase lap time. The factory burns midnight oil and money.",
  },
  {
    id: "reliability",
    label: "Reliability First",
    pros: ["Reliability", "Component lifespan"],
    cons: ["Raw performance"],
    description: "Finish races. A car that always finishes quietly angers no one.",
  },
  {
    id: "balanced",
    label: "Balanced",
    pros: ["No major weakness"],
    cons: ["No major strength"],
    description: "Steady across every metric. Boring on paper, dangerous in the midfield.",
  },
  {
    id: "gamble",
    label: "Development Gamble",
    pros: ["Development speed", "Potential"],
    cons: ["Current performance", "Development risk"],
    description: "Design for the end of the season, pray for the beginning.",
  },
];