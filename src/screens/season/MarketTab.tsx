import { useState } from "react";
import type { SimulationState, TestType } from "@/simulation/types";
import {
  driverById,
  driversByTeam,
  engineerById,
  mechanicById,
} from "@/data";
import {
  fireEngineer,
  fireMechanic,
  hireEngineer,
  hireMechanic,
  runTest,
  swapDriver,
  swapQuote,
  testingBudget,
  undoDriverSwap,
} from "@/actions";
import { Button, Card, Img, Modal, Money, Tag } from "@/ui/kit";
import { driverImage } from "@/data/assets";
import type { Act } from "./parts";

interface Props {
  state: SimulationState;
  act: Act;
}

const ENGINEER_IDS: Record<number, string[]> = {
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

const MECHANIC_IDS: Record<number, string[]> = {
  2013: ["mech-budget13", "mech-standard13", "mech-elite13"],
  2025: ["mech-budget25", "mech-standard25", "mech-elite25"],
};

export function MarketTab({ state, act }: Props) {
  const t = state.team!;
  const [pending, setPending] = useState<{ slot: 1 | 2; driverId: string } | null>(null);
  const seasonDrivers = Object.values(driversByTeam(state.season))
    .flat()
    .map(driverById)
    .filter((d): d is NonNullable<typeof d> => !!d)
    .sort((a, b) => b.overall - a.overall);
  const freeAgents = seasonDrivers.filter((d) => d.id !== t.driver1Id && d.id !== t.driver2Id);
  const engineers = ENGINEER_IDS[state.season].map(engineerById).filter((e) => !!e).map((e) => e!);
  const mechanics = MECHANIC_IDS[state.season].map(mechanicById).filter((m) => !!m).map((m) => m!);
  const costs = testingBudget();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card
          title="Driver market"
          right={
            <div className="flex items-center gap-2">
              {state.lastSwap ? (
                <Button small variant="danger" onClick={() => act((s) => undoDriverSwap(s).message)}>
                  Undo last swap
                </Button>
              ) : null}
              <Tag tone="telemetry">Swaps cost prorated salary + $2M</Tag>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {([1, 2] as const).map((slot) => {
              const id = slot === 1 ? t.driver1Id : t.driver2Id;
              const cur = driverById(id, state.season);
              return (
                <div key={slot} className="rounded-md border border-hairline p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-display font-bold">Seat {slot}</span>
                    {cur && <Tag tone="elite">{cur.shortName}</Tag>}
                    <span className="ml-auto text-[11px] text-ink-faint">OVR {cur?.overall}</span>
                  </div>
                  <div className="max-h-64 space-y-1 overflow-auto pr-1">
                    {freeAgents.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setPending({ slot, driverId: d.id })}
                        className="flex w-full items-center gap-2 rounded-sm border border-hairline px-2 py-1 text-left text-sm hover:border-telemetry"
                      >
                        <Img src={driverImage(d.id, state.season)} alt={d.shortName} className="h-6 w-6 rounded-sm object-cover" />
                        <span className="min-w-0 flex-1 truncate">{d.shortName}</span>
                        <span className="text-[11px] text-ink-faint">OVR {d.overall}</span>
                        <span className="text-[11px] text-ink-faint">${d.salary}M</span>
                        <Tag tone="telemetry">Swap</Tag>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {pending && (
          <SwapConfirm
            state={state}
            slot={pending.slot}
            driverId={pending.driverId}
            onCancel={() => setPending(null)}
            onConfirm={() => {
              act((s) => swapDriver(s, pending.slot, pending.driverId).message);
              setPending(null);
            }}
          />
        )}

        <Card title="Workshop — engineers" right={<Tag tone="telemetry">{t.engineerIds.length}/5</Tag>}>
          <div className="grid gap-1 sm:grid-cols-2">
            {engineers.map((e) => {
              const hired = t.engineerIds.includes(e.id);
              return (
                <div key={e.id} className="flex items-center gap-2 rounded-sm border border-hairline px-2 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{e.name}</span>
                  <span className="text-[11px] text-ink-faint">{e.department} · ${e.cost}M/yr</span>
                  {hired ? (
                    <Button small variant="danger" onClick={() => act((s) => fireEngineer(s, e.id).message)}>Fire</Button>
                  ) : (
                    <Button
                      small variant="ghost"
                      disabled={t.engineerIds.length >= 5}
                      onClick={() => act((s) => hireEngineer(s, e.id).message)}
                    >
                      Hire
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Pit crew — mechanics" right={<Tag tone="telemetry">{t.mechanicIds.length}/5</Tag>}>
          <div className="grid gap-1 sm:grid-cols-2">
            {mechanics.map((m) => {
              const hired = t.mechanicIds.includes(m.id);
              return (
                <div key={m.id} className="flex items-center gap-2 rounded-sm border border-hairline px-2 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="text-[11px] text-ink-faint">{m.pitStop.toFixed(2)}s · ${m.cost}M/yr</span>
                  {hired ? (
                    <Button small variant="danger" onClick={() => act((s) => fireMechanic(s, m.id).message)}>Fire</Button>
                  ) : (
                    <Button
                      small variant="ghost"
                      disabled={t.mechanicIds.length >= 5}
                      onClick={() => act((s) => hireMechanic(s, m.id).message)}
                    >
                      Hire
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Testing">
          <div className="space-y-2">
            {(["performance", "reliability", "tire", "driver"] as TestType[]).map((type) => (
              <button
                key={type}
                type="button"
                disabled={t.cash < costs[type]}
                onClick={() =>
                  act((s) => {
                    runTest(s, type);
                    return `${type} test done.`;
                  })
                }
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

        <Card title="Team orders">
          <div className="flex flex-wrap gap-2">
            {(["equal", "priority1", "priority2"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() =>
                  act((s) => {
                    s.team!.teamOrders = o;
                    return `Orders: ${o}.`;
                  })
                }
                className={`rounded-sm border px-2 py-1 text-xs uppercase tracking-wider ${
                  t.teamOrders === o ? "border-signal bg-signal/15 text-signal" : "border-hairline text-ink-soft"
                }`}
              >
                {o === "equal" ? "Equal" : o === "priority1" ? "1 leads" : "2 leads"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">Affects driver confidence swings between teammates.</p>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const COMPARE_KEYS: { key: string; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "pace", label: "Pace" },
  { key: "qualifying", label: "Qualifying" },
  { key: "racecraft", label: "Racecraft" },
  { key: "consistency", label: "Consistency" },
  { key: "tireManagement", label: "Tire mgmt" },
  { key: "wetSkill", label: "Wet skill" },
  { key: "pressure", label: "Pressure" },
  { key: "adaptability", label: "Adaptability" },
];

function SwapConfirm({
  state,
  slot,
  driverId,
  onCancel,
  onConfirm,
}: {
  state: SimulationState;
  slot: 1 | 2;
  driverId: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = state.team!;
  const quote = swapQuote(state, slot, driverId);
  if (!quote) return null;
  const cur = driverById(quote.currentId, state.season);
  const otherId = slot === 1 ? t.driver2Id : t.driver1Id;
  const onTeam = driverId === otherId;

  const val = (d: Pick<typeof quote.target, "attributes" | "overall">, key: string) =>
    key === "overall" ? d.overall : (d.attributes as unknown as Record<string, number>)[key];

  const swapText = "Replaces the seat holder during the season. The new driver's salary is prorated for the rounds left; extra salary plus a $2M break fee is paid now. Confirmed swaps can be undone once (Undo last swap) — but only until you run the next race weekend.";

  return (
    <Modal open onClose={onCancel} title={`Confirm swap — Seat ${slot}`}>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-ink-soft">{swapText}</p>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <DriverMini d={cur} season={state.season} />
          <span className="font-display text-xl font-bold text-telemetry">→</span>
          <DriverMini d={quote.target} label="New" season={state.season} />
        </div>

        <div className="divide-y divide-hairline/60 rounded-md border border-hairline">
          {COMPARE_KEYS.map(({ key, label }) => {
            const a = val(cur ?? quote.target, key);
            const b = val(quote.target, key);
            const delta = b - a;
            return (
              <div key={key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1 text-sm">
                <span className="text-right tabular">{a}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>
                <span className={`text-left tabular ${b > a ? "text-positive" : b < a ? "text-signal" : "text-ink-soft"}`}>
                  {b}
                  {delta !== 0 && <span className="ml-1 text-[10px]">{delta > 0 ? `+${delta}` : delta}</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-1 rounded-md border border-hairline bg-raised/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-faint">Salary prorated (rounds left)</span>
            <span className={`tabular ${quote.prorated > 0 ? "text-signal" : "text-positive"}`}>
              {quote.prorated > 0 ? "+" : "−"}${quote.prorated.toFixed(1)}M
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-faint">Break fee</span>
            <span className="tabular text-signal">−$2.0M</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-1 font-semibold">
            <span>Total cost</span>
            <Money value={-quote.total} className={quote.canAfford ? "" : "text-signal"} />
          </div>
          {!quote.canAfford && <div className="text-[11px] font-semibold uppercase tracking-wider text-signal">Not enough cash — need $${quote.total.toFixed(1)}M</div>}
          <div className="pt-1 text-[11px] leading-relaxed text-ink-faint">
            Warning: the swap affects morale and line-up immediately. Undo is possible only once, before the next race.
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            variant={quote.canAfford && !onTeam ? "primary" : "ghost"}
            disabled={!quote.canAfford || onTeam}
            onClick={onConfirm}
          >
            {onTeam ? "Already on the team" : `Swap ${quote.target.shortName}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DriverMini({ d, label, season }: { d: ReturnType<typeof driverById>; label?: string; season: number }) {
  if (!d) return <div className="text-xs text-ink-faint">—</div>;
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-hairline bg-raised/50 p-2">
      {label && <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">{label}</span>}
      <Img src={driverImage(d.id, season)} alt={d.shortName} className="h-10 w-10 rounded-sm object-cover" />
      <span className="font-display text-sm font-bold">{d.shortName}</span>
      <span className="text-[11px] text-ink-faint">OVR {d.overall} · ${d.salary}M/yr</span>
    </div>
  );
}