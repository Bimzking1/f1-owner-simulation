import { useState } from "react";
import type { DifficultyId, GameLengthId, OwnerProfile, SeasonId } from "@/simulation/types";
import { DIFFICULTIES, GAME_LENGTHS, SEASONS } from "@/data/config";
import { Button, Img, Tag } from "@/ui/kit";
import { makeSeed } from "@/simulation/rng";

interface Props {
  onNewGame: (cfg: { season: SeasonId; difficulty: DifficultyId; gameLength: GameLengthId; seed: string; owner: OwnerProfile }) => void;
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
  const [ownerName, setOwnerName] = useState("");
  const [ownerImage, setOwnerImage] = useState<string | undefined>();
  const [calloutPick, setCalloutPick] = useState<"mr" | "ms" | "sir" | "boss" | "madam" | "name" | "other">("boss");
  const [customCallout, setCustomCallout] = useState("");

  /** Center-crop the chosen picture to a small square data URL for the save. */
  const onOwnerImage = (file: File | undefined) => {
    if (!file) {
      setOwnerImage(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 128;
        c.height = 128;
        const cx = c.getContext("2d");
        if (!cx) return;
        const side = Math.min(img.width, img.height);
        cx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 128, 128);
        setOwnerImage(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const surname = ownerName.trim().split(/\s+/).pop() ?? "";
  const calloutLabels: Record<typeof calloutPick, string> = {
    mr: `Mr. ${surname || "…"}`,
    ms: `Ms. ${surname || "…"}`,
    sir: "Sir",
    boss: "Boss",
    madam: "Madam",
    name: surname || "Surname",
    other: "Other…",
  };
  const resolvedCallout =
    calloutPick === "other" ? customCallout.trim() : calloutPick === "name" ? surname : calloutLabels[calloutPick];

  const owner: OwnerProfile = {
    name: ownerName.trim(),
    callout: resolvedCallout,
    ...(ownerImage ? { image: ownerImage } : {}),
  };
  const ownerReady = owner.name.length > 0 && resolvedCallout.length > 0;

  const cfg = { season, difficulty, gameLength };

  const field = (name: string) => ({
    open: openField === name,
    onOpenChange: (open: boolean) => setOpenField(open ? name : null),
  });

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-10">
      <div className="label-tech mb-2 text-[11px] tracking-[0.3em] text-ink-faint">a team management sim</div>
      <h1 className="font-display text-hero font-bold uppercase text-ink">
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

      {/* Team principal */}
      <section className="mt-6 max-w-3xl">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Team principal — that's you</h3>
        <div className="flex flex-col items-center gap-3 rounded-md border border-hairline bg-surface p-3 sm:flex-row sm:items-start">
          <label className="relative shrink-0 cursor-pointer" title={ownerImage ? "Change photo" : "Add photo"}>
            {ownerImage ? (
              <>
                <Img src={ownerImage} alt="Owner portrait" className="h-20 w-20 rounded-full object-cover sm:h-16 sm:w-16" />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 transition hover:opacity-100">
                  Change
                </span>
              </>
            ) : (
              <span className="flex h-20 w-20 flex-col items-center justify-center rounded-full border border-dashed border-hairline text-[10px] uppercase tracking-widest text-ink-faint transition hover:border-telemetry hover:text-telemetry sm:h-16 sm:w-16 sm:text-[9px]">
                Photo
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onOwnerImage(e.target.files?.[0])} />
          </label>
          <div className="w-full min-w-0 flex-1 space-y-2">
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Your full name (required)"
              maxLength={40}
              className="w-full rounded-sm border border-hairline bg-raised/40 px-3 py-2.5 text-base outline-none placeholder:text-ink-faint focus:border-telemetry sm:text-sm"
            />
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">The paddock calls you</div>
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-1">
                {(Object.keys(calloutLabels) as Array<typeof calloutPick>).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCalloutPick(id)}
                    className={`w-full rounded-sm border px-2.5 py-2 text-center text-sm font-bold transition sm:w-auto sm:py-1.5 sm:text-xs ${
                      calloutPick === id
                        ? "border-signal/40 bg-signal/15 text-signal"
                        : "border-transparent bg-raised/40 text-ink-soft hover:bg-raised hover:text-ink"
                    }`}
                  >
                    {calloutLabels[id]}
                  </button>
                ))}
              </div>
              {calloutPick === "other" && (
                <input
                  value={customCallout}
                  onChange={(e) => setCustomCallout(e.target.value)}
                  placeholder='Custom callout — e.g. "Governor"'
                  maxLength={24}
                  className="mt-2 w-full rounded-sm border border-hairline bg-raised/40 px-3 py-2 text-sm outline-none placeholder:text-ink-faint focus:border-telemetry"
                />
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-ink-faint">
              Drivers, engineers and mechanics will address you as{" "}
              <span className="font-semibold text-ink-soft">“{resolvedCallout || "…"}”</span> in messages and on your season
              report.{ownerImage ? "" : " Add an optional photo — it appears in the navbar and on your season report."}
            </p>
            {ownerImage && (
              <button type="button" onClick={() => setOwnerImage(undefined)} className="text-[11px] uppercase tracking-widest text-signal hover:underline">
                Remove photo
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button onClick={() => ownerReady && onNewGame({ ...cfg, seed, owner })} disabled={!ownerReady}>
          Start Setup
        </Button>
        {!ownerReady && <span className="text-xs uppercase tracking-wider text-signal">Enter your name to continue</span>}
        {hasSave && <Button variant="ghost" onClick={onContinue}>Continue save</Button>}
      </div>
    </div>
  );
}