import { useState } from "react";
import type { SimulationState } from "@/simulation/types";
import { driverById } from "@/data";
import { boostDesc, manageDriver, manageTeam, mgmtCooldown, teamCooldown, MGMT_INFO, TEAM_INFO, type MgmtAction, type TeamAction } from "@/actions";
import { Bar, Button, Card, Empty, Img, Tag } from "@/ui/kit";
import { driverImage } from "@/data/assets";
import type { Act } from "./parts";

interface Props {
  state: SimulationState;
  act: Act;
  onNewsAction: (newsId: string, action: string) => void;
}

const RESPONSES: { action: string; label: string; hint: string }[] = [
  { action: "chat-support", label: "Back him publicly", hint: "morale +6 · confidence +3" },
  { action: "chat-promise", label: "Promise upgrades", hint: "morale +4 · confidence +2 · pressure +2" },
  { action: "chat-tough", label: "Tough love", hint: "frustration −8 · morale −3 · confidence +2" },
];

type ConfirmPick =
  | { kind: "driver"; driverId: string; action: MgmtAction }
  | { kind: "team"; action: TeamAction };

export function ManagementTab({ state, act, onNewsAction }: Props) {
  const t = state.team!;
  const [confirm, setConfirm] = useState<ConfirmPick | null>(null);

  const openChats = state.news.filter((n) => n.kind === "chat" && !n.resolved);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Driver relationships" right={<Tag tone="telemetry">Owner tools</Tag>}>
          <p className="mb-3 text-xs text-ink-faint">
            As team principal you can intervene directly on morale. Interventions have cooldowns measured in race
            weekends — use them wisely, drivers remember how they are treated.
          </p>
          <div className="grid gap-3">
            {t.drivers.map((ds) => {
              const d = driverById(ds.driverId, state.season);
              if (!d) return null;
              return (
                <div key={ds.driverId} className="rounded-md border border-hairline bg-raised/30 p-3">
                  <div className="flex items-center gap-3">
                    <Img src={driverImage(d.id, state.season)} alt={d.shortName} className="h-12 w-12 rounded-sm object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold">{d.name}</div>
                      <div className="text-[11px] text-ink-faint">
                        Pts {ds.points} · {ds.dnfs} DNF · form {ds.form > 0 ? `+${ds.form}` : ds.form}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <Bar label="Confidence" value={ds.confidence} />
                    <Bar label="Morale" value={ds.morale} />
                    <Bar label="Frustration" value={ds.frustration} />
                    <div className="self-end text-[11px] text-ink-faint">
                      {ds.frustration >= 55
                        ? "⚠ Frustrated — a complaint is coming."
                        : ds.morale >= 70
                          ? "Happy with the project."
                          : "Mood is neutral."}
                    </div>
                  </div>
                  {!!ds.boosts?.length && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ds.boosts.map((b, i) => (
                        <span
                          key={`${b.label}-${i}`}
                          title={`Applies once per weekend, then expires`}
                          className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${
                            (b.morale ?? 0) + (b.confidence ?? 0) + (b.frustration ?? 0) >= 0
                              ? "border-positive/40 bg-positive/10 text-positive"
                              : "border-signal/40 bg-signal/10 text-signal"
                          }`}
                        >
                          {b.label}: {boostDesc(b)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Object.keys(MGMT_INFO) as MgmtAction[]).map((a) => {
                      const cd = mgmtCooldown(state, ds.driverId, a);
                      const info = MGMT_INFO[a];
                      return (
                        <Button
                          key={a}
                          small
                          variant={a === "fine" || a === "rant" ? "danger" : a === "bonus" ? "positive" : "primary"}
                          disabled={cd > 0 || t.cash < info.cost}
                          onClick={() => setConfirm({ kind: "driver", driverId: ds.driverId, action: a })}
                        >
                          {info.label}{cd > 0 ? ` (${cd}r)` : info.cost > 0 ? ` $${info.cost}M` : ""}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Team activities" right={<Tag tone="elite">Whole garage</Tag>}>
          <p className="mb-3 text-xs text-ink-faint">
            Paid activities that lift the mood of both drivers and the crew at once. They cost real money and share
            cooldowns measured in race weekends.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(TEAM_INFO) as TeamAction[]).map((a) => {
              const cd = teamCooldown(state, a);
              const info = TEAM_INFO[a];
              return (
                <button
                  key={a}
                  type="button"
                  disabled={cd > 0 || t.cash < info.cost}
                  onClick={() => setConfirm({ kind: "team", action: a })}
                  className={`rounded-md border p-3 text-left transition ${
                    cd > 0 || t.cash < info.cost
                      ? "cursor-not-allowed border-hairline bg-surface opacity-50"
                      : "border-hairline bg-raised/30 hover:border-elite/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold">{info.label}</span>
                    <span className="tabular text-xs font-bold text-positive">${info.cost}M</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">{info.desc}</p>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-ink-faint">
                    {cd > 0 ? `Ready in ${cd} race(s)` : `${info.cooldown}-race cooldown`}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={`Driver conversations${openChats.length ? ` — ${openChats.length} awaiting your response` : ""}`}>
          {openChats.length === 0 && <Empty>No open conversations. Drivers will approach you after race weekends.</Empty>}
          <div className="space-y-3">
            {openChats.map((n) => {
              const payload = n.options?.[0]?.payload;
              const d = payload ? driverById(payload, state.season) : undefined;
              return (
                <div key={n.id} className="rounded-md border border-telemetry/40 bg-telemetry/5 p-3">
                  <div className="flex items-center gap-2">
                    {d && <Img src={driverImage(d.id, state.season)} alt={d.shortName} className="h-8 w-8 rounded-sm object-cover" />}
                    <span className="text-sm font-semibold">{n.title}</span>
                    <Tag tone="telemetry">R{n.round}</Tag>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-soft">{n.body}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(n.options ?? []).map((o) => {
                      const hint = RESPONSES.find((r) => r.action === o.action)?.hint;
                      return (
                        <button
                          key={o.action}
                          type="button"
                          onClick={() => onNewsAction(n.id, o.action)}
                          className="rounded-sm border border-telemetry/40 bg-telemetry/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-telemetry hover:bg-telemetry/20"
                        >
                          {o.label}
                          {hint && <span className="ml-1 normal-case tracking-normal opacity-70">({hint})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="How interventions work">
          <ul className="list-inside list-disc space-y-1 text-xs text-ink-soft">
            {(Object.keys(MGMT_INFO) as MgmtAction[]).map((a) => (
              <li key={a}>
                <span className="font-semibold">{MGMT_INFO[a].label}</span> ({MGMT_INFO[a].cooldown}-race cooldown):{" "}
                {MGMT_INFO[a].desc}
              </li>
            ))}
            {(Object.keys(TEAM_INFO) as TeamAction[]).map((a) => (
              <li key={a}>
                <span className="font-semibold">{TEAM_INFO[a].label}</span> (${TEAM_INFO[a].cost}M,{" "}
                {TEAM_INFO[a].cooldown}-race cooldown): affects both drivers.
              </li>
            ))}
            <li>Morale and confidence feed directly into driver performance each weekend.</li>
            <li>Frustration builds from poor results and broken promises — high frustration triggers complaints.</li>
          </ul>
        </Card>
      </div>

      {confirm && confirm.kind === "driver" && (
        <Modalish
          state={state}
          pick={confirm}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            act((x) => manageDriver(x, confirm.driverId, confirm.action).message);
            setConfirm(null);
          }}
        />
      )}
      {confirm && confirm.kind === "team" && (
        <TeamModal
          state={state}
          action={confirm.action}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            act((x) => manageTeam(x, confirm.action).message);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

function Modalish({
  state,
  pick,
  onClose,
  onConfirm,
}: {
  state: SimulationState;
  pick: { kind: "driver"; driverId: string; action: MgmtAction };
  onClose: () => void;
  onConfirm: () => void;
}) {
  const d = driverById(pick.driverId, state.season);
  const info = MGMT_INFO[pick.action];
  const t = state.team!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-md border border-hairline bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-hairline bg-void px-4 py-3">
          <h3 className="font-display text-base font-bold uppercase tracking-widest">{info.label}</h3>
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink">✕</button>
        </header>
        <div className="space-y-3 p-4 text-sm">
          <p className="text-ink-soft">
            {info.label} for <span className="font-semibold text-ink">{d?.name ?? pick.driverId}</span>?
          </p>
          <p className="rounded-md border border-hairline bg-raised/40 p-3 text-xs leading-relaxed text-ink-soft">{info.desc}</p>
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Cost</span>
            <span className="tabular">{info.cost > 0 ? `$${info.cost}M (cash now $${t.cash.toFixed(1)}M)` : "Free"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Cooldown</span>
            <span className="tabular">{info.cooldown} race weekends</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button small variant="ghost" onClick={onClose}>Cancel</Button>
            <Button small onClick={onConfirm}>Confirm</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamModal({
  state,
  action,
  onClose,
  onConfirm,
}: {
  state: SimulationState;
  action: TeamAction;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const info = TEAM_INFO[action];
  const t = state.team!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-md border border-hairline bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-hairline bg-void px-4 py-3">
          <h3 className="font-display text-base font-bold uppercase tracking-widest">{info.label}</h3>
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink">✕</button>
        </header>
        <div className="space-y-3 p-4 text-sm">
          <p className="rounded-md border border-hairline bg-raised/40 p-3 text-xs leading-relaxed text-ink-soft">{info.desc}</p>
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Cost</span>
            <span className="tabular">${info.cost}M (cash now ${t.cash.toFixed(1)}M → ${(t.cash - info.cost).toFixed(1)}M)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Cooldown</span>
            <span className="tabular">{info.cooldown} race weekends</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button small variant="ghost" onClick={onClose}>Cancel</Button>
            <Button small onClick={onConfirm}>Confirm</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
