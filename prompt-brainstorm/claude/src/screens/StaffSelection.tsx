import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { TelemetryStat } from "@/components/ui/TelemetryStat";
import { useState } from "react";

const engineers = [
  { id: "en1", role: "Aerodynamics", name: "T. Basso", rating: 88, cost: 4.2 },
  { id: "en2", role: "Vehicle Dynamics", name: "S. Wren", rating: 81, cost: 3.4 },
  { id: "en3", role: "Powertrain", name: "H. Aslan", rating: 90, cost: 4.8 },
  { id: "en4", role: "Race Engineering", name: "D. Okoro", rating: 84, cost: 3.6 },
  { id: "en5", role: "Reliability", name: "F. Lindqvist", rating: 79, cost: 3.0 },
  { id: "en6", role: "Chief Technical Officer", name: "M. Reyes", rating: 93, cost: 7.5 },
];

const mechanics = [
  { id: "m1", role: "Pit Crew Lead", name: "J. Park", rating: 86, cost: 1.8 },
  { id: "m2", role: "Front Jack", name: "A. Kowalski", rating: 78, cost: 1.1 },
  { id: "m3", role: "Rear Jack", name: "B. Nwosu", rating: 80, cost: 1.1 },
];

export function StaffSelection() {
  const [tab, setTab] = useState<"engineers" | "mechanics">("engineers");
  const rows = tab === "engineers" ? engineers : mechanics;

  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Staff Selection</Eyebrow>
        <SectionTitle>Build your crew</SectionTitle>

        <div className="mt-5 inline-flex rounded-lg border border-hairline bg-surface p-1">
          {(["engineers", "mechanics"] as const).map((t) => (
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

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((r) => (
            <Card key={r.id} interactive>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-signal">{r.role}</div>
                  <div className="font-display text-base font-semibold text-ink">{r.name}</div>
                </div>
                <span className="font-mono text-sm tabular text-ink-soft">${r.cost}M/yr</span>
              </div>
              <div className="mt-3">
                <TelemetryStat geekLabel="Rating" enjoyerLabel="Skill" value={r.rating} emphasis="telemetry" />
              </div>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
