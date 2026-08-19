import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TelemetryStat } from "@/components/ui/TelemetryStat";

export function FinalSeasonReport() {
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <div className="text-center py-8">
          <Eyebrow>Season Complete</Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold uppercase text-ink">
            Midfield Master
          </h1>
          <div className="mt-3 font-mono text-4xl tabular text-signal">87 / 100</div>
          <p className="mt-4 text-sm text-ink-soft max-w-md mx-auto">
            Arden Racing finished P3 in the Constructors' Championship — a
            two-position climb from where you started, on a budget well
            below the front-runners.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Team Owner Score</div>
            <TelemetryStat geekLabel="Championship" enjoyerLabel="Championship" value={91} emphasis="elite" />
            <TelemetryStat geekLabel="Financial" enjoyerLabel="Financial" value={82} emphasis="telemetry" />
            <TelemetryStat geekLabel="Development" enjoyerLabel="Development" value={94} emphasis="elite" />
            <TelemetryStat geekLabel="Driver Management" enjoyerLabel="Driver Management" value={86} emphasis="telemetry" />
            <TelemetryStat geekLabel="Reliability" enjoyerLabel="Reliability" value={78} emphasis="caution" />
            <TelemetryStat geekLabel="Sponsors" enjoyerLabel="Sponsors" value={89} emphasis="positive" />
          </Card>

          <Card>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-2">Season highlights</div>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>🏆 First podium since the constructor's founding — Round 11, Monza.</li>
              <li>⚠️ Two engine failures in the final six rounds nearly cost P3.</li>
              <li>📈 Development budget converted into +9 aero over the season.</li>
              <li>💰 Ended the season $6.2M above the emergency reserve line.</li>
            </ul>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button className="text-base px-8 py-4">See Shareable Result</Button>
        </div>
      </Page>
    </div>
  );
}
