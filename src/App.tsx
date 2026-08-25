import { useEffect, useMemo, useRef, useState } from "react";
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
import { audioManager, SFX } from "@/ui/audio";
import { AudioSettings } from "@/ui/AudioSettings";
import SplashScreen from "@/screens/SplashScreen";
import TrackTracerScreen from "@/screens/TrackTracerScreen";

type Screen = "splash" | "landing" | "changelog" | "setup" | "expectations" | "testing" | "season" | "track-tracer";

/** Mutable engine for a live race. NEVER part of SimulationState — the draft
 *  is only committed to React state once the weekend is finalized. */
interface LiveEngine {
  draft: SimulationState;
  prep: PreparedRound;
  /** Laps at which the race pauses for owner orders; empty → run to flag. */
  stops: number[];
  paused: boolean;
  /** True when paused by the owner's pause button (not a checkpoint). */
  userPaused?: boolean;
}

const STEP_MS = 620;

const isDesktop = () =>
  typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    window.location.pathname === "/track-tracer" ? "track-tracer" : "splash",
  );
  const [cfg, setCfg] = useState<SetupConfig | null>(null);
  const [seed, setSeed] = useState("");
  const [sim, setSim] = useState<SimulationState | null>(null);
  const [toast, setToast] = useState<string>("");
  const [hasSave, setHasSave] = useState(() => !!loadState());
  const [live, setLive] = useState<LiveView | null>(null);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);

  // Mutable live-race machinery lives entirely outside React state so renders
  // can never tear it apart: one engine object + one self-rescheduling timer.
  const engineRef = useRef<LiveEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  // Latest stepper for the pending timeout to call (updated every render).
  const stepRef = useRef<() => void>(() => {});

  useEffect(() => {
    saveState(sim);
  }, [sim]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  // -- live race engine -----------------------------------------------------

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
      retired: Object.fromEntries(
        s.running.filter((r) => r.out).map((r) => [r.comp.driverId, true]),
      ) as Record<string, boolean>,
      retireReasons: Object.fromEntries(
        s.running.filter((r) => r.out && r.dnfReason).map((r) => [r.comp.driverId, r.dnfReason!]),
      ),
      cars: Object.fromEntries(
        s.running.map((r) => {
          const alive = s.running.filter((x) => !x.out);
          const pos = r.out ? alive.length + 1 : alive.indexOf(r) + 1;
          const leader = alive[0];
          const tireLife = Math.round(100 * Math.max(0, Math.min(1, 1 - r.lapInStint / (r.stintLen * 1.15))));
          return [
            r.comp.driverId,
            {
              pos,
              gapS: leader && !r.out ? Math.round((r.cum - leader.cum) * 10) / 10 : 0,
              tire: tireLife,
              health: Math.round(Math.min(r.comp.engineCond, r.comp.gearboxCond)),
              form: Math.round(r.comp.driverState?.form ?? 0),
              frs: Math.round(r.comp.driverState?.frustration ?? 0),
            },
          ];
        }),
      ) as LiveView["cars"],
      gridPenaltyApplied: eng.prep.gridPenaltyApplied,
      paused: eng.paused,
      manualPaused: !!eng.userPaused,
      done: eng.prep.session.finished,
    };
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  /** Self-rescheduling tick: one segment, then queue the next unless the race
   *  paused or ended. The chain only ever dies through an explicit disarm. */
  const scheduleNext = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      stepRef.current();
    }, STEP_MS);
  };

  const finishLive = () => {
    const eng = engineRef.current;
    if (!eng) return;
    clearTimer();
    engineRef.current = null;
    // Stop race ambience and start post-race theme
    audioManager.stopAmbience();
    audioManager.playMusic(SFX.postRace);
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
  };

  const stepLive = () => {
    const eng = engineRef.current;
    if (!eng || eng.paused) return;
    const s = eng.prep.session;
    const target = eng.stops.length > 0 ? Math.min(eng.stops[0], s.laps) : s.laps;
    advanceRace(s, Math.min(s.currentLap + 2, target));
    if (s.finished) {
      finishLive();
      return;
    }
    if (eng.stops.length > 0 && s.currentLap >= eng.stops[0]) {
      eng.stops.shift();
      eng.paused = true;
      setToast(`Checkpoint — lap ${s.currentLap}/${s.laps}: pit wall orders open.`);
    }
    setLive(snapshotOf(eng));
    if (!eng.paused) scheduleNext();
  };
  useEffect(() => {
    stepRef.current = stepLive;
  });

  /** Heal any desync between the mutable engine and the rendered snapshot
   *  (error-boundary recovery, fast-refresh, etc.) instead of freezing. */
  useEffect(() => {
    const eng = engineRef.current;
    if (eng && !live) {
      setLive(snapshotOf(eng));
      if (!eng.paused) scheduleNext();
    } else if (!eng && live) {
      setLive(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // Stop the race clock when leaving the app entirely.
  useEffect(() => () => clearTimer(), []);

  /** Try to start a live desktop race. Returns false when the platform or
   *  game state doesn't allow it (caller should fall back to instant sim). */
  const startLiveRound = (): boolean => {
    if (!isDesktop()) return false;
    if (!sim || sim.phase !== "season") return false;
    // A healthy engine for THIS round means a race is already running.
    const existing = engineRef.current;
    if (existing && existing.prep.roundIdx === sim.round) return true;
    // Otherwise discard anything stale and start clean.
    clearTimer();
    engineRef.current = null;
    const draft = structuredClone(sim);
    const prep = prepareRound(draft);
    if (!prep) return false;
    // Stop post-race theme and start race ambience
    audioManager.stopMusic();
    const laps = prep.session.laps;
    engineRef.current = {
      draft,
      prep,
      stops: [Math.max(1, Math.floor(laps * 0.33)), Math.max(2, Math.floor(laps * 0.66))],
      paused: false,
    };
    setLive(snapshotOf(engineRef.current));
    audioManager.playAmbience(SFX.raceAmbience);
    scheduleNext();
    return true;
  };

  const resumeLive = () => {
    const eng = engineRef.current;
    if (!eng) return;
    clearTimer();
    eng.paused = false;
    eng.userPaused = false;
    setLive(snapshotOf(eng));
    scheduleNext();
  };

  /** Owner-initiated freeze: halt the clock and open the pit wall for orders. */
  const pauseLive = () => {
    const eng = engineRef.current;
    if (!eng || eng.paused) return;
    const s = eng.prep.session;
    if (s.finished) return;
    clearTimer();
    eng.paused = true;
    eng.userPaused = true;
    setLive(snapshotOf(eng));
    setToast(`Race halted at lap ${s.currentLap}/${s.laps} — pit wall open.`);
  };

  const skipLiveToEnd = () => {
    const eng = engineRef.current;
    if (!eng) return;
    clearTimer();
    const s = eng.prep.session;
    eng.stops = [];
    eng.paused = false;
    advanceRace(s, s.laps);
    finishLive();
  };

  const sendLiveCommand = (cmd: LiveCommand) => {
    const eng = engineRef.current;
    if (!eng) return;
    const s = eng.prep.session;
    if (s.finished) return;
    const car = s.running.find((r) => r.comp.driverId === cmd.driverId);
    if (!car) return;
    if (car.out) {
      setToast(`${car.comp.driver.shortName} is already out of the race.`);
      return;
    }
    const command: RaceCommand | InstantCommand =
      cmd.kind === "push" || cmd.kind === "steady" || cmd.kind === "conserve"
        ? (cmd as RaceCommand)
        : (cmd as InstantCommand);
    advanceRace(s, s.currentLap, [command]);
    setLive(snapshotOf(eng));
    // Immediate, visible confirmation — orders must never feel like a dead click.
    const who = car.comp.driver.shortName;
    const last = s.events[s.events.length - 1];
    if (cmd.kind === "retire" && last && last.actor === cmd.driverId && last.text.includes("REFUSES")) {
      setToast(`Radio: ${who} refuses the call — frustration +7, trust −1. He'll nurse it home.`);
      return;
    }
    if (cmd.kind === "retire") {
      // Play Charles Leclerc scream if he's forced to retire
      const driverId = cmd.driverId;
      if (driverId === "leclerc") {
        audioManager.playSfx(SFX.charlesScream, 0.6);
      }
      setToast(`${who} RETIRED from the race — he takes it hard (+4 frustration, −2 trust).`);
      return;
    }
    setToast(
      cmd.kind === "push"
        ? `Pit wall: ${who} told to PUSH.`
        : cmd.kind === "steady"
          ? `Pit wall: ${who} told to hold STEADY.`
          : cmd.kind === "conserve"
            ? `Pit wall: ${who} told to CONSERVE.`
            : `Radio: ${who} fired up by the pep talk.`,
    );
  };

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
    clearTimer();
    engineRef.current = null;
    setLive(null);
    setSim(null);
    setCfg(null);
    setScreen("landing");
    setHasSave(false);
  };

  // Warn before an accidental refresh wipes an in-flight race weekend
  // (the season itself is autosaved; only the live race would be lost).
  useEffect(() => {
    if (screen !== "season" || !sim) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [screen, sim]);

  const body = useMemo(() => {
    switch (screen) {
      case "splash":
        return <SplashScreen onReady={() => setScreen("landing")} />;
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
            onPause={pauseLive}
            onSkipToEnd={skipLiveToEnd}
            onNewsAction={newsAction}
            act={act}
            onReset={reset}
          />
        ) : null;
      case "track-tracer":
        return <TrackTracerScreen />;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, cfg, sim, hasSave, live]);

  return (
    <div className="min-h-full">
      {body}
      {screen !== "track-tracer" && toast && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-sm border border-telemetry/50 bg-void px-4 py-2 text-sm text-telemetry shadow-xl">
          {toast}
        </div>
      )}
      
      {/* Audio settings button - fixed top right (hidden on track tracer) */}
      {screen !== "track-tracer" && (
        <button
          type="button"
          onClick={() => setAudioSettingsOpen(true)}
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface/95 shadow-lg backdrop-blur transition hover:border-telemetry/50 hover:bg-raised"
          title="Audio Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      )}
      
      <AudioSettings open={audioSettingsOpen} onClose={() => setAudioSettingsOpen(false)} />
    </div>
  );
}
