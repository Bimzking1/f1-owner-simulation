import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SimulationState } from "@/simulation/types";
import type { LiveView } from "./parts";
import { driverById, trackById, constructorById } from "@/data";
import { audioManager, SFX } from "@/ui/audio";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CircuitPoint {
  x: number;
  y: number;
  label?: string | null;
  is_turn?: boolean;
  turn_order?: number | null;
  is_sector?: boolean;
  sector?: number | null;
}

interface CircuitData {
  track: string;
  closeLoop: boolean;
  racingLine: CircuitPoint[];
  pitlane?: CircuitPoint[];
}

interface DriverTiming {
  driverId: string;
  shortName: string;
  number: number;
  teamId: string;
  teamColor: string;
  teamName: string;
  position: number;
  gridPos: number;
  gapToLeader: number;
  lastLap: number;
  bestLap: number;
  sector1: number;
  sector2: number;
  sector3: number;
  tireLife: number;
  trackProgress: number;
  status: "running" | "pit" | "dnf" | "retired";
  isPlayer: boolean;
  retiredReason?: string;
}

interface TimingData {
  lap: number;
  totalLaps: number;
  flagState: "green" | "yellow" | "vsc" | "safetyCar" | "red" | "chequered";
  weather: "dry" | "lightRain" | "heavyRain" | "changing";
  drivers: DriverTiming[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LAP_TIME_BASE = 76.5;
const SECTOR_WEIGHTS = [0.295, 0.345, 0.36];
const SECTOR_LINE_COLORS = ["#00CBFF", "#FE0101", "#FEDE01"];

const FLAG_COLORS: Record<string, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  vsc: "#eab308",
  safetyCar: "#f97316",
  red: "#ef4444",
  chequered: "#ffffff",
};

const FLAG_LABELS: Record<string, string> = {
  green: "GREEN FLAG",
  yellow: "YELLOW FLAG",
  vsc: "VIRTUAL SAFETY CAR",
  safetyCar: "SAFETY CAR",
  red: "RED FLAG",
  chequered: "CHEQUERED FLAG",
};

const SPEED_OPTIONS = [1, 1.5, 2, 4, 8, 16];

const WEATHER_LABELS: Record<string, string> = {
  dry: "Dry",
  lightRain: "Light Rain",
  heavyRain: "Heavy Rain",
  changing: "Changing",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildCatmullRom(
  points: CircuitPoint[],
  closed: boolean,
): { x: number; y: number; len: number }[] {
  if (points.length < 2) return points.map((p) => ({ x: p.x, y: p.y, len: 0 }));

  const result: { x: number; y: number; len: number }[] = [];
  let totalLen = 0;
  const n = points.length;

  function catmullPoint(
    p0: CircuitPoint, p1: CircuitPoint, p2: CircuitPoint, p3: CircuitPoint, t: number,
  ): { x: number; y: number } {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
  }

  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(12, Math.ceil(segLen * 300));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const pt = catmullPoint(p0, p1, p2, p3, t);
      const prev = result[result.length - 1];
      if (prev) totalLen += Math.hypot(pt.x - prev.x, pt.y - prev.y);
      result.push({ x: pt.x, y: pt.y, len: totalLen });
    }
  }
  if (closed && result.length > 1) {
    const last = result[result.length - 1];
    const first = result[0];
    totalLen += Math.hypot(first.x - last.x, first.y - last.y);
    result.push({ x: first.x, y: first.y, len: totalLen });
  }
  return result;
}

function getSplinePos(spline: { x: number; y: number; len: number }[], progress: number): { x: number; y: number } {
  if (spline.length < 2) return { x: 0, y: 0 };
  const totalLen = spline[spline.length - 1].len;
  if (totalLen <= 0) return { x: spline[0].x, y: spline[0].y };
  const target = (((progress % 1) + 1) % 1) * totalLen;
  for (let i = 0; i < spline.length - 1; i++) {
    if (spline[i + 1].len >= target) {
      const segLen = spline[i + 1].len - spline[i].len;
      const t = segLen > 0 ? (target - spline[i].len) / segLen : 0;
      return { x: lerp(spline[i].x, spline[i + 1].x, t), y: lerp(spline[i].y, spline[i + 1].y, t) };
    }
  }
  return { x: spline[0].x, y: spline[0].y };
}

