import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatWorkSystem,
  type ResumeFitLevel,
  type ResumePromptProfile,
  type ResumeStatement,
  type ResumeStatementStatus,
  type VersionRecord,
  type WorkSystem,
  type WorkItem,
  type WorkProject,
  type WorkItemUseTier
} from "../../data/schema";
import { DiffViewer } from "../../shared/components/DiffViewer";
import { OverclaimSignalList } from "../../shared/components/OverclaimSignalList";
import { VersionHistoryPanel } from "../../shared/components/VersionHistoryPanel";
import { detectOverclaims } from "../../shared/lib/overclaimDetector";
import { createTextDiff } from "../../shared/lib/diff";
import { getVisibleVersionRecords } from "../../shared/lib/versionHistory";
import { compareWorkItemsForResume } from "../../shared/lib/workItemSort";
import { formatWorkItemPeriod } from "../../shared/lib/workItemPeriod";
import { formatProjectContext } from "../../shared/lib/workProjectDisplay";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import { Modal } from "../../shared/ui/Modal";
import { parseResumeEvaluationJson } from "./resumeEvaluationImport";
import { sortResumeStatements } from "./resumeStatementSort";

export type CopyResumeGenerationPromptInput = {
  excludedExpressions: string;
  emphasis: string;
  jdKeywords: string;
  statementCount: string;
  targetLength: string;
  tone: string;
  workItemIds: string[];
};

export type SaveResumePromptProfileInput = {
  id: string | null;
  excludedExpressions: string;
  emphasis: string;
  jdKeywords: string;
  name: string;
  statementCount: string;
  targetLength: string;
  tone: string;
};

export type SaveResumeVersionInput = {
  after: string;
  before: string;
  rationale: string;
  statementId: string;
};

const defaultPromptOptions = {
  emphasis: "",
  excludedExpressions: "",
  jdKeywords: "",
  statementCount: "3",
  targetLength: "500",
  tone: "간결하고 사실 중심"
};

type ResumeLabPageProps = {
  onAddStatement: (workItemId: string) => Promise<void>;
  onAutosave: (statementId: string, text: string) => Promise<void>;
  onCopyEvaluationPrompt: (statementId: string) => Promise<void>;
  onDeletePromptProfile: (id: string) => Promise<void>;
  onImportEvaluation: (statementId: string, input: string) => Promise<boolean>;
  onRestoreVersion?: (statementId: string, versionId: string) => Promise<boolean>;
  onCopyGenerationPrompt: (
    input: CopyResumeGenerationPromptInput
  ) => Promise<void>;
  onSavePromptProfile: (
    input: SaveResumePromptProfileInput
  ) => Promise<ResumePromptProfile>;
  onSaveVersion?: (input: SaveResumeVersionInput) => Promise<VersionRecord>;
  onSelectStatement: (id: string) => void;
  onUpdateStatus: (
    statementId: string,
    status: ResumeStatementStatus
  ) => Promise<void>;
  promptProfiles: ResumePromptProfile[];
  resumeStatements: ResumeStatement[];
  selectedStatementId: string | null;
  workItems: WorkItem[];
  workProjects?: WorkProject[];
};

const statusLabels: Record<ResumeStatementStatus, string> = {
  candidate: "후보",
  editing: "수정 중",
  final: "최종",
  "needs-review": "검토 필요",
  usable: "사용 가능"
};

const statusToneClasses: Record<ResumeStatementStatus, string> = {
  candidate: "border-blue-200 bg-blue-50 text-blue-700",
  editing: "border-zinc-300 bg-zinc-100 text-zinc-800",
  final: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "needs-review": "border-amber-200 bg-amber-50 text-amber-800",
  usable: "border-lime-200 bg-lime-50 text-lime-700"
};

const resumeFitLevelLabels: Record<ResumeFitLevel, string> = {
  core: "핵심",
  limited: "제한",
  strong: "강함",
  supporting: "보조"
};

const resumeFitLevelTones: Record<
  ResumeFitLevel,
  "accent" | "success" | "warning" | "neutral"
> = {
  core: "success",
  limited: "neutral",
  strong: "accent",
  supporting: "warning"
};

const useTierLabels: Record<WorkItemUseTier, string> = {
  archive: "보관",
  hero: "대표",
  "interview-only": "면접",
  main: "메인",
  support: "보조"
};

const useTierTones: Record<
  WorkItemUseTier,
  "accent" | "success" | "warning" | "neutral"
> = {
  archive: "neutral",
  hero: "success",
  "interview-only": "warning",
  main: "accent",
  support: "neutral"
};

