import { useState } from "react";
import type { SimulationState } from "@/simulation/types";
import {
  generateDevOptions,
  isDevWindow,
  replacementCost,
} from "@/simulation/systems";
import { replaceEngine, replaceGearbox, startDev } from "@/actions";
import { Button, Card, Empty, Meter, Modal, Money } from "@/ui/kit";
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
  const devInterval = Math.max(3, Math.round(state.calendar.length / 4));
  const roundsToWindow = devInterval - (state.completedRounds % devInterval);
  const [confirmSwap, setConfirmSwap] = useState<"engine" | "gearbox" | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Development window">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-ink-soft">
              {devWindow
                ? "A development window is OPEN. Choose one upgrade to start."
                : `Next development window in ${roundsToWindow} round${roundsToWindow === 1 ? "" : "s"}.`}
            </div>
            <div className="flex items-center gap-2">
              <Meter value={state.completedRounds % devInterval} max={devInterval} tone="elite" className="w-32" />
            </div>
          </div>
          <div className={`mt-3 grid gap-2 sm:grid-cols-2 ${!devWindow ? "pointer-events-none opacity-50" : ""}`}>
            {options.map((o) => {
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
        <Card title="Component swaps">
          <div className="space-y-3">
            <SwapRow
              label="Engine"
              condition={t.components.engine.condition}
              age={t.components.engine.age}
              replacements={t.components.engine.replacements}
              cost={replacementCost("engine", state) ?? 0}
              cash={t.cash}
              onSwap={() => setConfirmSwap("engine")}
            />
            <SwapRow
              label="Gearbox"
              condition={t.components.gearbox.condition}
              age={t.components.gearbox.age}
              replacements={t.components.gearbox.replacements}
              cost={replacementCost("gearbox", state) ?? 0}
              cash={t.cash}
              onSwap={() => setConfirmSwap("gearbox")}
            />
          </div>
          <p className="mt-3 text-[11px] text-ink-faint">
            Fresh components run at 100% and lower the failure chance in races. Wear grows every weekend and speeds up as
            reliability drops.
          </p>
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
            act((s) => (confirmSwap === "engine" ? replaceEngine(s).message : replaceGearbox(s).message));
            setConfirmSwap(null);
          }}
        />
      )}
    </div>
  );
}

function SwapConfirmModal({
  state,
  component,
  onClose,
  onConfirm,
}: {
  state: SimulationState;
  component: "engine" | "gearbox";
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = state.team!;
  const cost = replacementCost(component, state) ?? 0;
  const cur = t.components[component];
  const cashAfter = Math.round((t.cash - cost) * 100) / 100;
  const label = component === "engine" ? "Engine" : "Gearbox";
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
            <span className={`tabular font-semibold ${cur.condition < 50 ? "text-caution" : ""}`}>{cur.condition.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Current age</span>
            <span className="tabular">{cur.age} race(s)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">After replacement</span>
            <span className="tabular font-semibold text-positive">100% · age 0</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-hairline pt-2">
            <span className="text-ink-faint">Cost</span>
            <span className="tabular font-semibold text-caution">−<Money value={cost} /></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Cash now</span>
            <Money value={t.cash} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Cash after</span>
            <span className={`tabular font-bold ${cashAfter < 0 ? "text-signal" : cashAfter < 10 ? "text-caution" : "text-positive"}`}>
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

function SwapRow({
  label, condition, age, replacements, cost, cash, onSwap,
}: { label: string; condition: number; age: number; replacements: number; cost: number; cash: number; onSwap: () => void }) {
  return (
    <div className="rounded-md border border-hairline p-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold">{label}</span>
        <span className={`tabular text-sm ${condition < 50 ? "text-caution" : "text-ink-soft"}`}>{condition.toFixed(1)}%</span>
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