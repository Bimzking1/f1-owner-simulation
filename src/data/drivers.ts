// ============================================================================
// F1 Owner — Driver rosters (historical, spec §16-20, §73)
// Ratings calibrated to historical performance; career value ≠ season form.
// ============================================================================

import type { Driver, DriverAttributes, PersonalityId, SeasonId } from "@/simulation/types";
import { driverImage } from "./assets";

interface DrInput {
  id: string;
  name: string;
  number: number;
  nationality: string;
  age: number;
  teamId: string;
  overall: number;
  careerValue: number;
  seasonForm: number;
  potential: number;
  experience: number;
  reputation: number;
  salary: number;
  sponsorAppeal: number;
  personality: PersonalityId;
  variance: number;
  rookie: boolean;
  a: DriverAttributes;
}

function dr(season: SeasonId, i: DrInput): Driver {
  return {
    id: i.id,
    name: i.name,
    shortName: `${i.name[0]}. ${i.name.split(" ").at(-1)!.toUpperCase()}`,
    number: i.number,
    nationality: i.nationality,
    age: i.age,
    season,
    teamId: i.teamId,
    attributes: i.a,
    overall: i.overall,
    careerValue: i.careerValue,
    seasonForm: i.seasonForm,
    potential: i.potential,
    experience: i.experience,
    reputation: i.reputation,
    salary: i.salary,
    sponsorAppeal: i.sponsorAppeal,
    personality: i.personality,
    variance: i.variance,
    rookie: i.rookie,
    image: driverImage(i.id),
  };
}

// fast = pace, qual = qualifying, craft = racecraft, cons = consistency,
// tire = tire management, wet = wet skill, adap = adaptability,
// feed = technical feedback, pres = pressure, aggr = aggression
const A = (fast: number, qual: number, craft: number, cons: number, tire: number, wet: number, adap: number, feed: number, pres: number, aggr: number): DriverAttributes => ({
  pace: fast, qualifying: qual, racecraft: craft, consistency: cons, tireManagement: tire,
  wetSkill: wet, adaptability: adap, feedback: feed, pressure: pres, aggression: aggr,
});

