import type { SimulationState } from "@/simulation/types";
import { driverById } from "@/data";
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
      {!!(t.gridPenaltyBySeat?.car1 || t.gridPenaltyBySeat?.car2) && (
        <div className="space-y-1 rounded-md border-l-2 border-caution bg-caution/10 p-3 text-xs leading-relaxed text-caution">
          <div className="font-bold uppercase tracking-wider">Stewards' rulings at this GP</div>
          {(["car1", "car2"] as const).map((seat) => {
            const pen = t.gridPenaltyBySeat?.[seat] ?? 0;
            if (!pen) return null;
            const d = driverById(seat === "car1" ? t.driver1Id : t.driver2Id, state.season);
            return (
              <div key={seat}>
                {d?.shortName ?? seat}: −{pen} grid places (power-unit/gearbox changes)
              </div>
            );
          })}
        </div>
      )}
      <NextRaceCard track={next} round={state.round + 1} gridPenalty={t.gridPenalty} />
    </div>
  );
}