function formatLapTime(sec: number): string {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

function formatGap(gap: number): string {
  if (gap <= 0) return "LEADER";
  return `+${gap.toFixed(1)}`;
}

function formatSector(sec: number, best: number): { text: string; cls: string } {
  if (!sec || sec <= 0) return { text: "", cls: "" };
  if (best > 0 && sec <= best + 0.001) return { text: sec.toFixed(3), cls: "text-purple-400 font-bold" };
  return { text: sec.toFixed(3), cls: "" };
}

function seededRng(seed: number): () => number {
  let s = Math.abs(Math.floor(seed)) || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

/* ------------------------------------------------------------------ */
/*  Demo mock generator                                                */
/* ------------------------------------------------------------------ */

const DEMO_DRIVERS = [
  { id: "verstappen", grid: 1, pace: 0.96 }, { id: "norris", grid: 2, pace: 0.98 },
  { id: "leclerc", grid: 3, pace: 0.97 }, { id: "hamilton", grid: 4, pace: 0.95 },
  { id: "piastri", grid: 5, pace: 0.99 }, { id: "russell", grid: 6, pace: 0.94 },
  { id: "alonso", grid: 7, pace: 0.92 }, { id: "sainz", grid: 8, pace: 0.93 },
  { id: "gasly", grid: 9, pace: 0.91 }, { id: "tsunoda", grid: 10, pace: 0.90 },
  { id: "stroll", grid: 11, pace: 0.89 }, { id: "perez", grid: 12, pace: 0.88 },
  { id: "albon", grid: 13, pace: 0.87 }, { id: "lawson", grid: 14, pace: 0.86 },
  { id: "hulkenberg", grid: 15, pace: 0.85 }, { id: "bottas", grid: 16, pace: 0.84 },
  { id: "zhou", grid: 17, pace: 0.83 }, { id: "magnussen", grid: 18, pace: 0.82 },
  { id: "ricciardo", grid: 19, pace: 0.81 }, { id: "sargeant", grid: 20, pace: 0.80 },
];

function generateDemoState(lap: number, totalLaps: number): TimingData {
  const baseLapTimes = DEMO_DRIVERS.map((m) => LAP_TIME_BASE + (1 - m.pace) * 2.8);
  const cumTimes = DEMO_DRIVERS.map((meta, i) => {
    const blt = baseLapTimes[i];
    let cum = 0;
    const fullLaps = Math.floor(lap);
    for (let l = 0; l < fullLaps; l++) cum += blt + (seededRng(l * 100 + i * 7)() - 0.5) * 0.5;
    cum += blt * (lap - fullLaps);
    return cum;
  });

  const dnfLaps = DEMO_DRIVERS.map((_, i) => {
    const rr = seededRng(i * 31 + 99);
    return lap > 5 && rr() < 0.005 ? Math.floor(5 + rr() * (lap - 5)) : -1;
  });

  const indices = DEMO_DRIVERS.map((_, i) => i);
  indices.sort((a, b) => {
    if (dnfLaps[a] >= 0 && dnfLaps[b] < 0) return 1;
    if (dnfLaps[a] < 0 && dnfLaps[b] >= 0) return -1;
    return cumTimes[a] - cumTimes[b];
  });

  const firstAlive = indices.find((i) => dnfLaps[i] < 0);
  const leaderCum = firstAlive !== undefined ? cumTimes[firstAlive] : 0;
  const aliveCount = indices.filter((i) => dnfLaps[i] < 0).length;

  const progressFrac = lap - Math.floor(lap);

  const drivers: DriverTiming[] = indices.map((origIdx, posIdx) => {
    const meta = DEMO_DRIVERS[origIdx];
    const isDNF = dnfLaps[origIdx] >= 0;
    const pos = isDNF ? aliveCount + 1 : posIdx + 1;
    const gap = isDNF ? 0 : cumTimes[origIdx] - leaderCum;
    const gapProportion = gap / LAP_TIME_BASE;
    const trackProgress = isDNF ? 0 : ((progressFrac - gapProportion) % 1 + 1) % 1;

    const blt = baseLapTimes[origIdx];
    const rr = seededRng(origIdx * 17 + Math.floor(lap));
    const lt = blt + (rr() - 0.5) * 0.4;
    const s1 = lt * SECTOR_WEIGHTS[0] + (rr() - 0.5) * 0.15;
    const s2 = lt * SECTOR_WEIGHTS[1] + (rr() - 0.5) * 0.12;

    const d = driverById(meta.id, 2025);
    const ctor = d ? constructorById(d.teamId, 2025) : null;

    return {
      driverId: meta.id,
      shortName: d?.shortName ?? meta.id.toUpperCase().slice(0, 3),
      number: d?.number ?? 0,
      teamId: d?.teamId ?? "",
      teamColor: ctor?.colors.primary ?? "#888888",
      teamName: ctor?.name ?? "",
      position: pos,
      gridPos: meta.grid,
      gapToLeader: gap,
      lastLap: !isDNF && lap > 1 ? lt : 0,
      bestLap: !isDNF ? blt - 0.3 + rr() * 0.2 : 0,
      sector1: s1,
      sector2: s2,
      sector3: lt - s1 - s2,
      tireLife: Math.max(0, 100 - ((lap % 20) / 20) * 100),
      trackProgress,
      status: isDNF ? "dnf" : "running",
      isPlayer: false,
      retiredReason: isDNF
        ? ["Mechanical failure", "Engine failure", "Gearbox failure", "Collision"][Math.floor(seededRng(origIdx * 53)() * 4)]
        : undefined,
    };
  });

  return { lap, totalLaps, flagState: "green", weather: "dry", drivers };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  state: SimulationState;
  live?: LiveView | null;
  active?: boolean;
  onSetLiveSpeed?: (speed: number) => void;
  onResume?: () => void;
  onPause?: () => void;
}

export default function LiveTimingScreen({ state, live, active = true, onSetLiveSpeed, onResume, onPause }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  const [circuit, setCircuit] = useState<CircuitData | null>(null);
  const [speed, setSpeed] = useState(2);
  const speedRef = useRef(2);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [demoLap, setDemoLap] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);

  const animRef = useRef<number>(0);
  const lastTickRef = useRef(0);
  const prevLiveLapRef = useRef(0);
  const prevGapsRef = useRef<Record<string, number>>({});
  const lastLapTimesRef = useRef<Record<string, number>>({});
  const bestLapTimesRef = useRef<Record<string, number>>({});
  const demoLapRef = useRef(0);
  useEffect(() => { demoLapRef.current = demoLap; }, [demoLap]);

  const isLiveActive = !!live && !live.done && !live.paused;
  const isLivePaused = !!live && live.paused && !live.done;
  const isLiveDone = !!live && live.done;
  const hasLiveRace = !!live;
  const isRunning = isLiveActive || demoRunning;

  useEffect(() => {
    fetch("/assets/circuit-coordinates/australian-gp-track-racing-line-sectors.json")
      .then((r) => r.json())
      .then((data: CircuitData) => setCircuit(data))
      .catch(console.error);
  }, []);

  const raceSpline = useMemo(() => (circuit ? buildCatmullRom(circuit.racingLine, circuit.closeLoop) : []), [circuit]);
  const pitSpline = useMemo(() => (circuit?.pitlane ? buildCatmullRom(circuit.pitlane, false) : []), [circuit]);

  /* Real sector cuts derived from the circuit JSON: the racing-line point
   * flagged is_sector/sector:N marks where sector N STARTS. Arc-length
   * fractions on the spline give cut1 (end of sector 1 = start of sector 2)
   * and cut2 (end of sector 2 = start of sector 3). Falls back to
   * SECTOR_WEIGHTS when the JSON has no markers. */
  const sectorCuts = useMemo((): [number, number] => {
    const fallback: [number, number] = [
      SECTOR_WEIGHTS[0],
      SECTOR_WEIGHTS[0] + SECTOR_WEIGHTS[1],
    ];
    if (!circuit || raceSpline.length < 2) return fallback;
    const totalLen = raceSpline[raceSpline.length - 1].len;
    if (totalLen <= 0) return fallback;
    const n = circuit.racingLine.length;
    const cutFor = (sectorNum: number): number | null => {
      const idx = circuit.racingLine.findIndex(
        (p) => p.is_sector && p.sector === sectorNum,
      );
      if (idx < 0) return null;
      const frac = idx / n;
      const si = Math.min(
        raceSpline.length - 1,
        Math.floor(frac * (raceSpline.length - 1)),
      );
      return raceSpline[si].len / totalLen;
    };
    const cut1 = cutFor(2);
    const cut2 = cutFor(3);
    return [cut1 ?? fallback[0], cut2 ?? fallback[1]];
  }, [circuit, raceSpline]);
  const entryPitstop = useMemo(() => circuit?.racingLine.find((p) => p.label === "Entry pitstop") ?? null, [circuit]);
  const outroPitstopGate = useMemo(() => circuit?.racingLine.find((p) => p.label === "Outro pitstop gate") ?? null, [circuit]);
  const finishLine = useMemo(() => circuit?.racingLine.find((p) => p.label === "Finish line") ?? null, [circuit]);
  const pitstopLanes = useMemo(
    () => (circuit?.pitlane ?? []).filter((p) => p.label === "Pitstop lane"),
    [circuit],
  );

  const boundingBox = useMemo(() => {
    if (!circuit) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const p of [...circuit.racingLine, ...(circuit.pitlane ?? [])]) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    const pad = 0.06;
    return { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad };
  }, [circuit]);

  const canvasAspect = useMemo(() => {
    const w = boundingBox.maxX - boundingBox.minX;
    const h = boundingBox.maxY - boundingBox.minY;
    return w / h || 1.5;
  }, [boundingBox]);

  const CANVAS_W = 700;
  const CANVAS_H = Math.round(CANVAS_W / canvasAspect);

  const totalLaps = useMemo(() => {
    if (hasLiveRace) return live.laps;
    const track = trackById("albert-park-track", state.season);
    return track?.laps ?? 58;
  }, [hasLiveRace, live, state.season]);

  /* -- Lap-time tracking for live data -- */
  useEffect(() => {
    if (!live) return;
    const currentLapInt = Math.floor(live.currentLap);
    if (currentLapInt > prevLiveLapRef.current && prevLiveLapRef.current > 0) {
      for (const [id, car] of Object.entries(live.cars)) {
        const prevGap = prevGapsRef.current[id];
        if (prevGap !== undefined && !live.retired?.[id]) {
          const approxLap = LAP_TIME_BASE + (car.pos - 1) * 0.12 + (car.gapS - prevGap) * 0.08;
          const clamped = Math.max(74, Math.min(82, approxLap));
          lastLapTimesRef.current[id] = clamped;
          if (!bestLapTimesRef.current[id] || clamped < bestLapTimesRef.current[id]) {
            bestLapTimesRef.current[id] = clamped;
          }
        }
        prevGapsRef.current[id] = car.gapS;
      }
    }
    if (currentLapInt !== prevLiveLapRef.current) prevLiveLapRef.current = currentLapInt;
  }, [live, live?.currentLap, live?.cars]);

  useEffect(() => {
    prevGapsRef.current = {};
    lastLapTimesRef.current = {};
    bestLapTimesRef.current = {};
    prevLiveLapRef.current = 0;
  }, [live?.roundIdx]);

  /* -- Interpolation refs for canvas + table animation -- */
  const lastTickTimeRef = useRef(performance.now());
  const lastTickLapRef = useRef(0);

  useEffect(() => {
    if (live) {
      lastTickTimeRef.current = performance.now();
      lastTickLapRef.current = live.currentLap;
    }
  }, [live?.currentLap]);

  /* Freeze interpolation at the pause moment so dots & the table don't
   * creep forward (or snap to the next tick position) while paused.
   * The refs above keep updating on engine ticks even when the tab is
   * hidden (component stays mounted), so returning to Live Timing shows
   * the dots exactly where they should be. */
  const pausedFracRef = useRef<number | null>(null);
  useEffect(() => {
    if (live?.paused) {
      const elapsed = (performance.now() - lastTickTimeRef.current) / 1000;
      const expectedInterval = LAP_TIME_BASE / speedRef.current;
      pausedFracRef.current = Math.min(elapsed / expectedInterval, 1.0);
    } else {
      pausedFracRef.current = null;
      /* Re-anchor the interpolation clock so the dots resume from the CURRENT
       * lap instead of jumping to a full lap ahead: after a long pause the
       * elapsed time since the last tick would otherwise clamp to 1 and park
       * every dot at the finish line until the next engine tick. */
      lastTickTimeRef.current = performance.now();
    }
  }, [live?.paused, live?.manualPaused]);

  /* Current interpolated lap — shared by the canvas draw and the table. */
  const getInterpLap = useCallback(() => {
    if (!hasLiveRace) return demoLapRef.current;
    if (pausedFracRef.current != null) {
      return lastTickLapRef.current + pausedFracRef.current;
    }
    const now = performance.now();
    const elapsed = (now - lastTickTimeRef.current) / 1000;
    const expectedInterval = LAP_TIME_BASE / speedRef.current;
    return lastTickLapRef.current + Math.min(elapsed / expectedInterval, 1.0);
  }, [hasLiveRace]);

  /* -- Timing data for the TABLE. Refreshed on engine ticks AND a ~7Hz
   *    interval so sector progress keeps filling while visible. -- */
  const [timingData, setTimingData] = useState<TimingData>(() => generateDemoState(0, totalLaps));

  const refreshTiming = useCallback(() => {
    if (hasLiveRace && live) {
      setTimingData(buildFromLive(live, state, lastLapTimesRef.current, bestLapTimesRef.current, getInterpLap(), sectorCuts));
    } else {
      setTimingData(generateDemoState(demoLapRef.current, totalLaps));
    }
  }, [hasLiveRace, live, state, totalLaps, getInterpLap, sectorCuts]);

  useEffect(() => {
    if (!active || (!hasLiveRace && !demoRunning)) return;
    refreshTiming();
    const id = setInterval(refreshTiming, 150);
    return () => clearInterval(id);
  }, [active, hasLiveRace, demoRunning, refreshTiming]);

  /* -- Play radio notification when pit wall opens automatically -- */
  const wasPausedRef = useRef(false);
  useEffect(() => {
    if (live && live.paused && !wasPausedRef.current && !live.manualPaused) {
      wasPausedRef.current = true;
      audioManager.playSfx(SFX.radioNotification, 0.4);
    }
    if (live && !live.paused) wasPausedRef.current = false;
  }, [live?.paused, live?.manualPaused]);

  /* -- Canvas drawing (runs at 60fps, no React state for interpolation) -- */
  const mapCoord = useCallback(
    (px: number, py: number, w: number, h: number) => {
      const { minX, maxX, minY, maxY } = boundingBox;
      return { x: ((px - minX) / (maxX - minX)) * w, y: ((py - minY) / (maxY - minY)) * h };
    },
    [boundingBox],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !raceSpline.length) return;

    /* Compute interpolated lap for smooth dot positions.
     * The fraction advances from 0→1 over exactly one tick interval
     * (LAP_TIME_BASE / speed seconds), so dots traverse the full track
     * between engine ticks. No clamp — getSplinePos wraps via modulo. */
    const interpLap = getInterpLap();

    /* Build timing data for dots */
    let dotTiming: TimingData;
    if (hasLiveRace) {
      dotTiming = buildFromLive(live!, state, lastLapTimesRef.current, bestLapTimesRef.current, interpLap, sectorCuts);
    } else {
      dotTiming = generateDemoState(demoLapRef.current, totalLaps);
    }

    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(dpr, dpr);

    const drawW = w / dpr;
    const drawH = h / dpr;
    const toCanvas = (px: number, py: number) => mapCoord(px, py, drawW, drawH);

    /* ---- Race line: black border underlay + sector-coloured line ---- */
    const [cut1, cut2] = sectorCuts;
    const totalLen = raceSpline[raceSpline.length - 1]?.len ?? 1;
    // Black border (wider underlay, full loop)
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    let first = true;
    for (const p of raceSpline) {
      const { x, y } = toCanvas(p.x, p.y);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Sector-coloured line on top: stroke contiguous runs of the same sector
    ctx.lineWidth = 3;
    const sectAt = (i: number) =>
      raceSpline[i].len / totalLen < cut1 ? 0 : raceSpline[i].len / totalLen < cut2 ? 1 : 2;
    let runStart = 0;
    for (let i = 0; i < raceSpline.length - 1; i++) {
      const cur = sectAt(i);
      const next = sectAt(i + 1);
      if (cur !== next) {
        ctx.strokeStyle = SECTOR_LINE_COLORS[cur];
        ctx.beginPath();
        for (let k = runStart; k <= i; k++) {
          const { x, y } = toCanvas(raceSpline[k].x, raceSpline[k].y);
          if (k === runStart) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        runStart = i + 1;
      }
    }
    ctx.strokeStyle = SECTOR_LINE_COLORS[sectAt(raceSpline.length - 1)];
    ctx.beginPath();
    for (let k = runStart; k < raceSpline.length; k++) {
      const { x, y } = toCanvas(raceSpline[k].x, raceSpline[k].y);
      if (k === runStart) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* ---- Pitlane ---- */
    if (entryPitstop && outroPitstopGate && pitSpline.length > 0) {
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      const ep = toCanvas(entryPitstop.x, entryPitstop.y);
      ctx.moveTo(ep.x, ep.y);
      const firstPit = pitSpline[0];
      ctx.lineTo(toCanvas(firstPit.x, firstPit.y).x, toCanvas(firstPit.x, firstPit.y).y);
      for (let i = 1; i < pitSpline.length; i++) {
        const pp = toCanvas(pitSpline[i].x, pitSpline[i].y);
        ctx.lineTo(pp.x, pp.y);
      }
      const op = toCanvas(outroPitstopGate.x, outroPitstopGate.y);
      ctx.lineTo(op.x, op.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    /* ---- Finish line (checkered pattern) ---- */
    if (finishLine) {
      const fl = toCanvas(finishLine.x, finishLine.y);
      // Compute perpendicular direction from track tangent
      const flIdx = circuit?.racingLine.indexOf(finishLine) ?? 0;
      const prevPt = circuit?.racingLine[(flIdx - 1 + (circuit?.racingLine.length ?? 1)) % (circuit?.racingLine.length ?? 1)];
      const nextPt = circuit?.racingLine[(flIdx + 1) % (circuit?.racingLine.length ?? 1)];
      let nx = 0, ny = -1;
      if (prevPt && nextPt) {
        const tdx = (nextPt.x - prevPt.x) * drawW;
        const tdy = (nextPt.y - prevPt.y) * drawH;
        const tlen = Math.hypot(tdx, tdy) || 1;
        nx = -tdy / tlen;
        ny = tdx / tlen;
      }
      const squareSize = 3;
      const halfLen = 10;
      const halfWidth = 4;
      for (let row = -1; row <= 1; row++) {
        for (let col = -2; col <= 2; col++) {
          const isBlack = (row + col) % 2 === 0;
          ctx.fillStyle = isBlack ? "#ffffff" : "#1e293b";
          const sx = fl.x + nx * (col * squareSize) + ny * (row * squareSize) - squareSize / 2;
          const sy = fl.y + ny * (col * squareSize) - nx * (row * squareSize) - squareSize / 2;
          ctx.fillRect(sx, sy, squareSize, squareSize);
        }
      }
    }

    /* ---- Sector boundary ticks (use real cuts from circuit JSON) ---- */
    const sectorTick = (frac: number, label: string, color: string) => {
      if (!raceSpline.length) return;
      const si = Math.min(
        raceSpline.length - 1,
        Math.max(0, Math.floor(frac * (raceSpline.length - 1))),
      );
      const sp = raceSpline[si];
      const prev = raceSpline[Math.max(0, si - 1)];
      const next = raceSpline[Math.min(raceSpline.length - 1, si + 1)];
      const tdx = (next.x - prev.x) * drawW;
      const tdy = (next.y - prev.y) * drawH;
      const tlen = Math.hypot(tdx, tdy) || 1;
      const nx = -tdy / tlen;
      const ny = tdx / tlen;
      const { x, y } = toCanvas(sp.x, sp.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 2]);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + nx * 8, y + ny * 8);
      ctx.lineTo(x - nx * 8, y - ny * 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + nx * 11, y + ny * 11);
    };
    sectorTick(sectorCuts[0], "S2", SECTOR_LINE_COLORS[1]);
    sectorTick(sectorCuts[1], "S3", SECTOR_LINE_COLORS[2]);

    /* ---- Pit labels ---- */
    if (entryPitstop) {
      const ep = toCanvas(entryPitstop.x, entryPitstop.y);
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("PIT IN", ep.x, ep.y - 7);
    }
    if (outroPitstopGate) {
      const op = toCanvas(outroPitstopGate.x, outroPitstopGate.y);
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("PIT OUT", op.x, op.y - 7);
    }

    /* ---- Pitstop lane markers ---- */
    for (const pl of pitstopLanes) {
      const pp = toCanvas(pl.x, pl.y);
      ctx.fillStyle = "rgba(148,163,184,0.2)";
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* ---- Turn labels ---- */
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    circuit?.racingLine.forEach((cp) => {
      if (cp.is_turn && cp.turn_order) {
        const splineIdx = circuit.racingLine.indexOf(cp);
        const frac = splineIdx / circuit.racingLine.length;
        const si = Math.floor(frac * (raceSpline.length - 1));
        const sp = raceSpline[Math.min(si, raceSpline.length - 1)];
        if (sp) {
          const { x, y } = toCanvas(sp.x, sp.y);
          ctx.fillStyle = "#0f172a";
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 2.5;
          ctx.strokeText(`T${cp.turn_order}`, x, y - 12);
          ctx.fillStyle = "#f8fafc";
          ctx.fillText(`T${cp.turn_order}`, x, y - 12);
        }
      }
    });

    /* ---- Driver dots ---- */
    const sortedDrivers = [...dotTiming.drivers].sort((a, b) => a.position - b.position);
    sortedDrivers.forEach((d) => {
      if (d.status === "dnf" || d.status === "retired") {
        const si = Math.floor((((d.trackProgress % 1) + 1) % 1) * (raceSpline.length - 1));
        const sp = raceSpline[Math.min(si, raceSpline.length - 1)];
        if (sp) {
          const { x, y } = toCanvas(sp.x, sp.y);
          ctx.fillStyle = "rgba(239,68,68,0.4)";
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 3, y - 3);
          ctx.lineTo(x + 3, y + 3);
          ctx.moveTo(x + 3, y - 3);
          ctx.lineTo(x - 3, y + 3);
          ctx.stroke();
          ctx.font = "bold 6px sans-serif";
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(d.shortName.slice(0, 3), x, y + 11);
        }
        return;
      }

      const pos = getSplinePos(raceSpline, d.trackProgress);
      const { x: cx, y: cy } = toCanvas(pos.x, pos.y);
      const r = d.isPlayer ? 7 : 5;

      /* Outer glow */
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = d.teamColor + "22";
      ctx.fill();

      /* Dot */
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = d.teamColor;
      ctx.fill();
      ctx.strokeStyle = d.isPlayer ? "#fbbf24" : "#e2e8f0";
      ctx.lineWidth = d.isPlayer ? 2 : 1;
      ctx.stroke();

      /* Number */
      ctx.font = `bold ${d.isPlayer ? 7 : 6}px system-ui, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(d.number), cx, cy);
    });

    ctx.restore();
  }, [raceSpline, pitSpline, circuit, mapCoord, entryPitstop, outroPitstopGate, finishLine, pitstopLanes, sectorCuts, getInterpLap, hasLiveRace, live, state, totalLaps]);

  /* -- Canvas sizing: fit the circuit into its card while ALWAYS preserving
   *    the track's aspect ratio (a fixed 700px height would squish the
   *    layout to a narrow strip on smaller windows, which reads as a broken
   *    top-down view). The backing store tracks CSS size × devicePixelRatio,
   *    and redraw() derives its draw size from the buffer, so no resample. */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = mapWrapRef.current;
    if (!canvas || !wrap) return;
    const fit = () => {
      const avail = Math.max(120, wrap.clientWidth - 16);
      const w = Math.round(Math.min(CANVAS_W, avail));
      const h = Math.round(w / canvasAspect);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [CANVAS_W, canvasAspect, redraw]);

  /* -- Animation loop (stops when the tab is hidden so it doesn't burn
   *    CPU in the background — engine ticks still update the refs above) -- */
  useEffect(() => {
    if (!active || (!isLiveActive && !isLiveDone && !demoRunning)) {
      redraw();
      return;
    }
    let running = true;
    const tick = () => {
      if (!running) return;
      redraw();
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [active, isLiveActive, isLiveDone, isLivePaused, demoRunning, redraw]);

  /* -- Demo animation loop -- */
  useEffect(() => {
    if (hasLiveRace || !demoRunning || !active) return;
    if (!raceSpline.length) return;
    let running = true;
    const tick = (now: number) => {
      if (!running) return;
      const dt = lastTickRef.current > 0 ? (now - lastTickRef.current) / 1000 : 0;
      lastTickRef.current = now;
      if (dt > 0 && dt < 0.5) {
        const lapInc = (dt * speed) / LAP_TIME_BASE;
        setDemoLap((prev) => {
          const next = prev + lapInc;
          if (next >= totalLaps) { setDemoRunning(false); return totalLaps; }
          return next;
        });
      }
      animRef.current = requestAnimationFrame(tick);
    };
    lastTickRef.current = performance.now();
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [raceSpline.length, speed, totalLaps, hasLiveRace, demoRunning, active]);

  /* -- Speed control -- */
  const handleSpeedChange = useCallback((s: number) => {
    setSpeed(s);
    speedRef.current = s;
    setShowSpeedMenu(false);
    onSetLiveSpeed?.(s);
  }, [onSetLiveSpeed]);

  const handleStartDemo = () => { setDemoLap(0); setDemoRunning(true); };
  const handleStopDemo = () => { setDemoRunning(false); setDemoLap(0); };

  /* -- Render -- */
  const currentLap = Math.floor(timingData.lap);
  const flagColor = FLAG_COLORS[timingData.flagState] ?? "#22c55e";
  const flagLabel = FLAG_LABELS[timingData.flagState] ?? "GREEN FLAG";

  const sortedDrivers = [...timingData.drivers].sort((a, b) => {
    if (a.status === "dnf" && b.status !== "dnf") return 1;
    if (a.status !== "dnf" && b.status === "dnf") return -1;
    return a.position - b.position;
  });

  const overallBestSector = useMemo(() => {
    const best = [Infinity, Infinity, Infinity];
    for (const d of timingData.drivers) {
      if (d.sector1 > 0 && d.sector1 < best[0]) best[0] = d.sector1;
      if (d.sector2 > 0 && d.sector2 < best[1]) best[1] = d.sector2;
      if (d.sector3 > 0 && d.sector3 < best[2]) best[2] = d.sector3;
    }
    return best;
  }, [timingData.drivers]);

  /* ---- Empty state: race not started, no demo ---- */
  if (!hasLiveRace && !demoRunning && demoLap === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-raised/20 py-16 text-center">
        <div className="text-lg font-bold text-ink-soft mb-1">No race in progress</div>
        <div className="text-sm text-ink-faint mb-4">
          Head to the Race tab and click <b>Run GP</b> to start a race.<br />
          Choose <b>Follow LIVE TIMING</b> to watch the action here.
        </div>
        <button
          onClick={handleStartDemo}
          className="rounded border border-telemetry/50 bg-telemetry/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-telemetry hover:bg-telemetry/20"
        >
          Or try a demo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status banner */}
      {hasLiveRace ? (
        isLiveDone ? (
          <div className="rounded-md border border-ink-faint/30 bg-raised/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-ink-faint">
            Race finished — final classification shown below
          </div>
        ) : isLivePaused ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-signal bg-signal/10 px-3 py-2 shadow-lg shadow-signal/10">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-signal" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-signal">
              {live?.manualPaused ? "Race paused" : "Pit wall — decision required"}
            </span>
            <span className="text-[10px] text-ink-faint">
              Lap {currentLap}/{timingData.totalLaps} · {live?.grandPrix}
            </span>
            {onResume && (
              <button
                onClick={onResume}
                className="ml-auto rounded bg-signal/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-signal"
              >
                ▶ Resume
              </button>
            )}
          </div>
        ) : null
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-ink-faint/30 bg-raised/30 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-widest text-ink-faint">
            {demoRunning ? "Demo running" : "No race in progress"}
          </span>
          <span className="ml-auto flex gap-1">
            {!demoRunning ? (
              <button onClick={handleStartDemo} className="rounded border border-telemetry/50 bg-telemetry/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-telemetry hover:bg-telemetry/20">
                Demo
              </button>
            ) : (
              <button onClick={handleStopDemo} className="rounded border border-signal/50 bg-signal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-signal hover:bg-signal/20">
                Stop
              </button>
            )}
          </span>
        </div>
      )}

      {/* Circuit Map */}
      <div className={`relative rounded-lg border border-hairline bg-void overflow-hidden ${!isRunning && !isLiveDone && !isLivePaused ? "opacity-60" : ""}`}>
        <div
          className="flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider"
          style={{ backgroundColor: flagColor + "22", color: flagColor, borderBottom: `1px solid ${flagColor}44` }}
        >
          <span>LAP {currentLap} / {timingData.totalLaps}</span>
          <span className="hidden sm:inline">{WEATHER_LABELS[timingData.weather] ?? "Dry"}</span>
          <span>{flagLabel}</span>
        </div>

        <div ref={mapWrapRef} className="relative flex items-center justify-center p-2">
          {!circuit ? (
            <div className="text-sm text-ink-faint" style={{ minHeight: CANVAS_H }}>Loading circuit...</div>
          ) : (
            <canvas ref={canvasRef} className="block max-w-full rounded" />
          )}

          {/* Controls overlay */}
          {(isLiveActive || isLivePaused || demoRunning) && (
            <div className="absolute right-3 top-3 flex items-center gap-2">
              {isLiveActive && onPause && (
                <button
                  onClick={() => { audioManager.playSfx(SFX.boxBox, 0.5); onPause(); }}
                  className="rounded-md border border-hairline bg-surface/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur hover:border-signal"
                >
                  ⏸ Pause
                </button>
              )}
              {(isLiveActive || demoRunning) && (
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu((v) => !v)}
                    className="rounded-md border border-hairline bg-surface/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur hover:border-telemetry"
                  >
                    {speed}x Speed
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute right-0 top-full mt-1 z-10 rounded-md border border-hairline bg-surface py-1 shadow-xl">
                      {SPEED_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          className={`flex w-full items-center px-3 py-1.5 text-[11px] hover:bg-raised ${s === speed ? "font-bold text-telemetry" : "text-ink-soft"}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Legend overlay */}
          {circuit && (
            <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-col gap-1 rounded-md border border-hairline bg-void/80 px-2.5 py-2 text-[10px] text-ink-soft backdrop-blur">
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-ink-faint">Track legend</span>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-4 rounded" style={{ backgroundColor: "#00CBFF" }} />
                <span>Sector 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-4 rounded" style={{ backgroundColor: "#FE0101" }} />
                <span>Sector 2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-4 rounded" style={{ backgroundColor: "#FEDE01" }} />
                <span>Sector 3</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm border border-ink-faint bg-void bg-[repeating-conic-gradient(#fff_0_25%,#1e293b_0_50%)] bg-[length:4px_4px]" />
                <span>Finish</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-0 w-4 border-t border-dashed border-slate-400" />
                <span>Pitlane</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timing Tower */}
      <div className="rounded-lg border border-hairline bg-surface overflow-x-auto">
        {/* Desktop header */}
        <div className="hidden sm:grid sm:grid-cols-[32px_68px_minmax(110px,1.4fr)_56px_64px_64px] md:grid-cols-[32px_68px_minmax(140px,1.5fr)_56px_64px_64px_44px_44px_44px] gap-x-1 gap-y-0 border-b border-hairline bg-raised/50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-ink-faint">
          <span>POS</span>
          <span>DRV</span>
          <span>TEAM</span>
          <span className="text-right">GAP</span>
          <span className="text-right">LAST</span>
          <span className="text-right">BEST</span>
          <span className="text-right hidden md:table-cell">S1</span>
          <span className="text-right hidden md:table-cell">S2</span>
          <span className="text-right hidden md:table-cell">S3</span>
        </div>

        {/* Mobile header */}
        <div className="grid grid-cols-[28px_64px_1fr_48px] gap-x-1 gap-y-0 border-b border-hairline bg-raised/50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-ink-faint sm:hidden">
          <span>POS</span>
          <span>DRV</span>
          <span className="text-right">GAP</span>
          <span className="text-right">LAST</span>
        </div>

        {/* Driver rows */}
        <div className="divide-y divide-hairline/50">
          {sortedDrivers.map((d) => {
            const [cut1, cut2] = sectorCuts;
            const prevSectorsAvail = d.lastLap > 0;
            const s1Done = prevSectorsAvail && d.trackProgress >= cut1;
            const s2Done = prevSectorsAvail && d.trackProgress >= cut2;
            const s1 = s1Done ? formatSector(d.sector1, overallBestSector[0]) : { text: "", cls: "" };
            const s2 = s2Done ? formatSector(d.sector2, overallBestSector[1]) : { text: "", cls: "" };
            const s3 = prevSectorsAvail ? formatSector(d.sector3, overallBestSector[2]) : { text: "", cls: "" };
            const isDNF = d.status === "dnf" || d.status === "retired";
            const lastTime = prevSectorsAvail ? formatLapTime(d.lastLap) : "";
            const bestTime = d.bestLap > 0 ? formatLapTime(d.bestLap) : "";

            return (
              <div key={d.driverId}>
                {/* Mobile row */}
                <div
                  className={`grid grid-cols-[28px_64px_1fr_48px] gap-x-1 items-center px-3 py-1.5 text-xs sm:hidden ${
                    d.isPlayer ? "bg-telemetry/8" : ""
                  } ${isDNF ? "opacity-50" : ""}`}
                >
                  <span className={`font-bold num-data ${d.position <= 3 ? "text-amber-400" : ""}`}>{d.position}</span>
                  <span className="font-mono font-bold text-[11px] whitespace-nowrap" style={{ color: d.teamColor }}>
                    {d.shortName}
                  </span>
                  <span className="text-right font-mono text-[11px] whitespace-nowrap">{formatGap(d.gapToLeader)}</span>
                  <span className="text-right font-mono text-[10px] text-ink-soft whitespace-nowrap">{lastTime}</span>
                </div>

                {/* Tablet/Desktop row */}
                <div
                  className={`hidden sm:grid sm:grid-cols-[32px_68px_minmax(110px,1.4fr)_56px_64px_64px] md:grid-cols-[32px_68px_minmax(140px,1.5fr)_56px_64px_64px_44px_44px_44px] gap-x-1 items-center px-3 py-1.5 text-xs ${
                    d.isPlayer ? "bg-telemetry/8" : "hover:bg-raised/30"
                  } ${isDNF ? "opacity-50" : ""}`}
                >
                  <span className={`font-bold num-data ${d.position <= 3 ? "text-amber-400" : ""}`}>{d.position}</span>
                  <span className="font-mono font-bold text-[11px] whitespace-nowrap" style={{ color: d.teamColor }}>
                    {d.shortName}
                  </span>
                  <span className="truncate text-[10px] text-ink-soft sm:text-[11px]">
                    {d.isPlayer && "\u2B50 "}
                    {d.teamName}
                    {isDNF && <span className="ml-1 text-signal font-bold">DNF</span>}
                  </span>
                  <span className="text-right font-mono text-[11px] whitespace-nowrap">{formatGap(d.gapToLeader)}</span>
                  <span className="text-right font-mono text-[10px] text-ink-soft whitespace-nowrap">{lastTime}</span>
                  <span className="text-right font-mono text-[10px] text-ink-soft whitespace-nowrap">{bestTime}</span>
                  <span className={`text-right font-mono text-[10px] hidden md:table-cell whitespace-nowrap ${s1.cls || "text-ink-faint"}`}>{s1.text}</span>
                  <span className={`text-right font-mono text-[10px] hidden md:table-cell whitespace-nowrap ${s2.cls || "text-ink-faint"}`}>{s2.text}</span>
                  <span className={`text-right font-mono text-[10px] hidden md:table-cell whitespace-nowrap ${s3.cls || "text-ink-faint"}`}>{s3.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Build timing data from real LiveView                                */
/* ------------------------------------------------------------------ */

function buildFromLive(
  live: LiveView,
  state: SimulationState,
  lastLapMap: Record<string, number>,
  bestLapMap: Record<string, number>,
  interpolatedLap?: number,
  cuts?: [number, number],
): TimingData {
  const t = state.team;
  const playerIds = t ? [t.driver1Id, t.driver2Id] : live.playerIds;
  const [cut1, cut2] = cuts ?? [
    SECTOR_WEIGHTS[0],
    SECTOR_WEIGHTS[0] + SECTOR_WEIGHTS[1],
  ];

  const lapFrac = interpolatedLap ?? live.currentLap;
  const leaderProgress = ((lapFrac % 1) + 1) % 1;

  const drivers: DriverTiming[] = Object.entries(live.cars).map(([driverId, car]) => {
    const d = driverById(driverId, state.season);
    const ctor = d ? constructorById(d.teamId, state.season) : null;
    const isRetired = !!live.retired?.[driverId];
    const isPlayer = playerIds.includes(driverId);

    const gapS = car.gapS;
    const gapProportion = gapS / LAP_TIME_BASE;
    const trackProgress = isRetired ? 0 : ((leaderProgress - gapProportion) % 1 + 1) % 1;

    const lastLap = lastLapMap[driverId] ?? 0;
    const bestLap = bestLapMap[driverId] ?? 0;
    const approxS1 = lastLap > 0 ? lastLap * cut1 + (car.pos * 0.04) : 0;
    const approxS2 = lastLap > 0 ? lastLap * (cut2 - cut1) + (car.pos * 0.03) : 0;

    const gridEntry = live.qualifying.find((q) => q.driverId === driverId);

    return {
      driverId,
      shortName: d?.shortName ?? driverId.toUpperCase().slice(0, 3),
      number: d?.number ?? 0,
      teamId: d?.teamId ?? "",
      teamColor: ctor?.colors.primary ?? "#888888",
      teamName: ctor?.name ?? "",
      position: car.pos,
      gridPos: gridEntry?.gridPosition ?? car.pos,
      gapToLeader: isRetired ? 0 : gapS,
      lastLap,
      bestLap,
      sector1: approxS1,
      sector2: approxS2,
      sector3: lastLap > 0 ? lastLap - approxS1 - approxS2 : 0,
      tireLife: car.tire,
      trackProgress,
      status: isRetired ? "dnf" : "running",
      isPlayer,
      retiredReason: live.retireReasons?.[driverId],
    };
  });

  let flagState: TimingData["flagState"] = "green";
  if (live.done) flagState = "chequered";
  else if (live.paused) flagState = "yellow";

  return {
    lap: live.currentLap,
    totalLaps: live.laps,
    flagState,
    weather: live.weather,
    drivers,
  };
}
