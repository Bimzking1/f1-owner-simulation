import type { SimulationState } from "@/simulation/types";
import { NextRaceCard } from "./parts";

/** Upcoming — the next Grand Prix at a glance (moved out of the Race tab). */
export function UpcomingTab({ state }: { state: SimulationState }) {
  const t = state.team!;
  const next = state.calendar[state.round];

  if (!next) {
    return (
      <div className="rounded-md border border-hairline bg-surface/60 p-4 text-sm text-ink-soft">
        Calendar complete — see the final report.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!!t.gridPenalty && (
        <div className="rounded-md border-l-2 border-caution bg-caution/10 p-3 text-xs leading-relaxed text-caution">
          Stewards' ruling: both cars carry a −{t.gridPenalty} grid penalty at the {next.grandPrix} for power-unit/gearbox
          changes.
        </div>
      )}
      <NextRaceCard track={next} round={state.round + 1} gridPenalty={t.gridPenalty} />
    </div>
  );
}
