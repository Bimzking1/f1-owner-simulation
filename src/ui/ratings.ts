// ============================================================================
// F1 Owner — rating → color helpers (blue high, green, yellow, red low).
// ============================================================================

export type RatingTone = "azure" | "positive" | "caution" | "signal";
export type KitTone = RatingTone | "telemetry" | "elite";

export function ratingTone(v: number): RatingTone {
  if (v >= 80) return "azure";
  if (v >= 60) return "positive";
  if (v >= 40) return "caution";
  return "signal";
}

export function ratingTextClass(v: number): string {
  if (v >= 80) return "text-azure";
  if (v >= 60) return "text-positive";
  if (v >= 40) return "text-caution";
  return "text-signal";
}

/** OVR colors — light purple for top drivers, green mid, grey low. */
export function ovrClass(v: number): string {
  if (v >= 88) return "text-elite";
  if (v >= 75) return "text-positive";
  return "text-ink-faint";
}