import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const tests = [
  { id: "t1", name: "Performance Test", desc: "Push for a lap-time benchmark against the field.", risk: "Reveals a rough car performance range, ±3", cost: 2 },
  { id: "t2", name: "Reliability Test", desc: "Run high mileage to surface early failure points.", risk: "May flag a weak component before the season starts", cost: 3 },
  { id: "t3", name: "Tire Test", desc: "Build tire degradation data across compounds.", risk: "Improves in-race strategy accuracy", cost: 1.5 },
  { id: "t4", name: "Driver Test", desc: "Extra seat time for a rookie or new signing.", risk: "Small confidence and consistency boost", cost: 1 },
];

export function PreSeasonTesting() {
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} cash={41.2} />
      <Page>
        <Eyebrow>Pre-Season Testing</Eyebrow>
        <SectionTitle>Final preparation</SectionTitle>
        <p className="mt-2 text-sm text-ink-soft max-w-lg">
          Testing results are uncertain — you're buying information, not
          guaranteed performance.
        </p>

        <div className="mt-6 space-y-3">
          {tests.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-display text-base font-semibold text-ink">{t.name}</div>
                <p className="text-sm text-ink-soft mt-0.5">{t.desc}</p>
                <Badge tone="telemetry">{t.risk}</Badge>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-sm tabular text-ink-soft mb-2">${t.cost}M</div>
                <Button variant="secondary" className="text-xs px-3 py-2">Run</Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button>Head to the Grid</Button>
        </div>
      </Page>
    </div>
  );
}
