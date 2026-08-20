// ============================================================================
// F1 Owner — Constructors, engines, gearboxes, technical packages
// Historical 2013 + 2025 rosters (spec §12, §13, §31-34, §73).
// Values are calibrated to historical performance, not real measurements.
// ============================================================================

import type { Constructor, EngineSpec, GearboxSpec, TechPackageSpec } from "@/simulation/types";
import { assetPaths } from "./assets";

export const CONSTRUCTORS: Constructor[] = [
  // ------------------------------------------------------------------ 2013
  {
    id: "redbull", name: "Red Bull", fullName: "Red Bull Racing", season: 2013,
    nationality: "Austria", dna: { chassis: 94, aero: 97, factory: 95, engineering: 92, reliability: 91, developmentCapacity: 94, budgetEfficiency: 80, reputation: 96, sponsorAppeal: 95 },
    allowedEngines: ["renault13-works"], startCash: 140, operatingCost: 6.5,
    image: assetPaths.constructors.redbull, carImage: assetPaths.cars.redbull13,
    colors: { primary: "#1e1e28", secondary: "#1465D6" },
  },
  {
    id: "ferrari", name: "Ferrari", fullName: "Scuderia Ferrari", season: 2013,
    nationality: "Italy", dna: { chassis: 91, aero: 90, factory: 94, engineering: 88, reliability: 90, developmentCapacity: 88, budgetEfficiency: 70, reputation: 95, sponsorAppeal: 96 },
    allowedEngines: ["ferrari13-works"], startCash: 135, operatingCost: 6.4,
    image: assetPaths.constructors.ferrari, carImage: assetPaths.cars.ferrari13,
    colors: { primary: "#D40000", secondary: "#1e1e28" },
  },
  {
    id: "mercedes", name: "Mercedes", fullName: "Mercedes AMG Petronas", season: 2013,
    nationality: "Germany", dna: { chassis: 90, aero: 91, factory: 92, engineering: 90, reliability: 92, developmentCapacity: 90, budgetEfficiency: 78, reputation: 92, sponsorAppeal: 94 },
    allowedEngines: ["mercedes13-works"], startCash: 130, operatingCost: 6.2,
    image: assetPaths.constructors.mercedes, carImage: assetPaths.cars.mercedes13,
    colors: { primary: "#00A19B", secondary: "#1e1e28" },
  },
  {
    id: "lotus", name: "Lotus", fullName: "Lotus F1 Team", season: 2013,
    nationality: "United Kingdom", dna: { chassis: 87, aero: 89, factory: 80, engineering: 84, reliability: 83, developmentCapacity: 88, budgetEfficiency: 90, reputation: 75, sponsorAppeal: 68 },
    allowedEngines: ["renault13-customer"], startCash: 95, operatingCost: 4.2,
    image: assetPaths.constructors.lotus, carImage: assetPaths.cars.lotus,
    colors: { primary: "#C4A000", secondary: "#1e1e28" },
  },
  {
    id: "mclaren", name: "McLaren", fullName: "McLaren Mercedes", season: 2013,
    nationality: "United Kingdom", dna: { chassis: 89, aero: 88, factory: 93, engineering: 87, reliability: 85, developmentCapacity: 86, budgetEfficiency: 75, reputation: 88, sponsorAppeal: 92 },
    allowedEngines: ["mercedes13-customer"], startCash: 120, operatingCost: 5.6,
    image: assetPaths.constructors.mclaren, carImage: assetPaths.cars.mclaren13,
    colors: { primary: "#FF8000", secondary: "#1e1e28" },
  },
  {
    id: "forceindia", name: "Force India", fullName: "Sahara Force India F1 Team", season: 2013,
    nationality: "India", dna: { chassis: 82, aero: 80, factory: 70, engineering: 76, reliability: 84, developmentCapacity: 82, budgetEfficiency: 92, reputation: 62, sponsorAppeal: 60 },
    allowedEngines: ["mercedes13-customer"], startCash: 85, operatingCost: 3.8,
    image: assetPaths.constructors.forceindia, carImage: assetPaths.cars.forceindia,
    colors: { primary: "#FF5F00", secondary: "#1e1e28" },
  },
  {
    id: "sauber", name: "Sauber", fullName: "Sauber F1 Team", season: 2013,
    nationality: "Switzerland", dna: { chassis: 80, aero: 78, factory: 72, engineering: 75, reliability: 78, developmentCapacity: 80, budgetEfficiency: 88, reputation: 58, sponsorAppeal: 55 },
    allowedEngines: ["ferrari13-customer"], startCash: 82, operatingCost: 3.7,
    image: assetPaths.constructors.sauber, carImage: assetPaths.cars.sauber13,
    colors: { primary: "#1e1e28", secondary: "#96C643" },
  },
  {
    id: "tororosso", name: "Toro Rosso", fullName: "Scuderia Toro Rosso", season: 2013,
    nationality: "Italy", dna: { chassis: 78, aero: 76, factory: 75, engineering: 72, reliability: 75, developmentCapacity: 84, budgetEfficiency: 86, reputation: 50, sponsorAppeal: 45 },
    allowedEngines: ["ferrari13-customer"], startCash: 78, operatingCost: 3.6,
    image: assetPaths.constructors.tororosso, carImage: assetPaths.cars.tororosso,
    colors: { primary: "#1e1e28", secondary: "#003D7A" },
  },
  {
    id: "williams", name: "Williams", fullName: "Williams F1 Team", season: 2013,
    nationality: "United Kingdom", dna: { chassis: 82, aero: 80, factory: 78, engineering: 78, reliability: 76, developmentCapacity: 83, budgetEfficiency: 84, reputation: 72, sponsorAppeal: 65 },
    allowedEngines: ["renault13-customer"], startCash: 90, operatingCost: 4.4,
    image: assetPaths.constructors.williams, carImage: assetPaths.cars.williams13,
    colors: { primary: "#00A0DE", secondary: "#1e1e28" },
  },
  {
    id: "caterham", name: "Caterham", fullName: "Caterham F1 Team", season: 2013,
    nationality: "Malaysia", dna: { chassis: 68, aero: 62, factory: 60, engineering: 62, reliability: 68, developmentCapacity: 78, budgetEfficiency: 95, reputation: 25, sponsorAppeal: 20 },
    allowedEngines: ["renault13-customer"], startCash: 70, operatingCost: 2.8,
    image: assetPaths.constructors.caterham, carImage: assetPaths.cars.caterham,
    colors: { primary: "#046A38", secondary: "#1e1e28" },
  },
  {
    id: "marussia", name: "Marussia", fullName: "Marussia F1 Team", season: 2013,
    nationality: "Russia", dna: { chassis: 66, aero: 60, factory: 58, engineering: 60, reliability: 70, developmentCapacity: 80, budgetEfficiency: 96, reputation: 21, sponsorAppeal: 15 },
    allowedEngines: ["ferrari13-customer"], startCash: 68, operatingCost: 2.6,
    image: assetPaths.constructors.marussia, carImage: assetPaths.cars.marussia,
    colors: { primary: "#1e1e28", secondary: "#D40000" },
  },

  // ------------------------------------------------------------------ 2025
  {
    id: "mclaren", name: "McLaren", fullName: "McLaren Formula 1 Team", season: 2025,
    nationality: "United Kingdom", dna: { chassis: 95, aero: 94, factory: 93, engineering: 94, reliability: 90, developmentCapacity: 93, budgetEfficiency: 85, reputation: 93, sponsorAppeal: 95 },
    allowedEngines: ["mercedes25-works"], startCash: 145, operatingCost: 6.2,
    image: assetPaths.constructors.mclaren, carImage: assetPaths.cars.mclaren,
    colors: { primary: "#FF8000", secondary: "#1e1e28" },
  },
  {
    id: "ferrari", name: "Ferrari", fullName: "Scuderia Ferrari HP", season: 2025,
    nationality: "Italy", dna: { chassis: 93, aero: 93, factory: 95, engineering: 92, reliability: 88, developmentCapacity: 91, budgetEfficiency: 72, reputation: 94, sponsorAppeal: 96 },
    allowedEngines: ["ferrari25-works"], startCash: 145, operatingCost: 6.5,
    image: assetPaths.constructors.ferrari, carImage: assetPaths.cars.ferrari,
    colors: { primary: "#D40000", secondary: "#1e1e28" },
  },
  {
    id: "redbull", name: "Red Bull", fullName: "Red Bull Racing", season: 2025,
    nationality: "Austria", dna: { chassis: 94, aero: 95, factory: 94, engineering: 92, reliability: 89, developmentCapacity: 92, budgetEfficiency: 82, reputation: 95, sponsorAppeal: 94 },
    allowedEngines: ["honda25-works"], startCash: 140, operatingCost: 6.4,
    image: assetPaths.constructors.redbull, carImage: assetPaths.cars.redbull,
    colors: { primary: "#1e1e28", secondary: "#1465D6" },
  },
  {
    id: "mercedes", name: "Mercedes", fullName: "Mercedes-AMG Petronas", season: 2025,
    nationality: "Germany", dna: { chassis: 91, aero: 90, factory: 92, engineering: 90, reliability: 91, developmentCapacity: 90, budgetEfficiency: 78, reputation: 92, sponsorAppeal: 95 },
    allowedEngines: ["mercedes25-works"], startCash: 135, operatingCost: 6.3,
    image: assetPaths.constructors.mercedes, carImage: assetPaths.cars.mercedes,
    colors: { primary: "#00A19B", secondary: "#1e1e28" },
  },
  {
    id: "astonmartin", name: "Aston Martin", fullName: "Aston Martin Aramco", season: 2025,
    nationality: "United Kingdom", dna: { chassis: 88, aero: 89, factory: 88, engineering: 87, reliability: 87, developmentCapacity: 88, budgetEfficiency: 80, reputation: 82, sponsorAppeal: 90 },
    allowedEngines: ["mercedes25-customer"], startCash: 115, operatingCost: 5.0,
    image: assetPaths.constructors.astonmartin, carImage: assetPaths.cars.astonmartin,
    colors: { primary: "#00594F", secondary: "#0A3D2F" },
  },
  {
    id: "alpine", name: "Alpine", fullName: "BWT Alpine F1 Team", season: 2025,
    nationality: "France", dna: { chassis: 86, aero: 85, factory: 82, engineering: 84, reliability: 85, developmentCapacity: 86, budgetEfficiency: 83, reputation: 72, sponsorAppeal: 75 },
    allowedEngines: ["renault25-works"], startCash: 100, operatingCost: 4.4,
    image: assetPaths.constructors.alpine, carImage: assetPaths.cars.alpine,
    colors: { primary: "#0090FF", secondary: "#1e1e28" },
  },
  {
    id: "williams", name: "Williams", fullName: "Atlassian Williams Racing", season: 2025,
    nationality: "United Kingdom", dna: { chassis: 85, aero: 83, factory: 80, engineering: 83, reliability: 86, developmentCapacity: 85, budgetEfficiency: 86, reputation: 72, sponsorAppeal: 78 },
    allowedEngines: ["mercedes25-customer"], startCash: 95, operatingCost: 4.2,
    image: assetPaths.constructors.williams, carImage: assetPaths.cars.williams,
    colors: { primary: "#00A0DE", secondary: "#1e1e28" },
  },
  {
    id: "haas", name: "Haas", fullName: "MoneyGram Haas F1 Team", season: 2025,
    nationality: "United States", dna: { chassis: 82, aero: 81, factory: 74, engineering: 80, reliability: 84, developmentCapacity: 82, budgetEfficiency: 92, reputation: 60, sponsorAppeal: 66 },
    allowedEngines: ["ferrari25-customer"], startCash: 88, operatingCost: 3.8,
    image: assetPaths.constructors.haas, carImage: assetPaths.cars.haas,
    colors: { primary: "#B6BABF", secondary: "#D40000" },
  },
  {
    id: "racingbulls", name: "Racing Bulls", fullName: "Visa Cash App Racing Bulls", season: 2025,
    nationality: "Italy", dna: { chassis: 82, aero: 80, factory: 76, engineering: 79, reliability: 83, developmentCapacity: 84, budgetEfficiency: 88, reputation: 55, sponsorAppeal: 62 },
    allowedEngines: ["honda25-customer"], startCash: 85, operatingCost: 3.7,
    image: assetPaths.constructors.racingbulls, carImage: assetPaths.cars.racingbulls,
    colors: { primary: "#2B4C6F", secondary: "#1e1e28" },
  },
  {
    id: "sauber", name: "Kick Sauber", fullName: "Stake F1 Team Kick Sauber", season: 2025,
    nationality: "Switzerland", dna: { chassis: 80, aero: 78, factory: 78, engineering: 78, reliability: 82, developmentCapacity: 82, budgetEfficiency: 90, reputation: 48, sponsorAppeal: 58 },
    allowedEngines: ["ferrari25-customer"], startCash: 82, operatingCost: 3.6,
    image: assetPaths.constructors.sauber, carImage: assetPaths.cars.sauber,
    colors: { primary: "#52E252", secondary: "#1e1e28" },
  },
];

