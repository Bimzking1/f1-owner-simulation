// ============================================================================
// F1 Owner — Season report → shareable PNG (canvas, no deps)
// Two formats: portrait 9:16 (1080×1920) and landscape 16:9 (1920×1080).
// ============================================================================

import type { SimulationState } from "@/simulation/types";
import { constructorById, driverById } from "@/data";
import { difficultyOf } from "@/state";

type Ratio = "portrait" | "landscape";

const C = {
  bg: "#0B0F15",
  panel: "#12161E",
  panel2: "#18202B",
  line: "#242C39",
  ink: "#F0F2F5",
  muted: "#93A0B2",
  faint: "#5C6673",
  red: "#FF4A2E",
  cyan: "#29D3FF",
  green: "#3DDC84",
  yellow: "#FFC93C",
  purple: "#B14EFF",
};

const MONO = '"IBM Plex Mono", Consolas, monospace';
const DISP = '"Rajdhani", "Segoe UI", Arial, sans-serif';
const BODY = '"Inter", "Segoe UI", Arial, sans-serif';

function money(v: number): string {
  return `${v >= 0 ? "+" : "-"}$${Math.abs(Math.round(v * 100) / 100)}M`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  opts: { weight?: number; font?: string; align?: CanvasTextAlign } = {},
) {
  ctx.font = `${opts.weight ?? 600} ${size}px ${opts.font ?? DISP}`;
  ctx.fillStyle = color;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function statCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  valueColor: string,
) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = C.panel;
  ctx.fill();
  fillText(ctx, label.toUpperCase(), x + 18, y + 26, 17, C.faint, { weight: 600, font: BODY });
  fillText(ctx, value, x + 18, y + h - 16, 30, valueColor, { weight: 700 });
}

interface StandRow {
  name: string;
  pts: number;
  highlight?: boolean;
}

function standingsTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  rows: StandRow[],
  rowH: number,
  accent: string,
) {
  const labelW = 46;
  const ptsW = 70;
  return rows.map((r, i) => {
    const ry = y + i * rowH;
    roundRect(ctx, x, ry, w, rowH - 6, 8);
    ctx.fillStyle = r.highlight ? "rgba(255,74,46,0.10)" : i % 2 === 0 ? C.panel : C.panel2;
    ctx.fill();
    if (r.highlight) {
      roundRect(ctx, x, ry, 4, rowH - 6, 2);
      ctx.fillStyle = accent;
      ctx.fill();
    }
    fillText(ctx, String(i + 1), x + 16, ry + rowH - 16, 17, r.highlight ? accent : C.faint, { font: MONO, weight: 500 });
    const name = r.name.length > 24 ? `${r.name.slice(0, 23)}…` : r.name;
    fillText(ctx, name, x + labelW, ry + rowH - 16, 19, r.highlight ? C.ink : C.muted, { font: BODY, weight: r.highlight ? 700 : 500 });
    fillText(ctx, String(r.pts), x + w - ptsW, ry + rowH - 16, 19, r.highlight ? C.ink : C.muted, { font: MONO, weight: 600, align: "right" });
    return ry + rowH;
  });
}

