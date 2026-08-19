import { useState, ComponentType } from "react";
import { UIProvider } from "@/context/ThemeContext";

import { LandingPage } from "@/screens/LandingPage";
import { SetupSeason } from "@/screens/setup/SetupSeason";
import { SetupDifficulty } from "@/screens/setup/SetupDifficulty";
import { SetupGameLength } from "@/screens/setup/SetupGameLength";
import { ConstructorSelection } from "@/screens/ConstructorSelection";
import { ConstructorConsequences } from "@/screens/ConstructorConsequences";
import { DriverSelection } from "@/screens/DriverSelection";
import { StaffSelection } from "@/screens/StaffSelection";
import { EngineSelection } from "@/screens/EngineSelection";
import { GearboxSelection } from "@/screens/GearboxSelection";
import { TechnicalPackage } from "@/screens/TechnicalPackage";
import { SponsorSelection } from "@/screens/SponsorSelection";
import { PreSeasonTesting } from "@/screens/PreSeasonTesting";
import { SeasonDashboard } from "@/screens/SeasonDashboard";
import { RaceWeekend } from "@/screens/RaceWeekend";
import { Development } from "@/screens/Development";
import { PaddockNews } from "@/screens/PaddockNews";
import { Championship } from "@/screens/Championship";
import { FinalSeasonReport } from "@/screens/FinalSeasonReport";
import { ShareResult } from "@/screens/ShareResult";

// This screen registry exists purely so every slice can be previewed on its
// own during handoff. It is NOT app routing — opencode should replace this
// with real navigation/state-driven flow wired to game state.
const screens: Record<string, ComponentType<any>> = {
  "01 Landing": LandingPage,
  "02 Setup — Season": SetupSeason,
  "03 Setup — Difficulty": SetupDifficulty,
  "04 Setup — Game Length": SetupGameLength,
  "05 Constructor Selection": ConstructorSelection,
  "06 Constructor Consequences": ConstructorConsequences,
  "07 Driver Selection": DriverSelection,
  "08 Staff Selection": StaffSelection,
  "09 Engine Selection": EngineSelection,
  "10 Gearbox Selection": GearboxSelection,
  "11 Technical Package": TechnicalPackage,
  "12 Sponsor Selection": SponsorSelection,
  "13 Pre-Season Testing": PreSeasonTesting,
  "14 Season Dashboard": SeasonDashboard,
  "15 Race Weekend": RaceWeekend,
  "16 Development": Development,
  "17 Paddock News": PaddockNews,
  "18 Championship": Championship,
  "19 Final Season Report": FinalSeasonReport,
  "20 Share Result": ShareResult,
};

export default function App() {
  const [active, setActive] = useState("01 Landing");
  const Screen = screens[active];

  return (
    <UIProvider>
      <div className="fixed top-2 left-2 z-50">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="rounded-md border border-hairline bg-raised px-2 py-1 font-mono text-[11px] text-ink"
        >
          {Object.keys(screens).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>
      <Screen />
    </UIProvider>
  );
}
