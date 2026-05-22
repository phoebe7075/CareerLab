import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  FilePlus2,
  RotateCcw,
  Save,
  Trash2,
  WandSparkles
} from "lucide-react";

import type {
  EssayQuestion,
  EssaySet,
  EssaySetStatus,
  VersionRecord,
  WorkItem
} from "../../data/schema";
import { DiffViewer } from "../../shared/components/DiffViewer";
import {
  InspectorMetric,
  InspectorPanel,
  InspectorSection,
  InspectorTagList
} from "../../shared/components/InspectorPanel";
import { OverclaimSignalList } from "../../shared/components/OverclaimSignalList";
import { VersionHistoryPanel } from "../../shared/components/VersionHistoryPanel";
import { createTextDiff } from "../../shared/lib/diff";
import { detectOverclaims } from "../../shared/lib/overclaimDetector";
import { useResetWindowScroll } from "../../shared/lib/useResetWindowScroll";
import { getVisibleVersionRecords } from "../../shared/lib/versionHistory";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import { Modal } from "../../shared/ui/Modal";
import { formatEssayParagraphs } from "./essayFormatting";

export type SaveEssayVersionInput = {
  after: string;
  before: string;
  questionId: string;
  rationale: string;
};

export type UpdateEssayQuestionInput = {
  question: string;
  questionId: string;
  targetLength: {
    max: number;
    min: number;
  };
};

export type UpdateEssaySetInput = {
  companyName: string;
  deadline: string;
  formatNotes: string;
  jdKeywords: string;
  notes: string;
  roleTitle: string;
  setId: string;
  status: EssaySetStatus;
  title: string;
};

type EssayLabPageProps = {
  essayQuestions: EssayQuestion[];
  essaySets: EssaySet[];
  onAddQuestion: (essaySetId: string) => Promise<void>;
  onAddSet: () => Promise<EssaySet>;
  onAutosave: (questionId: string, answer: string) => Promise<void>;
  onCopyPrompt: (questionId: string, currentAnswer: string) => Promise<void>;
  onCopySetMarkdown: (essaySetId: string) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onDeleteSet: (essaySetId: string) => Promise<void>;
  onDownloadSetMarkdown: (essaySetId: string) => Promise<void>;
  onRestoreVersion?: (questionId: string, versionId: string) => Promise<boolean>;
  onSaveVersion: (input: SaveEssayVersionInput) => Promise<VersionRecord>;
  onSelectQuestion: (id: string | null) => void;
  onSelectSet: (id: string) => void;
  onUpdateQuestion: (input: UpdateEssayQuestionInput) => Promise<void>;
  onUpdateSet: (input: UpdateEssaySetInput) => Promise<void>;
  onGuidePageChange?: (pageId: string) => void;
  selectedQuestionId: string | null;
  selectedSetId: string | null;
  workItems: WorkItem[];
};

type EssayLabView = "list" | "editor";

const statusLabels: Record<EssaySetStatus, string> = {
  archived: "보관",
  drafting: "작성 중",
  ready: "제출 준비",
  submitted: "제출 완료"
};

const statusBadgeTones: Record<
  EssaySetStatus,
  "neutral" | "accent" | "success" | "warning"
> = {
  archived: "neutral",
  drafting: "warning",
  ready: "accent",
  submitted: "success"
};

