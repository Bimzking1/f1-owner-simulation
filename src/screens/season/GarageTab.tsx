import { useState } from "react";
import type { ComponentKey, ComponentState, SimulationState, TestType } from "@/simulation/types";
import {
  effectivePuHealth,
  generateDevOptions,
  isDevWindow,
  replacementCost,
} from "@/simulation/systems";
import { engineById } from "@/data";
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
import { Button, Card, Empty, Meter, Modal, Money, Tag } from "@/ui/kit";
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
  const [confirmSwap, setConfirmSwap] = useState<ComponentKey | null>(null);
  const [openPart, setOpenPart] = useState<ComponentKey | null>(null);
  const [testPick, setTestPick] = useState<TestType | null>(null);
  const costs = testingBudget();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
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
                    <Button
                      small
                      variant={devWindow && !running ? "primary" : "ghost"}
                      disabled={!devWindow || running}
                      onClick={() => act((x) => startDev(x, o).message)}
                    >
                      {running ? "In progress" : "Start"}
                    </Button>
                  </div>
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
            {t.upgrades.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span>{u.name}</span>
                <div className="flex items-center gap-2">
                  <Meter value={((u.totalRaces - u.remainingRaces) / u.totalRaces) * 100} tone="elite" className="w-28" />
                  <span className="text-xs text-ink-faint">{u.remainingRaces} race(s) left</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <PowerSystemCard
          state={state}
          openPart={openPart}
          onToggle={(key) => setOpenPart((cur) => (cur === key ? null : key))}
          onSwap={(key) => setConfirmSwap(key)}
        />

        <Card title="Gearbox">
          <SwapRow
            label="Gearbox"
            condition={t.components.gearbox.condition}
            age={t.components.gearbox.age}
            replacements={t.components.gearbox.replacements}
            cost={replacementCost("gearbox", state) ?? 0}
            cash={t.cash}
            onSwap={() => setConfirmSwap("gearbox")}
          />
          <p className="mt-3 text-[11px] text-ink-faint">{gearboxEraNote(state.season)}</p>
        </Card>

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
          component={confirmSwap}
          onClose={() => setConfirmSwap(null)}
          onConfirm={() => {
            act((s) =>
              confirmSwap === "engine"
                ? replaceEngine(s).message
                : confirmSwap === "gearbox"
                  ? replaceGearbox(s).message
                  : replacePuComponent(s, confirmSwap).message,
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
  onClose,
  onConfirm,
}: {
  state: SimulationState;
  component: ComponentKey;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = state.team!;
  const cost = replacementCost(component, state) ?? 0;
  const cur: ComponentState =
    component === "engine" || component === "gearbox"
      ? t.components[component]
      : (t.components.powerUnit?.[component] ?? { condition: 100, age: 0, replacements: 0 });
  const cashAfter = Math.round((t.cash - cost) * 100) / 100;
  const label = componentLabel(component, state.season);
  return (
    <Modal open onClose={onClose} title={`Replace ${label}?`}>
      <div className="space-y-3 text-sm">
        <p className="text-ink-soft">
          Buy a brand-new {label.toLowerCase()} unit for <Money value={cost} />? The old unit is scrapped — this is a
          one-time purchase, not a recurring fee.
        </p>
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
        {cashAfter < 10 && cashAfter >= 0 && (
          <p className="rounded-md border-l-2 border-caution bg-caution/10 p-2 text-xs text-caution">
            Warning: this leaves you with less than $10M. Race weekends cost several million in wages and operations.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button small variant="ghost" onClick={onClose}>Keep current unit</Button>
          <Button small disabled={t.cash < cost} onClick={onConfirm}>
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

function partRows(state: SimulationState): PartRow[] {
  const t = state.team!;
  const cfg = powerUnitForSeason(state.season);
  const pu = t.components.powerUnit ?? {};
  // Mirrors systems.ensurePuComponents so pre-init saves display the same
  // inherited wear the sim will write on the next race weekend.
  const fallback = (): ComponentState =>
    t.components.engine.age === 0
      ? { condition: 100, age: 0, replacements: 0 }
      : {
          condition: Math.max(70, Math.round(96 - t.components.engine.age * 1.2)),
          age: t.components.engine.age,
          replacements: 0,
        };
  const engBase = engineById(t.engineId)?.reliability ?? t.car.reliability;
  return [
    {
      key: "engine",
      name: cfg.engineName,
      spec: cfg.engineSpec,
      role: cfg.engineRole,
      c: t.components.engine,
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
  openPart: ComponentKey | null;
  onToggle: (key: ComponentKey) => void;
  onSwap: (key: ComponentKey) => void;
}) {
  const t = state.team!;
  const cfg = powerUnitForSeason(state.season);
  const sys = effectivePuHealth(state);
  const rows = partRows(state);

  return (
    <Card title={cfg.heading} right={<Tag tone="elite">{cfg.title}</Tag>}>
      <p className="mb-3 text-xs leading-relaxed text-ink-faint">{cfg.blurb}</p>

      <div className="mb-3 rounded-md border border-hairline bg-raised/40 p-2">
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
            key={r.key}
            row={r}
            cash={t.cash}
            open={openPart === r.key}
            onToggle={() => onToggle(r.key)}
            onSwap={() => onSwap(r.key)}
          />
        ))}
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
            <Button small variant="ghost" disabled={cash < row.cost} onClick={onSwap}>
              Replace ${row.cost}M
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SwapRow({
  label, condition, age, replacements, cost, cash, onSwap,
}: { label: string; condition: number; age: number; replacements: number; cost: number; cash: number; onSwap: () => void }) {
  return (
    <div className="rounded-md border border-hairline p-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold uppercase">{label}</span>
        <span className={`num-data text-base ${condition < 50 ? "text-caution" : "text-ink-soft"}`}>{condition.toFixed(1)}%</span>
      </div>
      <Meter value={condition} tone={ratingTone(condition)} className="my-2" />
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>age {age} race(s) · {replacements} replaced</span>
        <Button small variant="ghost" disabled={cash < cost} onClick={onSwap}>
          Replace ${cost}M
        </Button>
      </div>
    </div>
  );
}