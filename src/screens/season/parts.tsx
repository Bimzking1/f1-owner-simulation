import type { SimulationState, Track } from "@/simulation/types";
import { constructorById, driverById, trackById } from "@/data";
import { Card, Img, Meter, Tag } from "@/ui/kit";
import { ratingTone, type KitTone } from "@/ui/ratings";
import { driverImage } from "@/data/assets";

export type Act = (fn: (s: SimulationState) => string) => void;

export function MiniBar({ label, value, tone }: { label: string; value: number; tone?: KitTone }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-9 text-ink-faint">{label}</span>
      <Meter value={value} tone={tone ?? ratingTone(value)} />
      <span className={`w-6 text-right tabular ${tone ? "text-ink-faint" : ratingText(value)}`}>{Math.round(value)}</span>
    </div>
  );
}

function ratingText(v: number): string {
  if (v >= 80) return "text-azure";
  if (v >= 60) return "text-positive";
  if (v >= 40) return "text-caution";
  return "text-signal";
}

function attendanceFor(track: Track): number {
  const c = track.characteristics;
  const raw =
    35000 +
    c.overtaking * 180 +
    c.driverImportance * 220 +
    c.technical * 100 +
    c.highSpeed * 90 +
    c.tireStress * 60;
  return Math.round(raw / 1000) * 1000;
}

export function NextRaceCard({ track, round }: { track: Track; round?: number }) {
  const weatherNote =
    track.characteristics.weatherRisk > 65
      ? "High weather risk — strategy will matter."
      : track.characteristics.weatherRisk > 40
        ? "Some weather risk."
        : "Low weather risk.";
  const distanceKm = track.laps * track.lengthKm;
  return (
    <Card title={`Next up — R${round ?? "?"} · ${track.grandPrix}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl font-bold">{track.name}</div>
          <div className="text-xs text-ink-faint">
            {track.country} · {track.laps} laps · {track.lengthKm.toFixed(3)} km{" "}
            {track.sprint && <Tag tone="elite">Sprint</Tag>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-faint">
            <span>Race distance {distanceKm.toFixed(0)} km</span>
            <span>~{attendanceFor(track).toLocaleString()} attendance</span>
            <span>
              Weather:{" "}
              <span className={ratingText(track.characteristics.weatherRisk)}>
                {track.characteristics.weatherRisk}% risk
              </span>
            </span>
          </div>
          <div className="mt-2 text-xs text-ink-soft">{weatherNote}</div>
          <div className="mt-3 grid max-w-sm grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-ink-faint">
            {[
              ["Downforce", track.characteristics.downforce],
              ["High speed", track.characteristics.highSpeed],
              ["Low speed", track.characteristics.lowSpeed],
              ["Tire stress", track.characteristics.tireStress],
              ["Overtaking", track.characteristics.overtaking],
              ["Technical", track.characteristics.technical],
            ].map(([label, value]) => (
              <span key={label} className="flex items-center justify-between gap-2 border-b border-hairline/40 pb-0.5">
                <span>{label}</span>
                <span className="tabular">{value}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="w-full shrink-0 md:w-auto">
          <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-sm bg-white p-2 md:h-44 md:w-auto">
            <Img
              src={track.image}
              alt={`${track.name} circuit layout`}
              fallback={<span className="text-[10px] text-ink-faint">Layout</span>}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="mt-1 text-center text-[10px] uppercase tracking-widest text-ink-faint">
            R{round ?? "?"} circuit map
          </div>
        </div>
      </div>
    </Card>
  );
}

export function StandingsCard({ state, rows }: { state: SimulationState; rows?: number }) {
  const t = state.team!;
  const teams = rows ? state.standingsConstructors.slice(0, rows) : state.standingsConstructors;
  const drivers = rows ? state.standingsDrivers.slice(0, rows) : state.standingsDrivers;
  return (
    <Card title="Championship" right={<Tag tone="telemetry">WCC / WDC · full grid</Tag>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="max-h-96 divide-y divide-hairline/60 overflow-auto pr-3 [scrollbar-gutter:stable]">
          {teams.map((s, i) => (
            <div key={s.teamId} className={`flex items-center gap-2 py-1 text-sm ${s.teamId === t.constructorId ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="w-5 tabular text-ink-faint">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{constructorById(s.teamId, state.season)?.name ?? s.teamId}</span>
              <span className="tabular">{s.points}</span>
            </div>
          ))}
        </div>
        <div className="max-h-96 divide-y divide-hairline/60 overflow-auto pr-3 [scrollbar-gutter:stable]">
          {drivers.map((s, i) => {
            const mine = s.driverId === t.driver1Id || s.driverId === t.driver2Id;
            return (
              <div key={s.driverId} className={`flex items-center gap-2 py-1 text-sm ${mine ? "font-semibold text-ink" : "text-ink-soft"}`}>
                <span className="w-5 tabular text-ink-faint">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{driverById(s.driverId, state.season)?.shortName ?? s.driverId}</span>
                <span className="tabular">{s.points}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export function TrackName({ id }: { id: string }) {
  return <span>{trackById(id)?.grandPrix ?? id}</span>;
}

export function DriverChip({ driverId, size = 24, season }: { driverId: string; size?: number; season?: number }) {
  const d = driverById(driverId, season);
  if (!d) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <Img src={driverImage(d.id, season)} alt={d.shortName} className="rounded-sm object-cover" style={{ width: size, height: size }} />
      <span>{d.shortName}</span>
    </span>
  );
}