import { useState } from "react";
import type { FinancialTransaction, SimulationState } from "@/simulation/types";
import { Card, Modal, Money } from "@/ui/kit";

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
        <Card title="Cash flow by round">
          <div className="divide-y divide-hairline/60">
            {[...byRound.entries()].map(([r, d]) => (
              <div key={r} className="grid grid-cols-[3.5rem_1fr_1fr_1fr] gap-2 py-1 text-sm">
                <span className="tabular text-ink-faint">R{r}</span>
                <span className="tabular text-positive">+{d.inc.toFixed(1)}</span>
                <span className="tabular text-signal">{d.exp.toFixed(1)}</span>
                <span className={`tabular ${d.inc + d.exp < 0 ? "text-signal" : "text-ink"}`}>
                  {(d.inc + d.exp) >= 0 ? "+" : ""}{(d.inc + d.exp).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
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
              <span className={`tabular ${net < 0 ? "text-signal" : "text-positive"}`}>
                {net >= 0 ? "+" : ""}{net.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Reputation</span>
              <span>{t.reputation}</span>
            </div>
          </div>
        </Card>
        <Card title="Ledger">
          <div className="max-h-96 divide-y divide-hairline/60 overflow-auto">
            {[...t.history].reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1 text-xs">
                <span className="tabular text-ink-faint">R{h.round}</span>
                <span className="min-w-0 flex-1 truncate text-ink-soft">{h.label}</span>
                {h.detail ? (
                  <button
                    type="button"
                    title="Why?"
                    onClick={() => setSelected(h)}
                    className="shrink-0 rounded-sm border border-hairline px-1 text-[10px] leading-4 text-ink-faint hover:border-ink-faint hover:text-ink"
                  >
                    ⓘ
                  </button>
                ) : (
                  <span className="w-4 shrink-0" />
                )}
                <Money value={h.amount} className="shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.label} · R${selected.round}` : ""}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-faint">Amount</span>
              <Money value={selected.amount} className="font-display text-base font-bold" />
            </div>
            <p className="border-l-2 border-hairline pl-3 leading-relaxed text-ink-soft">{selected.detail}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}