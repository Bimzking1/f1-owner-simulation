import { useUI } from "@/context/ThemeContext";
import { metricLabel, metricDisplay, tierColor } from "@/lib/geekText";

interface TelemetryStatProps {
  geekLabel: string;
  enjoyerLabel: string;
  value: number;
  max?: number;
  emphasis?: "elite" | "telemetry" | "caution" | "signal" | "positive" | "neutral";
}

/**
 * Signature element: mimics an F1 timing-tower readout — mono numerals,
 * a coloured left rail, and a thin fill bar underneath. Reused everywhere
 * a rating/metric appears so every screen reads as one instrument panel.
 */
export function TelemetryStat({
  geekLabel,
  enjoyerLabel,
  value,
  max = 100,
  emphasis,
}: TelemetryStatProps) {
  const { geekMode } = useUI();
  const railColor =
    emphasis === "elite"
      ? "bg-elite"
      : emphasis === "telemetry"
      ? "bg-telemetry"
      : emphasis === "caution"
      ? "bg-caution"
      : emphasis === "signal"
      ? "bg-signal"
      : emphasis === "positive"
      ? "bg-positive"
      : "bg-hairline";
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`h-full w-[3px] self-stretch rounded-full ${railColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-body text-[11px] uppercase tracking-wider text-ink-soft truncate">
            {metricLabel(geekMode, geekLabel, enjoyerLabel)}
          </span>
          <span
            className={`font-mono text-sm tabular ${tierColor(value)} ${
              geekMode === "enjoyer" ? "text-xs uppercase tracking-wide" : ""
            }`}
          >
            {metricDisplay(geekMode, value)}
          </span>
        </div>
        <div className="mt-1 h-1 w-full rounded-full bg-hairline overflow-hidden">
          <div
            className={`h-full rounded-full ${railColor} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
