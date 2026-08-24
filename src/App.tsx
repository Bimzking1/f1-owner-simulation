import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SimulationState, TestType, TeamState } from "@/simulation/types";
import {
  finalizeRound,
  prepareRound,
  resolveNewsAction,
  runRound,
  type PreparedRound,
} from "@/simulation/sim";
import { advanceRace, type InstantCommand, type RaceCommand } from "@/simulation/race";
import { runTest, settleSeason } from "@/actions";
import { urgentRepairs } from "@/simulation/systems";
import { buildSimulation, loadState, saveState } from "@/state";
import type { SetupConfig } from "@/screens/SetupScreen";
import LandingScreen from "@/screens/LandingScreen";
import SetupScreen from "@/screens/SetupScreen";
import ChangeLogScreen from "@/screens/ChangeLogScreen";
import ExpectationsScreen from "@/screens/ExpectationsScreen";
import TestingScreen from "@/screens/TestingScreen";
import SeasonScreen from "@/screens/season/SeasonScreen";
import type { LiveCommand, LiveView } from "@/screens/season/parts";

type Screen = "landing" | "changelog" | "setup" | "expectations" | "testing" | "season";

/** Mutable engine for a live race. NEVER part of SimulationState — the draft
 *  is only committed to React state once the weekend is finalized. */
interface LiveEngine {
  draft: SimulationState;
  prep: PreparedRound;
  /** Laps at which the race pauses for owner orders; empty → run to flag. */
  stops: number[];
  paused: boolean;
}

