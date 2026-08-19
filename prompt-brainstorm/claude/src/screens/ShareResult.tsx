import { NavBar } from "@/components/layout/NavBar";
import { Page } from "@/components/layout/Page";
import { Eyebrow, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function ResultCard({ orientation }: { orientation: "portrait" | "landscape" }) {
  const isPortrait = orientation === "portrait";
  return (
    <div
      className={`rounded-xl border border-hairline bg-raised p-6 flex flex-col justify-between ${
        isPortrait ? "aspect-[9/16] max-w-[220px]" : "aspect-[16/9] max-w-md"
      } mx-auto`}
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-signal">F1 Owner · 2025</div>
        <div className="font-display text-2xl font-bold uppercase text-ink mt-1">Arden Racing</div>
      </div>
      <div className="text-center">
        <div className="font-display text-lg uppercase tracking-wide text-ink-soft">Midfield Master</div>
        <div className="font-mono text-4xl tabular text-signal mt-1">87/100</div>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-faint text-center">
        P3 Constructors · 300 pts
      </div>
    </div>
  );
}

export function ShareResult() {
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <Page>
        <Eyebrow>Share Result</Eyebrow>
        <SectionTitle>Export your season</SectionTitle>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
          <div>
            <div className="text-center font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-3">Portrait</div>
            <ResultCard orientation="portrait" />
            <Button variant="secondary" fullWidth className="mt-4">Export Portrait</Button>
          </div>
          <div>
            <div className="text-center font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-3">Landscape</div>
            <ResultCard orientation="landscape" />
            <Button variant="secondary" fullWidth className="mt-4">Export Landscape</Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button>Play Again</Button>
          <Button variant="ghost">New Season</Button>
        </div>
      </Page>
    </div>
  );
}
