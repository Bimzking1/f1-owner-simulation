import { ReactNode } from "react";

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{children}</main>;
}

export function StickyAction({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-hairline bg-void/95 backdrop-blur px-4 py-3 sm:hidden">
      {children}
    </div>
  );
}