export function EssayLabPage({
  essayQuestions,
  essaySets,
  onAddQuestion,
  onAddSet,
  onAutosave,
  onCopyPrompt,
  onCopySetMarkdown,
  onDeleteQuestion,
  onDeleteSet,
  onDownloadSetMarkdown,
  onRestoreVersion = async () => false,
  onSaveVersion,
  onSelectQuestion,
  onSelectSet,
  onUpdateQuestion,
  onUpdateSet,
  onGuidePageChange,
  selectedQuestionId,
  selectedSetId,
  workItems
}: EssayLabPageProps) {
  const [view, setView] = useState<EssayLabView>("list");
  const [addingSet, setAddingSet] = useState(false);
  const selectedSet =
    essaySets.find((set) => set.id === selectedSetId) ?? essaySets[0] ?? null;

  useResetWindowScroll(view);

  useEffect(() => {
    onGuidePageChange?.(view === "editor" ? "essay-lab-editor" : "essay-lab");

    return () => onGuidePageChange?.("essay-lab");
  }, [onGuidePageChange, view]);

  async function handleAddSet() {
    setAddingSet(true);
    try {
      const createdSet = await onAddSet();
      onSelectSet(createdSet.id);
      onSelectQuestion(null);
    } finally {
      setAddingSet(false);
    }
  }

  function handleOpenEditor(setId: string) {
    onSelectSet(setId);
    const firstQuestion = essayQuestions.find(
      (question) => question.essaySetId === setId
    );
    onSelectQuestion(firstQuestion?.id ?? null);
    setView("editor");
  }

  if (essaySets.length === 0) {
    return (
      <section className="px-6 py-6 max-sm:px-4">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8">
          <h2 className="text-lg font-semibold text-zinc-950">
            자기소개서 묶음이 없습니다.
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            새 묶음을 만들면 회사별 문항과 답변을 다시 정리할 수 있습니다.
          </p>
          <Button
            className="mt-4"
            onClick={() => void handleAddSet()}
            variant="primary"
          >
            <FilePlus2 aria-hidden="true" className="mr-2 size-4" />
            새 묶음
          </Button>
        </div>
      </section>
    );
  }

  if (view === "list" || !selectedSet) {
    return (
      <EssaySetList
        essayQuestions={essayQuestions}
        essaySets={essaySets}
        onAddSet={() => void handleAddSet()}
        addingSet={addingSet}
        onOpenEditor={handleOpenEditor}
        onCopySetMarkdown={onCopySetMarkdown}
        onDeleteSet={onDeleteSet}
        onDownloadSetMarkdown={onDownloadSetMarkdown}
        onSelectSet={onSelectSet}
        onUpdateSet={onUpdateSet}
        selectedSetId={selectedSet?.id ?? null}
      />
    );
  }

  return (
    <EssaySetEditor
      essayQuestions={essayQuestions}
      essaySets={essaySets}
      onAddQuestion={onAddQuestion}
      onAutosave={onAutosave}
      onBackToList={() => setView("list")}
      onCopyPrompt={onCopyPrompt}
      onCopySetMarkdown={onCopySetMarkdown}
      onDeleteQuestion={onDeleteQuestion}
      onDownloadSetMarkdown={onDownloadSetMarkdown}
      onRestoreVersion={onRestoreVersion}
      onSaveVersion={onSaveVersion}
      onSelectQuestion={onSelectQuestion}
      onSelectSet={(setId) => handleOpenEditor(setId)}
      onUpdateQuestion={onUpdateQuestion}
      selectedQuestionId={selectedQuestionId}
      selectedSet={selectedSet}
      workItems={workItems}
    />
  );
}

function EssaySetList({
  addingSet,
  essayQuestions,
  essaySets,
  onCopySetMarkdown,
  onDeleteSet,
  onDownloadSetMarkdown,
  onAddSet,
  onOpenEditor,
  onSelectSet,
  onUpdateSet,
  selectedSetId
}: {
  addingSet: boolean;
  essayQuestions: EssayQuestion[];
  essaySets: EssaySet[];
  onCopySetMarkdown: (essaySetId: string) => Promise<void>;
  onDeleteSet: (essaySetId: string) => Promise<void>;
  onDownloadSetMarkdown: (essaySetId: string) => Promise<void>;
  onAddSet: () => void;
  onOpenEditor: (setId: string) => void;
  onSelectSet: (id: string) => void;
  onUpdateSet: (input: UpdateEssaySetInput) => Promise<void>;
  selectedSetId: string | null;
}) {
  const selectedSet =
    essaySets.find((set) => set.id === selectedSetId) ?? essaySets[0];

  return (
    <section className="grid gap-6 px-6 py-6 max-sm:px-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0" data-page-guide="essay-set-list">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              자기소개서 묶음
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              회사별 양식과 문항 답변을 하나의 묶음으로 관리합니다.
            </p>
          </div>
          <Button disabled={addingSet} onClick={onAddSet} variant="primary">
            <FilePlus2 aria-hidden="true" className="mr-2 size-4" />
            {addingSet ? "묶음 추가 중" : "새 묶음"}
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {essaySets.map((set) => {
            const questions = essayQuestions.filter(
              (question) => question.essaySetId === set.id
            );
            const answeredCount = questions.filter(
              (question) => question.answer.trim().length > 0
            ).length;
            const newestUpdate = getNewestUpdate([set, ...questions]);

            return (
              <EssaySetListCard
                answeredCount={answeredCount}
                key={set.id}
                newestUpdate={newestUpdate}
                onCopySetMarkdown={onCopySetMarkdown}
                onDeleteSet={onDeleteSet}
                onDownloadSetMarkdown={onDownloadSetMarkdown}
                onOpenEditor={onOpenEditor}
                onSelectSet={onSelectSet}
                questionCount={questions.length}
                selected={selectedSet?.id === set.id}
                set={set}
              />
            );
          })}
        </div>
      </div>

      {addingSet ? (
        <aside className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-950">묶음 메타</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            새 묶음을 만드는 중입니다. 생성이 끝난 뒤 회사명과 직무를 입력하세요.
          </p>
        </aside>
      ) : (
        <EssaySetMetadataEditor
          key={selectedSet?.id}
          onUpdateSet={onUpdateSet}
          selectedSet={selectedSet}
        />
      )}
    </section>
  );
}

