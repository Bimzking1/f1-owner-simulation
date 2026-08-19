import { useState } from "react";
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

const STEPS = ["Constructor", "Drivers", "Staff", "Technical", "Philosophy", "Sponsors", "Review"] as const;
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

  const sponsorCost = sponsorIds.reduce((a, id) => a + costOf(sponsorById(id)?.signingBonus ?? 0), 0);
  const equipmentCost = costOf(eng?.cost ?? 0) + costOf(gb?.cost ?? 0) + costOf(tech?.cost ?? 0);
  const staffCost =
    engineerIds.reduce((a, id) => a + costOf(engineerById(id)?.cost ?? 0), 0) +
    mechanicIds.reduce((a, id) => a + costOf(mechanicById(id)?.cost ?? 0), 0);
  const remaining = Math.round((startCash - equipmentCost - sponsorCost - staffCost) * 100) / 100;

  const d1 = driverById(driver1Id);
  const d2 = driverById(driver2Id);
  const engineerPool = ENGINEER_IDS[cfg.season].map(engineerById).filter((e) => !!e).map((e) => e!);
  const mechanicPool = MECHANIC_IDS[cfg.season].map(mechanicById).filter((m) => !!m).map((m) => m!);

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

  const sponsors = availableSponsors(cfg.season, ctor?.dna.reputation ?? 0, remaining + sponsorCost);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <button type="button" onClick={onBack} className="text-[11px] uppercase tracking-widest text-ink-faint hover:text-ink">
            ← back
          </button>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Team Setup</h1>
        </div>
        <div className="text-right">
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
                <span className="h-3 w-3 rounded-full" style={{ background: c.colors.primary }} />
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
        <div className="grid gap-4 lg:grid-cols-2">
          {([1, 2] as const).map((slot) => (
            <Card key={slot} title={`Seat ${slot}`}>
              <div className="grid gap-2">
                {!ctor && <div className="text-xs text-ink-faint">Pick a constructor first.</div>}
                {(drivers[ctor?.id ?? ""] ?? []).map((id) => {
                  const d = driverById(id);
                  if (!d) return null;
                  const sel = slot === 1 ? driver1Id : driver2Id;
                  const other = slot === 1 ? driver2Id : driver1Id;
                  const taken = other === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      disabled={taken}
                      onClick={() => (slot === 1 ? setDriver1Id(d.id) : setDriver2Id(d.id))}
                      className={`flex items-center gap-3 rounded-md border p-2 text-left transition ${
                        sel === d.id
                          ? "border-signal bg-signal/10"
                          : taken
                            ? "cursor-not-allowed border-hairline opacity-40"
                            : "border-hairline bg-surface hover:border-ink-faint"
                      }`}
                    >
                      <Img src={driverImage(d.id)} alt={d.shortName} className="h-10 w-10 rounded-sm object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold">{d.name}</span>
                          <Tag tone={d.rookie ? "positive" : "ink"}>{d.rookie ? "Rookie" : d.personality}</Tag>
                        </div>
                        <div className="text-[11px] text-ink-faint">
                          #{d.number} · OVR {d.overall} · ${d.salary}M/yr · {d.attributes.pressure} pressure
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
          <div className="lg:col-span-2">
            <Card title="Line-up">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="font-display text-lg font-bold">{d1 ? `${d1.name} (P1)` : "—"}</div>
                <span className="text-ink-faint">+</span>
                <div className="font-display text-lg font-bold">{d2 ? `${d2.name} (P2)` : "—"}</div>
                {d1 && d2 && <Tag tone="telemetry">Salary {d1.salary + d2.salary}M/yr</Tag>}
              </div>
            </Card>
          </div>
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
                      <div className="flex items-center gap-2">
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
            Staff are hired at season start and paid out of the setup budget. Engineers boost development speed and innovation;
            mechanics set pit stop times and error rates. Releasing or adding staff mid-season costs money too.
          </div>
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
            <div className="text-xs text-ink-faint">No sponsors can afford to sign with this team right now.</div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {sponsors.map((s) => {
              const signed = sponsorIds.includes(s.id);
              const canPay = remaining + sponsorCost >= costOf(s.signingBonus);
              return (
                <div key={s.id} className={`rounded-md border p-3 ${signed ? "border-positive/50 bg-positive/10" : "border-hairline bg-surface"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display font-bold">{s.name}</div>
                    <Tag tone={s.tier === "title" ? "elite" : s.tier === "major" ? "telemetry" : "ink"}>{s.tier}</Tag>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-soft">{s.objectiveTextEnjoyer}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink-faint">
                      +<Money value={costOf(s.signingBonus)} /> · <Money value={s.racePayment} />/race ·{" "}
                      +<Money value={s.bonus} /> bonus
                    </span>
                    <Button
                      small
                      variant={signed ? "positive" : "ghost"}
                      disabled={!signed && !canPay}
                      onClick={() => setSponsorIds(signed ? sponsorIds.filter((x) => x !== s.id) : [...sponsorIds, s.id])}
                    >
                      {signed ? "Signed" : "Sign"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* REVIEW */}
      {step === "Review" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Team">
            <div className="space-y-1 text-sm">
              <Row k="Constructor" v={ctor?.name ?? "—"} />
              <Row k="Drivers" v={`${d1?.name ?? "—"} / ${d2?.name ?? "—"}`} />
              <Row k="Engine" v={eng?.name ?? "—"} />
              <Row k="Gearbox" v={gb?.name ?? "—"} />
              <Row k="Package" v={tech?.name ?? "—"} />
              <Row k="Philosophy" v={philosophy} />
              <Row k="Orders" v={orders} />
              <Row k="Staff" v={`${engineerIds.length} engineers, ${mechanicIds.length} mechanics`} />
              <Row k="Sponsors" v={sponsorIds.map((id) => sponsorById(id)?.name).join(", ") || "none"} />
            </div>
          </Card>
          <Card title="Budget">
            <div className="space-y-2 text-sm">
              <Row k="Starting budget" v={money(startCash)} />
              <Row k="Equipment" v={`-${money(equipmentCost)}`} />
              <Row k="Staff signings" v={`-${money(staffCost)}`} />
              <Row k="Sponsor signings" v={`-${money(sponsorCost)}`} />
              <Row k="Cash at season start" v={money(remaining)} bold />
            </div>
            <div className="mt-4 text-xs text-ink-faint">
              Difficulty {diff.label} · {cfg.season === 2013 ? "2013, 19 races" : "2025, 24 races + sprints"} · detail level{" "}
              {cfg.gameLength} · staff paid once at signing
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
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

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline/50 py-1">
      <span className="text-ink-faint">{k}</span>
      <span className={`text-right ${bold ? "font-display text-base font-bold" : ""}`}>{v}</span>
    </div>
  );
}

function money(v: number): string {
  return `$${Math.round(v * 100) / 100}M`;
}