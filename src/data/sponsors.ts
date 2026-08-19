// ============================================================================
// F1 Owner — Sponsors (spec §46-49). Contracts with objectives + risk.
// ============================================================================

import type { SeasonId, SponsorSpec } from "@/simulation/types";
import { assetPaths } from "./assets";

export const SPONSORS: SponsorSpec[] = [
  // ---- 2013
  {
    id: "sponsor-lost-boy13", name: "Lost Boy Energy Drinks", tier: "title", season: 2013,
    signingBonus: 10, racePayment: 0.55,
    objective: "pointsNextRaces", objectiveText: "Score championship points in 3 of the next 5 race weekends.",
    objectiveTextEnjoyer: "Bring home points in 3 of the next 5 races.",
    bonus: 8, patience: 4, risk: "medium", image: assetPaths.sponsors.title,
    description: "A disruptive energy drink brand betting on your underdog story.",
  },
  {
    id: "sponsor-vantage13", name: "Vantage Finance", tier: "title", season: 2013,
    signingBonus: 8, racePayment: 0.45,
    objective: "wccPosition", objectiveText: "Finish the season in the top 6 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 6 teams.",
    bonus: 12, patience: 5, risk: "low", image: assetPaths.sponsors.title,
    description: "Conservative bankers with a long view. They like spreadsheets and podiums.",
  },
  {
    id: "sponsor-halcyon13", name: "Halcyon Watches", tier: "major", season: 2013,
    signingBonus: 5, racePayment: 0.4,
    objective: "top10NextRaces", objectiveText: "Finish in the top 10 in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Feature in the top 10 in 4 of the next 6 races.",
    bonus: 6, patience: 3, risk: "low", image: assetPaths.sponsors.major,
    description: "Swiss timing. They want their brand consistently on screen.",
  },
  {
    id: "sponsor-volt13", name: "Voltbrand Energy", tier: "major", season: 2013,
    signingBonus: 6, racePayment: 0.5,
    objective: "podiumByRound", objectiveText: "Reach a podium before Round 14.",
    objectiveTextEnjoyer: "Claim a podium by round 14.",
    bonus: 10, patience: 4, risk: "high", image: assetPaths.sponsors.major,
    description: "Aggressive marketers. They pay big and expect sparks.",
  },
  {
    id: "sponsor-aero13", name: "AeroTech Components", tier: "minor", season: 2013,
    signingBonus: 2, racePayment: 0.25,
    objective: "pointsNextRaces", objectiveText: "Score points in 2 of the next 4 race weekends.",
    objectiveTextEnjoyer: "Score points twice in the next 4 races.",
    bonus: 3, patience: 3, risk: "low", image: assetPaths.sponsors.minor,
    description: "A small precision parts maker friendly to small teams.",
  },
  {
    id: "sponsor-prime13", name: "Prime Logistics", tier: "minor", season: 2013,
    signingBonus: 2, racePayment: 0.2,
    objective: "pointsConsecutive", objectiveText: "Score points in 2 consecutive races.",
    objectiveTextEnjoyer: "Score points in two races in a row.",
    bonus: 2.5, patience: 3, risk: "medium", image: assetPaths.sponsors.minor,
    description: "Freight specialists who measure results in repeat business.",
  },

  // ---- 2025
  {
    id: "sponsor-orbit25", name: "Orbit Digital", tier: "title", season: 2025,
    signingBonus: 14, racePayment: 0.8,
    objective: "podiumByRound", objectiveText: "Reach a podium before Round 16.",
    objectiveTextEnjoyer: "Make it onto the podium by round 16.",
    bonus: 15, patience: 4, risk: "high", image: assetPaths.sponsors.title,
    description: "An AI-cloud company that wants photos of champagne.",
  },
  {
    id: "sponsor-heritage25", name: "Heritage Bank", tier: "title", season: 2025,
    signingBonus: 10, racePayment: 0.6,
    objective: "wccPosition", objectiveText: "Finish the season in the top 8 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 8 teams.",
    bonus: 14, patience: 6, risk: "low", image: assetPaths.sponsors.title,
    description: "Old money, new car. Reliable paymaster if you keep qualifying clean.",
  },
  {
    id: "sponsor-velo25", name: "Velo Sporting Goods", tier: "major", season: 2025,
    signingBonus: 7, racePayment: 0.55,
    objective: "pointsNextRaces", objectiveText: "Score championship points in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Score points in four of the next six races.",
    bonus: 8, patience: 4, risk: "medium", image: assetPaths.sponsors.major,
    description: "Sportswear brand building around unpredictability.",
  },
  {
    id: "sponsor-neon25", name: "Neon Networks", tier: "major", season: 2025,
    signingBonus: 6, racePayment: 0.5,
    objective: "pointsConsecutive", objectiveText: "Score points in 3 consecutive races.",
    objectiveTextEnjoyer: "Score points three races in a row.",
    bonus: 7, patience: 3, risk: "high", image: assetPaths.sponsors.major,
    description: "Telecoms upstart. Flashy, impatient, delighted by streaks.",
  },
  {
    id: "sponsor-keystone25", name: "Keystone Minerals", tier: "minor", season: 2025,
    signingBonus: 3, racePayment: 0.3,
    objective: "top10NextRaces", objectiveText: "Finish in the top 10 in 5 of the next 8 race weekends.",
    objectiveTextEnjoyer: "Hit the top 10 in five of the next eight races.",
    bonus: 4, patience: 4, risk: "low", image: assetPaths.sponsors.minor,
    description: "Industrial sponsor that buys boardroom pride.",
  },
  {
    id: "sponsor-zing25", name: "Zing Beverages", tier: "minor", season: 2025,
    signingBonus: 3, racePayment: 0.35,
    objective: "beatRival", objectiveText: "Outscore your designated rival team over the next 5 race weekends.",
    objectiveTextEnjoyer: "Beat your rival team over the next five races.",
    bonus: 5, patience: 3, risk: "medium", image: assetPaths.sponsors.minor,
    description: "They picked a rivalry and want you to win it.",
  },
];

export const sponsorsForSeason = (season: SeasonId) => SPONSORS.filter((s) => s.season === season);