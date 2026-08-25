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
}

type LabelType =
  | "turn"
  | "finish_line"
  | "entry_pitstop"
  | "pitstop_lane"
  | "stop_paddock_area"
  | "outro_pitstop_gate";

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
};

const SHORT_LABELS: Record<LabelType, (n?: number) => string> = {
  turn: (n) => `T${n}`,
  finish_line: () => "FL",
  entry_pitstop: () => "IN",
  pitstop_lane: () => "PIT",
  stop_paddock_area: () => "PAD",
  outro_pitstop_gate: () => "OUT",
};

const DOT_COLORS: Record<LabelType, string> = {
  turn: "#f5a623",
  finish_line: "#ffffff",
  entry_pitstop: "#a78bfa",
  pitstop_lane: "#a78bfa",
  stop_paddock_area: "#a78bfa",
  outro_pitstop_gate: "#a78bfa",
};

const LABEL_MENU_ITEMS: { type: LabelType; icon: string; shortcut?: string }[] =
  [
    { type: "turn", icon: "\u{1F536}", shortcut: "auto #" },
    { type: "finish_line", icon: "\u{1F3C1}" },
    { type: "entry_pitstop", icon: "\u2B07\uFE0F" },
    { type: "pitstop_lane", icon: "\u{1F527}" },
    { type: "stop_paddock_area", icon: "\u{1F17F}\uFE0F" },
    { type: "outro_pitstop_gate", icon: "\u2B06\uFE0F" },
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

    if (pts.length > 0) {
      ctx.strokeStyle = "#29d3ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const cx = p.x * w;
        const cy = p.y * h;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      if (cl && pts.length > 2) {
        ctx.lineTo(pts[0].x * w, pts[0].y * h);
      }
      ctx.stroke();

      pts.forEach((p, i) => {
        const cx = p.x * w;
        const cy = p.y * h;
        const hasLabel = !!p.labelType;

        let fillColor: string;
        if (i === 0 && !hasLabel) fillColor = "#3ddc84";
        else if (i === pts.length - 1 && !hasLabel) fillColor = "#ff4a2e";
        else if (hasLabel) fillColor = DOT_COLORS[p.labelType!];
        else fillColor = "#151920";

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
        ctx.strokeStyle = "#29d3ff";
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
    }
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
          { x: nx, y: ny, label: null, labelType: null, turnOrder: null },
        ]);
      }
    },
    [hitTest, showCtxMenu],
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
    const racingLine = points.map((p) => ({
      x: p.x,
      y: p.y,
      label: p.label ?? null,
      is_turn: p.labelType === "turn",
      turn_order: p.turnOrder ?? null,
    }));
    return JSON.stringify(
      { track: name, pointCount: points.length, closeLoop, racingLine },
      null,
      2,
    );
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

  const turnCount = points.filter((p) => p.labelType === "turn").length;

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
              travel.
              <br />
              3. Drag any point to nudge it. <b>Undo</b> removes the last
              point. Toggle <b>Close loop</b> to connect start ↔ end.
              <br />
              4. <b>Double-click a dot</b> to label it as a turn, finish line,
              pit entry, etc.
              <br />
              5. Copy the JSON and paste it into your track data file as the{" "}
              <code className="rounded bg-raised px-1 py-0.5 font-mono text-[10px] text-telemetry">
                racingLine
              </code>{" "}
              array.
            </p>
          </div>
          <div className="border-b border-hairline px-4 py-3.5">
            <h2 className="mb-2 text-[10px] font-mono uppercase tracking-[0.15em] text-ink-faint">
              Live stats
            </h2>
            <div className="flex justify-between text-xs text-ink-soft">
              <span>Points placed</span>
              <b className="font-mono text-ink">{points.length}</b>
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
