import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockSponsors } from "@/lib/mockData";
import { useState } from "react";

export function SponsorSelection() {
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Sponsor Selection</Eyebrow>
        <SectionTitle>Sign your sponsors</SectionTitle>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockSponsors.map((s) => (
            <Card key={s.id} interactive selected={selected.includes(s.id)} onClick={() => toggle(s.id)}>
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-semibold text-ink">{s.name}</div>
                <Badge tone={s.risk === "High" ? "signal" : "positive"}>{s.risk} risk</Badge>
              </div>
              <div className="mt-1 font-mono text-2xl tabular text-positive">${s.money}M</div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-ink-faint">Contract</dt><dd className="text-ink">{s.contractLength}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-faint">Expectation</dt><dd className="text-ink text-right">{s.expectation}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-faint">Bonus</dt><dd className="text-positive text-right">{s.bonus}</dd></div>
              </dl>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}
