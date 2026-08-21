// ============================================================================
// F1 Owner — Season systems (spec §42-50, §53)
// Component wear, finances, morale, sponsors, development, news, bankruptcy.
// All functions mutate a draft SimulationState (the caller clones first).
// ============================================================================

import type {
  NewsPriority,
  RaceWeekendResult,
  SimulationState,
  TeamState,
} from "./types";
import { driverById, engineById, engineerById, mechanicById, sponsorById } from "@/data";
import { DIFFICULTIES } from "@/data/config";
import { clamp, type Rng } from "./rng";

// ---------------------------------------------------------------------------
// Championship (spec §53)

export function applyStandings(state: SimulationState, weekend: RaceWeekendResult) {
  const driverStanding = new Map(state.standingsDrivers.map((s) => [s.driverId, s]));
  const teamStanding = new Map(state.standingsConstructors.map((s) => [s.teamId, s]));

  const apply = (entries: { driverId: string; teamId: string; position: number | null; points: number }[]) => {
    for (const e of entries) {
      const ds = driverStanding.get(e.driverId);
      if (ds) {
        ds.points += e.points;
        if (e.position === 1) ds.wins++;
        if (e.position !== null && e.position <= 3) ds.podiums++;
        if (e.position === null) ds.dnfs++;
        if (e.position !== null && (ds.best === 0 || e.position < ds.best)) ds.best = e.position;
      }
      const ts = teamStanding.get(e.teamId);
      if (ts) {
        ts.points += e.points;
        if (e.position === 1) ts.wins++;
        if (e.position !== null && e.position <= 3) ts.podiums++;
        if (e.position === null) ts.dnfs++;
      }
    }
  };

  if (weekend.sprint) {
    apply(weekend.sprint.map((e) => ({ driverId: e.driverId, teamId: e.teamId, position: e.position, points: e.points })));
  }
  apply(weekend.race.map((e) => ({ driverId: e.driverId, teamId: e.teamId, position: e.position, points: e.points })));

  state.standingsDrivers = [...driverStanding.values()].sort((a, b) => b.points - a.points);
  state.standingsConstructors = [...teamStanding.values()].sort((a, b) => b.points - a.points);

  if (state.team) {
    const t = state.team;
    const teamStand = state.standingsConstructors.find((s) => s.teamId === t.constructorId);
    t.points = teamStand?.points ?? 0;
    t.wins = teamStand?.wins ?? 0;
    t.podiums = teamStand?.podiums ?? 0;
    t.dnfs = teamStand?.dnfs ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Component wear (spec §42)

export function advanceWear(state: SimulationState, weekend: RaceWeekendResult, rng: Rng) {
  const t = state.team;
  if (!t) return;
  void weekend;
  const rel = t.car.reliability;
  const wearMult = 1.15 - rel / 150;
  const stress = t.car.reliability < 60 ? 1.35 : 1.0;
  const eLoss = (2.4 + rng() * 1.6) * wearMult * stress;
  const gLoss = (1.9 + rng() * 1.2) * wearMult * stress;

  t.components.engine.condition = Math.round(clamp(t.components.engine.condition - eLoss, 5, 100) * 10) / 10;
  t.components.gearbox.condition = Math.round(clamp(t.components.gearbox.condition - gLoss, 5, 100) * 10) / 10;
  t.components.engine.age++;
  t.components.gearbox.age++;
}

/** Cost in $M to replace a component; null if unavailable. */
export function replacementCost(component: "engine" | "gearbox", state: SimulationState): number | null {
  if (!state.team) return null;
  if (component === "engine") return state.season === 2013 ? 4.5 : 6;
  return state.season === 2013 ? 3 : 3.5;
}

export function replaceComponent(draft: SimulationState, component: "engine" | "gearbox") {
  const t = draft.team;
  if (!t) return;
  const cost = replacementCost(component, draft);
  if (cost === null || t.cash < cost) return;
  t.cash = Math.round((t.cash - cost) * 100) / 100;
  t.components[component] = {
    condition: 100,
    age: 0,
    replacements: t.components[component].replacements + 1,
  };
  t.history.push({
    round: draft.completedRounds + 1,
    label: `${component === "engine" ? "Engine" : "Gearbox"} replacement`,
    amount: -cost,
    category: "other",
    detail: `${component === "engine" ? "Engine" : "Gearbox"} unit purchased.\nPaid in full up front — one-time part purchase, not a recurring fee.`,
  });
}

// ---------------------------------------------------------------------------
// Finances (spec §48-49 cash flow)

export interface RaceFinanceBreakdown {
  sponsorIncome: number;
  promoterShare: number;
  salaries: number;
  operations: number;
  supplier: number;
  staff: number;
}

export function applyRaceFinance(state: SimulationState, weekend: RaceWeekendResult): RaceFinanceBreakdown {
  const t = state.team;
  if (!t)
    return { sponsorIncome: 0, promoterShare: 0, salaries: 0, operations: 0, supplier: 0, staff: 0 };
  const totalRounds = state.calendar.length || 19;
  const round = state.completedRounds + 1;

  // sponsor race payments
  let sponsorIncome = 0;
  for (const s of t.sponsors) {
    if (!s.active) continue;
    const spec = sponsorById(s.sponsorId);
    if (!spec) continue;
    const pay = Math.round(spec.racePayment * 100) / 100;
    sponsorIncome += pay;
    s.totalPaid = Math.round((s.totalPaid + pay) * 100) / 100;
  }

  // promoter share from race points
  const teamPoints = weekend.playerEntries.reduce((a, e) => a + e.points, 0);
  const promoterShare = Math.round(teamPoints * 0.45 * 100) / 100;

  const perRace = (seasonTotal: number) => Math.round((seasonTotal / totalRounds) * 100) / 100;
  const d1 = driverById(t.driver1Id, state.season);
  const d2 = driverById(t.driver2Id, state.season);
  const salaries = perRace((d1?.salary ?? 4) + (d2?.salary ?? 4));
  const opsSeason = teamOperatingCost(t);
  const operations = perRace(opsSeason);
  const leaseSeason = state.season === 2013 ? 11 : 14;
  const supplier = perRace(leaseSeason);
  const staffTotal =
    t.engineerIds.reduce((a, id) => a + (engineerById(id)?.cost ?? 0), 0) +
    t.mechanicIds.reduce((a, id) => a + (mechanicById(id)?.cost ?? 0), 0);
  const staff = perRace(staffTotal);

  const income = Math.round((sponsorIncome + promoterShare) * 100) / 100;
  const expense = Math.round((salaries + operations + supplier + staff) * 100) / 100;
  t.cash = Math.round((t.cash + income - expense) * 100) / 100;

  const sponsorBreakdown = t.sponsors
    .filter((s) => s.active)
    .map((s) => {
      const spec = sponsorById(s.sponsorId);
      return spec ? `${spec.name} — $${spec.racePayment}M/weekend` : null;
    })
    .filter((x): x is string => Boolean(x))
    .join("\n");
  const engName = engineById(t.engineId)?.supplier ?? "engine";
  const staffLines = [
    ...t.engineerIds.map((id) => {
      const e = engineerById(id);
      return e ? `${e.name} — $${e.cost}M/season` : null;
    }),
    ...t.mechanicIds.map((id) => {
      const m = mechanicById(id);
      return m ? `${m.name} — $${m.cost}M/season` : null;
    }),
  ].filter((x): x is string => Boolean(x));

  t.history.push(
    {
      round,
      label: "Sponsor payments",
      amount: sponsorIncome,
      category: "sponsor",
      detail: sponsorBreakdown
        ? `Active sponsors pay per race weekend — no upfront sign fees.\n${sponsorBreakdown}`
        : "No active sponsor contracts this weekend.",
    },
    {
      round,
      label: "Promoter share",
      amount: promoterShare,
      category: "prize",
      detail: `${teamPoints} point(s) × $0.45M = $${promoterShare.toFixed(2)}M. Promoter pays the team per championship point scored.`,
    },
    {
      round,
      label: "Driver salaries",
      amount: -salaries,
      category: "salary",
      detail: `Driver contracts are paid per weekend, not up front.\n${d1?.name ?? t.driver1Id} — $${d1?.salary ?? 4}M/season\n${d2?.name ?? t.driver2Id} — $${d2?.salary ?? 4}M/season\nTotal $${(d1?.salary ?? 4) + (d2?.salary ?? 4)}M ÷ ${totalRounds} race weekends = $${salaries.toFixed(2)}M this weekend.`,
    },
    {
      round,
      label: "Staff salaries",
      amount: -staff,
      category: "staff",
      detail: `Staff are paid per weekend, not at hiring.\n${staffLines.join("\n")}\nTotal $${staffTotal}M/season ÷ ${totalRounds} race weekends = $${staff.toFixed(2)}M this weekend.`,
    },
    {
      round,
      label: "Team operations",
      amount: -operations,
      category: "operations",
      detail: `Operations run at 8% of the starting fund (min $3.6M).\n$${t.startCash}M × 8% = $${opsSeason}M/season\n÷ ${totalRounds} weekends = $${operations.toFixed(2)}M this weekend.\nCovers logistics, rent, travel.`,
    },
    {
      round,
      label: "Power unit lease",
      amount: -supplier,
      category: "supplier",
      detail: `${engName} power unit — $${leaseSeason}M annual lease.\n÷ ${totalRounds} weekends = $${supplier.toFixed(2)}M this weekend.\nEquipment lease fees are spread per race.`,
    },
  );
  return { sponsorIncome, promoterShare, salaries, operations, supplier, staff };
}

function teamOperatingCost(t: TeamState): number {
  // derived from constructor size — stored implicitly via startCash tier.
  // 8% of the starting fund (min $3.6M) covers the weekly running bill now
  // that staff wages are paid per weekend instead of up front.
  return Math.max(3.6, Math.round(t.startCash * 0.08 * 10) / 10);
}

/** Season-end prize money by projected WCC position. */
export function prizeMoney(teamsCount: number, position: number): number {
  const table = [60, 50, 42, 36, 30, 25, 20, 16, 12, 9, 6, 4];
  return table[Math.min(position - 1, table.length - 1, teamsCount - 1)] ?? 3;
}

// ---------------------------------------------------------------------------
// Driver morale (spec §22)

export function applyMorale(state: SimulationState, weekend: RaceWeekendResult) {
  const t = state.team;
  if (!t) return;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const mult = diff.moraleMultiplier;

  for (const ds of t.drivers) {
    const entry = weekend.playerEntries.find((e) => e.driverId === ds.driverId);
    if (!entry) continue;
    const pos = entry.position;
    let conf = 0, mor = 0, frust = 0;

    if (entry.dnf) {
      mor -= 6; frust += 7;
    } else if (pos === 1) { conf += 9; mor += 8; frust -= 6; }
    else if (pos <= 3) { conf += 6; mor += 5; frust -= 4; }
    else if (pos <= 6) { conf += 3; mor += 3; frust -= 2; }
    else if (pos <= 10) { conf += 1; mor += 1; }
    else if (pos <= 15) { mor -= 1; }
    else { conf -= 2; mor -= 3; frust += 2; }

    const other = t.drivers.find((x) => x.driverId !== ds.driverId);
    const otherEntry = weekend.playerEntries.find((e) => e.driverId === other?.driverId);
    if (otherEntry && !otherEntry.dnf && !entry.dnf) {
      if (pos < otherEntry.position) conf += 2;
      else if (pos > otherEntry.position + 1) mor -= 2;
    }

    ds.confidence = clamp(ds.confidence + Math.round(conf * mult), 0, 100);
    ds.morale = clamp(ds.morale + Math.round(mor * mult), 0, 100);
    ds.frustration = clamp(ds.frustration + Math.round(frust * mult), 0, 100);
    if (entry.dnf) ds.dnfs++;
    ds.points += entry.points;
  }
}

// ---------------------------------------------------------------------------
// Sponsors (spec §46-48)

export function scheduleSponsorObjectives(state: SimulationState, rng: Rng) {
  const t = state.team;
  if (!t) return;
  for (const s of t.sponsors) {
    if (!s.active || s.deadlineRound > 0) continue;
    const spec = sponsorById(s.sponsorId);
    if (!spec) continue;
    switch (spec.objective) {
      case "pointsNextRaces":
        s.required = 3; s.deadlineRound = state.completedRounds + 4; break;
      case "top10NextRaces":
        s.required = 4; s.deadlineRound = state.completedRounds + 6; break;
      case "podiumByRound":
        s.required = 1; s.deadlineRound = state.calendar.length - (state.season === 2013 ? 4 : 8); break;
      case "pointsConsecutive":
        s.required = state.season === 2013 ? 2 : 3; s.deadlineRound = state.completedRounds + 12; break;
      case "beatRival":
        s.required = 1; s.deadlineRound = state.completedRounds + 5; break;
      case "wccPosition":
        s.required = state.season === 2013 ? 6 : 8;
        s.deadlineRound = state.calendar.length;
        break;
    }
    if (spec.risk === "high" && rng() < 0.15) {
      // tougher immediate ask
      s.required += 1;
    }
  }
}

export function evaluateSponsors(state: SimulationState) {
  const t = state.team;
  if (!t) return;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const specMult = diff.sponsorMultiplier;
  const round = state.completedRounds + 1;
  const weekend = state.lastWeekend;
  if (!weekend) return;

  const scored = (round as number) >= 0 && weekend.playerEntries.some((e) => e.points > 0);
  const top10 = weekend.playerEntries.some((e) => !e.dnf && e.position <= 10);
  const podium = weekend.playerEntries.some((e) => e.position !== null && e.position <= 3);
  const isRuthless = state.difficulty === "ruthless";
  void isRuthless;

  for (const s of t.sponsors) {
    if (!s.active || s.deadlineRound <= 0) continue;
    const spec = sponsorById(s.sponsorId);
    if (!spec) continue;

    switch (spec.objective) {
      case "pointsNextRaces":
        if (scored) s.progress++;
        break;
      case "top10NextRaces":
        if (top10) s.progress++;
        break;
      case "podiumByRound":
        if (podium) s.progress++;
        break;
      case "pointsConsecutive":
        if (scored) s.progress++;
        else s.progress = 0;
        break;
      case "wccPosition":
      case "beatRival":
        s.progress++; // evaluated at deadline instead
        break;
    }

    if (round >= s.deadlineRound) {
      const targetRival = state.standingsConstructors.find((c) => c.teamId !== t.constructorId);
      let met = s.progress >= s.required;
      if (spec.objective === "wccPosition") {
        const pos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
        met = pos <= s.required;
      } else if (spec.objective === "beatRival") {
        const my = t.points;
        const rival = targetRival ? targetRival.points : 0;
        met = my >= rival;
      }

      if (met) {
        s.patience = clamp(spec.patience + 1, 1, 6);
        t.cash = Math.round((t.cash + spec.bonus) * 100) / 100;
        t.reputation = clamp(t.reputation + Math.round(2 * specMult), 0, 100);
        t.history.push({
          round,
          label: `${spec.name} bonus`,
          amount: spec.bonus,
          category: "sponsor",
          detail: `Objective met for ${spec.name}.\nContract bonus $${spec.bonus}M paid by the sponsor.`,
        });
        state.news.unshift({
          id: `bonus-${round}-${s.sponsorId}`,
          round,
          tag: "sponsor",
          priority: "info" satisfies NewsPriority,
          title: `${spec.name} pays the bonus`,
          body: `Objective met (${s.progress}/${s.required}). +$${spec.bonus}M bonus, reputation +${Math.round(2 * specMult)}. A new target will be set on the contract.`,
          bodyEnjoyer: `${spec.name} is thrilled and paid out. A new target appears on the contract.`,
          options: [{ label: "Review sponsors", action: "goto:sponsors" }],
        });
        s.progress = 0;
        s.deadlineRound = round + (spec.objective === "pointsNextRaces" || spec.objective === "top10NextRaces" ? 5 : 8);
        s.required = Math.max(1, Math.round(s.required * 0.9 * specMult));
      } else {
        s.patience--;
        if (s.patience <= 0) {
          s.active = false;
          t.reputation = Math.max(0, t.reputation - Math.round(6 * specMult));
          state.news.unshift({
            id: `exit-${round}-${s.sponsorId}`,
            round,
            tag: "sponsor",
            priority: "urgent" satisfies NewsPriority,
            title: `${spec.name} pulls out`,
            body: `CONTRACT TERMINATED at round ${round} — objective missed (${s.progress}/${s.required}: ${spec.objectiveText}). Reputation -${Math.round(6 * specMult)}. You lose $${spec.racePayment}M per race income.`,
            bodyEnjoyer: `${spec.name} walked. Your reputation took a hit.`,
            options: [{ label: "Find a new sponsor", action: "goto:sponsors" }],
          });
        } else {
          const roundsLeft = Math.max(0, s.deadlineRound - round);
          state.news.unshift({
            id: `warn-${round}-${s.sponsorId}`,
            round,
            tag: "sponsor",
            priority: "warning" satisfies NewsPriority,
            title: `${spec.name} is unimpressed`,
            body: `Objective missed at evaluation: ${s.progress}/${s.required} — "${spec.objectiveText}". Patience left: ${s.patience}. If it hits 0 they terminate the deal (−$${spec.racePayment}M/race income).`,
            bodyEnjoyer: `They wanted ${spec.objectiveTextEnjoyer}. Patience left: ${s.patience}.`,
            options: [{ label: "Review sponsors", action: "goto:sponsors" }],
          });
          void roundsLeft;
        }
        s.progress = 0;
        s.deadlineRound = 0;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Development (spec §43-44)

export interface DevOption {
  id: string;
  name: string;
  cost: number;
  duration: number;
  effect: number;
  target: "aero" | "chassis" | "reliability" | "gearbox" | "pitCrew" | "driverTraining";
  risk: number;
  description: string;
  driverId?: string;
}

export function generateDevOptions(state: SimulationState): DevOption[] {
  const t = state.team;
  if (!t) return [];
  const season = state.season;
  const engSpeed =
    t.engineerIds.reduce((a, id) => a + (engineerById(id)?.developmentSpeed ?? 60), 0) /
    Math.max(1, t.engineerIds.length);
  const engInnov =
    t.engineerIds.reduce((a, id) => a + (engineerById(id)?.innovation ?? 50), 0) /
    Math.max(1, t.engineerIds.length);
  const dur = (base: number) => Math.max(2, Math.round(base * (1.25 - engSpeed / 400)));
  const risk = Math.max(0.03, 0.16 - engInnov / 900);
  const k = season === 2013 ? 1 : 1.1;

  const opts: DevOption[] = [];
  if (t.car.aero < 97)
    opts.push({ id: "dev-aero", name: "Aero Upgrade", cost: Math.round(6 * k), duration: dur(6), effect: 3, target: "aero", risk: risk * 1.1, description: "New front wing + floor. More downforce, still legal." });
  if (t.car.chassis < 95)
    opts.push({ id: "dev-chassis", name: "Chassis Upgrade", cost: Math.round(7 * k), duration: dur(7), effect: 3, target: "chassis", risk: risk * 1.2, description: "Revised suspension. Mechanical grip gains." });
  if (t.car.reliability < 97)
    opts.push({ id: "dev-rel", name: "Reliability Upgrade", cost: Math.round(4.5 * k), duration: dur(4), effect: 6, target: "reliability", risk: risk * 0.8, description: "Stronger seals and cooling. Fewer breakdowns." });
  if (t.car.gearboxPerf < 92)
    opts.push({ id: "dev-gb", name: "Gearbox Upgrade", cost: Math.round(5 * k), duration: dur(5), effect: 3, target: "gearbox", risk, description: "Lower internal drag. Better ratios." });
  opts.push({ id: "dev-pit", name: "Pit Crew Training", cost: Math.round(2.2 * k), duration: dur(2), effect: 3, target: "pitCrew", risk: 0.04, description: "Pit lane practice. Faster, safer stops." });
  for (const ds of t.drivers) {
    const drv = driverById(ds.driverId, state.season);
    if (drv && ds.form < 4)
      opts.push({
        id: `dev-train-${ds.driverId}`,
        name: `${drv.shortName} Training`,
        cost: Math.round(2 * k),
        duration: dur(3),
        effect: 2,
        target: "driverTraining",
        risk: 0.08,
        description: "Simulator miles + coaching.",
        driverId: ds.driverId,
      });
  }
  return opts;
}

export function startProject(draft: SimulationState, option: DevOption): boolean {
  const t = draft.team;
  if (!t || t.cash < option.cost) return false;
  t.cash = Math.round((t.cash - option.cost) * 100) / 100;
  t.upgrades.push({
    id: option.id,
    name: option.name,
    cost: option.cost,
    remainingRaces: option.duration,
    totalRaces: option.duration,
    target: option.target,
    effect: option.effect,
    driverId: option.driverId,
    risk: option.risk,
  });
  t.history.push({
    round: draft.completedRounds + 1,
    label: option.name,
    amount: -option.cost,
    category: "development",
    detail: `${option.name} — development project.\nCost $${option.cost}M paid up front.\nUpgrades land in ${option.duration} race(s).`,
  });
  return true;
}

export function advanceDevelopment(state: SimulationState) {
  const t = state.team;
  if (!t) return;
  const round = state.completedRounds + 1;
  for (const p of [...t.upgrades]) {
    p.remainingRaces--;
    if (p.remainingRaces > 0) continue;
    const under = Math.random() < p.risk;
    const gain = under ? Math.round(p.effect * 0.35) : p.effect;
    switch (p.target) {
      case "aero": t.car.aero = clamp(t.car.aero + gain, 30, 100); break;
      case "chassis": t.car.chassis = clamp(t.car.chassis + gain, 30, 100); break;
      case "reliability": t.car.reliability = clamp(t.car.reliability + gain, 30, 100); break;
      case "gearbox": t.car.gearboxPerf = clamp(t.car.gearboxPerf + gain, 30, 100); break;
      case "pitCrew": t.pitCrew = clamp(t.pitCrew + Math.round(gain * 2.5), 0, 100); break;
      case "driverTraining": {
        const ds = t.drivers.find((x) => x.driverId === p.driverId);
        if (ds) ds.form = clamp(ds.form + gain, -10, 10);
        break;
      }
    }
    state.news.unshift({
      id: `dev-${round}-${p.id}`,
      round,
      tag: "info",
      priority: (under ? "warning" : "info") satisfies NewsPriority,
      title: `${p.name} complete${under ? " — underperformed" : ""}`,
      body: under
        ? `Poor correlation in the wind tunnel/sim: the ${p.name} delivered only +${gain} of the expected +${p.effect}. The rest of the budget didn't translate.`
        : `${p.name} is on the car and working: +${gain} to ${p.target === "pitCrew" ? "pit crew" : p.target === "driverTraining" ? "driver form" : p.target}.`,
      bodyEnjoyer: under
        ? `The upgrade arrived but it's not quite right. Partial gains only.`
        : `The upgrade is on the car and it's real.`,
    });
    t.upgrades = t.upgrades.filter((u) => u.id !== p.id);
  }
}

/** Every N races opens a development window (spec §43). */
export function isDevWindow(state: SimulationState): boolean {
  const interval = Math.max(3, Math.round(state.calendar.length / 4));
  return state.completedRounds > 0 && state.completedRounds % interval === 0;
}

// ---------------------------------------------------------------------------
// Paddock news (spec §45)

export function generatePaddockNews(state: SimulationState, rng: Rng) {
  const t = state.team;
  if (!t) return;
  const round = state.completedRounds + 1;
  const roll = rng();
  if (roll < 0.3) {
    const cost = state.season === 2013 ? 4.5 : 6.5;
    state.news.unshift({
      id: `supplier-${round}`,
      round,
      tag: "supplier",
      priority: "warning" satisfies NewsPriority,
      title: "Engine supplier offers an upgrade",
      body: `ACTION AVAILABLE: ${engineById(t.engineId)?.supplier ?? "Your engine maker"} offers an energy-recovery upgrade for $${cost}M — +3 power, +2 reliability for the rest of the season. Offer expires when you respond.`,
      bodyEnjoyer: `Your engine maker has a faster, sturdier spec ready — $${cost}M.`,
      options: [
        { label: `Purchase ($${cost}M)`, action: "engineUpgrade" },
        { label: "Decline", action: "dismiss" },
      ],
    });
  } else if (roll < 0.48) {
    state.news.unshift({
      id: `rival-${round}`,
      round,
      tag: "rival",
      priority: "warning" satisfies NewsPriority,
      title: "Rival development warning",
      body: `Several midfield teams are filing new floor revisions this week. If your development pace stalls they will close the gap — consider starting an upgrade at the next development window (Garage tab).`,
      bodyEnjoyer: "Everyone in the midfield is working on a big upgrade.",
      options: [{ label: "Open garage", action: "goto:garage" }],
    });
  } else if (roll < 0.62) {
    const other = [
      "Your reliability engineer was approached by a rival team.",
      "A sponsor manager is fielding calls about your contract terms.",
      "Driver market rumors: several contracts expire this season.",
    ][Math.floor(rng() * 3)];
    state.news.unshift({
      id: `paddock-${round}`,
      round,
      tag: "staff",
      priority: "info" satisfies NewsPriority,
      title: "Paddock whisper",
      body: `${other} Nothing official yet — keep an eye on the Market tab.`,
      bodyEnjoyer: "The paddock is gossiping. Nothing official yet.",
      options: [{ label: "Open market", action: "goto:market" }],
    });
  }
}

// ---------------------------------------------------------------------------
// Driver → owner conversations (mid-championship interactions)

interface ChatMood {
  quote: string;
  priority: NewsPriority;
}

function chatLine(mood: string, shortName: string, morale: number, frustration: number, rng: Rng): ChatMood {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  if (mood === "complain") {
    return {
      priority: "warning",
      quote: pick([
        `"I can't do this alone. The car is miles off and nobody in the garage seems bothered." — ${shortName} is frustrated (frustration ${frustration}).`,
        `"We keep losing out in the stops. Either the crew steps up or I stop risking my neck every lap." — ${shortName} (frustration ${frustration}).`,
        `"My strategy calls have been a joke lately. I need answers, not apologies." — ${shortName} wants change (frustration ${frustration}).`,
      ]),
    };
  }
  if (mood === "praise") {
    return {
      priority: "info",
      quote: pick([
        `"Best car I've driven here. Whatever you're doing upstairs — keep going." — ${shortName} is happy (morale ${morale}).`,
        `"The team believes in itself again. You can feel it in the garage." — ${shortName} (morale ${morale}).`,
        `"Pit wall's been sharp lately. That's on leadership." — ${shortName}, impressed (morale ${morale}).`,
      ]),
    };
  }
  if (mood === "joke") {
    return {
      priority: "info",
      quote: pick([
        `"If we finish P4 again I'm charging you for my chiropractor." — ${shortName}, joking (morale ${morale}).`,
        `"My engineer promised me a sandwich if I beat the teammate. Hold him to it." — ${shortName} (morale ${morale}).`,
        `"The new floor is so slippery I nearly signed it 'the steward'." — ${shortName}, laughing (morale ${morale}).`,
      ]),
    };
  }
  return {
    priority: "info",
    quote: pick([
      `"Honest feedback: qualifying pace is there, race pace isn't. We need to look at tire management." — ${shortName}.`,
      `"I think one more development push and we're regularly in the points." — ${shortName} (morale ${morale}).`,
      `"Communication between me and the pit wall could be better on strategy calls." — ${shortName} (morale ${morale}).`,
    ]),
  };
}

/** After some weekends a driver asks the owner for a word — respond in Team Management. */
export function generateDriverChat(state: SimulationState, rng: Rng) {
  const t = state.team;
  if (!t || t.drivers.length === 0) return;
  if (state.completedRounds === 0 || rng() > 0.42) return;
  const round = state.completedRounds + 1;

  // unhappy drivers speak up more often
  const pool: typeof t.drivers = [];
  for (const ds of t.drivers) {
    const weight = ds.frustration >= 55 ? 3 : ds.morale <= 40 ? 2 : 1;
    for (let i = 0; i < weight; i++) pool.push(ds);
  }
  const ds = pool[Math.floor(rng() * pool.length)];
  const d = driverById(ds.driverId, state.season);
  if (!d) return;

  let mood = "feedback";
  if (ds.frustration >= 55) mood = "complain";
  else if (ds.morale >= 70 && ds.confidence >= 60) mood = rng() < 0.5 ? "praise" : "joke";
  const { quote, priority } = chatLine(mood, d.shortName, ds.morale, ds.frustration, rng);

  state.news.unshift({
    id: `chat-${round}-${ds.driverId}`,
    round,
    tag: "driver",
    kind: "chat",
    priority,
    title: `${d.shortName} wants a word`,
    body: quote,
    bodyEnjoyer: quote,
    options: [
      { label: "Back him publicly", action: "chat-support", payload: ds.driverId },
      { label: "Promise upgrades", action: "chat-promise", payload: ds.driverId },
      { label: "Tough love", action: "chat-tough", payload: ds.driverId },
    ],
  });
}

export function applyChatResponse(state: SimulationState, driverId: string, response: string): string | null {
  const t = state.team;
  if (!t) return null;
  const ds = t.drivers.find((x) => x.driverId === driverId);
  if (!ds) return null;
  switch (response) {
    case "chat-support":
      ds.morale = clamp(ds.morale + 6, 0, 100);
      ds.confidence = clamp(ds.confidence + 3, 0, 100);
      return "Public backing delivered.";
    case "chat-promise":
      ds.morale = clamp(ds.morale + 4, 0, 100);
      ds.confidence = clamp(ds.confidence + 2, 0, 100);
      ds.frustration = clamp(ds.frustration + 2, 0, 100); // promises add pressure
      return "Upgrade promise made — expectations rise.";
    case "chat-tough":
      ds.frustration = clamp(ds.frustration - 8, 0, 100);
      ds.morale = clamp(ds.morale - 3, 0, 100);
      ds.confidence = clamp(ds.confidence + 2, 0, 100);
      return "Tough love. Frustration drops, mood dips.";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Bankruptcy (spec §50)

export function bankruptcyCheck(state: SimulationState): SimulationState {
  const t = state.team;
  if (!t) return state;
  if (t.cash >= -8) return state;
  const diff = DIFFICULTIES.find((d) => d.id === state.difficulty) ?? DIFFICULTIES[1];
  const round = state.completedRounds + 1;

  if (diff.bankruptcyGrace && !state.bankrupt) {
    state.bankrupt = true;
    t.cash = Math.round((t.cash + 25) * 100) / 100;
    t.reputation = Math.max(0, t.reputation - 20);
    t.history.push({
      round,
      label: "Emergency bank guarantee",
      amount: 25,
      category: "other",
      detail: "One-time rescue injection of $25M from your bankers.\nReputation −20.",
    });
    state.news.unshift({
      id: `grace-${round}`,
      round,
      tag: "breaking",
      priority: "urgent" satisfies NewsPriority,
      title: "BANK GUARANTEE ACTIVATED",
      body: `URGENT: cash fell below −$8M after round ${round}. The bank stepped in once: +$25M, reputation -20. There will be no second rescue — cut costs or the team collapses.`,
      bodyEnjoyer: "Your bankers bailed you out with $25M. They won't do it again.",
      options: [{ label: "Open finance", action: "goto:finance" }],
    });
  } else {
    state.phase = "bankrupt";
    state.news.unshift({
      id: `collapse-${round}`,
      round,
      tag: "breaking",
      priority: "urgent" satisfies NewsPriority,
      title: "TEAM COLLAPSE",
      body: `URGENT: you could no longer finance the operation at round ${round}. Creditors move in — season terminated.`,
      bodyEnjoyer: "The money ran out. The season is over.",
    });
  }
  return state;
}