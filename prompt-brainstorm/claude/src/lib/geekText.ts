// Core Geek/Enjoyer translation layer (spec §6).
// Same underlying numeric data powers both — this just changes presentation.

export function tierWord(value: number): string {
  if (value >= 93) return "Elite";
  if (value >= 84) return "Excellent";
  if (value >= 74) return "Very good";
  if (value >= 64) return "Good";
  if (value >= 50) return "Average";
  if (value >= 35) return "Weak";
  return "Poor";
}

export function tierColor(value: number): string {
  if (value >= 93) return "text-elite";
  if (value >= 84) return "text-positive";
  if (value >= 64) return "text-telemetry";
  if (value >= 50) return "text-ink-soft";
  return "text-signal";
}

/**
 * Renders a metric label depending on Geek/Enjoyer mode.
 * geekLabel: the raw technical term ("Aerodynamics", "Mechanical Grip")
 * enjoyerLabel: the plain-English framing ("Fast corners", "Straight-line speed")
 */
export function metricLabel(
  mode: "geek" | "enjoyer",
  geekLabel: string,
  enjoyerLabel: string
): string {
  return mode === "geek" ? geekLabel : enjoyerLabel;
}

export function metricDisplay(
  mode: "geek" | "enjoyer",
  value: number
): string {
  return mode === "geek" ? String(value) : tierWord(value);
}
