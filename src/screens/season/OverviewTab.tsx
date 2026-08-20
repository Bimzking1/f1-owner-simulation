import type { SimulationState } from "@/simulation/types";
import { driverById, constructorById } from "@/data";
import { Bar, Button, Card, Img, Ovr, Tag } from "@/ui/kit";
import { driverImage } from "@/data/assets";
import { MiniBar, StandingsCard } from "./parts";

interface Props {
  state: SimulationState;
  onNewsAction: (newsId: string, action: string) => void;
  onRunRound: () => void;
}

export function OverviewTab({ state, onNewsAction, onRunRound }: Props) {
  const t = state.team!;
  const next = state.calendar[state.round];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {next && (
          <Card title={`Next round — ${next.grandPrix}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">
                Round {state.round + 1}/{state.calendar.length}. The weekend simulates qualifying
                {next.sprint && state.gameLength !== "short" ? ", a sprint" : ""} and the race with lap-level events,
                weather and mechanical risk.
              </p>
              <Button
                onClick={onRunRound}
                className="shrink-0"
              >
                Run the {next.grandPrix} →
              </Button>
            </div>
          </Card>
        )}
        {next && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-hairline bg-surface/70 px-4 py-2 text-sm">
            <span className="font-display text-base font-bold">{next.name}</span>
            <span className="text-xs text-ink-faint">
              {next.country} · {next.laps} laps · {next.lengthKm.toFixed(3)} km
            </span>
            {next.sprint && <Tag tone="elite">Sprint</Tag>}
            <span className="ml-auto text-[11px] uppercase tracking-widest text-ink-faint">
              Details & map on the Race tab
            </span>
          </div>
        )}

        <Card title="Team">
          <div className="mb-3">
            {(() => {
              const c = constructorById(t.constructorId, state.season);
              const pos = state.standingsConstructors.findIndex((s) => s.teamId === t.constructorId) + 1;
              if (!c) return null;
              return (
                <>
                  {/* mobile: logo inline with name/pts/pos, car below */}
                  <div className="flex flex-col gap-3 lg:hidden">
                    <div className="flex items-center gap-3">
                      <Img src={c.image} alt={c.name} className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold leading-tight">{c.fullName}</div>
                        <div className="text-[11px] text-ink-faint">
                          {t.points} pts · P{pos} in constructors
                        </div>
                      </div>
                    </div>
                    <Img src={c.carImage} alt={`${c.name} car`} className="w-auto max-w-full rounded-sm" />
                  </div>
                  {/* desktop: logo + car row, details beside */}
                  <div className="hidden lg:flex lg:flex-row lg:items-center lg:gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Img src={c.image} alt={c.name} className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                      <Img src={c.carImage} alt={`${c.name} car`} className="h-14 w-auto shrink-0 rounded-sm" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-lg font-bold leading-tight lg:truncate">{c.fullName}</div>
                      <div className="text-[11px] text-ink-faint lg:whitespace-nowrap">
                        {t.points} pts · P{pos} in constructors
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {t.drivers.map((ds) => {
              const d = driverById(ds.driverId, state.season);
              if (!d) return null;
              return (
                <div key={ds.driverId} className="flex items-center gap-3 rounded-md border border-hairline bg-raised/50 p-2">
                  <Img src={driverImage(d.id, state.season)} alt={d.shortName} className="h-12 w-12 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold leading-tight">{d.name}</span>
                      <Tag tone={ds.confidence > 55 ? "positive" : "caution"}>{ds.confidence} conf</Tag>
                    </div>
                    <div className="text-[11px] text-ink-faint">
                      <Ovr value={d.overall} /> · Pts {ds.points}
                      {ds.dnfs > 0 ? ` · ${ds.dnfs} DNF` : ""}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <MiniBar label="Conf" value={ds.confidence} />
                      <MiniBar label="Morale" value={ds.morale} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Bar label="Aero" value={t.car.aero} />
            <Bar label="Chassis" value={t.car.chassis} />
            <Bar label="Reliability" value={t.car.reliability} />
            <Bar label="Power" value={t.car.power} />
            <Bar label="Tires" value={t.car.tireBehavior} />
            <Bar label="Gearbox" value={t.car.gearboxPerf} />
          </div>
        </Card>

        <StandingsCard state={state} />
      </div>

      <div className="space-y-4">
        <Card title="News" pad={false}>
          <div className="max-h-[46rem] divide-y divide-hairline overflow-auto">
            {state.news.length === 0 && <div className="p-4 text-xs text-ink-faint">No news yet.</div>}
            {state.news.slice(0, 60).map((n) => (
              <div key={n.id} className="p-3">
                <div className="flex items-center gap-2">
                  <Tag tone={n.tag === "breaking" ? "signal" : n.tag === "sponsor" ? "elite" : n.tag === "driver" ? "telemetry" : "ink"}>
                    R{n.round}
                  </Tag>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{n.title}</span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">{n.body}</p>
                {n.options && !n.resolved && (
                  <div className="mt-2 flex gap-2">
                    {n.options.map((o) => (
                      <button
                        key={o.action}
                        type="button"
                        onClick={() => onNewsAction(n.id, o.action)}
                        className="rounded-sm border border-telemetry/40 bg-telemetry/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-telemetry hover:bg-telemetry/20"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}