import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Point {
  x: number;
  y: number;
  label: string | null;
  labelType: LabelType | null;
  turnOrder: number | null;
  path: "race" | "pitlane";
}

type LabelType =
  | "turn"
  | "finish_line"
  | "entry_pitstop"
  | "pitstop_lane"
  | "stop_paddock_area"
  | "outro_pitstop_gate"
  | "sector_1"
  | "sector_2"
  | "sector_3";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const POINT_R = 7;

const LABELS: Record<LabelType, (n?: number) => string> = {
  turn: (n) => `Turn ${n}`,
  finish_line: () => "Finish line",
  entry_pitstop: () => "Entry pitstop",
  pitstop_lane: () => "Pitstop lane",
  stop_paddock_area: () => "Stop paddock area",
  outro_pitstop_gate: () => "Outro pitstop gate",
  sector_1: () => "Sector 1 boundary",
  sector_2: () => "Sector 2 boundary",
  sector_3: () => "Sector 3 boundary",
};

const SHORT_LABELS: Record<LabelType, (n?: number) => string> = {
  turn: (n) => `T${n}`,
  finish_line: () => "FL",
  entry_pitstop: () => "IN",
  pitstop_lane: () => "PIT",
  stop_paddock_area: () => "PAD",
  outro_pitstop_gate: () => "OUT",
  sector_1: () => "S1",
  sector_2: () => "S2",
  sector_3: () => "S3",
};

const DOT_COLORS: Record<LabelType, string> = {
  turn: "#f5a623",
  finish_line: "#ffffff",
  entry_pitstop: "#a78bfa",
  pitstop_lane: "#a78bfa",
  stop_paddock_area: "#a78bfa",
  outro_pitstop_gate: "#a78bfa",
  sector_1: "#00CBFF",
  sector_2: "#FE0101",
  sector_3: "#FEDE01",
};

