import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  fullWidth,
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "font-display font-semibold uppercase tracking-wide text-sm px-5 py-3 rounded-lg transition-colors";
  const variants: Record<string, string> = {
    primary: "bg-signal text-white hover:bg-signal/90",
    secondary: "bg-raised border border-hairline text-ink hover:border-ink-faint",
    ghost: "text-ink-soft hover:text-ink",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
