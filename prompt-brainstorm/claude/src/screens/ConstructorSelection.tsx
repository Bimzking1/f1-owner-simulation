import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TelemetryStat } from "@/components/ui/TelemetryStat";
import { AssetPlaceholder } from "@/lib/assetMap";
import { mockConstructors } from "@/lib/mockData";
import { useState } from "react";

export function ConstructorSelection() {
  const [selected, setSelected] = useState(mockConstructors[0].id);
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Constructor Selection</Eyebrow>
        <SectionTitle>Pick your team</SectionTitle>
        <p className="mt-2 text-sm text-ink-soft max-w-lg">
          Your constructor sets your starting infrastructure, budget, and
          development ceiling for the whole season.
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {mockConstructors.map((c) => (
            <Card
              key={c.id}
              interactive
              selected={selected === c.id}
              onClick={() => setSelected(c.id)}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <AssetPlaceholder label={`${c.name} logo`} aspect="aspect-square" className="w-14" />
                <div>
                  <div className="font-display text-lg font-semibold text-ink">{c.name}</div>
                  <Badge tone="neutral">{c.tier}</Badge>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl tabular text-signal">{c.overall}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  overall rating
                </span>
              </div>

              <div className="space-y-1">
                <TelemetryStat geekLabel="Infrastructure" enjoyerLabel="Facilities" value={c.infrastructure} emphasis="telemetry" />
                <TelemetryStat geekLabel="Budget" enjoyerLabel="Spending power" value={c.budget} emphasis="telemetry" />
                <TelemetryStat geekLabel="Development Potential" enjoyerLabel="Room to improve" value={c.developmentPotential} emphasis="elite" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <div className="font-mono text-[10px] uppercase text-positive">Strengths</div>
                  <ul className="mt-1 space-y-0.5 text-ink-soft">
                    {c.strengths.map((s) => <li key={s}>+ {s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase text-signal">Weaknesses</div>
                  <ul className="mt-1 space-y-0.5 text-ink-soft">
                    {c.weaknesses.map((s) => <li key={s}>– {s}</li>)}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
