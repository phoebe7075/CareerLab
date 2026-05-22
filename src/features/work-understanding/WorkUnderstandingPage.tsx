import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import {
  formatWorkSystem,
  workItemEvidenceConfidenceLevels,
  workItemUseTiers,
  workPriorities,
  workSystems,
  type WorkItem,
  type WorkItemEvidenceConfidence,
  type WorkPriority,
  type WorkProject,
  type WorkItemScore,
  type WorkItemUseTier,
  type WorkSystem
} from "../../data/schema";
import { copyText } from "../../shared/lib/clipboard";
import {
  compareWorkItemsByGeneralScore,
  getProjectActivityTimestamp
} from "../../shared/lib/workItemSort";
import { formatWorkItemPeriod } from "../../shared/lib/workItemPeriod";
import { formatProjectContext } from "../../shared/lib/workProjectDisplay";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";
import { Modal } from "../../shared/ui/Modal";
import {
  buildWorkItemExtractionPrompt,
  buildSelectedWorkItemExtractionPrompt,
  buildWorkItemCandidateListingPrompt,
  parseWorkItemExtractionJson,
  type WorkItemImportDraft,
  type WorkItemImportParseResult
} from "./workItemImport";
import {
  buildWorkItemScoringPrompt,
  createResumeFitFromScore,
  parseWorkItemScoringJson,
  type WorkItemScoreImportUpdate
} from "./workItemScoring";

type WorkUnderstandingPageProps = {
  addWorkItemOpen?: boolean;
  discoveryOpen?: boolean;
  importOpen?: boolean;
  scoringOpen?: boolean;
  onAddWorkItem?: (input: AddWorkItemInput) => Promise<void>;
  onAddWorkItemOpenChange?: (open: boolean) => void;
  onDeleteWorkItem?: (id: string) => Promise<void>;
  onImportWorkItems?: (draft: WorkItemImportDraft) => Promise<void>;
  onImportOpenChange?: (open: boolean) => void;
  onDiscoveryOpenChange?: (open: boolean) => void;
  onImportWorkItemScores?: (
    updates: WorkItemScoreImportUpdate[]
  ) => Promise<void>;
  onSaveWorkItem: (workItem: WorkItem) => Promise<WorkItem>;
  onScoringOpenChange?: (open: boolean) => void;
  onSelectWorkItem: (id: string) => void;
  selectedWorkItemId: string | null;
  workItems: WorkItem[];
  workProjects?: WorkProject[];
};

export type AddWorkItemInput = {
  newProject?: {
    name: string;
  };
  projectId: string;
};

type TagDropTarget = {
  position: "before" | "after";
  tag: string;
};

const priorityLabels: Record<WorkPriority, string> = {
  1: "P1 핵심",
  2: "P2 주요",
  3: "P3 보조"
};

const tagToneClasses = [
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-amber-200 bg-amber-50 text-amber-800",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-zinc-300 bg-zinc-100 text-zinc-800"
];

const tagSwatchClasses = [
  "border-blue-300 bg-blue-500",
  "border-emerald-300 bg-emerald-500",
  "border-lime-300 bg-lime-500",
  "border-amber-300 bg-amber-400",
  "border-orange-300 bg-orange-500",
  "border-rose-300 bg-rose-500",
  "border-violet-300 bg-violet-500",
  "border-zinc-300 bg-zinc-500"
];

async function noopAsync() {}

function noopOpenChange() {}

