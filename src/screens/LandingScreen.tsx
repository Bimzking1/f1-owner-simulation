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

interface Option<T> {
  id: T;
  label: string;
  hint: string;
}

function SelectField<T extends string | number>({
  value,
  options,
  onChange,
  open,
  onOpenChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (id: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = options.find((o) => o.id === value) ?? options[0];
  const toggle = () => onOpenChange(!open);
  return (
    <div className="relative">
      <button
        type="button"
        role="listbox"
        aria-expanded={open}
        onClick={toggle}
        className={`flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md border px-3 py-2.5 transition ${
          open
            ? "border-telemetry/60 bg-raised shadow-lg shadow-black/30"
            : "border-hairline bg-surface hover:border-ink-faint"
        }`}
      >
        <span className={`font-display text-lg font-bold ${open ? "text-telemetry" : ""}`}>{selected.label}</span>
        <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-transform ${open ? "rotate-180 border-telemetry/40 text-telemetry" : "border-hairline text-ink-faint"}`}>
          ▾
        </span>
      </button>
      {open && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-hairline bg-raised shadow-2xl"
        >
          {options
            .filter((o) => o.id !== value)
            .map((o) => (
              <button
                key={String(o.id)}
                type="button"
                onClick={() => {
                  onChange(o.id);
                  onOpenChange(false);
                }}
                className="block w-full border-b border-hairline/50 px-3 py-2 text-left transition last:border-0 hover:bg-surface"
              >
                <div className="font-display font-bold">{o.label}</div>
                <div className="text-[11px] leading-relaxed text-ink-faint">{o.hint}</div>
              </button>
            ))}
        </div>
      )}
      <div
        className={`mt-2 min-h-[2.5rem] rounded-sm border-l-2 px-3 py-2 text-[11px] leading-relaxed transition ${
          open ? "border-telemetry/50 bg-telemetry/5 text-ink-soft" : "border-hairline bg-raised/40 text-ink-soft"
        }`}
      >
        {selected.hint}
      </div>
    </div>
  );
}

export default function LandingScreen({ onNewGame, onContinue, hasSave }: Props) {
  const [season, setSeason] = useState<SeasonId>(2025);
  const [difficulty, setDifficulty] = useState<DifficultyId>("professional");
  const [gameLength, setGameLength] = useState<GameLengthId>("standard");
  const [seed, setSeed] = useState(() => makeSeed(2025));
  const [openField, setOpenField] = useState<string | null>(null);

  const cfg = { season, difficulty, gameLength };

  const field = (name: string) => ({
    open: openField === name,
    onOpenChange: (open: boolean) => setOpenField(open ? name : null),
  });

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

      <div className="mt-8 grid max-w-3xl gap-5 sm:grid-cols-3">
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Season</h3>
          <SelectField
            value={season}
            options={SEASONS.map((s) => ({ id: s.id, label: s.label, hint: s.tagline }))}
            onChange={(id) => setSeason(id as SeasonId)}
            {...field("season")}
          />
        </section>
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Difficulty</h3>
          <SelectField
            value={difficulty}
            options={DIFFICULTIES.map((d) => ({ id: d.id, label: d.label, hint: d.description }))}
            onChange={(id) => setDifficulty(id as DifficultyId)}
            {...field("difficulty")}
          />
        </section>
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Season detail level</h3>
          <SelectField
            value={gameLength}
            options={GAME_LENGTHS.map((g) => ({ id: g.id, label: g.label, hint: g.description }))}
            onChange={(id) => setGameLength(id as GameLengthId)}
            {...field("gameLength")}
          />
        </section>
      </div>

      {/* Seed */}
      <section className="mt-6 max-w-3xl">
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

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button onClick={() => onNewGame({ ...cfg, seed })}>Start Setup</Button>
        {hasSave && <Button variant="ghost" onClick={onContinue}>Continue save</Button>}
      </div>
    </div>
  );
}