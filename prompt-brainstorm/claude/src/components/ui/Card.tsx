import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  raised?: boolean;
  selected?: boolean;
  interactive?: boolean;
}

export function Card({
  children,
  raised,
  selected,
  interactive,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-xl border ${
        selected ? "border-telemetry ring-1 ring-telemetry/40" : "border-hairline"
      } ${raised ? "bg-raised" : "bg-surface"} ${
        interactive ? "cursor-pointer transition-colors hover:border-ink-faint" : ""
      } p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint mb-1">
      {children}
    </div>
  );
}

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-2xl font-semibold uppercase tracking-wide text-ink ${className}`}>
      {children}
    </h2>
  );
}