const LABEL_MENU_ITEMS: { type: LabelType; icon: string; shortcut?: string }[] =
  [
    { type: "turn", icon: "\u{1F536}", shortcut: "auto #" },
    { type: "finish_line", icon: "\u{1F3C1}" },
    { type: "entry_pitstop", icon: "\u2B07\uFE0F" },
    { type: "pitstop_lane", icon: "\u{1F527}" },
    { type: "stop_paddock_area", icon: "\u{1F17F}\uFE0F" },
    { type: "outro_pitstop_gate", icon: "\u2B06\uFE0F" },
    { type: "sector_1", icon: "\u{1F7E3}" },
    { type: "sector_2", icon: "\u{1F7E4}" },
    { type: "sector_3", icon: "\u{1F7E0}" },
  ];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function round(v: number) {
  return Math.round(v * 1000) / 1000;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TrackTracerScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [closeLoop, setCloseLoop] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [imgSize, setImgSize] = useState<string>("\u2014");
  const [hasImage, setHasImage] = useState(false);
  const [drawingMode, setDrawingMode] = useState<"race" | "pitlane">("race");

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    dotIndex: number;
  } | null>(null);

  // Modal state
  const [modal, setModal] = useState<
    | { kind: "turn"; dotIndex: number; value: number }
    | { kind: "delete"; dotIndex: number }
    | null
  >(null );

  // Refs for imperative canvas state
  const imgRef = useRef<HTMLImageElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const closeLoopRef = useRef(false);
  const draggingRef = useRef(-1);
  const hasDraggedRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const lastClickIndexRef = useRef(-1);

  // Derived: next turn number from points
  const nextTurnNum = (() => {
    let max = 0;
    for (const p of points) {
      if (p.labelType === "turn" && p.turnOrder != null && p.turnOrder > max)
        max = p.turnOrder;
    }
    return max + 1;
  })();

  // Keep refs in sync for imperative canvas access
  useEffect(() => {
    pointsRef.current = points;
    closeLoopRef.current = closeLoop;
  });

  /* -------------------------------------------------------------- */
  /*  Canvas redraw (imperative)                                     */
  /* -------------------------------------------------------------- */

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;

    const w = canvas.width;
    const h = canvas.height;
    const pts = pointsRef.current;
    const cl = closeLoopRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const racePts = pts.filter((p) => p.path === "race");
    const pitPts = pts.filter((p) => p.path === "pitlane");

    // Draw race line, colored by sector between cut points.
    // Segment k (point k → point k+1) inherits the sector of the last
    // boundary cut at or before k (default sector 1 before the first cut).
    const segSector: number[] = [];
    if (racePts.length > 0) {
      const K = cl && racePts.length > 2 ? racePts.length : racePts.length - 1;
      let active = 1;
      for (let k = 0; k < K; k++) {
        if (racePts[k].labelType === "sector_1") active = 1;
        else if (racePts[k].labelType === "sector_2") active = 2;
        else if (racePts[k].labelType === "sector_3") active = 3;
        segSector.push(active);
      }
      const hasCuts = segSector.some((s) => s !== 1) || racePts.some((p) => p.labelType === "sector_1");
      if (!hasCuts) {
        ctx.strokeStyle = "#29d3ff";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        racePts.forEach((p, i) => {
          const cx = p.x * w;
          const cy = p.y * h;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        if (cl && racePts.length > 2) {
          ctx.lineTo(racePts[0].x * w, racePts[0].y * h);
        }
        ctx.stroke();
      } else {
        const sectorColors: Record<number, string> = {
          1: "#00CBFF",
          2: "#FE0101",
          3: "#FEDE01",
        };
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        for (const sect of [1, 2, 3]) {
          ctx.strokeStyle = sectorColors[sect];
          ctx.beginPath();
          let inPath = false;
          for (let k = 0; k < segSector.length; k++) {
            if (segSector[k] !== sect) {
              inPath = false;
              continue;
            }
            const p1 = racePts[k];
            const p2 = racePts[(k + 1) % racePts.length];
            if (!inPath) {
              ctx.moveTo(p1.x * w, p1.y * h);
              inPath = true;
            }
            ctx.lineTo(p2.x * w, p2.y * h);
          }
          ctx.stroke();
        }
      }
    }

    // Draw pitlane line (amber)
    if (pitPts.length > 0) {
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      pitPts.forEach((p, i) => {
        const cx = p.x * w;
        const cy = p.y * h;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw sector boundary markers (dashed perpendicular lines)
    const sectorTypes: LabelType[] = ["sector_1", "sector_2", "sector_3"];
    const sectorColors: Record<string, string> = {
      sector_1: "#22d3ee",
      sector_2: "#a78bfa",
      sector_3: "#f97316",
    };
    for (const st of sectorTypes) {
      const idx = racePts.findIndex((p) => p.labelType === st);
      if (idx < 0) continue;
      const p = racePts[idx];
      const cx = p.x * w;
      const cy = p.y * h;
      // Compute tangent from neighbors
      const prev = racePts[(idx - 1 + racePts.length) % racePts.length];
      const next = racePts[(idx + 1) % racePts.length];
      const dx = (next.x - prev.x) * w;
      const dy = (next.y - prev.y) * h;
      const len = Math.hypot(dx, dy) || 1;
      // Perpendicular unit vector
      const nx = -dy / len;
      const ny = dx / len;
      const halfLen = 14;
      ctx.strokeStyle = sectorColors[st] ?? "#ffffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx + nx * halfLen, cy + ny * halfLen);
      ctx.lineTo(cx - nx * halfLen, cy - ny * halfLen);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label
      const label = SHORT_LABELS[st]();
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = sectorColors[st] ?? "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, cx, cy - halfLen - 3);
    }

    // Draw all dots
    pts.forEach((p, i) => {
      const cx = p.x * w;
      const cy = p.y * h;
      const hasLabel = !!p.labelType;
      const isPit = p.path === "pitlane";

      let fillColor: string;
      if (isPit) {
        if (hasLabel) fillColor = DOT_COLORS[p.labelType!];
        else fillColor = "#b8860b";
      } else {
        if (i === 0 && !hasLabel) fillColor = "#3ddc84";
        else if (i === pts.length - 1 && !hasLabel) fillColor = "#ff4a2e";
        else if (hasLabel) fillColor = DOT_COLORS[p.labelType!];
        else fillColor = "#151920";
      }

      if (hasLabel) {
        ctx.beginPath();
        ctx.arc(cx, cy, POINT_R + 5, 0, Math.PI * 2);
        ctx.fillStyle = fillColor + "33";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, POINT_R, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = isPit ? "#f5a623" : "#29d3ff";
      ctx.lineWidth = 2;
      ctx.stroke();

      const shortLabel = hasLabel
        ? SHORT_LABELS[p.labelType!](p.turnOrder ?? undefined)
        : null;
      const displayText = shortLabel
        ? `${i} ${shortLabel}`
        : `${i}`;

      ctx.font = "bold 10px monospace";
      ctx.fillStyle = hasLabel ? fillColor : "#f0f2f5";
      ctx.fillText(displayText, cx + 10, cy - 8);

      if (p.labelType === "turn") {
        ctx.beginPath();
        ctx.arc(cx, cy, POINT_R + 2, 0, Math.PI * 2);
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }, []);

  /* -------------------------------------------------------------- */
  /*  Hit test                                                      */
  /* -------------------------------------------------------------- */

  const hitTest = useCallback((mx: number, my: number): number => {
    const canvas = canvasRef.current;
    const pts = pointsRef.current;
    if (!canvas) return -1;
    const w = canvas.width;
    const h = canvas.height;
    for (let i = pts.length - 1; i >= 0; i--) {
      const cx = pts[i].x * w;
      const cy = pts[i].y * h;
      if (Math.hypot(cx - mx, cy - my) <= POINT_R + 6) return i;
    }
    return -1;
  }, []);

  /* -------------------------------------------------------------- */
  /*  Context menu                                                  */
  /* -------------------------------------------------------------- */

  const showCtxMenu = useCallback(
    (x: number, y: number, dotIndex: number) => {
      setCtxMenu({ x, y, dotIndex });
    },
    [],
  );

  const hideCtxMenu = useCallback(() => {
    setCtxMenu(null);
  }, []);

  /* -------------------------------------------------------------- */
  /*  Label application                                             */
  /* -------------------------------------------------------------- */

  const applyLabel = useCallback(
    (dotIndex: number, labelType: LabelType, turnNum?: number) => {
      setPoints((prev) => {
        const next = [...prev];
        const p = { ...next[dotIndex] };
        if (labelType === "turn") {
          // Compute next turn number from the current points inside the updater
          let maxTurn = 0;
          for (const pt of prev) {
            if (pt.labelType === "turn" && pt.turnOrder != null && pt.turnOrder > maxTurn)
              maxTurn = pt.turnOrder;
          }
          const num = turnNum ?? maxTurn + 1;
          p.labelType = "turn";
          p.label = LABELS.turn(num);
          p.turnOrder = num;
        } else {
          p.labelType = labelType;
          p.label = LABELS[labelType]();
          p.turnOrder = null;
        }
        next[dotIndex] = p;
        return next;
      });
    },
    [],
  );

  /* -------------------------------------------------------------- */
  /*  Delete dot + reindex turns                                    */
  /* -------------------------------------------------------------- */

  const deleteDot = useCallback((dotIndex: number) => {
    setPoints((prev) => {
      const next = [...prev];
      const removed = next.splice(dotIndex, 1)[0];
      if (removed.turnOrder != null) {
        for (let i = 0; i < next.length; i++) {
          if (next[i].turnOrder != null && next[i].turnOrder! > removed.turnOrder) {
            const p = { ...next[i] };
            p.turnOrder = p.turnOrder! - 1;
            p.label = LABELS.turn(p.turnOrder);
            next[i] = p;
          }
        }
      }
      return next;
    });
  }, []);

  /* -------------------------------------------------------------- */
  /*  Canvas mouse events                                           */
  /* -------------------------------------------------------------- */

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!imgRef.current || e.button !== 0) return;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const hit = hitTest(cx, cy);

      const now = Date.now();
      if (
        hit >= 0 &&
        hit === lastClickIndexRef.current &&
        now - lastClickTimeRef.current < 350
      ) {
        lastClickTimeRef.current = 0;
        lastClickIndexRef.current = -1;
        showCtxMenu(e.clientX, e.clientY, hit);
        return;
      }
      lastClickTimeRef.current = now;
      lastClickIndexRef.current = hit;

      if (hit >= 0) {
        draggingRef.current = hit;
        hasDraggedRef.current = false;
      } else {
        const w = canvas.width;
        const h = canvas.height;
        const nx = round(cx / w);
        const ny = round(cy / h);
        setPoints((prev) => [
          ...prev,
          { x: nx, y: ny, label: null, labelType: null, turnOrder: null, path: drawingMode },
        ]);
      }
    },
    [hitTest, showCtxMenu, drawingMode],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingRef.current < 0 || !imgRef.current) return;
      hasDraggedRef.current = true;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const w = canvas.width;
      const h = canvas.height;
      const nx = round(Math.max(0, Math.min(1, cx / w)));
      const ny = round(Math.max(0, Math.min(1, cy / h)));
      setPoints((prev) => {
        const next = [...prev];
        next[draggingRef.current] = {
          ...next[draggingRef.current],
          x: nx,
          y: ny,
        };
        return next;
      });
    },
    [],
  );

  const onMouseUp = useCallback(() => {
    draggingRef.current = -1;
  }, []);

  /* -------------------------------------------------------------- */
  /*  Redraw on every state change                                  */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    redraw();
  }, [points, closeLoop, redraw]);

  /* -------------------------------------------------------------- */
  /*  Close ctx-menu on Escape                                      */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideCtxMenu();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [ctxMenu, hideCtxMenu]);

  /* -------------------------------------------------------------- */
  /*  File loading                                                  */
  /* -------------------------------------------------------------- */

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const image = new Image();
        image.onload = () => {
          imgRef.current = image;
          const maxW = Math.min(1100, window.innerWidth - 380);
          const scale = Math.min(1, maxW / image.width);
          const canvas = canvasRef.current!;
          canvas.width = image.width * scale;
          canvas.height = image.height * scale;
          setImgSize(`${image.width}\u00d7${image.height}`);
          setHasImage(true);
          setPoints([]);
        };
        image.src = ev.target!.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [],
  );

  /* -------------------------------------------------------------- */
  /*  Undo / Clear                                                  */
  /* -------------------------------------------------------------- */

  const undo = useCallback(() => {
    setPoints((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const clearAll = useCallback(() => {
    if (points.length > 0 && !confirm(`Clear all ${points.length} points?`)) return;
    setPoints([]);
  }, [points.length]);

  /* -------------------------------------------------------------- */
  /*  Context menu actions                                          */
  /* -------------------------------------------------------------- */

  const onCtxAction = useCallback(
    (action: LabelType | "delete") => {
      if (!ctxMenu) return;
      const idx = ctxMenu.dotIndex;
      hideCtxMenu();
      if (action === "delete") {
        setModal({ kind: "delete", dotIndex: idx });
      } else if (action === "turn") {
        const p = pointsRef.current[idx];
        setModal({
          kind: "turn",
          dotIndex: idx,
          value: p.turnOrder ?? nextTurnNum,
        });
      } else {
        applyLabel(idx, action);
      }
    },
    [ctxMenu, hideCtxMenu, applyLabel],
  );

  /* -------------------------------------------------------------- */
  /*  Modal confirm / cancel                                        */
  /* -------------------------------------------------------------- */

  const modalConfirm = useCallback(() => {
    if (!modal) return;
    if (modal.kind === "delete") {
      deleteDot(modal.dotIndex);
    } else if (modal.kind === "turn") {
      const num = parseInt(String(modal.value), 10);
      if (!isNaN(num) && num >= 1) {
        applyLabel(modal.dotIndex, "turn", num);
      }
    }
    setModal(null);
  }, [modal, deleteDot, applyLabel]);

  const modalCancel = useCallback(() => {
    setModal(null);
  }, []);

  // Enter/Escape for modal
  useEffect(() => {
    if (!modal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") modalConfirm();
      if (e.key === "Escape") modalCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modal, modalConfirm, modalCancel]);

  /* -------------------------------------------------------------- */
  /*  Copy / Download                                               */
  /* -------------------------------------------------------------- */

  const jsonText = (() => {
    const name = trackName.trim() || "untitled-track";

    const toObj = (p: Point) => ({
      x: p.x,
      y: p.y,
      label: p.label ?? null,
      is_turn: p.labelType === "turn",
      turn_order: p.turnOrder ?? null,
      is_sector: p.labelType?.startsWith("sector_") ?? false,
      sector: p.labelType === "sector_1" ? 1 : p.labelType === "sector_2" ? 2 : p.labelType === "sector_3" ? 3 : null,
    });

    const raceLine = points.filter((p) => p.path === "race").map(toObj);

    // Pitlane: auto-sort so entry_pitstop is first, outro_pitstop_gate is last
    const pitPoints = points.filter((p) => p.path === "pitlane");
    const entryIdx = pitPoints.findIndex((p) => p.labelType === "entry_pitstop");
    const outroIdx = pitPoints.findIndex((p) => p.labelType === "outro_pitstop_gate");
    const sortedPit = [...pitPoints];
    if (entryIdx > 0) {
      const [entry] = sortedPit.splice(entryIdx, 1);
      sortedPit.unshift(entry);
    }
    if (outroIdx >= 0) {
      const actualOutro = sortedPit.findIndex((p) => p.labelType === "outro_pitstop_gate");
      if (actualOutro >= 0 && actualOutro < sortedPit.length - 1) {
        const [outro] = sortedPit.splice(actualOutro, 1);
        sortedPit.push(outro);
      }
    }
    const pitLine = sortedPit.map(toObj);

    const obj: Record<string, unknown> = {
      track: name,
      closeLoop,
      racingLine: raceLine,
    };
    if (pitLine.length > 0) {
      obj.pitlane = pitLine;
    }
    return JSON.stringify(obj, null, 2);
  })();

  const copyJson = useCallback(() => {
    navigator.clipboard.writeText(jsonText);
  }, [jsonText]);

  const downloadJson = useCallback(() => {
    const name = (trackName.trim() || "untitled-track")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-racing-line.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [jsonText, trackName]);

  const raceCount = points.filter((p) => p.path === "race").length;
  const pitCount = points.filter((p) => p.path === "pitlane").length;
  const turnCount = points.filter((p) => p.labelType === "turn").length;
  const sectorCount = points.filter((p) => p.labelType?.startsWith("sector_")).length;

  /* -------------------------------------------------------------- */
  /*  Render                                                         */
  /* -------------------------------------------------------------- */

  return (
    <div className="flex h-screen flex-col bg-void text-ink font-sans">
      {/* ── Header ── */}
      <header className="flex items-center gap-4 border-b border-hairline px-5 py-3 flex-wrap">
        <div className="h-2 w-2 rounded-full bg-signal" />
        <h1 className="text-sm font-semibold uppercase tracking-widest">
          Track Racing-Line Tracer
        </h1>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            placeholder="track name (e.g. Suzuka)"
            className="w-[140px] rounded-md border border-hairline bg-raised px-2.5 py-1.5 text-xs font-mono text-ink outline-none focus:border-telemetry"
          />
          <label className="cursor-pointer rounded-md border border-transparent bg-telemetry px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#04222b]">
            Load track image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
          <button
            onClick={() => setDrawingMode((v) => (v === "race" ? "pitlane" : "race"))}
            className={`rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
              drawingMode === "pitlane"
                ? "border-caution bg-caution/15 text-caution"
                : "border-hairline bg-raised text-ink hover:border-ink-faint"
            }`}
          >
            {drawingMode === "race" ? "Mode: Race track" : "Mode: Pitlane"}
          </button>
          <button
            onClick={() => setCloseLoop((v) => !v)}
            className="rounded-md border border-hairline bg-raised px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink hover:border-ink-faint"
          >
            Close loop: {closeLoop ? "On" : "Off"}
          </button>
          <button
            onClick={undo}
            className="rounded-md border border-hairline bg-raised px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink hover:border-ink-faint"
          >
            Undo point
          </button>
          <button
            onClick={clearAll}
            className="rounded-md border border-hairline bg-raised px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink hover:border-ink-faint"
          >
            Clear all
          </button>
          <button
            onClick={copyJson}
            className="rounded-md border border-signal bg-signal px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:opacity-90"
          >
            Copy JSON
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex min-h-0 flex-1">
        {/* ── Canvas area ── */}
        <div
          ref={wrapRef}
          className="relative flex flex-1 items-start justify-center overflow-auto"
          style={{
            backgroundImage:
              "linear-gradient(45deg,#0d0f14 25%,transparent 25%),linear-gradient(-45deg,#0d0f14 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#0d0f14 75%),linear-gradient(-45deg,transparent 75%,#0d0f14 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition:
              "0 0,0 10px,10px -10px,-10px 0px",
          }}
        >
          {!hasImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center text-ink-faint">
              <div className="text-[15px] text-ink-soft">
                Load a track layout image to start tracing
              </div>
              <div className="text-xs leading-relaxed">
                Click along the racing line in order, start to finish.
                <br />
                Points auto-normalize to 0.0–1.0 regardless of image size.
                <br />
                <b>Double-click a dot</b> to label it (turn, pit entry, etc.).
              </div>
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
        </div>

        {/* ── Sidebar ── */}
        <aside className="flex w-[340px] flex-col border-l border-hairline bg-surface min-h-0">
          <div className="border-b border-hairline px-4 py-3.5">
            <h2 className="mb-2 text-[10px] font-mono uppercase tracking-[0.15em] text-ink-faint">
              How to use
            </h2>
            <p className="text-xs leading-relaxed text-ink-soft">
              1. Load a clean track-layout image.
              <br />
              2. Click points along the driving line, in the direction of
              travel. Use the <b>Mode</b> toggle to switch between race track
              and pitlane.
              <br />
              3. Drag any point to nudge it. <b>Undo</b> removes the last
              point. Toggle <b>Close loop</b> to connect start ↔ end.
              <br />
              4. <b>Double-click a dot</b> to label it as a turn, finish line,
              pit entry, or sector boundary. Mark the dot where <b>sector 2
              begins</b> as "Sector 2 boundary" and where <b>sector 3 begins</b>
              as "Sector 3 boundary" — the line colours itself cyan/purple/orange
              per sector automatically.
              <br />
              5. Copy the JSON — <code className="rounded bg-raised px-1 py-0.5 font-mono text-[10px] text-telemetry">racingLine[]</code> for the circuit, <code className="rounded bg-raised px-1 py-0.5 font-mono text-[10px] text-caution">pitlane[]</code> for the pit road. Sector boundaries marked as <code className="rounded bg-raised px-1 py-0.5 font-mono text-[10px] text-purple-400">is_sector: true</code>.
            </p>
          </div>
          <div className="border-b border-hairline px-4 py-3.5">
            <h2 className="mb-2 text-[10px] font-mono uppercase tracking-[0.15em] text-ink-faint">
              Live stats
            </h2>
            <div className="flex justify-between text-xs text-ink-soft">
              <span>Race points</span>
              <b className="font-mono text-ink">{raceCount}</b>
            </div>
            <div className="flex justify-between text-xs text-ink-soft">
              <span>Pitlane points</span>
              <b className="font-mono text-ink">{pitCount}</b>
            </div>
            <div className="flex justify-between text-xs text-ink-soft">
              <span>Image size</span>
              <b className="font-mono text-ink">{imgSize}</b>
            </div>
            <div className="flex justify-between text-xs text-ink-soft">
              <span>Loop closed</span>
              <b className="font-mono text-ink">{closeLoop ? "Yes" : "No"}</b>
            </div>
            <div className="flex justify-between text-xs text-ink-soft">
              <span>Turns labelled</span>
              <b className="font-mono text-ink">{turnCount}</b>
            </div>
            <div className="flex justify-between text-xs text-ink-soft">
              <span>Sector markers</span>
              <b className="font-mono text-ink">{sectorCount}</b>
            </div>
            {/* Sector colouring legend + validation */}
            <div className="mt-2.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-ink-soft">
                <span className="inline-block h-1.5 w-4 rounded" style={{ backgroundColor: "#00CBFF" }} />
                <span>sector 1 — before the S2 cut</span>
              </div>
              <div className="flex items-center gap-2 text-ink-soft">
                <span className="inline-block h-1.5 w-4 rounded" style={{ backgroundColor: "#FE0101" }} />
                <span>sector 2 — cut → next cut</span>
              </div>
              <div className="flex items-center gap-2 text-ink-soft">
                <span className="inline-block h-1.5 w-4 rounded" style={{ backgroundColor: "#FEDE01" }} />
                <span>sector 3 — cut → finish/wrap</span>
              </div>
              {(() => {
                const s2 = points.filter((p) => p.labelType === "sector_2").length;
                const s3 = points.filter((p) => p.labelType === "sector_3").length;
                if (!closeLoop) {
                  return (
                    <div className="rounded border border-caution/40 bg-caution/10 px-2 py-1 text-[10px] leading-snug text-caution">
                      Enable <b>Close loop</b> so sector colours can wrap back to sector 1.
                    </div>
                  );
                }
                if (s2 !== 1 || s3 !== 1) {
                  return (
                    <div className="rounded border border-caution/40 bg-caution/10 px-2 py-1 text-[10px] leading-snug text-caution">
                      Place exactly one <b>Sector 2 boundary</b> (end of sector 1) and one <b>Sector 3 boundary</b> (end of sector 2) to colour all three sectors. Currently: S2 cut {s2}, S3 cut {s3}.
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          <div className="flex flex-1 flex-col min-h-0 border-b border-hairline px-4 py-3.5">
            <h2 className="mb-2 text-[10px] font-mono uppercase tracking-[0.15em] text-ink-faint">
              Output JSON
            </h2>
            <pre className="flex-1 min-h-0 w-full overflow-auto whitespace-pre rounded-md border border-hairline bg-void p-3 font-mono text-[11px] text-positive">
              {jsonText}
            </pre>
          </div>
          <div className="flex gap-2 px-4 py-3">
            <button
              onClick={downloadJson}
              className="flex-1 rounded-md border border-hairline bg-raised px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink hover:border-ink-faint"
            >
              Download .json
            </button>
          </div>
        </aside>
      </main>

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <div
          className="ctx-menu fixed z-[100] min-w-[200px] rounded-lg border border-hairline bg-surface py-1.5 text-xs shadow-2xl"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <div className="border-b border-hairline px-3.5 pb-1.5 pt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint">
            Label dot #{ctxMenu.dotIndex}
          </div>

          {/* Turn item */}
          <button
            onClick={() => onCtxAction("turn")}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-ink-soft hover:bg-raised hover:text-ink"
          >
            <span className="w-[18px] text-center text-sm">
              {LABEL_MENU_ITEMS[0].icon}
            </span>
            <span className="flex-1">
              {points[ctxMenu.dotIndex]?.labelType === "turn"
                ? `Turn ${points[ctxMenu.dotIndex].turnOrder} (re-number)`
                : `Turn ${nextTurnNum}`}
            </span>
            <span className="text-[10px] font-mono text-ink-faint">
              {LABEL_MENU_ITEMS[0].shortcut}
            </span>
          </button>

          <div className="mx-0 my-1 h-px bg-hairline" />

          {/* Other labels */}
          {LABEL_MENU_ITEMS.slice(1).map((item) => (
            <button
              key={item.type}
              onClick={() => onCtxAction(item.type)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-ink-soft hover:bg-raised hover:text-ink"
            >
              <span className="w-[18px] text-center text-sm">{item.icon}</span>
              <span className="flex-1">{LABELS[item.type]()}</span>
            </button>
          ))}

          <div className="mx-0 my-1 h-px bg-hairline" />

          <button
            onClick={() => onCtxAction("delete")}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-signal hover:bg-[rgba(255,74,46,0.1)]"
          >
            <span className="w-[18px] text-center text-sm">✕</span>
            <span className="flex-1">Delete dot</span>
          </button>
        </div>
      )}

      {/* ── Modal overlay ── */}
      {modal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65"
          onClick={(e) => {
            if (e.target === e.currentTarget) modalCancel();
          }}
        >
          <div className="min-w-[320px] max-w-[420px] rounded-[10px] border border-hairline bg-surface p-6 shadow-2xl">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              {modal.kind === "turn"
                ? `Label dot #${modal.dotIndex} as Turn`
                : `Delete dot #${modal.dotIndex}${
                    points[modal.dotIndex]?.label
                      ? ` (${points[modal.dotIndex].label})`
                      : ""
                  }?`}
            </h3>
            <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
              {modal.kind === "turn"
                ? "Set the turn number for this point. Existing turns with the same number will not be affected."
                : modal.dotIndex < points.length - 1
                  ? `Dots ${modal.dotIndex + 1}+ will be renumbered down. This cannot be undone.`
                  : "This is the last dot. This cannot be undone."}
            </p>

            {modal.kind === "turn" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs text-ink-soft">
                  Turn number:
                </label>
                <input
                  type="number"
                  min={1}
                  value={modal.value}
                  onChange={(e) =>
                    setModal({ ...modal, value: parseInt(e.target.value, 10) })
                  }
                  className="w-20 rounded-md border border-hairline bg-raised px-2.5 py-1.5 font-mono text-sm text-ink outline-none focus:border-telemetry"
                  autoFocus
                />
              </div>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                onClick={modalCancel}
                className="min-w-[80px] rounded-md border border-hairline bg-raised px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink hover:border-ink-faint"
              >
                Cancel
              </button>
              <button
                onClick={modalConfirm}
                className={`min-w-[80px] rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                  modal.kind === "delete"
                    ? "border border-signal bg-[#5c1a1a] text-signal hover:bg-[#7a2020]"
                    : "border border-transparent bg-signal text-white hover:opacity-90"
                }`}
              >
                {modal.kind === "delete" ? "Delete" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