export const DRIVERS_2013: Driver[] = [
  // Red Bull Racing
  dr(2013, { id: "vettel", name: "Sebastian Vettel", number: 1, nationality: "Germany", age: 26, teamId: "redbull", overall: 99, careerValue: 98, seasonForm: 1, potential: 97, experience: 96, reputation: 99, salary: 32, sponsorAppeal: 93, personality: "competitive", variance: 4, rookie: false, a: A(98, 97, 99, 96, 94, 98, 97, 92, 99, 95) }),
  dr(2013, { id: "webber", name: "Mark Webber", number: 2, nationality: "Australia", age: 37, teamId: "redbull", overall: 89, careerValue: 90, seasonForm: -1, potential: 86, experience: 92, reputation: 88, salary: 15, sponsorAppeal: 82, personality: "calm", variance: 6, rookie: false, a: A(91, 89, 88, 87, 88, 87, 83, 84, 85, 85) }),
  // Ferrari
  dr(2013, { id: "alonso", name: "Fernando Alonso", number: 3, nationality: "Spain", age: 32, teamId: "ferrari", overall: 97, careerValue: 96, seasonForm: 3, potential: 94, experience: 95, reputation: 96, salary: 30, sponsorAppeal: 94, personality: "competitive", variance: 5, rookie: false, a: A(95, 95, 97, 94, 94, 95, 94, 95, 97, 90) }),
  dr(2013, { id: "massa", name: "Felipe Massa", number: 4, nationality: "Brazil", age: 32, teamId: "ferrari", overall: 86, careerValue: 86, seasonForm: 1, potential: 83, experience: 89, reputation: 84, salary: 11, sponsorAppeal: 80, personality: "calm", variance: 7, rookie: false, a: A(88, 88, 86, 84, 82, 84, 82, 83, 82, 85) }),
  // Mercedes
  dr(2013, { id: "hamilton", name: "Lewis Hamilton", number: 10, nationality: "United Kingdom", age: 28, teamId: "mercedes", overall: 96, careerValue: 98, seasonForm: -1, potential: 96, experience: 95, reputation: 98, salary: 32, sponsorAppeal: 97, personality: "aggressive", variance: 6, rookie: false, a: A(97, 98, 96, 92, 93, 96, 94, 93, 94, 96) }),
  dr(2013, { id: "rosberg", name: "Nico Rosberg", number: 9, nationality: "Germany", age: 28, teamId: "mercedes", overall: 90, careerValue: 90, seasonForm: 1, potential: 89, experience: 88, reputation: 87, salary: 16, sponsorAppeal: 84, personality: "perfectionist", variance: 5, rookie: false, a: A(90, 91, 88, 91, 89, 88, 87, 89, 88, 86) }),
  // Lotus
  dr(2013, { id: "raikkonen", name: "Kimi Raikkonen", number: 7, nationality: "Finland", age: 34, teamId: "lotus", overall: 95, careerValue: 96, seasonForm: 0, potential: 92, experience: 94, reputation: 94, salary: 13, sponsorAppeal: 88, personality: "tireWhisperer", variance: 5, rookie: false, a: A(93, 89, 95, 94, 97, 91, 90, 85, 92, 87) }),
  dr(2013, { id: "grosjean", name: "Romain Grosjean", number: 8, nationality: "France", age: 27, teamId: "lotus", overall: 86, careerValue: 85, seasonForm: 2, potential: 88, experience: 82, reputation: 78, salary: 5, sponsorAppeal: 68, personality: "riskTaker", variance: 9, rookie: false, a: A(88, 86, 82, 80, 85, 84, 81, 86, 82, 88) }),
  // McLaren
  dr(2013, { id: "button", name: "Jenson Button", number: 5, nationality: "United Kingdom", age: 33, teamId: "mclaren", overall: 91, careerValue: 91, seasonForm: 0, potential: 87, experience: 93, reputation: 90, salary: 20, sponsorAppeal: 90, personality: "calm", variance: 4, rookie: false, a: A(89, 87, 94, 95, 95, 90, 88, 92, 88, 76) }),
  dr(2013, { id: "perez", name: "Sergio Perez", number: 6, nationality: "Mexico", age: 23, teamId: "mclaren", overall: 84, careerValue: 84, seasonForm: 0, potential: 91, experience: 78, reputation: 78, salary: 7, sponsorAppeal: 80, personality: "riskTaker", variance: 8, rookie: false, a: A(86, 84, 84, 82, 84, 83, 80, 82, 83, 86) }),
  // Force India
  dr(2013, { id: "diresta", name: "Paul di Resta", number: 14, nationality: "United Kingdom", age: 27, teamId: "forceindia", overall: 82, careerValue: 81, seasonForm: 1, potential: 84, experience: 80, reputation: 74, salary: 4, sponsorAppeal: 60, personality: "calm", variance: 8, rookie: false, a: A(82, 82, 82, 84, 82, 80, 78, 84, 81, 78) }),
  dr(2013, { id: "sutil", name: "Adrian Sutil", number: 15, nationality: "Germany", age: 30, teamId: "forceindia", overall: 81, careerValue: 79, seasonForm: 2, potential: 79, experience: 84, reputation: 74, salary: 4, sponsorAppeal: 58, personality: "aggressive", variance: 8, rookie: false, a: A(82, 81, 81, 83, 81, 82, 78, 82, 82, 84) }),
  // Sauber
  dr(2013, { id: "hulkenberg", name: "Nico Hulkenberg", number: 11, nationality: "Germany", age: 26, teamId: "sauber", overall: 86, careerValue: 84, seasonForm: 3, potential: 88, experience: 82, reputation: 80, salary: 4, sponsorAppeal: 70, personality: "technical", variance: 6, rookie: false, a: A(87, 88, 85, 86, 84, 88, 85, 88, 84, 83) }),
  dr(2013, { id: "gutierrez", name: "Esteban Gutierrez", number: 12, nationality: "Mexico", age: 22, teamId: "sauber", overall: 75, careerValue: 73, seasonForm: 1, potential: 88, experience: 66, reputation: 58, salary: 2, sponsorAppeal: 62, personality: "calm", variance: 12, rookie: false, a: A(76, 74, 74, 75, 74, 75, 78, 76, 74, 79) }),
  // Toro Rosso
  dr(2013, { id: "ricciardo", name: "Daniel Ricciardo", number: 19, nationality: "Australia", age: 24, teamId: "tororosso", overall: 87, careerValue: 86, seasonForm: 2, potential: 94, experience: 78, reputation: 82, salary: 3, sponsorAppeal: 80, personality: "competitive", variance: 6, rookie: false, a: A(85, 85, 84, 84, 85, 86, 86, 87, 87, 88) }),
  dr(2013, { id: "vergne", name: "Jean-Eric Vergne", number: 18, nationality: "France", age: 23, teamId: "tororosso", overall: 80, careerValue: 78, seasonForm: 2, potential: 85, experience: 74, reputation: 68, salary: 2, sponsorAppeal: 52, personality: "calm", variance: 9, rookie: false, a: A(80, 80, 79, 80, 79, 80, 79, 81, 79, 82) }),
  // Williams
  dr(2013, { id: "maldonado", name: "Pastor Maldonado", number: 16, nationality: "Venezuela", age: 28, teamId: "williams", overall: 80, careerValue: 78, seasonForm: 1, potential: 78, experience: 80, reputation: 70, salary: 6, sponsorAppeal: 72, personality: "aggressive", variance: 11, rookie: false, a: A(81, 82, 78, 68, 76, 71, 72, 79, 75, 92) }),
  dr(2013, { id: "bottas", name: "Valtteri Bottas", number: 17, nationality: "Finland", age: 24, teamId: "williams", overall: 83, careerValue: 84, seasonForm: 0, potential: 92, experience: 70, reputation: 75, salary: 3, sponsorAppeal: 74, personality: "calm", variance: 7, rookie: false, a: A(83, 84, 81, 85, 84, 82, 85, 87, 80, 80) }),
  // Caterham
  dr(2013, { id: "pic", name: "Charles Pic", number: 20, nationality: "France", age: 23, teamId: "caterham", overall: 72, careerValue: 71, seasonForm: 1, potential: 78, experience: 68, reputation: 55, salary: 2, sponsorAppeal: 40, personality: "calm", variance: 10, rookie: false, a: A(72, 72, 71, 74, 71, 70, 73, 71, 69, 72) }),
  dr(2013, { id: "vandergarde", name: "Giedo van der Garde", number: 21, nationality: "Netherlands", age: 28, teamId: "caterham", overall: 71, careerValue: 70, seasonForm: 1, potential: 74, experience: 66, reputation: 52, salary: 2, sponsorAppeal: 38, personality: "calm", variance: 10, rookie: false, a: A(72, 71, 70, 72, 70, 69, 70, 70, 68, 70) }),
  // Marussia
  dr(2013, { id: "bianchi", name: "Jules Bianchi", number: 22, nationality: "France", age: 24, teamId: "marussia", overall: 77, careerValue: 75, seasonForm: 2, potential: 92, experience: 66, reputation: 68, salary: 2, sponsorAppeal: 62, personality: "technical", variance: 8, rookie: false, a: A(78, 77, 75, 76, 76, 78, 79, 78, 74, 75) }),
  dr(2013, { id: "chilton", name: "Max Chilton", number: 23, nationality: "United Kingdom", age: 22, teamId: "marussia", overall: 68, careerValue: 66, seasonForm: 1, potential: 72, experience: 62, reputation: 45, salary: 2, sponsorAppeal: 34, personality: "calm", variance: 12, rookie: false, a: A(69, 68, 68, 71, 66, 65, 68, 67, 64, 66) }),
];

