import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { useState } from "react";

const difficulties = [
  { name: "Rookie", desc: "Generous budget, forgiving reliability, softer sponsor demands.", tone: "positive" },
  { name: "Professional", desc: "Balanced budget and risk — the intended default experience.", tone: "telemetry" },
  { name: "Expert", desc: "Tighter budget, higher failure rates, sharper sponsor objectives.", tone: "caution" },
  { name: "Ruthless", desc: "Minimal reserve, aggressive rival development, bankruptcy is real.", tone: "signal" },
] as const;

export function SetupDifficulty() {
  const [selected, setSelected] = useState("Professional");
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Setup — Step 2 of 3</Eyebrow>
        <SectionTitle>Choose difficulty</SectionTitle>
        <p className="mt-2 text-sm text-ink-soft max-w-lg">
          Difficulty changes budget, failure rates, and sponsor expectations —
          it never changes how the simulation itself works.
        </p>

        <div className="mt-6 space-y-3">
          {difficulties.map((d) => (
            <Card
              key={d.name}
              interactive
              selected={selected === d.name}
              onClick={() => setSelected(d.name)}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-display text-lg font-semibold uppercase tracking-wide text-ink">
                  {d.name}
                </div>
                <p className="mt-1 text-sm text-ink-soft">{d.desc}</p>
              </div>
              <div
                className={`h-2 w-2 rounded-full shrink-0 ${
                  d.tone === "positive"
                    ? "bg-positive"
                    : d.tone === "telemetry"
                    ? "bg-telemetry"
                    : d.tone === "caution"
                    ? "bg-caution"
                    : "bg-signal"
                }`}
              />
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
