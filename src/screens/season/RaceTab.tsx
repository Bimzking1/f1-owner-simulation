import { useEffect, useRef, useState } from "react";
import type { RaceWeekendResult, SimulationState } from "@/simulation/types";
import { driverById, trackById } from "@/data";
import { Button, Card, Empty, Img, Meter, Modal, Tag } from "@/ui/kit";
import { driverImage } from "@/data/assets";

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
        {last && <ResultCard weekend={last} />}
      </div>
      <div className="space-y-4">
        <Card title="Components">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">Engine</span>
              <span className="tabular">{t.components.engine.condition.toFixed(1)}% · age {t.components.engine.age}</span>
            </div>
            <Meter value={t.components.engine.condition} tone={t.components.engine.condition < 50 ? "signal" : "positive"} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">Gearbox</span>
              <span className="tabular">{t.components.gearbox.condition.toFixed(1)}% · age {t.components.gearbox.age}</span>
            </div>
            <Meter value={t.components.gearbox.condition} tone={t.components.gearbox.condition < 50 ? "signal" : "positive"} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-faint">Pit crew</span>
              <span className="tabular">{t.pitCrew}</span>
            </div>
            <Meter value={t.pitCrew} tone="elite" />
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

function ResultCard({ weekend }: { weekend: RaceWeekendResult }) {
  const [open, setOpen] = useState(false);
  const track = trackById(weekend.trackId);
  const finishes = weekend.playerEntries.map((p) => (p.dnf ? 999 : p.position));
  const best = finishes.length ? Math.min(...finishes) : 999;
  return (
    <Card
      title={`Round ${weekend.round} — ${track?.grandPrix ?? weekend.trackId} result`}
      right={<Button small variant="ghost" onClick={() => setOpen(true)}>Replay</Button>}
    >
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {weekend.playerEntries.map((p) => {
          const d = driverById(p.driverId);
          return (
            <div key={p.driverId} className="flex items-center gap-2 rounded-md border border-hairline bg-raised/50 px-2 py-1.5">
              <Img src={d ? driverImage(d.id) : ""} alt={d?.shortName ?? p.driverId} className="h-6 w-6 rounded-sm object-cover" />
              <span className="min-w-0 flex-1 truncate">{d?.shortName ?? p.driverId}</span>
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
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-faint">
        <span>Weather: {weekend.weather}</span>
        <span>Expected P{weekend.expected.min}–P{weekend.expected.max}</span>
        <span>Chaos {weekend.chaos}</span>
        <span>
          Car {weekend.breakdown.car} · Driver {weekend.breakdown.driver} · Luck {weekend.breakdown.luck}
        </span>
      </div>
      {open && <RaceResultReplay weekend={weekend} onClose={() => setOpen(false)} />}
    </Card>
  );
}
function RaceResultReplay({ weekend, onClose }: { weekend: RaceWeekendResult; onClose: () => void }) {
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
                const d = driverById(r.driverId);
                return (
                  <div key={r.driverId} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <span className="w-6 tabular text-ink-faint">{r.position ?? "DNF"}</span>
                    <span className="min-w-0 flex-1 truncate">{d?.shortName ?? r.driverId}</span>
                    <span className="text-[11px] text-ink-faint">{r.dnfReason && r.dnf ? r.dnfReason : ""}</span>
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
                  const d = driverById(r.driverId);
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