export function exportReportImage(state: SimulationState, ratio: Ratio) {
  const t = state.team;
  if (!t) return;
  const ctor = constructorById(t.constructorId, state.season);
  const accent = ctor?.colors.primary ?? C.red;
  const w = ratio === "portrait" ? 1080 : 1920;
  const h = ratio === "portrait" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawReport(ctx, w, h, state, accent, ratio);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `f1-owner-report-${ratio === "portrait" ? "9x16" : "16x9"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function drawReport(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: SimulationState,
  accent: string,
  ratio: Ratio,
) {
  const t = state.team!;
  const diff = difficultyOf(state);
  const pos = state.standingsConstructors.findIndex((c) => c.teamId === t.constructorId) + 1;
  const income = t.history.reduce((a, x) => a + Math.max(0, x.amount), 0);
  const spend = t.history.reduce((a, x) => a + Math.min(0, x.amount), 0);
  const net = income + spend;
  const prize = [...t.history].reverse().find((x) => x.label.includes("prize money"))?.amount ?? 0;
  const myStandings = state.standingsDrivers
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.driverId === t.driver1Id || s.driverId === t.driver2Id);

  const wccRows: StandRow[] = state.standingsConstructors.map((s) => ({
    name: constructorById(s.teamId, state.season)?.name ?? s.teamId,
    pts: s.points,
    highlight: s.teamId === t.constructorId,
  }));
  const wdcRows: StandRow[] = state.standingsDrivers.map((s) => ({
    name: driverById(s.driverId)?.name ?? s.driverId,
    pts: s.points,
    highlight: s.driverId === t.driver1Id || s.driverId === t.driver2Id,
  }));
  const teamName = ctor(state)?.name ?? t.constructorId;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, ratio === "portrait" ? 14 : 16);

  if (ratio === "portrait") return drawPortrait(ctx, state, accent, pos, income, spend, net, prize, wccRows, wdcRows, teamName, myStandings, diff.label);
  return drawLandscape(ctx, state, accent, pos, income, spend, net, prize, wccRows, wdcRows, teamName, myStandings, diff.label);
}

function ctor(state: SimulationState) {
  return constructorById(state.team!.constructorId, state.season);
}

function headerMeta(state: SimulationState): string {
  const d = difficultyOf(state);
  return `SEASON ${state.season} · ${d.label.toUpperCase()} · SEED ${state.seed}`;
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  state: SimulationState,
  accent: string,
  pos: number,
  income: number,
  spend: number,
  net: number,
  prize: number,
  wccRows: StandRow[],
  wdcRows: StandRow[],
  teamName: string,
  myStandings: { s: { driverId: string; points: number; dnfs: number }; i: number }[],
  diffLabel: string,
) {
  const W = 1080;
  const H = 1920;
  const t = state.team!;
  const pad = 60;
  void income;
  void spend;

  fillText(ctx, "F1 OWNER — FINAL REPORT", pad, 72, 26, C.faint, { weight: 600, font: BODY });
  fillText(ctx, `SEASON ${state.season}`, W - pad, 72, 26, C.faint, { weight: 600, font: BODY, align: "right" });
  ctx.textAlign = "left";

  fillText(ctx, `WCC P${pos}`, pad, 192, 128, C.ink, { weight: 700 });
  {
    const pw = ctx.measureText(`WCC P${pos}`).width;
    fillText(ctx, ".", pad + pw - 8, 220, 128, accent, { weight: 700 });
  }
  fillText(ctx, teamName.toUpperCase(), pad, 268, 46, C.ink, { weight: 700 });
  fillText(ctx, `SEASON ${state.season} · ${diffLabel.toUpperCase()} · SEED ${state.seed}`, pad, 308, 22, C.faint, { font: MONO, weight: 500 });

  const stats: [string, string, string][] = [
    ["Points", `${t.points}`, C.ink],
    ["Wins", `${t.wins}`, C.green],
    ["Podiums", `${t.podiums}`, C.green],
    ["DNFs", `${t.dnfs}`, C.red],
    ["Reputation", `${t.reputation}`, C.cyan],
    ["Cash", money(t.cash), C.green],
  ];
  const cardW = (W - pad * 2 - 24) / 3;
  const cardH = 96;
  stats.forEach(([label, value, color], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    statCard(ctx, pad + col * (cardW + 12), 344 + row * (cardH + 12), cardW, cardH, label, value, color);
  });

  const rewardY = 344 + 2 * (cardH + 12) + 16;
  roundRect(ctx, pad, rewardY, cardW, 90, 10);
  ctx.fillStyle = C.panel;
  ctx.fill();
  fillText(ctx, `PRIZE MONEY · WCC P${pos}`, pad + 18, rewardY + 28, 17, C.faint, { font: BODY, weight: 600 });
  fillText(ctx, money(prize), pad + 18, rewardY + 74, 30, C.yellow, { weight: 700 });
  roundRect(ctx, pad + cardW + 12, rewardY, cardW * 2 + 12, 90, 10);
  ctx.fillStyle = C.panel;
  ctx.fill();
  fillText(ctx, "TEAM", pad + cardW + 30, rewardY + 28, 17, C.faint, { font: BODY, weight: 600 });
  const l2w = ctx.measureText(teamName).width;
  fillText(ctx, teamName, pad + cardW + 30, rewardY + 74, 26, C.ink, { weight: 700 });
  fillText(ctx, `NET ${money(net)}`, pad + cardW + 30 + l2w + 28, rewardY + 74, 26, net >= 0 ? C.green : C.red, { weight: 700 });

  const tableTop = rewardY + 96 + 34;
  fillText(ctx, "CONSTRUCTORS CHAMPIONSHIP", pad, tableTop, 24, C.muted, { weight: 700 });
  standingsTable(ctx, pad, tableTop + 40, W - pad * 2, wccRows.slice(0, 10), 46, accent);

  const wdcTop = tableTop + 40 + 10 * 46 + 44;
  fillText(ctx, "DRIVERS CHAMPIONSHIP", pad, wdcTop, 24, C.muted, { weight: 700 });
  standingsTable(ctx, pad, wdcTop + 40, W - pad * 2, wdcRows.slice(0, 10), 42, accent);

  const driverTop = wdcTop + 40 + 10 * 42 + 34;
  fillText(ctx, "YOUR DRIVERS", pad, driverTop, 24, C.muted, { weight: 700 });
  myStandings.forEach(({ s, i }, idx) => {
    const d = driverById(s.driverId);
    const dx = pad + idx * ((W - pad * 2 - 16) / 2 + 8);
    const dw = (W - pad * 2 - 16) / 2;
    roundRect(ctx, dx, driverTop + 40, dw, 78, 10);
    ctx.fillStyle = C.panel;
    ctx.fill();
    fillText(ctx, `P${i + 1}`, dx + 18, driverTop + 96, 26, i === 0 ? C.green : C.muted, { font: MONO, weight: 700 });
    fillText(ctx, d?.name ?? s.driverId, dx + 70, driverTop + 89, 22, C.ink, { weight: 700 });
    fillText(ctx, `${s.points} pts · ${s.dnfs} DNF`, dx + 70, driverTop + 110, 16, C.faint, { font: BODY, weight: 500 });
  });

  fillText(ctx, "F1 OWNER — SEASON REPORT", W / 2, H - 36, 20, C.faint, { weight: 600, font: BODY, align: "center" });
  ctx.textAlign = "left";
}

function drawLandscape(
  ctx: CanvasRenderingContext2D,
  state: SimulationState,
  accent: string,
  pos: number,
  income: number,
  spend: number,
  net: number,
  prize: number,
  wccRows: StandRow[],
  wdcRows: StandRow[],
  teamName: string,
  myStandings: { s: { driverId: string; points: number; dnfs: number }; i: number }[],
  diffLabel: string,
) {
  const W = 1920;
  const H = 1080;
  const t = state.team!;
  const pad = 64;
  void myStandings;
  void diffLabel;

  fillText(ctx, "F1 OWNER — FINAL REPORT", pad, 66, 26, C.faint, { weight: 600, font: BODY });
  fillText(ctx, `WCC P${pos}`, pad, 208, 118, C.ink, { weight: 700 });
  {
    const pw = ctx.measureText(`WCC P${pos}`).width;
    fillText(ctx, ".", pad + pw - 8, 236, 118, accent, { weight: 700 });
  }
  fillText(ctx, teamName.toUpperCase(), pad, 282, 44, C.ink, { weight: 700 });
  fillText(ctx, headerMeta(state), pad, 322, 20, C.faint, { font: MONO, weight: 500 });

  const stats: [string, string, string][] = [
    ["Points", `${t.points}`, C.ink],
    ["Wins", `${t.wins}`, C.green],
    ["Podiums", `${t.podiums}`, C.green],
    ["DNFs", `${t.dnfs}`, C.red],
    ["Reputation", `${t.reputation}`, C.cyan],
    ["Cash", money(t.cash), C.green],
  ];
  const cardW = 300;
  const cardH = 92;
  stats.forEach(([label, value, color], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    statCard(ctx, pad + col * (cardW + 14), 370 + row * (cardH + 12), cardW, cardH, label, value, color);
  });

  roundRect(ctx, pad, 664, cardW * 2 + 14, 96, 10);
  ctx.fillStyle = C.panel;
  ctx.fill();
  fillText(ctx, `PRIZE MONEY · WCC P${pos}`, pad + 18, 692, 17, C.faint, { font: BODY, weight: 600 });
  fillText(ctx, money(prize), pad + 18, 740, 30, C.yellow, { weight: 700 });
  fillText(ctx, `NET FLOW ${money(net)}`, pad + cardW + 32, 740, 26, net >= 0 ? C.green : C.red, { weight: 700 });
  fillText(ctx, `INCOME ${money(income)}  ·  SPEND ${money(spend)}`, pad + cardW + 32, 692, 17, C.faint, { font: BODY, weight: 600 });

  const tablesX = 820;
  const tablesW = W - tablesX - pad;
  const colW = (tablesW - 24) / 2;
  fillText(ctx, "CLASSIFICATION", tablesX, 70, 24, C.muted, { weight: 700 });
  fillText(ctx, "CONSTRUCTORS", tablesX, 118, 18, C.faint, { font: BODY, weight: 600 });
  fillText(ctx, "DRIVERS", tablesX + colW + 24, 118, 18, C.faint, { font: BODY, weight: 600 });
  standingsTable(ctx, tablesX, 136, colW, wccRows.slice(0, 10), 44, accent);
  standingsTable(ctx, tablesX + colW + 24, 136, colW, wdcRows.slice(0, 10), 44, accent);

  fillText(ctx, `F1 OWNER — SEASON REPORT · SEED ${state.seed}`, W / 2, H - 34, 20, C.faint, { weight: 600, font: BODY, align: "center" });
  ctx.textAlign = "left";
}