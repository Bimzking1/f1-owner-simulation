import { useState } from "react";
import type { NewsItem, SimulationState } from "@/simulation/types";
import { driverById, constructorById, sponsorById } from "@/data";
import { boostDesc } from "@/actions";
import { ownerTitle, trustOf } from "@/state";
import { Bar, Button, Card, Img, Meter, Ovr, Tag } from "@/ui/kit";
import { ratingTone } from "@/ui/ratings";
import { driverImage } from "@/data/assets";
import { MiniBar, StandingsCard } from "./parts";

interface Props {
  state: SimulationState;
  onNewsAction: (newsId: string, action: string) => void;
  onRunRound: () => void;
  onNavigate: (tab: "Overview" | "Race" | "Management" | "Market" | "Sponsors" | "Garage" | "Finance") => void;
}

export function OverviewTab({ state, onNewsAction, onRunRound, onNavigate }: Props) {
  const t = state.team!;
  const next = state.calendar[state.round];
  const [achOpen, setAchOpen] = useState<"races" | "wins" | "podiums" | null>(null);

  // per-driver achievement counts for the expandable stat tiles
  const myDrivers = state.standingsDrivers.filter((s) => s.teamId === t.constructorId);
  const driverName = (id: string) => driverById(id, state.season)?.shortName ?? id;
  const achDetail: Record<"races" | "wins" | "podiums", { name: string; count: number }[]> = {
    races: myDrivers.map((s) => ({ name: driverName(s.driverId), count: Math.max(0, state.completedRounds - s.dnfs) })),
    wins: myDrivers.map((s) => ({ name: driverName(s.driverId), count: s.wins })),
    podiums: myDrivers.map((s) => ({ name: driverName(s.driverId), count: s.podiums })),
  };

  // group the feed into per-GP blocks with separators
  const groups: { round: number; items: NewsItem[] }[] = [];
  for (const n of state.news.slice(0, 80)) {
    const last = groups[groups.length - 1];
    if (last && last.round === n.round) last.items.push(n);
    else groups.push({ round: n.round, items: [n] });
  }

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
              <Button onClick={onRunRound} className="shrink-0">
                Run the {next.grandPrix} →
              </Button>
            </div>
          </Card>
        )}
        {next && (
          <div className="flex flex-col gap-1.5 rounded-md border border-hairline bg-surface/70 px-4 py-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
            <span className="font-display text-base font-bold">{next.name}</span>
            <span className="text-xs text-ink-faint">
              {next.country} · {next.laps} laps · {next.lengthKm.toFixed(3)} km
            </span>
            {next.sprint && <Tag tone="elite">Sprint</Tag>}
            <button
              type="button"
              onClick={() => onNavigate("Race")}
              className="text-left text-[11px] uppercase tracking-widest text-telemetry hover:text-ink sm:ml-auto sm:text-right"
            >
              Details & map on the Race tab →
            </button>
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
                  {/* mobile: logo inline with name/pos, car below */}
                  <div className="flex flex-col gap-3 lg:hidden">
                    <div className="flex items-center gap-3">
                      <Img src={c.image} alt={c.name} className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold leading-tight">{c.fullName}</div>
                        <div className="text-[11px] text-ink-faint">P{pos} in constructors</div>
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
                      <div className="text-[11px] text-ink-faint lg:whitespace-nowrap">P{pos} in constructors</div>
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
                    {!!ds.boosts?.length && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ds.boosts.map((b, i) => (
                          <span
                            key={`${b.label}-${i}`}
                            title={boostDesc(b)}
                            className={`rounded-sm border px-1 py-px text-[9px] ${
                              (b.morale ?? 0) + (b.confidence ?? 0) + (b.frustration ?? 0) >= 0
                                ? "border-positive/40 bg-positive/10 text-positive"
                                : "border-signal/40 bg-signal/10 text-signal"
                            }`}
                          >
                            {b.label} ×{b.racesLeft}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* season achievements — under the driver form bars; click a tile to see who got them */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["races", "Races", state.completedRounds],
                ["wins", "Wins", t.wins],
                ["podiums", "Podiums", t.podiums],
              ] as const
            ).map(([key, label, value]) => (
              <button
                key={key}
                type="button"
                aria-expanded={achOpen === key}
                onClick={() => setAchOpen(achOpen === key ? null : key)}
                className={`rounded-md border px-3 py-1.5 text-left transition ${
                  achOpen === key ? "border-telemetry/50 bg-telemetry/10" : "border-hairline bg-raised/50 hover:border-ink-faint"
                }`}
              >
                <span className="label-tech block text-[9px] text-ink-faint">{label}</span>
                <span className="num-data block text-lg leading-tight">
                  {value}
                  <span className="ml-1 text-[10px] text-ink-faint">{achOpen === key ? "▾" : "▸"}</span>
                </span>
              </button>
            ))}
            <div className="rounded-md border border-positive/30 bg-positive/10 px-3 py-1.5">
              <div className="label-tech text-[9px] text-positive">WCC Pts</div>
              <div className="num-data text-lg leading-tight text-positive">{t.points}</div>
            </div>
          </div>
          {achOpen && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-md border border-hairline bg-raised/40 px-3 py-2 text-xs">
              {achDetail[achOpen].map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="text-ink-soft">{d.name}</span>
                  <span className="num-data text-[13px] leading-none text-ink">{d.count}</span>
                </span>
              ))}
            </div>
          )}
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
        <OwnerCard state={state} />

        <Card title="Paddock feed" pad={false}>
          <div className="max-h-[46rem] overflow-auto">
            {groups.length === 0 && <div className="p-4 text-xs text-ink-faint">No news yet.</div>}
            {groups.map((g, gi) => {
              const gp = g.round > 0 ? state.calendar[g.round - 1]?.grandPrix : undefined;
              return (
                <div key={g.round} className={gi > 0 ? "border-t-2 border-hairline" : ""}>
                  {/* GP separator header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-hairline bg-raised/95 px-3 py-1.5 backdrop-blur">
                    <span className="font-display text-[11px] font-bold uppercase tracking-widest text-ink-soft">
                      {g.round === 0 ? "Pre-season" : `R${g.round}${gp ? ` — ${gp}` : ""}`}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-faint">{g.items.length} items</span>
                  </div>
                  {g.items.map((n) => (
                    <NewsRow key={n.id} n={n} onNewsAction={onNewsAction} onNavigate={onNavigate} />
                  ))}
                </div>
              );
            })}
          </div>
        </Card>

        <SponsorProgressWidget state={state} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function OwnerCard({ state }: { state: SimulationState }) {
  const t = state.team!;
  const o = t.owner;
  const trust = trustOf(state);
  const label =
    trust <= 25 ? "Distrusted" : trust <= 40 ? "Wary" : trust <= 55 ? "Respected" : trust <= 70 ? "Trusted" : "Ironclad";
  return (
    <Card title="Team principal">
      <div className="flex items-center gap-3">
        {o?.image ? (
          <Img src={o.image} alt={o.name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-signal/15 font-display text-xl font-bold text-signal">
            {(o?.name ?? "O").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-bold leading-tight">{o?.name ?? "The Owner"}</div>
          <div className="text-[11px] text-ink-faint">Called “{ownerTitle(state)}” around the paddock</div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-raised/50 px-3 py-1.5">
          <span className="label-tech text-[9px] text-ink-faint">Reputation</span>
          <span className="num-display text-lg leading-none">{t.reputation}</span>
        </div>
        <Bar
          label="Trust"
          value={trust}
          tone={ratingTone(trust)}
          right={<span className="text-xs font-semibold">{label}</span>}
        />
        <p className="text-[10px] leading-relaxed text-ink-faint">
          Every call you make moves it — bonuses, backing and team days build trust; fines, rants, broken promises and
          mid-season sackings cost it.
        </p>
      </div>
    </Card>
  );
}

function NewsRow({
  n,
  onNewsAction,
  onNavigate,
}: {
  n: NewsItem;
  onNewsAction: (newsId: string, action: string) => void;
  onNavigate: Props["onNavigate"];
}) {
  const urgent = n.priority === "urgent";
  const warning = n.priority === "warning";
  return (
    <div
      className={`border-b border-hairline/50 p-3 ${
        urgent ? "border-l-2 border-l-signal bg-signal/5" : warning ? "border-l-2 border-l-caution bg-caution/5" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {urgent ? (
          <Tag tone="signal">Urgent</Tag>
        ) : warning ? (
          <Tag tone="caution">Notice</Tag>
        ) : n.kind === "chat" ? (
          <Tag tone="telemetry">Driver</Tag>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{n.title}</span>
      </div>
      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-soft">{n.body}</p>
      {n.options && !n.resolved && (
        <div className="mt-2 flex flex-wrap gap-2">
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
      {n.kind === "chat" && !n.resolved && (
        <button
          type="button"
          onClick={() => onNavigate("Management")}
          className="mt-2 rounded-sm border border-signal/40 bg-signal/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-signal hover:bg-signal/20"
        >
          Respond in Team Management →
        </button>
      )}
    </div>
  );
}

function SponsorProgressWidget({
  state,
  onNavigate,
}: {
  state: SimulationState;
  onNavigate: Props["onNavigate"];
}) {
  const t = state.team!;
  const active = t.sponsors.filter((s) => s.active);
  return (
    <Card title="Sponsor objectives" right={<Tag tone="telemetry">{active.length}/5</Tag>}>
      {active.length === 0 ? (
        <div className="text-xs text-ink-faint">
          No active sponsors.{" "}
          <button type="button" onClick={() => onNavigate("Sponsors")} className="text-telemetry hover:text-ink">
            Find one →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((s) => {
            const spec = sponsorById(s.sponsorId);
            if (!spec) return null;
            const roundsLeft = s.deadlineRound > 0 ? s.deadlineRound - state.completedRounds : null;
            return (
              <div key={s.sponsorId}>
                <div className="flex items-center gap-2">
                  <Img src={spec.image} alt={spec.name} className="h-4 w-7 shrink-0 rounded-sm object-contain" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{spec.name}</span>
                  <span className="num-data shrink-0 text-[13px] leading-none text-ink-faint">
                    {s.deadlineRound > 0 ? `${s.progress}/${s.required}` : "pending"}
                  </span>
                </div>
                <Meter
                  value={s.progress}
                  max={Math.max(1, s.required)}
                  tone={s.progress >= s.required ? "positive" : roundsLeft != null && roundsLeft <= 2 ? "caution" : "telemetry"}
                  className="mt-1"
                />
                <div className="mt-0.5 text-[10px] text-ink-faint">
                  {s.deadlineRound > 0
                    ? `Evaluated after R${s.deadlineRound}${roundsLeft != null && roundsLeft > 0 ? ` · ${roundsLeft} race(s) left` : ""}`
                    : "Objective pending"}
                  {" · "}patience {s.patience}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => onNavigate("Sponsors")}
            className="text-[11px] uppercase tracking-widest text-telemetry hover:text-ink"
          >
            Manage sponsors →
          </button>
        </div>
      )}
    </Card>
  );
}
