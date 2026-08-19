import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow, SectionTitle } from "@/components/ui/Card";
import { TelemetryStat } from "@/components/ui/TelemetryStat";
import { mockTechPackage } from "@/lib/mockData";

export function TechnicalPackage() {
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Technical Package</Eyebrow>
        <SectionTitle>Your car's DNA</SectionTitle>
        <p className="mt-2 text-sm text-ink-soft max-w-lg">
          These figures are set by your constructor and budget allocation —
          they're the baseline the development system builds on mid-season.
        </p>

        <Card className="mt-6 max-w-md space-y-1">
          <TelemetryStat geekLabel="Aerodynamics" enjoyerLabel="Cornering speed" value={mockTechPackage.aero} emphasis="telemetry" />
          <TelemetryStat geekLabel="Chassis" enjoyerLabel="Mechanical grip" value={mockTechPackage.chassis} emphasis="telemetry" />
          <TelemetryStat geekLabel="Reliability" enjoyerLabel="Durability" value={mockTechPackage.reliability} emphasis="positive" />
          <TelemetryStat geekLabel="Tire Behavior" enjoyerLabel="Tire friendliness" value={mockTechPackage.tireBehavior} emphasis="caution" />
          <TelemetryStat geekLabel="Development Potential" enjoyerLabel="Room to improve" value={mockTechPackage.developmentPotential} emphasis="elite" />
        </Card>
      </Page>
    </div>
  );
}
