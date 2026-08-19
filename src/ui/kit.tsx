import type { ReactNode } from "react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Tiny UI kit for F1 Owner — all styling via tailwind theme tokens in index.css
// ---------------------------------------------------------------------------

export function Money({ value, className = "" }: { value: number; className?: string }) {
  const neg = value < 0;
  return (
    <span className={`tabular ${neg ? "text-caution" : ""} ${className}`}>
      {neg ? "-$" : "$"}
      {Math.abs(Math.round(value * 100) / 100).toFixed(value % 1 === 0 ? 0 : 1)}M
    </span>
  );
}

export function Tag({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "signal" | "telemetry" | "positive" | "caution" | "elite" }) {
  const tones: Record<string, string> = {
    ink: "bg-raised text-ink-soft border-hairline",
    signal: "bg-signal/15 text-signal border-signal/30",
    telemetry: "bg-telemetry/15 text-telemetry border-telemetry/30",
    positive: "bg-positive/15 text-positive border-positive/30",
    caution: "bg-caution/15 text-caution border-caution/30",
    elite: "bg-elite/15 text-elite border-elite/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Meter({ value, max = 100, tone = "telemetry", className = "" }: { value: number; max?: number; tone?: "signal" | "telemetry" | "positive" | "caution" | "elite"; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones: Record<string, string> = {
    signal: "bg-signal",
    telemetry: "bg-telemetry",
    positive: "bg-positive",
    caution: "bg-caution",
    elite: "bg-elite",
  };
  return (
    <div className={`h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-raised ${className}`}>
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Bar({ label, value, tone, right, max = 100 }: { label: string; value: number; tone?: "signal" | "telemetry" | "positive" | "caution" | "elite"; right?: ReactNode; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-ink-soft">{label}</span>
      <Meter value={value} max={max} tone={tone} />
      <span className="w-8 shrink-0 text-right text-xs tabular text-ink-soft">{right ?? Math.round(value)}</span>
    </div>
  );
}

export function Card({ title, right, children, className = "", pad = true }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-md border border-hairline bg-surface/70 ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-ink-soft">{title}</h3>
          {right}
        </header>
      )}
      <div className={pad ? "p-3" : ""}>{children}</div>
    </section>
  );
}

export function Button({ children, onClick, variant = "primary", disabled, className = "", small }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "positive"; disabled?: boolean; className?: string; small?: boolean }) {
  const vars: Record<string, string> = {
    primary: "bg-signal text-white hover:bg-signal/80 border border-signal/60",
    ghost: "bg-raised text-ink-soft hover:text-ink hover:bg-raised/80 border border-hairline",
    danger: "bg-transparent text-caution border border-caution/40 hover:bg-caution/10",
    positive: "bg-positive/20 text-positive border border-positive/40 hover:bg-positive/30",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${small ? "px-2 py-1 text-[11px]" : "px-3.5 py-2 text-sm"} rounded-sm font-display font-bold uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-40 ${vars[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className={`max-h-[88vh] w-full ${wide ? "max-w-4xl" : "max-w-2xl"} overflow-auto rounded-md border border-hairline bg-surface shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-void px-4 py-3">
            <h3 className="font-display text-base font-bold uppercase tracking-widest">{title}</h3>
            <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink">✕</button>
          </header>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Img({ src, alt, className = "", fallback, style }: { src: string; alt: string; className?: string; fallback?: ReactNode; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-raised ${className}`} style={style} aria-label={alt}>
        {fallback ?? <span className="font-display text-lg font-bold text-ink-faint">{alt.slice(0, 2).toUpperCase()}</span>}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setFailed(true)} loading="lazy" />;
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "signal" | "positive" | "caution" }) {
  const toneCls = tone === "signal" ? "text-signal" : tone === "positive" ? "text-positive" : tone === "caution" ? "text-caution" : "text-ink";
  return (
    <div className="rounded-md border border-hairline bg-raised/60 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">{label}</div>
      <div className={`font-display text-lg font-bold tabular ${toneCls}`}>{value}</div>
      {sub && <div className="text-[11px] text-ink-faint">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-hairline p-6 text-center text-sm text-ink-faint">{children}</div>;
}