export function ResumeLabPage({
  onAddStatement,
  onAutosave,
  onCopyEvaluationPrompt,
  onCopyGenerationPrompt,
  onDeletePromptProfile,
  onImportEvaluation,
  onRestoreVersion = async () => false,
  onSavePromptProfile,
  onSaveVersion = async () => {
    throw new Error("Save resume version handler is not configured.");
  },
  onSelectStatement,
  onUpdateStatus,
  promptProfiles,
  resumeStatements,
  selectedStatementId,
  workItems,
  workProjects = []
}: ResumeLabPageProps) {
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ResumeStatementStatus | "all">(
    "all"
  );
  const workItemsById = useMemo(
    () => new Map(workItems.map((workItem) => [workItem.id, workItem])),
    [workItems]
  );
  const sortedStatements = useMemo(
    () => sortResumeStatements(resumeStatements, workItemsById),
    [resumeStatements, workItemsById]
  );
  const visibleStatements = useMemo(
    () =>
      statusFilter === "all"
        ? sortedStatements
        : sortedStatements.filter((statement) => statement.status === statusFilter),
    [sortedStatements, statusFilter]
  );
  const selectedStatement =
    visibleStatements.find((statement) => statement.id === selectedStatementId) ??
    visibleStatements[0] ??
    sortedStatements[0];
  const defaultWorkItemId =
    selectedStatement?.workItemId ?? sortedStatements[0]?.workItemId ?? workItems[0]?.id ?? "";
  const statusCounts = useMemo(
    () =>
      resumeStatements.reduce(
        (counts, statement) => ({
          ...counts,
          [statement.status]: counts[statement.status] + 1
        }),
        {
          candidate: 0,
          editing: 0,
          final: 0,
          "needs-review": 0,
          usable: 0
        } satisfies Record<ResumeStatementStatus, number>
      ),
    [resumeStatements]
  );

  useEffect(() => {
    if (selectedStatement && selectedStatement.id !== selectedStatementId) {
      onSelectStatement(selectedStatement.id);
    }
  }, [onSelectStatement, selectedStatement, selectedStatementId]);

  if (!selectedStatement) {
    return (
      <section className="px-6 py-6 text-sm text-zinc-600">
        <p>경력기술서 문구가 없습니다.</p>
        <Button
          className="mt-4"
          data-page-guide="resume-add-statement"
          disabled={!defaultWorkItemId}
          onClick={() => void onAddStatement(defaultWorkItemId)}
          variant="primary"
        >
          새 문구
        </Button>
        <Button className="ml-2 mt-4" onClick={() => setPromptBuilderOpen(true)}>
          프롬프트 생성
        </Button>
        <ResumePromptBuilderModal
          onClose={() => setPromptBuilderOpen(false)}
          onCopyPrompt={onCopyGenerationPrompt}
          onDeleteProfile={onDeletePromptProfile}
          onSaveProfile={onSavePromptProfile}
          open={promptBuilderOpen}
          promptProfiles={promptProfiles}
          workItems={workItems}
          workProjects={workProjects}
        />
      </section>
    );
  }

  return (
    <section className="px-6 py-6 max-sm:px-4">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-zinc-950">
            경력기술서 문구 관리
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            최종 문구를 먼저 확인하고, 후보와 검토 항목은 상태별로 골라 다듬습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            data-page-guide="resume-add-statement"
            disabled={!defaultWorkItemId}
            onClick={() => void onAddStatement(defaultWorkItemId)}
            variant="secondary"
          >
            새 문구
          </Button>
          <Button
            data-page-guide="resume-prompt-builder"
            onClick={() => setPromptBuilderOpen(true)}
            variant="primary"
          >
            프롬프트 생성
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside
          className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4"
          data-page-guide="resume-list"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-950">문구 목록</h3>
            <Badge tone="neutral">{resumeStatements.length}개</Badge>
          </div>
          <StatusFilter
            counts={statusCounts}
            onChange={setStatusFilter}
            value={statusFilter}
          />
          <div className="mt-4 grid gap-2">
            {visibleStatements.map((statement) => {
              const workItem = workItemsById.get(statement.workItemId);
              const signals = workItem
                ? detectOverclaims(statement.text, {
                    dangerousClaims: workItem.dangerousClaims,
                    metricsToVerify: workItem.metricsToVerify
                  })
                : [];
              return (
                <ResumeStatementListCard
                  key={statement.id}
                  onSelect={() => onSelectStatement(statement.id)}
                  overclaimCount={signals.length}
                  selected={statement.id === selectedStatement.id}
                  statement={statement}
                />
              );
            })}
          </div>
        </aside>

        <ResumeStatementEditor
          key={selectedStatement.id}
          onAutosave={onAutosave}
          onCopyEvaluationPrompt={onCopyEvaluationPrompt}
          onImportEvaluation={onImportEvaluation}
          onRestoreVersion={onRestoreVersion}
          onSaveVersion={onSaveVersion}
          onUpdateStatus={onUpdateStatus}
          selectedStatement={selectedStatement}
          workItem={workItemsById.get(selectedStatement.workItemId)}
        />
      </div>

      <ResumePromptBuilderModal
        onClose={() => setPromptBuilderOpen(false)}
        onCopyPrompt={onCopyGenerationPrompt}
        onDeleteProfile={onDeletePromptProfile}
        onSaveProfile={onSavePromptProfile}
        open={promptBuilderOpen}
        promptProfiles={promptProfiles}
        workItems={workItems}
        workProjects={workProjects}
      />
    </section>
  );
}

