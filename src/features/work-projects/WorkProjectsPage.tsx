import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import type { WorkItem, WorkProject } from "../../data/schema";
import { formatProjectMeta } from "../../shared/lib/workProjectDisplay";
import { Badge } from "../../shared/ui/Badge";
import { Button } from "../../shared/ui/Button";

export type AddWorkProjectInput = {
  contextType: string;
  endedAt: string;
  myRole: string;
  name: string;
  organizationName: string;
  periodNote: string;
  startedAt: string;
  summary: string;
  teamSize: string;
};

type WorkProjectsPageProps = {
  onAddWorkProject?: (input: AddWorkProjectInput) => Promise<WorkProject>;
  onDeleteWorkProject?: (id: string) => Promise<void>;
  onSaveWorkProject?: (workProject: WorkProject) => Promise<WorkProject>;
  workItems: WorkItem[];
  workProjects: WorkProject[];
};

const newProjectKey = "__new-project__";
const projectTypeOptions = [
  "회사 프로젝트",
  "개인 프로젝트",
  "오픈소스",
  "학습/실험",
  "기타"
] as const;
const monthLabels = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월"
] as const;
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function WorkProjectsPage({
  onAddWorkProject,
  onDeleteWorkProject,
  onSaveWorkProject,
  workItems,
  workProjects
}: WorkProjectsPageProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(
    workProjects[0]?.id ?? newProjectKey
  );
  const selectedProject =
    workProjects.find((project) => project.id === selectedProjectId) ??
    workProjects[0] ??
    null;
  const isCreating =
    selectedProjectId === newProjectKey || workProjects.length === 0;
  const [draft, setDraft] = useState<WorkProject | null>(selectedProject);
  const [newProject, setNewProject] = useState<AddWorkProjectInput>({
    contextType: "",
    endedAt: "",
    myRole: "",
    name: "",
    organizationName: "",
    periodNote: "기간과 근거 확인 필요",
    startedAt: "",
    summary: "",
    teamSize: ""
  });
  const [saving, setSaving] = useState(false);
  const workItemCountsByProjectId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of workItems) {
      counts.set(item.projectId, (counts.get(item.projectId) ?? 0) + 1);
    }

    return counts;
  }, [workItems]);
  const selectedWorkItemCount = selectedProject
    ? workItemCountsByProjectId.get(selectedProject.id) ?? 0
    : 0;
  const resolvedDraft =
    !isCreating && draft?.id === selectedProject?.id
      ? draft
      : !isCreating
        ? selectedProject
        : null;
  const canSaveExisting =
    Boolean(resolvedDraft?.name.trim()) &&
    Boolean(onSaveWorkProject) &&
    JSON.stringify(resolvedDraft) !== JSON.stringify(selectedProject);
  const canAddProject =
    Boolean(newProject.name.trim()) && Boolean(onAddWorkProject);
  const canDeleteProject =
    Boolean(selectedProject) &&
    selectedWorkItemCount === 0 &&
    Boolean(onDeleteWorkProject);

  function selectProject(projectId: string) {
    const nextProject = workProjects.find((project) => project.id === projectId);

    setSelectedProjectId(projectId);
    setDraft(nextProject ?? null);
  }

  async function handleSave() {
    if (!resolvedDraft || !onSaveWorkProject || saving || !canSaveExisting) {
      return;
    }

    setSaving(true);
    try {
      const savedProject = await onSaveWorkProject(resolvedDraft);
      setDraft(savedProject);
      setSelectedProjectId(savedProject.id);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    if (!onAddWorkProject || saving || !canAddProject) {
      return;
    }

    setSaving(true);
    try {
      const savedProject = await onAddWorkProject({
        ...newProject,
        contextType: newProject.contextType.trim(),
        endedAt: newProject.endedAt.trim(),
        myRole: newProject.myRole.trim(),
        name: newProject.name.trim(),
        organizationName: newProject.organizationName.trim(),
        periodNote: newProject.periodNote.trim() || "기간과 근거 확인 필요",
        startedAt: newProject.startedAt.trim(),
        summary: newProject.summary.trim(),
        teamSize: newProject.teamSize.trim()
      });
      setSelectedProjectId(savedProject.id);
      setDraft(savedProject);
      setNewProject({
        contextType: "",
        endedAt: "",
        myRole: "",
        name: "",
        organizationName: "",
        periodNote: "기간과 근거 확인 필요",
        startedAt: "",
        summary: "",
        teamSize: ""
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedProject || !onDeleteWorkProject || saving || !canDeleteProject) {
      return;
    }

    const confirmed = window.confirm("이 프로젝트를 삭제할까요?");

    if (!confirmed) {
      return;
    }

    setSaving(true);
    try {
      await onDeleteWorkProject(selectedProject.id);
      const nextProject = workProjects.find(
        (project) => project.id !== selectedProject.id
      );
      setSelectedProjectId(nextProject?.id ?? newProjectKey);
      setDraft(nextProject ?? null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid h-[calc(100vh-5.5rem)] min-h-[720px] gap-5 px-6 py-5 max-sm:h-auto max-sm:min-h-0 max-sm:px-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside
        className="flex min-h-0 min-w-0 flex-col rounded-lg border border-zinc-200 bg-white"
        data-page-guide="project-list"
      >
        <div className="border-b border-zinc-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-950">프로젝트</h3>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{workProjects.length}</Badge>
              <Button
                data-page-guide="project-new"
                onClick={() => {
                  setSelectedProjectId(newProjectKey);
                  setDraft(null);
                }}
                size="sm"
                variant="primary"
              >
                새 프로젝트 추가
              </Button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid gap-2">
            {workProjects.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                아직 프로젝트가 없습니다. 새 프로젝트 추가 버튼으로 첫 프로젝트를
                만드세요.
              </div>
            ) : null}
            {workProjects.map((project) => {
              const workItemCount = workItemCountsByProjectId.get(project.id) ?? 0;
              const selected = project.id === selectedProjectId && !isCreating;

              return (
                <button
                  aria-pressed={selected}
                  className={`rounded-md border p-3 text-left transition ${
                    selected
                      ? "border-blue-500 bg-white shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  type="button"
                >
                  <span className="block break-words text-sm font-medium text-zinc-950">
                    {project.name}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {formatProjectMeta(project)} / 업무 {workItemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div
        className="min-h-0 min-w-0 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6"
        data-page-guide="project-detail"
      >
        {isCreating ? (
          <ProjectCreateForm
            canSave={canAddProject}
            draft={newProject}
            onChange={setNewProject}
            onSave={() => void handleAdd()}
            saving={saving}
          />
        ) : resolvedDraft ? (
          <ProjectEditForm
            canDelete={canDeleteProject}
            canSave={canSaveExisting}
            draft={resolvedDraft}
            onChange={setDraft}
            onDelete={() => void handleDelete()}
            onSave={() => void handleSave()}
            saving={saving}
            workItemCount={selectedWorkItemCount}
          />
        ) : (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            프로젝트가 없습니다. 새 프로젝트를 추가하세요.
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCreateForm({
  canSave,
  draft,
  onChange,
  onSave,
  saving
}: {
  canSave: boolean;
  draft: AddWorkProjectInput;
  onChange: (input: AddWorkProjectInput) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <article className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-950">새 프로젝트</h3>
          <p className="mt-2 text-sm text-zinc-500">
            업무를 묶는 상위 단위입니다. 이후 업무 추가와 프롬프트 대상에서 사용됩니다.
          </p>
        </div>
        <Button disabled={!canSave || saving} onClick={onSave} variant="primary">
          프로젝트 추가
        </Button>
      </div>
      <ProjectFields
        onChange={(patch) => onChange({ ...draft, ...patch })}
        project={draft}
      />
    </article>
  );
}

function ProjectEditForm({
  canDelete,
  canSave,
  draft,
  onChange,
  onDelete,
  onSave,
  saving,
  workItemCount
}: {
  canDelete: boolean;
  canSave: boolean;
  draft: WorkProject;
  onChange: (project: WorkProject) => void;
  onDelete: () => void;
  onSave: () => void;
  saving: boolean;
  workItemCount: number;
}) {
  return (
    <article className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">업무 {workItemCount}</Badge>
          </div>
          <h3 className="mt-3 break-words text-xl font-semibold text-zinc-950">
            {draft.name}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!canDelete || saving}
            onClick={onDelete}
            variant="softDanger"
          >
            프로젝트 삭제
          </Button>
          <Button disabled={!canSave || saving} onClick={onSave} variant="primary">
            프로젝트 저장
          </Button>
        </div>
      </div>
      <ProjectFields
        onChange={(patch) => onChange({ ...draft, ...patch })}
        project={draft}
      />
      {workItemCount > 0 ? (
        <p className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          연결된 업무가 있는 프로젝트는 삭제할 수 없습니다. 먼저 업무를 다른
          프로젝트로 옮기거나 삭제해야 합니다.
        </p>
      ) : null}
    </article>
  );
}

function ProjectFields({
  onChange,
  project
}: {
  onChange: (patch: Partial<AddWorkProjectInput & WorkProject>) => void;
  project: AddWorkProjectInput | WorkProject;
}) {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2" data-page-guide="project-form">
      <TextInput
        label="프로젝트명"
        helpText="업무들이 묶일 대표 이름입니다. 프로젝트명 또는 서비스명처럼 나중에 다시 찾기 쉬운 이름을 적습니다."
        onChange={(name) => onChange({ name })}
        placeholder="예: 프로젝트명 또는 서비스명"
        value={project.name}
      />
      <SelectInput
        helpText="프로젝트가 어디에서 나온 일인지 고릅니다."
        label="프로젝트 유형"
        onChange={(contextType) => onChange({ contextType })}
        options={projectTypeOptions}
        placeholder="선택 안 함"
        value={project.contextType ?? ""}
      />
      <TextInput
        label="소속/맥락"
        helpText="회사, 고객사, 팀, 사이드 프로젝트처럼 이 일이 어디에서 나온 경험인지 적습니다."
        onChange={(organizationName) => onChange({ organizationName })}
        placeholder="예: 제품팀, 고객사, 사이드 프로젝트"
        value={project.organizationName ?? ""}
      />
      <TextInput
        label="참여 인원"
        helpText="정확하지 않으면 대략적인 규모로 적어도 됩니다."
        onChange={(teamSize) => onChange({ teamSize })}
        placeholder="예: 5명, 1명, 직무별 인원"
        value={project.teamSize ?? ""}
      />
      <TextInput
        label="내 역할"
        helpText="이 프로젝트에서 본인이 맡은 책임 범위를 적습니다."
        onChange={(myRole) => onChange({ myRole })}
        placeholder="예: 담당 역할, 주요 책임"
        value={project.myRole ?? ""}
      />
      <DateRangeInput
        endedAt={project.endedAt ?? ""}
        onChange={(patch) => onChange(patch)}
        startedAt={project.startedAt ?? ""}
      />
      <TextInput
        label="기간/근거 메모"
        helpText="날짜 근거가 애매하거나 Git/문서 기준으로만 확인되는 경우를 적습니다."
        onChange={(periodNote) => onChange({ periodNote })}
        placeholder="예: 시작일은 문서 기준, 종료일은 배포 기록 기준"
        value={project.periodNote}
      />
      <div className="lg:col-span-2">
        <TextAreaInput
          label="요약"
          helpText="프로젝트 목적, 범위, 주요 산출물을 짧게 정리합니다."
          onChange={(summary) => onChange({ summary })}
          placeholder="예: 프로젝트 목적, 담당 범위, 주요 산출물을 요약"
          value={project.summary}
        />
      </div>
    </div>
  );
}

function TextInput({
  helpText,
  label,
  onChange,
  placeholder,
  value
}: {
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        aria-label={label}
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {helpText ? (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          {helpText}
        </span>
      ) : null}
    </label>
  );
}

function DateRangeInput({
  endedAt,
  onChange,
  startedAt
}: {
  endedAt: string;
  onChange: (patch: Pick<AddWorkProjectInput, "endedAt" | "startedAt">) => void;
  startedAt: string;
}) {
  const pickerRootRef = useRef<HTMLDivElement | null>(null);
  const [openTarget, setOpenTarget] = useState<"endedAt" | "startedAt" | null>(
    null
  );
  const [pickerView, setPickerView] = useState<"day" | "month">("day");
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getInitialVisibleMonth(startedAt || endedAt)
  );
  const selectedValue = openTarget === "endedAt" ? endedAt : startedAt;
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth.year, visibleMonth.monthIndex),
    [visibleMonth]
  );

  useEffect(() => {
    if (!openTarget) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        pickerRootRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpenTarget(null);
      setPickerView("day");
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openTarget]);

  function selectDate(day: number) {
    if (!openTarget) {
      return;
    }

    const dateValue = formatDateInputValue(
      visibleMonth.year,
      visibleMonth.monthIndex,
      day
    );

    onChange({
      endedAt,
      startedAt,
      [openTarget]: dateValue
    });
    setOpenTarget(null);
    setPickerView("day");
  }

  function openPicker(target: "endedAt" | "startedAt") {
    const value = target === "endedAt" ? endedAt : startedAt;

    setVisibleMonth(getInitialVisibleMonth(value || startedAt || endedAt));
    setPickerView("day");
    setOpenTarget((current) => (current === target ? null : target));
  }

  function moveMonth(delta: number) {
    setVisibleMonth((current) => {
      const nextMonthIndex = current.monthIndex + delta;
      const nextDate = new Date(current.year, nextMonthIndex, 1);

      return {
        monthIndex: nextDate.getMonth(),
        year: nextDate.getFullYear()
      };
    });
  }

  function moveYear(delta: number) {
    setVisibleMonth((current) => ({
      ...current,
      year: current.year + delta
    }));
  }

  function selectMonth(monthIndex: number) {
    setVisibleMonth((current) => ({
      ...current,
      monthIndex
    }));
    setPickerView("day");
  }

  return (
    <div
      className="min-w-0 lg:col-span-2"
      data-page-guide="project-date-range"
      ref={pickerRootRef}
    >
      <div className="text-sm font-medium text-zinc-800">프로젝트 기간</div>
      <div className="mt-2 grid max-w-xl grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="relative min-w-0">
          <DateButton
            label="시작일"
            onClick={() => openPicker("startedAt")}
            selected={openTarget === "startedAt"}
            value={startedAt}
          />
          {openTarget === "startedAt" ? (
            <DatePickerPopover
              calendarDays={calendarDays}
              onClear={() => {
                onChange({ endedAt, startedAt: "" });
                setOpenTarget(null);
                setPickerView("day");
              }}
              onClose={() => {
                setOpenTarget(null);
                setPickerView("day");
              }}
              onMoveMonth={moveMonth}
              onMoveYear={moveYear}
              onSelectDate={selectDate}
              onSelectMonth={selectMonth}
              onShowMonthPicker={() => setPickerView("month")}
              pickerView={pickerView}
              selectedValue={selectedValue}
              visibleMonth={visibleMonth}
            />
          ) : null}
        </div>
        <div className="hidden h-12 items-center px-1 text-sm font-medium text-zinc-400 sm:flex">
          -
        </div>
        <div className="relative min-w-0">
          <DateButton
            label="종료일"
            onClick={() => openPicker("endedAt")}
            selected={openTarget === "endedAt"}
            value={endedAt}
          />
          {openTarget === "endedAt" ? (
            <DatePickerPopover
              calendarDays={calendarDays}
              onClear={() => {
                onChange({ endedAt: "", startedAt });
                setOpenTarget(null);
                setPickerView("day");
              }}
              onClose={() => {
                setOpenTarget(null);
                setPickerView("day");
              }}
              onMoveMonth={moveMonth}
              onMoveYear={moveYear}
              onSelectDate={selectDate}
              onSelectMonth={selectMonth}
              onShowMonthPicker={() => setPickerView("month")}
              pickerView={pickerView}
              selectedValue={selectedValue}
              visibleMonth={visibleMonth}
            />
          ) : null}
        </div>
      </div>
      <div className="mt-1 text-xs leading-5 text-zinc-500">
        정확한 날짜를 선택합니다. 진행 중인 프로젝트는 종료일을 비워둡니다.
      </div>
    </div>
  );
}

function DatePickerPopover({
  calendarDays,
  onClear,
  onClose,
  onMoveMonth,
  onMoveYear,
  onSelectDate,
  onSelectMonth,
  onShowMonthPicker,
  pickerView,
  selectedValue,
  visibleMonth
}: {
  calendarDays: Array<number | null>;
  onClear: () => void;
  onClose: () => void;
  onMoveMonth: (delta: number) => void;
  onMoveYear: (delta: number) => void;
  onSelectDate: (day: number) => void;
  onSelectMonth: (monthIndex: number) => void;
  onShowMonthPicker: () => void;
  pickerView: "day" | "month";
  selectedValue: string;
  visibleMonth: { monthIndex: number; year: number };
}) {
  return (
    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-full min-w-80 max-w-sm rounded-lg border border-zinc-200 bg-white p-3 shadow-xl max-sm:min-w-0">
      {pickerView === "day" ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="이전 달"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              onClick={() => onMoveMonth(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              aria-label="연월 선택"
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-50"
              onClick={onShowMonthPicker}
              type="button"
            >
              {visibleMonth.year}년 {visibleMonth.monthIndex + 1}월
            </button>
            <button
              aria-label="다음 달"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              onClick={() => onMoveMonth(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
            {weekdayLabels.map((weekday) => (
              <div className="py-1" key={weekday}>
                {weekday}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((dayCell, index) => {
              if (!dayCell) {
                return <div aria-hidden="true" key={`empty-${index}`} />;
              }

              const dateValue = formatDateInputValue(
                visibleMonth.year,
                visibleMonth.monthIndex,
                dayCell
              );
              const selected = selectedValue === dateValue;
              const today = isToday(
                visibleMonth.year,
                visibleMonth.monthIndex,
                dayCell
              );

              return (
                <button
                  aria-label={`${dateValue} 선택`}
                  aria-pressed={selected}
                  className={`flex aspect-square min-h-9 items-center justify-center rounded-md border text-sm transition ${
                    selected
                      ? "border-zinc-950 bg-zinc-950 font-semibold text-white"
                      : today
                        ? "border-blue-300 bg-blue-50 font-semibold text-blue-700 hover:border-blue-400"
                        : "border-transparent bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                  key={dateValue}
                  onClick={() => onSelectDate(dayCell)}
                  type="button"
                >
                  {dayCell}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="이전 연도"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              onClick={() => onMoveYear(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-zinc-950">
              {visibleMonth.year}년
            </div>
            <button
              aria-label="다음 연도"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              onClick={() => onMoveYear(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {monthLabels.map((monthLabel, index) => {
              const selected = visibleMonth.monthIndex === index;

              return (
                <button
                  aria-pressed={selected}
                  className={`min-h-9 rounded-md border px-2 text-sm transition ${
                    selected
                      ? "border-zinc-950 bg-zinc-950 font-semibold text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                  key={monthLabel}
                  onClick={() => onSelectMonth(index)}
                  type="button"
                >
                  {monthLabel}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="mt-3 flex justify-between gap-2">
        <button
          className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          onClick={onClear}
          type="button"
        >
          비우기
        </button>
        <button
          className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          onClick={onClose}
          type="button"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function DateButton({
  label,
  onClick,
  selected,
  value
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
  value: string;
}) {
  return (
    <button
      aria-label={`${label} 선택`}
      aria-pressed={selected}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-md border bg-white px-3 text-left transition ${
        selected ? "border-zinc-950" : "border-zinc-300 hover:border-zinc-400"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium text-zinc-500">{label}</span>
        <span className="mt-0.5 block text-sm font-medium text-zinc-950">
          {value ? formatDateValue(value) : "선택 안 함"}
        </span>
      </span>
      <Calendar aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
    </button>
  );
}

function getInitialVisibleMonth(value: string) {
  const parsed = parseProjectDate(value);

  if (parsed) {
    return {
      monthIndex: parsed.month - 1,
      year: parsed.year
    };
  }

  const today = new Date();

  return {
    monthIndex: today.getMonth(),
    year: today.getFullYear()
  };
}

function parseProjectDate(value: string) {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : undefined;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    (day !== undefined &&
      (!Number.isInteger(day) ||
        day < 1 ||
        day > new Date(year, month, 0).getDate()))
  ) {
    return null;
  }

  return { day, month, year };
}

function formatDateValue(value: string) {
  const parsed = parseProjectDate(value);

  if (!parsed) {
    return value;
  }

  if (!parsed.day) {
    return `${parsed.year}.${padDatePart(parsed.month)} (월 단위)`;
  }

  return `${parsed.year}.${padDatePart(parsed.month)}.${padDatePart(parsed.day)}`;
}

function formatDateInputValue(year: number, monthIndex: number, day: number) {
  return `${year}-${padDatePart(monthIndex + 1)}-${padDatePart(day)}`;
}

function getCalendarDays(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(day);
  }

  return cells;
}

function isToday(year: number, monthIndex: number, day: number) {
  const today = new Date();

  return (
    today.getFullYear() === year &&
    today.getMonth() === monthIndex &&
    today.getDate() === day
  );
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function SelectInput({
  helpText,
  label,
  onChange,
  options,
  placeholder,
  value
}: {
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <select
        aria-label={label}
        className="mt-2 min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {helpText ? (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          {helpText}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaInput({
  helpText,
  label,
  onChange,
  placeholder,
  value
}: {
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <textarea
        aria-label={label}
        className="mt-2 min-h-32 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none focus:border-blue-500"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {helpText ? (
        <span className="mt-1 block text-xs leading-5 text-zinc-500">
          {helpText}
        </span>
      ) : null}
    </label>
  );
}
