import type { OverclaimSignal } from "../lib/overclaimDetector";
import { Badge } from "../ui/Badge";

type OverclaimSignalListProps = {
  emptyLabel: string;
  signals: OverclaimSignal[];
};

export function OverclaimSignalList({
  emptyLabel,
  signals
}: OverclaimSignalListProps) {
  if (signals.length === 0) {
    return <p className="text-sm leading-6 text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {signals.map((signal) => (
        <li
          className="rounded-md border border-zinc-200 bg-white p-3"
          key={signal.id}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={signal.severity === "danger" ? "danger" : "warning"}>
              {signal.label}
            </Badge>
            <span className="break-words text-xs text-zinc-500">
              {signal.evidence}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            {signal.message}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {signal.suggestion}
          </p>
        </li>
      ))}
    </ul>
  );
}
