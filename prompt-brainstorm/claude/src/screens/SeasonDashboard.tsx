import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TelemetryStat } from "@/components/ui/TelemetryStat";
import { mockDrivers, mockStandingsConstructors } from "@/lib/mockData";

export function SeasonDashboard() {
  return (
    <div className="min-h-screen">
      <NavBar season={2025} round={8} totalRounds={24} cash={42.8} />
      <Page>
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow>Season Dashboard</Eyebrow>
            <SectionTitle>Arden Racing</SectionTitle>
          </div>
          <Badge tone="telemetry">P3 Constructors</Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Next race */}
          <Card raised className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-signal">Next round</div>
                <div className="font-display text-2xl font-bold text-ink">Suzuka — Japanese GP</div>
              </div>
              <Badge tone="caution">High tire deg</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Fast, flowing corners reward aerodynamic efficiency. Historically
              a strong track for high-downforce packages.
            </p>
            <Button className="mt-4">Enter Race Weekend</Button>
          </Card>

          {/* Cash + sponsor */}
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Finances</div>
            <div className="font-mono text-3xl tabular text-positive mt-1">$42.8M</div>
            <div className="mt-3 space-y-1">
              <TelemetryStat geekLabel="Sponsor Standing" enjoyerLabel="Sponsor happiness" value={74} emphasis="positive" />
              <TelemetryStat geekLabel="Development Budget" enjoyerLabel="Upgrade fund" value={58} emphasis="telemetry" />
            </div>
          </Card>

          {/* Drivers */}
          <Card className="lg:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-3">Drivers</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockDrivers.slice(0, 2).map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-ink">{d.name}</span>
                    <span className="font-mono text-sm tabular text-ink-soft">P4</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <TelemetryStat geekLabel="Morale" enjoyerLabel="Mood" value={d.morale} emphasis="positive" />
                    <TelemetryStat geekLabel="Confidence" enjoyerLabel="Confidence" value={d.confidence} emphasis="telemetry" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Component condition */}
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Component Condition</div>
            <TelemetryStat geekLabel="Engine" enjoyerLabel="Engine" value={72} emphasis="caution" />
            <TelemetryStat geekLabel="Gearbox" enjoyerLabel="Gearbox" value={91} emphasis="positive" />
          </Card>

          {/* Standings */}
          <Card className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Constructors Championship</div>
            <div className="space-y-1.5">
              {mockStandingsConstructors.map((c) => (
                <div key={c.pos} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-ink-faint w-4 tabular">{c.pos}</span>
                    <span className={c.name === "Arden Racing" ? "text-signal font-semibold" : "text-ink"}>{c.name}</span>
                  </span>
                  <span className="font-mono tabular text-ink-soft">{c.points} pts</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Page>
    </div>
  );
}
