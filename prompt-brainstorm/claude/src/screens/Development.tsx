import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockDevelopmentOptions } from "@/lib/mockData";
import { useState } from "react";

export function Development() {
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }
  return (
    <div className="min-h-screen">
      <NavBar season={2025} round={8} totalRounds={24} cash={42.8} />
      <Page>
        <Eyebrow>Development Window</Eyebrow>
        <SectionTitle>Round 8 upgrades</SectionTitle>
        <p className="mt-2 text-sm text-ink-soft">Development budget: <span className="text-positive font-mono">$12.0M</span></p>

        <div className="mt-6 space-y-3">
          {mockDevelopmentOptions.map((u) => (
            <Card key={u.id} interactive selected={selected.includes(u.id)} onClick={() => toggle(u.id)} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-display text-base font-semibold text-ink">{u.name}</div>
                <div className="text-sm text-positive mt-0.5">{u.effect}</div>
                <div className="flex gap-2 mt-1.5">
                  <Badge tone="telemetry">{u.duration}</Badge>
                  <Badge tone={u.risk === "Medium" ? "caution" : "neutral"}>{u.risk} risk</Badge>
                </div>
              </div>
              <span className="font-mono text-sm tabular text-ink-soft shrink-0">${u.cost}M</span>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button>Apply Upgrades</Button>
        </div>
      </Page>
    </div>
  );
}