export function WorkUnderstandingPage({
  addWorkItemOpen = false,
  discoveryOpen = false,
  importOpen = false,
  scoringOpen = false,
  onAddWorkItem,
  onAddWorkItemOpenChange = noopOpenChange,
  onDeleteWorkItem,
  onImportWorkItems,
  onImportOpenChange = noopOpenChange,
  onImportWorkItemScores,
  onSaveWorkItem,
  onDiscoveryOpenChange = noopOpenChange,
  onScoringOpenChange = noopOpenChange,
  onSelectWorkItem,
  selectedWorkItemId,
  workItems,
  workProjects = []
}: WorkUnderstandingPageProps) {
  const addWorkItemHandler = onAddWorkItem ?? noopAsync;
  const importWorkItemsHandler = onImportWorkItems ?? noopAsync;
  const importWorkItemScoresHandler = onImportWorkItemScores ?? noopAsync;
  const [systemFilter, setSystemFilter] = useState<WorkSystem | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<WorkPriority | "all">(
    "all"
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    systemFilter !== "all",
    priorityFilter !== "all"
  ].filter(Boolean).length;
  const systemOptions = useMemo(
    () => collectWorkSystemOptions(workItems, workProjects),
    [workItems, workProjects]
  );

  const visibleWorkItems = workItems.filter(
    (item) =>
      (systemFilter === "all" || item.system === systemFilter) &&
      (priorityFilter === "all" || item.priority === priorityFilter)
  );
  const selectedWorkItem =
    visibleWorkItems.find((item) => item.id === selectedWorkItemId) ??
    visibleWorkItems[0];

  const projectsById = useMemo(
    () => new Map(workProjects.map((project) => [project.id, project])),
    [workProjects]
  );
  const projectGroups = useMemo(
    () => groupWorkItemsByProject(visibleWorkItems, workProjects),
    [visibleWorkItems, workProjects]
  );

  return (
    <section className="grid h-[calc(100vh-5.5rem)] min-h-[720px] gap-5 px-6 py-5 max-sm:h-auto max-sm:min-h-0 max-sm:px-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        className="flex min-h-0 min-w-0 flex-col rounded-lg border border-zinc-200 bg-white"
        data-page-guide="work-list"
      >
        <div className="border-b border-zinc-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                업무 목록
              </h3>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Button
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((current) => !current)}
                size="sm"
              >
                필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
              </Button>
            </div>
          </div>
          {filtersOpen ? (
          <div className="mt-3 grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
            <FilterSelect
              getOptionLabel={(value) =>
                value === "all" ? "전체" : formatWorkSystem(value as WorkSystem)
              }
              label="시스템 필터"
              onChange={(value) => setSystemFilter(value as WorkSystem | "all")}
              options={["all", ...systemOptions]}
              value={systemFilter}
            />
            <div className="grid gap-2">
              <FilterSelect
                getOptionLabel={(value) =>
                  value === "all"
                    ? "전체"
                    : priorityLabels[Number(value) as WorkPriority]
                }
                label="중요도 필터"
                onChange={(value) =>
                  setPriorityFilter(
                    value === "all" ? "all" : (Number(value) as WorkPriority)
                  )
                }
                options={["all", ...workPriorities.map(String)]}
                value={String(priorityFilter)}
              />
            </div>
          </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {visibleWorkItems.length === 0 ? (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500">
              조건에 맞는 업무가 없습니다.
            </p>
          ) : (
            <div className="grid gap-3">
              {projectGroups.map((group) => (
                <ProjectWorkGroup
                  items={group.items}
                  key={group.id}
                  onSelectWorkItem={onSelectWorkItem}
                  projectLabel={group.label}
                  projectSourceLabel={group.sourceLabel}
                  selectedWorkItemId={selectedWorkItem?.id ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <div
        className="min-h-0 min-w-0 overflow-y-auto rounded-lg border border-zinc-200 bg-white"
        data-page-guide="work-detail"
      >
        {selectedWorkItem ? (
          <WorkItemPanel
            key={selectedWorkItem.id}
            onDeleteWorkItem={onDeleteWorkItem}
            onSaveWorkItem={onSaveWorkItem}
            projectsById={projectsById}
            selectedWorkItem={selectedWorkItem}
            workProjects={workProjects}
          />
        ) : null}
      </div>
      <AddWorkItemModal
        onAddWorkItem={addWorkItemHandler}
        onClose={() => onAddWorkItemOpenChange(false)}
        open={addWorkItemOpen}
        workProjects={workProjects}
      />
      <WorkItemImportModal
        onClose={() => onImportOpenChange(false)}
        onImportWorkItems={importWorkItemsHandler}
        open={importOpen}
        workItems={workItems}
        workProjects={workProjects}
      />
      <WorkItemProjectDiscoveryModal
        onClose={() => onDiscoveryOpenChange(false)}
        onImportWorkItems={importWorkItemsHandler}
        open={discoveryOpen}
        workItems={workItems}
        workProjects={workProjects}
      />
      {scoringOpen ? (
        <WorkItemScoringModal
          onClose={() => onScoringOpenChange(false)}
          onImportWorkItemScores={importWorkItemScoresHandler}
          open={scoringOpen}
          workItems={workItems}
          workProjects={workProjects}
        />
      ) : null}
    </section>
  );
}

function groupWorkItemsByProject(
  workItems: WorkItem[],
  workProjects: WorkProject[]
) {
  if (workProjects.length === 0) {
    return collectWorkSystemOptions(workItems)
      .map((system) => ({
        activityAt: getProjectActivityTimestamp(
          undefined,
          workItems.filter((item) => item.system === system)
        ),
        id: system,
        items: workItems
          .filter((item) => item.system === system)
          .sort(compareWorkItemsByGeneralScore),
        label: formatWorkSystem(system),
        sourceLabel: null
      }))
      .filter((group) => group.items.length > 0)
      .sort(compareWorkGroupsByActivity);
  }

  const grouped = new Map<string, WorkItem[]>();

  for (const item of workItems) {
    grouped.set(item.projectId, [...(grouped.get(item.projectId) ?? []), item]);
  }

  const orderedGroups = workProjects
    .map((project) => ({
      activityAt: getProjectActivityTimestamp(project, grouped.get(project.id) ?? []),
      id: project.id,
      items: [...(grouped.get(project.id) ?? [])].sort(
        compareWorkItemsByGeneralScore
      ),
      label: project.name,
      sourceLabel: formatProjectContext(project)
    }))
    .filter((group) => group.items.length > 0)
    .sort(compareWorkGroupsByActivity);
  const knownProjectIds = new Set(workProjects.map((project) => project.id));
  const orphanGroups = [...grouped.entries()]
    .filter(([projectId]) => !knownProjectIds.has(projectId))
    .map(([projectId, items]) => ({
      activityAt: getProjectActivityTimestamp(undefined, items),
      id: projectId || "unassigned",
      items: [...items].sort(compareWorkItemsByGeneralScore),
      label: "프로젝트 미지정",
      sourceLabel: null
    }))
    .sort(compareWorkGroupsByActivity);

  return [...orderedGroups, ...orphanGroups];
}

function compareWorkGroupsByActivity(
  first: { activityAt: string; label: string },
  second: { activityAt: string; label: string }
) {
  return (
    second.activityAt.localeCompare(first.activityAt) ||
    first.label.localeCompare(second.label, "ko")
  );
}

function formatWorkItemDateRange(
  item: Pick<WorkItem, "endedAt" | "startedAt">
) {
  if (item.startedAt && item.endedAt) {
    return `${item.startedAt} ~ ${item.endedAt}`;
  }

  if (item.startedAt) {
    return `${item.startedAt} 이후`;
  }

  if (item.endedAt) {
    return `${item.endedAt}까지`;
  }

  return "날짜 미입력";
}

function collectWorkSystemOptions(
  workItems: Pick<WorkItem, "system">[],
  workProjects: Pick<WorkProject, "system">[] = []
) {
  return Array.from(
    new Set([
      ...workSystems,
      ...workProjects.map((project) => project.system),
      ...workItems.map((item) => item.system)
    ])
  ).filter(Boolean);
}

function AddWorkItemModal({
  onAddWorkItem,
  onClose,
  open,
  workProjects
}: {
  onAddWorkItem: (input: AddWorkItemInput) => Promise<void>;
  onClose: () => void;
  open: boolean;
  workProjects: WorkProject[];
}) {
  const createProjectValue = "__new-project__";
  const [projectId, setProjectId] = useState(
    workProjects[0]?.id ?? createProjectValue
  );
  const [newProjectName, setNewProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedProjectId =
    projectId === createProjectValue && workProjects.length > 0
      ? workProjects[0].id
      : projectId;
  const creatingProject =
    projectId === createProjectValue || workProjects.length === 0;
  const canSave = creatingProject ? newProjectName.trim().length > 0 : true;

  async function handleAdd() {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);
    try {
      await onAddWorkItem({
        projectId: creatingProject ? createProjectValue : selectedProjectId,
        newProject: creatingProject
          ? {
              name: newProjectName.trim()
            }
          : undefined
      });
      setNewProjectName("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} title="업무 추가">
      <div className="grid gap-4">
        <SelectInput
          getOptionLabel={(value) =>
            value === createProjectValue
              ? "새 프로젝트"
              : workProjects.find((project) => project.id === value)?.name ?? value
          }
          label="프로젝트"
          onChange={setProjectId}
          options={[...workProjects.map((project) => project.id), createProjectValue]}
          value={creatingProject ? createProjectValue : selectedProjectId}
        />
        {creatingProject ? (
          <div className="grid gap-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <TextInput
              label="새 프로젝트명"
              onChange={setNewProjectName}
              value={newProjectName}
            />
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>취소</Button>
        <Button
          disabled={!canSave || saving}
          onClick={() => void handleAdd()}
          variant="primary"
        >
          {saving ? "추가 중" : "업무 추가"}
        </Button>
      </div>
    </Modal>
  );
}

function WorkItemImportModal({
  onClose,
  onImportWorkItems,
  open,
  workItems,
  workProjects
}: {
  onClose: () => void;
  onImportWorkItems: (draft: WorkItemImportDraft) => Promise<void>;
  open: boolean;
  workItems: WorkItem[];
  workProjects: WorkProject[];
}) {
  const [sourceText, setSourceText] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const [saving, setSaving] = useState(false);
  const [confirmedRiskyImportForJson, setConfirmedRiskyImportForJson] =
    useState<string | null>(null);
  const preview = useMemo(
    () => (jsonInput.trim() ? parseWorkItemExtractionJson(jsonInput) : null),
    [jsonInput]
  );
  const importReview = useMemo(
    () =>
      preview?.ok
        ? createWorkItemImportReview(
            preview.draft,
            workItems,
            workProjects
          )
        : null,
    [preview, workItems, workProjects]
  );
  const confirmedRiskyImport = confirmedRiskyImportForJson === jsonInput;
  const importDisabled =
    !preview?.ok ||
    saving ||
    Boolean(importReview?.requiresConfirmation && !confirmedRiskyImport);

  async function handleCopyPrompt() {
    try {
      await copyText(buildWorkItemExtractionPrompt(sourceText));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  async function handleImport() {
    if (!preview?.ok || importDisabled) {
      return;
    }

    setSaving(true);
    try {
      await onImportWorkItems(preview.draft);
      setSourceText("");
      setJsonInput("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} size="wide" title="JSON 직접 가져오기">
      <p className="mb-4 text-sm leading-6 text-zinc-600">
        이미 정리된 AI JSON을 직접 넣는 고급 경로입니다. 새 프로젝트에서 업무를
        찾고 고르는 흐름은 AI로 업무 후보 만들기를 우선 사용하세요.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="min-w-0">
          <span className="text-sm font-medium text-zinc-800">원자료</span>
          <textarea
            className="mt-2 min-h-72 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="경력 자료, 업무 메모, fact pack, 회고 문서 등을 붙여넣으세요."
            value={sourceText}
          />
        </label>
        <label className="min-w-0">
          <span className="text-sm font-medium text-zinc-800">AI 추출 JSON</span>
          <textarea
            className="mt-2 min-h-72 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-950 outline-none focus:border-blue-500"
            onChange={(event) => setJsonInput(event.target.value)}
            placeholder='{"projects":[{"key":"project-a","name":"프로젝트 A","periodNote":"","summary":""}],"workItems":[{"projectKey":"project-a","title":"업무명","startedAt":"2026-02-01","endedAt":"2026-02-28","periodNote":"월 단위 근거","priority":2,"riskLevel":"medium","score":{"resumeScore":80,"essayScore":78,"interviewScore":82,"overallScore":80,"evidenceConfidence":"B","useTier":"support","scoreReason":"근거가 있어 보조 소재로 활용 가능.","caution":"운영 수치는 확인 필요."}}]}'
            value={jsonInput}
          />
        </label>
      </div>
      <ImportReviewPanel
        confirmedRiskyImport={confirmedRiskyImport}
        importReview={importReview}
        onConfirmRiskyImport={(confirmed) =>
          setConfirmedRiskyImportForJson(confirmed ? jsonInput : null)
        }
        preview={preview}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
        <div className="text-sm text-zinc-600">
          {preview?.ok
            ? (importReview?.summary ??
              `${preview.draft.projects.length}개 프로젝트, ${preview.draft.workItems.length}개 업무를 가져옵니다.`)
            : preview?.message ?? "원자료를 구조화하는 프롬프트를 만들고, AI JSON을 붙여넣으세요."}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={() => void handleCopyPrompt()}>
            {copyState === "copied"
              ? "프롬프트 복사됨"
              : copyState === "failed"
                ? "복사 실패"
                : "자료 추출 프롬프트 복사"}
          </Button>
          <Button onClick={onClose}>취소</Button>
          <Button
            disabled={importDisabled}
            onClick={() => void handleImport()}
            variant="primary"
          >
            {saving ? "가져오는 중" : "가져오기"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function WorkItemProjectDiscoveryModal({
  onClose,
  onImportWorkItems,
  open,
  workItems,
  workProjects
}: {
  onClose: () => void;
  onImportWorkItems: (draft: WorkItemImportDraft) => Promise<void>;
  open: boolean;
  workItems: WorkItem[];
  workProjects: WorkProject[];
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [sourceText, setSourceText] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [copyState, setCopyState] = useState<
    "idle" | "listing-copied" | "extraction-copied" | "failed"
  >("idle");
  const [saving, setSaving] = useState(false);
  const [confirmedRiskyImportForJson, setConfirmedRiskyImportForJson] =
    useState<string | null>(null);
  const preview = useMemo(
    () => (jsonInput.trim() ? parseWorkItemExtractionJson(jsonInput) : null),
    [jsonInput]
  );
  const importReview = useMemo(
    () =>
      preview?.ok
        ? createWorkItemImportReview(
            preview.draft,
            workItems,
            workProjects
          )
        : null,
    [preview, workItems, workProjects]
  );
  const confirmedRiskyImport = confirmedRiskyImportForJson === jsonInput;
  const importDisabled =
    !preview?.ok ||
    saving ||
    Boolean(importReview?.requiresConfirmation && !confirmedRiskyImport);
  const stepTitles = ["에이전트 요청", "업무 선택", "JSON 가져오기"];
  const stepNumber = stepIndex + 1;

  async function handleCopyListingPrompt() {
    try {
      await copyText(buildWorkItemCandidateListingPrompt(sourceText));
      setCopyState("listing-copied");
    } catch {
      setCopyState("failed");
    }
  }

  async function handleCopyExtractionPrompt() {
    try {
      await copyText(
        buildSelectedWorkItemExtractionPrompt(sourceText, selectedCandidates)
      );
      setCopyState("extraction-copied");
    } catch {
      setCopyState("failed");
    }
  }

  async function handleImport() {
    if (!preview?.ok || importDisabled) {
      return;
    }

    setSaving(true);
    try {
      await onImportWorkItems(preview.draft);
      setSourceText("");
      setSelectedCandidates("");
      setJsonInput("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="wide"
      title={`AI로 업무 후보 만들기 ${stepNumber}/3`}
    >
      <div className="flex min-h-[560px] flex-col">
        <div className="mb-5 grid gap-2 border-b border-zinc-200 pb-4 sm:grid-cols-3">
          {stepTitles.map((stepTitle, index) => (
            <button
              aria-current={stepIndex === index ? "step" : undefined}
              className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                stepIndex === index
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
              key={stepTitle}
              onClick={() => setStepIndex(index)}
              type="button"
            >
              <span className="block text-xs font-medium">{index + 1}/3</span>
              <span className="mt-1 block font-semibold">{stepTitle}</span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1">
          {stepIndex === 0 ? (
            <section className="grid gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">
                  에이전트에게 찾을 범위를 지시합니다
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  프로젝트명, 참고할 계정명, 문서 위치, 커밋 범위처럼 에이전트가 탐색할 기준을 적습니다.
                </p>
                <p className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-800">
                  프로젝트를 미리 만들지 않아도 가져오기 단계에서 자동 생성됩니다.
                  다만 최종 JSON에 프로젝트명이 빠지면 임시 프로젝트나 기존 첫 프로젝트로
                  들어갈 수 있으므로, 요청란에 프로젝트명, 저장소, 문서, 커밋 범위를
                  직접 적어야 결과가 안정적입니다.
                </p>
              </div>
              <label className="min-w-0">
                <span className="text-sm font-medium text-zinc-800">
                  에이전트 요청
                </span>
                <textarea
                  className="mt-2 min-h-80 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
                  onChange={(event) => setSourceText(event.target.value)}
                  placeholder='예: "프로젝트명 또는 저장소명. 관련 정보는 커밋 기록, 이슈, 문서, 작업 메모를 참고해서 후보 업무를 정리."'
                  value={sourceText}
                />
              </label>
              <div className="flex justify-end">
                <Button onClick={() => void handleCopyListingPrompt()}>
                  {copyState === "listing-copied"
                    ? "후보 프롬프트 복사됨"
                    : copyState === "failed"
                      ? "복사 실패"
                      : "후보 리스팅 프롬프트 복사"}
                </Button>
              </div>
            </section>
          ) : null}

          {stepIndex === 1 ? (
            <section className="grid gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">
                  추가할 업무만 고릅니다
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  에이전트가 반환한 후보 목록에서 넣을 candidateKey와 업무명만 남깁니다.
                </p>
              </div>
              <label className="min-w-0">
                <span className="text-sm font-medium text-zinc-800">
                  선택한 업무
                </span>
                <textarea
                  className="mt-2 min-h-80 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
                  onChange={(event) => setSelectedCandidates(event.target.value)}
                  placeholder="1단계 후보 목록에서 추가할 candidateKey, 업무명, 제외할 항목 메모를 붙여넣으세요."
                  value={selectedCandidates}
                />
              </label>
              <div className="flex justify-end">
                <Button
                  disabled={selectedCandidates.trim().length === 0}
                  onClick={() => void handleCopyExtractionPrompt()}
                >
                  {copyState === "extraction-copied"
                    ? "추출 프롬프트 복사됨"
                    : copyState === "failed"
                      ? "복사 실패"
                      : "선택 업무 추출 프롬프트 복사"}
                </Button>
              </div>
            </section>
          ) : null}

          {stepIndex === 2 ? (
            <section className="grid gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">
                  최종 JSON을 붙여넣습니다
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  선택 업무 추출 결과만 붙여넣으면 프로젝트, 업무, 초기 점수를 함께 저장합니다.
                </p>
              </div>
              <label className="min-w-0">
                <span className="text-sm font-medium text-zinc-800">
                  선택 업무 JSON
                </span>
                <textarea
                  className="mt-2 min-h-80 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-950 outline-none focus:border-blue-500"
                  onChange={(event) => setJsonInput(event.target.value)}
                  placeholder='{"projects":[{"key":"project-a","name":"프로젝트 A","periodNote":"","summary":""}],"workItems":[{"projectKey":"project-a","title":"업무명","startedAt":"2026-02-01","endedAt":"2026-02-28","periodNote":"월 단위 근거","priority":2,"riskLevel":"medium","score":{"resumeScore":80,"essayScore":78,"interviewScore":82,"overallScore":80,"evidenceConfidence":"B","useTier":"support","scoreReason":"근거가 있어 보조 소재로 활용 가능.","caution":"운영 수치는 확인 필요."}}]}'
                  value={jsonInput}
                />
              </label>
              <div className="text-sm text-zinc-600">
                {preview?.ok
                  ? (importReview?.summary ??
                    `${preview.draft.projects.length}개 프로젝트, ${preview.draft.workItems.length}개 업무를 가져옵니다.`)
                  : preview?.message ?? "선택 업무 JSON을 붙여넣으세요."}
              </div>
              <ImportReviewPanel
                confirmedRiskyImport={confirmedRiskyImport}
                importReview={importReview}
                onConfirmRiskyImport={(confirmed) =>
                  setConfirmedRiskyImportForJson(confirmed ? jsonInput : null)
                }
                preview={preview}
              />
            </section>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <div className="text-sm text-zinc-500">{stepNumber}/3 단계</div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {stepIndex < 2 ? (
              <>
                <Button
                  disabled={stepIndex === 0}
                  onClick={() =>
                    setStepIndex((current) => Math.max(0, current - 1))
                  }
                >
                  이전
                </Button>
                <Button
                  onClick={() =>
                    setStepIndex((current) => Math.min(2, current + 1))
                  }
                  variant="primary"
                >
                  다음
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() =>
                    setStepIndex((current) => Math.max(0, current - 1))
                  }
                >
                  이전
                </Button>
                <Button
                  disabled={importDisabled}
                  onClick={() => void handleImport()}
                  variant="primary"
                >
                  {saving ? "가져오는 중" : "선택 업무 가져오기"}
                </Button>
              </>
            )}
            <Button onClick={onClose}>취소</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

type WorkItemImportReview = {
  projectRows: Array<{
    key: string;
    name: string;
    status: "auto-created" | "matched" | "new";
    workItemCount: number;
  }>;
  requiresConfirmation: boolean;
  summary: string;
  warnings: string[];
};

function ImportReviewPanel({
  confirmedRiskyImport,
  importReview,
  onConfirmRiskyImport,
  preview
}: {
  confirmedRiskyImport: boolean;
  importReview: WorkItemImportReview | null;
  onConfirmRiskyImport: (confirmed: boolean) => void;
  preview: WorkItemImportParseResult | null;
}) {
  if (!preview?.ok || !importReview?.warnings.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-900">
      <div className="font-semibold">프로젝트 매핑 확인</div>
      {importReview.projectRows.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-md border border-amber-200 bg-white/70">
          <div className="grid grid-cols-[minmax(0,1fr)_88px_72px] gap-2 border-b border-amber-100 px-2 py-1.5 text-xs font-semibold text-amber-950">
            <span>프로젝트</span>
            <span>상태</span>
            <span className="text-right">업무</span>
          </div>
          {importReview.projectRows.map((row) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_88px_72px] gap-2 border-b border-amber-100 px-2 py-1.5 last:border-b-0"
              key={row.key}
            >
              <span className="min-w-0 break-words text-amber-950">
                {row.name}
                <span className="ml-1 text-xs text-amber-700">({row.key})</span>
              </span>
              <span>{formatImportProjectStatus(row.status)}</span>
              <span className="text-right">{row.workItemCount}개</span>
            </div>
          ))}
        </div>
      ) : null}
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {importReview.warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
      <label className="mt-3 flex items-start gap-2 text-sm font-medium">
        <input
          checked={confirmedRiskyImport}
          className="mt-1"
          onChange={(event) => onConfirmRiskyImport(event.target.checked)}
          type="checkbox"
        />
        <span>위 항목을 확인했고 이대로 가져옵니다.</span>
      </label>
    </div>
  );
}

function createWorkItemImportReview(
  draft: WorkItemImportDraft,
  workItems: WorkItem[],
  workProjects: WorkProject[]
): WorkItemImportReview {
  const warnings: string[] = [];
  const projectByKey = new Map(
    draft.projects.map((project) => [project.key, project])
  );
  const existingProjectByName = new Map(
    workProjects.map((project) => [normalizeImportText(project.name), project])
  );
  const autoCreatedProjectKeys = new Set(draft.autoCreatedProjectKeys);
  const importedProjectNames = draft.projects.map((project) => project.name);
  const targetProjectLabels = new Set<string>();
  const duplicatePayloadKeys = new Set<string>();
  const seenPayloadKeys = new Set<string>();
  const existingDuplicateTitles = new Set<string>();
  const unmappedProjectKeys = new Set<string>();
  const workItemCountByProjectKey = new Map<string, number>();

  for (const project of draft.projects) {
    if (isGenericImportedProject(project.key, project.name)) {
      warnings.push(
        "프로젝트명이 없어서 임시 프로젝트명으로 해석됩니다. 제3의 프로젝트라면 JSON의 projects.name과 workItems.projectKey를 먼저 명확히 넣는 편이 안전합니다."
      );
      break;
    }
  }

  for (const item of draft.workItems) {
    const project = projectByKey.get(item.projectKey);

    if (!project) {
      unmappedProjectKeys.add(item.projectKey);
      targetProjectLabels.add("첫 번째 가져오기/기존 프로젝트");
    } else {
      targetProjectLabels.add(project.name);
    }
    workItemCountByProjectKey.set(
      item.projectKey,
      (workItemCountByProjectKey.get(item.projectKey) ?? 0) + 1
    );

    const payloadKey = `${normalizeImportText(
      project?.key ?? item.projectKey
    )}::${normalizeImportText(item.title)}`;
    if (seenPayloadKeys.has(payloadKey)) {
      duplicatePayloadKeys.add(item.title);
    }
    seenPayloadKeys.add(payloadKey);

    const existingProject = project
      ? existingProjectByName.get(normalizeImportText(project.name))
      : undefined;
    if (!existingProject) {
      continue;
    }

    const duplicateExists = workItems.some(
      (workItem) =>
        workItem.projectId === existingProject.id &&
        normalizeImportText(workItem.title) === normalizeImportText(item.title)
    );
    if (duplicateExists) {
      existingDuplicateTitles.add(item.title);
    }
  }

  if (unmappedProjectKeys.size > 0) {
    warnings.push(
      `${unmappedProjectKeys.size}개 projectKey가 projects 목록과 연결되지 않습니다. 저장하면 첫 번째 가져오기 프로젝트 또는 기존 첫 프로젝트로 들어갈 수 있습니다.`
    );
  }

  if (autoCreatedProjectKeys.size > 0) {
    warnings.push(
      `AI 응답의 projectKey 기준으로 새 프로젝트가 자동 생성됩니다: ${formatShortList([
        ...autoCreatedProjectKeys
      ])}`
    );
  }

  if (duplicatePayloadKeys.size > 0) {
    warnings.push(
      `붙여넣은 JSON 안에 같은 프로젝트/같은 업무명이 중복됩니다: ${formatShortList([
        ...duplicatePayloadKeys
      ])}`
    );
  }

  if (existingDuplicateTitles.size > 0) {
    warnings.push(
      `이미 같은 프로젝트에 있는 업무명입니다. 중복 저장될 수 있습니다: ${formatShortList([
        ...existingDuplicateTitles
      ])}`
    );
  }

  return {
    projectRows: draft.projects.map((project) => {
      const existingProject = existingProjectByName.get(
        normalizeImportText(project.name)
      );
      return {
        key: project.key,
        name: project.name,
        status: autoCreatedProjectKeys.has(project.key)
          ? "auto-created"
          : existingProject
            ? "matched"
            : "new",
        workItemCount: workItemCountByProjectKey.get(project.key) ?? 0
      };
    }),
    requiresConfirmation: warnings.length > 0,
    summary: formatImportSummary(
      draft.workItems.length,
      importedProjectNames,
      [...targetProjectLabels]
    ),
    warnings
  };
}

function formatImportProjectStatus(
  status: WorkItemImportReview["projectRows"][number]["status"]
) {
  const labels = {
    "auto-created": "자동 생성",
    matched: "기존 매칭",
    new: "신규"
  } satisfies Record<
    WorkItemImportReview["projectRows"][number]["status"],
    string
  >;

  return labels[status];
}

function formatImportSummary(
  workItemCount: number,
  importedProjectNames: string[],
  targetProjectLabels: string[]
) {
  const uniqueProjectNames = Array.from(
    new Set(importedProjectNames.filter((name) => name.trim()))
  );
  const uniqueTargets = Array.from(
    new Set(targetProjectLabels.filter((name) => name.trim()))
  );
  const projects = uniqueProjectNames.length > 0 ? uniqueProjectNames : uniqueTargets;

  if (projects.length === 0) {
    return `${workItemCount}개 업무를 프로젝트 확인 필요 상태로 가져옵니다.`;
  }

  if (projects.length === 1) {
    return `${workItemCount}개 업무를 "${projects[0]}" 프로젝트에 추가합니다.`;
  }

  return `${projects.length}개 프로젝트(${formatShortList(
    projects
  )})로 ${workItemCount}개 업무를 나누어 추가합니다.`;
}

function isGenericImportedProject(key: string, name: string) {
  const normalizedKey = normalizeImportText(key);
  const normalizedName = normalizeImportText(name);

  return (
    normalizedKey === "imported-project" ||
    normalizedName === "imported-project" ||
    normalizedName === "가져온프로젝트"
  );
}

function normalizeImportText(value: string) {
  return value.trim().replace(/\s+/g, "").toLocaleLowerCase();
}

function formatShortList(values: string[]) {
  const visibleValues = values.filter((value) => value.trim()).slice(0, 3);
  const suffix = values.length > visibleValues.length ? " 외" : "";

  return `${visibleValues.join(", ")}${suffix}`;
}

type WorkItemScoringScope = "all" | "project" | "selected";
type WorkItemScoringGroup = ReturnType<typeof groupWorkItemsByProject>[number];

function getDefaultScoringScope(scoringGroups: WorkItemScoringGroup[]) {
  return scoringGroups.length > 1 ? "project" : "all";
}

function getDefaultSelectedWorkItemIds(sortedWorkItems: WorkItem[]) {
  const unscoredItems = sortedWorkItems.filter((item) => !item.score);
  const defaultSelectedItems =
    unscoredItems.length > 0 ? unscoredItems : sortedWorkItems.slice(0, 5);

  return defaultSelectedItems.map((item) => item.id);
}

function WorkItemScoringModal({
  onClose,
  onImportWorkItemScores,
  open,
  workItems,
  workProjects
}: {
  onClose: () => void;
  onImportWorkItemScores: (
    updates: WorkItemScoreImportUpdate[]
  ) => Promise<void>;
  open: boolean;
  workItems: WorkItem[];
  workProjects: WorkProject[];
}) {
  const scoringGroups = useMemo(
    () => groupWorkItemsByProject(workItems, workProjects),
    [workItems, workProjects]
  );
  const sortedWorkItems = useMemo(
    () => [...workItems].sort(compareWorkItemsByGeneralScore),
    [workItems]
  );
  const [scope, setScope] = useState<WorkItemScoringScope>(() =>
    getDefaultScoringScope(scoringGroups)
  );
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => scoringGroups[0]?.id ?? ""
  );
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<string[]>(() =>
    getDefaultSelectedWorkItemIds(sortedWorkItems)
  );
  const [jsonInput, setJsonInput] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [saving, setSaving] = useState(false);
  const unscoredWorkItemIds = useMemo(
    () => sortedWorkItems.filter((item) => !item.score).map((item) => item.id),
    [sortedWorkItems]
  );
  const preview = useMemo(
    () => (jsonInput.trim() ? parseWorkItemScoringJson(jsonInput) : null),
    [jsonInput]
  );
  const selectedProjectGroup = useMemo(
    () =>
      scoringGroups.find((group) => group.id === selectedProjectId) ??
      scoringGroups[0],
    [scoringGroups, selectedProjectId]
  );
  const projectLabelsByWorkItemId = useMemo(() => {
    const labels = new Map<string, string>();

    for (const group of scoringGroups) {
      for (const item of group.items) {
        labels.set(item.id, group.label);
      }
    }

    return labels;
  }, [scoringGroups]);
  const targetWorkItems = useMemo(() => {
    if (scope === "project") {
      return selectedProjectGroup?.items ?? [];
    }

    if (scope === "selected") {
      const selectedIds = new Set(selectedWorkItemIds);

      return sortedWorkItems.filter((item) => selectedIds.has(item.id));
    }

    return sortedWorkItems;
  }, [scope, selectedProjectGroup, selectedWorkItemIds, sortedWorkItems]);
  const scoredCount = targetWorkItems.filter((item) => item.score).length;
  const scopeLabel =
    scope === "project"
      ? `프로젝트별 평가 - ${selectedProjectGroup?.label ?? "프로젝트 미선택"}`
      : scope === "selected"
        ? `선택 업무 평가 - ${targetWorkItems.length}개`
        : "전체 업무 평가";
  const scoringPrompt = useMemo(
    () =>
      buildWorkItemScoringPrompt(targetWorkItems, {
        scopeLabel,
        totalWorkItemCount: workItems.length
      }),
    [scopeLabel, targetWorkItems, workItems.length]
  );

  function resetCopyState() {
    setCopyState("idle");
  }

  async function handleCopyPrompt() {
    try {
      await copyText(scoringPrompt);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  function toggleSelectedWorkItem(id: string) {
    setSelectedWorkItemIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
    resetCopyState();
  }

  async function handleImport() {
    if (!preview?.ok || saving) {
      return;
    }

    setSaving(true);
    try {
      await onImportWorkItemScores(preview.updates);
      setJsonInput("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} size="wide" title="점수 평가">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="text-sm font-semibold text-zinc-950">평가 범위</h3>
          <div
            aria-label="평가 범위"
            className="mt-3 grid gap-2 sm:grid-cols-3"
            role="group"
          >
            {[
              { count: workItems.length, label: "전체", value: "all" },
              {
                count: selectedProjectGroup?.items.length ?? 0,
                label: "프로젝트별",
                value: "project"
              },
              {
                count: selectedWorkItemIds.length,
                label: "선택 업무",
                value: "selected"
              }
            ].map((option) => (
              <button
                aria-pressed={scope === option.value}
                className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                  scope === option.value
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
                key={option.value}
                onClick={() => {
                  setScope(option.value as WorkItemScoringScope);
                  resetCopyState();
                }}
                type="button"
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="mt-1 block font-mono text-xs">
                  {option.count}개
                </span>
              </button>
            ))}
          </div>
          {scope === "project" ? (
            <label className="mt-4 block min-w-0">
              <span className="text-sm font-medium text-zinc-800">
                프로젝트 선택
              </span>
              <select
                className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
                onChange={(event) => {
                  setSelectedProjectId(event.target.value);
                  resetCopyState();
                }}
                value={selectedProjectGroup?.id ?? ""}
              >
                {scoringGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label} ({group.items.length}개)
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {scope === "selected" ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-800">
                  업무 선택
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setSelectedWorkItemIds(unscoredWorkItemIds);
                      resetCopyState();
                    }}
                    disabled={unscoredWorkItemIds.length === 0}
                    size="sm"
                  >
                    미평가 선택
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedWorkItemIds(
                        sortedWorkItems.map((item) => item.id)
                      );
                      resetCopyState();
                    }}
                    size="sm"
                  >
                    전체 선택
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedWorkItemIds([]);
                      resetCopyState();
                    }}
                    size="sm"
                  >
                    해제
                  </Button>
                </div>
              </div>
              <div className="mt-2 max-h-64 overflow-auto rounded-md border border-zinc-200 bg-white">
                {sortedWorkItems.map((item) => (
                  <label
                    className="flex cursor-pointer items-start gap-2 border-b border-zinc-100 px-3 py-2 last:border-b-0"
                    key={item.id}
                  >
                    <input
                      checked={selectedWorkItemIds.includes(item.id)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600"
                      onChange={() => toggleSelectedWorkItem(item.id)}
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-medium leading-5 text-zinc-900">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block break-words text-xs text-zinc-500">
                        {projectLabelsByWorkItemId.get(item.id) ??
                          formatWorkSystem(item.system)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="font-mono text-lg font-semibold text-zinc-950">
                {targetWorkItems.length}
              </div>
              <div className="text-xs text-zinc-500">대상 업무</div>
            </div>
            <div>
              <div className="font-mono text-lg font-semibold text-zinc-950">
                {scoredCount}
              </div>
              <div className="text-xs text-zinc-500">점수 있음</div>
            </div>
            <div>
              <div className="font-mono text-lg font-semibold text-zinc-950">
                {Math.max(targetWorkItems.length - scoredCount, 0)}
              </div>
              <div className="text-xs text-zinc-500">미평가</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            선택한 범위만 경력기술서, 자기소개서, 면접 활용도 기준으로 평가합니다.
            다른 업무 점수는 그대로 둡니다.
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            복사 프롬프트 예상 길이: {scoringPrompt.length.toLocaleString("ko-KR")}자
          </p>
          <Button
            className="mt-4"
            disabled={targetWorkItems.length === 0}
            onClick={() => void handleCopyPrompt()}
          >
            {copyState === "copied"
              ? "프롬프트 복사됨"
              : copyState === "failed"
                ? "복사 실패"
                : "평가 프롬프트 복사"}
          </Button>
        </div>
        <label className="min-w-0">
          <span className="text-sm font-medium text-zinc-800">AI 평가 JSON</span>
          <textarea
            className="mt-2 min-h-80 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-950 outline-none focus:border-blue-500"
            onChange={(event) => setJsonInput(event.target.value)}
            placeholder='{"items":[{"id":"work-id","score":{"resumeScore":88,"essayScore":84,"interviewScore":90,"overallScore":87,"evidenceConfidence":"A","useTier":"main","scoreReason":"채용 문서 활용도가 높음.","caution":"확인 전 수치는 피할 것."}}],"rankingNotes":[{"id":"work-id","whyThisRank":"운영 안정성 소재로 강함."}],"scoringAssumptions":["지원 직무 기준"],"needsUserConfirmation":[{"id":"work-id","question":"운영 반영 후 지표를 확인했나요?"}]}'
            value={jsonInput}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
        <div className="text-sm text-zinc-600">
          {preview?.ok
            ? `${preview.updates.length}개 업무 점수를 반영합니다.`
            : preview?.message ?? "평가 프롬프트를 복사하고 AI JSON을 붙여넣으세요."}
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>취소</Button>
          <Button
            disabled={!preview?.ok || saving}
            onClick={() => void handleImport()}
            variant="primary"
          >
            {saving ? "반영 중" : "점수 반영"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ProjectWorkGroup({
  items,
  onSelectWorkItem,
  projectLabel,
  projectSourceLabel,
  selectedWorkItemId
}: {
  items: WorkItem[];
  onSelectWorkItem: (id: string) => void;
  projectLabel: string;
  projectSourceLabel: string | null;
  selectedWorkItemId: string | null;
}) {
  const priorityCounts = workPriorities
    .map((priority) => ({
      count: items.filter((item) => item.priority === priority).length,
      priority
    }))
    .filter(({ count }) => count > 0);

  return (
    <section
      aria-label={`${projectLabel} 업무 목록`}
      className="rounded-md border border-zinc-200 bg-zinc-50 p-2"
    >
      <div className="flex items-start justify-between gap-2 px-1 pb-2">
        <div className="min-w-0">
          <h4 className="break-words text-xs font-semibold leading-4 text-zinc-700">
            {projectLabel}
          </h4>
          {projectSourceLabel ? (
            <p className="mt-1 break-words text-[11px] leading-4 text-zinc-500">
              소속/맥락: {projectSourceLabel}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-1">
            {priorityCounts.map(({ count, priority }) => (
              <span
                className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-500"
                key={priority}
              >
                P{priority} {count}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs text-zinc-500">
          {items.length}
        </span>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <WorkItemListCard
            item={item}
            key={item.id}
            onSelectWorkItem={onSelectWorkItem}
            selected={item.id === selectedWorkItemId}
          />
        ))}
      </div>
    </section>
  );
}

function WorkItemListCard({
  item,
  onSelectWorkItem,
  selected
}: {
  item: WorkItem;
  onSelectWorkItem: (id: string) => void;
  selected: boolean;
}) {
  return (
    <button
      className={`rounded-md border p-3 text-left transition ${
        selected
          ? "border-blue-500 bg-white shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
      onClick={() => onSelectWorkItem(item.id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words text-sm font-medium leading-5 text-zinc-950">
          {item.title}
        </span>
        <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500">
          {priorityLabels[item.priority].split(" ")[0]}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
            item.startedAt || item.endedAt
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          처리시점: {formatWorkItemPeriod(item)}
        </span>
      </div>
      <p className="mt-2 break-words text-xs leading-5 text-zinc-500">
        근거 메모: {item.periodNote}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.categories.slice(0, 3).map((category) => (
          <CategoryTag
            categoryColors={item.categoryColors}
            key={category}
            label={category}
            size="sm"
          />
        ))}
      </div>
    </button>
  );
}

function WorkItemPanel({
  onDeleteWorkItem,
  onSaveWorkItem,
  projectsById,
  selectedWorkItem,
  workProjects
}: {
  onDeleteWorkItem?: (id: string) => Promise<void>;
  onSaveWorkItem: (workItem: WorkItem) => Promise<WorkItem>;
  projectsById: Map<string, WorkProject>;
  selectedWorkItem: WorkItem;
  workProjects: WorkProject[];
}) {
  const [draft, setDraft] = useState(selectedWorkItem);
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [deleteState, setDeleteState] = useState<"idle" | "deleting">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(selectedWorkItem),
    [draft, selectedWorkItem]
  );

  async function handleSave() {
    if (saveState === "saving") {
      return;
    }

    setSaveState("saving");
    try {
      const savedWorkItem = await onSaveWorkItem(draft);
      setDraft(savedWorkItem);
      setMode("read");
    } finally {
      setSaveState("idle");
    }
  }

  async function handleDelete() {
    if (!onDeleteWorkItem || deleteState === "deleting") {
      return;
    }

    const confirmed = window.confirm(
      "이 업무를 삭제할까요? 연결된 경력기술서 문구도 함께 삭제됩니다."
    );

    if (!confirmed) {
      return;
    }

    setDeleteState("deleting");
    try {
      await onDeleteWorkItem(selectedWorkItem.id);
    } finally {
      setDeleteState("idle");
    }
  }

  if (mode === "read") {
    return (
      <ReadOnlyWorkItem
        deleteState={deleteState}
        onDelete={onDeleteWorkItem ? handleDelete : null}
        onEdit={() => setMode("edit")}
        project={projectsById.get(selectedWorkItem.projectId)}
        selectedWorkItem={selectedWorkItem}
      />
    );
  }

  return (
    <WorkItemEditForm
      dirty={dirty}
      draft={draft}
      onCancel={() => {
        setDraft(selectedWorkItem);
        setMode("read");
      }}
      onChange={setDraft}
      onSave={handleSave}
      saveState={saveState}
      workProjects={workProjects}
    />
  );
}

function ReadOnlyWorkItem({
  deleteState,
  onDelete,
  onEdit,
  project,
  selectedWorkItem
}: {
  deleteState: "idle" | "deleting";
  onDelete: (() => void) | null;
  onEdit: () => void;
  project: WorkProject | undefined;
  selectedWorkItem: WorkItem;
}) {
  return (
    <article className="min-w-0 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CategoryTagList workItem={selectedWorkItem} />
          <h3 className="mt-4 break-words text-2xl font-semibold text-zinc-950">
            {selectedWorkItem.title}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">
              {project?.name ?? formatWorkSystem(selectedWorkItem.system)}
            </Badge>
            {project ? (
              <Badge tone="neutral">소속/맥락: {formatProjectContext(project)}</Badge>
            ) : null}
            <Badge tone="neutral">{formatWorkSystem(selectedWorkItem.system)}</Badge>
            <Badge tone="accent">{priorityLabels[selectedWorkItem.priority]}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onEdit} variant="primary">
            수정
          </Button>
          {onDelete ? (
            <Button
              disabled={deleteState === "deleting"}
              onClick={onDelete}
              variant="softDanger"
            >
              {deleteState === "deleting" ? "삭제 중" : "삭제"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-500">처리시점</p>
          <p className="mt-1 break-words text-lg font-semibold text-zinc-950">
            {formatWorkItemPeriod(selectedWorkItem)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-500">처리 기간 데이터</p>
          <p className="mt-1 break-words font-mono text-sm text-zinc-700">
            {formatWorkItemDateRange(selectedWorkItem)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TechnologyTagRail values={selectedWorkItem.technologies} />
      </div>

      <WorkItemScorePanel workItem={selectedWorkItem} />

      <div className="mt-7 divide-y divide-zinc-200 border-y border-zinc-200">
        <ReportSection label="문제/배경" value={selectedWorkItem.problem} />
        <ReportSection label="내 역할" value={selectedWorkItem.role} />
        <ReportList label="주요 행동" values={selectedWorkItem.actions} />
        <ReportSection label="어려웠던 점" value={selectedWorkItem.difficulties.join("\n")} />
        <ReportSection label="해결 방식" value={selectedWorkItem.solution} />
        <ReportSection label="결과" value={selectedWorkItem.result} />
        <ReportSection
          label="근거 메모"
          value={selectedWorkItem.periodNote}
        />
        <ReportList label="확인 필요 수치" values={selectedWorkItem.metricsToVerify} />
      </div>
    </article>
  );
}

function WorkItemScorePanel({ workItem }: { workItem: WorkItem }) {
  const score = workItem.score;

  if (!score) {
    return (
      <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <h4 className="text-sm font-semibold text-zinc-950">활용도 점수</h4>
        <p className="mt-2 text-sm text-zinc-500">
          아직 경력기술서, 자기소개서, 면접 활용도 점수가 없습니다.
        </p>
      </div>
    );
  }

  const confirmationQuestions = score.confirmationQuestions ?? [];
  const scoringAssumptions = score.scoringAssumptions ?? [];

  return (
    <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">활용도 점수</h4>
          <p className="mt-1 text-xs text-zinc-500">
            경력기술서, 자기소개서, 면접에서 이 업무를 얼마나 안전하게 활용할지 판단합니다.
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            점수는 업무 난이도나 절대 품질이 아니라 채용 문서 활용도입니다.
            evidenceConfidence는 근거와 과장 위험의 안정성입니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{score.useTier}</Badge>
          <Badge tone="neutral">근거 {score.evidenceConfidence}</Badge>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <ScoreTile label="경력" value={score.resumeScore} />
        <ScoreTile label="자소서" value={score.essayScore} />
        <ScoreTile label="면접" value={score.interviewScore} />
        <ScoreTile label="종합" value={score.overallScore} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ScoreNote label="점수 근거" value={score.scoreReason} />
        <ScoreNote label="주의점" value={score.caution} />
        <ScoreNote label="순위 판단" value={score.rankingNote} />
        <ScoreList label="평가 가정" values={scoringAssumptions} />
        <div className="lg:col-span-2">
          <ScoreList label="사용자 확인 질문" values={confirmationQuestions} />
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold text-zinc-950">
        {value}
      </div>
    </div>
  );
}

function ScoreNote({
  label,
  value
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <p className="mt-2 text-sm leading-6 text-zinc-800">
        {value?.trim() || "없음"}
      </p>
    </div>
  );
}

function ScoreList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      {values.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-sm leading-6 text-zinc-800">
          {values.map((value) => (
            <li key={value}>- {value}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">없음</p>
      )}
    </div>
  );
}

function WorkItemEditForm({
  dirty,
  draft,
  onCancel,
  onChange,
  onSave,
  saveState,
  workProjects
}: {
  dirty: boolean;
  draft: WorkItem;
  onCancel: () => void;
  onChange: (workItem: WorkItem) => void;
  onSave: () => void;
  saveState: "idle" | "saving";
  workProjects: WorkProject[];
}) {
  const projectsById = useMemo(
    () => new Map(workProjects.map((project) => [project.id, project])),
    [workProjects]
  );

  return (
    <article className="min-w-0 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CategoryTagEditor draft={draft} onChange={onChange} />
          <h3 className="mt-4 break-words text-2xl font-semibold text-zinc-950">
            업무 수정
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onCancel}>취소</Button>
          <Button
            disabled={!dirty || saveState === "saving"}
            onClick={onSave}
            variant="primary"
          >
            업무 저장
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <TextInput
          label="업무명"
          onChange={(title) => onChange({ ...draft, title })}
          value={draft.title}
        />
        {workProjects.length > 0 ? (
          <SelectInput
            getOptionLabel={(projectId) =>
              projectsById.get(projectId)?.name ?? projectId
            }
            label="프로젝트"
            onChange={(projectId) => {
              const project = projectsById.get(projectId);
              onChange({
                ...draft,
                projectId,
                system: project?.system ?? draft.system
              });
            }}
            options={workProjects.map((project) => project.id)}
            value={draft.projectId}
          />
        ) : (
          <TextInput
            label="시스템"
            onChange={(system) =>
              onChange({ ...draft, system: system as WorkSystem })
            }
            value={draft.system}
          />
        )}
        <TextInput
          label="근거 메모"
          onChange={(periodNote) => onChange({ ...draft, periodNote })}
          value={draft.periodNote}
        />
        <DateInput
          label="처리 시작일"
          onChange={(startedAt) => onChange({ ...draft, startedAt })}
          value={draft.startedAt ?? ""}
        />
        <DateInput
          label="처리 종료일"
          onChange={(endedAt) => onChange({ ...draft, endedAt })}
          value={draft.endedAt ?? ""}
        />
        <SelectInput
          getOptionLabel={(priority) =>
            priorityLabels[Number(priority) as WorkPriority]
          }
          label="업무 중요도"
          onChange={(priority) =>
            onChange({ ...draft, priority: Number(priority) as WorkPriority })
          }
          options={workPriorities.map(String)}
          value={String(draft.priority)}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <TextAreaInput
          label="문제/배경"
          onChange={(problem) => onChange({ ...draft, problem })}
          value={draft.problem}
        />
        <TextAreaInput
          label="내 역할"
          onChange={(role) => onChange({ ...draft, role })}
          value={draft.role}
        />
        <TextAreaInput
          label="해결 방식"
          onChange={(solution) => onChange({ ...draft, solution })}
          value={draft.solution}
        />
        <TextAreaInput
          label="결과"
          onChange={(result) => onChange({ ...draft, result })}
          value={draft.result}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <TextAreaInput
          label="확인 필요 수치"
          onChange={(metricsToVerify) =>
            onChange({ ...draft, metricsToVerify: splitLines(metricsToVerify) })
          }
          value={draft.metricsToVerify.join("\n")}
        />
        <TextAreaInput
          label="근거 reference"
          onChange={(evidenceRefs) =>
            onChange({ ...draft, evidenceRefs: splitLines(evidenceRefs) })
          }
          value={draft.evidenceRefs.join("\n")}
        />
        <TextAreaInput
          label="사용 기술"
          onChange={(technologies) =>
            onChange({ ...draft, technologies: splitLines(technologies) })
          }
          value={draft.technologies.join("\n")}
        />
      </div>

      <WorkItemScoreEditor draft={draft} onChange={onChange} />
    </article>
  );
}

function WorkItemScoreEditor({
  draft,
  onChange
}: {
  draft: WorkItem;
  onChange: (workItem: WorkItem) => void;
}) {
  const score = draft.score;

  function commitScore(nextScore: WorkItemScore | undefined) {
    onChange({
      ...draft,
      resumeFit: nextScore ? createResumeFitFromScore(nextScore) : undefined,
      score: nextScore
    });
  }

  function updateScore(
    patch: Partial<WorkItemScore>,
    options: { recalculateOverall?: boolean } = {}
  ) {
    const base = score ?? createDefaultWorkItemScore();
    const nextScore = {
      ...base,
      ...patch
    };

    if (options.recalculateOverall) {
      nextScore.overallScore = calculateOverallScore(nextScore);
    }

    commitScore(nextScore);
  }

  if (!score) {
    return (
      <section className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-zinc-950">활용도 점수</h4>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              새 업무에 경력기술서, 자기소개서, 면접 활용도 점수를 직접 입력할 수 있습니다.
            </p>
          </div>
          <Button onClick={() => commitScore(createDefaultWorkItemScore())}>
            점수 추가
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">활용도 점수</h4>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            점수는 업무 난이도가 아니라 채용 문서에서 안전하게 활용할 수 있는 정도입니다.
          </p>
        </div>
        <Button onClick={() => commitScore(undefined)}>점수 제거</Button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NumberInput
          label="경력 점수"
          onChange={(resumeScore) =>
            updateScore({ resumeScore }, { recalculateOverall: true })
          }
          value={score.resumeScore}
        />
        <NumberInput
          label="자소서 점수"
          onChange={(essayScore) =>
            updateScore({ essayScore }, { recalculateOverall: true })
          }
          value={score.essayScore}
        />
        <NumberInput
          label="면접 점수"
          onChange={(interviewScore) =>
            updateScore({ interviewScore }, { recalculateOverall: true })
          }
          value={score.interviewScore}
        />
        <NumberInput
          label="종합 점수"
          onChange={(overallScore) => updateScore({ overallScore })}
          value={score.overallScore}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SelectInput
          getOptionLabel={(value) => value}
          label="근거 신뢰도"
          onChange={(evidenceConfidence) =>
            updateScore({
              evidenceConfidence:
                evidenceConfidence as WorkItemEvidenceConfidence
            })
          }
          options={workItemEvidenceConfidenceLevels}
          value={score.evidenceConfidence}
        />
        <SelectInput
          getOptionLabel={(value) => value}
          label="활용 등급"
          onChange={(useTier) =>
            updateScore({ useTier: useTier as WorkItemUseTier })
          }
          options={workItemUseTiers}
          value={score.useTier}
        />
        <TextAreaInput
          label="점수 근거"
          onChange={(scoreReason) => updateScore({ scoreReason })}
          value={score.scoreReason}
        />
        <TextAreaInput
          label="주의점"
          onChange={(caution) => updateScore({ caution })}
          value={score.caution}
        />
        <TextAreaInput
          label="순위 판단"
          onChange={(rankingNote) => updateScore({ rankingNote })}
          value={score.rankingNote ?? ""}
        />
        <TextAreaInput
          label="평가 가정"
          onChange={(scoringAssumptions) =>
            updateScore({
              scoringAssumptions: splitLines(scoringAssumptions)
            })
          }
          value={(score.scoringAssumptions ?? []).join("\n")}
        />
        <div className="lg:col-span-2">
          <TextAreaInput
            label="사용자 확인 질문"
            onChange={(confirmationQuestions) =>
              updateScore({
                confirmationQuestions: splitLines(confirmationQuestions)
              })
            }
            value={(score.confirmationQuestions ?? []).join("\n")}
          />
        </div>
      </div>
    </section>
  );
}

function CategoryTagList({ workItem }: { workItem: WorkItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      {workItem.categories.length === 0 ? (
        <span className="text-sm text-zinc-500">분류 태그 없음</span>
      ) : (
        workItem.categories.map((category) => (
          <CategoryTag
            categoryColors={workItem.categoryColors}
            key={category}
            label={category}
          />
        ))
      )}
    </div>
  );
}

function CategoryTagEditor({
  draft,
  onChange
}: {
  draft: WorkItem;
  onChange: (workItem: WorkItem) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [tagEditInput, setTagEditInput] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [newTagColor, setNewTagColor] = useState(() =>
    getUnusedTagColorIndex(draft.categories, draft.categoryColors)
  );
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [paletteTag, setPaletteTag] = useState<string | null>(null);
  const [draggedTag, setDraggedTag] = useState<string | null>(null);
  const [dropTargetTag, setDropTargetTag] = useState<TagDropTarget | null>(null);
  const previewCategories =
    draggedTag && dropTargetTag
      ? moveItemToPosition(
          draft.categories,
          draggedTag,
          dropTargetTag.tag,
          dropTargetTag.position
        )
      : draft.categories;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (editorRef.current?.contains(event.target as Node)) {
        return;
      }

      if (editingTag) {
        renameTag(editingTag, { closeOnDuplicate: true });
      }

      if (creatingTag) {
        if (tagInput.trim()) {
          addTag();
        } else {
          cancelCreateTag();
        }
      }

      setPaletteTag(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  });

  function startCreateTag() {
    setCreatingTag(true);
    setEditingTag(null);
    setPaletteTag(null);
    setTagInput("");
    setNewTagColor(getUnusedTagColorIndex(draft.categories, draft.categoryColors));
  }

  function cancelCreateTag() {
    setCreatingTag(false);
    setPaletteTag(null);
    setTagInput("");
  }

  function addTag() {
    const tag = tagInput.trim();

    if (!tag || draft.categories.includes(tag)) {
      return;
    }

    onChange({
      ...draft,
      categories: [...draft.categories, tag],
      categoryColors: {
        ...draft.categoryColors,
        [tag]: newTagColor
      }
    });
    setTagInput("");
    setCreatingTag(false);
    setNewTagColor(
      getUnusedTagColorIndex([...draft.categories, tag], {
        ...draft.categoryColors,
        [tag]: newTagColor
      })
    );
  }

  function updateTagColor(tag: string, colorIndex: number) {
    onChange({
      ...draft,
      categoryColors: {
        ...draft.categoryColors,
        [tag]: colorIndex
      }
    });
  }

  function removeTag(tag: string) {
    const nextColors = { ...(draft.categoryColors ?? {}) };
    delete nextColors[tag];

    onChange({
      ...draft,
      categories: draft.categories.filter((category) => category !== tag),
      categoryColors: nextColors
    });
    if (editingTag === tag) {
      setEditingTag(null);
    }
    if (paletteTag === tag) {
      setPaletteTag(null);
    }
  }

  function renameTag(
    tag: string,
    options: { closeOnDuplicate?: boolean } = {}
  ) {
    const nextTag = tagEditInput.trim();

    if (!nextTag || nextTag === tag) {
      setEditingTag(null);
      setPaletteTag(null);
      return;
    }

    if (draft.categories.includes(nextTag)) {
      if (options.closeOnDuplicate) {
        setEditingTag(null);
        setPaletteTag(null);
      }
      return;
    }

    const nextColors = { ...(draft.categoryColors ?? {}) };
    nextColors[nextTag] = getTagColorIndex(tag, draft.categoryColors);
    delete nextColors[tag];

    onChange({
      ...draft,
      categories: draft.categories.map((category) =>
        category === tag ? nextTag : category
      ),
      categoryColors: nextColors
    });
    setEditingTag(null);
    setPaletteTag(null);
  }

  function openTagEditor(tag: string) {
    setCreatingTag(false);
    setTagInput("");
    setEditingTag(tag);
    setPaletteTag(null);
    setTagEditInput(tag);
  }

  function updateDropTarget(event: DragEvent<HTMLElement>, tag: string) {
    if (!draggedTag || draggedTag === tag) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientX < rect.left + rect.width / 2 ? "before" : "after";
    setDropTargetTag({ position, tag });
  }

  function commitPreviewReorder() {
    if (!draggedTag || !dropTargetTag) {
      setDraggedTag(null);
      setDropTargetTag(null);
      return;
    }

    const nextCategories = moveItemToPosition(
      draft.categories,
      draggedTag,
      dropTargetTag.tag,
      dropTargetTag.position
    );

    if (nextCategories.join("\n") !== draft.categories.join("\n")) {
      onChange({
        ...draft,
        categories: nextCategories
      });
    }

    setDraggedTag(null);
    setDropTargetTag(null);
  }

  return (
    <div ref={editorRef}>
      <span className="text-sm font-medium text-zinc-800">분류</span>
      <div className="mt-2 flex flex-wrap items-start gap-2">
        {previewCategories.map((category) => {
          const isEditing = editingTag === category;
          const tagNameChanged =
            tagEditInput.trim().length > 0 && tagEditInput.trim() !== category;
          const inputWidth = getInlineTagInputWidth(tagEditInput, 7);
          const currentColor = getTagColorIndex(category, draft.categoryColors);

          return (
            <span
              className={`relative inline-flex min-h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-all duration-150 ${
                isEditing ? "cursor-text ring-1 ring-inset ring-black/10" : "cursor-grab"
              } ${draggedTag === category ? "scale-95 opacity-45" : ""} ${
                dropTargetTag?.tag === category && draggedTag !== category
                  ? "translate-y-[-1px] ring-2 ring-zinc-900/20"
                  : ""
              } ${getTagToneClass(category, draft.categoryColors)}`}
              draggable={!isEditing}
              key={category}
              onDragEnd={commitPreviewReorder}
              onDragEnter={() => {
                if (draggedTag && draggedTag !== category) {
                  setDropTargetTag({ position: "before", tag: category });
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                updateDropTarget(event, category);
              }}
              onDragStart={(event) => {
                if (isEditing) {
                  event.preventDefault();
                  return;
                }
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", category);
                setDraggedTag(category);
                setEditingTag(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                commitPreviewReorder();
              }}
            >
              {isEditing ? (
                <input
                  aria-label={`${category} 태그명 입력`}
                  autoFocus
                  className="min-w-0 bg-transparent text-sm outline-none transition-[width] duration-150 placeholder:text-zinc-400"
                  onChange={(event) => setTagEditInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      renameTag(category);
                    }
                    if (event.key === "Escape") {
                      setEditingTag(null);
                    }
                  }}
                  style={{ width: inputWidth }}
                  value={tagEditInput}
                />
              ) : (
                <button
                  aria-label={`${category} 태그 수정`}
                  className="min-w-0 truncate text-left"
                  onClick={() => openTagEditor(category)}
                  type="button"
                >
                  {category}
                </button>
              )}
              <button
                aria-expanded={paletteTag === category}
                aria-label={`${category} 태그 색상 변경`}
                className={`ml-0.5 h-4 w-4 shrink-0 rounded-full border transition hover:scale-110 ${getTagSwatchClass(
                  currentColor
                )}`}
                onClick={() => {
                  if (!isEditing) {
                    openTagEditor(category);
                  }
                  setPaletteTag((current) =>
                    current === category ? null : category
                  );
                }}
                title="태그 색상 변경"
                type="button"
              />
              {isEditing && tagNameChanged ? (
                <button
                  aria-label={`${category} 태그명 저장`}
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] leading-none text-zinc-700 hover:bg-black/10"
                  onClick={() => renameTag(category)}
                  title="태그명 저장"
                  type="button"
                >
                  ✓
                </button>
              ) : null}
              <button
                aria-label={`${category} 태그 제거`}
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] leading-none hover:bg-black/10"
                onClick={() => removeTag(category)}
                title="태그 제거"
                type="button"
              >
                ×
              </button>
              {isEditing && paletteTag === category ? (
                <InlineTagPalette
                  label={`${category} 태그 색상`}
                  onSelect={(colorIndex) => updateTagColor(category, colorIndex)}
                  selectedColor={currentColor}
                />
              ) : null}
            </span>
          );
        })}
        {creatingTag ? (
          <span
            className={`inline-flex min-h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-all duration-150 ${getTagToneClass(
              `new-${newTagColor}`,
              { [`new-${newTagColor}`]: newTagColor }
            )}`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full border ${getTagSwatchClass(
                newTagColor
              )}`}
            />
            <input
              aria-label="분류 태그 입력"
              autoFocus
              className="min-w-0 bg-transparent text-sm text-zinc-950 outline-none transition-[width] duration-150 placeholder:text-zinc-400"
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
                if (event.key === "Escape") {
                  cancelCreateTag();
                }
              }}
              placeholder="새 태그"
              style={{
                width: getInlineTagInputWidth(tagInput || "새 태그", 6)
              }}
              value={tagInput}
            />
            {tagInput.trim() ? (
              <button
                aria-label="태그 추가"
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] leading-none text-zinc-700 hover:bg-black/10"
                onClick={addTag}
                title="태그 추가"
                type="button"
              >
                ✓
              </button>
            ) : null}
            <button
              aria-label="새 태그 입력 취소"
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] leading-none hover:bg-black/10"
              onClick={cancelCreateTag}
              title="태그 입력 취소"
              type="button"
            >
              ×
            </button>
          </span>
        ) : null}
        <button
          aria-label="분류 태그 추가"
          className="inline-flex min-h-7 min-w-8 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-500 transition hover:border-blue-300 hover:text-blue-700"
          onClick={startCreateTag}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function CategoryTag({
  categoryColors,
  label,
  size = "md"
}: {
  categoryColors?: Record<string, number>;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${
        size === "sm" ? "min-h-5 px-1.5 text-[11px]" : "min-h-6 px-2 text-xs"
      } ${getTagToneClass(label, categoryColors)}`}
    >
      {label}
    </span>
  );
}

function InlineTagPalette({
  label,
  onSelect,
  selectedColor
}: {
  label: string;
  onSelect: (colorIndex: number) => void;
  selectedColor: number;
}) {
  return (
    <div
      aria-label={label}
      className="absolute left-0 top-8 z-30 flex w-max items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
      role="group"
    >
      {tagSwatchClasses.map((swatchClass, index) => (
        <button
          aria-label={`${label} ${index + 1}`}
          aria-pressed={selectedColor === index}
          className={`h-5 w-5 rounded-full border transition hover:scale-105 ${
            selectedColor === index ? "ring-2 ring-zinc-950 ring-offset-1" : ""
          } ${swatchClass}`}
          key={swatchClass}
          onClick={() => onSelect(index)}
          type="button"
        />
      ))}
    </div>
  );
}

function TechnologyTagRail({ values }: { values: string[] }) {
  return (
    <section className="min-w-0">
      <h4 className="text-sm font-semibold text-zinc-900">사용 기술</h4>
      {values.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">없음</p>
      ) : (
        <div className="mt-2 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {values.map((value) => (
              <span
                className="inline-flex min-h-7 shrink-0 items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-medium text-zinc-700"
                key={value}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReportSection({ label, value }: { label: string; value: string }) {
  const paragraphs = splitReportText(value);

  return (
    <section className="grid min-w-0 gap-3 py-5 md:grid-cols-[8rem_minmax(0,1fr)]">
      <h4 className="text-sm font-semibold text-zinc-950">{label}</h4>
      <div className="min-w-0 space-y-2">
        {paragraphs.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-500">없음</p>
        ) : (
          paragraphs.map((paragraph) => (
            <p
              className="break-words text-sm leading-7 text-zinc-700"
              key={paragraph}
            >
              {paragraph}
            </p>
          ))
        )}
      </div>
    </section>
  );
}

function ReportList({ label, values }: { label: string; values: string[] }) {
  return (
    <section className="grid min-w-0 gap-3 py-5 md:grid-cols-[8rem_minmax(0,1fr)]">
      <h4 className="text-sm font-semibold text-zinc-950">{label}</h4>
      <div className="min-w-0">
        {values.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-500">없음</p>
        ) : (
          <ul className="grid gap-2 text-sm leading-7 text-zinc-700">
            {values.map((value) => (
              <li className="break-words" key={value}>
                {value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TextInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function DateInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

function NumberInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-950 outline-none focus:border-blue-500"
        max={100}
        min={0}
        onChange={(event) => onChange(clampScore(Number(event.target.value)))}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectInput({
  getOptionLabel,
  label,
  onChange,
  options,
  value
}: {
  getOptionLabel?: (value: string) => string;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <select
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterSelect({
  getOptionLabel,
  label,
  onChange,
  options,
  value
}: {
  getOptionLabel?: (value: string) => string;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <select
        className="mt-1 min-h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel
              ? getOptionLabel(option)
              : option === "all"
                ? "전체"
                : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <textarea
        className="mt-2 min-h-32 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function getTagToneClass(label: string, categoryColors?: Record<string, number>) {
  return tagToneClasses[getTagColorIndex(label, categoryColors)];
}

function getTagSwatchClass(colorIndex: number) {
  return tagSwatchClasses[Math.abs(colorIndex) % tagSwatchClasses.length];
}

function getInlineTagInputWidth(value: string, minUnits: number) {
  const visualUnits = Array.from(value).reduce((sum, character) => {
    if (/\s/.test(character)) {
      return sum + 0.75;
    }

    if (/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(character)) {
      return sum + 2.1;
    }

    return sum + 1;
  }, 0);

  return `${Math.min(Math.max(visualUnits + 1, minUnits), 36)}ch`;
}

function getTagColorIndex(label: string, categoryColors?: Record<string, number>) {
  const savedColor = categoryColors?.[label];

  if (typeof savedColor === "number") {
    return Math.abs(savedColor) % tagToneClasses.length;
  }

  return (
    Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    tagToneClasses.length
  );
}

function getUnusedTagColorIndex(
  categories: string[],
  categoryColors?: Record<string, number>
) {
  const usedColors = new Set(
    categories.map((category) => getTagColorIndex(category, categoryColors))
  );
  const unusedColor = tagToneClasses.findIndex((_, index) => !usedColors.has(index));

  if (unusedColor >= 0) {
    return unusedColor;
  }

  const usageCounts = tagToneClasses.map((_, index) =>
    categories.filter(
      (category) => getTagColorIndex(category, categoryColors) === index
    ).length
  );

  return usageCounts.indexOf(Math.min(...usageCounts));
}

function moveItemToPosition(
  items: string[],
  movedItem: string,
  targetItem: string,
  position: "before" | "after"
) {
  const withoutMoved = items.filter((item) => item !== movedItem);
  const targetIndex = withoutMoved.indexOf(targetItem);

  if (targetIndex < 0) {
    return items;
  }

  return [
    ...withoutMoved.slice(0, position === "before" ? targetIndex : targetIndex + 1),
    movedItem,
    ...withoutMoved.slice(position === "before" ? targetIndex : targetIndex + 1)
  ];
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitReportText(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createDefaultWorkItemScore(): WorkItemScore {
  const score = {
    caution: "근거와 수치는 저장 전 확인 필요.",
    essayScore: 70,
    evidenceConfidence: "C" as const,
    interviewScore: 70,
    overallScore: 70,
    resumeScore: 70,
    scoreReason: "사용자가 직접 추가한 업무로, 채용 문서 활용도는 보수적으로 시작합니다.",
    useTier: "archive" as const
  };

  return {
    ...score,
    overallScore: calculateOverallScore(score)
  };
}

function calculateOverallScore(
  score: Pick<WorkItemScore, "resumeScore" | "essayScore" | "interviewScore">
) {
  return Math.round(
    score.resumeScore * 0.4 + score.essayScore * 0.3 + score.interviewScore * 0.3
  );
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}
