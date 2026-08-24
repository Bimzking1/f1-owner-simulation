import { CHANGE_LOG, type ChangeKind } from "@/data/changelog";
import { Button } from "@/ui/kit";

interface Props {
  onBack: () => void;
}

const KIND_META: Record<ChangeKind, { label: string; dot: string; chip: string }> = {
  new: { label: "New", dot: "bg-positive", chip: "border-positive/40 bg-positive/10 text-positive" },
  improve: { label: "Improved", dot: "bg-telemetry", chip: "border-telemetry/40 bg-telemetry/10 text-telemetry" },
  fix: { label: "Fixed", dot: "bg-signal", chip: "border-signal/40 bg-signal/10 text-signal" },
  docs: { label: "Docs", dot: "bg-elite", chip: "border-elite/40 bg-elite/10 text-elite" },
};

export default function ChangeLogScreen({ onBack }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label-tech text-[11px] tracking-[0.3em] text-ink-faint">development history</div>
          <h1 className="font-display text-hero font-bold uppercase text-ink">
            Change <span className="text-signal">log</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            Everything that changed in F1 Owner, update by update — newest first. The latest entry is stamped with the
            exact date and time it shipped.
          </p>
        </div>
        <Button variant="ghost" small onClick={onBack} className="shrink-0">
          ← Back
        </Button>
      </div>

      <div className="relative mt-10">
        {/* timeline spine */}
        <span className="absolute bottom-2 left-[7px] top-2 w-px bg-hairline sm:left-[9px]" aria-hidden />

        <ol className="space-y-10">
          {CHANGE_LOG.map((entry) => (
            <li key={entry.version} className="relative pl-8 sm:pl-12">
              {/* node */}
              <span
                className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-void sm:h-[19px] sm:w-[19px] ${
                  entry === CHANGE_LOG[0] ? "bg-signal ring-4 ring-signal/25" : "bg-raised"
                }`}
                aria-hidden
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={`font-display text-lg font-bold uppercase ${entry === CHANGE_LOG[0] ? "text-signal" : "text-telemetry"}`}>
                  {entry.version}
                </span>
                <span className="font-display font-bold">{entry.title}</span>
                <span className="num-data text-xs text-ink-faint">{entry.when}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{entry.summary}</p>

              <ul className="mt-3 space-y-2">
                {entry.items.map((item, i) => {
                  const meta = KIND_META[item.kind];
                  return (
                    <li key={i} className="flex items-start gap-2.5 rounded-sm border border-hairline bg-surface px-3 py-2">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden />
                      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink-soft">{item.text}</div>
                      <span className={`mt-px shrink-0 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-widest ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-10 border-t border-hairline pt-4 text-center text-[11px] uppercase tracking-widest text-ink-faint">
        F1 Owner · {CHANGE_LOG[0].version} is the current build
      </p>
    </div>
  );
}
