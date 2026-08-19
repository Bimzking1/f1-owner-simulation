import { useState } from "react";
import type { DifficultyId, GameLengthId, SeasonId } from "@/simulation/types";
import { DIFFICULTIES, GAME_LENGTHS, SEASONS } from "@/data/config";
import { Button, Tag } from "@/ui/kit";
import { makeSeed } from "@/simulation/rng";

interface Props {
  onNewGame: (cfg: { season: SeasonId; difficulty: DifficultyId; gameLength: GameLengthId; seed: string }) => void;
  onContinue: () => void;
  hasSave: boolean;
}

export default function LandingScreen({ onNewGame, onContinue, hasSave }: Props) {
  const [season, setSeason] = useState<SeasonId>(2025);
  const [difficulty, setDifficulty] = useState<DifficultyId>("professional");
  const [gameLength, setGameLength] = useState<GameLengthId>("standard");
  const [seed, setSeed] = useState(() => makeSeed(2025));

  const cfg = { season, difficulty, gameLength };

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-10">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-faint">a team management sim</div>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-ink">
        F1 <span className="text-signal">Owner</span>
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Take over a constructor. Run the money, the staff, the sponsors and the sims. Two eras, four difficulties, one table
        of accounts.
      </p>

      <div className="mt-8 grid max-w-2xl gap-8">
        {/* Season */}
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Season</h3>
          <div className="grid grid-cols-2 gap-2">
            {SEASONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSeason(s.id)}
                className={`rounded-md border p-3 text-left transition ${season === s.id ? "border-signal bg-signal/10" : "border-hairline bg-surface hover:border-ink-faint"}`}
              >
                <div className="font-display text-lg font-bold">{s.label}</div>
                <div className="text-[11px] text-ink-faint">{s.tagline}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Difficulty</h3>
          <div className="grid grid-cols-2 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`rounded-md border p-3 text-left transition ${difficulty === d.id ? "border-signal bg-signal/10" : "border-hairline bg-surface hover:border-ink-faint"}`}
              >
                <div className="font-display text-base font-bold">{d.label}</div>
                <div className="text-[11px] leading-snug text-ink-faint">{d.description.slice(0, 80)}…</div>
              </button>
            ))}
          </div>
        </section>

        {/* Game length */}
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Season detail level</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GAME_LENGTHS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGameLength(g.id)}
                className={`rounded-md border p-3 text-left transition ${gameLength === g.id ? "border-signal bg-signal/10" : "border-hairline bg-surface hover:border-ink-faint"}`}
              >
                <div className="font-display text-base font-bold">{g.label}</div>
                <div className="text-[11px] text-ink-faint">{g.description.slice(0, 70)}…</div>
              </button>
            ))}
          </div>
        </section>

        {/* Seed */}
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Season seed</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-56 rounded-sm border border-hairline bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus:border-telemetry"
              placeholder="F1-2025-000000"
            />
            <Button variant="ghost" small onClick={() => setSeed(makeSeed(season))}>Random</Button>
            <Tag tone="telemetry">Same seed + same choices = same season</Tag>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button onClick={() => onNewGame({ ...cfg, seed })}>Start Setup</Button>
        {hasSave && <Button variant="ghost" onClick={onContinue}>Continue save</Button>}
      </div>
    </div>
  );
}