export const DRIVERS_2025: Driver[] = [
  // McLaren
  dr(2025, { id: "norris", name: "Lando Norris", number: 4, nationality: "United Kingdom", age: 26, teamId: "mclaren", overall: 96, careerValue: 94, seasonForm: 4, potential: 97, experience: 90, reputation: 93, salary: 30, sponsorAppeal: 92, personality: "competitive", variance: 5, rookie: false, a: A(95, 95, 92, 93, 93, 90, 92, 91, 90, 86) }),
  dr(2025, { id: "piastri", name: "Oscar Piastri", number: 81, nationality: "Australia", age: 24, teamId: "mclaren", overall: 95, careerValue: 93, seasonForm: 3, potential: 97, experience: 84, reputation: 90, salary: 16, sponsorAppeal: 88, personality: "perfectionist", variance: 5, rookie: false, a: A(94, 94, 93, 93, 92, 91, 93, 92, 91, 90) }),
  // Ferrari
  dr(2025, { id: "leclerc", name: "Charles Leclerc", number: 16, nationality: "Monaco", age: 27, teamId: "ferrari", overall: 95, careerValue: 94, seasonForm: 1, potential: 96, experience: 90, reputation: 93, salary: 28, sponsorAppeal: 93, personality: "competitive", variance: 6, rookie: false, a: A(94, 96, 91, 90, 90, 93, 91, 92, 91, 88) }),
  dr(2025, { id: "hamilton", name: "Lewis Hamilton", number: 44, nationality: "United Kingdom", age: 40, teamId: "ferrari", overall: 95, careerValue: 98, seasonForm: -1, potential: 90, experience: 98, reputation: 98, salary: 30, sponsorAppeal: 97, personality: "perfectionist", variance: 5, rookie: false, a: A(93, 94, 96, 92, 94, 95, 92, 95, 93, 87) }),
  // Red Bull
  dr(2025, { id: "verstappen", name: "Max Verstappen", number: 1, nationality: "Netherlands", age: 28, teamId: "redbull", overall: 99, careerValue: 98, seasonForm: 1, potential: 98, experience: 95, reputation: 97, salary: 40, sponsorAppeal: 95, personality: "aggressive", variance: 4, rookie: false, a: A(98, 97, 99, 95, 95, 98, 96, 94, 99, 97) }),
  dr(2025, { id: "lawson", name: "Liam Lawson", number: 30, nationality: "New Zealand", age: 23, teamId: "redbull", overall: 81, careerValue: 80, seasonForm: 0, potential: 88, experience: 68, reputation: 72, salary: 4, sponsorAppeal: 60, personality: "aggressive", variance: 12, rookie: false, a: A(82, 81, 80, 78, 81, 83, 82, 84, 78, 86) }),
  // Mercedes
  dr(2025, { id: "russell", name: "George Russell", number: 63, nationality: "United Kingdom", age: 27, teamId: "mercedes", overall: 93, careerValue: 92, seasonForm: 2, potential: 95, experience: 88, reputation: 89, salary: 18, sponsorAppeal: 87, personality: "perfectionist", variance: 5, rookie: false, a: A(92, 93, 90, 92, 91, 90, 89, 93, 91, 84) }),
  dr(2025, { id: "antonelli", name: "Andrea Kimi Antonelli", number: 12, nationality: "Italy", age: 19, teamId: "mercedes", overall: 82, careerValue: 80, seasonForm: 2, potential: 96, experience: 58, reputation: 74, salary: 6, sponsorAppeal: 78, personality: "riskTaker", variance: 15, rookie: true, a: A(84, 83, 80, 76, 79, 81, 85, 88, 78, 88) }),
  // Aston Martin
  dr(2025, { id: "alonso", name: "Fernando Alonso", number: 14, nationality: "Spain", age: 44, teamId: "astonmartin", overall: 93, careerValue: 96, seasonForm: 1, potential: 84, experience: 98, reputation: 95, salary: 24, sponsorAppeal: 90, personality: "technical", variance: 5, rookie: false, a: A(91, 91, 95, 92, 94, 94, 90, 96, 92, 88) }),
  dr(2025, { id: "stroll", name: "Lance Stroll", number: 18, nationality: "Canada", age: 27, teamId: "astonmartin", overall: 81, careerValue: 80, seasonForm: 0, potential: 83, experience: 84, reputation: 72, salary: 8, sponsorAppeal: 74, personality: "calm", variance: 10, rookie: false, a: A(82, 81, 81, 80, 81, 78, 78, 80, 79, 80) }),
  // Alpine
  dr(2025, { id: "gasly", name: "Pierre Gasly", number: 10, nationality: "France", age: 29, teamId: "alpine", overall: 87, careerValue: 86, seasonForm: 2, potential: 88, experience: 86, reputation: 82, salary: 10, sponsorAppeal: 78, personality: "competitive", variance: 7, rookie: false, a: A(87, 86, 86, 86, 87, 86, 86, 87, 85, 87) }),
  dr(2025, { id: "doohan", name: "Jack Doohan", number: 7, nationality: "Australia", age: 22, teamId: "alpine", overall: 78, careerValue: 76, seasonForm: 1, potential: 88, experience: 58, reputation: 62, salary: 3, sponsorAppeal: 55, personality: "calm", variance: 14, rookie: true, a: A(79, 78, 76, 74, 76, 75, 80, 82, 74, 81) }),
  // Haas
  dr(2025, { id: "ocon", name: "Esteban Ocon", number: 31, nationality: "France", age: 29, teamId: "haas", overall: 85, careerValue: 84, seasonForm: 2, potential: 86, experience: 86, reputation: 79, salary: 9, sponsorAppeal: 74, personality: "calm", variance: 8, rookie: false, a: A(85, 84, 86, 84, 85, 87, 83, 86, 85, 85) }),
  dr(2025, { id: "bearman", name: "Oliver Bearman", number: 87, nationality: "United Kingdom", age: 20, teamId: "haas", overall: 82, careerValue: 80, seasonForm: 2, potential: 93, experience: 60, reputation: 72, salary: 5, sponsorAppeal: 72, personality: "riskTaker", variance: 13, rookie: true, a: A(83, 82, 81, 78, 80, 82, 84, 86, 80, 87) }),
  // Williams
  dr(2025, { id: "albon", name: "Alexander Albon", number: 23, nationality: "Thailand", age: 29, teamId: "williams", overall: 86, careerValue: 85, seasonForm: 2, potential: 88, experience: 84, reputation: 82, salary: 8, sponsorAppeal: 80, personality: "teamPlayer", variance: 6, rookie: false, a: A(85, 86, 85, 86, 86, 84, 87, 88, 84, 82) }),
  dr(2025, { id: "sainz", name: "Carlos Sainz", number: 55, nationality: "Spain", age: 30, teamId: "williams", overall: 91, careerValue: 90, seasonForm: 1, potential: 92, experience: 90, reputation: 88, salary: 14, sponsorAppeal: 86, personality: "calm", variance: 5, rookie: false, a: A(89, 90, 92, 90, 89, 90, 89, 91, 89, 88) }),
  // Racing Bulls
  dr(2025, { id: "tsunoda", name: "Yuki Tsunoda", number: 22, nationality: "Japan", age: 25, teamId: "racingbulls", overall: 84, careerValue: 83, seasonForm: 1, potential: 89, experience: 80, reputation: 78, salary: 5, sponsorAppeal: 72, personality: "aggressive", variance: 9, rookie: false, a: A(84, 85, 82, 83, 82, 84, 81, 84, 82, 90) }),
  dr(2025, { id: "hadjar", name: "Isack Hadjar", number: 6, nationality: "France", age: 21, teamId: "racingbulls", overall: 76, careerValue: 74, seasonForm: 1, potential: 88, experience: 56, reputation: 58, salary: 3, sponsorAppeal: 50, personality: "riskTaker", variance: 15, rookie: true, a: A(78, 77, 75, 72, 74, 76, 80, 80, 73, 85) }),
  // Kick Sauber
  dr(2025, { id: "hulkenberg", name: "Nico Hulkenberg", number: 27, nationality: "Germany", age: 38, teamId: "sauber", overall: 86, careerValue: 84, seasonForm: 2, potential: 82, experience: 92, reputation: 82, salary: 8, sponsorAppeal: 74, personality: "technical", variance: 5, rookie: false, a: A(86, 88, 85, 88, 85, 87, 83, 88, 83, 82) }),
  dr(2025, { id: "bortoleto", name: "Gabriel Bortoleto", number: 5, nationality: "Brazil", age: 21, teamId: "sauber", overall: 79, careerValue: 77, seasonForm: 1, potential: 92, experience: 56, reputation: 64, salary: 3, sponsorAppeal: 66, personality: "calm", variance: 13, rookie: true, a: A(80, 79, 79, 76, 78, 79, 82, 84, 77, 82) }),
];

export const driversForSeason = (season: SeasonId): Driver[] =>
  season === 2013 ? DRIVERS_2013 : DRIVERS_2025;