// ============================================================================
// F1 Owner — Tracks & calendars (spec §35). 2013: 19 rounds, 2025: 24 rounds.
// Characteristics are calibrated 0-100 ratings, not real measurements.
// ============================================================================

import type { SeasonId, Track, TrackCharacteristics } from "@/simulation/types";
import { assetPaths } from "./assets";

const C = (
  highSpeed: number, lowSpeed: number, flowing: number, technical: number,
  downforce: number, straightLine: number, mechanicalGrip: number, tireStress: number,
  overtaking: number, weatherRisk: number, reliabilityRisk: number,
  driverImportance: number, engineImportance: number,
): TrackCharacteristics => ({
  highSpeed, lowSpeed, flowing, technical, downforce, straightLine, mechanicalGrip,
  tireStress, overtaking, weatherRisk, reliabilityRisk, driverImportance, engineImportance,
});

interface TInput {
  id: string;
  name: string;
  grandPrix: string;
  country: string;
  laps: number;
  lengthKm: number;
  sprint?: boolean;
  c: TrackCharacteristics;
}

const T = (season: SeasonId, i: TInput): Track => ({
  id: i.id,
  name: i.name,
  grandPrix: i.grandPrix,
  country: i.country,
  season,
  laps: i.laps,
  lengthKm: i.lengthKm,
  sprint: i.sprint ?? false,
  characteristics: i.c,
  image: assetPaths.tracks[i.id as keyof typeof assetPaths.tracks],
  heroImage: assetPaths.backgrounds.raceWeekend,
});

export const TRACKS_2013: Track[] = [
  T(2013, { id: "melbourne", name: "Albert Park", grandPrix: "Australian GP", country: "Australia", laps: 58, lengthKm: 5.278, c: C(60, 55, 75, 55, 55, 45, 60, 55, 65, 55, 45, 60, 35) }),
  T(2013, { id: "sepang", name: "Sepang International Circuit", grandPrix: "Malaysian GP", country: "Malaysia", laps: 56, lengthKm: 5.543, c: C(80, 45, 80, 55, 45, 70, 50, 65, 85, 78, 60, 55, 55) }),
  T(2013, { id: "shanghai", name: "Shanghai International Circuit", grandPrix: "Chinese GP", country: "China", laps: 56, lengthKm: 5.451, c: C(70, 60, 45, 85, 70, 60, 75, 55, 55, 35, 45, 60, 45) }),
  T(2013, { id: "bahrain", name: "Bahrain International Circuit", grandPrix: "Bahrain GP", country: "Bahrain", laps: 57, lengthKm: 5.412, c: C(70, 55, 40, 75, 60, 65, 85, 80, 80, 10, 55, 55, 40) }),
  T(2013, { id: "barcelona", name: "Circuit de Barcelona-Catalunya", grandPrix: "Spanish GP", country: "Spain", laps: 66, lengthKm: 4.657, c: C(75, 40, 55, 60, 75, 40, 55, 45, 45, 25, 35, 65, 45) }),
  T(2013, { id: "monaco", name: "Circuit de Monaco", grandPrix: "Monaco GP", country: "Monaco", laps: 78, lengthKm: 3.337, c: C(20, 100, 30, 100, 100, 15, 82, 68, 25, 60, 30, 98, 10) }),
  T(2013, { id: "montreal", name: "Circuit Gilles Villeneuve", grandPrix: "Canadian GP", country: "Canada", laps: 70, lengthKm: 4.361, c: C(70, 70, 40, 60, 55, 90, 80, 55, 70, 55, 50, 55, 55) }),
  T(2013, { id: "silverstone", name: "Silverstone Circuit", grandPrix: "British GP", country: "Great Britain", laps: 52, lengthKm: 5.891, c: C(90, 35, 90, 45, 88, 60, 45, 55, 60, 65, 40, 60, 55) }),
  T(2013, { id: "nurburgring", name: "Nurburgring GP-Strecke", grandPrix: "German GP", country: "Germany", laps: 60, lengthKm: 5.148, c: C(60, 55, 70, 60, 65, 60, 60, 60, 70, 70, 45, 55, 45) }),
  T(2013, { id: "hungaroring", name: "Hungaroring", grandPrix: "Hungarian GP", country: "Hungary", laps: 70, lengthKm: 4.381, c: C(45, 80, 40, 85, 78, 25, 82, 72, 30, 20, 40, 75, 20) }),
  T(2013, { id: "spa", name: "Circuit de Spa-Francorchamps", grandPrix: "Belgian GP", country: "Belgium", laps: 44, lengthKm: 7.004, c: C(92, 40, 85, 45, 78, 85, 50, 55, 65, 85, 75, 65, 45) }),
  T(2013, { id: "monza", name: "Autodromo Nazionale Monza", grandPrix: "Italian GP", country: "Italy", laps: 53, lengthKm: 5.793, c: C(98, 20, 60, 30, 20, 100, 35, 40, 88, 25, 72, 40, 98) }),
  T(2013, { id: "singapore", name: "Marina Bay Street Circuit", grandPrix: "Singapore GP", country: "Singapore", laps: 61, lengthKm: 4.94, c: C(40, 90, 35, 95, 95, 25, 85, 90, 35, 65, 88, 80, 15) }),
  T(2013, { id: "yeongam", name: "Korea International Circuit", grandPrix: "Korean GP", country: "South Korea", laps: 55, lengthKm: 5.615, c: C(65, 60, 40, 70, 65, 75, 70, 55, 62, 30, 50, 55, 45) }),
  T(2013, { id: "suzuka", name: "Suzuka International Racing Course", grandPrix: "Japanese GP", country: "Japan", laps: 53, lengthKm: 5.807, c: C(88, 40, 92, 60, 78, 60, 50, 62, 55, 72, 48, 78, 50) }),
  T(2013, { id: "buddh", name: "Buddh International Circuit", grandPrix: "Indian GP", country: "India", laps: 60, lengthKm: 5.125, c: C(75, 50, 55, 60, 60, 85, 60, 62, 60, 10, 45, 50, 55) }),
  T(2013, { id: "yasmarina", name: "Yas Marina Circuit", grandPrix: "Abu Dhabi GP", country: "United Arab Emirates", laps: 55, lengthKm: 5.281, c: C(60, 75, 40, 70, 78, 45, 72, 58, 40, 15, 48, 62, 40) }),
  T(2013, { id: "austin", name: "Circuit of the Americas", grandPrix: "United States GP", country: "United States", laps: 56, lengthKm: 5.513, c: C(80, 45, 70, 75, 72, 45, 60, 65, 62, 45, 42, 65, 40) }),
  T(2013, { id: "interlagos", name: "Autodromo Jose Carlos Pace", grandPrix: "Brazilian GP", country: "Brazil", laps: 71, lengthKm: 4.309, c: C(75, 60, 50, 65, 68, 55, 78, 68, 78, 60, 45, 60, 45) }),
];

