import { useState } from "react";
import type { SimulationState, TestType } from "@/simulation/types";
import { testingBudget } from "@/actions";
import { Button, Card, Empty, Modal, Money, Tag } from "@/ui/kit";

interface Props {
  state: SimulationState;
  onRunTest: (type: TestType) => void;
  onStartSeason: () => void;
}

const TEST_INFO: Record<TestType, { name: string; desc: string; effect: string }> = {
  performance: {
    name: "Performance Test",
    desc: "Baseline pace versus the field on reference tracks.",
    effect: "Reveals how competitive the car is — no direct driver effect.",
  },
  reliability: {
    name: "Reliability Test",
    desc: "Long-run rig for component failure odds.",
    effect: "Reveals component failure odds — no direct driver effect.",
  },
  tire: {
    name: "Tire Wear Test",
    desc: "Degradation curves over a race distance.",
    effect: "Reveals tire degradation — no direct driver effect.",
  },
  driver: {
    name: "Driver Simulator",
    desc: "Seat time and feedback on the new car.",
    effect: "+4 confidence and +3 morale to both drivers.",
  },
};

export default function TestingScreen({ state, onRunTest, onStartSeason }: Props) {
  const [flash, setFlash] = useState<string>("");
  const [confirm, setConfirm] = useState<TestType | null>(null);
  const budget = testingBudget();

  function handle(type: TestType) {
    setConfirm(null);
    const t = state.team!;
    if (t.cash < budget[type]) {
      setFlash(`Not enough cash for the ${TEST_INFO[type].name} ($${budget[type]}M).`);
      return;
    }
    setFlash(`${TEST_INFO[type].name} complete.`);
    onRunTest(type);
  }

  const confirmType = confirm ? TEST_INFO[confirm] : null;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-36 pt-10">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Pre-Season Testing</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Run tests before the first race to size up your starting package. Costs money; gives insight.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(Object.keys(TEST_INFO) as TestType[]).map((type) => (
          <Card key={type} title={TEST_INFO[type].name}>
            <p className="text-xs text-ink-soft">{TEST_INFO[type].desc}</p>
            <p className="mt-1 text-[11px] text-ink-faint">{TEST_INFO[type].effect}</p>
            <div className="mt-3 flex items-center justify-between">
              <Money value={budget[type]} />
              <Button small onClick={() => setConfirm(type)} disabled={state.team!.cash < budget[type]}>
                Run test
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {flash && <div className="mt-4 text-sm text-telemetry">{flash}</div>}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirmType ? `${confirmType.name} — confirm?` : ""}
      >
        {confirm && confirmType && (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">{confirmType.desc}</p>
            <div className="rounded-md border border-hairline bg-raised/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-faint">Cost</span>
                <Money value={budget[confirm]} className="font-display font-bold" />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-faint">Report confidence</span>
                <span className="tabular">55–95%</span>
              </div>
              <div className="mt-1 flex items-start justify-between gap-4">
                <span className="text-ink-faint">Effect</span>
                <span className="text-right">{confirmType.effect}</span>
              </div>
            </div>
            {confirm === "driver" && (
              <div className="flex flex-wrap gap-2">
                <Tag tone="positive">+4 confidence / driver</Tag>
                <Tag tone="positive">+3 morale / driver</Tag>
              </div>
            )}
            <p className="text-xs text-ink-faint">
              You have ${state.team!.cash}M. Testing is optional — skip it if you want to keep the cash.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button onClick={() => handle(confirm)}>Run test (−${budget[confirm]}M)</Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="mt-6">
        <Card title="Simulator reports">
          {state.testing.length === 0 ? (
            <Empty>No reports yet.</Empty>
          ) : (
            <div className="divide-y divide-hairline">
              {state.testing.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {r.label} <Tag tone="telemetry">{r.value}/100</Tag>
                      <Tag tone={r.confidence >= 75 ? "positive" : "caution"}>{r.confidence}% confidence</Tag>
                    </div>
                    <p className="mt-1 text-xs text-ink-faint">{r.insight}</p>
                  </div>
                  <Money value={r.cost} className="shrink-0 text-xs text-ink-faint" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3">
        <Button onClick={onStartSeason}>Start the Season →</Button>
      </div>
    </div>
  );
}