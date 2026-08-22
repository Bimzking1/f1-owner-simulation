import { useState } from "react";
import type { SimulationState } from "@/simulation/types";
import { constructorById } from "@/data";
import { difficultyOf, ownerTitle } from "@/state";
import { Button, Img, Modal, Money } from "@/ui/kit";
import type { Act } from "./parts";
import { OverviewTab } from "./OverviewTab";
import { RaceTab } from "./RaceTab";
import { MarketTab } from "./MarketTab";
import { SponsorsTab } from "./SponsorsTab";
import { GarageTab } from "./GarageTab";
import { FinanceTab } from "./FinanceTab";
import { ManagementTab } from "./ManagementTab";
import { EndScreens } from "./EndScreens";

export type { Act };

interface Props {
  state: SimulationState;
  onRunRound: () => void;
  onNewsAction: (newsId: string, action: string) => void;
  act: Act;
  onReset: () => void;
}

type Tab = "Overview" | "Race" | "Management" | "Market" | "Sponsors" | "Garage" | "Finance";

const TABS: Tab[] = ["Overview", "Race", "Management", "Market", "Sponsors", "Garage", "Finance"];

export default function SeasonScreen({ state, onRunRound, onNewsAction, act, onReset }: Props) {
  const t = state.team!;
  const ctor = constructorById(t.constructorId, state.season);
  const wccPos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
  const [tab, setTab] = useState<Tab>("Overview");
  const [confirmMenu, setConfirmMenu] = useState(false);

  if (state.phase === "bankrupt" || state.phase === "finished") {
    return <EndScreens state={state} onReset={onReset} />;
  }

  const next = state.calendar[state.round];
  const seasonDone = !next;

  /** News actions can navigate ("goto:sponsors") instead of mutating the sim. */
  const handleNewsAction = (newsId: string, action: string) => {
    if (action.startsWith("goto:")) {
      const target = action.slice(5);
      const mapped: Record<string, Tab> = {
        sponsors: "Sponsors",
        garage: "Garage",
        market: "Market",
        finance: "Finance",
        race: "Race",
        management: "Management",
      };
      onNewsAction(newsId, action); // marks the item resolved in the sim
      if (mapped[target]) setTab(mapped[target]);
      return;
    }
    onNewsAction(newsId, action);
  };

  const openChats = state.news.filter((n) => n.kind === "chat" && !n.resolved).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-hairline bg-surface/70 px-3 py-3 sm:px-5">
        {/* left — team identity */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-8 w-8 shrink-0 rounded-sm" style={{ background: ctor?.colors.primary ?? "gray" }} />
          <div className="min-w-0">
            <div className="truncate font-display text-xl font-bold leading-none">{ctor?.name}</div>
            <div className="truncate text-[11px] uppercase tracking-widest text-ink-faint">
              Round {Math.min(state.round + 1, state.calendar.length)}/{state.calendar.length} · WCC P{wccPos} ·{" "}
              {difficultyOf(state).label} · {state.seed}
            </div>
          </div>
        </div>

        {/* right — cash · menu · run GP (top-right on desktop, stacked rows on mobile) */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end md:w-auto md:flex-nowrap md:items-stretch">
          {/* principal mini-badge — mobile only */}
          {t.owner && (
            <div className="mr-auto flex min-w-0 items-center gap-2 md:hidden" title={t.owner.name}>
              {t.owner.image ? (
                <Img src={t.owner.image} alt={t.owner.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal/15 font-display text-sm font-bold text-signal">
                  {t.owner.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 leading-tight">
                <span className="block text-[9px] font-semibold uppercase tracking-widest text-ink-faint">Principal</span>
                <span className="block truncate font-display text-sm font-bold">{ownerTitle(state)}</span>
              </span>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-hairline bg-raised/60 px-3 py-1.5">
            <span className="label-tech text-[9px] text-ink-faint">Cash</span>
            <Money value={t.cash} className="num-display text-lg leading-none sm:text-xl" />
          </div>
          <Button variant="ghost" small onClick={() => setConfirmMenu(true)} className="shrink-0 self-center px-3 md:self-auto">
            Menu
          </Button>
          {!seasonDone && (
            <Button onClick={onRunRound} className="order-last w-full md:order-none md:w-auto md:shrink-0">
              Run R{state.round + 1} · {next.grandPrix} →
            </Button>
          )}
        </div>
      </header>

      <nav className="sticky top-0 z-30 -mx-4 mb-4 flex flex-wrap gap-1 border-b border-hairline bg-void/95 px-4 py-2 shadow-lg backdrop-blur">
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={`relative rounded-sm border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
              tab === tb
                ? "border-signal/40 bg-signal/15 text-signal"
                : "border-transparent bg-raised/40 text-ink-soft hover:bg-raised hover:text-ink"
            }`}
          >
            {tb}
            {tb === "Management" && openChats > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 text-[9px] font-bold text-white">
                {openChats}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === "Overview" && (
        <OverviewTab state={state} onNewsAction={handleNewsAction} onRunRound={onRunRound} onNavigate={(x) => setTab(x)} />
      )}
      {tab === "Race" && <RaceTab state={state} onRunRound={onRunRound} />}
      {tab === "Management" && <ManagementTab state={state} act={act} onNewsAction={handleNewsAction} />}
      {tab === "Market" && <MarketTab state={state} act={act} />}
      {tab === "Sponsors" && <SponsorsTab state={state} act={act} />}
      {tab === "Garage" && <GarageTab state={state} act={act} />}
      {tab === "Finance" && <FinanceTab state={state} />}

      <Modal open={confirmMenu} onClose={() => setConfirmMenu(false)} title="Quit to menu?">
        <p className="text-sm leading-relaxed text-ink-soft">
          This season will be lost — the save is cleared when you return to the main menu.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button small variant="ghost" onClick={() => setConfirmMenu(false)}>Keep playing</Button>
          <Button small onClick={onReset}>Quit to menu</Button>
        </div>
      </Modal>
    </div>
  );
}
