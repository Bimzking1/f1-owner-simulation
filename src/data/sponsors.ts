// ============================================================================
// F1 Owner — Sponsors (spec §46-49). Real-world grid sponsorship pool:
// names, categories and objectives sourced from prompt-brainstorm/f1_sponsor_pool.csv.
// ============================================================================

import type { SeasonId, SponsorSpec } from "@/simulation/types";
import { assetPaths } from "./assets";

export const SPONSORS: SponsorSpec[] = [
  // ---- 2013 era
  {
    id: "sponsor-petronas13", name: "Petronas", category: "Energy / Technical", tier: "title", season: 2013,
    signingBonus: 7, racePayment: 0.58,
    objective: "wccPosition", objectiveText: "Finish the season in the top 6 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 6 teams.",
    bonus: 8, patience: 5, risk: "medium", image: assetPaths.sponsors.petronas,
    description: "Malaysian energy giant — a long-time title partner with technology instincts.",
  },
  {
    id: "sponsor-shell13", name: "Shell", category: "Energy / Fuel / Lubricants", tier: "title", season: 2013,
    signingBonus: 7, racePayment: 0.5,
    objective: "wccPosition", objectiveText: "Finish the season in the top 6 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 6 teams.",
    bonus: 8, patience: 5, risk: "medium", image: assetPaths.sponsors.shell,
    description: "Fuel and lubricants partner — reliability in a can, credibility on the nose.",
  },
  {
    id: "sponsor-pirelli13", name: "Pirelli", category: "Tires / Technical", tier: "major", season: 2013,
    signingBonus: 5, racePayment: 0.38,
    objective: "top10NextRaces", objectiveText: "Keep average tire degradation under control and finish in the top 10 in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Hit the top 10 in 4 of the next 6 races.",
    bonus: 8, patience: 5, risk: "medium", image: assetPaths.sponsors.pirelli,
    description: "The sport's tire supplier — wants its rubber to keep looking good on your car.",
  },
  {
    id: "sponsor-santander13", name: "Santander", category: "Banking / Finance", tier: "major", season: 2013,
    signingBonus: 4, racePayment: 0.3,
    objective: "pointsNextRaces", objectiveText: "Score championship points in 3 of the next 5 race weekends.",
    objectiveTextEnjoyer: "Bring home points in 3 of the next 5 races.",
    bonus: 6, patience: 5, risk: "low", image: assetPaths.sponsors.santander,
    description: "Conservative bankers with a long view. They like spreadsheets and podiums.",
  },
  {
    id: "sponsor-dhl13", name: "DHL", category: "Logistics", tier: "major", season: 2013,
    signingBonus: 4, racePayment: 0.28,
    objective: "top10NextRaces", objectiveText: "Complete races reliably and finish in the top 10 in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Hit the top 10 in 4 of the next 6 races.",
    bonus: 5, patience: 4, risk: "medium", image: assetPaths.sponsors.dhl,
    description: "The logistics partner that ships F1 around the world — punctuality is everything.",
  },
  {
    id: "sponsor-microsoft13", name: "Microsoft", category: "Technology", tier: "major", season: 2013,
    signingBonus: 4, racePayment: 0.33,
    objective: "wccPosition", objectiveText: "Finish the season in the top 6 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 6 teams.",
    bonus: 8, patience: 5, risk: "medium", image: assetPaths.sponsors.microsoft,
    description: "Cloud and software partner — measures success in development output.",
  },
  {
    id: "sponsor-lenovo13", name: "Lenovo", category: "Technology", tier: "major", season: 2013,
    signingBonus: 5, racePayment: 0.38,
    objective: "wccPosition", objectiveText: "Finish the season in the top 6 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 6 teams.",
    bonus: 7, patience: 4, risk: "medium", image: assetPaths.sponsors.lenovo,
    description: "Hardware partner — likes development ratings and podium screenshots.",
  },
  {
    id: "sponsor-mastercard13", name: "Mastercard", category: "Finance / Payments", tier: "major", season: 2013,
    signingBonus: 4, racePayment: 0.33,
    objective: "top10NextRaces", objectiveText: "Finish in the top 10 in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Hit the top 10 in 4 of the next 6 races.",
    bonus: 8, patience: 5, risk: "low", image: assetPaths.sponsors.mastercard,
    description: "A payments giant that values visibility over volatility.",
  },
  {
    id: "sponsor-sap13", name: "SAP", category: "Enterprise Software", tier: "minor", season: 2013,
    signingBonus: 3, racePayment: 0.23,
    objective: "wccPosition", objectiveText: "Finish the season in the top 6 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 6 teams.",
    bonus: 5, patience: 4, risk: "medium", image: assetPaths.sponsors.sap,
    description: "Business software — wants the team story to look good in boardroom decks.",
  },
  {
    id: "sponsor-iwc13", name: "IWC Schaffhausen", category: "Luxury / Watch", tier: "minor", season: 2013,
    signingBonus: 2, racePayment: 0.18,
    objective: "top10NextRaces", objectiveText: "Finish in the top 10 in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Hit the top 10 in 4 of the next 6 races.",
    bonus: 4, patience: 5, risk: "low", image: assetPaths.sponsors.iwc,
    description: "Swiss watchmaking — precision branding without much drama.",
  },

  // ---- 2025 era
  {
    id: "sponsor-oracle25", name: "Oracle", category: "Technology / Cloud", tier: "title", season: 2025,
    signingBonus: 10, racePayment: 0.88,
    objective: "wccPosition", objectiveText: "Finish the season in the top 8 of the Constructors' Championship and score points in most races.",
    objectiveTextEnjoyer: "End the season inside the top 8 teams.",
    bonus: 10, patience: 4, risk: "high", image: assetPaths.sponsors.oracle,
    description: "Cloud and database heavyweight — F1's data backbone, with expectations to match.",
  },
  {
    id: "sponsor-hp25", name: "HP", category: "Technology", tier: "title", season: 2025,
    signingBonus: 9, racePayment: 0.88,
    objective: "podiumByRound", objectiveText: "Reach three podiums before Round 16.",
    objectiveTextEnjoyer: "Three podiums by round 16.",
    bonus: 12, patience: 3, risk: "high", image: assetPaths.sponsors.hp,
    description: "Printing innovation giant — generous, loud, and impatient for trophies.",
  },
  {
    id: "sponsor-aramco25", name: "Aramco", category: "Energy", tier: "major", season: 2025,
    signingBonus: 8, racePayment: 0.63,
    objective: "wccPosition", objectiveText: "Finish the season in the top 8 of the Constructors' Championship and score points in most races.",
    objectiveTextEnjoyer: "End the season inside the top 8 teams.",
    bonus: 9, patience: 4, risk: "medium", image: assetPaths.sponsors.aramco,
    description: "Saudi energy colossus — funds engineering excellence and expects results.",
  },
  {
    id: "sponsor-pepsico25", name: "PepsiCo", category: "Food / Beverage", tier: "major", season: 2025,
    signingBonus: 6, racePayment: 0.45,
    objective: "top10NextRaces", objectiveText: "Finish in the top 10 in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Hit the top 10 in 4 of the next 6 races.",
    bonus: 8, patience: 4, risk: "medium", image: assetPaths.sponsors.pepsico,
    description: "Snacks and soft drinks — every top-10 is a shelf placement.",
  },
  {
    id: "sponsor-tagheuer25", name: "TAG Heuer", category: "Luxury / Timekeeping", tier: "major", season: 2025,
    signingBonus: 5, racePayment: 0.35,
    objective: "podiumByRound", objectiveText: "Reach three podiums before Round 16.",
    objectiveTextEnjoyer: "Three podiums by round 16.",
    bonus: 6, patience: 4, risk: "medium", image: assetPaths.sponsors.tagheuer,
    description: "Swiss precision — measures time, and your pace.",
  },
  {
    id: "sponsor-cryptocom25", name: "Crypto.com", category: "Finance / Crypto", tier: "major", season: 2025,
    signingBonus: 6, racePayment: 0.55,
    objective: "wccPosition", objectiveText: "Finish the season in the top 8 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 8 teams.",
    bonus: 10, patience: 3, risk: "high", image: assetPaths.sponsors.cryptocom,
    description: "High volatility, high reward. They move as fast as the market.",
  },
  {
    id: "sponsor-aws25", name: "AWS", category: "Technology / Cloud / Data", tier: "major", season: 2025,
    signingBonus: 5, racePayment: 0.43,
    objective: "wccPosition", objectiveText: "Finish the season in the top 8 of the Constructors' Championship and score points in most races.",
    objectiveTextEnjoyer: "End the season inside the top 8 teams.",
    bonus: 9, patience: 4, risk: "high", image: assetPaths.sponsors.aws,
    description: "Amazon's cloud — powers race-day simulation, expects serious development.",
  },
  {
    id: "sponsor-crowdstrike25", name: "CrowdStrike", category: "Cybersecurity / Technology", tier: "minor", season: 2025,
    signingBonus: 3, racePayment: 0.25,
    objective: "wccPosition", objectiveText: "Finish the season in the top 8 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 8 teams.",
    bonus: 6, patience: 4, risk: "medium", image: assetPaths.sponsors.crowdstrike,
    description: "Cybersecurity specialist — hates reliability problems above all.",
  },
  {
    id: "sponsor-ibm25", name: "IBM", category: "Technology / Data", tier: "minor", season: 2025,
    signingBonus: 4, racePayment: 0.28,
    objective: "wccPosition", objectiveText: "Finish the season in the top 8 of the Constructors' Championship.",
    objectiveTextEnjoyer: "End the season inside the top 8 teams.",
    bonus: 7, patience: 4, risk: "medium", image: assetPaths.sponsors.ibm,
    description: "A century of data thinking — wants serious development and clean operations.",
  },
  {
    id: "sponsor-salesforce25", name: "Salesforce", category: "Technology / CRM", tier: "minor", season: 2025,
    signingBonus: 3, racePayment: 0.25,
    objective: "top10NextRaces", objectiveText: "Finish in the top 10 in 4 of the next 6 race weekends.",
    objectiveTextEnjoyer: "Hit the top 10 in 4 of the next 6 races.",
    bonus: 6, patience: 4, risk: "medium", image: assetPaths.sponsors.salesforce,
    description: "CRM giant — measures you in fans, finishes and follow-through.",
  },
];

export const sponsorsForSeason = (season: SeasonId) => SPONSORS.filter((s) => s.season === season);