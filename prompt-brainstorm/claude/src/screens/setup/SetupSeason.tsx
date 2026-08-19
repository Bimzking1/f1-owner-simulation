import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";

const seasons = [
  {
    year: 2013,
    tag: "Classic V8 era",
    detail: "Naturally aspirated V8s, DRS-era aero, Pirelli tire management defines strategy.",
  },
  {
    year: 2025,
    tag: "Hybrid PU era",
    detail: "MGU-K/H energy deployment, ground-effect aero, tighter development cost caps.",
  },
];

export function SetupSeason() {
  const [selected, setSelected] = useState(2025);
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Setup — Step 1 of 3</Eyebrow>
        <SectionTitle>Choose your season</SectionTitle>
        <p className="mt-2 text-sm text-ink-soft max-w-lg">
          This sets the grid, technical rules, and historical baseline your
          alternate history will diverge from.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seasons.map((s) => (
            <Card
              key={s.year}
              interactive
              selected={selected === s.year}
              onClick={() => setSelected(s.year)}
              className="text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-bold text-ink">{s.year}</span>
                {selected === s.year && <Badge tone="telemetry">Selected</Badge>}
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-wider text-signal">
                {s.tag}
              </div>
              <p className="mt-3 text-sm text-ink-soft">{s.detail}</p>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