const isDesktop = () =>
  typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [cfg, setCfg] = useState<SetupConfig | null>(null);
  const [seed, setSeed] = useState("");
  const [sim, setSim] = useState<SimulationState | null>(null);
  const [toast, setToast] = useState<string>("");
  const [hasSave, setHasSave] = useState(() => !!loadState());
  const [live, setLive] = useState<LiveView | null>(null);
  const engineRef = useRef<LiveEngine | null>(null);

  useEffect(() => {
    saveState(sim);
  }, [sim]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const snapshotOf = (eng: LiveEngine): LiveView => {
    const s = eng.prep.session;
    const t = eng.draft.team!;
    return {
      roundIdx: eng.prep.roundIdx,
      grandPrix: eng.prep.track.grandPrix,
      laps: s.laps,
      currentLap: s.currentLap,
      lapOrder: s.lapOrder.map((o) => [...o]),
      events: [...eng.prep.preRaceEvents, ...s.events],
      qualifying: eng.prep.qualifying,
      sprint: eng.prep.sprint,
      weather: eng.prep.weatherId,
      forecast: eng.prep.forecast,
      playerIds: [t.driver1Id, t.driver2Id],
      stances: Object.fromEntries(s.stances) as LiveView["stances"],
      motivateUsed: Object.fromEntries([...s.motivateUntil.keys()].map((k) => [k, true])),
      gridPenaltyApplied: eng.prep.gridPenaltyApplied,
      paused: eng.paused,
      done: false,
    };
  };

  // -- live race engine -----------------------------------------------------

  const finishLive = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    engineRef.current = null;
    const outcome = finalizeRound(eng.draft, eng.prep);
    if (outcome.phase === "finished") settleSeason(eng.draft);
    setSim(eng.draft);
    setLive(null);
    const mine = outcome.weekend.playerEntries
      .filter((p) => !p.dnf)
      .sort((a, b) => a.position - b.position);
    const best = mine[0];
    setToast(
      best
        ? `${outcome.weekend.trackId} GP done — best finish P${best.position}${best.points ? ` (${best.points} pts)` : ""}.`
        : `${outcome.weekend.trackId} GP done.`,
    );
  }, []);

  const stepLive = useCallback(() => {
    const eng = engineRef.current;
    if (!eng || eng.paused) return;
    const s = eng.prep.session;
    const stop = eng.stops.length > 0 ? eng.stops[0] : s.laps;
    advanceRace(s, Math.min(s.currentLap + 2, stop));
    if (s.finished) {
      finishLive();
      return;
    }
    if (eng.stops.length > 0 && s.currentLap >= eng.stops[0]) {
      eng.stops.shift();
      eng.paused = true;
    }
    setLive(snapshotOf(eng));
  }, [finishLive]);

  const racing = !!live && !live.paused && !live.done;
  useEffect(() => {
    if (!racing) return;
    const id = setInterval(stepLive, 620);
    return () => clearInterval(id);
  }, [racing, stepLive]);

  /** Try to start a live desktop race. Returns false when the platform or
   *  game state doesn't allow it (caller should fall back to instant sim). */
  const startLiveRound = (): boolean => {
    if (!isDesktop()) return false;
    if (engineRef.current) return true;
    if (!sim || sim.phase !== "season") return false;
    const draft = structuredClone(sim);
    const prep = prepareRound(draft);
    if (!prep) return false;
    const laps = prep.session.laps;
    engineRef.current = {
      draft,
      prep,
      stops: [Math.max(1, Math.floor(laps * 0.33)), Math.max(2, Math.floor(laps * 0.66))],
      paused: false,
    };
    setLive(snapshotOf(engineRef.current));
    return true;
  };

  const resumeLive = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.paused = false;
    setLive(snapshotOf(eng));
  }, []);

  const skipLiveToEnd = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const s = eng.prep.session;
    eng.stops = [];
    eng.paused = false;
    advanceRace(s, s.laps);
    finishLive();
  }, [finishLive]);

  const sendLiveCommand = useCallback((cmd: LiveCommand) => {
    const eng = engineRef.current;
    if (!eng) return;
    const s = eng.prep.session;
    const command: RaceCommand | InstantCommand =
      cmd.kind === "push" || cmd.kind === "steady" || cmd.kind === "conserve"
        ? (cmd as RaceCommand)
        : (cmd as InstantCommand);
    advanceRace(s, s.currentLap, [command]);
    setLive(snapshotOf(eng));
  }, []);

  // -- season flow ----------------------------------------------------------

  const continueSave = () => {
    const s = loadState();
    if (s) {
      setSim(s);
      setScreen("season");
    }
  };

  const newGame = (c: SetupConfig & { seed: string }) => {
    setCfg({ season: c.season, difficulty: c.difficulty, gameLength: c.gameLength, owner: c.owner });
    setSeed(c.seed);
    setSim(null);
    setScreen("setup");
  };

  const startSeason = (built: TeamState) => {
    if (!cfg) return;
    const s = buildSimulation({ ...cfg, team: built }, seed || `F1-${cfg.season}`);
    setSim(s);
    setScreen("expectations");
  };

  const afterExpectations = () => {
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

  /** Auto-simulate weekends until something demands the owner's attention:
   *  broken parts, an unanswered driver demand, bankruptcy or the flag. */
  const autoAdvance = () => {
    if (!sim || sim.phase !== "season") return;
    if (urgentRepairs(sim).length > 0) {
      setToast("Repair the car before running more races.");
      return;
    }
    const d = structuredClone(sim);
    let ran = 0;
    let reason: "" | "repairs" | "challenge" = "";
    while (d.phase === "season") {
      runRound(d);
      ran++;
      if (d.phase !== "season") break;
      if (urgentRepairs(d).length > 0) {
        reason = "repairs";
        break;
      }
      if (d.team?.driverChallenge) {
        reason = "challenge";
        break;
      }
    }
    setSim(d);
    const gpWord = `GP${ran === 1 ? "" : "s"}`;
    setToast(
      reason === "repairs"
        ? `Auto-stopped after ${ran} ${gpWord} — broken parts need attention.`
        : reason === "challenge"
          ? `Auto-stopped after ${ran} ${gpWord} — a driver wants a word in Management.`
          : `Auto-ran ${ran} ${gpWord}.`,
    );
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
    engineRef.current = null;
    setLive(null);
    setSim(null);
    setCfg(null);
    setScreen("landing");
    setHasSave(false);
  };

  const body = useMemo(() => {
    switch (screen) {
      case "landing":
        return (
          <LandingScreen
            onNewGame={newGame}
            onContinue={continueSave}
            hasSave={hasSave}
            onChangelog={() => setScreen("changelog")}
          />
        );
      case "changelog":
        return <ChangeLogScreen onBack={() => setScreen("landing")} />;
      case "setup":
        return cfg ? (
          <SetupScreen cfg={cfg} onStart={startSeason} onBack={() => setScreen("landing")} />
        ) : null;
      case "expectations":
        return sim ? <ExpectationsScreen state={sim} onContinue={afterExpectations} /> : null;
      case "testing":
        return sim ? (
          <TestingScreen state={sim} onRunTest={test} onStartSeason={beginSeason} />
        ) : null;
      case "season":
        return sim ? (
          <SeasonScreen
            state={sim}
            onRunRound={advanceRound}
            onStartLive={startLiveRound}
            onAutoRun={autoAdvance}
            live={live}
            sendCommand={sendLiveCommand}
            onResume={resumeLive}
            onSkipToEnd={skipLiveToEnd}
            onNewsAction={newsAction}
            act={act}
            onReset={reset}
          />
        ) : null;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, cfg, sim, hasSave, live]);

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