export const ENGINES: EngineSpec[] = [
  // ---------------- 2013 V8 era
  {
    id: "renault13-works", name: "Renault RS27-2013", supplier: "Renault", season: 2013, status: "works",
    power: 91, reliability: 86, efficiency: 82, cost: 16, image: assetPaths.engines.renault13,
    description: "Twin-cylinder air inlet, 18,000 rpm screaming V8. Occasionally fragile.",
  },
  {
    id: "renault13-customer", name: "Renault RS27-2013 (Customer)", supplier: "Renault", season: 2013, status: "customer",
    power: 88, reliability: 84, efficiency: 80, cost: 8, image: assetPaths.engines.renault13,
    description: "Previous-spec Renault. Cheaper, slightly softer, still noisy.",
  },
  {
    id: "ferrari13-works", name: "Ferrari 056", supplier: "Ferrari", season: 2013, status: "works",
    power: 92, reliability: 88, efficiency: 84, cost: 17, image: assetPaths.engines.ferrari13,
    description: "The strongest V8 of the field on outright power.",
  },
  {
    id: "ferrari13-customer", name: "Ferrari 056 (Customer)", supplier: "Ferrari", season: 2013, status: "customer",
    power: 89, reliability: 86, efficiency: 82, cost: 9, image: assetPaths.engines.ferrari13,
    description: "Maranello's engine with a year-old map and a loyal discount.",
  },
  {
    id: "mercedes13-works", name: "Mercedes FO108F", supplier: "Mercedes-Benz", season: 2013, status: "works",
    power: 91, reliability: 91, efficiency: 87, cost: 17, image: assetPaths.engines.mercedes13,
    description: "Smooth, efficient, dependable — with KERS that actually works.",
  },
  {
    id: "mercedes13-customer", name: "Mercedes FO108F (Customer)", supplier: "Mercedes-Benz", season: 2013, status: "customer",
    power: 89, reliability: 89, efficiency: 85, cost: 9, image: assetPaths.engines.mercedes13,
    description: "Brackley's finest at a customer price. The best value V8.",
  },

  // ---------------- 2025 hybrid era
  {
    id: "ferrari25-works", name: "Ferrari ERS-25", supplier: "Ferrari", season: 2025, status: "works",
    power: 94, reliability: 89, efficiency: 88, cost: 20, image: assetPaths.engines.ferrari25,
    description: "Maximum hybrid deployment. Fierce on straights, thirsty on energy.",
  },
  {
    id: "ferrari25-customer", name: "Ferrari ERS-25 (Customer)", supplier: "Ferrari", season: 2025, status: "customer",
    power: 91, reliability: 87, efficiency: 86, cost: 11, image: assetPaths.engines.ferrari25,
    description: "Maranello's hardware with a customer energy strategy.",
  },
  {
    id: "mercedes25-works", name: "Mercedes PU-25", supplier: "Mercedes-Benz", season: 2025, status: "works",
    power: 92, reliability: 93, efficiency: 92, cost: 21, image: assetPaths.engines.mercedes25,
    description: "The benchmark power unit: superb energy recovery and bulletproof internals.",
  },
  {
    id: "mercedes25-customer", name: "Mercedes PU-25 (Customer)", supplier: "Mercedes-Benz", season: 2025, status: "customer",
    power: 90, reliability: 91, efficiency: 90, cost: 12, image: assetPaths.engines.mercedes25,
    description: "Same hardware, slightly conservative mapping.",
  },
  {
    id: "honda25-works", name: "Honda RBPT RBPTH002", supplier: "Red Bull Powertrains", season: 2025, status: "works",
    power: 93, reliability: 88, efficiency: 90, cost: 19, image: assetPaths.engines.honda25,
    description: "Aggressive combustion + strong electrical recovery. Latest evolutions still bedding in.",
  },
  {
    id: "honda25-customer", name: "Honda RBPT RBPTH002 (Customer)", supplier: "Red Bull Powertrains", season: 2025, status: "customer",
    power: 90, reliability: 86, efficiency: 88, cost: 11, image: assetPaths.engines.honda25,
    description: "The sister-car spec of the Red Bull power unit.",
  },
  {
    id: "renault25-works", name: "Renault E-Tech 2025", supplier: "Renault", season: 2025, status: "works",
    power: 88, reliability: 92, efficiency: 82, cost: 16, image: assetPaths.engines.renault25,
    description: "Last season under the Viry badge. Reliable, slightly down on peak power.",
  },
];

