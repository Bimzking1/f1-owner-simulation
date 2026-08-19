import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TelemetryStat } from "@/components/ui/TelemetryStat";
import { mockEngines } from "@/lib/mockData";
import { useState } from "react";

export function EngineSelection() {
  const [selected, setSelected] = useState(mockEngines[0].id);
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Engine Selection</Eyebrow>
        <SectionTitle>Choose your power unit</SectionTitle>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockEngines.map((e) => (
            <Card key={e.id} interactive selected={selected === e.id} onClick={() => setSelected(e.id)}>
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-semibold text-ink">{e.name}</div>
                <Badge tone={e.status === "Factory" ? "elite" : "neutral"}>{e.status}</Badge>
              </div>
              <div className="mt-1 font-mono text-sm tabular text-ink-soft">${e.cost}M / season</div>
              <div className="mt-3 space-y-1">
                <TelemetryStat geekLabel="Power" enjoyerLabel="Straight-line speed" value={e.power} emphasis="signal" />
                <TelemetryStat geekLabel="Reliability" enjoyerLabel="Won't let you down" value={e.reliability} emphasis="telemetry" />
                <TelemetryStat geekLabel="Efficiency" enjoyerLabel="Fuel/energy management" value={e.efficiency} emphasis="elite" />
              </div>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
