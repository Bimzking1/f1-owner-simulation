import type { SimulationState } from "@/simulation/types";
import { sponsorById } from "@/data";
import { availableSponsors } from "@/data";
import { signSponsor, terminateSponsor } from "@/actions";
import { Button, Card, Empty, Money, Tag } from "@/ui/kit";
import type { Act } from "./parts";

interface Props {
  state: SimulationState;
  act: Act;
}

export function SponsorsTab({ state, act }: Props) {
  const t = state.team!;
  const active = t.sponsors.filter((s) => s.active);
  const pool = availableSponsors(state.season, t.reputation, t.cash + 40);
  const signed = new Set(t.sponsors.map((s) => s.sponsorId));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Current contracts" right={<Tag tone="telemetry">{active.length}/5 slots</Tag>}>
          {active.length === 0 && <Empty>No sponsors signed. The garage livery is naked.</Empty>}
          <div className="grid gap-2 sm:grid-cols-2">
            {active.map((s) => {
              const spec = sponsorById(s.sponsorId);
              if (!spec) return null;
              return (
                <div key={s.sponsorId} className="rounded-md border border-hairline p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold">{spec.name}</span>
                    <Tag tone={spec.tier === "title" ? "elite" : spec.tier === "major" ? "telemetry" : "ink"}>{spec.tier}</Tag>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-soft">{spec.objectiveTextEnjoyer}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
                    <span>
                      {s.deadlineRound > 0 ? (
                        <>
                          Progress {s.progress}/{s.required}
                        </>
                      ) : (
                        "Objective pending"
                      )}
                      {" · "}paid <Money value={s.totalPaid} />
                    </span>
                    <Button small variant="danger" onClick={() => act((x) => terminateSponsor(x, s.sponsorId).message)}>
                      Terminate
                    </Button>
                  </div>
                  {s.deadlineRound > 0 && <div className="mt-1 text-[11px] text-caution">Evaluation at round {s.deadlineRound}</div>}
                  <div className="mt-1 text-[11px] text-ink-faint">Patience {s.patience}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Available sponsors">
          <div className="grid gap-2 sm:grid-cols-2">
            {pool.map((spec) => {
              const taken = signed.has(spec.id);
              return (
                <div key={spec.id} className={`rounded-md border p-3 ${taken ? "border-positive/50 bg-positive/10" : "border-hairline"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold">{spec.name}</span>
                    <Tag tone={spec.tier === "title" ? "elite" : spec.tier === "major" ? "telemetry" : "ink"}>{spec.tier}</Tag>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-soft">{spec.objectiveTextEnjoyer}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink-faint">
                      <Money value={spec.signingBonus} /> sign · <Money value={spec.racePayment} />/race ·{" "}
                      +<Money value={spec.bonus} /> bonus
                    </span>
                    <Button small variant="ghost" disabled={taken} onClick={() => act((x) => signSponsor(x, spec.id).message)}>
                      Sign
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="How sponsors work">
          <ul className="list-inside list-disc space-y-1 text-xs text-ink-soft">
            <li>Signing bonuses are paid immediately from cash.</li>
            <li>Race payments arrive automatically every weekend.</li>
            <li>Objectives are evaluated at a deadline round.</li>
            <li>Miss an objective and patience drops. At 0, the sponsor walks.</li>
            <li>Reputation gates title sponsors (30+).</li>
          </ul>
        </Card>
        <Card title="Sponsor income">
          <div className="text-sm text-ink-soft">
            <div className="flex justify-between">
              <span className="text-ink-faint">This season</span>
              <Money value={active.reduce((a, s) => a + s.totalPaid, 0)} />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-faint">Per race (active)</span>
              <Money value={active.reduce((a, s) => a + (sponsorById(s.sponsorId)?.racePayment ?? 0), 0)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}