export const GEARBOXES: GearboxSpec[] = [
  {
    id: "gb-performance", name: "Performance Gearbox", season: 2013,
    performance: 94, reliability: 84, cost: 7, image: assetPaths.engines.gbPerformance,
    description: "Ultra-short ratios for maximum acceleration. Fragile if overused.",
  },
  {
    id: "gb-balanced", name: "Balanced Gearbox", season: 2013,
    performance: 87, reliability: 91, cost: 4, image: assetPaths.engines.gbBalanced,
    description: "No drama, decent shift speed, good throughout life.",
  },
  {
    id: "gb-reliability", name: "Reliability Gearbox", season: 2013,
    performance: 80, reliability: 97, cost: 3, image: assetPaths.engines.gbReliability,
    description: "Built like a tractor. Slower shifts, almost unbreakable.",
  },
  {
    id: "gb-performance-25", name: "Performance Gearbox", season: 2025,
    performance: 95, reliability: 83, cost: 8, image: assetPaths.engines.gbPerformance,
    description: "Instant hydraulic shifts tuned for the hybrid era's torque.",
  },
  {
    id: "gb-balanced-25", name: "Balanced Gearbox", season: 2025,
    performance: 88, reliability: 92, cost: 5, image: assetPaths.engines.gbBalanced,
    description: "Reliable shifts at competitive speed.",
  },
  {
    id: "gb-reliability-25", name: "Reliability Gearbox", season: 2025,
    performance: 81, reliability: 98, cost: 4, image: assetPaths.engines.gbReliability,
    description: "Engineers sleep soundly. The gearbox lasts a whole 'season of abuse'.",
  },
];

