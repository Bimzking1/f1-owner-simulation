import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { mockStandingsDrivers, mockStandingsConstructors } from "@/lib/mockData";

function Table({ rows, highlight }: { rows: { pos: number; name: string; team?: string; points: number }[]; highlight: string }) {
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.pos} className="flex items-center justify-between text-sm py-1 border-b border-hairline last:border-0">
          <span className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-ink-faint w-5 tabular">{r.pos}</span>
            <span className="min-w-0">
              <span className={`block truncate ${r.name.includes(highlight) || r.team?.includes(highlight) ? "text-signal font-semibold" : "text-ink"}`}>
                {r.name}
              </span>
              {r.team && <span className="block text-xs text-ink-faint">{r.team}</span>}
            </span>
          </span>
          <span className="font-mono tabular text-ink-soft shrink-0">{r.points} pts</span>
        </div>
      ))}
    </div>
  );
}

export function Championship() {
  return (
    <div className="min-h-screen">
      <NavBar season={2025} round={8} totalRounds={24} cash={42.8} />
      <Page>
        <Eyebrow>Championship</Eyebrow>
        <SectionTitle>Standings after round 8</SectionTitle>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Drivers</div>
            <Table rows={mockStandingsDrivers} highlight="Arden Racing" />
          </Card>
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Constructors</div>
            <Table rows={mockStandingsConstructors} highlight="Arden" />
          </Card>
        </div>
      </Page>
    </div>
  );
}
