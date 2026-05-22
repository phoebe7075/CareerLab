import type { ReactNode } from "react";

type TopbarProps = {
  actions?: ReactNode;
  title: string;
};

export function Topbar({ actions, title }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur max-lg:static max-sm:px-4">
      <div className="min-w-0">
        <h2 className="truncate text-xl font-semibold text-zinc-950">{title}</h2>
      </div>

      {actions ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