export const TRACKS_2025: Track[] = [
  T(2025, { id: "melbourne", name: "Albert Park", grandPrix: "Australian GP", country: "Australia", laps: 57, lengthKm: 5.278, c: C(60, 55, 75, 55, 55, 45, 60, 55, 66, 55, 45, 60, 35) }),
  T(2025, { id: "shanghai", name: "Shanghai International Circuit", grandPrix: "Chinese GP", country: "China", laps: 56, lengthKm: 5.451, sprint: true, c: C(70, 60, 45, 85, 70, 60, 75, 55, 55, 35, 45, 60, 45) }),
  T(2025, { id: "suzuka", name: "Suzuka International Racing Course", grandPrix: "Japanese GP", country: "Japan", laps: 53, lengthKm: 5.807, c: C(88, 40, 92, 60, 78, 60, 50, 62, 55, 72, 48, 78, 50) }),
  T(2025, { id: "bahrain", name: "Bahrain International Circuit", grandPrix: "Bahrain GP", country: "Bahrain", laps: 57, lengthKm: 5.412, c: C(70, 55, 40, 75, 60, 65, 85, 80, 80, 10, 55, 55, 40) }),
  T(2025, { id: "jeddah", name: "Jeddah Corniche Circuit", grandPrix: "Saudi Arabian GP", country: "Saudi Arabia", laps: 50, lengthKm: 6.174, c: C(95, 35, 88, 55, 70, 92, 40, 55, 55, 20, 70, 70, 50) }),
  T(2025, { id: "miami", name: "Miami International Autodrome", grandPrix: "Miami GP", country: "United States", laps: 57, lengthKm: 5.412, sprint: true, c: C(70, 60, 45, 75, 78, 50, 80, 75, 45, 50, 55, 60, 35) }),
  T(2025, { id: "imola", name: "Autodromo Enzo e Dino Ferrari", grandPrix: "Emilia-Romagna GP", country: "Italy", laps: 63, lengthKm: 4.909, c: C(55, 70, 55, 80, 75, 20, 72, 65, 15, 45, 45, 70, 20) }),
  T(2025, { id: "monaco", name: "Circuit de Monaco", grandPrix: "Monaco GP", country: "Monaco", laps: 78, lengthKm: 3.337, c: C(20, 100, 30, 100, 100, 15, 82, 68, 25, 60, 30, 98, 10) }),
  T(2025, { id: "barcelona", name: "Circuit de Barcelona-Catalunya", grandPrix: "Spanish GP", country: "Spain", laps: 66, lengthKm: 4.657, c: C(75, 40, 55, 60, 75, 40, 55, 45, 45, 25, 35, 65, 45) }),
  T(2025, { id: "montreal", name: "Circuit Gilles Villeneuve", grandPrix: "Canadian GP", country: "Canada", laps: 70, lengthKm: 4.361, c: C(70, 70, 40, 60, 55, 90, 80, 55, 70, 55, 50, 55, 55) }),
  T(2025, { id: "spielberg", name: "Red Bull Ring", grandPrix: "Austrian GP", country: "Austria", laps: 71, lengthKm: 4.318, c: C(90, 30, 35, 45, 55, 95, 45, 40, 82, 55, 60, 40, 60) }),
  T(2025, { id: "silverstone", name: "Silverstone Circuit", grandPrix: "British GP", country: "Great Britain", laps: 52, lengthKm: 5.891, c: C(90, 35, 90, 45, 88, 60, 45, 55, 60, 65, 40, 60, 55) }),
  T(2025, { id: "spa", name: "Circuit de Spa-Francorchamps", grandPrix: "Belgian GP", country: "Belgium", laps: 44, lengthKm: 7.004, sprint: true, c: C(92, 40, 85, 45, 78, 85, 50, 55, 65, 85, 75, 65, 45) }),
  T(2025, { id: "hungaroring", name: "Hungaroring", grandPrix: "Hungarian GP", country: "Hungary", laps: 70, lengthKm: 4.381, c: C(45, 80, 40, 85, 78, 25, 82, 72, 30, 20, 40, 75, 20) }),
  T(2025, { id: "zandvoort", name: "Circuit Zandvoort", grandPrix: "Dutch GP", country: "Netherlands", laps: 72, lengthKm: 4.259, c: C(45, 80, 65, 85, 86, 15, 80, 78, 25, 65, 45, 72, 15) }),
  T(2025, { id: "monza", name: "Autodromo Nazionale Monza", grandPrix: "Italian GP", country: "Italy", laps: 53, lengthKm: 5.793, c: C(98, 20, 60, 30, 20, 100, 35, 40, 88, 25, 72, 40, 98) }),
  T(2025, { id: "baku", name: "Baku City Circuit", grandPrix: "Azerbaijan GP", country: "Azerbaijan", laps: 51, lengthKm: 6.003, c: C(85, 75, 30, 70, 62, 88, 75, 58, 72, 20, 55, 55, 50) }),
  T(2025, { id: "singapore", name: "Marina Bay Street Circuit", grandPrix: "Singapore GP", country: "Singapore", laps: 62, lengthKm: 4.928, c: C(40, 90, 35, 95, 95, 25, 85, 90, 35, 65, 88, 80, 15) }),
  T(2025, { id: "austin", name: "Circuit of the Americas", grandPrix: "United States GP", country: "United States", laps: 56, lengthKm: 5.513, sprint: true, c: C(80, 45, 70, 75, 72, 45, 60, 65, 62, 45, 42, 65, 40) }),
  T(2025, { id: "mexico", name: "Autodromo Hermanos Rodriguez", grandPrix: "Mexico City GP", country: "Mexico", laps: 71, lengthKm: 4.304, c: C(90, 45, 45, 65, 65, 92, 58, 72, 68, 25, 62, 55, 50) }),
  T(2025, { id: "interlagos", name: "Autodromo Jose Carlos Pace", grandPrix: "Brazilian GP", country: "Brazil", laps: 71, lengthKm: 4.309, sprint: true, c: C(75, 60, 50, 65, 68, 55, 78, 68, 78, 60, 45, 60, 45) }),
  T(2025, { id: "vegas", name: "Las Vegas Strip Circuit", grandPrix: "Las Vegas GP", country: "United States", laps: 50, lengthKm: 6.201, c: C(88, 35, 75, 55, 68, 96, 45, 62, 78, 15, 68, 50, 55) }),
  T(2025, { id: "losail", name: "Lusail International Circuit", grandPrix: "Qatar GP", country: "Qatar", laps: 57, lengthKm: 5.419, sprint: true, c: C(90, 30, 85, 45, 68, 88, 40, 85, 60, 10, 75, 45, 55) }),
  T(2025, { id: "yasmarina", name: "Yas Marina Circuit", grandPrix: "Abu Dhabi GP", country: "United Arab Emirates", laps: 58, lengthKm: 5.281, c: C(60, 75, 40, 70, 78, 45, 72, 58, 40, 15, 48, 62, 40) }),
];

export const calendarForSeason = (season: SeasonId): Track[] =>
  season === 2013 ? TRACKS_2013 : TRACKS_2025;