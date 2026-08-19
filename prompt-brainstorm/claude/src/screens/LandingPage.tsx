import { NavBar } from "@/components/layout/NavBar";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Card";

export function LandingPage({ onStart }: { onStart?: () => void }) {
  return (
    <div className="min-h-screen">
      <NavBar showGameStats={false} />
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-sector-stripe opacity-[0.03] pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 pt-16 pb-24 text-center relative">
          <Eyebrow>Alternate-history team ownership sim</Eyebrow>
          <h1 className="font-display text-5xl sm:text-7xl font-bold uppercase leading-[0.95] tracking-tight text-ink">
            You own the
            <br />
            <span className="text-signal">constructor.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-ink-soft max-w-xl mx-auto">
            Take charge of a Formula 1 team from 2013 or 2025. Allocate a limited
            budget across drivers, engineering, and technical package — then
            simulate the season and live with the consequences. History is your
            baseline. Your decisions write what happens next.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onStart} className="text-base px-8 py-4">
              Start Season
            </Button>
            <Button variant="secondary" className="text-base px-8 py-4">
              How It Works
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { label: "Budget", body: "Split a limited budget across drivers, engine, gearbox, staff and sponsors — every choice trades off against another." },
              { label: "Simulate", body: "Every race is driven by driver attributes, car performance, wear, and weather — not scripted outcomes." },
              { label: "Consequence", body: "Reliability failures, morale swings, and sponsor pressure carry across the whole season." },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-hairline bg-surface p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-signal">{f.label}</div>
                <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
