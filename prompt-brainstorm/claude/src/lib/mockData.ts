export const mockConstructors = [
  {
    id: "midfield-01",
    name: "Arden Racing",
    tier: "Midfield",
    overall: 76,
    infrastructure: 71,
    budget: 68,
    developmentPotential: 88,
    strengths: ["Aerodynamics", "Wind tunnel access"],
    weaknesses: ["Factory size", "Engine deal leverage"],
  },
  {
    id: "backmarker-01",
    name: "Corsair GP",
    tier: "Backmarker",
    overall: 58,
    infrastructure: 49,
    budget: 45,
    developmentPotential: 95,
    strengths: ["Low overhead", "Hungry engineers"],
    weaknesses: ["Reliability history", "Sponsor appeal"],
  },
  {
    id: "frontrunner-01",
    name: "Vantage F1",
    tier: "Front-runner",
    overall: 91,
    infrastructure: 93,
    budget: 90,
    developmentPotential: 72,
    strengths: ["Factory scale", "Championship pedigree"],
    weaknesses: ["High wage bill", "Media pressure"],
  },
];

export const mockDrivers = [
  {
    id: "d1",
    name: "K. Farrow",
    age: 27,
    overall: 91,
    pace: 92,
    qualifying: 90,
    racecraft: 93,
    consistency: 88,
    tireManagement: 86,
    wetSkill: 89,
    salary: 14,
    personality: "Aggressive",
    potential: 91,
    morale: 84,
    confidence: 81,
  },
  {
    id: "d2",
    name: "R. Okafor",
    age: 20,
    overall: 78,
    pace: 82,
    qualifying: 76,
    racecraft: 74,
    consistency: 66,
    tireManagement: 70,
    wetSkill: 72,
    salary: 3,
    personality: "Risk Taker",
    potential: 95,
    morale: 88,
    confidence: 79,
    rookie: true,
  },
  {
    id: "d3",
    name: "M. Sundqvist",
    age: 33,
    overall: 85,
    pace: 83,
    qualifying: 85,
    racecraft: 87,
    consistency: 92,
    tireManagement: 90,
    wetSkill: 84,
    salary: 9,
    personality: "Calm",
    potential: 85,
    morale: 76,
    confidence: 82,
  },
];

export const mockEngines = [
  {
    id: "e1",
    name: "Elite Engine",
    power: 94,
    reliability: 96,
    efficiency: 90,
    cost: 18,
    status: "Factory",
  },
  {
    id: "e2",
    name: "Customer Engine",
    power: 87,
    reliability: 88,
    efficiency: 82,
    cost: 8,
    status: "Customer",
  },
];

export const mockGearboxes = [
  { id: "g1", name: "Precision Gearbox", performance: 92, reliability: 85, cost: 6 },
  { id: "g2", name: "Standard Gearbox", performance: 78, reliability: 91, cost: 3 },
];

export const mockTechPackage = {
  aero: 82,
  chassis: 78,
  reliability: 80,
  tireBehavior: 74,
  developmentPotential: 90,
};

export const mockSponsors = [
  {
    id: "s1",
    name: "Halcyon Watches",
    type: "Conservative",
    money: 6,
    contractLength: "2 seasons",
    expectation: "Top 10 finishes",
    risk: "Low",
    bonus: "+$1.2M per podium",
  },
  {
    id: "s2",
    name: "Voltbrand Energy",
    type: "Aggressive",
    money: 12,
    contractLength: "1 season",
    expectation: "Podium by round 8",
    risk: "High",
    bonus: "+$4M on title fight",
  },
];

export const mockStandingsDrivers = [
  { pos: 1, name: "K. Farrow", team: "Vantage F1", points: 214 },
  { pos: 2, name: "R. Vale", team: "Meridian", points: 201 },
  { pos: 3, name: "M. Sundqvist", team: "Arden Racing", points: 178 },
  { pos: 4, name: "R. Okafor", team: "Arden Racing", points: 122 },
];

export const mockStandingsConstructors = [
  { pos: 1, name: "Vantage F1", points: 389 },
  { pos: 2, name: "Meridian", points: 342 },
  { pos: 3, name: "Arden Racing", points: 300 },
];

export const mockRaceEvents = [
  { lap: 1, text: "Clean start — no position changes in the top 10." },
  { lap: 12, text: "⚠️ Driver reports front-left tire degradation." },
  { lap: 18, text: "🟡 SAFETY CAR — contact between two backmarkers." },
  { lap: 22, text: "🟢 Pit stop: 2.31s. Undercut attempt on P4." },
  { lap: 34, text: "🔴 ENGINE FAILURE — car retires from P6." },
  { lap: 41, text: "🟢 OVERTAKE — moves into P5 around the outside." },
  { lap: 53, text: "🏁 CHEQUERED FLAG — finishes P5." },
];

export const mockDevelopmentOptions = [
  { id: "u1", name: "Aero Upgrade", cost: 6, effect: "+3 Aerodynamics", duration: "4 races", risk: "Low" },
  { id: "u2", name: "Reliability Upgrade", cost: 4, effect: "-15% mechanical failure risk", duration: "2 races", risk: "Low" },
  { id: "u3", name: "Chassis Upgrade", cost: 7, effect: "+2 Mechanical Grip", duration: "5 races", risk: "Medium" },
  { id: "u4", name: "Pit Crew Training", cost: 2, effect: "-5% pit error rate", duration: "1 race", risk: "Low" },
];

export const mockPaddockNews = [
  { tag: "Sponsor", text: "Voltbrand Energy praises your podium run — relationship improving." },
  { tag: "Rival", text: "Meridian confirms a major aero upgrade for the next round." },
  { tag: "Staff", text: "Your reliability engineer has been approached by a rival team." },
];
