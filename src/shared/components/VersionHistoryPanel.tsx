import type { VersionRecord } from "../../data/schema";
import {
  findCurrentVersionId,
  formatVersionTimestamp,
  getVersionStyle,
  getVisibleVersionRecords
} from "../lib/versionHistory";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

type VersionHistoryPanelProps = {
  applyLabel?: string;
  currentLabel?: string;
  currentText?: string;
  emptyLabel?: string;
  onPreviewRestore?: (version: VersionRecord) => void;
  snapshotLabel?: string;
  title?: string;
  versions: VersionRecord[];
};

export function VersionHistoryPanel({
  applyLabel = "이 버전 적용",
  currentLabel = "현재 적용 중",
  currentText,
  emptyLabel = "아직 버전 히스토리에 남긴 기록이 없습니다.",
  onPreviewRestore,
  snapshotLabel = "문구 스냅샷",
  title = "Version History",
  versions
}: VersionHistoryPanelProps) {
  const versionRecords = getVisibleVersionRecords(versions);
  const orderedVersions = [...versionRecords].reverse();
  const currentVersionId =
    typeof currentText === "string"
      ? findCurrentVersionId(versionRecords, currentText)
      : undefined;

  return (
    <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        <Badge tone="neutral">{versionRecords.length}개</Badge>
      </div>

      {orderedVersions.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-zinc-600">{emptyLabel}</p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {orderedVersions.map((version) => {
            const isCurrent = version.id === currentVersionId;
            const style = getVersionStyle(version);

            return (
              <li
                className={`overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm ${style.accentClass}`}
                key={version.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={style.badgeTone}>{style.label}</Badge>
                      {version.tags.map((tag) => (
                        <span
                          className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-600"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <time className="mt-2 block font-mono text-xs text-zinc-600">
                      {formatVersionTimestamp(version.createdAt)}
                    </time>
                  </div>
                  {onPreviewRestore ? (
                    <Button
                      disabled={isCurrent}
                      onClick={() => onPreviewRestore(version)}
                      size="sm"
                      variant={isCurrent ? "secondary" : "primary"}
                    >
                      {isCurrent ? currentLabel : applyLabel}
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 p-3">
                  {version.rationale.trim() ? (
                    <section className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-xs font-medium text-amber-900">
                        변경 사유
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-zinc-800">
                        {version.rationale}
                      </p>
                    </section>
                  ) : null}
                  <section className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-600">
                        {snapshotLabel}
                      </p>
                      <span className="font-mono text-xs text-zinc-500">
                        {version.after.length}자
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-zinc-800">
                      {version.after}
                    </p>
                  </section>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
