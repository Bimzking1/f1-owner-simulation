import { useState } from "react";
import type { SimulationState, SponsorSpec, SponsorState } from "@/simulation/types";
import { sponsorById } from "@/data";
import { availableSponsors } from "@/data";
import { signSponsor, terminateSponsor } from "@/actions";
import { difficultyOf, sponsorSlotsOf } from "@/state";
import { Button, Card, Empty, Img, Meter, Modal, Money, Tag } from "@/ui/kit";
import type { Act } from "./parts";
import { audioManager, UI_SOUNDS } from "@/ui/audio";

interface Props {
  state: SimulationState;
  act: Act;
}

export function SponsorsTab({ state, act }: Props) {
  const t = state.team!;
  const [confirm, setConfirm] = useState<SponsorSpec | null>(null);
  const [terminating, setTerminating] = useState<{ s: SponsorState; spec: SponsorSpec } | null>(null);
  const active = t.sponsors.filter((s) => s.active);
  const slots = sponsorSlotsOf(state.difficulty);
  const full = active.length >= slots;
  const pool = availableSponsors(state.season, t.reputation);
  const signed = new Set(t.sponsors.map((s) => s.sponsorId));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Current contracts" right={<Tag tone={full ? "caution" : "telemetry"}>{active.length}/{slots} slots</Tag>}>
          {active.length === 0 && <Empty>No sponsors signed. The garage livery is naked.</Empty>}
          <div className="grid gap-2 sm:grid-cols-2">
            {active.map((s) => {
              const spec = sponsorById(s.sponsorId);
              if (!spec) return null;
              return (
                <div key={s.sponsorId} className="rounded-md border border-hairline p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Img src={spec.image} alt={spec.name} className="h-6 w-10 shrink-0 rounded-sm object-contain" />
                      <div className="min-w-0">
                        <div className="truncate font-display font-bold">{spec.name}</div>
                        <div className="truncate text-[10px] text-ink-faint">{spec.category}</div>
                      </div>
                    </div>
                    <Tag tone={spec.tier === "title" ? "elite" : spec.tier === "major" ? "telemetry" : "ink"}>{spec.tier}</Tag>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-soft">{spec.objectiveTextEnjoyer}</div>
                  {s.deadlineRound > 0 ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={s.progress >= s.required ? "text-positive" : "text-ink-faint"}>
                          Goal {s.progress}/{s.required}
                        </span>
                        <span className={s.deadlineRound - state.completedRounds <= 2 ? "text-caution" : "text-ink-faint"}>
                          eval after R{s.deadlineRound} · {Math.max(0, s.deadlineRound - state.completedRounds)} race(s) left
                        </span>
                      </div>
                      <Meter
                        value={s.progress}
                        max={Math.max(1, s.required)}
                        tone={s.progress >= s.required ? "positive" : s.deadlineRound - state.completedRounds <= 2 ? "caution" : "telemetry"}
                        className="mt-1"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-ink-faint">Objective pending — assigned next weekend.</div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
                    <span>paid <Money value={s.totalPaid} /> · patience {s.patience}</span>
                    <Button small variant="danger" onClick={() => setTerminating({ s, spec })}>
                      Terminate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Available sponsors" right={<Tag tone={full ? "caution" : "telemetry"}>{full ? "board full" : `${slots - active.length} slot(s) free`}</Tag>}>
          <div className="grid gap-2 sm:grid-cols-2">
            {pool.map((spec) => {
              const taken = signed.has(spec.id);
              return (
                <button
                  key={spec.id}
                  type="button"
                  disabled={taken || full}
                  onClick={() => setConfirm(spec)}
                  className={`rounded-md border p-3 text-left transition disabled:cursor-default ${
                    taken ? "border-positive/50 bg-positive/10" : full ? "border-hairline opacity-50" : "border-hairline hover:border-ink-faint"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Img src={spec.image} alt={spec.name} className="h-6 w-10 shrink-0 rounded-sm object-contain" />
                      <div className="min-w-0">
                        <div className="truncate font-display font-bold">{spec.name}</div>
                        <div className="truncate text-[10px] text-ink-faint">{spec.category}</div>
                      </div>
                    </div>
                    <Tag tone={spec.tier === "title" ? "elite" : spec.tier === "major" ? "telemetry" : "ink"}>{spec.tier}</Tag>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-soft">{spec.objectiveTextEnjoyer}</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink-faint">
                      Pays <Money value={spec.racePayment} />/race · +<Money value={spec.bonus} /> bonus
                    </span>
                    <span className="font-display text-[11px] font-bold uppercase tracking-widest text-signal">
                      {taken ? "Signed" : full ? "No slot" : "Review →"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {full && (
            <p className="mt-3 rounded-md border-l-2 border-caution bg-caution/10 p-3 text-xs leading-relaxed text-caution">
              All {slots} sponsor slots are filled on {difficultyOf(state).label}. Terminate a contract below to open a slot.
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="How sponsors work">
          <ul className="list-inside list-disc space-y-1 text-xs text-ink-soft">
            <li>Signing is free — no up-front fee, ever.</li>
            <li>Race payments arrive automatically every weekend.</li>
            <li>Objectives are evaluated at a deadline round.</li>
            <li>Miss an objective and patience drops. At 0, the sponsor walks.</li>
            <li>Reputation gates title sponsors (30+).</li>
            <li>
              Slot count scales with difficulty: Rookie 7 · Professional 5 · Expert 4 · Ruthless 3.
            </li>
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

      {confirm && (
        <Modal open onClose={() => setConfirm(null)} title={`Sign ${confirm.name}?`}>
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-ink-soft">
              Are you sure you want to add <span className="font-semibold text-ink">{confirm.name}</span> as a new
              sponsor mid-season? The deal locks in a slot and an obligation.
            </p>
            <div className="flex items-center gap-3 rounded-md border border-hairline bg-raised/40 p-3">
              <Img src={confirm.image} alt={confirm.name} className="h-8 w-14 shrink-0 rounded-sm object-contain" />
              <div className="min-w-0">
                <div className="font-display font-bold">{confirm.name}</div>
                <div className="text-[11px] text-ink-faint">{confirm.category}</div>
              </div>
            </div>
            <div className="grid gap-2 rounded-md border border-hairline bg-raised/40 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-faint">Benefit — per race</span>
                <span className="num-data text-positive">
                  <Money value={confirm.racePayment} /> + <Money value={confirm.bonus} /> bonus
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-faint">Payment</span>
                <span className="num-data">
                  <Money value={confirm.racePayment} /> paid every race · free to sign
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-faint">Tier</span>
                <Tag tone={confirm.tier === "title" ? "elite" : confirm.tier === "major" ? "telemetry" : "ink"}>{confirm.tier}</Tag>
              </div>
            </div>
            <div className="rounded-md border-l-2 border-hairline bg-raised/40 p-3 text-xs">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                Requirement to get the money
              </div>
              <p className="leading-relaxed text-ink-soft">{confirm.objectiveTextEnjoyer}</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button small variant="ghost" onClick={() => setConfirm(null)}>
                Not now
              </Button>
              <Button
                small
                onClick={() => {
                  audioManager.playUi(UI_SOUNDS.success);
                  act((x) => signSponsor(x, confirm.id).message);
                  setConfirm(null);
                }}
              >
                Yes, sign {confirm.name}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {terminating && (
        <TerminateConfirmModal
          state={state}
          sponsor={terminating.s}
          spec={terminating.spec}
          onClose={() => setTerminating(null)}
          onConfirm={() => {
            audioManager.playUi(UI_SOUNDS.warning);
            act((x) => terminateSponsor(x, terminating.s.sponsorId).message);
            setTerminating(null);
          }}
        />
      )}
    </div>
  );
}

function TerminateConfirmModal({
  state,
  sponsor,
  spec,
  onClose,
  onConfirm,
}: {
  state: SimulationState;
  sponsor: SponsorState;
  spec: SponsorSpec;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = state.team!;
  const fee = Math.round(spec.bonus * 0.4 * 100) / 100;
  const roundsLeft = Math.max(1, state.calendar.length - state.completedRounds);
  const incomeLost = Math.round(spec.racePayment * roundsLeft * 100) / 100;
  const cashAfter = Math.round((t.cash - fee) * 100) / 100;
  return (
    <Modal open onClose={onClose} title={`Terminate ${spec.name}?`}>
      <div className="space-y-3 text-sm">
        <p className="text-xs leading-relaxed text-ink-soft">
          Ending the contract with <span className="font-semibold text-ink">{spec.name}</span> mid-season triggers an
          exit settlement and frees a sponsor slot. This cannot be undone — the deal is gone for the rest of the season.
        </p>

        <div className="flex items-center gap-3 rounded-md border border-hairline bg-raised/40 p-3">
          <Img src={spec.image} alt={spec.name} className="h-8 w-14 shrink-0 rounded-sm object-contain" />
          <div className="min-w-0">
            <div className="font-display font-bold">{spec.name}</div>
            <div className="text-[11px] text-ink-faint">
              {spec.category} ·{" "}
              <Tag tone={spec.tier === "title" ? "elite" : spec.tier === "major" ? "telemetry" : "ink"}>{spec.tier}</Tag>{" "}
              · objective {sponsor.deadlineRound > 0 ? `${sponsor.progress}/${sponsor.required}` : "pending"}
            </div>
          </div>
        </div>

        <div className="grid gap-2 rounded-md border border-hairline bg-raised/40 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-faint">Exit fee (40% of bonus)</span>
            <span className="num-data text-signal">−<Money value={fee} /></span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-faint">Reputation</span>
            <span className="num-data text-signal">−5</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-faint">Income lost ({roundsLeft} round(s) × ${spec.racePayment}M)</span>
            <span className="num-data text-caution">−<Money value={incomeLost} /></span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 border-t border-hairline pt-2">
            <span className="text-ink-faint">Cash now → after exit fee</span>
            <span className="num-data">${t.cash.toFixed(2)}M → <span className={cashAfter < 0 ? "text-signal" : ""}>${cashAfter.toFixed(2)}M</span></span>
          </div>
          {cashAfter < 10 && (
            <div className="rounded-md border-l-2 border-caution bg-caution/10 p-2 leading-relaxed text-caution">
              Warning: this leaves you with less than $10M.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button small variant="ghost" onClick={onClose}>Keep contract</Button>
          <Button small variant="danger" onClick={onConfirm}>
            Yes, terminate {spec.name}
          </Button>
        </div>
      </div>
    </Modal>
  );
}