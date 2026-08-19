import { ReactNode } from "react";

type BadgeTone = "neutral" | "elite" | "telemetry" | "caution" | "signal" | "positive";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-hairline/60 text-ink-soft",
  elite: "bg-elite/15 text-elite",
  telemetry: "bg-telemetry/15 text-telemetry",
  caution: "bg-caution/15 text-caution",
  signal: "bg-signal/15 text-signal",
  positive: "bg-positive/15 text-positive",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
