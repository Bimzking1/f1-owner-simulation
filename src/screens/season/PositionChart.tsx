import { useEffect, useMemo, useState } from "react";
import type { RaceWeekendResult } from "@/simulation/types";
import { constructorById, driverById } from "@/data";
import { Button, Tag } from "@/ui/kit";

interface Props {
  weekend: Pick<RaceWeekendResult, "qualifying" | "race" | "lapOrder">;
  season: number;
  /** Controlled playback head (live race). Undefined → free playback UI. */
  liveLap?: number;
  /** Full race distance of this GP. While a race streams in, the x-axis spans
   *  the whole distance so the chart visibly fills up instead of rescaling. */
  raceLaps?: number;
  className?: string;
}

const EMPTY_ORDER: string[][] = [];

/** Lap-by-lap position movement chart — one polyline per driver from grid to
 *  chequered flag (or to the current lap while a race is live). */
export function PositionChart({ weekend, season, liveLap, raceLaps, className }: Props) {
  const lapOrder = weekend.lapOrder ?? EMPTY_ORDER;
  const dataLaps = Math.max(0, lapOrder.length - 1);
  const totalLaps = Math.max(raceLaps ?? 0, dataLaps);
  const [head, setHead] = useState(dataLaps);
  const [playing, setPlaying] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    if (!playing || liveLap !== undefined) return;
    const id = setInterval(() => {
      setHead((h) => {
        if (h >= dataLaps) {
          setPlaying(false);
          return h;
        }
        return h + 1;
      });
    }, 90);
    return () => clearInterval(id);
  }, [playing, dataLaps, liveLap]);

  const viewLap = liveLap ?? Math.min(head, dataLaps);

  const meta = useMemo(() => {
    const teamOf: Record<string, string> = {};
    for (const e of weekend.race) teamOf[e.driverId] = e.teamId;
    for (const e of weekend.qualifying) teamOf[e.driverId] ??= e.teamId;
    const drivers: {
      id: string;
      name: string;
      color: string;
      isPlayerSeat?: boolean;
      pts: { lap: number; pos: number }[];
    }[] = [];
    const seen = new Set<string>();
    for (let lap = 0; lap < lapOrder.length; lap++) {
      lapOrder[lap].forEach((id, i) => {
        let d = drivers.find((x) => x.id === id);
        if (!d) {
          const drv = driverById(id, season);
          const ctor = constructorById(teamOf[id], season);
          seen.add(id);
          d = {
            id,
            name: drv?.shortName ?? id,
            color: ctor?.colors.primary ?? "#888",
            pts: [],
          };
          drivers.push(d);
        }
        d.pts.push({ lap, pos: i + 1 });
      });
    }
    return { drivers: drivers.filter((d) => seen.has(d.id)), maxPos: Math.max(2, lapOrder[0]?.length ?? 20) };
  }, [lapOrder, season, weekend.race, weekend.qualifying]);

  if (lapOrder.length < 2) {
    return (
      <div className={`flex h-40 items-center justify-center text-xs text-ink-faint ${className ?? ""}`}>
        Chart available once the race is underway.
      </div>
    );
  }

  const W = 600;
  const H = 240;
  const pad = { l: 26, r: 10, t: 10, b: 18 };
  const x = (lap: number) => pad.l + (lap / Math.max(1, totalLaps)) * (W - pad.l - pad.r);
  const y = (pos: number) => pad.t + ((pos - 1) / (meta.maxPos - 1)) * (H - pad.t - pad.b);

  const orderAt = (lap: number): string[] => lapOrder[Math.min(lap, lapOrder.length - 1)] ?? [];
  const topAt = orderAt(viewLap).slice(0, 6);

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-widest text-ink-faint">
          Position movement · lap {viewLap}/{totalLaps}
          {liveLap !== undefined && <> <Tag tone="signal">LIVE</Tag></>}
        </div>
        {liveLap === undefined && (
          <div className="flex items-center gap-1">
            <Button small variant="ghost" onClick={() => { setHead(0); setPlaying(false); }}>
              ⏮
            </Button>
            <Button small variant="ghost" onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play"}
            </Button>
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none rounded-md border border-hairline bg-void">
        {[1, 5, 10, 15, 20].filter((p) => p <= meta.maxPos).map((p) => (
          <g key={p}>
            <line x1={pad.l} x2={W - pad.r} y1={y(p)} y2={y(p)} stroke="currentColor" className="text-hairline" strokeWidth="0.5" />
            <text x={4} y={y(p) + 3} fontSize="9" fill="currentColor" className="text-ink-faint">
              P{p}
            </text>
          </g>
        ))}
        {totalLaps > 0 &&
          [0.25, 0.5, 0.75].map((f) => {
            const lx = Math.round(totalLaps * f);
            return (
              <g key={f}>
                <line x1={x(lx)} x2={x(lx)} y1={pad.t} y2={H - pad.b} stroke="currentColor" className="text-hairline" strokeWidth="0.5" strokeDasharray="3 4" />
                <text x={x(lx)} y={H - 5} fontSize="9" textAnchor="middle" fill="currentColor" className="text-ink-faint">
                  L{lx}
                </text>
              </g>
            );
          })}

        {meta.drivers.map((d) => {
          const visible = d.pts.filter((p) => p.lap <= viewLap);
          if (visible.length < 2) return null;
          const dim = focus !== null && focus !== d.id;
          return (
            <polyline
              key={d.id}
              fill="none"
              stroke={d.color}
              strokeWidth={focus === d.id ? 3.5 : 2}
              opacity={dim ? 0.15 : 1}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={visible.map((p) => `${x(p.lap)},${y(p.pos)}`).join(" ")}
              style={{ cursor: "pointer" }}
              onClick={() => setFocus(focus === d.id ? null : d.id)}
            >
              <title>{`${d.name} — click to highlight`}</title>
            </polyline>
          );
        })}
      </svg>

      {liveLap === undefined && dataLaps > 0 && (
        <input
          type="range"
          min={0}
          max={dataLaps}
          value={viewLap}
          onChange={(e) => {
            setPlaying(false);
            setHead(Number(e.target.value));
          }}
          className="mt-1 w-full accent-telemetry"
          aria-label="Race lap scrubber"
        />
      )}

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {topAt.map((id, i) => {
          const d = meta.drivers.find((x) => x.id === id);
          if (!d) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFocus(focus === id ? null : id)}
              className={`flex items-center gap-1 text-[11px] transition ${focus === id ? "font-bold text-ink" : "text-ink-soft hover:text-ink"}`}
            >
              <span className="pos-num text-[10px] text-ink-faint">P{i + 1}</span>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
              {d.name}
            </button>
          );
        })}
      </div>
      {focus && (
        <div className="mt-1 text-[10px] text-ink-faint">
          Highlighting {meta.drivers.find((d) => d.id === focus)?.name} — click the line again to clear.
        </div>
      )}
    </div>
  );
}