export const TECH_PACKAGES: TechPackageSpec[] = [
  {
    id: "tech-basic", name: "Standard Technical Package", season: 2013,
    aero: 75, chassis: 75, reliability: 77, tireBehavior: 71, cost: 2,
    image: assetPaths.engines.techBasic,
    description: "The baseline car. Honest everywhere, spectacular nowhere.",
  },
  {
    id: "tech-race", name: "Race Technical Package", season: 2013,
    aero: 87, chassis: 85, reliability: 86, tireBehavior: 84, cost: 6,
    image: assetPaths.engines.techRace,
    description: "A proper aero program, better balance and kinder tire wear.",
  },
  {
    id: "tech-elite", name: "Elite Technical Package", season: 2013,
    aero: 93, chassis: 91, reliability: 92, tireBehavior: 91, cost: 11,
    image: assetPaths.engines.techElite,
    description: "Wind-tunnel satellites, obnoxious cleanliness, championship DNA.",
  },
  {
    id: "tech-basic-25", name: "Standard Technical Package", season: 2025,
    aero: 76, chassis: 76, reliability: 78, tireBehavior: 72, cost: 3,
    image: assetPaths.engines.techBasic,
    description: "Ground-effect basics. Fine for measuring, poor for miracles.",
  },
  {
    id: "tech-race-25", name: "Race Technical Package", season: 2025,
    aero: 88, chassis: 86, reliability: 87, tireBehavior: 85, cost: 8,
    image: assetPaths.engines.techRace,
    description: "Modern floor + front wing program with solid correlation.",
  },
  {
    id: "tech-elite-25", name: "Elite Technical Package", season: 2025,
    aero: 94, chassis: 92, reliability: 93, tireBehavior: 92, cost: 14,
    image: assetPaths.engines.techElite,
    description: "The state of the art: millions of CFD hours and a car that follows you home.",
  },
];

export const constructorsBySeason = (season: number) =>
  CONSTRUCTORS.filter((c) => c.season === season);
export const enginesForSeason = (season: number) => ENGINES.filter((e) => e.season === season);
export const gearboxesForSeason = (season: number) => GEARBOXES.filter((g) => g.season === season);
export const techPackagesForSeason = (season: number) => TECH_PACKAGES.filter((t) => t.season === season);