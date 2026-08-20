import { useState, type ReactNode } from "react";
import type {
  DifficultyId,
  GameLengthId,
  Philosophy,
  SeasonId,
  TeamOrders,
  TeamState,
} from "@/simulation/types";
import {
  constructorsBySeason,
  driversByTeam,
  engineerById,
  enginesForSeason,
  gearboxesForSeason,
  mechanicById,
  seasonCalendar,
  techPackagesForSeason,
  availableSponsors,
  driverById,
  sponsorById,
} from "@/data";
import { DIFFICULTIES, PHILOSOPHIES } from "@/data/config";
import { Bar, Button, Card, Img, Money, Tag } from "@/ui/kit";
import { driverImage } from "@/data/assets";

export interface SetupConfig {
  season: SeasonId;
  difficulty: DifficultyId;
  gameLength: GameLengthId;
}

interface Props {
  cfg: SetupConfig;
  onStart: (team: TeamState) => void;
  onBack: () => void;
}

const STEPS = ["Constructor", "Drivers", "Technical", "Staff", "Philosophy", "Sponsors", "Review"] as const;
type Step = (typeof STEPS)[number];

export default function SetupScreen({ cfg, onStart, onBack }: Props) {
  const diff = DIFFICULTIES.find((d) => d.id === cfg.difficulty)!;
  const teams = constructorsBySeason(cfg.season);
  const drivers = driversByTeam(cfg.season);

  const [step, setStep] = useState<Step>("Constructor");
  const [constructorId, setConstructorId] = useState<string>("");
  const [driver1Id, setDriver1Id] = useState<string>("");
  const [driver2Id, setDriver2Id] = useState<string>("");
  const [engineerIds, setEngineerIds] = useState<string[]>([]);
  const [mechanicIds, setMechanicIds] = useState<string[]>([]);
  const [engineId, setEngineId] = useState<string>("");
  const [gearboxId, setGearboxId] = useState<string>("");
  const [techId, setTechId] = useState<string>("");
  const [philosophy, setPhilosophy] = useState<Philosophy>("balanced");
  const [orders, setOrders] = useState<TeamOrders>("equal");
  const [sponsorIds, setSponsorIds] = useState<string[]>([]);

  const ctor = teams.find((c) => c.id === constructorId);
  const startCash = ctor ? Math.round(ctor.startCash * diff.cashMultiplier * 100) / 100 : 0;
  const mult = diff.costMultiplier;
  const costOf = (v: number) => Math.round(v * mult * 100) / 100;

  const engines = enginesForSeason(cfg.season);
  const gearboxes = gearboxesForSeason(cfg.season);
  const techs = techPackagesForSeason(cfg.season);
  const eng = engines.find((e) => e.id === engineId);
  const gb = gearboxes.find((g) => g.id === gearboxId);
  const tech = techs.find((t) => t.id === techId);

  const equipmentCost = costOf(eng?.cost ?? 0) + costOf(gb?.cost ?? 0) + costOf(tech?.cost ?? 0);
  const totalRounds = seasonCalendar(cfg.season).length;
  const staffCost =
    engineerIds.reduce((a, id) => a + (engineerById(id)?.cost ?? 0), 0) +
    mechanicIds.reduce((a, id) => a + (mechanicById(id)?.cost ?? 0), 0);
  const staffWeekly = totalRounds > 0 ? Math.round((staffCost / totalRounds) * 100) / 100 : 0;
  const sponsorRaceIncome = sponsorIds.reduce((a, id) => a + (sponsorById(id)?.racePayment ?? 0), 0);
  const remaining = Math.round((startCash - equipmentCost) * 100) / 100;

  const d1 = driverById(driver1Id, cfg.season);
  const d2 = driverById(driver2Id, cfg.season);
  const engineerPool = ENGINEER_IDS[cfg.season].map(engineerById).filter((e) => !!e).map((e) => e!);
  const mechanicPool = MECHANIC_IDS[cfg.season].map(mechanicById).filter((m) => !!m).map((m) => m!);

  const assignDriver = (slot: 1 | 2, id: string) => {
    const other = slot === 1 ? driver2Id : driver1Id;
    if (id === other) return; // can't drive twice
    if (slot === 1) setDriver1Id(id); else setDriver2Id(id);
  };
  const removeDriver = (slot: 1 | 2) => {
    if (slot === 1) setDriver1Id(""); else setDriver2Id("");
  };
  const swapSeats = () => {
    const a = driver1Id;
    setDriver1Id(driver2Id);
    setDriver2Id(a);
  };

  const stepIndex = STEPS.indexOf(step);
  const overBudget = remaining < 0;
  const canContinue =
    (step === "Constructor" && !!constructorId) ||
    (step === "Drivers" && !!driver1Id && !!driver2Id) ||
    (step === "Staff" && engineerIds.length >= 3 && mechanicIds.length >= 2) ||
    (step === "Technical" && !!engineId && !!gearboxId && !!techId) ||
    (step === "Philosophy" && true) ||
    (step === "Sponsors" && true) ||
    step === "Review";

  function next() {
    if (!canContinue || overBudget) return;
    if (step === "Review") {
      const team = buildTeam();
      onStart(team);
      return;
    }
    setStep(STEPS[stepIndex + 1]);
  }

  function buildTeam(): TeamState {
    const c = teams.find((x) => x.id === constructorId)!;
    return {
      constructorId,
      philosophy,
      teamOrders: orders,
      driver1Id,
      driver2Id,
      engineerIds,
      mechanicIds,
      engineId,
      gearboxId,
      techPackageId: techId,
      sponsorIds,
      cash: remaining,
      reputation: c.dna.reputation,
      startCash,
      car: { aero: 0, chassis: 0, reliability: 0, tireBehavior: 0, power: 0, gearboxPerf: 0 },
      components: {
        engine: { condition: 100, age: 0, replacements: 0 },
        gearbox: { condition: 100, age: 0, replacements: 0 },
      },
      upgrades: [],
      drivers: [],
      sponsors: [],
      pitCrew: 72,
      history: [],
      points: 0,
      wins: 0,
      podiums: 0,
      dnfs: 0,
      lastRoundCompleted: 0,
    };
  }

  const sponsors = availableSponsors(cfg.season, ctor?.dna.reputation ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-6 pb-32 lg:pb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <button type="button" onClick={onBack} className="text-[11px] uppercase tracking-widest text-ink-faint hover:text-ink">
            ← back
          </button>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Team Setup</h1>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[11px] uppercase tracking-widest text-ink-faint">Budget · {diff.label}</div>
          <Money value={remaining} className={`font-display text-2xl font-bold ${remaining < 0 ? "text-signal" : ""}`} />
          {overBudget && <div className="text-[11px] font-semibold uppercase tracking-wider text-signal">Over budget — adjust picks</div>}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i < stepIndex && setStep(s)}
            className={`rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
              i === stepIndex
                ? "border-signal bg-signal/15 text-signal"
                : i < stepIndex
                  ? "border-positive/40 bg-positive/10 text-positive"
                  : "border-hairline text-ink-faint"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* CONSTRUCTOR */}
      {step === "Constructor" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setConstructorId(c.id);
                setDriver1Id("");
                setDriver2Id("");
                const pair = drivers[c.id] ?? [];
                if (pair[0]) setDriver1Id(pair[0]);
                if (pair[1]) setDriver2Id(pair[1]);
              }}
              className={`rounded-md border p-4 text-left transition ${constructorId === c.id ? "border-signal bg-signal/10" : "border-hairline bg-surface hover:border-ink-faint"}`}
            >
              <div className="flex items-center gap-2">
                <Img src={c.image} alt={c.name} className="h-10 w-10 shrink-0 rounded-sm object-cover" />
                <span className="font-display text-lg font-bold">{c.name}</span>
              </div>
              <div className="mt-1 text-[11px] text-ink-faint">{c.nationality}</div>
              <div className="mt-3 space-y-1 text-xs text-ink-soft">
                {(["aero", "chassis", "reliability", "engineering"] as const).map((k) => (
                  <Bar key={k} label={k} value={c.dna[k]} tone={k === "reliability" ? "positive" : "telemetry"} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-ink-faint">Budget</span>
                <Money value={Math.round(c.startCash * diff.cashMultiplier * 100) / 100} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* DRIVERS */}
      {step === "Drivers" && (
        <div className="grid gap-4">
          <Card title="Your line-up" right={d1 && d2 ? <Tag tone="telemetry">Salaries {d1.salary + d2.salary}M/yr</Tag> : undefined}>
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="order-1 md:order-1"><SeatChip label="Seat 1" d={d1} season={cfg.season} onClear={driver1Id ? () => removeDriver(1) : undefined} /></div>
              <div className="order-3 md:order-2"><SeatChip label="Seat 2" d={d2} season={cfg.season} onClear={driver2Id ? () => removeDriver(2) : undefined} /></div>
              <button
                type="button"
                onClick={swapSeats}
                disabled={!d1 || !d2}
                className="order-2 w-full rounded-sm border border-hairline px-2 py-1 text-xs font-semibold uppercase tracking-wider text-ink-soft hover:border-signal hover:text-signal disabled:opacity-40 md:order-3 md:w-auto md:shrink-0"
              >
                ⇄ Swap seats
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              Sign any driver from any team for either seat — drivers leaving another team open a vacancy there.
              The rest of the grid rebalances automatically: displaced drivers are re-seated at random, and reserve
              drivers left without a seat (like Alpine's Colapinto) sit out as the factory's third. Wages are paid
              across the season from race earnings.
            </p>
          </Card>

          <Card title="Available drivers">
            <div className="grid gap-3 lg:grid-cols-2">
              {teams.map((team) => {
                const ids = [...(drivers[team.id] ?? [])].sort((a, b) => (driverById(b, cfg.season)?.overall ?? 0) - (driverById(a, cfg.season)?.overall ?? 0));
                if (!ids.length) return null;
                const signed = ids.filter((id) => id === driver1Id || id === driver2Id).length;
                return (
                  <div key={team.id} className="rounded-md border border-hairline">
                    <div className="flex items-center gap-2 border-b border-hairline/60 px-2 py-1.5">
                      <Img src={team.image} alt={team.name} className="h-6 w-6 shrink-0 rounded-sm object-cover" />
                      <span className="font-display text-sm font-bold">{team.name}</span>
                      <span className="ml-auto text-[11px] text-ink-faint">{signed}/2 signed</span>
                    </div>
                    <div className="space-y-1 p-2">
                      {ids.map((id) => {
                        const d = driverById(id, cfg.season);
                        if (!d) return null;
                        const in1 = id === driver1Id;
                        const in2 = id === driver2Id;
                        const taken = in1 || in2;
                        return (
                          <div key={id} className={`flex flex-col gap-2 rounded-md border p-2 md:flex-row md:items-center ${taken ? "border-signal/40 bg-signal/5" : "border-hairline bg-surface"}`}>
                            <div className="flex items-center gap-3">
                              <Img
                                src={driverImage(d.id, cfg.season)}
                                alt={d.shortName}
                                className="h-14 w-14 shrink-0 rounded-sm object-cover md:h-16 md:w-16"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="font-display text-sm font-bold">{d.name}</span>
                                  {d.reserve && <Tag tone="ink">Reserve</Tag>}
                                  {d.rookie && <Tag tone="positive">Rookie</Tag>}
                                </div>
                                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-faint">
                                  <span>OVR {d.overall}</span>
                                  <span>${d.salary}M/yr</span>
                                  <span>#{d.number}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 md:ml-auto md:shrink-0">
                              <SeatButton active={in1} disabled={in2} label="S1" onClick={() => (in1 ? removeDriver(1) : assignDriver(1, d.id))} />
                              <SeatButton active={in2} disabled={in1} label="S2" onClick={() => (in2 ? removeDriver(2) : assignDriver(2, d.id))} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TECHNICAL */}
      {step === "Technical" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Engine">
            <div className="grid gap-2">
              {engines.map((e) => (
                <TechPick key={e.id} active={engineId === e.id} onClick={() => setEngineId(e.id)} title={e.name}
                  meta={[`Power ${e.power}`, `Rel ${e.reliability}`, e.status, e.supplier]} cost={costOf(e.cost)} />
              ))}
            </div>
          </Card>
          <Card title="Gearbox">
            <div className="grid gap-2">
              {gearboxes.map((g) => (
                <TechPick key={g.id} active={gearboxId === g.id} onClick={() => setGearboxId(g.id)} title={g.name}
                  meta={[`Perf ${g.performance}`, `Rel ${g.reliability}`]} cost={costOf(g.cost)} />
              ))}
            </div>
          </Card>
          <Card title="Technical package">
            <div className="grid gap-2">
              {techs.map((t) => (
                <TechPick key={t.id} active={techId === t.id} onClick={() => setTechId(t.id)} title={t.name}
                  meta={[`Aero ${t.aero}`, `Chassis ${t.chassis}`, `Rel ${t.reliability}`]} cost={costOf(t.cost)} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* STAFF */}
      {step === "Staff" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={`Engineers (${engineerIds.length}/3 minimum)`}>
            <div className="grid gap-2">
              {engineerPool.map((e) => {
                const hired = engineerIds.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    disabled={!hired && engineerIds.length >= 5}
                    onClick={() => setEngineerIds(hired ? engineerIds.filter((x) => x !== e.id) : [...engineerIds, e.id])}
                    className={`flex items-center gap-3 rounded-md border p-2 text-left transition ${
                      hired ? "border-positive/50 bg-positive/10" : "border-hairline bg-surface hover:border-ink-faint"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-display font-bold">{e.name}</span>
                        <Tag>{e.department}</Tag>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                        <span>Expertise {e.expertise}</span>
                        <span>Innov {e.innovation}</span>
                        <span>Dev speed {e.developmentSpeed}</span>
                        <span>Rel {e.reliabilityFocus}</span>
                      </div>
                    </div>
                    <Money value={e.cost} className="text-sm font-bold" />
                  </button>
                );
              })}
            </div>
          </Card>
          <Card title={`Mechanics (${mechanicIds.length}/2 minimum)`}>
            <div className="grid gap-2">
              {mechanicPool.map((m) => {
                const hired = mechanicIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!hired && mechanicIds.length >= 5}
                    onClick={() => setMechanicIds(hired ? mechanicIds.filter((x) => x !== m.id) : [...mechanicIds, m.id])}
                    className={`flex items-center gap-3 rounded-md border p-2 text-left transition ${
                      hired ? "border-positive/50 bg-positive/10" : "border-hairline bg-surface hover:border-ink-faint"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold">{m.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                        <span>Pit {m.pitStop.toFixed(2)}s</span>
                        <span>Error {m.errorChance}%</span>
                        <span>Repair {m.repairEfficiency}</span>
                      </div>
                    </div>
                    <Money value={m.cost} className="text-sm font-bold" />
                  </button>
                );
              })}
            </div>
          </Card>
          <div className="lg:col-span-2 text-xs text-ink-faint">
            No up-front fee: staff salaries are paid per race weekend out of season cash (≈{staffWeekly}M/weekend for your
            current picks). Engineers boost development speed and innovation; mechanics set pit stop times and error rates.
            Releasing mid-season costs a one-time severance.
          </div>
        </div>
      )}

      {/* PHILOSOPHY */}
      {step === "Philosophy" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {PHILOSOPHIES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPhilosophy(p.id)}
              className={`rounded-md border p-4 text-left transition ${philosophy === p.id ? "border-signal bg-signal/10" : "border-hairline bg-surface hover:border-ink-faint"}`}
            >
              <div className="font-display text-lg font-bold">{p.label}</div>
              <p className="mt-1 text-xs text-ink-soft">{p.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.pros.map((x) => <Tag key={x} tone="positive">{x}</Tag>)}
                {p.cons.map((x) => <Tag key={x} tone="caution">{x}</Tag>)}
              </div>
            </button>
          ))}
          <div className="sm:col-span-2">
            <Card title="Team orders">
              <div className="flex flex-wrap gap-2">
                {(["equal", "priority1", "priority2"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrders(o)}
                    className={`rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-wider ${orders === o ? "border-signal bg-signal/15 text-signal" : "border-hairline text-ink-soft"}`}
                  >
                    {o === "equal" ? "Equal" : o === "priority1" ? "Driver 1 leads" : "Driver 2 leads"}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SPONSORS */}
      {step === "Sponsors" && (
        <Card title={`Sponsors (${sponsorIds.length}/5 slots)`}>
          {sponsors.length === 0 && (
            <div className="text-xs text-ink-faint">No sponsors are interested in this team right now.</div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {sponsors.map((s) => {
              const signed = sponsorIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSponsorIds(signed ? sponsorIds.filter((x) => x !== s.id) : [...sponsorIds, s.id])}
                  className={`rounded-md border p-3 text-left transition ${
                    signed
                      ? "border-positive/50 bg-positive/10"
                      : "border-hairline bg-surface hover:border-ink-faint"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display font-bold">{s.name}</div>
                    <Tag tone={s.tier === "title" ? "elite" : s.tier === "major" ? "telemetry" : "ink"}>{s.tier}</Tag>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-soft">{s.objectiveTextEnjoyer}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink-faint">
                      Pays <Money value={s.racePayment} />/race · bonus +<Money value={s.bonus} />
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-sm border px-2 py-1 font-display text-[11px] font-bold uppercase tracking-widest ${
                        signed
                          ? "border-positive/40 bg-positive/15 text-positive"
                          : "border-hairline bg-raised text-ink-soft"
                      }`}
                    >
                      {signed ? "Signed" : s.tier === "title" ? "Sign Title" : "Sign"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-ink-faint">
            No up-front fee: sponsors pay their race rate every weekend you keep the contract.
          </p>
        </Card>
      )}

      {/* REVIEW */}
      {step === "Review" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Team">
            {ctor && (
              <div className="mb-3">
                {/* mobile: logo inline with name/year/origin, car below */}
                <div className="flex flex-col gap-3 lg:hidden">
                  <div className="flex items-center gap-3">
                    <Img src={ctor.image} alt={ctor.name} className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                    <div className="min-w-0 text-sm">
                      <div className="font-display font-bold">{ctor.fullName}</div>
                      <div className="text-[11px] text-ink-faint">
                        {cfg.season === 2013 ? "2013" : "2025"} · {ctor.nationality}
                      </div>
                    </div>
                  </div>
                  <Img src={ctor.carImage} alt={`${ctor.name} car`} className="h-14 w-auto rounded-sm" />
                </div>
                {/* desktop: logo + car row, details below */}
                <div className="hidden lg:flex lg:flex-col lg:items-start lg:gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Img src={ctor.image} alt={ctor.name} className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                    <Img src={ctor.carImage} alt={`${ctor.name} car`} className="h-14 w-auto shrink-0 rounded-sm" />
                  </div>
                  <div className="min-w-0 text-sm">
                    <div className="font-display font-bold">{ctor.fullName}</div>
                    <div className="text-[11px] text-ink-faint">
                      {cfg.season === 2013 ? "2013" : "2025"} · {ctor.nationality}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1 text-sm">
              <Row k="Constructor" v={ctor?.name ?? "—"} />
              <Row
                k="Seat 1"
                v={d1 ? `${d1.name} (${d1.teamId === constructorId ? "your team" : "from " + d1.teamId}, $${d1.salary}M/yr)` : "—"}
                thumb={d1 ? <Img src={driverImage(d1.id, cfg.season)} alt={d1.shortName} className="h-8 w-8 rounded-sm object-cover" /> : undefined}
              />
              <Row
                k="Seat 2"
                v={d2 ? `${d2.name} (${d2.teamId === constructorId ? "your team" : "from " + d2.teamId}, $${d2.salary}M/yr)` : "—"}
                thumb={d2 ? <Img src={driverImage(d2.id, cfg.season)} alt={d2.shortName} className="h-8 w-8 rounded-sm object-cover" /> : undefined}
              />
              <Row k="Driver wages" v={d1 && d2 ? `$${d1.salary + d2.salary}M/yr` : "—"} />
              <Row k="Engine" v={eng?.name ?? "—"} />
              <Row k="Gearbox" v={gb?.name ?? "—"} />
              <Row k="Package" v={tech?.name ?? "—"} />
              <Row k="Philosophy" v={philosophy} />
              <Row k="Orders" v={orders} />
              <Row k="Staff" v={`${engineerIds.length} engineers, ${mechanicIds.length} mechanics`} />
              <Row k="Sponsors" v={sponsorIds.map((id) => sponsorById(id)?.name).join(", ") || "none"} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
              The grid rebalances at season start: vacancies created by cross-team signings are filled at random by the
              displaced drivers; unseated reserves (e.g. Alpine's Colapinto) sit out the season.
            </p>
          </Card>
          <Card title="Budget">
            <div className="space-y-2 text-sm">
              <Row k="Starting budget" v={money(startCash)} />
              <Row k="Equipment (one-time)" v={`-${money(equipmentCost)}`} />
              <Row k="Driver wages" v={d1 && d2 ? `${money(d1.salary + d2.salary)}/yr · paid per weekend` : "—"} />
              <Row k="Staff wages" v={`${money(staffCost)}/yr · ${money(staffWeekly)}/weekend`} />
              <Row k="Sponsors" v={sponsorIds.length > 0 ? `${money(sponsorRaceIncome)}/race income, no sign fee` : "none"} />
              <Row k="Cash at season start" v={money(remaining)} bold />
            </div>
            <div className="mt-4 text-xs text-ink-faint">
              Difficulty {diff.label} · {cfg.season === 2013 ? "2013, 19 races" : "2025, 24 races + sprints"} · detail level{" "}
              {cfg.gameLength} · driver & staff wages paid per weekend; parts (engine, gearbox, tech) bought up front
            </div>
          </Card>
        </div>
      )}

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-md border border-hairline bg-surface/95 p-3 shadow-xl backdrop-blur lg:static lg:inset-auto lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <Button variant="ghost" onClick={() => (stepIndex > 0 ? setStep(STEPS[stepIndex - 1]) : onBack())}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {overBudget && <span className="text-xs font-semibold uppercase tracking-wider text-signal">Over budget</span>}
          <Button onClick={next} disabled={!canContinue || overBudget}>
            {step === "Review" ? "Start Season" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const ENGINEER_IDS: Record<SeasonId, string[]> = {
  2013: [
    "eng-aero-jr13", "eng-aero-sr13", "eng-aero-el13",
    "eng-dyn-jr13", "eng-dyn-sr13", "eng-dyn-el13",
    "eng-pow-jr13", "eng-pow-sr13",
    "eng-race-jr13", "eng-race-sr13",
    "eng-rel-sr13", "eng-cto13",
  ],
  2025: [
    "eng-aero-jr25", "eng-aero-sr25", "eng-aero-el25",
    "eng-dyn-jr25", "eng-dyn-sr25", "eng-dyn-el25",
    "eng-pow-jr25", "eng-pow-sr25",
    "eng-race-jr25", "eng-race-sr25",
    "eng-rel-sr25", "eng-cto25",
  ],
};

const MECHANIC_IDS: Record<SeasonId, string[]> = {
  2013: ["mech-budget13", "mech-standard13", "mech-elite13"],
  2025: ["mech-budget25", "mech-standard25", "mech-elite25"],
};

function TechPick({ active, onClick, title, meta, cost }: { active: boolean; onClick: () => void; title: string; meta: string[]; cost: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-md border p-2 text-left transition ${active ? "border-signal bg-signal/10" : "border-hairline bg-surface hover:border-ink-faint"}`}
    >
      <div className="min-w-0">
        <div className="font-display text-sm font-bold">{title}</div>
        <div className="text-[11px] text-ink-faint">{meta.join(" · ")}</div>
      </div>
      <Money value={cost} className="shrink-0 text-sm font-bold" />
    </button>
  );
}

function Row({ k, v, bold, thumb }: { k: string; v: string; bold?: boolean; thumb?: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b border-hairline/50 py-1"
    >
      <span className="flex min-w-0 items-center gap-2 text-ink-faint">
        {thumb}
        {k}
      </span>
      <span className={`text-right ${bold ? "font-display text-base font-bold" : ""}`}>{v}</span>
    </div>
  );
}

function money(v: number): string {
  return `$${Math.round(v * 100) / 100}M`;
}

function SeatChip({ label, d, season, onClear }: { label: string; d?: ReturnType<typeof driverById>; season: number; onClear?: () => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-hairline bg-raised/40 p-2 sm:flex-none">
      <Img src={d ? driverImage(d.id, season) : ""} alt={d?.shortName ?? ""} className="h-12 w-12 shrink-0 rounded-sm object-cover" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">{label}</div>
        {d ? (
          <div className="truncate font-display text-sm font-bold">{d.name}</div>
        ) : (
          <div className="text-sm text-ink-faint">Empty</div>
        )}
        {d && <div className="text-[11px] text-ink-faint">OVR {d.overall} · ${d.salary}M/yr</div>}
      </div>
      {d && onClear && (
        <button type="button" onClick={onClear} className="ml-auto shrink-0 rounded-sm border border-hairline px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint hover:text-signal">
          Clear
        </button>
      )}
    </div>
  );
}

function SeatButton({ active, disabled, label, onClick }: { active: boolean; disabled: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled || active}
      onClick={onClick}
      className={`flex-1 rounded-sm border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition md:flex-none md:px-6 md:py-2.5 md:text-xs ${
        active ? "border-signal bg-signal/15 text-signal" : disabled ? "border-hairline text-ink-faint opacity-40" : "border-hairline text-ink-soft hover:border-signal hover:text-signal"
      }`}
    >
      {label}
    </button>
  );
}