function StatusFilter({
  counts,
  onChange,
  value
}: {
  counts: Record<ResumeStatementStatus, number>;
  onChange: (value: ResumeStatementStatus | "all") => void;
  value: ResumeStatementStatus | "all";
}) {
  const options: Array<ResumeStatementStatus | "all"> = [
    "all",
    "final",
    "usable",
    "editing",
    "candidate",
    "needs-review"
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option;
        const label = option === "all" ? "전체" : statusLabels[option];
        const count =
          option === "all"
            ? Object.values(counts).reduce((sum, item) => sum + item, 0)
            : counts[option];

        return (
          <button
            aria-pressed={selected}
            className={`inline-flex min-h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition ${
              selected
                ? "border-zinc-900 bg-zinc-950 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
            }`}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            <span>{label}</span>
            <span className={selected ? "text-zinc-300" : "text-zinc-400"}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ResumeStatementListCard({
  onSelect,
  overclaimCount,
  selected,
  statement
}: {
  onSelect: () => void;
  overclaimCount: number;
  selected: boolean;
  statement: ResumeStatement;
}) {
  const score = statement.evaluation?.fitScore;

  return (
    <button
      className={`rounded-md border p-3 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-50"
          : statement.status === "candidate"
            ? "border-blue-200 bg-blue-50/60 hover:border-blue-300"
            : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={statement.status} />
        {typeof score === "number" ? <Badge tone="neutral">{score}점</Badge> : null}
        {overclaimCount > 0 ? (
          <Badge tone="warning">위험 {overclaimCount}</Badge>
        ) : null}
        {statement.versions.length > 0 ? (
          <Badge tone="neutral">버전 {statement.versions.length}</Badge>
        ) : null}
      </div>
      <span className="mt-3 line-clamp-3 text-sm leading-5 text-zinc-800">
        {statement.text}
      </span>
      <div className="mt-3 flex justify-end text-xs text-zinc-500">
        <span className="font-mono">{statement.text.length}자</span>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: ResumeStatementStatus }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 text-xs font-medium leading-none ${statusToneClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function ResumePromptBuilderModal({
  onClose,
  onCopyPrompt,
  onDeleteProfile,
  onSaveProfile,
  open,
  promptProfiles,
  workItems,
  workProjects
}: {
  onClose: () => void;
  onCopyPrompt: (input: CopyResumeGenerationPromptInput) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  onSaveProfile: (
    input: SaveResumePromptProfileInput
  ) => Promise<ResumePromptProfile>;
  open: boolean;
  promptProfiles: ResumePromptProfile[];
  workItems: WorkItem[];
  workProjects: WorkProject[];
}) {
  const sortedWorkItems = useMemo(
    () => [...workItems].sort(compareWorkItemsForResume),
    [workItems]
  );
  const sortedProfiles = useMemo(
    () =>
      [...promptProfiles].sort(
        (first, second) =>
          second.updatedAt.localeCompare(first.updatedAt) ||
          first.name.localeCompare(second.name, "ko")
      ),
    [promptProfiles]
  );
  const workItemGroups = useMemo(
    () => groupWorkItemsByProject(sortedWorkItems, workProjects),
    [sortedWorkItems, workProjects]
  );
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState(() =>
    sortedWorkItems.map((workItem) => workItem.id)
  );
  const [targetLength, setTargetLength] = useState(
    defaultPromptOptions.targetLength
  );
  const [tone, setTone] = useState(defaultPromptOptions.tone);
  const [emphasis, setEmphasis] = useState(defaultPromptOptions.emphasis);
  const [excludedExpressions, setExcludedExpressions] = useState(
    defaultPromptOptions.excludedExpressions
  );
  const [statementCount, setStatementCount] = useState(
    defaultPromptOptions.statementCount
  );
  const [jdKeywords, setJdKeywords] = useState(defaultPromptOptions.jdKeywords);

  function resetProfileSelectionToDefault() {
    setSelectedProfileId("");
    setProfileName("");
    setTargetLength(defaultPromptOptions.targetLength);
    setTone(defaultPromptOptions.tone);
    setStatementCount(defaultPromptOptions.statementCount);
    setEmphasis(defaultPromptOptions.emphasis);
    setExcludedExpressions(defaultPromptOptions.excludedExpressions);
    setJdKeywords(defaultPromptOptions.jdKeywords);
  }

  function applyProfile(profile: ResumePromptProfile) {
    setSelectedProfileId(profile.id);
    setProfileName(profile.name);
    setTargetLength(profile.targetLength);
    setTone(profile.tone);
    setStatementCount(profile.statementCount);
    setEmphasis(profile.emphasis);
    setExcludedExpressions(profile.excludedExpressions);
    setJdKeywords(profile.jdKeywords);
  }

  function handleSelectProfile(profileId: string) {
    setSelectedProfileId(profileId);

    const profile = sortedProfiles.find((item) => item.id === profileId);
    if (profile) {
      applyProfile(profile);
      return;
    }

    resetProfileSelectionToDefault();
  }

  async function handleSaveProfile() {
    const savedProfile = await onSaveProfile({
      excludedExpressions,
      emphasis,
      id: selectedProfileId || null,
      jdKeywords,
      name: profileName,
      statementCount,
      targetLength,
      tone
    });

    setSelectedProfileId(savedProfile.id);
    setProfileName(savedProfile.name);
  }

  async function handleDeleteProfile() {
    if (!selectedProfileId) {
      return;
    }

    await onDeleteProfile(selectedProfileId);
    resetProfileSelectionToDefault();
  }

  function toggleWorkItem(workItemId: string) {
    setSelectedWorkItemIds((current) =>
      current.includes(workItemId)
        ? current.filter((id) => id !== workItemId)
        : [...current, workItemId]
    );
  }

  function toggleProject(workItemIds: string[]) {
    const allSelected = workItemIds.every((id) => selectedWorkItemIds.includes(id));

    setSelectedWorkItemIds((current) =>
      allSelected
        ? current.filter((id) => !workItemIds.includes(id))
        : Array.from(new Set([...current, ...workItemIds]))
    );
  }

  async function handleCopyPrompt() {
    await onCopyPrompt({
      excludedExpressions,
      emphasis,
      jdKeywords,
      statementCount,
      targetLength,
      tone,
      workItemIds: selectedWorkItemIds
    });
    onClose();
  }

  return (
    <Modal onClose={onClose} open={open} size="wide" title="경력기술서 프롬프트 생성">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">업무 선택</h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                경력 점수는 문구 활용도 기준이며, 근거 등급은 표현 안전성 기준입니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  setSelectedWorkItemIds(sortedWorkItems.map((workItem) => workItem.id))
                }
                size="sm"
              >
                전체 선택
              </Button>
              <Button onClick={() => setSelectedWorkItemIds([])} size="sm">
                전체 해제
              </Button>
            </div>
          </div>
          <div className="mt-3 max-h-[calc(90svh-180px)] min-h-0 space-y-3 overflow-auto pr-1 lg:min-h-[560px]">
            {workItemGroups.map((group) => {
              const groupIds = group.items.map((workItem) => workItem.id);
              const selectedCount = groupIds.filter((id) =>
                selectedWorkItemIds.includes(id)
              ).length;
              const allSelected = selectedCount === groupIds.length;
              const partiallySelected = selectedCount > 0 && !allSelected;

              return (
                <section
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-2"
                  key={group.id}
                >
                  <div className="flex items-center justify-between gap-3 px-1 pb-2">
                    <div className="min-w-0">
                      <h4 className="break-words text-xs font-semibold leading-4 text-zinc-700">
                        {group.label}
                      </h4>
                      {group.sourceLabel ? (
                        <p className="mt-1 break-words text-[11px] leading-4 text-zinc-500">
                          소속/맥락: {group.sourceLabel}
                        </p>
                      ) : null}
                    </div>
                    <ProjectSelectCheckbox
                      checked={allSelected}
                      indeterminate={partiallySelected}
                      label={`${group.label} 전체 선택`}
                      onChange={() => toggleProject(groupIds)}
                    />
                  </div>
                  <div className="grid gap-2">
                    {group.items.map((workItem) => {
                      const score = workItem.score;
                      const fallbackResumeFit = workItem.resumeFit;

                      return (
                        <label
                          className="flex gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm"
                          key={workItem.id}
                        >
                          <input
                            checked={selectedWorkItemIds.includes(workItem.id)}
                            className="mt-1 h-4 w-4 shrink-0"
                            onChange={() => toggleWorkItem(workItem.id)}
                            type="checkbox"
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-start justify-between gap-2">
                              <span className="min-w-0 break-words font-medium text-zinc-950">
                                {workItem.title}
                              </span>
                              {score ? (
                                <span className="flex shrink-0 flex-wrap gap-1">
                                  <Badge tone="success">
                                    경력 {score.resumeScore}점
                                  </Badge>
                                  <Badge tone={useTierTones[score.useTier]}>
                                    {useTierLabels[score.useTier]}
                                  </Badge>
                                  <Badge tone="neutral">
                                    근거 {score.evidenceConfidence}
                                  </Badge>
                                </span>
                              ) : fallbackResumeFit ? (
                                <span className="flex shrink-0 flex-wrap gap-1">
                                  <Badge tone="success">
                                    경력 {fallbackResumeFit.score}점
                                  </Badge>
                                  <Badge tone={resumeFitLevelTones[fallbackResumeFit.level]}>
                                    {resumeFitLevelLabels[fallbackResumeFit.level]}
                                  </Badge>
                                </span>
                              ) : (
                                <Badge className="shrink-0" tone="neutral">
                                  미평가
                                </Badge>
                              )}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                              <span>처리시점 {formatWorkItemPeriod(workItem)}</span>
                              <span>{workItem.riskLevel}</span>
                              {score ? (
                                <>
                                  <span>종합 {score.overallScore}</span>
                                  <span>자소서 {score.essayScore}</span>
                                  <span>면접 {score.interviewScore}</span>
                                  <span>{score.scoreReason}</span>
                                </>
                              ) : (
                                fallbackResumeFit?.reasons
                                  .slice(0, 2)
                                  .map((reason) => <span key={reason}>{reason}</span>)
                              )}
                            </span>
                            {score?.caution ?? fallbackResumeFit?.cautions[0] ? (
                              <span className="mt-1 block break-words text-xs leading-5 text-amber-700">
                                주의: {score?.caution ?? fallbackResumeFit?.cautions[0]}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="min-w-0 space-y-4">
          <section
            aria-label="옵션 프로파일"
            className="space-y-3 border-b border-zinc-200 pb-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">
                옵션 프로파일
              </h3>
              <Button
                disabled={!selectedProfileId}
                onClick={handleDeleteProfile}
                size="sm"
                variant="softDanger"
              >
                삭제
              </Button>
            </div>
            <ProfileSelect
              onChange={handleSelectProfile}
              profiles={sortedProfiles}
              value={selectedProfileId}
            />
            <PromptTextInput
              label="프로파일 이름"
              onChange={setProfileName}
              placeholder="예: 직무/분량 기준"
              value={profileName}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                onClick={() => {
                  setSelectedProfileId("");
                  setProfileName("");
                }}
                size="sm"
              >
                새 프로파일
              </Button>
              <Button
                disabled={profileName.trim().length === 0}
                onClick={handleSaveProfile}
                size="sm"
                variant="primary"
              >
                옵션 저장
              </Button>
            </div>
          </section>
          <PromptTextInput
            label="목표 글자 수"
            onChange={setTargetLength}
            value={targetLength}
          />
          <PromptTextInput label="톤" onChange={setTone} value={tone} />
          <PromptTextInput
            label="문구 개수"
            onChange={setStatementCount}
            value={statementCount}
          />
          <PromptTextArea
            label="핵심 강조사항"
            onChange={setEmphasis}
            placeholder="강조하고 싶은 역량, 업무 방식, 결과"
            value={emphasis}
          />
          <PromptTextArea
            label="제외할 표현"
            onChange={setExcludedExpressions}
            placeholder="과장 표현, 쓰지 말아야 할 단어"
            value={excludedExpressions}
          />
          <PromptTextArea
            label="회사/JD 키워드"
            onChange={setJdKeywords}
            placeholder="지원 회사 JD 키워드"
            value={jdKeywords}
          />
          <div className="flex justify-end">
            <Button
              disabled={selectedWorkItemIds.length === 0}
              onClick={() => void handleCopyPrompt()}
              variant="primary"
            >
              프롬프트 복사
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function ProjectSelectCheckbox({
  checked,
  indeterminate,
  label,
  onChange
}: {
  checked: boolean;
  indeterminate: boolean;
  label: string;
  onChange: () => void;
}) {
  const checkboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      aria-label={label}
      checked={checked}
      className="h-4 w-4 shrink-0"
      onChange={onChange}
      ref={checkboxRef}
      type="checkbox"
    />
  );
}

function PromptTextInput({
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
    <label className="block min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function ProfileSelect({
  onChange,
  profiles,
  value
}: {
  onChange: (value: string) => void;
  profiles: ResumePromptProfile[];
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-zinc-800">저장된 프로파일</span>
      <select
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">선택 안 함</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function PromptTextArea({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <textarea
        className="mt-2 min-h-20 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function groupWorkItemsByProject(
  workItems: WorkItem[],
  workProjects: WorkProject[]
) {
  if (workProjects.length === 0) {
    const groups = new Map<WorkSystem, WorkItem[]>();

    for (const workItem of workItems) {
      groups.set(workItem.system, [...(groups.get(workItem.system) ?? []), workItem]);
    }

    return Array.from(groups, ([system, items]) => ({
      id: system,
      items,
      label: formatWorkSystem(system),
      sourceLabel: null as string | null
    }));
  }

  const grouped = new Map<string, WorkItem[]>();

  for (const workItem of workItems) {
    grouped.set(workItem.projectId, [
      ...(grouped.get(workItem.projectId) ?? []),
      workItem
    ]);
  }

  const projectGroups = workProjects
    .map((project) => ({
      id: project.id,
      items: grouped.get(project.id) ?? [],
      label: project.name,
      sourceLabel: formatProjectContext(project)
    }))
    .filter((group) => group.items.length > 0);
  const knownProjectIds = new Set(workProjects.map((project) => project.id));
  const orphanGroups = [...grouped.entries()]
    .filter(([projectId]) => !knownProjectIds.has(projectId))
    .map(([projectId, items]) => ({
      id: projectId || "unassigned",
      items,
      label: "프로젝트 미지정",
      sourceLabel: null as string | null
    }));

  return [...projectGroups, ...orphanGroups];
}

function ResumeStatementEditor({
  onAutosave,
  onCopyEvaluationPrompt,
  onImportEvaluation,
  onRestoreVersion,
  onSaveVersion,
  onUpdateStatus,
  selectedStatement,
  workItem
}: {
  onAutosave: (statementId: string, text: string) => Promise<void>;
  onCopyEvaluationPrompt: (statementId: string) => Promise<void>;
  onImportEvaluation: (statementId: string, input: string) => Promise<boolean>;
  onRestoreVersion: (statementId: string, versionId: string) => Promise<boolean>;
  onSaveVersion: (input: SaveResumeVersionInput) => Promise<VersionRecord>;
  onUpdateStatus: (
    statementId: string,
    status: ResumeStatementStatus
  ) => Promise<void>;
  selectedStatement: ResumeStatement;
  workItem: WorkItem | undefined;
}) {
  const [draftText, setDraftText] = useState(selectedStatement.text);
  const [draftStartText, setDraftStartText] = useState(
    getResumeDraftBaseline(selectedStatement)
  );
  const [rationale, setRationale] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">(
    "saved"
  );
  const [restoreVersion, setRestoreVersion] = useState<VersionRecord | null>(null);
  const [evaluationImportOpen, setEvaluationImportOpen] = useState(false);
  const diffText = useMemo(
    () => createTextDiff(draftStartText, draftText),
    [draftStartText, draftText]
  );
  const hasDraftChanges = draftText !== draftStartText;
  const overclaimSignals = useMemo(
    () =>
      workItem
        ? detectOverclaims(draftText, {
            dangerousClaims: workItem.dangerousClaims,
            metricsToVerify: workItem.metricsToVerify
          })
        : [],
    [draftText, workItem]
  );

  useEffect(() => {
    if (draftText === selectedStatement.text) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setAutosaveState("saving");
      void Promise.resolve(onAutosave(selectedStatement.id, draftText)).then(() => {
        if (active) {
          setAutosaveState("saved");
        }
      });
    }, 800);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [draftText, onAutosave, selectedStatement.id, selectedStatement.text]);

  async function handleSaveVersion() {
    if (saveState === "saving") {
      return;
    }

    setSaveState("saving");
    try {
      await onSaveVersion({
        after: draftText,
        before: draftStartText,
        rationale: rationale.trim(),
        statementId: selectedStatement.id
      });
      setDraftStartText(draftText);
      setRationale("");
      setAutosaveState("saved");
    } finally {
      setSaveState("idle");
    }
  }

  async function handleConfirmRestore() {
    if (!restoreVersion) {
      return;
    }

    const restored = await onRestoreVersion(selectedStatement.id, restoreVersion.id);
    if (restored) {
      setDraftText(restoreVersion.after);
      setDraftStartText(restoreVersion.after);
      setAutosaveState("saved");
      setRestoreVersion(null);
    }
  }

  function handleDraftTextChange(value: string) {
    setDraftText(value);
    setAutosaveState("idle");
  }

  async function handleResetDraft() {
    if (!hasDraftChanges) {
      return;
    }

    setDraftText(draftStartText);
    setAutosaveState("saving");
    await onAutosave(selectedStatement.id, draftStartText);
    setAutosaveState("saved");
  }

  return (
    <section
      className="min-w-0 rounded-lg border border-zinc-200 bg-white p-5"
      data-page-guide="resume-editor"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={selectedStatement.status} />
            {selectedStatement.evaluation ? (
              <Badge tone="neutral">{selectedStatement.evaluation.fitScore}점</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusSelect
            onChange={(status) =>
              void onUpdateStatus(selectedStatement.id, status)
            }
            value={selectedStatement.status}
          />
          <Button
            onClick={() => void onCopyEvaluationPrompt(selectedStatement.id)}
            size="sm"
          >
            평가 프롬프트
          </Button>
          <Button
            onClick={() => setEvaluationImportOpen(true)}
            size="sm"
            variant="primary"
          >
            평가 JSON 붙여넣기
          </Button>
        </div>
      </div>
      <ResumeStatementComposer
        autosaveState={autosaveState}
        onChange={handleDraftTextChange}
        value={draftText}
      />
      <label className="mt-5 block">
        <span className="text-sm font-medium text-zinc-800">Version rationale</span>
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
          기준으로 되돌리기
        </Button>
        <Button
          disabled={saveState === "saving"}
          onClick={() => void handleSaveVersion()}
          variant="primary"
        >
          버전으로 남기기
        </Button>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <DiffViewer
          after={draftText}
          afterLabel="현재 초안"
          before={draftStartText}
          beforeLabel="기준 버전"
          diffText={diffText}
        />
        <VersionHistoryPanel
          currentText={draftText}
          onPreviewRestore={setRestoreVersion}
          versions={selectedStatement.versions}
        />
      </div>
      <ResumeOverclaimReview signals={overclaimSignals} />
      <ResumeEvaluationPanel evaluation={selectedStatement.evaluation} />
      <ResumeVersionRestoreModal
        currentText={draftText}
        onClose={() => setRestoreVersion(null)}
        onConfirm={() => void handleConfirmRestore()}
        open={Boolean(restoreVersion)}
        version={restoreVersion}
      />
      <ResumeEvaluationImportModal
        onClose={() => setEvaluationImportOpen(false)}
        onImport={async (input) => {
          const imported = await onImportEvaluation(selectedStatement.id, input);
          if (imported) {
            setEvaluationImportOpen(false);
          }
        }}
        open={evaluationImportOpen}
      />
    </section>
  );
}

function StatusSelect({
  onChange,
  value
}: {
  onChange: (status: ResumeStatementStatus) => void;
  value: ResumeStatementStatus;
}) {
  return (
    <label className="min-w-36">
      <span className="sr-only">문구 상태</span>
      <select
        aria-label="문구 상태"
        className="min-h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value as ResumeStatementStatus)}
        value={value}
      >
        {(["final", "usable", "editing", "candidate", "needs-review"] as const).map(
          (status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function getResumeDraftBaseline(statement: ResumeStatement) {
  return (
    statement.draftBaseline ??
    getVisibleVersionRecords(statement.versions).at(-1)?.after ??
    statement.text
  );
}

function ResumeVersionRestoreModal({
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
          <h4 className="text-sm font-semibold text-zinc-950">현재 문구</h4>
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
          적용하면 현재 초안만 선택한 버전 내용으로 바뀝니다. Version History에는
          새 기록을 만들지 않습니다.
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>취소</Button>
        <Button onClick={onConfirm} variant="primary">
          현재 문구로 적용
        </Button>
      </div>
    </Modal>
  );
}

function ResumeOverclaimReview({
  signals
}: {
  signals: ReturnType<typeof detectOverclaims>;
}) {
  return (
    <section className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950">표현 경고</h4>
        <Badge tone={signals.length > 0 ? "warning" : "success"}>
          {signals.length > 0 ? `${signals.length}개 확인` : "이상 없음"}
        </Badge>
      </div>
      <OverclaimSignalList
        emptyLabel="현재 문구에서 등록된 위험 표현, 역할 과장, 확인 필요 수치가 감지되지 않았습니다."
        signals={signals}
      />
    </section>
  );
}

function ResumeEvaluationPanel({
  evaluation
}: {
  evaluation: ResumeStatement["evaluation"];
}) {
  if (!evaluation) {
    return (
      <section className="mt-5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500">
        아직 저장된 평가 점수가 없습니다.
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950">평가 점수</h4>
        {evaluation.recommendedStatus ? (
          <StatusPill status={evaluation.recommendedStatus} />
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <ScoreMetric label="적합도" value={evaluation.fitScore} />
        <ScoreMetric label="사실 안정성" value={evaluation.factSafetyScore} />
        <ScoreMetric label="구체성" value={evaluation.specificityScore} />
        <ScoreMetric label="JD 적합도" value={evaluation.jdMatchScore} />
        <ScoreMetric label="차별성" value={evaluation.distinctivenessScore} />
      </div>
      {evaluation.summary ? (
        <p className="mt-4 text-sm leading-6 text-zinc-700">{evaluation.summary}</p>
      ) : null}
      <EvaluationList title="위험 경고" values={evaluation.riskWarnings} />
      <EvaluationList title="개선 제안" values={evaluation.improvementSuggestions} />
      {evaluation.recommendedText ? (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <h5 className="text-xs font-semibold text-zinc-700">추천 문구</h5>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
            {evaluation.recommendedText}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function ScoreMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function EvaluationList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4">
      <h5 className="text-xs font-semibold text-zinc-700">{title}</h5>
      <ul className="mt-2 grid gap-1 text-sm leading-6 text-zinc-700">
        {values.map((value) => (
          <li className="break-words" key={value}>
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResumeEvaluationImportModal({
  onClose,
  onImport,
  open
}: {
  onClose: () => void;
  onImport: (input: string) => Promise<void>;
  open: boolean;
}) {
  const [input, setInput] = useState("");
  const [confirmEvaluation, setConfirmEvaluation] = useState<
    ResumeStatement["evaluation"] | null
  >(null);
  const preview = useMemo(
    () => (input.trim() ? parseResumeEvaluationJson(input) : null),
    [input]
  );
  const previewEvaluation = preview?.ok ? preview.evaluation : null;

  function handleInputChange(value: string) {
    setInput(value);
    setConfirmEvaluation(null);
  }

  function handleClose() {
    setInput("");
    setConfirmEvaluation(null);
    onClose();
  }

  async function handleImport() {
    await onImport(input);
    setInput("");
    setConfirmEvaluation(null);
  }

  return (
    <Modal onClose={handleClose} open={open} title="평가 JSON 붙여넣기">
      <label className="block">
        <span className="text-sm font-medium text-zinc-800">AI 평가 JSON</span>
        <textarea
          className="mt-2 min-h-72 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-950 outline-none focus:border-blue-500"
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder='{"fitScore":82,"factSafetyScore":90,"specificityScore":75,"jdMatchScore":70,"distinctivenessScore":80,"summary":"","statusRecommendation":"사용 가능","riskWarnings":[],"improvementSuggestions":[],"recommendedText":""}'
          value={input}
        />
      </label>
      <section className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-zinc-950">저장 전 preview</h4>
          <Badge tone={previewEvaluation ? "success" : preview ? "danger" : "neutral"}>
            {previewEvaluation ? "적용 가능" : preview ? "오류" : "대기"}
          </Badge>
        </div>
        {previewEvaluation ? (
          <ResumeEvaluationPreview evaluation={previewEvaluation} />
        ) : (
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {preview && !preview.ok
              ? preview.message
              : "AI JSON을 붙여넣으면 점수와 추천 상태를 먼저 확인합니다."}
          </p>
        )}
      </section>

      {confirmEvaluation ? (
        <section className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-zinc-950">저장 확인</h4>
            <Badge tone="accent">확인 필요</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            아래 평가 내용으로 현재 문구의 점수, 추천 상태, 위험 경고, 추천
            문구를 저장합니다.
          </p>
          <ResumeEvaluationPreview evaluation={confirmEvaluation} />
        </section>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={handleClose}>취소</Button>
        <Button
          disabled={!previewEvaluation}
          onClick={() =>
            confirmEvaluation
              ? void handleImport()
              : setConfirmEvaluation(previewEvaluation)
          }
          variant="primary"
        >
          {confirmEvaluation ? "확인 후 저장" : "저장 내용 확인"}
        </Button>
      </div>
    </Modal>
  );
}

function ResumeEvaluationPreview({
  evaluation
}: {
  evaluation: NonNullable<ResumeStatement["evaluation"]>;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-5">
        <ScoreMetric label="적합도" value={evaluation.fitScore} />
        <ScoreMetric label="사실 안정성" value={evaluation.factSafetyScore} />
        <ScoreMetric label="구체성" value={evaluation.specificityScore} />
        <ScoreMetric label="JD 적합도" value={evaluation.jdMatchScore} />
        <ScoreMetric label="차별성" value={evaluation.distinctivenessScore} />
      </div>
      {evaluation.recommendedStatus ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">추천 상태</span>
          <StatusPill status={evaluation.recommendedStatus} />
        </div>
      ) : null}
      {evaluation.summary ? (
        <p className="text-sm leading-6 text-zinc-700">{evaluation.summary}</p>
      ) : null}
      <EvaluationList title="위험 경고" values={evaluation.riskWarnings} />
      <EvaluationList title="개선 제안" values={evaluation.improvementSuggestions} />
      {evaluation.recommendedText ? (
        <div className="border-t border-zinc-200 pt-3">
          <h5 className="text-xs font-semibold text-zinc-700">추천 문구</h5>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">
            {evaluation.recommendedText}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ResumeStatementComposer({
  autosaveState,
  onChange,
  value
}: {
  autosaveState: "idle" | "saving" | "saved";
  onChange: (value: string) => void;
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
      <label className="min-w-0" htmlFor="resume-statement-editor">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <span className="text-sm font-semibold text-zinc-950">
            경력기술서 문구
          </span>
          <span
            className="flex flex-wrap items-center gap-2 text-xs text-zinc-500"
            id="resume-statement-count"
          >
            <span className="font-mono text-zinc-950">{value.length}자</span>
            <span>공백 제외 {nonWhitespaceCount}자</span>
          </span>
        </div>
        <textarea
          aria-label="경력기술서 문구"
          aria-describedby="resume-statement-count"
          className="mt-2 min-h-[360px] w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-4 text-[15px] leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-500"
          id="resume-statement-editor"
          lang="ko"
          onChange={(event) => onChange(event.target.value)}
          placeholder="실제 경력기술서에 붙여 넣을 문구를 입력하세요."
          spellCheck
          value={value}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
          <span>{autosaveLabel}</span>
          <span className="font-mono text-zinc-700">{value.length}자</span>
        </div>
      </label>
    </div>
  );
}

function countNonWhitespace(value: string) {
  return value.replace(/\s/g, "").length;
}
