import type { SimulationState, Track } from "@/simulation/types";
import { constructorById, driverById, trackById } from "@/data";
import { Card, Img, Meter, Tag } from "@/ui/kit";
import { driverImage } from "@/data/assets";

export type Act = (fn: (s: SimulationState) => string) => void;

export function MiniBar({ label, value, tone }: { label: string; value: number; tone?: "signal" | "telemetry" | "positive" | "caution" | "elite" }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-9 text-ink-faint">{label}</span>
      <Meter value={value} tone={tone} />
      <span className="w-6 text-right tabular text-ink-faint">{Math.round(value)}</span>
    </div>
  );
}

export function NextRaceCard({ track }: { track: Track }) {
  const weatherNote =
    track.characteristics.weatherRisk > 65
      ? "High weather risk — strategy will matter."
      : track.characteristics.weatherRisk > 40
        ? "Some weather risk."
        : "Low weather risk.";
  return (
    <Card title={`Next up — ${track.grandPrix}`}>
      <div>
        <div className="font-display text-2xl font-bold">{track.name}</div>
        <div className="text-xs text-ink-faint">
          {track.country} · {track.laps} laps · {track.lengthKm.toFixed(3)} km{" "}
          {track.sprint && <Tag tone="elite">Sprint</Tag>}
        </div>
        <div className="mt-2 text-xs text-ink-soft">{weatherNote}</div>
        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-faint">
          <span>Downforce {track.characteristics.downforce}</span>
          <span>High speed {track.characteristics.highSpeed}</span>
          <span>Low speed {track.characteristics.lowSpeed}</span>
          <span>Tire stress {track.characteristics.tireStress}</span>
          <span>Overtaking {track.characteristics.overtaking}</span>
        </div>
      </div>
    </Card>
  );
}

export function StandingsCard({ state, rows = 10 }: { state: SimulationState; rows?: number }) {
  const t = state.team!;
  return (
    <Card title="Championship" right={<Tag tone="telemetry">WCC / WDC</Tag>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="divide-y divide-hairline/60">
          {state.standingsConstructors.slice(0, rows).map((s, i) => (
            <div key={s.teamId} className={`flex items-center gap-2 py-1 text-sm ${s.teamId === t.constructorId ? "font-semibold text-ink" : "text-ink-soft"}`}>
              <span className="w-5 tabular text-ink-faint">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{constructorById(s.teamId, state.season)?.name ?? s.teamId}</span>
              <span className="tabular">{s.points}</span>
            </div>
          ))}
        </div>
        <div className="divide-y divide-hairline/60">
          {state.standingsDrivers.slice(0, rows).map((s, i) => (
            <div key={s.driverId} className="flex items-center gap-2 py-1 text-sm text-ink-soft">
              <span className="w-5 tabular text-ink-faint">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{driverById(s.driverId, state.season)?.shortName ?? s.driverId}</span>
              <span className="tabular">{s.points}</span>
            </div>
          ))}
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