function EssaySetListCard({
  answeredCount,
  newestUpdate,
  onCopySetMarkdown,
  onDeleteSet,
  onDownloadSetMarkdown,
  onOpenEditor,
  onSelectSet,
  questionCount,
  selected,
  set
}: {
  answeredCount: number;
  newestUpdate: string;
  onCopySetMarkdown: (essaySetId: string) => Promise<void>;
  onDeleteSet: (essaySetId: string) => Promise<void>;
  onDownloadSetMarkdown: (essaySetId: string) => Promise<void>;
  onOpenEditor: (setId: string) => void;
  onSelectSet: (id: string) => void;
  questionCount: number;
  selected: boolean;
  set: EssaySet;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setConfirmingDelete(false);
    void onDeleteSet(set.id);
  }

  return (
    <div
      className={`rounded-lg border bg-white p-4 text-left transition ${
        selected
          ? "border-blue-500 ring-1 ring-blue-100"
          : "border-zinc-200 hover:border-zinc-300"
      }`}
      onClick={() => onSelectSet(set.id)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-zinc-950">
              {set.title}
            </p>
            <Badge tone={statusBadgeTones[set.status]}>
              {statusLabels[set.status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-zinc-600">{formatSetContext(set)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              void onCopySetMarkdown(set.id);
            }}
            size="sm"
          >
            <Copy aria-hidden="true" className="mr-2 size-4" />
            MD 복사
          </Button>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              void onDownloadSetMarkdown(set.id);
            }}
            size="sm"
          >
            <Download aria-hidden="true" className="mr-2 size-4" />
            MD 저장
          </Button>
          <Button
            data-page-guide="essay-open-editor"
            onClick={(event) => {
              event.stopPropagation();
              onOpenEditor(set.id);
            }}
            size="sm"
            variant="primary"
          >
            작성
          </Button>
          <Button
            aria-label={
              confirmingDelete
                ? `${set.title} 묶음 삭제 확인`
                : `${set.title} 묶음 삭제`
            }
            onBlur={() => setConfirmingDelete(false)}
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
            size="sm"
            variant="softDanger"
          >
            {confirmingDelete ? (
              "삭제 확인"
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
          </Button>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
        <EssaySetMetric label="문항" value={`${questionCount}개`} />
        <EssaySetMetric
          label="답변 작성"
          value={`${answeredCount}/${questionCount}`}
        />
        <EssaySetMetric label="마감" value={set.deadline || "미정"} />
        <EssaySetMetric label="최근 수정" value={formatDateShort(newestUpdate)} />
      </dl>
      {set.jdKeywords || set.formatNotes ? (
        <div className="mt-4 grid gap-2 border-t border-zinc-100 pt-3 text-sm text-zinc-600 md:grid-cols-2">
          <p className="line-clamp-2">
            <span className="font-medium text-zinc-800">JD</span>{" "}
            {set.jdKeywords || "없음"}
          </p>
          <p className="line-clamp-2">
            <span className="font-medium text-zinc-800">양식</span>{" "}
            {set.formatNotes || "없음"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function EssaySetMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-950">{value}</dd>
    </div>
  );
}

function EssaySetMetadataEditor({
  onUpdateSet,
  selectedSet
}: {
  onUpdateSet: (input: UpdateEssaySetInput) => Promise<void>;
  selectedSet: EssaySet;
}) {
  const [draft, setDraft] = useState(() => createEssaySetDraft(selectedSet));

  useEffect(() => {
    if (!draft.title.trim()) {
      return;
    }

    const changed =
      draft.title.trim() !== selectedSet.title ||
      draft.companyName.trim() !== selectedSet.companyName ||
      draft.roleTitle.trim() !== selectedSet.roleTitle ||
      draft.status !== selectedSet.status ||
      draft.deadline !== selectedSet.deadline ||
      draft.jdKeywords.trim() !== selectedSet.jdKeywords ||
      draft.formatNotes.trim() !== selectedSet.formatNotes ||
      draft.notes.trim() !== selectedSet.notes;

    if (!changed) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void onUpdateSet({
        ...draft,
        companyName: draft.companyName.trim(),
        formatNotes: draft.formatNotes.trim(),
        jdKeywords: draft.jdKeywords.trim(),
        notes: draft.notes.trim(),
        roleTitle: draft.roleTitle.trim(),
        setId: selectedSet.id,
        title: draft.title.trim()
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [draft, onUpdateSet, selectedSet]);

  return (
    <aside
      className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4"
      data-page-guide="essay-set-metadata"
    >
      <h3 className="text-sm font-semibold text-zinc-950">묶음 메타</h3>
      <div className="mt-4 grid gap-3">
        <EssaySetInput
          label="묶음 제목"
          onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
          value={draft.title}
        />
        <EssaySetInput
          label="회사명"
          onChange={(value) =>
            setDraft((current) => ({ ...current, companyName: value }))
          }
          placeholder="예: 회사명"
          value={draft.companyName}
        />
        <EssaySetInput
          label="직무"
          onChange={(value) =>
            setDraft((current) => ({ ...current, roleTitle: value }))
          }
          placeholder="예: 직무명"
          value={draft.roleTitle}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="min-w-0">
            <span className="text-xs font-medium text-zinc-600">상태</span>
            <select
              aria-label="자기소개서 묶음 상태"
              className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-950 outline-none focus:border-blue-500"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as EssaySetStatus
                }))
              }
              value={draft.status}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <EssaySetInput
            label="마감일"
            onChange={(value) =>
              setDraft((current) => ({ ...current, deadline: value }))
            }
            type="date"
            value={draft.deadline}
          />
        </div>
        <EssaySetTextarea
          label="JD/키워드"
          onChange={(value) =>
            setDraft((current) => ({ ...current, jdKeywords: value }))
          }
          placeholder="채용공고 키워드, 요구 역량, 우선순위"
          value={draft.jdKeywords}
        />
        <EssaySetTextarea
          label="회사별 양식 메모"
          onChange={(value) =>
            setDraft((current) => ({ ...current, formatNotes: value }))
          }
          placeholder="문항 수, 글자 수, 파일 양식, 제출 방식"
          value={draft.formatNotes}
        />
        <EssaySetTextarea
          label="노트"
          onChange={(value) => setDraft((current) => ({ ...current, notes: value }))}
          placeholder="작성 전략 또는 참고 메모"
          value={draft.notes}
        />
      </div>
    </aside>
  );
}

function EssaySetInput({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <input
        aria-label={label}
        className="mt-1 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function EssaySetTextarea({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <textarea
        aria-label={label}
        className="mt-1 min-h-20 w-full resize-y rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function createEssaySetDraft(set: EssaySet) {
  return {
    companyName: set.companyName,
    deadline: set.deadline,
    formatNotes: set.formatNotes,
    jdKeywords: set.jdKeywords,
    notes: set.notes,
    roleTitle: set.roleTitle,
    status: set.status,
    title: set.title
  };
}

function EssaySetEditor({
  essayQuestions,
  essaySets,
  onAddQuestion,
  onAutosave,
  onBackToList,
  onCopyPrompt,
  onCopySetMarkdown,
  onDeleteQuestion,
  onDownloadSetMarkdown,
  onRestoreVersion,
  onSaveVersion,
  onSelectQuestion,
  onSelectSet,
  onUpdateQuestion,
  selectedQuestionId,
  selectedSet,
  workItems
}: {
  essayQuestions: EssayQuestion[];
  essaySets: EssaySet[];
  onAddQuestion: (essaySetId: string) => Promise<void>;
  onAutosave: (questionId: string, answer: string) => Promise<void>;
  onBackToList: () => void;
  onCopyPrompt: (questionId: string, currentAnswer: string) => Promise<void>;
  onCopySetMarkdown: (essaySetId: string) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onDownloadSetMarkdown: (essaySetId: string) => Promise<void>;
  onRestoreVersion: (questionId: string, versionId: string) => Promise<boolean>;
  onSaveVersion: (input: SaveEssayVersionInput) => Promise<VersionRecord>;
  onSelectQuestion: (id: string | null) => void;
  onSelectSet: (id: string) => void;
  onUpdateQuestion: (input: UpdateEssayQuestionInput) => Promise<void>;
  selectedQuestionId: string | null;
  selectedSet: EssaySet;
  workItems: WorkItem[];
}) {
  const setQuestions = essayQuestions.filter(
    (question) => question.essaySetId === selectedSet.id
  );
  const selectedQuestion =
    setQuestions.find((question) => question.id === selectedQuestionId) ??
    setQuestions[0] ??
    null;

  useEffect(() => {
    if (selectedQuestionId && setQuestions.some((item) => item.id === selectedQuestionId)) {
      return;
    }

    onSelectQuestion(setQuestions[0]?.id ?? null);
  }, [onSelectQuestion, selectedQuestionId, setQuestions]);

  return (
    <section className="px-6 py-6 max-sm:px-4">
      <div
        className="mb-5 rounded-lg border border-zinc-200 bg-white p-4"
        data-page-guide="essay-editor-header"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onBackToList} size="sm">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                목록
              </Button>
              <select
                aria-label="자기소개서 묶음 선택"
                className="min-h-9 rounded-md border border-zinc-300 bg-white px-2.5 text-sm font-medium text-zinc-950 outline-none focus:border-blue-500"
                onChange={(event) => onSelectSet(event.target.value)}
                value={selectedSet.id}
              >
                {essaySets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.title}
                  </option>
                ))}
              </select>
              <Badge tone={statusBadgeTones[selectedSet.status]}>
                {statusLabels[selectedSet.status]}
              </Badge>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-zinc-950">
              {selectedSet.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {formatSetContext(selectedSet)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <span>문항 {setQuestions.length}개</span>
            <span>마감 {selectedSet.deadline || "미정"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void onCopySetMarkdown(selectedSet.id)}
              size="sm"
            >
              <Copy aria-hidden="true" className="mr-2 size-4" />
              MD 복사
            </Button>
            <Button
              onClick={() => void onDownloadSetMarkdown(selectedSet.id)}
              size="sm"
            >
              <Download aria-hidden="true" className="mr-2 size-4" />
              MD 저장
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside
          className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4"
          data-page-guide="essay-question-list"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-950">문항 목록</h3>
            <Button
              onClick={() => void onAddQuestion(selectedSet.id)}
              size="sm"
              variant="primary"
            >
              새 문항
            </Button>
          </div>
          <div className="mt-4 grid gap-2">
            {setQuestions.map((question) => (
              <EssayQuestionListCard
                key={question.id}
                onDelete={() => void onDeleteQuestion(question.id)}
                onSelect={() => onSelectQuestion(question.id)}
                question={question}
                selected={question.id === selectedQuestion?.id}
              />
            ))}
            {setQuestions.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                아직 문항이 없습니다. 새 문항을 추가하면 이 묶음에 연결됩니다.
              </div>
            ) : null}
          </div>
        </aside>

        {selectedQuestion ? (
          <EssayEditor
            key={selectedQuestion.id}
            onAutosave={onAutosave}
            onCopyPrompt={onCopyPrompt}
            onRestoreVersion={onRestoreVersion}
            onSaveVersion={onSaveVersion}
            onUpdateQuestion={onUpdateQuestion}
            selectedQuestion={selectedQuestion}
            selectedSet={selectedSet}
            workItems={workItems}
          />
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-sm text-zinc-600">
            편집할 자기소개서 문항을 추가하세요.
          </div>
        )}
      </div>
    </section>
  );
}

function EssayQuestionListCard({
  onDelete,
  onSelect,
  question,
  selected
}: {
  onDelete: () => void;
  onSelect: () => void;
  question: EssayQuestion;
  selected: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setConfirmingDelete(false);
    onDelete();
  }

  return (
    <div
      className={`rounded-md border p-3 transition ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <button
          className="min-w-0 flex-1 text-left"
          onClick={onSelect}
          type="button"
        >
          <span className="line-clamp-3 text-sm leading-5 text-zinc-800">
            {question.question}
          </span>
          <span className="mt-2 block text-xs text-zinc-500">
            {question.answer.length} chars
          </span>
        </button>
        <Button
          aria-label={
            confirmingDelete
              ? `${question.question} 삭제 확인`
              : `${question.question} 삭제`
          }
          onBlur={() => setConfirmingDelete(false)}
          onClick={handleDelete}
          size="sm"
          variant="softDanger"
        >
          {confirmingDelete ? (
            "확인"
          ) : (
            <Trash2 aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function EssayEditor({
  onAutosave,
  onCopyPrompt,
  onRestoreVersion,
  onSaveVersion,
  onUpdateQuestion,
  selectedQuestion,
  selectedSet,
  workItems
}: {
  onAutosave: (questionId: string, answer: string) => Promise<void>;
  onCopyPrompt: (questionId: string, currentAnswer: string) => Promise<void>;
  onRestoreVersion: (questionId: string, versionId: string) => Promise<boolean>;
  onSaveVersion: (input: SaveEssayVersionInput) => Promise<VersionRecord>;
  onUpdateQuestion: (input: UpdateEssayQuestionInput) => Promise<void>;
  selectedQuestion: EssayQuestion;
  selectedSet: EssaySet;
  workItems: WorkItem[];
}) {
  const [draftAnswer, setDraftAnswer] = useState(selectedQuestion.answer);
  const [draftStartAnswer, setDraftStartAnswer] = useState(
    getEssayDraftBaseline(selectedQuestion)
  );
  const [draftQuestion, setDraftQuestion] = useState(selectedQuestion.question);
  const [draftTargetMin, setDraftTargetMin] = useState(
    String(selectedQuestion.targetLength.min)
  );
  const [draftTargetMax, setDraftTargetMax] = useState(
    String(selectedQuestion.targetLength.max)
  );
  const [rationale, setRationale] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">(
    "saved"
  );
  const [restoreVersion, setRestoreVersion] = useState<VersionRecord | null>(null);

  const linkedWorkItems = workItems.filter((item) =>
    selectedQuestion.linkedWorkItemIds.includes(item.id)
  );
  const diffText = useMemo(
    () => createTextDiff(draftStartAnswer, draftAnswer),
    [draftStartAnswer, draftAnswer]
  );
  const targetSatisfied =
    draftAnswer.length >= selectedQuestion.targetLength.min &&
    draftAnswer.length <= selectedQuestion.targetLength.max;
  const hasDraftChanges = draftAnswer !== draftStartAnswer;
  const targetMin = Number(draftTargetMin);
  const targetMax = Number(draftTargetMax);
  const hasValidTargetLength =
    Number.isInteger(targetMin) &&
    Number.isInteger(targetMax) &&
    targetMin > 0 &&
    targetMax >= targetMin;

  useEffect(() => {
    if (draftAnswer === selectedQuestion.answer) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setAutosaveState("saving");
      void Promise.resolve(onAutosave(selectedQuestion.id, draftAnswer)).then(() => {
        if (active) {
          setAutosaveState("saved");
        }
      });
    }, 800);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [draftAnswer, onAutosave, selectedQuestion.answer, selectedQuestion.id]);

  useEffect(() => {
    const nextQuestion = draftQuestion.trim();

    if (
      !nextQuestion ||
      !hasValidTargetLength ||
      (nextQuestion === selectedQuestion.question &&
        targetMin === selectedQuestion.targetLength.min &&
        targetMax === selectedQuestion.targetLength.max)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void onUpdateQuestion({
        question: nextQuestion,
        questionId: selectedQuestion.id,
        targetLength: {
          max: targetMax,
          min: targetMin
        }
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    draftQuestion,
    draftTargetMax,
    draftTargetMin,
    hasValidTargetLength,
    onUpdateQuestion,
    selectedQuestion.id,
    selectedQuestion.question,
    selectedQuestion.targetLength.max,
    selectedQuestion.targetLength.min,
    targetMax,
    targetMin
  ]);

  async function handleSaveVersion() {
    if (saveState === "saving") {
      return;
    }

    setSaveState("saving");
    try {
      await onSaveVersion({
        after: draftAnswer,
        before: draftStartAnswer,
        questionId: selectedQuestion.id,
        rationale: rationale.trim()
      });
      setDraftStartAnswer(draftAnswer);
      setRationale("");
      setAutosaveState("saved");
    } finally {
      setSaveState("idle");
    }
  }

  function handleDraftAnswerChange(value: string) {
    setDraftAnswer(value);
    setAutosaveState("idle");
  }

  async function handleConfirmRestore() {
    if (!restoreVersion) {
      return;
    }

    const restored = await onRestoreVersion(selectedQuestion.id, restoreVersion.id);
    if (restored) {
      setDraftAnswer(restoreVersion.after);
      setDraftStartAnswer(restoreVersion.after);
      setAutosaveState("saved");
      setRestoreVersion(null);
    }
  }

  async function handleResetDraft() {
    if (!hasDraftChanges) {
      return;
    }

    setDraftAnswer(draftStartAnswer);
    setAutosaveState("saving");
    await onAutosave(selectedQuestion.id, draftStartAnswer);
    setAutosaveState("saved");
  }

  function handleFormatParagraphs() {
    const formattedAnswer = formatEssayParagraphs(draftAnswer);

    if (formattedAnswer !== draftAnswer) {
      handleDraftAnswerChange(formattedAnswer);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 min-[1400px]:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-6">
        <section
          className="rounded-lg border border-zinc-200 bg-white p-5"
          data-page-guide="essay-answer-editor"
        >
          <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            {selectedSet.title} 문항
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50/80 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                문항 설정
              </span>
              <div className="flex flex-wrap gap-2">
                <Badge tone={targetSatisfied ? "success" : "warning"}>
                  {draftAnswer.length} chars
                </Badge>
                <Badge tone="neutral">
                  {selectedQuestion.targetLength.min}-
                  {selectedQuestion.targetLength.max}
                </Badge>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block min-w-0">
                <span className="sr-only">자기소개서 문항</span>
                <input
                  aria-label="자기소개서 문항"
                  className="min-h-11 w-full rounded-md border border-transparent bg-white px-3 text-[15px] font-semibold leading-6 text-zinc-950 shadow-sm outline-none ring-1 ring-zinc-200 transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-blue-200"
                  onChange={(event) => setDraftQuestion(event.target.value)}
                  placeholder="자기소개서 문항을 입력하세요."
                  value={draftQuestion}
                />
              </label>
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <label className="block min-w-0">
                  <span className="text-xs font-medium text-zinc-600">최소</span>
                  <input
                    aria-label="자기소개서 최소 글자 수"
                    className="mt-1 min-h-9 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-950 outline-none focus:border-blue-500"
                    inputMode="numeric"
                    onChange={(event) => setDraftTargetMin(event.target.value)}
                    type="number"
                    value={draftTargetMin}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-xs font-medium text-zinc-600">최대</span>
                  <input
                    aria-label="자기소개서 최대 글자 수"
                    className="mt-1 min-h-9 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-950 outline-none focus:border-blue-500"
                    inputMode="numeric"
                    onChange={(event) => setDraftTargetMax(event.target.value)}
                    type="number"
                    value={draftTargetMax}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <EssayAnswerComposer
              autosaveState={autosaveState}
              onChange={handleDraftAnswerChange}
              onFormatParagraphs={handleFormatParagraphs}
              value={draftAnswer}
            />
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-zinc-800">
              Version rationale
            </span>
            <input
              className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
              onChange={(event) => setRationale(event.target.value)}
              placeholder="변경 이유"
              value={rationale}
            />
          </label>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              disabled={!hasDraftChanges}
              onClick={() => void handleResetDraft()}
              variant="secondary"
            >
              <RotateCcw aria-hidden="true" className="mr-2 size-4" />
              기준으로 되돌리기
            </Button>
            <Button
              disabled={saveState === "saving"}
              onClick={handleSaveVersion}
              variant="primary"
            >
              <Save aria-hidden="true" className="mr-2 size-4" />
              버전 저장
            </Button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <DiffViewer
            after={draftAnswer}
            before={draftStartAnswer}
            diffText={diffText}
          />
          <VersionHistoryPanel
            currentText={draftAnswer}
            onPreviewRestore={setRestoreVersion}
            versions={selectedQuestion.versions}
          />
        </div>
      </div>

      <EssayInspector
        draftAnswer={draftAnswer}
        draftStartAnswer={draftStartAnswer}
        linkedWorkItems={linkedWorkItems}
        onCopyPrompt={onCopyPrompt}
        selectedQuestion={selectedQuestion}
        selectedSet={selectedSet}
        targetSatisfied={targetSatisfied}
      />
      <EssayVersionRestoreModal
        currentText={draftAnswer}
        onClose={() => setRestoreVersion(null)}
        onConfirm={() => void handleConfirmRestore()}
        open={Boolean(restoreVersion)}
        version={restoreVersion}
      />
    </div>
  );
}

function EssayAnswerComposer({
  autosaveState,
  onChange,
  onFormatParagraphs,
  value
}: {
  autosaveState: "idle" | "saving" | "saved";
  onChange: (value: string) => void;
  onFormatParagraphs: () => void;
  value: string;
}) {
  const nonWhitespaceCount = countNonWhitespace(value);
  const autosaveLabel = {
    idle: "입력 후 0.8초 뒤 초안 임시저장",
    saved: "초안 임시저장됨",
    saving: "초안 임시저장 중"
  }[autosaveState];

  return (
    <div className="min-w-0">
      <label className="min-w-0" htmlFor="essay-answer-editor">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <span className="text-sm font-semibold text-zinc-950">
            자기소개서 답변
          </span>
          <span
            className="flex flex-wrap items-center gap-2 text-xs text-zinc-500"
            id="essay-answer-count"
          >
            <span className="font-mono text-zinc-950">{value.length}자</span>
            <span>공백 제외 {nonWhitespaceCount}자</span>
          </span>
        </div>
        <textarea
          aria-label="자기소개서 답변"
          aria-describedby="essay-answer-count"
          className="mt-2 min-h-[420px] w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-4 text-[15px] leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-500"
          id="essay-answer-editor"
          lang="ko"
          onChange={(event) => onChange(event.target.value)}
          placeholder="자기소개서 답변을 입력하세요."
          spellCheck
          value={value}
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
        <span>{autosaveLabel}</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-zinc-700">{value.length}자</span>
          <Button onClick={onFormatParagraphs} size="sm" variant="secondary">
            <WandSparkles aria-hidden="true" className="mr-2 size-4" />
            문단 자동 정리
          </Button>
        </div>
      </div>
    </div>
  );
}

function countNonWhitespace(value: string) {
  return value.replace(/\s/g, "").length;
}

function getEssayDraftBaseline(question: EssayQuestion) {
  return getVisibleVersionRecords(question.versions).at(-1)?.after ?? question.answer;
}

function EssayVersionRestoreModal({
  currentText,
  onClose,
  onConfirm,
  open,
  version
}: {
  currentText: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  version: VersionRecord | null;
}) {
  if (!version) {
    return null;
  }

  return (
    <Modal
      confirmOnEnter
      onClose={onClose}
      onConfirm={onConfirm}
      open={open}
      size="wide"
      title="버전 적용 확인"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <h4 className="text-sm font-semibold text-zinc-950">현재 답변</h4>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
            {currentText}
          </p>
        </section>
        <section className="min-w-0 rounded-md border border-blue-200 bg-blue-50 p-4">
          <h4 className="text-sm font-semibold text-zinc-950">적용할 버전</h4>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
            {version.after}
          </p>
        </section>
      </div>
      <div className="mt-4 rounded-md border border-zinc-200 bg-white p-4">
        <p className="text-sm font-medium text-zinc-800">적용 방식</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          적용하면 현재 답변과 기준 버전이 선택한 버전 내용으로 바뀝니다. Version
          History에는 새 기록을 만들지 않습니다.
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>취소</Button>
        <Button onClick={onConfirm} variant="primary">
          현재 답변으로 적용
        </Button>
      </div>
    </Modal>
  );
}

function EssayInspector({
  draftAnswer,
  draftStartAnswer,
  linkedWorkItems,
  onCopyPrompt,
  selectedQuestion,
  selectedSet,
  targetSatisfied
}: {
  draftAnswer: string;
  draftStartAnswer: string;
  linkedWorkItems: WorkItem[];
  onCopyPrompt: (questionId: string, currentAnswer: string) => Promise<void>;
  selectedQuestion: EssayQuestion;
  selectedSet: EssaySet;
  targetSatisfied: boolean;
}) {
  const progress = Math.min(
    100,
    Math.round((draftAnswer.length / selectedQuestion.targetLength.max) * 100)
  );
  const overclaimSignals = detectOverclaims(draftAnswer, {
    dangerousClaims: linkedWorkItems.flatMap((item) => item.dangerousClaims),
    metricsToVerify: linkedWorkItems.flatMap((item) => item.metricsToVerify)
  });

  return (
    <div data-page-guide="essay-inspector">
      <InspectorPanel title="Answer Inspector">
        <InspectorSection title="AI 첨삭">
          <Button
            className="w-full"
            onClick={() => void onCopyPrompt(selectedQuestion.id, draftAnswer)}
            size="sm"
            variant="primary"
          >
            AI 첨삭 프롬프트 복사
          </Button>
        </InspectorSection>

        <InspectorSection title="묶음">
          <div className="space-y-2 text-sm leading-6 text-zinc-700">
            <p className="font-medium text-zinc-950">{selectedSet.title}</p>
            <p>{formatSetContext(selectedSet)}</p>
            {selectedSet.jdKeywords ? <p>JD: {selectedSet.jdKeywords}</p> : null}
          </div>
        </InspectorSection>

        <InspectorSection title="분량">
          <div className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${
                  targetSatisfied ? "bg-emerald-500" : "bg-amber-400"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="space-y-2">
              <InspectorMetric
                label="현재 글자 수"
                value={`${draftAnswer.length}자`}
              />
              <InspectorMetric
                label="목표"
                value={`${selectedQuestion.targetLength.min}-${selectedQuestion.targetLength.max}자`}
              />
              <InspectorMetric
                label="변경 상태"
                value={
                  draftAnswer === draftStartAnswer ? "변경 없음" : "버전 저장 필요"
                }
              />
              <InspectorMetric
                label="저장 버전"
                value={selectedQuestion.versions.length}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorSection title="연결 업무">
          <InspectorTagList
            emptyLabel="연결 업무 없음"
            labels={linkedWorkItems.map((item) => item.title)}
          />
        </InspectorSection>

        <InspectorSection title="과장 감지">
          <OverclaimSignalList
            emptyLabel="감지된 과장 위험 신호 없음"
            signals={overclaimSignals}
          />
        </InspectorSection>

        <InspectorSection title="체크 포인트">
          <ul className="space-y-2 text-sm leading-6 text-zinc-700">
            <li>문항에 직접 답하는 첫 문단</li>
            <li>지원 회사와 직무 맥락에 맞는 소재 선택</li>
            <li>확인되지 않은 수치 표현 분리</li>
          </ul>
        </InspectorSection>
      </InspectorPanel>
    </div>
  );
}

function formatSetContext(set: EssaySet) {
  return [set.companyName || "회사 미지정", set.roleTitle || "직무 미지정"]
    .filter(Boolean)
    .join(" / ");
}

function formatDateShort(value: string) {
  if (!value) {
    return "없음";
  }

  return value.slice(0, 10);
}

function getNewestUpdate(items: Array<{ updatedAt: string }>) {
  return items
    .map((item) => item.updatedAt)
    .sort((left, right) => right.localeCompare(left))[0] ?? "";
}
