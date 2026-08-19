import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { useState } from "react";

const lengths = [
  { name: "Short", rounds: 8 },
  { name: "Standard", rounds: 16 },
  { name: "Long", rounds: 24 },
  { name: "Hardcore", rounds: 24, note: "No mid-season saves" },
];

export function SetupGameLength() {
  const [selected, setSelected] = useState("Standard");
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Setup — Step 3 of 3</Eyebrow>
        <SectionTitle>Choose season length</SectionTitle>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {lengths.map((l) => (
            <Card
              key={l.name}
              interactive
              selected={selected === l.name}
              onClick={() => setSelected(l.name)}
              className="text-center py-6"
            >
              <div className="font-display text-xl font-semibold uppercase text-ink">{l.name}</div>
              <div className="mt-1 font-mono text-2xl tabular text-signal">{l.rounds}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">rounds</div>
              {l.note && <div className="mt-2 text-[11px] text-caution">{l.note}</div>}
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
