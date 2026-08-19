import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { TelemetryStat } from "@/components/ui/TelemetryStat";
import { mockGearboxes } from "@/lib/mockData";
import { useState } from "react";

export function GearboxSelection() {
  const [selected, setSelected] = useState(mockGearboxes[0].id);
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Gearbox Selection</Eyebrow>
        <SectionTitle>Choose your gearbox</SectionTitle>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockGearboxes.map((g) => (
            <Card key={g.id} interactive selected={selected === g.id} onClick={() => setSelected(g.id)}>
              <div className="font-display text-lg font-semibold text-ink">{g.name}</div>
              <div className="mt-1 font-mono text-sm tabular text-ink-soft">${g.cost}M / season</div>
              <div className="mt-3 space-y-1">
                <TelemetryStat geekLabel="Performance" enjoyerLabel="Shift speed" value={g.performance} emphasis="signal" />
                <TelemetryStat geekLabel="Reliability" enjoyerLabel="Durability" value={g.reliability} emphasis="telemetry" />
              </div>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
