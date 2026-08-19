import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AssetPlaceholder } from "@/lib/assetMap";
import { mockRaceEvents } from "@/lib/mockData";
import { useState } from "react";

const tabs = ["Qualifying", "Race", "Result"] as const;

export function RaceWeekend() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Race");

  return (
    <div className="min-h-screen">
      <NavBar season={2025} round={8} totalRounds={24} cash={42.8} />
      <Page>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Eyebrow>Race Weekend</Eyebrow>
            <SectionTitle>Suzuka — Japanese GP</SectionTitle>
          </div>
          <div className="flex gap-2">
            <Badge tone="telemetry">High-speed / flowing</Badge>
            <Badge tone="caution">Rain risk 35%</Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AssetPlaceholder label="Suzuka circuit layout" className="lg:col-span-1" aspect="aspect-[4/3]" />
          <Card className="lg:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Track characteristics</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><div className="text-ink-faint text-xs">Overtaking</div><div className="text-ink font-medium">Moderate</div></div>
              <div><div className="text-ink-faint text-xs">Tire stress</div><div className="text-ink font-medium">High</div></div>
              <div><div className="text-ink-faint text-xs">Downforce need</div><div className="text-ink font-medium">High</div></div>
              <div><div className="text-ink-faint text-xs">Incident risk</div><div className="text-ink font-medium">Medium</div></div>
            </div>
          </Card>
        </div>

        <div className="mt-6 inline-flex rounded-lg border border-hairline bg-surface p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md font-display text-sm font-semibold uppercase tracking-wide ${
                tab === t ? "bg-signal text-white" : "text-ink-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Qualifying" && (
          <Card className="mt-4">
            <div className="space-y-1.5">
              {["K. Farrow", "R. Vale", "M. Sundqvist", "R. Okafor"].map((n, i) => (
                <div key={n} className="flex items-center justify-between text-sm py-1">
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-ink-faint w-4 tabular">{i + 1}</span>
                    <span className="text-ink">{n}</span>
                  </span>
                  <span className="font-mono tabular text-ink-soft">1:2{9 + i}.{312 + i * 41}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "Race" && (
          <Card className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-3">Event timeline</div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {mockRaceEvents.map((e) => (
                <div key={e.lap} className="flex gap-3 text-sm">
                  <span className="font-mono tabular text-ink-faint w-12 shrink-0">L{e.lap}</span>
                  <span className="text-ink-soft">{e.text}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "Result" && (
          <Card className="mt-4 text-center py-8">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Finished</div>
            <div className="font-display text-6xl font-bold text-signal mt-1">P5</div>
            <p className="mt-3 text-sm text-ink-soft max-w-sm mx-auto">
              A late overtake recovered positions lost to your teammate's
              retirement. +10 championship points.
            </p>
          </Card>
        )}
      </Page>
    </div>
  );
}
