import type { SimulationState } from "@/simulation/types";
import { constructorById, driverById } from "@/data";
import { Button, Card, Money } from "@/ui/kit";
import { exportReportImage } from "./reportImage";

interface Props {
  state: SimulationState;
  onReset: () => void;
}

export function EndScreens({ state, onReset }: Props) {
  const t = state.team!;
  const ctor = constructorById(t.constructorId, state.season);

  if (state.phase === "bankrupt") {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-md border border-signal/40 bg-surface p-8 text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-signal">Simulation terminated</div>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase">Team collapse</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
            The bank accounts ran dry. {ctor?.name ?? "The team"} ceased operations at round {state.completedRounds} of{" "}
            {state.calendar.length}. The paddock is already talking about the next owner.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={onReset}>Back to menu</Button>
          </div>
        </div>
      </div>
    );
  }

  const pos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
  const prize = [...t.history].reverse().find((h) => h.label.includes("prize money"))?.amount ?? 0;
  const champion = state.standingsConstructors[0];
  const income = t.history.reduce((a, h) => a + Math.max(0, h.amount), 0);
  const spend = t.history.reduce((a, h) => a + Math.min(0, h.amount), 0);
  const net = income + spend;
  const headline =
    pos <= 3
      ? "A season to remember — the paddock is talking about you."
      : pos <= 6
        ? "A solid midfield season with flashes of the podium."
        : pos <= 10
          ? "A season of survival. Sponsors noticed the effort."
          : "A season to burn and rebuild from.";

  const myDrivers = state.standingsDrivers
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.driverId === t.driver1Id || s.driverId === t.driver2Id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-md border border-hairline bg-surface p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.3em] text-ink-faint">
          Season {state.season} · seed {state.seed} · final report
        </div>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase">
          WCC P{pos}
          <span className="text-signal">.</span>
        </h1>
        <p className="mt-2 text-sm text-ink-soft">{headline}</p>
        <p className="mt-1 text-xs text-ink-faint">
          {champion ? `Champions: ${constructorById(champion.teamId, state.season)?.name ?? champion.teamId} (${champion.points} pts).` : ""}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card title="Final tally">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-ink-faint">Cash</span><Money value={t.cash} /></div>
              <div className="flex justify-between"><span className="text-ink-faint">Points</span><span>{t.points}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Wins / podiums</span><span>{t.wins} / {t.podiums}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">DNFs</span><span>{t.dnfs}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Reputation</span><span>{t.reputation}</span></div>
              <div className="mt-2 flex justify-between border-t border-hairline pt-2 font-semibold">
                <span className="text-ink-soft">Prize money (WCC P{pos})</span>
                <Money value={prize} />
              </div>
            </div>
          </Card>
          <Card title="Drivers">
            <div className="space-y-1 text-sm">
              {myDrivers.map(({ s, i }) => {
                const d = driverById(s.driverId);
                if (!d) return null;
                return (
                  <div key={s.driverId} className="flex items-center justify-between">
                    <span>
                      {d.name}
                      <span className="ml-1 text-[11px] text-ink-faint">WDC P{i + 1}</span>
                    </span>
                    <span className="tabular text-ink-soft">{s.points} pts · {s.dnfs} DNF</span>
                  </div>
                );
              })}
              <div className="mt-2 space-y-1 border-t border-hairline pt-2">
                {t.drivers.map((ds) => {
                  const d = driverById(ds.driverId);
                  if (!d) return null;
                  return (
                    <div key={ds.driverId} className="flex justify-between text-xs text-ink-soft">
                      <span>{d.shortName} — final</span>
                      <span className="tabular">conf {ds.confidence} · mor {ds.morale}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-3">
          <Card title="Classification — WCC / WDC">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="divide-y divide-hairline/60">
                {state.standingsConstructors.slice(0, 10).map((s, i) => (
                  <div key={s.teamId} className={`flex items-center gap-2 py-1 text-sm ${s.teamId === t.constructorId ? "font-semibold text-ink" : "text-ink-soft"}`}>
                    <span className="w-5 tabular text-ink-faint">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{constructorById(s.teamId, state.season)?.name ?? s.teamId}</span>
                    <span className="tabular">{s.points}</span>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-hairline/60">
                {state.standingsDrivers.slice(0, 10).map((s, i) => (
                  <div key={s.driverId} className={`flex items-center gap-2 py-1 text-sm ${s.driverId === t.driver1Id || s.driverId === t.driver2Id ? "font-semibold text-ink" : "text-ink-soft"}`}>
                    <span className="w-5 tabular text-ink-faint">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{driverById(s.driverId)?.shortName ?? s.driverId}</span>
                    <span className="tabular">{s.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-3">
          <Card title="Finance — season">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between"><span className="text-ink-faint">Income (sponsors, promoter, prize)</span><span className="tabular text-positive">+{income.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Spending (staff, ops, tests, dev)</span><span className="tabular text-signal">-{Math.abs(spend).toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Net flow</span><span className={`tabular ${net < 0 ? "text-signal" : "text-positive"}`}>{net >= 0 ? "+" : ""}{net.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Cash on hand</span><Money value={t.cash} /></div>
              <div className="flex justify-between"><span className="text-ink-faint">Prize money (WCC P{pos})</span><Money value={prize} /></div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => exportReportImage(state, "portrait")}>Export 9:16</Button>
          <Button variant="ghost" onClick={() => exportReportImage(state, "landscape")}>Export 16:9</Button>
          <Button variant="ghost" onClick={onReset}>Back to menu</Button>
        </div>
        <div className="mt-2 text-center text-[11px] text-ink-faint">
          Exports a shareable PNG report of the season — portrait 1080×1920 or landscape 1920×1080.
        </div>
      </div>
    </div>
  );
}
