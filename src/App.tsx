import { useEffect, useMemo, useState } from "react";
import type { SimulationState, TestType, TeamState } from "@/simulation/types";
import { runRound } from "@/simulation/sim";
import { resolveNewsAction } from "@/simulation/sim";
import { runTest, settleSeason } from "@/actions";
import { buildSimulation, loadState, saveState } from "@/state";
import type { SetupConfig } from "@/screens/SetupScreen";
import LandingScreen from "@/screens/LandingScreen";
import SetupScreen from "@/screens/SetupScreen";
import TestingScreen from "@/screens/TestingScreen";
import SeasonScreen from "@/screens/season/SeasonScreen";

type Screen = "landing" | "setup" | "testing" | "season";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [cfg, setCfg] = useState<SetupConfig | null>(null);
  const [seed, setSeed] = useState("");
  const [sim, setSim] = useState<SimulationState | null>(null);
  const [toast, setToast] = useState<string>("");
  const [hasSave, setHasSave] = useState(() => !!loadState());

  useEffect(() => {
    saveState(sim);
  }, [sim]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const continueSave = () => {
    const s = loadState();
    if (s) {
      setSim(s);
      setScreen("season");
    }
  };

  const newGame = (c: SetupConfig & { seed: string }) => {
    setCfg({ season: c.season, difficulty: c.difficulty, gameLength: c.gameLength });
    setSeed(c.seed);
    setSim(null);
    setScreen("setup");
  };

  const startSeason = (built: TeamState) => {
    if (!cfg) return;
    const s = buildSimulation({ ...cfg, team: built }, seed || `F1-${cfg.season}`);
    setSim(s);
    setScreen("testing");
  };

  const test = (type: TestType) => {
    if (!sim) return;
    setSim((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      runTest(next, type);
      return next;
    });
  };

  const beginSeason = () => {
    if (!sim) return;
    setSim((prev) => {
      if (!prev || prev.phase !== "season") return prev;
      const next = structuredClone(prev);
      next.phase = "season";
      return next;
    });
    setScreen("season");
  };

  const advanceRound = () => {
    setSim((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const outcome = runRound(next);
      if (outcome.phase === "finished") settleSeason(next);
      return next;
    });
  };

  const act = (fn: (s: SimulationState) => string) => {
    setSim((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const msg = fn(next);
      setToast(msg);
      return next;
    });
  };

  const newsAction = (newsId: string, action: string) => {
    setSim((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      resolveNewsAction(next, newsId, action);
      return next;
    });
  };

  const reset = () => {
    setSim(null);
    setCfg(null);
    setScreen("landing");
    setHasSave(false);
  };

  const body = useMemo(() => {
    switch (screen) {
      case "landing":
        return <LandingScreen onNewGame={newGame} onContinue={continueSave} hasSave={hasSave} />;
      case "setup":
        return cfg ? (
          <SetupScreen cfg={cfg} onStart={startSeason} onBack={() => setScreen("landing")} />
        ) : null;
      case "testing":
        return sim ? (
          <TestingScreen state={sim} onRunTest={test} onStartSeason={beginSeason} />
        ) : null;
      case "season":
        return sim ? (
          <SeasonScreen
            state={sim}
            onRunRound={advanceRound}
            onNewsAction={newsAction}
            act={act}
            onReset={reset}
          />
        ) : null;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, cfg, sim, hasSave]);

  return (
    <div className="min-h-full">
      {body}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-sm border border-telemetry/50 bg-void px-4 py-2 text-sm text-telemetry shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}