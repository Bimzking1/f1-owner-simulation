import { useEffect, useRef, useState } from "react";
import type { RaceWeekendResult, SimulationState } from "@/simulation/types";
import { driverById, trackById } from "@/data";
import { Button, Card, Empty, Img, Meter, Modal, Tag } from "@/ui/kit";
import { ratingTone } from "@/ui/ratings";
import { driverImage } from "@/data/assets";
import { NextRaceCard } from "./parts";

interface Props {
  state: SimulationState;
  onRunRound: () => void;
}

export function RaceTab({ state, onRunRound }: Props) {
  const t = state.team!;
  const done = state.completedRounds >= state.calendar.length;
  const next = state.calendar[state.round];
  const last = state.lastWeekend;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Race Weekend">
          {done ? (
            <Empty>Season complete — see the final report.</Empty>
          ) : (
            <div>
              <p className="text-sm text-ink-soft">
                {next ? `Next: ${next.grandPrix} (Round ${state.round + 1})` : "Calendar complete."}
              </p>
              <div className="mt-3">
                <Button onClick={onRunRound}>Run the {next?.grandPrix ?? ""} →</Button>
              </div>
              <p className="mt-4 text-xs text-ink-faint">
                The weekend simulates qualifying{next?.sprint && state.gameLength !== "short" ? ", a sprint" : ""} and the race with
                lap-level events, weather and mechanical risk. Results land in the news feed.
              </p>
            </div>
          )}
        </Card>
        {last && <ResultCard weekend={last} season={state.season} />}
        {last && <WeekendClassification state={state} weekend={last} />}
        {next && <NextRaceCard track={next} round={state.round + 1} />}
      </div>
      <div className="space-y-4">
        <Card title="Components">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">Engine</span>
              <span className="tabular">{t.components.engine.condition.toFixed(1)}% · age {t.components.engine.age}</span>
            </div>
            <Meter value={t.components.engine.condition} tone={ratingTone(t.components.engine.condition)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">Gearbox</span>
              <span className="tabular">{t.components.gearbox.condition.toFixed(1)}% · age {t.components.gearbox.age}</span>
            </div>
            <Meter value={t.components.gearbox.condition} tone={ratingTone(t.components.gearbox.condition)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">Pit crew</span>
              <span className="tabular">{t.pitCrew}</span>
            </div>
            <Meter value={t.pitCrew} tone={ratingTone(t.pitCrew)} />
          </div>
        </Card>
        {t.upgrades.length > 0 && (
          <Card title="Development in progress">
            <div className="space-y-2">
              {t.upgrades.map((u) => (
                <div key={u.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{u.name}</span>
                    <span className="tabular text-ink-faint">{u.remainingRaces}/{u.totalRaces} races left</span>
                  </div>
                  <Meter value={((u.totalRaces - u.remainingRaces) / u.totalRaces) * 100} tone="elite" />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function WeekendClassification({ state, weekend }: { state: SimulationState; weekend: RaceWeekendResult }) {
  const t = state.team!;
  const [view, setView] = useState<"quali" | "race" | "sprint">("quali");

  const racePosOf: Record<string, string> = {};
  for (const e of weekend.race) racePosOf[e.driverId] = e.dnf ? "DNF" : `P${e.position}`;

  const quali = [...weekend.qualifying].sort((a, b) => a.gridPosition - b.gridPosition);
  const race = [...weekend.race].sort((a, b) => {
    const ap = a.position ?? 999;
    const bp = b.position ?? 999;
    if (ap === bp && a.dnf !== b.dnf) return a.dnf ? 1 : -1;
    return ap - bp;
  });

  const mine = (id: string) => id === t.driver1Id || id === t.driver2Id;
  const nameOf = (id: string) => driverById(id, state.season)?.shortName ?? id;

  const tabBtn = (v: "quali" | "race" | "sprint", label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      className={`rounded-sm border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
        view === v ? "border-signal/40 bg-signal/15 text-signal" : "border-transparent bg-raised/40 text-ink-soft hover:bg-raised hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Card
      title="Weekend classification"
      right={
        <div className="flex gap-1">
          {tabBtn("quali", `Qualifying ${quali.length ? `(${quali.length})` : ""}`)}
          {tabBtn("race", `Race ${race.length ? `(${race.length})` : ""}`)}
          {weekend.sprint && weekend.sprint.length > 0 && tabBtn("sprint", `Sprint (${weekend.sprint.length})`)}
        </div>
      }
    >
      <div className="max-h-80 divide-y divide-hairline/60 overflow-auto">
        {view === "quali" &&
          quali.map((q) => (
            <div key={q.driverId} className={`flex items-center gap-2 py-1 text-sm ${mine(q.driverId) ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="w-8 tabular text-ink-faint">P{q.gridPosition}</span>
              <span className="min-w-0 flex-1 truncate">{nameOf(q.driverId)}</span>
              <span className="w-16 text-right text-[11px] tabular text-ink-faint">→ {racePosOf[q.driverId] ?? "—"}</span>
            </div>
          ))}
        {view === "race" &&
          race.map((r) => (
            <div key={r.driverId} className={`flex items-center gap-2 py-1 text-sm ${mine(r.driverId) ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="w-20 tabular text-ink-faint">
                Q{r.gridPosition}→{r.dnf ? "DNF" : `P${r.position}`}
              </span>
              <span className="min-w-0 flex-1 truncate">{nameOf(r.driverId)}</span>
              <span className="text-[11px] text-ink-faint">
                {r.fastestLap ? "fastest lap" : r.dnf && r.dnfReason ? r.dnfReason : ""}
              </span>
              <span className="w-8 text-right tabular text-ink-soft">{r.points > 0 ? r.points : ""}</span>
            </div>
          ))}
        {view === "sprint" &&
          weekend.sprint!.map((r) => (
            <div key={r.driverId} className={`flex items-center gap-2 py-1 text-sm ${mine(r.driverId) ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="w-12 tabular text-ink-faint">P{r.position}</span>
              <span className="min-w-0 flex-1 truncate">{nameOf(r.driverId)}</span>
              <span className="w-8 text-right tabular text-ink-soft">{r.points > 0 ? r.points : ""}</span>
            </div>
          ))}
      </div>
    </Card>
  );
}

function ResultCard({ weekend, season }: { weekend: RaceWeekendResult; season: number }) {
  const [open, setOpen] = useState(false);
  const track = trackById(weekend.trackId);
  const finishes = weekend.playerEntries.map((p) => (p.dnf ? 999 : p.position));
  const best = finishes.length ? Math.min(...finishes) : 999;
  const hl = raceHighlights(weekend, season);
  const gridOf = (driverId: string) => weekend.qualifying.find((q) => q.driverId === driverId)?.gridPosition;
  return (
    <Card
      title={`Round ${weekend.round} — ${track?.grandPrix ?? weekend.trackId} result`}
      right={<Button small variant="ghost" onClick={() => setOpen(true)}>Replay</Button>}
    >
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="grid flex-1 gap-2 text-sm sm:grid-cols-2">
          {weekend.playerEntries.map((p) => {
            const d = driverById(p.driverId, season);
            const grid = gridOf(p.driverId);
            return (
              <div key={p.driverId} className="flex items-center gap-2 rounded-md border border-hairline bg-raised/50 px-2 py-1.5">
                <Img src={d ? driverImage(d.id, season) : ""} alt={d?.shortName ?? p.driverId} className="h-6 w-6 rounded-sm object-cover" />
                <span className="min-w-0 flex-1 truncate">{d?.shortName ?? p.driverId}</span>
                {grid != null && <span className="text-[10px] tabular text-ink-faint">Q{grid}</span>}
                {p.dnf ? (
                  <Tag tone="signal">DNF</Tag>
                ) : (
                  <span className={`tabular font-bold ${best === p.position ? "text-positive" : ""}`}>
                    P{p.position} · {p.points} pts
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {track && (
          <div className="shrink-0 lg:w-44">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-sm bg-white p-1.5">
              <Img
                src={track.image}
                alt={`${track.name} circuit layout`}
                fallback={<span className="text-[10px] text-ink-faint">Layout</span>}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="mt-1 text-center text-[10px] uppercase tracking-widest text-ink-faint">
              R{weekend.round} circuit map
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 mb-3 grid grid-cols-2 gap-2 text-xs lg:grid-cols-4">
        <div className="rounded-md border border-hairline bg-raised/40 p-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Fastest lap</div>
          {hl.fastest ? (
            <>
              <div className="mt-0.5 font-display font-bold">{hl.fastest.name}</div>
              <div className="tabular text-telemetry">{fmtLap(hl.fastest.time)}</div>
            </>
          ) : (
            <div className="mt-0.5 text-ink-faint">—</div>
          )}
        </div>
        <div className="rounded-md border border-elite/30 bg-elite/10 p-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-elite">Driver of the day</div>
          {hl.dotd ? (
            <>
              <div className="mt-0.5 font-display font-bold">{hl.dotd.name}</div>
              <div className="text-[10px] text-ink-faint">{hl.dotd.note}</div>
            </>
          ) : (
            <div className="mt-0.5 text-ink-faint">—</div>
          )}
        </div>
        <div className="rounded-md border border-hairline bg-raised/40 p-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Most gained</div>
          {hl.gained && hl.gained.delta > 0 ? (
            <>
              <div className="mt-0.5 font-display font-bold">{hl.gained.name}</div>
              <div className="text-[10px] tabular text-positive">+{hl.gained.delta} positions</div>
            </>
          ) : (
            <div className="mt-0.5 text-ink-faint">none</div>
          )}
        </div>
        <div className="rounded-md border border-hairline bg-raised/40 p-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Most lost</div>
          {hl.lost && hl.lost.delta < 0 ? (
            <>
              <div className="mt-0.5 font-display font-bold">{hl.lost.name}</div>
              <div className="text-[10px] tabular text-signal">{hl.lost.delta} positions</div>
            </>
          ) : (
            <div className="mt-0.5 text-ink-faint">none</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-faint">
        <span>Weather: {weekend.weather}</span>
        <span>Expected P{weekend.expected.min}–P{weekend.expected.max}</span>
        <span>Chaos {weekend.chaos}</span>
        <span>
          Car {weekend.breakdown.car} · Driver {weekend.breakdown.driver} · Luck {weekend.breakdown.luck}
        </span>
      </div>
      {open && <RaceResultReplay weekend={weekend} season={season} onClose={() => setOpen(false)} />}
    </Card>
  );
}
function RaceResultReplay({ weekend, season, onClose }: { weekend: RaceWeekendResult; season: number; onClose: () => void }) {
  const events = [...weekend.events].sort((a, b) => a.lap - b.lap);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIdx((i) => {
        if (i >= events.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 500);
    return () => clearInterval(id);
  }, [playing, events.length]);

  useEffect(() => {
    const rows = logRef.current?.querySelectorAll<HTMLElement>("[data-event]");
    const active = rows?.[idx];
    active?.scrollIntoView({ block: "nearest", behavior: playing ? "smooth" : "auto" });
  }, [idx, playing]);

  const finished = idx >= events.length - 1;

  return (
    <Modal open onClose={onClose} title={`Replay — Round ${weekend.round}`} wide>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-widest text-ink-faint">
              Full race log · event {idx + 1}/{events.length}
            </div>
            <div className="flex gap-2">
              <Button small variant="ghost" onClick={() => setIdx(0)}>⏮</Button>
              <Button small variant="ghost" onClick={() => setPlaying(!playing)}>
                {playing ? "Pause" : "Play"}
              </Button>
              <Button small variant="ghost" onClick={() => setIdx((i) => Math.max(0, i - 1))}>‹</Button>
              <Button small variant="ghost" onClick={() => setIdx((i) => Math.min(events.length - 1, i + 1))}>›</Button>
            </div>
          </div>
          <div ref={logRef} className="max-h-[26rem] space-y-1 overflow-y-auto rounded-md border border-hairline bg-void p-3">
            {events.length === 0 && <p className="text-sm text-ink-faint">No events.</p>}
            {events.map((e, i) => {
              const active = i === idx;
              const seen = i <= idx;
              return (
                <button
                  key={`${e.lap}-${i}`}
                  type="button"
                  data-event
                  onClick={() => setIdx(i)}
                  className={`block w-full rounded-sm border px-2 py-1.5 text-left transition ${
                    active
                      ? "border-signal bg-signal/10"
                      : seen
                        ? "border-transparent bg-raised/40"
                        : "border-transparent opacity-45"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag tone={sev(e.severity)}>Lap {e.lap}</Tag>
                    <span className="text-[10px] uppercase tracking-wider text-ink-faint">{e.type}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{e.text}</p>
                </button>
              );
            })}
          </div>
          {finished && (
            <div className="mt-2 text-center">
              <Tag tone="positive">Full weekend done — classification below</Tag>
            </div>
          )}
        </div>
        <div>
          <Card title="Race classification" pad={false}>
            <div className="max-h-[26rem] divide-y divide-hairline/60 overflow-auto">
              {weekend.race.map((r) => {
                const d = driverById(r.driverId, season);
                return (
                  <div key={r.driverId} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <span className={`w-12 tabular ${r.dnf ? "text-signal" : "text-ink-faint"}`}>
                      Q{r.gridPosition}→{r.dnf ? "DNF" : r.position}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{d?.shortName ?? r.driverId}</span>
                    <span className="text-[11px] text-ink-faint">{r.dnfReason && r.dnf ? r.dnfReason : r.fastestLap ? "fastest lap" : ""}</span>
                    <span className="tabular text-ink-soft">{r.points > 0 ? `${r.points} pts` : ""}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          {weekend.sprint && weekend.sprint.length > 0 && (
            <Card title="Sprint" pad={false} className="mt-3">
              <div className="divide-y divide-hairline/60">
                {weekend.sprint.slice(0, 8).map((r) => {
                  const d = driverById(r.driverId, season);
                  return (
                    <div key={r.driverId} className="flex items-center gap-2 px-3 py-1 text-sm">
                      <span className="w-6 tabular text-ink-faint">{r.position ?? "DNF"}</span>
                      <span className="min-w-0 flex-1 truncate">{d?.shortName ?? r.driverId}</span>
                      <span className="tabular text-ink-soft">{r.points > 0 ? `${r.points} pts` : ""}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-faint">
            <span>Weather: {weekend.weather}</span>
            <span>Forecast confidence: {weekend.forecast.confidence}</span>
            {weekend.forecast.window && <span>Rain window: {weekend.forecast.window}</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function sev(s: string): "signal" | "telemetry" | "positive" | "caution" {
  if (s === "danger") return "signal";
  if (s === "success") return "positive";
  if (s === "warning") return "caution";
  return "telemetry";
}

function fmtLap(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = seconds - m * 60;
  return `${m}:${sec.toFixed(3).padStart(6, "0")}`;
}

interface RaceHighlights {
  fastest: { name: string; time: number } | null;
  dotd: { name: string; note: string } | null;
  gained: { name: string; delta: number } | null;
  lost: { name: string; delta: number } | null;
}

/** Fastest lap, DOTD (effort score: low-rated + good result wins), most gained / lost places. */
function raceHighlights(weekend: RaceWeekendResult, season: number): RaceHighlights {
  const nameOf = (id: string) => driverById(id, season)?.shortName ?? id;
  const flEntry = weekend.race.find((e) => e.fastestLap);
  const finished = weekend.race.filter((e) => !e.dnf && e.position != null);

  let gained: RaceHighlights["gained"] = null;
  let lost: RaceHighlights["lost"] = null;
  let dotd: RaceHighlights["dotd"] = null;
  let bestScore = -Infinity;

  for (const e of finished) {
    const d = driverById(e.driverId, season);
    const overall = d?.overall ?? 70;
    const delta = e.gridPosition - e.position!;
    if (delta > (gained?.delta ?? -Infinity)) gained = { name: nameOf(e.driverId), delta };
    if (delta < (lost?.delta ?? Infinity)) lost = { name: nameOf(e.driverId), delta };
    const score = delta * 2 + e.points * 1.5 + (100 - overall) * 0.4;
    if (score > bestScore) {
      bestScore = score;
      const note =
        delta > 0
          ? `P${e.gridPosition} → P${e.position} (+${delta})`
          : e.points > 0
            ? `P${e.position} · ${e.points} pts from P${e.gridPosition}`
            : `solid P${e.position} finish`;
      dotd = { name: nameOf(e.driverId), note };
    }
  }

  return {
    fastest: flEntry?.bestLapSeconds != null ? { name: nameOf(flEntry.driverId), time: flEntry.bestLapSeconds } : null,
    dotd,
    gained,
    lost,
  };
}