import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryStat } from "@/components/ui/TelemetryStat";
import { AssetPlaceholder } from "@/lib/assetMap";
import { mockDrivers } from "@/lib/mockData";
import { useState } from "react";

export function DriverSelection() {
  const [picked, setPicked] = useState<string[]>([mockDrivers[0].id]);
  const [compare, setCompare] = useState(false);

  function togglePick(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow>Driver Selection</Eyebrow>
            <SectionTitle>Sign your lineup</SectionTitle>
          </div>
          <Button variant="secondary" onClick={() => setCompare((c) => !c)}>
            {compare ? "Card view" : "Compare"}
          </Button>
        </div>
        <p className="mt-2 text-sm text-ink-soft max-w-lg">
          Pick two drivers. Salary comes out of your budget for the whole season.
        </p>

        {!compare && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDrivers.map((d) => (
              <Card
                key={d.id}
                interactive
                selected={picked.includes(d.id)}
                onClick={() => togglePick(d.id)}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <AssetPlaceholder label={`${d.name} photo`} aspect="aspect-square" className="w-14" />
                  <div className="min-w-0">
                    <div className="font-display text-base font-semibold text-ink truncate">{d.name}</div>
                    <div className="flex gap-1.5 mt-0.5">
                      <Badge tone="neutral">{d.personality}</Badge>
                      {d.rookie && <Badge tone="elite">Rookie</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-2xl tabular text-signal">{d.overall}</span>
                  <span className="font-mono text-sm tabular text-ink-soft">${d.salary}M/yr</span>
                </div>

                <div className="space-y-1">
                  <TelemetryStat geekLabel="Pace" enjoyerLabel="Raw speed" value={d.pace} emphasis="telemetry" />
                  <TelemetryStat geekLabel="Racecraft" enjoyerLabel="Overtaking" value={d.racecraft} emphasis="telemetry" />
                  <TelemetryStat geekLabel="Consistency" enjoyerLabel="Reliability of results" value={d.consistency} emphasis="telemetry" />
                  <TelemetryStat geekLabel="Potential" enjoyerLabel="Growth ceiling" value={d.potential} emphasis="elite" />
                </div>

                <div className="flex justify-between text-xs pt-1 border-t border-hairline mt-1">
                  <span className="text-ink-faint">Morale {d.morale}</span>
                  <span className="text-ink-faint">Confidence {d.confidence}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {compare && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-ink-faint border-b border-hairline">
                  <th className="py-2">Attribute</th>
                  {mockDrivers.map((d) => (
                    <th key={d.id} className="py-2 text-ink">{d.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {(["overall", "pace", "qualifying", "racecraft", "consistency", "tireManagement", "wetSkill", "potential"] as const).map((k) => (
                  <tr key={k}>
                    <td className="py-2 text-ink-soft capitalize">{k}</td>
                    {mockDrivers.map((d) => (
                      <td key={d.id} className="py-2 font-mono tabular text-ink">{d[k]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm text-ink-soft">{picked.length}/2 drivers selected</span>
          <Button disabled={picked.length !== 2}>Confirm Lineup</Button>
        </div>
      </Page>
    </div>
  );
}
