import { createTokenDiff, type TextDiffPart } from "../lib/diff";

type DiffViewerProps = {
  after: string;
  afterLabel?: string;
  before: string;
  beforeLabel?: string;
  diffText?: string;
};

export function DiffViewer({
  after,
  afterLabel = "현재 초안",
  before,
  beforeLabel = "기준 버전",
  diffText
}: DiffViewerProps) {
  const tokenDiff = createTokenDiff(before, after);
  const hasChanges = before !== after;
  const displayDiffText = diffText
    ?.replace(/^--- before$/m, `--- ${beforeLabel}`)
    .replace(/^\+\+\+ after$/m, `+++ ${afterLabel}`)
    .replace(/^No changes$/m, "기준 버전과 동일");

  return (
    <section className="min-w-0 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-950">버전 비교</h3>
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            hasChanges
              ? "bg-blue-600 text-white"
            : "bg-white text-zinc-500 ring-1 ring-zinc-200"
          }`}
        >
          {hasChanges ? "버전 대비 변경 있음" : "기준과 동일"}
        </span>
      </div>
      <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
        <TextBlock
          hiddenKind="added"
          label={beforeLabel}
          parts={tokenDiff}
          text={before}
        />
        <TextBlock
          hiddenKind="removed"
          label={afterLabel}
          parts={tokenDiff}
          text={after}
        />
      </div>
      {displayDiffText ? (
        <pre className="mt-3 max-h-56 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-700">
          {displayDiffText}
        </pre>
      ) : null}
    </section>
  );
}

function TextBlock({
  hiddenKind,
  label,
  parts,
  text
}: {
  hiddenKind: TextDiffPart["kind"];
  label: string;
  parts: TextDiffPart[];
  text: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-zinc-200 bg-white p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">
        {parts.length === 0
          ? text
          : parts
              .filter((part) => part.kind !== hiddenKind)
              .map((part, index) => (
                <span className={diffPartClassName(part.kind)} key={index}>
                  {part.value}
                </span>
              ))}
      </p>
    </div>
  );
}

function diffPartClassName(kind: TextDiffPart["kind"]) {
  if (kind === "added") {
    return "rounded-sm bg-emerald-200 px-0.5 py-0.5 font-semibold text-emerald-950 ring-1 ring-emerald-300";
  }

  if (kind === "removed") {
    return "rounded-sm bg-rose-200 px-0.5 py-0.5 font-semibold text-rose-950 line-through decoration-2 ring-1 ring-rose-300";
  }

  return undefined;
}
