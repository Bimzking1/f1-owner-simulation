import { useState } from "react";
import type { SimulationState } from "@/simulation/types";
import { constructorById } from "@/data";
import { difficultyOf } from "@/state";
import { Button, Money, Stat } from "@/ui/kit";
import type { Act } from "./parts";
import { OverviewTab } from "./OverviewTab";
import { RaceTab } from "./RaceTab";
import { MarketTab } from "./MarketTab";
import { SponsorsTab } from "./SponsorsTab";
import { GarageTab } from "./GarageTab";
import { FinanceTab } from "./FinanceTab";
import { EndScreens } from "./EndScreens";

export type { Act };

interface Props {
  state: SimulationState;
  onRunRound: () => void;
  onNewsAction: (newsId: string, action: string) => void;
  act: Act;
  onReset: () => void;
}

type Tab = "Overview" | "Race" | "Market" | "Sponsors" | "Garage" | "Finance";

export default function SeasonScreen({ state, onRunRound, onNewsAction, act, onReset }: Props) {
  const t = state.team!;
  const ctor = constructorById(t.constructorId, state.season);
  const wccPos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
  const [tab, setTab] = useState<Tab>("Overview");

  if (state.phase === "bankrupt" || state.phase === "finished") {
    return <EndScreens state={state} onReset={onReset} />;
  }

  const tabs: Tab[] = ["Overview", "Race", "Market", "Sponsors", "Garage", "Finance"];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface/70 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-sm" style={{ background: ctor?.colors.primary ?? "gray" }} />
          <div>
            <div className="font-display text-xl font-bold leading-none">{ctor?.name}</div>
            <div className="text-[11px] uppercase tracking-widest text-ink-faint">
              Round {state.round + 1}/{state.calendar.length} · WCC P{wccPos} · {difficultyOf(state).label} · {state.seed}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Stat label="Cash" value={<Money value={t.cash} />} tone={t.cash < 0 ? "caution" : undefined} />
          <Stat label="Reputation" value={t.reputation} />
          <Stat label="WCC Pts" value={t.points} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" small onClick={onReset}>Menu</Button>
        </div>
      </header>

      <nav className="sticky top-0 z-30 my-3 flex flex-wrap gap-1">
        {tabs.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`rounded-sm border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
              tab === tb
                ? "border-signal/40 bg-signal/15 text-signal"
                : "border-transparent bg-raised/40 text-ink-soft hover:bg-raised hover:text-ink"
            }`}
          >
            {tb}
          </button>
        ))}
      </nav>

      {tab === "Overview" && <OverviewTab state={state} onNewsAction={onNewsAction} onRunRound={onRunRound} />}
      {tab === "Race" && <RaceTab state={state} onRunRound={onRunRound} />}
      {tab === "Market" && <MarketTab state={state} act={act} />}
      {tab === "Sponsors" && <SponsorsTab state={state} act={act} />}
      {tab === "Garage" && <GarageTab state={state} act={act} />}
      {tab === "Finance" && <FinanceTab state={state} />}
    </div>
  );
}