import { useState } from "react";
import type { FinancialTransaction, SimulationState } from "@/simulation/types";
import { Card, Modal, Money } from "@/ui/kit";

const CAT_DOT: Record<string, string> = {
  sponsor: "bg-positive",
  prize: "bg-caution",
  salary: "bg-signal",
  staff: "bg-signal",
  operations: "bg-signal",
  supplier: "bg-telemetry",
  development: "bg-telemetry",
  testing: "bg-telemetry",
  other: "bg-hairline",
};

const CAT_LABEL: Record<string, string> = {
  sponsor: "Sponsor payment",
  prize: "Prize money",
  salary: "Driver wages",
  staff: "Staff wages",
  operations: "Team operations",
  supplier: "Supplier / engine lease",
  development: "Development project",
  testing: "Testing programme",
  other: "Other",
};

export function FinanceTab({ state }: { state: SimulationState }) {
  const t = state.team!;
  const [selected, setSelected] = useState<FinancialTransaction | null>(null);
  const byRound = new Map<number, { inc: number; exp: number }>();
  for (const h of t.history) {
    const d = byRound.get(h.round) ?? { inc: 0, exp: 0 };
    if (h.amount > 0) d.inc += h.amount; else d.exp += h.amount;
    byRound.set(h.round, d);
  }
  const net = t.history.reduce((a, h) => a + h.amount, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card title="Cash flow by round" right={<span className="text-[10px] uppercase tracking-wider text-ink-faint">all values $M</span>}>
          <div className="label-tech grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 border-b border-hairline pb-1 text-[10px] text-ink-faint">
            <span>Race weekend</span>
            <span className="text-right">Income</span>
            <span className="text-right">Expenses</span>
            <span className="text-right">Net</span>
          </div>
          <div className="divide-y divide-hairline/60">
            {[...byRound.entries()].map(([r, d]) => {
              const gp = state.calendar[r - 1]?.grandPrix;
              return (
                <div key={r} className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 py-1 text-sm">
                  <span className="min-w-0 truncate text-ink-soft" title={`Round ${r}${gp ? ` — ${gp}` : ""}`}>
                    <span className="sm:hidden">R{r}</span>
                    <span className="hidden sm:inline">R{r}{gp ? ` — ${gp}` : ""}</span>
                  </span>
                  <span className="num-data text-right text-positive">+{d.inc.toFixed(1)}</span>
                  <span className="num-data text-right text-signal">{d.exp.toFixed(1)}</span>
                  <span className={`num-data text-right ${d.inc + d.exp < 0 ? "text-signal" : "text-ink"}`}>
                    {(d.inc + d.exp) >= 0 ? "+" : ""}{(d.inc + d.exp).toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            Income = sponsor race payments + promoter share (points × $0.45M). Expenses = driver & staff wages, team
            operations and the power-unit lease, all paid per weekend. One-time purchases (parts, development,
            transfers) appear only in the ledger.
          </p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Season totals">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-faint">Cash now</span>
              <Money value={t.cash} />
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Net flow</span>
              <span className={`num-data ${net < 0 ? "text-signal" : "text-positive"}`}>
                {net >= 0 ? "+" : ""}{net.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Reputation</span>
              <span>{t.reputation}</span>
            </div>
          </div>
        </Card>
        <Card title="Ledger" right={<span className="text-[10px] uppercase tracking-wider text-ink-faint">newest first</span>}>
          <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-faint">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-positive" />Sponsor</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-caution" />Prize</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-signal" />Wages & ops</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-telemetry" />Dev & supplier</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-hairline" />Other</span>
          </div>
          <div className="label-tech mb-2 grid grid-cols-[3.6rem_1fr_auto_5rem] gap-2 border-b border-hairline pb-1 text-[10px] text-ink-faint">
            <span>Weekend</span>
            <span>Detail</span>
            <span />
            <span className="text-right">Amount</span>
          </div>
          <div className="max-h-96 divide-y divide-hairline/60 overflow-auto pr-1 [scrollbar-gutter:stable]">
            {[...t.history].reverse().map((h, i) => {
              const gp = state.calendar[h.round - 1]?.grandPrix;
              return (
                <div
                  key={i}
                  onClick={() => h.detail && setSelected(h)}
                  className={`group grid grid-cols-[3.6rem_1fr_auto_5rem] items-center gap-2 py-1 text-xs ${
                    h.detail ? "cursor-pointer hover:bg-raised/40" : ""
                  }`}
                >
                  <span
                    className="num-data flex items-center gap-1.5 text-ink-faint"
                    title={`${CAT_LABEL[h.category] ?? h.category} · Round ${h.round}${gp ? ` — ${gp}` : ""}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${CAT_DOT[h.category] ?? "bg-hairline"}`} />
                    R{h.round}
                  </span>
                  <span className="min-w-0 truncate text-ink-soft">{h.label}</span>
                  {h.detail ? (
                    <span className="shrink-0 rounded-sm border border-transparent px-1 text-[10px] leading-4 text-ink-faint group-hover:border-hairline group-hover:text-ink">
                      ⓘ
                    </span>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <Money value={h.amount} className="shrink-0 justify-self-end" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.label} · R${selected.round}${state.calendar[selected.round - 1] ? ` — ${state.calendar[selected.round - 1].grandPrix}` : ""}` : ""}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-faint">Amount</span>
              <Money value={selected.amount} className="text-base" />
            </div>
            <p className="whitespace-pre-line rounded-md border border-hairline bg-raised/40 p-3 text-xs leading-relaxed text-ink-soft">
              {selected.detail}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}