import { useMemo } from "react";
import type { SimulationState } from "@/simulation/types";
import { projectSeason } from "@/simulation/expect";
import { constructorById, driverById, engineById, gearboxById, sponsorById, techPackageById } from "@/data";
import { difficultyOf } from "@/state";
import { Button, Card, Img, Ovr, Tag } from "@/ui/kit";
import { ratingTextClass } from "@/ui/ratings";
import { driverImage } from "@/data/assets";

interface Props {
  state: SimulationState;
  onContinue: () => void;
}

function verdictFor(pos: number): string {
  if (pos <= 1) return "The paddock tips you for the title. Anything less than a championship fight will be called a failure.";
  if (pos <= 2) return "Pundits expect a title challenge — the garage will be measured against the top step.";
  if (pos <= 4) return "A podium-contending package, on paper. The front row is the target, wins are the bonus.";
  if (pos <= 6) return "Solid midfield billing: points every weekend and the occasional upset are expected.";
  if (pos <= 8) return "Lower midfield expectations — scrape points where the chaos finds you.";
  return "Projections put you at the back. Finish races, score when it rains, keep the accountants calm.";
}

function fmtRange([lo, hi]: [number, number]): string {
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}

export default function ExpectationsScreen({ state, onContinue }: Props) {
  const t = state.team!;
  const ctor = constructorById(t.constructorId, state.season);
  const engine = engineById(t.engineId);
  const gearbox = gearboxById(t.gearboxId);
  const tech = techPackageById(t.techPackageId);

  const exp = useMemo(() => projectSeason(state), [state]);

  const posBest = exp.wccPos[0];
  const drivers = [t.driver1Id, t.driver2Id].map(driverById).filter(Boolean);

  const tiles: { label: string; value: string; sub?: string; tone?: "positive" | "telemetry" | "elite" | "signal" }[] = [
    { label: "Expected points", value: fmtRange(exp.points), sub: "championship total", tone: "positive" },
    { label: "Expected wins", value: fmtRange(exp.wins), tone: "elite" },
    { label: "Expected podiums", value: fmtRange(exp.podiums), tone: "telemetry" },
    {
      label: "WCC projection",
      value: posBest === exp.wccPos[1] ? `P${posBest}` : `P${exp.wccPos[1]}–P${posBest}`,
      sub: `${fmtRange(exp.wccPoints)} pts`,
      tone: "signal",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 pb-36 pt-10">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-telemetry">Season preview · pre-testing</div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Expectations</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          The paddock has run its models on your entry. This is what {difficultyOf(state).label.toLowerCase()} observers
          expect from your {state.season} campaign — beat it and reputations rise.
        </p>
      </div>

      {/* expectation tiles */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {tiles.map((x) => (
          <div
            key={x.label}
            className={`rounded-md border px-3 py-3 ${
              x.tone === "positive"
                ? "border-positive/30 bg-positive/10"
                : x.tone === "elite"
                  ? "border-elite/30 bg-elite/10"
                  : x.tone === "telemetry"
                    ? "border-telemetry/30 bg-telemetry/10"
                    : "border-signal/30 bg-signal/10"
            }`}
          >
            <div className="label-tech text-[9px] uppercase text-ink-faint">{x.label}</div>
            <div className="num-data mt-1 font-display text-2xl font-bold leading-none sm:text-3xl">{x.value}</div>
            {x.sub && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-faint">{x.sub}</div>}
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-md border-l-2 border-telemetry/50 bg-raised/40 p-3 text-sm italic leading-relaxed text-ink-soft">
        “{verdictFor(posBest)}”
      </p>

      {/* predicted constructors' order */}
      <Card title="Predicted constructors' championship" right={<Tag tone="telemetry">model projection</Tag>} className="mt-4">
        <div className="max-h-80 divide-y divide-hairline/60 overflow-auto pr-1">
          {exp.teams.map((row, i) => {
            const mineRow = row.teamId === t.constructorId;
            const name = constructorById(row.teamId, state.season)?.name ?? row.teamId;
            return (
              <div key={row.teamId} className={`flex items-center gap-2 py-1 text-sm ${mineRow ? "font-semibold text-ink" : "text-ink-soft"}`}>
                <span className="pos-num w-6 text-[15px] leading-none text-ink-faint">{i + 1}</span>
                <span className={`h-2 w-2 shrink-0 rounded-full ${mineRow ? "bg-signal" : "bg-hairline"}`} />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="num-data text-xs text-ink-faint">
                  {row.pointsWorst === row.pointsBest ? `${row.pointsAvg}` : `${row.pointsWorst}–${row.pointsBest}`}
                </span>
                <span className="num-data w-14 text-right">{row.pointsAvg} pts</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* the entry */}
        <Card title="The entry">
          {ctor && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Img src={ctor.image} alt={ctor.name} className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-lg font-bold leading-tight">{ctor.fullName}</div>
                  <div className="text-[11px] text-ink-faint">
                    {state.season} · {ctor.nationality}
                  </div>
                  {engine && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-soft">
                      <Tag tone="telemetry">Engine</Tag> {engine.name} ({engine.supplier})
                    </div>
                  )}
                </div>
              </div>
              <Img src={ctor.carImage} alt={`${ctor.name} car`} className="w-auto max-w-full self-center rounded-sm" />
              <div className="space-y-1 border-t border-hairline pt-2 text-xs">
                {gearbox && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-faint">Gearbox</span>
                    <span>{gearbox.name}</span>
                  </div>
                )}
                {tech && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-faint">Tech package</span>
                    <span>{tech.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-faint">Reputation</span>
                  <span className="num-data">{t.reputation}/100</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* drivers */}
        <Card title="Driver line-up" right={<Tag tone="telemetry">projected pts</Tag>}>
          <div className="grid gap-2">
            {drivers.map((d) => {
              const proj = exp.drivers.find((x) => x.driverId === d!.id);
              return (
                <div key={d!.id} className="flex items-center gap-3 rounded-md border border-hairline bg-raised/40 p-2">
                  <Img src={driverImage(d!.id, state.season)} alt={d!.shortName} className="h-16 w-16 shrink-0 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display font-bold">{d!.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-faint">
                      <Ovr value={d!.overall} /> <span>#{d!.number}</span> <span>${d!.salary}M/yr</span>
                      {d!.rookie && <Tag tone="positive">Rookie</Tag>}
                    </div>
                    <div className={`num-data mt-1 text-lg leading-none ${ratingTextClass(Math.round(((proj?.pointsBest ?? 0) + (proj?.pointsWorst ?? 0)) / 2))}`}>
                      {proj ? fmtRange([proj.pointsWorst, proj.pointsBest]) : "—"}{" "}
                      <span className="text-[10px] uppercase tracking-wider text-ink-faint">pts projected</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* sponsors */}
        <Card title="Sponsor board" right={<Tag tone="telemetry">{t.sponsors.length} signed</Tag>} className="lg:col-span-2">
          {t.sponsors.length === 0 ? (
            <p className="text-xs text-ink-faint">No sponsors signed yet — the livery runs bare into round one.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {t.sponsors.map((s) => {
                const spec = sponsorById(s.sponsorId);
                if (!spec) return null;
                return (
                  <div key={s.sponsorId} className="flex items-center gap-3 rounded-md border border-hairline bg-raised/30 p-2">
                    <Img src={spec.image} alt={spec.name} className="h-8 w-16 shrink-0 rounded-sm bg-white object-contain p-1" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-sm font-bold">{spec.name}</span>
                        <Tag tone={spec.tier === "title" ? "elite" : spec.tier === "major" ? "telemetry" : "ink"}>{spec.tier}</Tag>
                      </div>
                      <div className="truncate text-[11px] text-ink-soft">{spec.objectiveTextEnjoyer}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="num-data text-sm text-positive">${spec.racePayment}M</div>
                      <div className="text-[9px] uppercase tracking-widest text-ink-faint">per race</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3">
        <p className="hidden text-[11px] leading-snug text-ink-faint sm:block">
          Projections assume no mid-season development. Your calls can beat the model — or confirm it.
        </p>
        <Button onClick={onContinue}>Head to pre-season testing →</Button>
      </div>
    </div>
  );
}
