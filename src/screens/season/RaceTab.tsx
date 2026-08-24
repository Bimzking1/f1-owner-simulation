import { useEffect, useRef, useState } from "react";
import type { ComponentState, RaceWeekendResult, SimulationState } from "@/simulation/types";
import { driverById, trackById } from "@/data";
import { powerUnitForSeason } from "@/data/powerUnits";
import { Button, Card, Empty, ImageLightbox, Img, Meter, Modal, Tag } from "@/ui/kit";
import { ratingTone } from "@/ui/ratings";
import { driverImage } from "@/data/assets";
import { urgentRepairs } from "@/simulation/systems";
import { type LiveCommand, type LiveView } from "./parts";
import { PositionChart } from "./PositionChart";

interface Props {
  state: SimulationState;
  onRunRound: () => void;
  /** Present while a live race is running (desktop manual runs). */
  live?: LiveView | null;
  sendCommand?: (cmd: LiveCommand) => void;
  onResume?: () => void;
  onSkipToEnd?: () => void;
}

export function RaceTab({ state, onRunRound, live, sendCommand, onResume, onSkipToEnd }: Props) {
  const t = state.team!;
  const done = state.completedRounds >= state.calendar.length;
  const next = state.calendar[state.round];
  const last = state.lastWeekend;
  const busy = !!live && !live.done;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* ------------------------------------------------ LEFT — the action */}
      <div className="space-y-4 lg:col-span-3">
        <Card title="Race weekend">
          {done ? (
            <Empty>Season complete — see the final report.</Empty>
          ) : (
            <div>
              <p className="text-sm text-ink-soft">
                {next ? `Next: ${next.grandPrix} (Round ${state.round + 1})` : "Calendar complete."}
              </p>
              {!!t.gridPenalty && (
                <div className="mt-2 rounded-md border-l-2 border-caution bg-caution/10 p-2 text-xs text-caution">
                  Stewards' ruling: both cars carry a −{t.gridPenalty} grid penalty at this GP for power-unit/gearbox
                  changes.
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={onRunRound} disabled={busy}>
                  {busy ? "🏁 Race in progress…" : `Run the ${next?.grandPrix ?? ""} →`}
                </Button>
              </div>
              <p className="mt-3 text-xs text-ink-faint">
                The weekend simulates qualifying{next?.sprint && state.gameLength !== "short" ? ", a sprint" : ""} and the race
                lap by lap. On desktop you follow it live here and issue pit-wall orders at two checkpoints.
              </p>
            </div>
          )}
        </Card>

        {live && live.paused && !live.done && sendCommand && (
          <PitWallPanel live={live} state={state} sendCommand={sendCommand} onResume={onResume} />
        )}
        {live && (
          <LiveRacePanel live={live} state={state} onSkipToEnd={onSkipToEnd} />
        )}

        {!live && last?.lapOrder && last.lapOrder.length > 1 && (
          <Card title="Position chart" className="hidden lg:block">
            <PositionChart key={`wk-${last.round}`} weekend={last} season={state.season} />
          </Card>
        )}
        {!live && last && last.events.length > 0 && (
          <Card title="Race control log" className="hidden lg:block">
            <RaceLogFeed events={[...last.events].sort((a, b) => a.lap - b.lap)} />
          </Card>
        )}

        {last && <WeekendClassification state={state} weekend={last} />}
      </div>

      {/* --------------------------------------------- RIGHT — the paddock */}
      <div className="space-y-4 lg:col-span-2">
        {last && <ResultCard weekend={last} season={state.season} />}
        <ComponentsCard state={state} />
        {t.upgrades.length > 0 && (
          <Card title="Development in progress">
            <div className="space-y-2">
              {t.upgrades.map((u) => (
                <div key={u.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{u.name}</span>
                    <span className="num-data text-ink-faint">{u.remainingRaces}/{u.totalRaces} races left</span>
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

// ---------------------------------------------------------------------------
// Pit wall — shown big and loud whenever the race pauses for owner orders.

function PitWallPanel({
  live,
  state,
  sendCommand,
  onResume,
}: {
  live: LiveView;
  state: SimulationState;
  sendCommand: (cmd: LiveCommand) => void;
  onResume?: () => void;
}) {
  return (
    <div className="rounded-lg border-2 border-signal bg-signal/10 p-4 shadow-lg shadow-signal/20">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="relative flex h-3.5 w-3.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-signal" />
        </span>
        <h3 className="font-display text-base font-bold uppercase tracking-widest text-signal">
          Pit wall — decision required
        </h3>
        <span className="num-data text-sm text-ink-faint">
          Lap {live.currentLap}/{live.laps} · {live.grandPrix}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Set each driver's orders, then throw the green flag. Push buys lap time but risks hardware, tires and accidents.
      </p>
      <div className="mt-3 space-y-2">
        {live.playerIds.map((id) => (
          <DriverOrderRow
            key={id}
            driverId={id}
            season={state.season}
            stance={live.stances[id] ?? "steady"}
            motivateUsed={!!live.motivateUsed[id]}
            retired={!!live.retired[id]}
            sendCommand={sendCommand}
          />
        ))}
      </div>
      <Button className="mt-3 w-full py-3! text-base!" onClick={onResume}>
        🟢 Green flag — resume race ▶
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live race panel — chart builds lap by lap while the log streams.

function LiveRacePanel({
  live,
  state,
  onSkipToEnd,
}: {
  live: LiveView;
  state: SimulationState;
  onSkipToEnd?: () => void;
}) {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          R{live.roundIdx + 1} · {live.grandPrix}
          {live.paused ? (
            <Tag tone="caution">Paused</Tag>
          ) : (
            <Tag tone="signal">LIVE</Tag>
          )}
        </span>
      }
      right={
        <Button small variant="ghost" onClick={onSkipToEnd}>
          Skip to result ⏭
        </Button>
      }
    >
      <PositionChart
        weekend={{
          qualifying: live.qualifying,
          race: [],
          lapOrder: live.lapOrder,
        }}
        season={state.season}
        liveLap={live.currentLap}
        raceLaps={live.laps}
      />

      <div className="mt-3 max-h-52 space-y-1 overflow-y-auto rounded-md border border-hairline bg-void p-2">
        {live.events.slice(-30).map((e, i) => (
          <div key={`${e.lap}-${i}`} className="text-xs leading-relaxed text-ink-soft">
            <Tag tone={sev(e.severity)}>L{e.lap}</Tag> <span className="text-ink-faint">·</span> {e.text}
          </div>
        ))}
        {live.events.length === 0 && <p className="text-xs text-ink-faint">Formation lap…</p>}
      </div>

      {!live.paused && (
        <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
          Orders open automatically at the lap ~33% and ~66% checkpoints.
        </p>
      )}
    </Card>
  );
}

function DriverOrderRow({
  driverId,
  season,
  stance,
  motivateUsed,
  retired,
  sendCommand,
}: {
  driverId: string;
  season: number;
  stance: "push" | "steady" | "conserve";
  motivateUsed: boolean;
  retired: boolean;
  sendCommand: (cmd: LiveCommand) => void;
}) {
  const d = driverById(driverId, season);
  const btn = (kind: "push" | "steady" | "conserve", label: string, hint: string, cls: string) => (
    <button
      type="button"
      disabled={retired}
      title={hint}
      onClick={() => sendCommand({ driverId, kind })}
      className={`flex-1 rounded-md border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
        retired
          ? "cursor-not-allowed border-transparent bg-raised/30 text-ink-faint opacity-50"
          : stance === kind
            ? `${cls} ring-2 ring-current/40`
            : "border-hairline bg-raised/60 text-ink-soft hover:bg-raised hover:text-ink"
      }`}
    >
      {label}
      {!retired && stance === kind && <span className="ml-1">✓</span>}
    </button>
  );

  if (retired) {
    return (
      <div className="rounded-md border border-hairline bg-surface/60 p-3 opacity-70">
        <div className="flex items-center gap-2">
          <Img src={driverImage(driverId, season)} alt={d?.shortName ?? driverId} className="h-6 w-6 rounded-sm object-cover grayscale" />
          <span className="font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
            {d?.shortName ?? driverId}
          </span>
          <Tag tone="signal">Retired</Tag>
          <span className="num-data ml-auto text-[11px] text-ink-faint">out of the race</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-hairline bg-surface/80 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Img src={driverImage(driverId, season)} alt={d?.shortName ?? driverId} className="h-6 w-6 rounded-sm object-cover" />
        <span className="font-display text-sm font-bold uppercase tracking-wide">{d?.shortName ?? driverId}</span>
        <span className="num-data ml-auto text-[11px] text-ink-faint">
          {stance === "push" ? "attacking" : stance === "conserve" ? "saving the car" : "steady pace"}
        </span>
      </div>
      <div className="flex gap-2">
        {btn("push", "Push", "+pace, higher failure & crash risk", "border-caution/70 bg-caution/20 text-caution")}
        {btn("steady", "Steady", "balanced pace and risk", "border-signal/60 bg-signal/20 text-signal")}
        {btn("conserve", "Conserve", "slower, kind to car and tires", "border-positive/70 bg-positive/20 text-positive")}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={motivateUsed}
          title={motivateUsed ? "One pep talk per driver per race — already used" : "One pep talk per race: short pace boost"}
          onClick={() => sendCommand({ driverId, kind: "motivate" })}
          className={`flex-1 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
            motivateUsed
              ? "cursor-not-allowed border-transparent text-ink-faint opacity-50"
              : "border-elite/60 bg-elite/10 text-elite hover:bg-elite/25"
          }`}
        >
          Motivate {motivateUsed ? "✓ used (1 per race)" : ""}
        </button>
        <button
          type="button"
          title="Call the car into the pits and retire from the race"
          onClick={() => sendCommand({ driverId, kind: "retire" })}
          className="flex-1 rounded-md border border-signal/60 px-3 py-2 text-xs font-bold uppercase tracking-wider text-signal transition hover:bg-signal/15"
        >
          Retire car
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Components — same detail level as the Garage: every era part with condition,
// age, mileage and damage status.

function ComponentsCard({ state }: { state: SimulationState }) {
  const t = state.team!;
  const pu = powerUnitForSeason(state.season);
  const broken = urgentRepairs(state).length;

  const rows: { label: string; spec?: string; c?: ComponentState; note?: string; crew?: number }[] = [
    {
      label: pu.engineName,
      spec: pu.engineSpec,
      c: t.components.engine,
    },
    ...pu.components.map((cfg) => ({
      label: cfg.name,
      spec: cfg.spec,
      c:
        t.components.powerUnit?.[cfg.id] ??
        ({ condition: 100, age: 0, replacements: 0 } as ComponentState),
    })),
    {
      label: "Gearbox",
      spec: pu.gearboxSpec,
      c: t.components.gearbox,
    },
    { label: "Pit crew", crew: t.pitCrew },
  ];

  return (
    <Card
      title={pu.heading}
      right={
        broken > 0 ? (
          <Tag tone="signal">{broken} repair{broken > 1 ? "s" : ""} needed</Tag>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {rows.map((r) => {
          if (r.crew !== undefined) {
            return (
              <div key="crew" className="rounded-md border border-hairline bg-raised/40 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Pit crew</span>
                  <span className={`num-data text-sm ${ratingTextClass(t.pitCrew)}`}>{r.crew}</span>
                </div>
                <Meter value={r.crew} tone={ratingTone(r.crew)} className="mt-1.5" />
                <div className="mt-1 text-[10px] uppercase tracking-widest text-ink-faint">Stops & pit-lane performance</div>
              </div>
            );
          }
          const c = r.c!;
          const damaged = c.damaged === true;
          const worn = !damaged && c.condition < 40;
          return (
            <div
              key={r.label}
              className={`rounded-md border p-2.5 ${damaged ? "border-signal/50 bg-signal/10" : "border-hairline bg-raised/40"}`}
            >
              <div className="flex items-center gap-2">
                <span className="min-w-0 truncate text-sm font-semibold">{r.label}</span>
                {damaged ? (
                  <Tag tone="signal">Broken</Tag>
                ) : worn ? (
                  <Tag tone="caution">Worn</Tag>
                ) : c.condition >= 90 ? (
                  <Tag tone="positive">Fresh</Tag>
                ) : null}
                <span className={`num-data ml-auto text-sm ${damaged ? "text-signal" : ratingTextClass(c.condition)}`}>
                  {c.condition.toFixed(1)}%
                </span>
              </div>
              <Meter value={c.condition} tone={damaged ? "signal" : ratingTone(c.condition)} className="mt-1.5" />
              <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] uppercase tracking-widest text-ink-faint">
                <span>Age {c.age} race{c.age === 1 ? "" : "s"}</span>
                <span>≈{(c.age * 305).toLocaleString()} km</span>
                <span>{c.replacements} replacement{c.replacements === 1 ? "" : "s"}</span>
              </div>
              {damaged && c.damagedNote && (
                <div className="mt-1.5 rounded-sm border-l-2 border-signal bg-void/60 px-2 py-1 text-[11px] leading-relaxed text-signal">
                  {c.damagedNote}
                </div>
              )}
              {!damaged && r.spec && (
                <div className="mt-1 truncate text-[10px] text-ink-faint" title={r.spec}>
                  {r.spec}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
        Full specs, wear profiles and replacements live in the Garage tab.
      </p>
    </Card>
  );
}

function ratingTextClass(v: number): string {
  if (v >= 80) return "text-azure";
  if (v >= 60) return "text-positive";
  if (v >= 40) return "text-caution";
  return "text-signal";
}

/** Auto-scrolling race log used by the desktop "Race control log" card. */
function RaceLogFeed({ events }: { events: import("@/simulation/types").RaceEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [events.length]);
  return (
    <div ref={ref} className="max-h-64 space-y-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
      {events.map((e, i) => (
        <div key={`${e.lap}-${i}`} className="text-xs leading-relaxed text-ink-soft">
          <Tag tone={sev(e.severity)}>L{e.lap}</Tag> <span className="text-ink-faint">·</span> {e.text}
        </div>
      ))}
      {events.length === 0 && <p className="text-xs text-ink-faint">No events.</p>}
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
      <div className="max-h-80 divide-y divide-hairline/60 overflow-auto pr-4 [scrollbar-gutter:stable]">
        {view === "quali" &&
          quali.map((q) => (
            <div key={q.driverId} className={`flex items-center gap-2 py-1 text-sm ${mine(q.driverId) ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="pos-num w-8 text-[15px] leading-none text-ink-faint">P{q.gridPosition}</span>
              <span className="min-w-0 flex-1 truncate">{nameOf(q.driverId)}</span>
              <span className="w-16 text-right pos-num text-[13px] leading-none text-ink-faint">→ {racePosOf[q.driverId] ?? "—"}</span>
            </div>
          ))}
        {view === "race" &&
          race.map((r) => (
            <div key={r.driverId} className={`flex items-center gap-2 py-1 text-sm ${mine(r.driverId) ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="pos-num w-20 text-[15px] leading-none text-ink-faint">
                Q{r.gridPosition}→{r.dnf ? "DNF" : `P${r.position}`}
              </span>
              <span className="min-w-0 flex-1 truncate">{nameOf(r.driverId)}</span>
              <span className="text-[11px] text-ink-faint">
                {r.fastestLap ? "fastest lap" : r.dnf && r.dnfReason ? r.dnfReason : ""}
              </span>
              <span className="num-data w-8 text-right text-[15px] leading-none text-ink-soft">{r.points > 0 ? r.points : ""}</span>
            </div>
          ))}
        {view === "sprint" &&
          weekend.sprint!.map((r) => (
            <div key={r.driverId} className={`flex items-center gap-2 py-1 text-sm ${mine(r.driverId) ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="pos-num w-12 text-[15px] leading-none text-ink-faint">P{r.position}</span>
              <span className="min-w-0 flex-1 truncate">{nameOf(r.driverId)}</span>
              <span className="num-data w-8 text-right text-[15px] leading-none text-ink-soft">{r.points > 0 ? r.points : ""}</span>
            </div>
          ))}
      </div>
    </Card>
  );
}

function ResultCard({ weekend, season }: { weekend: RaceWeekendResult; season: number }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
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
      <div className="space-y-3">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {weekend.playerEntries.map((p) => {
            const d = driverById(p.driverId, season);
            const grid = gridOf(p.driverId);
            return (
              <div key={p.driverId} className="flex items-center gap-2 rounded-md border border-hairline bg-raised/50 px-2 py-1.5">
                <Img src={d ? driverImage(d.id, season) : ""} alt={d?.shortName ?? p.driverId} className="h-6 w-6 rounded-sm object-cover" />
                <span className="min-w-0 flex-1 truncate">{d?.shortName ?? p.driverId}</span>
                {grid != null && <span className="pos-num text-[13px] leading-none text-ink-faint">Q{grid}</span>}
                {p.dnf ? (
                  <Tag tone="signal">DNF</Tag>
                ) : (
                  <span className={`pos-num text-[15px] leading-none ${best === p.position ? "text-positive" : ""}`}>
                    P{p.position} · {p.points} pts
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {track && (
          <div className="mx-auto w-full max-w-64">
            <button
              type="button"
              onClick={() => setZoom({ src: track.image, alt: `${track.name} circuit map` })}
              title="Click to enlarge circuit map"
              className="flex h-28 w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-sm bg-white p-1.5 transition hover:opacity-90"
            >
              <Img
                src={track.image}
                alt={`${track.name} circuit layout`}
                fallback={<span className="text-[10px] text-ink-faint">Layout</span>}
                className="max-h-full max-w-full object-contain"
              />
            </button>
            <div className="mt-1 text-center text-[10px] uppercase tracking-widest text-ink-faint">
              R{weekend.round} circuit map
            </div>
          </div>
        )}
      </div>
      <div className="mb-3 mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-md border border-hairline bg-raised/40 p-2">
            <div className="label-tech text-[10px] text-ink-faint">Fastest lap</div>
            {hl.fastest ? (
              <>
                <div className="mt-0.5 font-display text-base font-bold uppercase leading-tight">{hl.fastest.name}</div>
                <div className="num-data mt-0.5 text-lg text-telemetry">{fmtLap(hl.fastest.time)}</div>
              </>
            ) : (
              <div className="mt-0.5 text-ink-faint">—</div>
            )}
          </div>
          <div className="rounded-md border border-elite/30 bg-elite/10 p-2">
            <div className="label-tech text-[10px] text-elite">Driver of the day</div>
            {hl.dotd ? (
              <>
                <div className="mt-0.5 font-display text-base font-bold uppercase leading-tight">{hl.dotd.name}</div>
                <div className="text-[10px] text-ink-faint">{hl.dotd.note}</div>
              </>
            ) : (
              <div className="mt-0.5 text-ink-faint">—</div>
            )}
          </div>
          <div className="rounded-md border border-hairline bg-raised/40 p-2">
            <div className="label-tech text-[10px] text-ink-faint">Most gained</div>
            {hl.gained && hl.gained.delta > 0 ? (
              <>
                <div className="mt-0.5 font-display text-base font-bold uppercase leading-tight">{hl.gained.name}</div>
                <div className="num-data mt-0.5 text-sm text-positive">+{hl.gained.delta} positions</div>
              </>
            ) : (
              <div className="mt-0.5 text-ink-faint">none</div>
            )}
          </div>
          <div className="rounded-md border border-hairline bg-raised/40 p-2">
            <div className="label-tech text-[10px] text-ink-faint">Most lost</div>
            {hl.lost && hl.lost.delta < 0 ? (
              <>
                <div className="mt-0.5 font-display text-base font-bold uppercase leading-tight">{hl.lost.name}</div>
                <div className="num-data mt-0.5 text-sm text-signal">{hl.lost.delta} positions</div>
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
      {zoom && <ImageLightbox src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} light />}
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
            <div className="max-h-[26rem] divide-y divide-hairline/60 overflow-auto pr-2 [scrollbar-gutter:stable]">
              {weekend.race.map((r) => {
                const d = driverById(r.driverId, season);
                return (
                  <div key={r.driverId} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <span className={`pos-num w-12 text-[15px] leading-none ${r.dnf ? "text-signal" : "text-ink-faint"}`}>
                      Q{r.gridPosition}→{r.dnf ? "DNF" : r.position}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{d?.shortName ?? r.driverId}</span>
                    <span className="text-[11px] text-ink-faint">{r.dnfReason && r.dnf ? r.dnfReason : r.fastestLap ? "fastest lap" : ""}</span>
                    <span className="num-data text-ink-soft">{r.points > 0 ? `${r.points} pts` : ""}</span>
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
                      <span className="pos-num w-6 text-[15px] leading-none text-ink-faint">{r.position ?? "DNF"}</span>
                      <span className="min-w-0 flex-1 truncate">{d?.shortName ?? r.driverId}</span>
                      <span className="num-data text-ink-soft">{r.points > 0 ? `${r.points} pts` : ""}</span>
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