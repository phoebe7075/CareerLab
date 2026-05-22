import { useState } from "react";

import type { CareerLabExportBundle } from "../../data/schema";
import type { ImportPreview } from "../../data/importExport";
import { copyText } from "../../shared/lib/clipboard";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import type { MarkdownExportKind } from "./markdownExport";

type ExportImportPageProps = {
  onConfirmImport: (bundle: CareerLabExportBundle) => Promise<void>;
  onCreateCycleExport: () => Promise<string>;
  onCreateExport: () => Promise<string>;
  onCreateMarkdownExport: (kind: MarkdownExportKind) => Promise<string>;
  onMergeCycleImport: (bundle: CareerLabExportBundle) => Promise<void>;
  onPreviewImport: (input: string) => Promise<ImportPreview>;
};

export function ExportImportPage({
  onConfirmImport,
  onCreateCycleExport,
  onCreateExport,
  onCreateMarkdownExport,
  onMergeCycleImport,
  onPreviewImport
}: ExportImportPageProps) {
  const [exportText, setExportText] = useState("");
  const [exportFilename, setExportFilename] = useState("career-lab-backup.json");
  const [exportCopied, setExportCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      setExportText(await onCreateExport());
      setExportFilename("career-lab-backup.json");
      setExportCopied(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkdownExport(kind: MarkdownExportKind) {
    setBusy(true);
    try {
      setExportText(await onCreateMarkdownExport(kind));
      setExportFilename(markdownExportFilenames[kind]);
      setExportCopied(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleCycleExport() {
    setBusy(true);
    try {
      setExportText(await onCreateCycleExport());
      setExportFilename("career-lab-current-prep.json");
      setExportCopied(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyExport() {
    await copyText(exportText);
    setExportCopied(true);
  }

  function handleDownloadExport() {
    const blob = new Blob([exportText], { type: getExportMimeType(exportFilename) });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = exportFilename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handlePreview() {
    setBusy(true);
    try {
      setPreview(await onPreviewImport(importText));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview?.bundle) {
      return;
    }

    setBusy(true);
    try {
      await onConfirmImport(preview.bundle);
      setImportText("");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleMergeCycleImport() {
    if (!preview?.bundle) {
      return;
    }

    setBusy(true);
    try {
      await onMergeCycleImport(preview.bundle);
      setImportText("");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-6 px-6 py-6 max-sm:px-4 xl:grid-cols-2">
      <section
        className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5"
        data-page-guide="export-panel"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-950">내보내기</h3>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={handleExport} variant="primary">
              전체 백업 JSON
            </Button>
            <Button disabled={busy} onClick={handleCycleExport} variant="secondary">
              현재 준비 JSON
            </Button>
            <Button
              disabled={busy}
              onClick={() => void handleMarkdownExport("resume")}
              variant="secondary"
            >
              경력기술서 MD
            </Button>
            <Button
              disabled={busy}
              onClick={() => void handleMarkdownExport("essay")}
              variant="secondary"
            >
              자기소개서 MD
            </Button>
            <Button
              disabled={busy}
              onClick={() => void handleMarkdownExport("interview")}
              variant="secondary"
            >
              면접 질문 MD
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-zinc-500">
            {exportText ? exportFilename : "내보낼 데이터를 선택하세요."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!exportText}
              onClick={() => void handleCopyExport()}
              size="sm"
              variant="secondary"
            >
              {exportCopied ? "복사됨" : "복사"}
            </Button>
            <Button
              disabled={!exportText}
              onClick={handleDownloadExport}
              size="sm"
              variant="secondary"
            >
              다운로드
            </Button>
          </div>
        </div>
        <textarea
          aria-label="export output"
          className="mt-4 min-h-96 w-full resize-y rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 font-mono text-xs leading-5 text-zinc-950 outline-none focus:border-blue-500"
          onChange={(event) => {
            setExportText(event.target.value);
            setExportCopied(false);
          }}
          value={exportText}
        />
      </section>

      <section
        className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5"
        data-page-guide="import-panel"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-950">가져오기</h3>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || importText.trim().length === 0} onClick={handlePreview}>
              미리보기
            </Button>
            <Button
              disabled={busy || !preview?.ok || !preview.bundle}
              onClick={handleConfirmImport}
              variant="primary"
            >
              전체 교체
            </Button>
            <Button
              disabled={busy || !preview?.ok || !preview.bundle}
              onClick={handleMergeCycleImport}
              variant="secondary"
            >
              현재 준비에 병합
            </Button>
          </div>
        </div>
        <textarea
          aria-label="import input"
          className="mt-4 min-h-72 w-full resize-y rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 font-mono text-xs leading-5 text-zinc-950 outline-none focus:border-blue-500"
          onChange={(event) => setImportText(event.target.value)}
          value={importText}
        />

        {preview ? (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={preview.ok ? "success" : "danger"}>
                {preview.ok ? "가져오기 가능" : "가져오기 불가"}
              </Badge>
              <Badge tone="neutral">검증 결과 {preview.issues.length}개</Badge>
            </div>
            {preview.bundle ? <ImportPreviewSummary preview={preview} /> : null}
            <ul className="mt-3 space-y-2">
              {preview.issues.length === 0 ? (
                <li className="text-sm text-zinc-600">검증 오류 없음</li>
              ) : (
                preview.issues.map((issue, index) => (
                  <li
                    className="break-words text-sm leading-6 text-zinc-600"
                    key={`${issue.code}-${index}`}
                  >
                    [{issue.severity}] {issue.message}
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </section>
    </section>
  );
}

function ImportPreviewSummary({ preview }: { preview: ImportPreview }) {
  if (!preview.bundle) {
    return null;
  }

  const rawCounts: Array<[string, number]> = [
    ["커리어 사이클", preview.bundle.entities.careerCycles.length],
    ["프로젝트", preview.bundle.entities.workProjects.length],
    ["업무", preview.bundle.entities.workItems.length],
    ["경력기술서", preview.bundle.entities.resumeStatements.length],
    ["자기소개서", preview.bundle.entities.essayQuestions.length],
    ["면접 질문", preview.bundle.entities.interviewQuestions.length],
    ["프롬프트 이력", preview.bundle.entities.promptHistory.length]
  ];
  const counts = rawCounts.filter(([, count]) => count > 0);
  const duplicateCount = Object.values(preview.duplicateIds).reduce(
    (sum, ids) => sum + (ids?.length ?? 0),
    0
  );
  const changeRows = createImportChangeRows(preview);
  const duplicateRows = Object.entries(preview.duplicateIds).filter(
    ([, ids]) => (ids?.length ?? 0) > 0
  );

  return (
    <section className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950">가져오기 요약</h4>
        <Badge tone={duplicateCount > 0 ? "warning" : "neutral"}>
          중복 ID {duplicateCount}개
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {counts.map(([label, count]) => (
          <span
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
            key={label}
          >
            {label} {count}
          </span>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            바뀔 주요 내용
          </h5>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-zinc-700">
            {changeRows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
        {duplicateRows.length > 0 ? (
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              같은 ID로 덮어쓸 항목
            </h5>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-zinc-700">
              {duplicateRows.map(([entityName, ids]) => (
                <li key={entityName}>
                  {formatEntityLabel(entityName)} {ids.length}개:{" "}
                  {formatShortList(ids)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-xs leading-5 text-zinc-600">
        전체 교체는 현재 로컬 데이터를 이 백업으로 바꿉니다. 현재 준비에 병합은
        같은 ID를 덮어쓰고 현재 준비 범위 데이터만 합칩니다.
      </p>
    </section>
  );
}

function createImportChangeRows(preview: ImportPreview) {
  const bundle = preview.bundle;
  if (!bundle) {
    return [];
  }

  const { entities } = bundle;
  const workProjects = entities.workProjects ?? [];
  const workItems = entities.workItems ?? [];
  const resumeStatements = entities.resumeStatements ?? [];
  const essaySets = entities.essaySets ?? [];
  const essayQuestions = entities.essayQuestions ?? [];
  const interviewQuestions = entities.interviewQuestions ?? [];
  return [
    workProjects.length > 0
      ? `프로젝트: ${formatShortList(
          workProjects.map((project) => project.name)
        )}`
      : "프로젝트 없음",
    workItems.length > 0
      ? `업무: ${formatShortList(workItems.map((item) => item.title))}`
      : "업무 없음",
    resumeStatements.length > 0
      ? `경력기술서 문구 ${resumeStatements.length}개`
      : "경력기술서 문구 없음",
    essaySets.length > 0
      ? `자기소개서 묶음: ${formatShortList(
          essaySets.map((set) => set.title)
        )}`
      : essayQuestions.length > 0
        ? `자기소개서 문항 ${essayQuestions.length}개`
        : "자기소개서 없음",
    interviewQuestions.length > 0
      ? `면접 질문: ${formatShortList(
          interviewQuestions.map((question) => question.question)
        )}`
      : "면접 질문 없음"
  ];
}

function formatEntityLabel(entityName: string) {
  const labels: Record<string, string> = {
    careerCycles: "커리어 사이클",
    essayQuestions: "자기소개서 문항",
    essaySets: "자기소개서 묶음",
    interviewQuestions: "면접 질문",
    promptHistory: "프롬프트 이력",
    resumeStatements: "경력기술서",
    workItems: "업무",
    workProjects: "프로젝트"
  };

  return labels[entityName] ?? entityName;
}

function formatShortList(values: Array<string | undefined>) {
  const visibleValues = values
    .filter((value): value is string => Boolean(value?.trim()))
    .slice(0, 3);
  const suffix = values.length > visibleValues.length ? " 외" : "";
  return `${visibleValues.join(", ") || "제목 없음"}${suffix}`;
}

const markdownExportFilenames = {
  essay: "career-lab-essays.md",
  interview: "career-lab-interview.md",
  resume: "career-lab-resume.md"
} satisfies Record<MarkdownExportKind, string>;

function getExportMimeType(filename: string) {
  return filename.endsWith(".json")
    ? "application/json;charset=utf-8"
    : "text/markdown;charset=utf-8";
}
