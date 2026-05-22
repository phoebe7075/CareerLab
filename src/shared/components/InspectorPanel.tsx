import type { ReactNode } from "react";

import { Badge } from "../ui/Badge";

type InspectorPanelProps = {
  children: ReactNode;
  title: string;
};

type InspectorMetricProps = {
  label: string;
  value: ReactNode;
};

type InspectorTagListProps = {
  emptyLabel: string;
  labels: string[];
};

export function InspectorPanel({ children, title }: InspectorPanelProps) {
  return (
    <aside className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </aside>
  );
}

export function InspectorSection({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="border-t border-zinc-100 pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase text-zinc-500">{title}</h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function InspectorMetric({ label, value }: InspectorMetricProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-zinc-600">{label}</span>
      <span className="text-right font-medium text-zinc-950">{value}</span>
    </div>
  );
}

export function InspectorTagList({ emptyLabel, labels }: InspectorTagListProps) {
  if (labels.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <Badge key={label} tone="neutral">
          {label}
        </Badge>
      ))}
    </div>
  );
}
