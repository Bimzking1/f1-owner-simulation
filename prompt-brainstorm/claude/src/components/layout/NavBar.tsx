import { useUI } from "@/context/ThemeContext";

interface NavBarProps {
  season?: number;
  round?: number;
  totalRounds?: number;
  cash?: number;
  showGameStats?: boolean;
}

export function NavBar({ season, round, totalRounds, cash, showGameStats = true }: NavBarProps) {
  const { theme, toggleTheme, geekMode, toggleGeekMode } = useUI();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-void/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-2 w-2 rounded-full bg-signal" />
          <span className="font-display text-lg font-bold uppercase tracking-widest text-ink">
            F1 Owner
          </span>
        </div>

        {showGameStats && (
          <div className="hidden sm:flex items-center gap-4 font-mono text-xs text-ink-soft tabular">
            {season && <span>{season}</span>}
            {round && totalRounds && (
              <span>
                Round <span className="text-ink">{round}</span>/{totalRounds}
              </span>
            )}
            {cash !== undefined && (
              <span className="text-positive">${cash.toFixed(1)}M</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleGeekMode}
            className="rounded-md border border-hairline bg-raised px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink"
            title="Toggle F1 Geek / Enjoyer language"
          >
            Geek {geekMode === "geek" ? "On" : "Off"}
          </button>
          <button
            onClick={toggleTheme}
            className="rounded-md border border-hairline bg-raised px-2.5 py-1.5 text-sm hover:text-ink"
            title="Toggle theme"
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>
        </div>
      </div>

      {showGameStats && (round || cash !== undefined) && (
        <div className="flex sm:hidden items-center justify-between px-4 pb-2 font-mono text-[11px] text-ink-soft tabular">
          {round && totalRounds && (
            <span>
              Round {round}/{totalRounds}
            </span>
          )}
          {cash !== undefined && <span className="text-positive">${cash.toFixed(1)}M</span>}
        </div>
      )}
    </header>
  );
}
