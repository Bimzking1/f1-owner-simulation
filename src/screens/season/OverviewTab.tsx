import type { SimulationState } from "@/simulation/types";
import { driverById } from "@/data";
import { Bar, Card, Img, Tag } from "@/ui/kit";
import { driverImage } from "@/data/assets";
import { MiniBar, NextRaceCard, StandingsCard } from "./parts";

interface Props {
  state: SimulationState;
  onNewsAction: (newsId: string, action: string) => void;
}

export function OverviewTab({ state, onNewsAction }: Props) {
  const t = state.team!;
  const next = state.calendar[state.round];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {next && <NextRaceCard track={next} />}

        <Card title="Team">
          <div className="grid gap-3 sm:grid-cols-2">
            {t.drivers.map((ds) => {
              const d = driverById(ds.driverId);
              if (!d) return null;
              return (
                <div key={ds.driverId} className="flex items-center gap-3 rounded-md border border-hairline bg-raised/50 p-2">
                  <Img src={driverImage(d.id)} alt={d.shortName} className="h-12 w-12 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold leading-tight">{d.name}</span>
                      <Tag tone={ds.confidence > 55 ? "positive" : "caution"}>{ds.confidence} conf</Tag>
                    </div>
                    <div className="text-[11px] text-ink-faint">
                      OVR {d.overall} · Pts {ds.points}
                      {ds.dnfs > 0 ? ` · ${ds.dnfs} DNF` : ""}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <MiniBar label="Conf" value={ds.confidence} tone="telemetry" />
                      <MiniBar label="Morale" value={ds.morale} tone={ds.morale < 40 ? "caution" : "positive"} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Bar label="Aero" value={t.car.aero} />
            <Bar label="Chassis" value={t.car.chassis} />
            <Bar label="Reliability" value={t.car.reliability} tone="positive" />
            <Bar label="Power" value={t.car.power} tone="signal" />
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