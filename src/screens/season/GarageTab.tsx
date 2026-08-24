import { useState } from "react";
import type { ComponentKey, ComponentState, DevSeat, Seat, SimulationState, TestType } from "@/simulation/types";
import {
  carParts,
  devCostFor,
  effectivePuHealth,
  generateDevOptions,
  isDevWindow,
  isSeatTarget,
  replacementCost,
  urgentRepairs,
} from "@/simulation/systems";
import { driverById, engineById } from "@/data";
import { driverImage } from "@/data/assets";
import {
  componentLabel,
  gearboxEraNote,
  powerUnitForSeason,
  puEffectiveness,
  reliabilityEstimate,
  usageKm,
  wearRateLabel,
  type PuStatKind,
  type PuStatSpec,
} from "@/data/powerUnits";
import { replaceEngine, replaceGearbox, replacePuComponent, runTest, startDev, testingBudget } from "@/actions";
import { Button, Card, Empty, Img, Meter, Modal, Money, Tag } from "@/ui/kit";
import { ratingTone } from "@/ui/ratings";
import type { Act } from "./parts";

interface Props {
  state: SimulationState;
  act: Act;
}

export function GarageTab({ state, act }: Props) {
  const t = state.team!;
  const devWindow = isDevWindow(state);
  const options = generateDevOptions(state);
  const upgrades = options.filter((o) => o.target !== "pitCrew" && o.target !== "driverTraining");
  const trainings = options.filter((o) => o.target === "pitCrew" || o.target === "driverTraining");
  const trainingDone = (id: string) => (t.trainings ?? []).some((x) => x.id === id && x.round >= state.completedRounds);
  const devInterval = Math.max(3, Math.round(state.calendar.length / 4));
  const roundsToWindow = devInterval - (state.completedRounds % devInterval);
  const [confirmSwap, setConfirmSwap] = useState<{ key: ComponentKey; seat: Seat } | null>(null);
  const [openPart, setOpenPart] = useState<string | null>(null);
  const [testPick, setTestPick] = useState<TestType | null>(null);
  const costs = testingBudget();
  const repairs = urgentRepairs(state);

  return (
    <div className="space-y-4">
      {repairs.length > 0 && (
        <Card
          title="Urgent repairs"
          right={<Tag tone="signal">{repairs.length} broken</Tag>}
        >
          <p className="text-xs leading-relaxed text-caution">
            A car with a broken part is not raceable. Replace every broken part before running the next Grand Prix — the
            run button stays locked until the garage is clean.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {repairs.map((r) => {
              const d = driverById(r.seat === "car1" ? t.driver1Id : t.driver2Id, state.season);
              return (
                <div key={`${r.seat}-${r.key}`} className="flex items-center justify-between gap-2 rounded-md border border-caution/50 bg-caution/10 p-2.5">
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold uppercase">
                      {r.name} <span className="text-caution">· {d?.shortName ?? r.seat}</span>
                    </div>
                    <div className="truncate text-[11px] text-caution">
                      {r.note} · {r.condition.toFixed(1)}%
                    </div>
                  </div>
                  <Button small variant="danger" onClick={() => setConfirmSwap({ key: r.key, seat: r.seat })}>
                    Replace ${r.cost}M
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <PowerSystemCard
            state={state}
            openPart={openPart}
            onToggle={(key) => setOpenPart((cur) => (cur === key ? null : key))}
            onSwap={(key, seat) => setConfirmSwap({ key, seat })}
          />

          <Card
          title="Development window"
          right={
            !devWindow ? (
              <span className="text-[10px] uppercase tracking-wider text-caution">frozen · next in {roundsToWindow} round(s)</span>
            ) : undefined
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-ink-soft">
              {devWindow
                ? "A development window is OPEN. Choose one car upgrade to start."
                : `Car development is frozen. Next development window in ${roundsToWindow} round${roundsToWindow === 1 ? "" : "s"}.`}
            </div>
            <div className="flex items-center gap-2">
              <Meter value={state.completedRounds % devInterval} max={devInterval} tone="elite" className="w-32" />
            </div>
          </div>
          <div className={`mt-3 grid gap-2 sm:grid-cols-2 ${!devWindow ? "pointer-events-none opacity-50" : ""}`}>
            {upgrades.map((o) => {
              const running = t.upgrades.some((u) => u.id === o.id);
              const seatTarget = isSeatTarget(o.target);
              return (
                <div key={o.id} className="rounded-md border border-hairline p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold">{o.name}</span>
                    <Money value={o.cost} className="text-sm font-bold" />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft">{o.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink-faint">
                      {o.duration} races · risk {Math.round(o.risk * 100)}%
                    </span>
                    {!seatTarget && (
                      <Button
                        small
                        variant={devWindow && !running ? "primary" : "ghost"}
                        disabled={!devWindow || running}
                        onClick={() => act((x) => startDev(x, o).message)}
                      >
                        {running ? "In progress" : "Start"}
                      </Button>
                    )}
                  </div>
                  {seatTarget && (
                    <div className="mt-2 space-y-1.5 border-t border-hairline pt-2">
                      <div className="text-[10px] uppercase tracking-wider text-ink-faint">
                        Fit to — one car costs 60%, both share the gain
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(["both", "car1", "car2"] as DevSeat[]).map((seat) => {
                          const d =
                            seat === "car1"
                              ? driverById(t.driver1Id, state.season)
                              : seat === "car2"
                                ? driverById(t.driver2Id, state.season)
                                : null;
                          const price = devCostFor(o, seat);
                          return (
                            <Button
                              key={seat}
                              small
                              variant={devWindow && !running ? "primary" : "ghost"}
                              disabled={!devWindow || running}
                              onClick={() => act((x) => startDev(x, o, seat).message)}
                            >
                              {d ? d.shortName : "Both cars"} · ${price}M
                            </Button>
                          );
                        })}
                      </div>
                      {running && <div className="text-[11px] text-caution">Already in progress.</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Weekly programmes" right={<span className="text-[10px] uppercase tracking-wider text-ink-faint">every race weekend</span>}>
          <p className="mb-3 text-xs text-ink-faint">
            Training is not affected by the development freeze — each programme can be run once per race weekend.
          </p>
          {trainings.length === 0 && <Empty>No training programmes available right now.</Empty>}
          <div className="grid gap-2 sm:grid-cols-2">
            {trainings.map((o) => {
              const running = t.upgrades.some((u) => u.id === o.id);
              const doneThisWeekend = trainingDone(o.id);
              const blocked = running || doneThisWeekend;
              return (
                <div key={o.id} className="rounded-md border border-hairline p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold">{o.name}</span>
                    <Money value={o.cost} className="text-sm font-bold" />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft">{o.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink-faint">
                      {doneThisWeekend ? "run this weekend · " : ""}
                      {o.duration} races · risk {Math.round(o.risk * 100)}%
                    </span>
                    <Button
                      small
                      variant={blocked ? "ghost" : "primary"}
                      disabled={blocked}
                      onClick={() => act((x) => startDev(x, o).message)}
                    >
                      {running ? "In progress" : doneThisWeekend ? "Done today" : "Run"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Upgrades in progress">
          {t.upgrades.length === 0 && <Empty>Nothing under development.</Empty>}
          <div className="space-y-2">
            {t.upgrades.map((u) => {
              const seatTag =
                u.seat === "car1" || u.seat === "car2"
                  ? driverById(u.seat === "car1" ? t.driver1Id : t.driver2Id, state.season)?.shortName
                  : null;
              return (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span>
                    {u.name}
                    {seatTag && <Tag tone="telemetry">{seatTag}</Tag>}
                  </span>
                  <div className="flex items-center gap-2">
                    <Meter value={((u.totalRaces - u.remainingRaces) / u.totalRaces) * 100} tone="elite" className="w-28" />
                    <span className="text-xs text-ink-faint">{u.remainingRaces} race(s) left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Testing" right={<span className="text-[10px] uppercase tracking-wider text-ink-faint">confirm before spend</span>}>
          <div className="space-y-2">
            {(["performance", "reliability", "tire", "driver"] as TestType[]).map((type) => (
              <button
                key={type}
                type="button"
                disabled={t.cash < costs[type]}
                onClick={() => setTestPick(type)}
                className="flex w-full items-center justify-between rounded-sm border border-hairline px-2 py-1.5 text-sm hover:border-telemetry disabled:opacity-40"
              >
                <span className="capitalize">{type} test</span>
                <Money value={costs[type]} className="text-xs text-ink-faint" />
              </button>
            ))}
          </div>
          {state.testing.length > 0 && (
            <div className="mt-3 max-h-56 space-y-1 overflow-auto">
              {state.testing.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-ink-soft">
                  <span className="capitalize">{r.label}</span>
                  <span>{r.value}/100 · {r.confidence}% conf</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Car philosophy">
          <div className="space-y-1 text-sm text-ink-soft">
            <div>
              <span className="text-ink-faint">Philosophy:</span> {t.philosophy}
            </div>
            <div className="text-[11px] text-ink-faint">Set during setup — cannot change mid-season.</div>
          </div>
        </Card>
      </div>

      {confirmSwap && (
        <SwapConfirmModal
          state={state}
          component={confirmSwap.key}
          seat={confirmSwap.seat}
          onClose={() => setConfirmSwap(null)}
          onConfirm={() => {
            act((s) =>
              confirmSwap.key === "engine"
                ? replaceEngine(s, confirmSwap.seat).message
                : confirmSwap.key === "gearbox"
                  ? replaceGearbox(s, confirmSwap.seat).message
                  : replacePuComponent(s, confirmSwap.key, confirmSwap.seat).message,
            );
            setConfirmSwap(null);
          }}
        />
      )}
      {testPick && (
        <TestConfirmModal
          state={state}
          type={testPick}
          onClose={() => setTestPick(null)}
          onConfirm={() => {
            act((s) => {
              const r = runTest(s, testPick);
              return `${r.label}: ${r.value}/100 (${r.confidence}% confidence).`;
            });
            setTestPick(null);
          }}
          />
        )}
      </div>
    </div>
  );
}

const TEST_INFO: Record<TestType, string> = {
  performance: "Aero rake runs and power bench tests. Estimates the car's current performance level (aero/chassis/power blend) before you commit development money.",
  reliability: "Endurance rig testing. Estimates component reliability and highlights the DNF-risk areas of the car.",
  tire: "Tire wear simulation across compounds. Estimates how kindly the car treats its tires over long stints.",
  driver: "Simulator session for your race drivers. Reports driver form and gives both a small confidence/morale boost.",
};

function TestConfirmModal({
  state,
  type,
  onClose,
  onConfirm,
}: {
  state: SimulationState;
  type: TestType;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = state.team!;
  const cost = testingBudget()[type];
  return (
    <Modal open onClose={onClose} title={`Run ${type} test?`}>
      <div className="space-y-3 text-sm">
        <p className="rounded-md border-l-2 border-telemetry/50 bg-raised/40 p-3 text-xs leading-relaxed text-ink-soft">{TEST_INFO[type]}</p>
        <div className="grid gap-1 rounded-md border border-hairline bg-raised/40 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-faint">Cost</span>
            <span className="num-data">−<Money value={cost} /></span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-faint">Cash</span>
            <span className="num-data">${t.cash.toFixed(1)}M → ${(t.cash - cost).toFixed(1)}M</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button small variant="ghost" onClick={onClose}>Cancel</Button>
          <Button small onClick={onConfirm}>Yes, run test</Button>
        </div>
      </div>
    </Modal>
  );
}

function SwapConfirmModal({
  state,
  component,
  seat,
  onClose,
  onConfirm,
}: {
  state: SimulationState;
  component: ComponentKey;
  seat: Seat;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = state.team!;
  const cost = replacementCost(component, state) ?? 0;
  const parts = carParts(t, seat);
  const cur: ComponentState =
    component === "engine" || component === "gearbox"
      ? parts[component]
      : (parts.powerUnit[component] ?? { condition: 100, age: 0, replacements: 0 });
  const drv = driverById(seat === "car1" ? t.driver1Id : t.driver2Id, state.season);
  const cashAfter = Math.round((t.cash - cost) * 100) / 100;
  const label = componentLabel(component, state.season);
  const urgent = cur.damaged === true;
  const credit = cashAfter < 0 && urgent;
  const cantAfford = t.cash < cost && !urgent;
  const gridPenalty = component === "engine" ? 10 : component === "gearbox" ? 5 : 0;
  const carried = t.gridPenaltyBySeat?.[seat] ?? 0;
  return (
    <Modal open onClose={onClose} title={`Replace ${label} — ${drv?.shortName ?? seat}?`}>
      <div className="space-y-3 text-sm">
        <p className="text-ink-soft">
          Buy a brand-new {label.toLowerCase()} unit for <span className="font-bold">{drv?.shortName ?? seat}</span>'s car
          for <Money value={cost} />? The old unit is scrapped — this is a one-time purchase, not a recurring fee. The
          other car keeps its own hardware.
        </p>
        {urgent && (
          <p className="rounded-md border-l-2 border-caution bg-caution/10 p-2 text-xs text-caution">
            This part is broken — {label} cannot race until it is replaced.
          </p>
        )}
        <div className="grid gap-2 rounded-md border border-hairline bg-raised/40 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Current condition</span>
            <span className={`num-data ${cur.condition < 50 ? "text-caution" : ""}`}>{cur.condition.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Current age</span>
            <span className="num-data">{cur.age} race(s)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">After replacement</span>
            <span className="num-data text-positive">100% · age 0</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-hairline pt-2">
            <span className="text-ink-faint">Cost</span>
            <span className="num-data text-caution">−<Money value={cost} /></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Cash now</span>
            <Money value={t.cash} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Cash after</span>
            <span className={`num-data ${cashAfter < 0 ? "text-signal" : cashAfter < 10 ? "text-caution" : "text-positive"}`}>
              ${cashAfter.toFixed(2)}M
            </span>
          </div>
        </div>
        {gridPenalty > 0 && (
          <p className="rounded-md border-l-2 border-caution bg-caution/10 p-2 text-xs text-caution">
            Stewards' ruling: a {label.toLowerCase()} change takes a new allocation — {drv?.shortName ?? "this car"}'s
            car drops {gridPenalty} grid places at the next GP
            {carried ? ` (stacks with the −${carried} already carried)` : ""}. Only that car is penalized.
          </p>
        )}
        {credit && (
          <p className="rounded-md border-l-2 border-signal bg-signal/10 p-2 text-xs text-signal">
            You can't cover this from cash — the supplier extends emergency credit and your account goes into the red.
            The bank is watching.
          </p>
        )}
        {cashAfter < 10 && cashAfter >= 0 && (
          <p className="rounded-md border-l-2 border-caution bg-caution/10 p-2 text-xs text-caution">
            Warning: this leaves you with less than $10M. Race weekends cost several million in wages and operations.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button small variant="ghost" onClick={onClose}>Keep current unit</Button>
          <Button small disabled={cantAfford} onClick={onConfirm}>
            Replace for ${cost}M
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Era-aware power system / power unit — configuration lives in data/powerUnits.
// ---------------------------------------------------------------------------

interface PartRow {
  key: ComponentKey;
  name: string;
  spec: string;
  role: string;
  c: ComponentState;
  wear: [number, number];
  ageDrag: number;
  cost: number;
  baseRel: number;
  stats: PuStatSpec[];
}

const ENGINE_WEAR: [number, number] = [2.4, 4.0];
const ENGINE_AGE_DRAG = 0.8;
const GEARBOX_WEAR: [number, number] = [1.9, 3.1];

function partRows(state: SimulationState, seat: Seat): PartRow[] {
  const t = state.team!;
  const cfg = powerUnitForSeason(state.season);
  const parts = carParts(t, seat);
  const pu = parts.powerUnit;
  // Mirrors systems.ensurePuComponents so pre-init saves display the same
  // inherited wear the sim will write on the next race weekend.
  const fallback = (): ComponentState =>
    parts.engine.age === 0
      ? { condition: 100, age: 0, replacements: 0 }
      : {
          condition: Math.max(70, Math.round(96 - parts.engine.age * 1.2)),
          age: parts.engine.age,
          replacements: 0,
        };
  const engBase = engineById(t.engineId)?.reliability ?? t.car.reliability;
  return [
    {
      key: "engine",
      name: cfg.engineName,
      spec: cfg.engineSpec,
      role: cfg.engineRole,
      c: parts.engine,
      wear: ENGINE_WEAR,
      ageDrag: ENGINE_AGE_DRAG,
      cost: replacementCost("engine", state) ?? 0,
      baseRel: engBase,
      stats: [
        { kind: "condition", label: "Condition", hint: "Health of the installed unit." },
        { kind: "reliability", label: "Reliability", hint: "Estimated odds of surviving the weekend." },
        { kind: "output", label: "Output", hint: "Power delivery vs the day it left the factory." },
        { kind: "usageRaces", label: "Age", hint: "Race weekends completed on this unit." },
        { kind: "usageKm", label: "Mileage", hint: "Distance covered since installation." },
      ],
    },
    {
      key: "gearbox",
      name: "Gearbox",
      spec: cfg.gearboxSpec,
      role: gearboxEraNote(state.season),
      c: parts.gearbox,
      wear: GEARBOX_WEAR,
      ageDrag: 0.7,
      cost: replacementCost("gearbox", state) ?? 0,
      baseRel: engBase,
      stats: [
        { kind: "condition", label: "Condition", hint: "Health of case, gears and hydraulics." },
        { kind: "reliability", label: "Reliability", hint: "Estimated odds of surviving the weekend." },
        { kind: "output", label: "Shift quality", hint: "Shift speed vs factory spec." },
        { kind: "usageRaces", label: "Age", hint: "Race weekends completed on this unit." },
        { kind: "usageKm", label: "Mileage", hint: "Distance covered since installation." },
      ],
    },
    ...cfg.components.map((p): PartRow => ({
      key: p.id,
      name: p.name,
      spec: p.spec,
      role: p.role,
      c: pu[p.id] ?? fallback(),
      wear: p.wear,
      ageDrag: p.ageDrag,
      cost: replacementCost(p.id, state) ?? 0,
      baseRel: engBase,
      stats: p.stats,
    })),
  ];
}

function statText(kind: PuStatKind, row: PartRow): string {
  switch (kind) {
    case "condition":
      return `${row.c.condition.toFixed(1)}%`;
    case "wearRate":
      return wearRateLabel(row.wear);
    case "reliability":
      return String(reliabilityEstimate(row.baseRel, row.c));
    case "degradation":
      return `${(100 - row.c.condition).toFixed(1)}%`;
    case "usageRaces":
      return String(row.c.age);
    case "usageKm":
      return `${usageKm(row.c.age).toLocaleString("en-US")} km`;
    default:
      return `${puEffectiveness(row.ageDrag, row.c)}%`;
  }
}

function PowerSystemCard({
  state,
  openPart,
  onToggle,
  onSwap,
}: {
  state: SimulationState;
  openPart: string | null;
  onToggle: (key: string) => void;
  onSwap: (key: ComponentKey, seat: Seat) => void;
}) {
  const t = state.team!;
  const cfg = powerUnitForSeason(state.season);

  return (
    <Card title={cfg.heading} right={<Tag tone="elite">{cfg.title}</Tag>}>
      <p className="mb-3 text-xs leading-relaxed text-ink-faint">
        {cfg.blurb} Each car runs its own hardware — condition, wear and failures are tracked per driver below.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["car1", "car2"] as Seat[]).map((seat) => {
          const drv = driverById(seat === "car1" ? t.driver1Id : t.driver2Id, state.season);
          const sys = effectivePuHealth(state, seat);
          const rows = partRows(state, seat);
          return (
            <div key={seat} className="rounded-md border border-hairline p-2.5">
              <div className="mb-2 flex items-center gap-2">
                <Img src={driverImage(drv?.id ?? "", state.season)} alt={drv?.shortName ?? seat} className="h-7 w-7 rounded-sm object-cover" />
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-bold uppercase tracking-wide">{drv?.shortName ?? seat}</div>
                  <div className="text-[10px] uppercase tracking-widest text-ink-faint">Car {seat === "car1" ? 1 : 2}</div>
                </div>
              </div>
              <div className="mb-2 rounded-md border border-hairline bg-raised/40 p-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-ink-faint">
                  <span>system health</span>
                  <span className={`num-data text-xs ${sys < 50 ? "text-caution" : sys > 90 ? "text-positive" : "text-ink-soft"}`}>
                    {sys.toFixed(1)}%
                  </span>
                </div>
                <Meter value={sys} tone={ratingTone(sys)} className="mt-1" />
              </div>
              <div className="space-y-2">
                {rows.map((r) => (
                  <PuRow
                    key={`${seat}-${r.key}`}
                    row={r}
                    cash={t.cash}
                    open={openPart === `${seat}-${r.key}`}
                    onToggle={() => onToggle(`${seat}-${r.key}`)}
                    onSwap={() => onSwap(r.key, seat)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-ink-faint">
        Fresh units run at 100% and lower the failure chance in races. Wear grows every weekend and speeds up as
        reliability drops — in the turbo-hybrid era every subsystem drags on the whole unit.
      </p>
    </Card>
  );
}

function PuRow({
  row,
  cash,
  open,
  onToggle,
  onSwap,
}: {
  row: PartRow;
  cash: number;
  open: boolean;
  onToggle: () => void;
  onSwap: () => void;
}) {
  const worn = row.c.condition < 50;
  return (
    <div className={`rounded-md border p-3 ${worn ? "border-caution/60" : "border-hairline"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 text-left">
        <div className="min-w-0">
          <div className="truncate font-display font-bold uppercase">{row.name}</div>
          <div className="text-[10px] text-ink-faint">
            age {row.c.age} · {row.c.replacements} replaced{open ? "" : " · tap for detail"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`num-data text-base ${worn ? "text-caution" : "text-ink-soft"}`}>{row.c.condition.toFixed(1)}%</span>
          <span className="w-3 text-center text-xs text-ink-faint">{open ? "▾" : "▸"}</span>
        </div>
      </button>
      <Meter value={row.c.condition} tone={ratingTone(row.c.condition)} className="my-2" />
      {open && (
        <div className="space-y-2 border-t border-hairline pt-2">
          <p className="num-data rounded-sm bg-raised/40 px-2 py-1 text-[10px] leading-relaxed text-telemetry">{row.spec}</p>
          <p className="text-[11px] leading-relaxed text-ink-soft">{row.role}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {row.stats.map((st) => (
              <div key={`${st.kind}-${st.label}`} title={st.hint} className="rounded-sm border border-hairline bg-raised/40 px-2 py-1">
                <div className="text-[9px] uppercase tracking-wider text-ink-faint">{st.label}</div>
                <div className="num-data text-xs font-bold">{statText(st.kind, row)}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-ink-faint">fresh unit → 100% · age 0</span>
            <Button
              small
              variant={row.c.damaged ? "signal" : "positive"}
              disabled={cash < row.cost}
              onClick={onSwap}
              title={`Swap in a brand-new ${row.name} for $${row.cost}M`}
            >
              Replace ${row.cost}M
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
