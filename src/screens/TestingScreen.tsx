import { useState } from "react";
import type { SimulationState, TestType } from "@/simulation/types";
import { testingBudget } from "@/actions";
import { Button, Card, Empty, Money, Tag } from "@/ui/kit";

interface Props {
  state: SimulationState;
  onRunTest: (type: TestType) => void;
  onStartSeason: () => void;
}

const TEST_INFO: Record<TestType, { name: string; desc: string }> = {
  performance: { name: "Performance Test", desc: "Baseline pace versus the field on reference tracks." },
  reliability: { name: "Reliability Test", desc: "Long-run rig for component failure odds." },
  tire: { name: "Tire Wear Test", desc: "Degradation curves over a race distance." },
  driver: { name: "Driver Simulator", desc: "Seat time and feedback on the new car." },
};

export default function TestingScreen({ state, onRunTest, onStartSeason }: Props) {
  const [flash, setFlash] = useState<string>("");
  const budget = testingBudget();

  function handle(type: TestType) {
    const t = state.team!;
    if (t.cash < budget[type]) {
      setFlash(`Not enough cash for the ${TEST_INFO[type].name} ($${budget[type]}M).`);
      return;
    }
    setFlash(`${TEST_INFO[type].name} complete.`);
    onRunTest(type);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Pre-Season Testing</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Run tests before the first race to size up your starting package. Costs money; gives insight.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(Object.keys(TEST_INFO) as TestType[]).map((type) => (
          <Card key={type} title={TEST_INFO[type].name}>
            <p className="text-xs text-ink-soft">{TEST_INFO[type].desc}</p>
            <div className="mt-3 flex items-center justify-between">
              <Money value={budget[type]} />
              <Button small onClick={() => handle(type)} disabled={state.team!.cash < budget[type]}>
                Run test
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {flash && <div className="mt-4 text-sm text-telemetry">{flash}</div>}

      <div className="mt-6">
        <Card title="Simulator reports">
          {state.testing.length === 0 ? (
            <Empty>No reports yet.</Empty>
          ) : (
            <div className="divide-y divide-hairline">
              {state.testing.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
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

      <div className="mt-8 flex justify-end">
        <Button onClick={onStartSeason}>Start the Season →</Button>
      </div>
    </div>
  );
}