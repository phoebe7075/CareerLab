import { useCallback, useEffect, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";

import { careerLabRepository } from "../data/repository";
import { runtimeSeedData } from "#career-lab-seed-data";
import type {
  AppSettings,
  CareerLabEntities,
  CareerLabExportBundle,
  EssayQuestion,
  EssaySet,
  InterviewFollowUp,
  InterviewQuestion,
  InterviewUnderstanding,
  PromptHistory,
  ResumePromptProfile,
  ResumeStatement,
  ResumeStatementStatus,
  VersionRecord,
  WorkItem,
  WorkProject
} from "../data/schema";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import {
  EssayLabPage,
  type SaveEssayVersionInput,
  type UpdateEssaySetInput,
  type UpdateEssayQuestionInput
} from "../features/essay-lab/EssayLabPage";
import { ExportImportPage } from "../features/export-import/ExportImportPage";
import {
  createEssaySetMarkdown,
  createMarkdownExport,
  type MarkdownExportKind
} from "../features/export-import/markdownExport";
import {
  InterviewPrepPage,
  type AddInterviewFollowUpInput,
  type UpdateInterviewFollowUpInput,
  type UpdateInterviewQuestionInput
} from "../features/interview-prep/InterviewPrepPage";
import {
  countImportedFollowUps,
  materializeImportedFollowUps,
  type ImportedInterviewFollowUp
} from "../features/interview-prep/followUpImport";
import {
  buildPromptTargets,
  buildResumeStatementEvaluationPrompt,
  buildResumeStatementGenerationPrompt,
  renderPromptTemplate
} from "../features/prompt-center/promptGenerator";
import { PromptCenterPage } from "../features/prompt-center/PromptCenterPage";
import {
  ResumeLabPage,
  type CopyResumeGenerationPromptInput,
  type SaveResumePromptProfileInput,
  type SaveResumeVersionInput
} from "../features/resume-lab/ResumeLabPage";
import { parseResumeEvaluationJson } from "../features/resume-lab/resumeEvaluationImport";
import {
  WorkUnderstandingPage,
  type AddWorkItemInput
} from "../features/work-understanding/WorkUnderstandingPage";
import {
  WorkProjectsPage,
  type AddWorkProjectInput
} from "../features/work-projects/WorkProjectsPage";
import type { WorkItemImportDraft } from "../features/work-understanding/workItemImport";
import type { WorkItemScoreImportUpdate } from "../features/work-understanding/workItemScoring";
import { AppShell } from "./layout/AppShell";
import {
  flattenNavigationItems,
  navigationItems
} from "../shared/constants/navigation";
import { getPageGuide } from "../shared/constants/pageGuides";
import { copyText } from "../shared/lib/clipboard";
import { createTextDiff } from "../shared/lib/diff";
import { sortWorkItemsByGeneralScore } from "../shared/lib/workItemSort";
import { Button } from "../shared/ui/Button";
import { PageGuideOverlay } from "../shared/ui/PageGuideOverlay";
import { ToastViewport, type ToastMessage } from "../shared/ui/Toast";

type LoadStatus = "loading" | "ready" | "error";
const runtimeSeedSettings = runtimeSeedData.settings;
const isDemoSeedProfile = runtimeSeedData.profile === "demo";

type RefreshDataOptions = {
  resetSelections?: boolean;
};

export function App() {
  const [activeItemId, setActiveItemId] = useState("dashboard");
  const [entities, setEntities] = useState<CareerLabEntities | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(
    null
  );
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [selectedEssayQuestionId, setSelectedEssayQuestionId] = useState<
    string | null
  >(null);
  const [selectedEssaySetId, setSelectedEssaySetId] = useState<string | null>(
    null
  );
  const [selectedInterviewQuestionId, setSelectedInterviewQuestionId] = useState<
    string | null
  >(null);
  const [addWorkItemOpen, setAddWorkItemOpen] = useState(false);
  const [discoverWorkItemsOpen, setDiscoverWorkItemsOpen] = useState(false);
  const [pageGuideOpen, setPageGuideOpen] = useState(false);
  const [pageGuideOverrideId, setPageGuideOverrideId] = useState<string | null>(
    null
  );
  const [importWorkItemsOpen, setImportWorkItemsOpen] = useState(false);
  const [scoreWorkItemsOpen, setScoreWorkItemsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const currentNavigation = useMemo(
    () =>
      flattenNavigationItems().find((item) => item.id === activeItemId) ??
      navigationItems[0],
    [activeItemId]
  );
  const guidePageId =
    activeItemId === "essay-lab" ? pageGuideOverrideId ?? activeItemId : activeItemId;
  const currentPageGuide = getPageGuide(guidePageId);
  const sortedEntities = useMemo(
    () =>
      entities
        ? {
            ...entities,
            workItems: sortWorkItemsByGeneralScore(entities.workItems)
          }
        : null,
    [entities]
  );
  const pushToast = useCallback((message: Omit<ToastMessage, "id">) => {
    setToasts((current) => [
      ...current,
      { ...message, id: crypto.randomUUID() }
    ]);
  }, []);

  const refreshData = useCallback(async (options: RefreshDataOptions = {}) => {
    const [nextSettings, nextEntities] = await Promise.all([
      careerLabRepository.getSettings(),
      careerLabRepository.getAllEntities()
    ]);

    setSettings(nextSettings ?? runtimeSeedSettings);
    setEntities(nextEntities);
    const sortedWorkItems = sortWorkItemsByGeneralScore(nextEntities.workItems);
    const resetSelections = options.resetSelections === true;

    setSelectedWorkItemId((current) =>
      resetSelections
        ? sortedWorkItems[0]?.id ?? null
        : current ?? sortedWorkItems[0]?.id ?? null
    );
    setSelectedStatementId(
      (current) =>
        resetSelections
          ? nextEntities.resumeStatements[0]?.id ?? null
          : current ?? nextEntities.resumeStatements[0]?.id ?? null
    );
    setSelectedEssaySetId(
      (current) =>
        resetSelections
          ? nextEntities.essaySets[0]?.id ?? null
          : current ?? nextEntities.essaySets[0]?.id ?? null
    );
    setSelectedEssayQuestionId(
      (current) =>
        resetSelections
          ? nextEntities.essayQuestions[0]?.id ?? null
          : current ?? nextEntities.essayQuestions[0]?.id ?? null
    );
    setSelectedInterviewQuestionId(
      (current) =>
        resetSelections
          ? nextEntities.interviewQuestions[0]?.id ?? null
          : current ?? nextEntities.interviewQuestions[0]?.id ?? null
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setLoadStatus("loading");
        await careerLabRepository.ensureSeedData();

        if (!cancelled) {
          await refreshData();
          setLoadStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setLoadStatus("error");
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [refreshData]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPageGuideOpen(shouldOpenPageGuide(currentPageGuide?.storageKey));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentPageGuide?.storageKey]);

  async function handleAddWorkItem(input: AddWorkItemInput) {
    const activeCycleId =
      settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId;
    const now = new Date().toISOString();
    const project =
      input.newProject &&
      input.newProject.name.trim().length > 0
        ? createUserWorkProject(input.newProject.name, activeCycleId, now)
        : entities?.workProjects.find((item) => item.id === input.projectId);

    if (!project) {
      pushToast({
        title: "업무 추가 실패",
        description: "선택한 프로젝트를 찾을 수 없습니다."
      });
      return;
    }

    const workItem: WorkItem = {
      id: `user-work-${crypto.randomUUID()}`,
      cycleIds: [activeCycleId],
      source: "user",
      projectId: project.id,
      title: "새 업무",
      system: project.system,
      startedAt: project.startedAt ?? "",
      endedAt: project.endedAt ?? "",
      periodNote: "기간과 근거 확인 필요",
      priority: 3,
      riskLevel: "medium",
      categories: ["정리 중"],
      categoryColors: {},
      problem: "문제/배경을 입력하세요.",
      role: "본인이 맡은 역할을 입력하세요.",
      technologies: [],
      actions: [],
      difficulties: [],
      solution: "해결 방식을 입력하세요.",
      result: "결과를 입력하세요.",
      lessons: [],
      resumeStatements: [],
      essayPoints: [],
      interviewPoints: [],
      metricsToVerify: ["확인 필요 수치"],
      dangerousClaims: [],
      safeClaims: [],
      evidenceRefs: [],
      learningQuestions: [],
      createdAt: now,
      updatedAt: now
    };

    await careerLabRepository.saveWorkProjectsAndItems(
      input.newProject ? [project] : [],
      [workItem]
    );
    await refreshData();
    setSelectedWorkItemId(workItem.id);
    pushToast({
      title: "업무 추가됨",
      description: `${project.name} 프로젝트에 새 업무를 추가했습니다.`
    });
  }

  async function handleAddWorkProject(input: AddWorkProjectInput) {
    const activeCycleId =
      settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId;
    const now = new Date().toISOString();
    const project: WorkProject = {
      ...createUserWorkProject(input.name, activeCycleId, now),
      contextType: input.contextType,
      endedAt: input.endedAt,
      myRole: input.myRole,
      organizationName: input.organizationName,
      periodNote: input.periodNote || "기간과 근거 확인 필요",
      startedAt: input.startedAt,
      summary: input.summary || "사용자가 직접 추가한 프로젝트입니다.",
      teamSize: input.teamSize
    };

    await careerLabRepository.saveWorkProject(project);
    setEntities((current) =>
      current
        ? {
            ...current,
            workProjects: [...current.workProjects, project]
          }
        : current
    );
    pushToast({
      title: "프로젝트 추가됨",
      description: project.name
    });

    return project;
  }

  async function handleSaveWorkProject(workProject: WorkProject) {
    const previousProject = entities?.workProjects.find(
      (project) => project.id === workProject.id
    );
    const updatedProject: WorkProject = {
      ...workProject,
      name: workProject.name.trim(),
      system: deriveWorkSystemFromProjectName(workProject.name),
      contextType: workProject.contextType?.trim() ?? "",
      endedAt: workProject.endedAt?.trim() ?? "",
      myRole: workProject.myRole?.trim() ?? "",
      organizationName: workProject.organizationName?.trim() ?? "",
      periodNote: workProject.periodNote.trim() || "기간과 근거 확인 필요",
      startedAt: workProject.startedAt?.trim() ?? "",
      summary: workProject.summary.trim(),
      teamSize: workProject.teamSize?.trim() ?? "",
      updatedAt: new Date().toISOString()
    };
    const linkedWorkItems =
      previousProject && previousProject.system !== updatedProject.system
        ? entities?.workItems
            .filter((item) => item.projectId === updatedProject.id)
            .map((item) => ({
              ...item,
              system: updatedProject.system,
              updatedAt: updatedProject.updatedAt
            })) ?? []
        : [];
    const linkedWorkItemsById = new Map(
      linkedWorkItems.map((item) => [item.id, item])
    );

    await careerLabRepository.saveWorkProjectsAndItems(
      [updatedProject],
      linkedWorkItems
    );
    setEntities((current) =>
      current
        ? {
            ...current,
            workProjects: current.workProjects.map((project) =>
              project.id === updatedProject.id ? updatedProject : project
            ),
            workItems:
              linkedWorkItems.length > 0
                ? current.workItems.map(
                    (item) => linkedWorkItemsById.get(item.id) ?? item
                  )
                : current.workItems
          }
        : current
    );
    pushToast({
      title: "프로젝트 저장됨",
      description: updatedProject.name
    });

    return updatedProject;
  }

  async function handleDeleteWorkProject(projectId: string) {
    if (!entities) {
      return;
    }

    const project = entities.workProjects.find((item) => item.id === projectId);
    const linkedWorkItemCount = entities.workItems.filter(
      (item) => item.projectId === projectId
    ).length;

    if (!project) {
      return;
    }

    if (linkedWorkItemCount > 0) {
      pushToast({
        title: "프로젝트 삭제 불가",
        description: "연결된 업무를 먼저 다른 프로젝트로 옮기거나 삭제하세요."
      });
      return;
    }

    await careerLabRepository.deleteWorkProject(projectId);
    setEntities((current) =>
      current
        ? {
            ...current,
            workProjects: current.workProjects.filter(
              (item) => item.id !== projectId
            )
          }
        : current
    );
    pushToast({
      title: "프로젝트 삭제됨",
      description: project.name
    });
  }

  async function handleImportWorkItems(draft: WorkItemImportDraft) {
    if (!entities) {
      return;
    }

    const activeCycleId =
      settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId;
    const now = new Date().toISOString();
    const existingProjectByName = new Map(
      entities.workProjects.map((project) => [project.name.trim(), project])
    );
    const projectIdByKey = new Map<string, string>();
    const projectsToSave: WorkProject[] = [];

    for (const projectDraft of draft.projects) {
      const existingProject = existingProjectByName.get(projectDraft.name.trim());
      if (existingProject) {
        projectIdByKey.set(projectDraft.key, existingProject.id);
        continue;
      }

      const project: WorkProject = {
        id: `import-project-${crypto.randomUUID()}`,
        cycleIds: [activeCycleId],
        source: "import",
        name: projectDraft.name,
        system: projectDraft.system,
        periodNote: projectDraft.periodNote,
        summary: projectDraft.summary,
        createdAt: now,
        updatedAt: now
      };
      projectsToSave.push(project);
      projectIdByKey.set(projectDraft.key, project.id);
      existingProjectByName.set(project.name.trim(), project);
    }

    if (projectsToSave.length === 0 && entities.workProjects.length === 0) {
      projectsToSave.push(
        createImportedWorkProject("가져온 프로젝트", "COMMON", activeCycleId, now)
      );
    }

    const fallbackProjectId = getFallbackWorkProjectId(
      projectsToSave,
      entities.workProjects
    );

    const importedWorkItems: WorkItem[] = draft.workItems.map((item) => {
      const projectId = projectIdByKey.get(item.projectKey);
      const project = [...entities.workProjects, ...projectsToSave].find(
        (candidate) => candidate.id === projectId
      );

      return {
        id: `import-work-${crypto.randomUUID()}`,
        cycleIds: [activeCycleId],
        source: "import",
        projectId: projectId ?? fallbackProjectId,
        title: item.title,
        system: project?.system ?? item.system,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        periodNote: item.periodNote,
        priority: item.priority,
        riskLevel: item.riskLevel,
        categories: item.categories,
        categoryColors: {},
        problem: item.problem,
        role: item.role,
        technologies: item.technologies,
        actions: item.actions,
        difficulties: item.difficulties,
        solution: item.solution,
        result: item.result,
        lessons: item.lessons,
        resumeStatements: item.resumeStatements,
        essayPoints: item.essayPoints,
        interviewPoints: item.interviewPoints,
        metricsToVerify: item.metricsToVerify,
        dangerousClaims: item.dangerousClaims,
        safeClaims: item.safeClaims,
        evidenceRefs: item.evidenceRefs,
        learningQuestions: item.learningQuestions,
        resumeFit: item.resumeFit,
        score: item.score,
        createdAt: now,
        updatedAt: now
      };
    });

    await careerLabRepository.saveWorkProjectsAndItems(
      projectsToSave,
      importedWorkItems
    );
    setEntities((current) =>
      current
        ? {
            ...current,
            workProjects: [...current.workProjects, ...projectsToSave],
            workItems: [...current.workItems, ...importedWorkItems]
          }
        : current
    );
    setSelectedWorkItemId(importedWorkItems[0]?.id ?? null);
    pushToast({
      title: "업무 가져오기 완료",
      description: `${projectsToSave.length}개 프로젝트와 ${importedWorkItems.length}개 업무를 추가했습니다.`
    });
  }

  async function handleImportWorkItemScores(
    updates: WorkItemScoreImportUpdate[]
  ) {
    if (!entities) {
      return;
    }

    const updatesById = new Map(updates.map((update) => [update.id, update]));
    const now = new Date().toISOString();
    const updatedWorkItems = entities.workItems
      .filter((workItem) => updatesById.has(workItem.id))
      .map((workItem) => {
        const update = updatesById.get(workItem.id)!;

        return {
          ...workItem,
          resumeFit: update.resumeFit,
          score: update.score,
          updatedAt: now
        };
      });

    if (updatedWorkItems.length === 0) {
      pushToast({
        title: "점수 반영 실패",
        description: "현재 업무 목록과 일치하는 평가 결과가 없습니다."
      });
      return;
    }

    await careerLabRepository.saveWorkProjectsAndItems([], updatedWorkItems);
    setEntities((current) =>
      current
        ? {
            ...current,
            workItems: current.workItems.map((workItem) =>
              updatesById.has(workItem.id)
                ? updatedWorkItems.find((item) => item.id === workItem.id) ??
                  workItem
                : workItem
            )
          }
        : current
    );
    pushToast({
      title: "점수 반영 완료",
      description: `${updatedWorkItems.length}개 업무의 활용도 점수를 저장했습니다.`
    });
  }

  async function handleSaveWorkItem(workItem: WorkItem) {
    const updatedWorkItem: WorkItem = {
      ...workItem,
      updatedAt: new Date().toISOString()
    };

    await careerLabRepository.saveWorkItem(updatedWorkItem);
    setEntities((current) =>
      current ? replaceWorkItem(current, updatedWorkItem) : current
    );
    pushToast({
      title: "업무 저장됨",
      description: "WorkItem 변경사항을 로컬 DB에 저장했습니다."
    });

    return updatedWorkItem;
  }

  async function handleDeleteWorkItem(workItemId: string) {
    if (!entities) {
      return;
    }

    const workItem = entities.workItems.find((item) => item.id === workItemId);

    if (!workItem) {
      pushToast({
        title: "삭제할 수 없음",
        description: "이미 삭제됐거나 찾을 수 없는 업무입니다."
      });
      return;
    }

    const linkedStatementIds = new Set(
      entities.resumeStatements
        .filter((statement) => statement.workItemId === workItemId)
        .map((statement) => statement.id)
    );
    const result = await careerLabRepository.deleteWorkItemWithResumeStatements(
      workItemId
    );

    if (!result.deleted) {
      pushToast({
        title: "삭제할 수 없음",
        description: "이미 삭제됐거나 찾을 수 없는 업무입니다."
      });
      return;
    }

    setEntities((current) =>
      current
        ? {
            ...current,
            resumeStatements: current.resumeStatements.filter(
              (statement) => statement.workItemId !== workItemId
            ),
            workItems: current.workItems.filter((item) => item.id !== workItemId)
          }
        : current
    );
    setSelectedWorkItemId((current) => (current === workItemId ? null : current));
    setSelectedStatementId((current) =>
      current && linkedStatementIds.has(current) ? null : current
    );
    pushToast({
      title: "업무 삭제됨",
      description:
        result.deletedResumeStatementCount > 0
          ? `연결된 경력기술서 문구 ${result.deletedResumeStatementCount}개도 함께 삭제했습니다.`
          : "선택한 업무를 삭제했습니다."
    });
  }

  async function handleAddResumeStatement(workItemId: string) {
    const activeCycleId =
      settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId;
    const now = new Date().toISOString();
    const statement: ResumeStatement = {
      id: `resume-user-${crypto.randomUUID()}`,
      cycleIds: [activeCycleId],
      source: "user",
      workItemId,
      text: "새 경력기술서 문구 초안",
      draftBaseline: "새 경력기술서 문구 초안",
      status: "candidate",
      versions: [],
      createdAt: now,
      updatedAt: now
    };

    await careerLabRepository.saveResumeStatement(statement);
    setEntities((current) =>
      current
        ? {
            ...current,
            resumeStatements: [...current.resumeStatements, statement]
          }
        : current
    );
    setSelectedStatementId(statement.id);
    pushToast({
      title: "경력기술서 문구 추가됨",
      description: "선택한 업무에 연결된 문구 초안을 만들었습니다."
    });
  }

  const handleAutosaveStatement = useCallback(
    async (statementId: string, text: string) => {
      const statement = await careerLabRepository.getResumeStatement(statementId);
      if (!statement || statement.text === text) {
        return;
      }

      const updatedStatement: ResumeStatement = {
        ...statement,
        draftBaseline:
          statement.draftBaseline ?? statement.versions.at(-1)?.after ?? statement.text,
        text,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveResumeStatement(updatedStatement);
      setEntities((current) =>
        current ? replaceResumeStatement(current, updatedStatement) : current
      );
    },
    []
  );

  const handleUpdateResumeStatementStatus = useCallback(
    async (statementId: string, status: ResumeStatementStatus) => {
      const statement = await careerLabRepository.getResumeStatement(statementId);
      if (!statement || statement.status === status) {
        return;
      }

      const updatedStatement: ResumeStatement = {
        ...statement,
        status,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveResumeStatement(updatedStatement);
      setEntities((current) =>
        current ? replaceResumeStatement(current, updatedStatement) : current
      );
      pushToast({
        title: "문구 상태 저장됨",
        description: status
      });
    },
    [pushToast]
  );

  const handleSaveResumeVersion = useCallback(
    async ({
      after,
      before,
      rationale,
      statementId
    }: SaveResumeVersionInput): Promise<VersionRecord> => {
      const statement = await careerLabRepository.getResumeStatement(statementId);

      if (!statement) {
        throw new Error("Resume statement not found.");
      }

      const now = new Date().toISOString();
      const version: VersionRecord = {
        id: `version-${crypto.randomUUID()}`,
        createdAt: now,
        before,
        after,
        rationale,
        diffText: createTextDiff(before, after),
        tags: ["manual-save", "resume"]
      };
      const updatedStatement: ResumeStatement = {
        ...statement,
        draftBaseline: after,
        text: after,
        versions: [...statement.versions, version],
        updatedAt: now
      };

      await careerLabRepository.saveResumeStatement(updatedStatement);
      setEntities((current) =>
        current ? replaceResumeStatement(current, updatedStatement) : current
      );
      pushToast({
        title: "경력기술서 버전 저장됨",
        description: "버전 기록에 저장했습니다."
      });

      return version;
    },
    [pushToast]
  );

  const handleRestoreResumeVersion = useCallback(
    async (statementId: string, versionId: string) => {
      const statement = await careerLabRepository.getResumeStatement(statementId);

      if (!statement) {
        pushToast({
          title: "버전 적용 실패",
          description: "대상 문구를 찾을 수 없습니다."
        });
        return false;
      }

      const targetVersion = statement.versions.find(
        (version) => version.id === versionId
      );

      if (!targetVersion) {
        pushToast({
          title: "버전 적용 실패",
          description: "선택한 버전을 찾을 수 없습니다."
        });
        return false;
      }

      const updatedStatement: ResumeStatement = {
        ...statement,
        draftBaseline: targetVersion.after,
        text: targetVersion.after,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveResumeStatement(updatedStatement);
      setEntities((current) =>
        current ? replaceResumeStatement(current, updatedStatement) : current
      );
      pushToast({
        title: "선택한 버전이 적용됨",
        description: "현재 초안만 선택한 버전 내용으로 바꿨습니다."
      });
      return true;
    },
    [pushToast]
  );

  const handleCopyResumeEvaluationPrompt = useCallback(
    async (statementId: string) => {
      if (!entities) {
        return;
      }

      const statement = entities.resumeStatements.find(
        (item) => item.id === statementId
      );
      const workItem = statement
        ? entities.workItems.find((item) => item.id === statement.workItemId)
        : undefined;

      if (!statement || !workItem) {
        pushToast({
          title: "평가 프롬프트 생성 실패",
          description: "문구 또는 연결 업무를 찾을 수 없습니다."
        });
        return;
      }

      const prompt = buildResumeStatementEvaluationPrompt({
        statement,
        workItem
      });

      let copied = true;
      try {
        await copyText(prompt);
      } catch {
        copied = false;
      }

      const promptHistory: PromptHistory = {
        id: `prompt-${crypto.randomUUID()}`,
        cycleId: settings?.activeCycleId ?? null,
        createdAt: new Date().toISOString(),
        templateType: "resume-statement-evaluation",
        targetId: statementId,
        prompt
      };

      await careerLabRepository.savePromptHistory(promptHistory);
      setEntities((current) =>
        current
          ? {
              ...current,
              promptHistory: [...current.promptHistory, promptHistory]
            }
          : current
      );
      pushToast({
        title: copied ? "평가 프롬프트 복사됨" : "평가 프롬프트 저장됨",
        description: "프롬프트 기록에도 저장했습니다."
      });
    },
    [entities, pushToast, settings?.activeCycleId]
  );

  const handleImportResumeEvaluation = useCallback(
    async (statementId: string, input: string) => {
      const statement = await careerLabRepository.getResumeStatement(statementId);
      if (!statement) {
        pushToast({
          title: "평가 저장 실패",
          description: "대상 문구를 찾을 수 없습니다."
        });
        return false;
      }

      const result = parseResumeEvaluationJson(input);
      if (!result.ok) {
        pushToast({
          title: "평가 JSON 오류",
          description: result.message
        });
        return false;
      }

      const updatedStatement: ResumeStatement = {
        ...statement,
        evaluation: result.evaluation,
        status: result.evaluation.recommendedStatus ?? statement.status,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveResumeStatement(updatedStatement);
      setEntities((current) =>
        current ? replaceResumeStatement(current, updatedStatement) : current
      );
      pushToast({
        title: "평가 저장됨",
        description: `${result.evaluation.fitScore}점 평가를 반영했습니다.`
      });
      return true;
    },
    [pushToast]
  );

  const handleCopyResumeGenerationPrompt = useCallback(
    async (input: CopyResumeGenerationPromptInput) => {
      if (!entities) {
        return;
      }

      const selectedWorkItems = input.workItemIds
        .map((workItemId) =>
          entities.workItems.find((workItem) => workItem.id === workItemId)
        )
        .filter((workItem): workItem is WorkItem => Boolean(workItem));

      if (selectedWorkItems.length === 0) {
        pushToast({
          title: "프롬프트 생성 실패",
          description: "선택된 업무가 없습니다."
        });
        return;
      }

      const prompt = buildResumeStatementGenerationPrompt({
        ...input,
        workItems: selectedWorkItems
      });

      let copied = true;
      try {
        await copyText(prompt);
      } catch {
        copied = false;
      }

      const promptHistory: PromptHistory = {
        id: `prompt-${crypto.randomUUID()}`,
        cycleId: settings?.activeCycleId ?? null,
        createdAt: new Date().toISOString(),
        templateType: "resume-statement-generation",
        targetId: input.workItemIds.join(","),
        prompt
      };

      await careerLabRepository.savePromptHistory(promptHistory);
      setEntities((current) =>
        current
          ? {
              ...current,
              promptHistory: [...current.promptHistory, promptHistory]
            }
          : current
      );
      pushToast({
        title: copied ? "경력기술서 프롬프트 복사됨" : "프롬프트 저장됨",
        description: copied
          ? "프롬프트 기록에도 저장했습니다."
          : "클립보드 복사는 실패했지만 프롬프트 기록에는 저장했습니다."
      });
    },
    [entities, pushToast, settings?.activeCycleId]
  );

  const handleSaveResumePromptProfile = useCallback(
    async (input: SaveResumePromptProfileInput) => {
      if (!entities) {
        throw new Error("Entities are not loaded.");
      }

      const now = new Date().toISOString();
      const existingProfile = input.id
        ? entities.resumePromptProfiles.find((profile) => profile.id === input.id)
        : undefined;
      const profile: ResumePromptProfile = {
        id: existingProfile?.id ?? `resume-prompt-profile-${crypto.randomUUID()}`,
        cycleIds: existingProfile?.cycleIds ?? [
          settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId
        ],
        source: existingProfile?.source ?? "user",
        name: input.name.trim(),
        targetLength: input.targetLength,
        tone: input.tone,
        statementCount: input.statementCount,
        emphasis: input.emphasis,
        excludedExpressions: input.excludedExpressions,
        jdKeywords: input.jdKeywords,
        createdAt: existingProfile?.createdAt ?? now,
        updatedAt: now
      };

      await careerLabRepository.saveResumePromptProfile(profile);
      setEntities((current) =>
        current
          ? {
              ...current,
              resumePromptProfiles: upsertResumePromptProfile(
                current.resumePromptProfiles,
                profile
              )
            }
          : current
      );
      pushToast({
        title: "옵션 프로파일 저장됨",
        description: `${profile.name} 프로파일을 저장했습니다.`
      });

      return profile;
    },
    [entities, pushToast, settings?.activeCycleId]
  );

  const handleDeleteResumePromptProfile = useCallback(
    async (id: string) => {
      const profileName =
        entities?.resumePromptProfiles.find((profile) => profile.id === id)
          ?.name ?? "옵션";

      await careerLabRepository.deleteResumePromptProfile(id);
      setEntities((current) =>
        current
          ? {
              ...current,
              resumePromptProfiles: current.resumePromptProfiles.filter(
                (profile) => profile.id !== id
              )
            }
          : current
      );
      pushToast({
        title: "옵션 프로파일 삭제됨",
        description: `${profileName} 프로파일을 삭제했습니다.`
      });
    },
    [entities?.resumePromptProfiles, pushToast]
  );

  async function handleAddEssaySet(): Promise<EssaySet> {
    const activeCycleId =
      settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId;
    const now = new Date().toISOString();
    const essaySet: EssaySet = {
      id: `essay-set-user-${crypto.randomUUID()}`,
      cycleIds: [activeCycleId],
      source: "user",
      title: "새 자기소개서 묶음",
      companyName: "",
      roleTitle: "",
      status: "drafting",
      deadline: "",
      jdKeywords: "",
      formatNotes: "",
      notes: "",
      createdAt: now,
      updatedAt: now
    };

    await careerLabRepository.saveEssaySet(essaySet);
    setEntities((current) =>
      current
        ? {
            ...current,
            essaySets: [...current.essaySets, essaySet]
          }
        : current
    );
    setSelectedEssaySetId(essaySet.id);
    setSelectedEssayQuestionId(null);
    pushToast({
      title: "묶음 추가됨",
      description: "새 자기소개서 묶음을 만들었습니다."
    });

    return essaySet;
  }

  const handleUpdateEssaySet = useCallback(
    async ({
      companyName,
      deadline,
      formatNotes,
      jdKeywords,
      notes,
      roleTitle,
      setId,
      status,
      title
    }: UpdateEssaySetInput) => {
      const currentSet = await careerLabRepository.getEssaySet(setId);

      if (!currentSet) {
        return;
      }

      if (
        currentSet.title === title &&
        currentSet.companyName === companyName &&
        currentSet.roleTitle === roleTitle &&
        currentSet.status === status &&
        currentSet.deadline === deadline &&
        currentSet.jdKeywords === jdKeywords &&
        currentSet.formatNotes === formatNotes &&
        currentSet.notes === notes
      ) {
        return;
      }

      const updatedSet: EssaySet = {
        ...currentSet,
        companyName,
        deadline,
        formatNotes,
        jdKeywords,
        notes,
        roleTitle,
        status,
        title,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveEssaySet(updatedSet);
      setEntities((current) =>
        current
          ? {
              ...current,
              essaySets: current.essaySets.map((set) =>
                set.id === updatedSet.id ? updatedSet : set
              )
            }
          : current
      );
    },
    []
  );

  const handleDeleteEssaySet = useCallback(
    async (essaySetId: string) => {
      const result = await careerLabRepository.deleteEssaySetWithQuestions(
        essaySetId
      );

      if (!result.deleted) {
        pushToast({
          title: "삭제할 수 없음",
          description: "이미 삭제됐거나 찾을 수 없는 자기소개서 묶음입니다."
        });
        return;
      }

      setEntities((current) => {
        if (!current) {
          return current;
        }

        const nextSets = current.essaySets.filter((set) => set.id !== essaySetId);
        const nextQuestions = current.essayQuestions.filter(
          (question) => question.essaySetId !== essaySetId
        );
        const nextSetId =
          selectedEssaySetId === essaySetId
            ? nextSets[0]?.id ?? null
            : selectedEssaySetId;

        setSelectedEssaySetId(nextSetId);
        setSelectedEssayQuestionId((currentQuestionId) => {
          const currentQuestionStillExists =
            currentQuestionId &&
            nextQuestions.some((question) => question.id === currentQuestionId);

          if (currentQuestionStillExists) {
            return currentQuestionId;
          }

          return (
            nextQuestions.find((question) => question.essaySetId === nextSetId)
              ?.id ?? null
          );
        });

        return {
          ...current,
          essayQuestions: nextQuestions,
          essaySets: nextSets
        };
      });
      pushToast({
        title: "묶음 삭제됨",
        description:
          result.deletedQuestionCount > 0
            ? `연결된 자기소개서 문항 ${result.deletedQuestionCount}개도 함께 삭제했습니다.`
            : "선택한 자기소개서 묶음을 삭제했습니다."
      });
    },
    [pushToast, selectedEssaySetId]
  );

  async function handleAddEssayQuestion(essaySetId: string) {
    const activeCycleId =
      settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId;
    const now = new Date().toISOString();
    const question: EssayQuestion = {
      id: `essay-user-${crypto.randomUUID()}`,
      cycleIds: [activeCycleId],
      source: "user",
      essaySetId,
      question: "새 자기소개서 문항",
      answer: "",
      targetLength: {
        min: 700,
        max: 1000
      },
      linkedWorkItemIds: [],
      versions: [],
      createdAt: now,
      updatedAt: now
    };

    await careerLabRepository.saveEssayQuestion(question);
    setEntities((current) =>
      current
        ? {
            ...current,
            essayQuestions: [...current.essayQuestions, question]
          }
        : current
    );
    setSelectedEssaySetId(essaySetId);
    setSelectedEssayQuestionId(question.id);
    pushToast({
      title: "문항 추가됨",
      description: "새 자기소개서 문항을 추가했습니다."
    });
  }

  const handleDeleteEssayQuestion = useCallback(
    async (questionId: string) => {
      const question = await careerLabRepository.getEssayQuestion(questionId);

      if (!question) {
        pushToast({
          title: "삭제할 수 없음",
          description: "이미 삭제됐거나 찾을 수 없는 문항입니다."
        });
        return;
      }

      await careerLabRepository.deleteEssayQuestion(questionId);
      setEntities((current) => {
        if (!current) {
          return current;
        }

        const nextQuestions = current.essayQuestions.filter(
          (item) => item.id !== questionId
        );

        if (selectedEssayQuestionId === questionId) {
          setSelectedEssayQuestionId(nextQuestions[0]?.id ?? null);
        }

        return {
          ...current,
          essayQuestions: nextQuestions
        };
      });
      pushToast({
        title: "문항 삭제됨",
        description: "선택한 자기소개서 문항을 삭제했습니다."
      });
    },
    [pushToast, selectedEssayQuestionId]
  );

  const handleAutosaveEssay = useCallback(
    async (questionId: string, answer: string) => {
      const question = await careerLabRepository.getEssayQuestion(questionId);
      if (!question || question.answer === answer) {
        return;
      }

      const updatedQuestion: EssayQuestion = {
        ...question,
        answer,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveEssayQuestion(updatedQuestion);
      setEntities((current) =>
        current ? replaceEssayQuestion(current, updatedQuestion) : current
      );
    },
    []
  );

  const handleSaveEssayVersion = useCallback(
    async ({
      after,
      before,
      questionId,
      rationale
    }: SaveEssayVersionInput): Promise<VersionRecord> => {
      const question = await careerLabRepository.getEssayQuestion(questionId);

      if (!question) {
        throw new Error("Essay question not found.");
      }

      const now = new Date().toISOString();
      const version: VersionRecord = {
        id: `version-${crypto.randomUUID()}`,
        createdAt: now,
        before,
        after,
        rationale,
        diffText: createTextDiff(before, after),
        tags: ["manual-save", "essay"]
      };
      const updatedQuestion: EssayQuestion = {
        ...question,
        answer: after,
        versions: [...question.versions, version],
        updatedAt: now
      };

      await careerLabRepository.saveEssayQuestion(updatedQuestion);
      setEntities((current) =>
        current ? replaceEssayQuestion(current, updatedQuestion) : current
      );
      pushToast({
        title: "자기소개서 버전 저장됨",
        description: "버전 기록에 저장했습니다."
      });

      return version;
    },
    [pushToast]
  );

  const handleUpdateEssayQuestion = useCallback(
    async ({ question, questionId, targetLength }: UpdateEssayQuestionInput) => {
      const currentQuestion = await careerLabRepository.getEssayQuestion(questionId);

      if (!currentQuestion) {
        return;
      }

      if (
        currentQuestion.question === question &&
        currentQuestion.targetLength.min === targetLength.min &&
        currentQuestion.targetLength.max === targetLength.max
      ) {
        return;
      }

      const updatedQuestion: EssayQuestion = {
        ...currentQuestion,
        question,
        targetLength,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveEssayQuestion(updatedQuestion);
      setEntities((current) =>
        current ? replaceEssayQuestion(current, updatedQuestion) : current
      );
    },
    []
  );

  const handleRestoreEssayVersion = useCallback(
    async (questionId: string, versionId: string) => {
      const question = await careerLabRepository.getEssayQuestion(questionId);

      if (!question) {
        pushToast({
          title: "버전 적용 실패",
          description: "대상 문항을 찾을 수 없습니다."
        });
        return false;
      }

      const targetVersion = question.versions.find(
        (version) => version.id === versionId
      );

      if (!targetVersion) {
        pushToast({
          title: "버전 적용 실패",
          description: "선택한 버전을 찾을 수 없습니다."
        });
        return false;
      }

      const updatedQuestion: EssayQuestion = {
        ...question,
        answer: targetVersion.after,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveEssayQuestion(updatedQuestion);
      setEntities((current) =>
        current ? replaceEssayQuestion(current, updatedQuestion) : current
      );
      pushToast({
        title: "선택한 버전이 적용됨",
        description: "현재 답변을 선택한 버전 내용으로 바꿨습니다."
      });
      return true;
    },
    [pushToast]
  );

  const handleCopyEssayPrompt = useCallback(
    async (questionId: string, currentAnswer: string) => {
      if (!entities) {
        return;
      }

      const template = entities.promptTemplates.find(
        (item) => item.templateType === "essay-revision"
      );
      const promptEntities: CareerLabEntities = {
        ...entities,
        essayQuestions: entities.essayQuestions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                answer: currentAnswer
              }
            : question
        )
      };
      const target = buildPromptTargets(promptEntities).find(
        (item) => item.key === `essay-question:${questionId}`
      );

      if (!template || !target) {
        pushToast({
          title: "프롬프트 생성 실패",
          description: "자기소개서 첨삭 템플릿 또는 대상 문항을 찾을 수 없습니다."
        });
        return;
      }

      const prompt = renderPromptTemplate({
        includeRiskNotes: true,
        target,
        template
      });

      let copied = true;
      try {
        await copyText(prompt);
      } catch {
        copied = false;
      }

      const promptHistory: PromptHistory = {
        id: `prompt-${crypto.randomUUID()}`,
        cycleId: settings?.activeCycleId ?? null,
        createdAt: new Date().toISOString(),
        templateType: template.templateType,
        targetId: questionId,
        prompt
      };

      await careerLabRepository.savePromptHistory(promptHistory);
      setEntities((current) =>
        current
          ? {
              ...current,
              promptHistory: [...current.promptHistory, promptHistory]
            }
          : current
      );
      pushToast({
        title: copied ? "자기소개서 프롬프트 복사됨" : "프롬프트 저장됨",
        description: copied
          ? "프롬프트 기록에도 저장했습니다."
          : "클립보드 복사는 실패했지만 프롬프트 기록에는 저장했습니다."
      });
    },
    [entities, pushToast, settings?.activeCycleId]
  );

  async function handleAddInterviewQuestion() {
    const activeCycleId =
      settings?.activeCycleId ?? runtimeSeedSettings.activeCycleId;
    const now = new Date().toISOString();
    const question: InterviewQuestion = {
      id: `interview-user-${crypto.randomUUID()}`,
      cycleIds: [activeCycleId],
      source: "user",
      question: "새 면접 질문",
      intent: "면접관 의도를 입력하세요.",
      answerDirection: "답변 방향을 입력하세요.",
      myAnswer: "",
      exampleAnswer: "",
      linkedWorkItemIds: [],
      understanding: "unknown",
      followUps: [],
      versions: [],
      createdAt: now,
      updatedAt: now
    };

    await careerLabRepository.saveInterviewQuestion(question);
    await refreshData();
    setSelectedInterviewQuestionId(question.id);
    pushToast({
      title: "면접 질문 추가됨",
      description: "새 면접 질문을 추가했습니다."
    });
  }

  const handleUpdateInterviewQuestion = useCallback(
    async ({
      answerDirection,
      exampleAnswer,
      intent,
      myAnswer,
      question: questionText,
      questionId
    }: UpdateInterviewQuestionInput) => {
      const question = await careerLabRepository.getInterviewQuestion(questionId);
      if (!question) {
        return;
      }

      if (
        question.question === questionText &&
        question.intent === intent &&
        question.answerDirection === answerDirection &&
        question.myAnswer === myAnswer &&
        question.exampleAnswer === exampleAnswer
      ) {
        return;
      }

      const updatedQuestion: InterviewQuestion = {
        ...question,
        answerDirection,
        exampleAnswer,
        intent,
        myAnswer,
        question: questionText,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveInterviewQuestion(updatedQuestion);
      setEntities((current) =>
        current ? replaceInterviewQuestion(current, updatedQuestion) : current
      );
    },
    []
  );

  const handleDeleteInterviewQuestion = useCallback(
    async (questionId: string) => {
      await careerLabRepository.deleteInterviewQuestion(questionId);
      setEntities((current) => {
        if (!current) {
          return current;
        }

        const removedIndex = current.interviewQuestions.findIndex(
          (question) => question.id === questionId
        );
        const nextQuestions = current.interviewQuestions.filter(
          (question) => question.id !== questionId
        );
        const nextSelected =
          nextQuestions[Math.min(Math.max(removedIndex, 0), nextQuestions.length - 1)]
            ?.id ?? null;

        setSelectedInterviewQuestionId(nextSelected);

        return {
          ...current,
          interviewQuestions: nextQuestions
        };
      });
      pushToast({
        title: "면접 질문 삭제됨",
        description: "질문과 꼬리질문 체인을 삭제했습니다."
      });
    },
    [pushToast]
  );

  async function handleUpdateInterviewUnderstanding(
    questionId: string,
    understanding: InterviewUnderstanding
  ) {
    const question = await careerLabRepository.getInterviewQuestion(questionId);
    if (!question) {
      return;
    }

    const updatedQuestion: InterviewQuestion = {
      ...question,
      understanding,
      updatedAt: new Date().toISOString()
    };

    await careerLabRepository.saveInterviewQuestion(updatedQuestion);
    setEntities((current) =>
      current ? replaceInterviewQuestion(current, updatedQuestion) : current
    );
  }

  async function handleAddInterviewFollowUp({
    anchor,
    parentId = null,
    questionId
  }: AddInterviewFollowUpInput) {
    const question = await careerLabRepository.getInterviewQuestion(questionId);
    if (!question) {
      return;
    }

    const followUp: InterviewFollowUp = {
      id: `follow-up-${crypto.randomUUID()}`,
      parentId,
      anchor: anchor ?? { type: "main-question" },
      question: "새 꼬리질문",
      intent: "면접관 의도를 입력하세요.",
      answerDirection: "답변 방향을 입력하세요.",
      myAnswer: "",
      exampleAnswer: "",
      riskWarnings: [],
      tags: ["user"],
      children: []
    };
    const nextFollowUps = parentId
      ? addFollowUpToTree(question.followUps, parentId, followUp)
      : [...question.followUps, followUp];
    const updatedQuestion: InterviewQuestion = {
      ...question,
      followUps: nextFollowUps,
      updatedAt: new Date().toISOString()
    };

    await careerLabRepository.saveInterviewQuestion(updatedQuestion);
    setEntities((current) =>
      current ? replaceInterviewQuestion(current, updatedQuestion) : current
    );
    pushToast({
      title: "꼬리질문 추가됨",
      description: "현재 질문 thread에 추가했습니다."
    });
  }

  const handleUpdateInterviewFollowUp = useCallback(
    async ({
      anchor,
      answerDirection,
      exampleAnswer,
      followUpId,
      intent,
      myAnswer,
      question: followUpQuestion,
      questionId,
      riskWarnings,
      tags
    }: UpdateInterviewFollowUpInput) => {
      const question = await careerLabRepository.getInterviewQuestion(questionId);
      if (!question) {
        return;
      }

      const updatedFollowUps = updateFollowUpInTree(
        question.followUps,
        followUpId,
        (followUp) => ({
          ...followUp,
          anchor,
          answerDirection,
          exampleAnswer,
          intent,
          myAnswer,
          question: followUpQuestion,
          riskWarnings,
          tags
        })
      );

      if (updatedFollowUps === question.followUps) {
        return;
      }

      const updatedQuestion: InterviewQuestion = {
        ...question,
        followUps: updatedFollowUps,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveInterviewQuestion(updatedQuestion);
      setEntities((current) =>
        current ? replaceInterviewQuestion(current, updatedQuestion) : current
      );
    },
    []
  );

  const handleDeleteInterviewFollowUp = useCallback(
    async (questionId: string, followUpId: string) => {
      const question = await careerLabRepository.getInterviewQuestion(questionId);
      if (!question) {
        return;
      }

      const updatedFollowUps = deleteFollowUpFromTree(
        question.followUps,
        followUpId
      );

      if (updatedFollowUps === question.followUps) {
        return;
      }

      const updatedQuestion: InterviewQuestion = {
        ...question,
        followUps: updatedFollowUps,
        updatedAt: new Date().toISOString()
      };

      await careerLabRepository.saveInterviewQuestion(updatedQuestion);
      setEntities((current) =>
        current ? replaceInterviewQuestion(current, updatedQuestion) : current
      );
      pushToast({
        title: "꼬리질문 삭제됨",
        description: "선택한 꼬리질문과 하위 질문을 삭제했습니다."
      });
    },
    [pushToast]
  );

  const handleCopyInterviewFollowUpPrompt = useCallback(
    async (questionId: string, currentAnswer: string) => {
      if (!entities) {
        return;
      }

      const template = entities.promptTemplates.find(
        (item) => item.templateType === "interview-followup"
      );
      const promptEntities: CareerLabEntities = {
        ...entities,
        interviewQuestions: entities.interviewQuestions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                myAnswer: currentAnswer
              }
            : question
        )
      };
      const target = buildPromptTargets(promptEntities).find(
        (item) => item.key === `interview-question:${questionId}`
      );

      if (!template || !target) {
        pushToast({
          title: "프롬프트 생성 실패",
          description: "면접 꼬리질문 템플릿 또는 대상 질문을 찾을 수 없습니다."
        });
        return;
      }

      const prompt = renderPromptTemplate({
        includeRiskNotes: true,
        target,
        template
      });

      let copied = true;
      try {
        await copyText(prompt);
      } catch {
        copied = false;
      }

      const promptHistory: PromptHistory = {
        id: `prompt-${crypto.randomUUID()}`,
        cycleId: settings?.activeCycleId ?? null,
        createdAt: new Date().toISOString(),
        templateType: template.templateType,
        targetId: questionId,
        prompt
      };

      await careerLabRepository.savePromptHistory(promptHistory);
      setEntities((current) =>
        current
          ? {
              ...current,
              promptHistory: [...current.promptHistory, promptHistory]
            }
          : current
      );
      pushToast({
        title: copied ? "꼬리질문 프롬프트 복사됨" : "프롬프트 저장됨",
        description: copied
          ? "프롬프트 기록에도 저장했습니다."
          : "클립보드 복사는 실패했지만 프롬프트 기록에는 저장했습니다."
      });
    },
    [entities, pushToast, settings?.activeCycleId]
  );

  async function handleImportInterviewFollowUps(
    questionId: string,
    importedFollowUps: ImportedInterviewFollowUp[]
  ) {
    const question = await careerLabRepository.getInterviewQuestion(questionId);
    if (!question) {
      pushToast({
        title: "가져오기 실패",
        description: "대상 면접 질문을 찾을 수 없습니다."
      });
      return 0;
    }

    const importedCount = countImportedFollowUps(importedFollowUps);
    const materializedFollowUps = materializeImportedFollowUps(
      importedFollowUps,
      () => `follow-up-${crypto.randomUUID()}`
    );
    const updatedQuestion: InterviewQuestion = {
      ...question,
      followUps: [...question.followUps, ...materializedFollowUps],
      updatedAt: new Date().toISOString()
    };

    await careerLabRepository.saveInterviewQuestion(updatedQuestion);
    setEntities((current) =>
      current ? replaceInterviewQuestion(current, updatedQuestion) : current
    );
    pushToast({
      title: "꼬리질문 import 완료",
      description: `${importedCount}개 꼬리질문을 현재 thread에 추가했습니다.`
    });

    return importedCount;
  }

  async function handleCreateExport() {
    const bundle = await careerLabRepository.exportAllData();
    return JSON.stringify(bundle, null, 2);
  }

  async function handleCreateCycleExport() {
    const bundle = await careerLabRepository.exportActiveCycleData();
    return JSON.stringify(bundle, null, 2);
  }

  async function handleCreateMarkdownExport(kind: MarkdownExportKind) {
    if (!entities) {
      return "";
    }

    return createMarkdownExport(kind, entities);
  }

  async function handleCopyEssaySetMarkdown(essaySetId: string) {
    if (!entities) {
      return;
    }

    const essaySet = entities.essaySets.find((set) => set.id === essaySetId);
    const markdown = createEssaySetMarkdown(entities, essaySetId);

    try {
      await copyText(markdown);
      pushToast({
        title: "자기소개서 묶음 MD 복사됨",
        description: essaySet?.title ?? essaySetId
      });
    } catch {
      pushToast({
        title: "복사 실패",
        description: "브라우저 클립보드 권한을 확인하세요."
      });
    }
  }

  async function handleDownloadEssaySetMarkdown(essaySetId: string) {
    if (!entities) {
      return;
    }

    const essaySet = entities.essaySets.find((set) => set.id === essaySetId);
    const markdown = createEssaySetMarkdown(entities, essaySetId);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${formatEssaySetMarkdownFilename(essaySet)}.md`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    pushToast({
      title: "자기소개서 묶음 MD 다운로드",
      description: essaySet?.title ?? essaySetId
    });
  }

  async function handleConfirmImport(bundle: CareerLabExportBundle) {
    await careerLabRepository.replaceWithImportBundle(bundle);
    await refreshData();
    pushToast({
      title: "전체 교체 완료",
      description: "검증된 백업으로 로컬 데이터를 교체했습니다."
    });
  }

  async function handleMergeCycleImport(bundle: CareerLabExportBundle) {
    await careerLabRepository.mergeCycleImportBundle(bundle);
    await refreshData();
    pushToast({
      title: "현재 준비 병합 완료",
      description: "미리보기로 확인한 데이터를 현재 준비 범위에 병합했습니다."
    });
  }

  async function handleResetSampleData() {
    await careerLabRepository.resetToSeed();
    await refreshData({ resetSelections: true });
    pushToast({
      title: "샘플 데이터 리셋됨",
      description: "공개 데모용 초기 데이터로 되돌렸습니다."
    });
  }

  function renderPage() {
    if (loadStatus === "error") {
      return (
        <section className="px-6 py-6 text-sm text-rose-700">
          로컬 데이터를 불러오지 못했습니다.
        </section>
      );
    }

    if (loadStatus === "loading" || !entities || !sortedEntities || !settings) {
      return (
        <section className="px-6 py-6 text-sm text-zinc-600">
          로컬 데이터를 불러오는 중입니다.
        </section>
      );
    }

    switch (activeItemId) {
      case "dashboard":
        return (
          <DashboardPage
            entities={sortedEntities}
            onNavigate={setActiveItemId}
            onResetSampleData={handleResetSampleData}
            sampleResetAvailable={isDemoSeedProfile}
          />
        );
      case "work-projects":
        return (
          <WorkProjectsPage
            onAddWorkProject={handleAddWorkProject}
            onDeleteWorkProject={handleDeleteWorkProject}
            onSaveWorkProject={handleSaveWorkProject}
            workItems={sortedEntities.workItems}
            workProjects={sortedEntities.workProjects}
          />
        );
      case "work-understanding":
        return (
          <WorkUnderstandingPage
            addWorkItemOpen={addWorkItemOpen}
            discoveryOpen={discoverWorkItemsOpen}
            importOpen={importWorkItemsOpen}
            onAddWorkItem={handleAddWorkItem}
            onAddWorkItemOpenChange={setAddWorkItemOpen}
            onDeleteWorkItem={handleDeleteWorkItem}
            onDiscoveryOpenChange={setDiscoverWorkItemsOpen}
            onImportWorkItemScores={handleImportWorkItemScores}
            onImportWorkItems={handleImportWorkItems}
            onImportOpenChange={setImportWorkItemsOpen}
            onSaveWorkItem={handleSaveWorkItem}
            onScoringOpenChange={setScoreWorkItemsOpen}
            onSelectWorkItem={setSelectedWorkItemId}
            scoringOpen={scoreWorkItemsOpen}
            selectedWorkItemId={selectedWorkItemId}
            workItems={sortedEntities.workItems}
            workProjects={sortedEntities.workProjects}
          />
        );
      case "resume-lab":
        return (
          <ResumeLabPage
            onAddStatement={handleAddResumeStatement}
            onAutosave={handleAutosaveStatement}
            onCopyEvaluationPrompt={handleCopyResumeEvaluationPrompt}
            onCopyGenerationPrompt={handleCopyResumeGenerationPrompt}
            onDeletePromptProfile={handleDeleteResumePromptProfile}
            onImportEvaluation={handleImportResumeEvaluation}
            onRestoreVersion={handleRestoreResumeVersion}
            onSavePromptProfile={handleSaveResumePromptProfile}
            onSaveVersion={handleSaveResumeVersion}
            onSelectStatement={setSelectedStatementId}
            onUpdateStatus={handleUpdateResumeStatementStatus}
            promptProfiles={entities.resumePromptProfiles}
            resumeStatements={entities.resumeStatements}
            selectedStatementId={selectedStatementId}
            workItems={sortedEntities.workItems}
            workProjects={sortedEntities.workProjects}
          />
        );
      case "essay-lab":
        return (
          <EssayLabPage
            essayQuestions={entities.essayQuestions}
            essaySets={entities.essaySets}
            onAddQuestion={handleAddEssayQuestion}
            onAddSet={handleAddEssaySet}
            onAutosave={handleAutosaveEssay}
            onCopyPrompt={handleCopyEssayPrompt}
            onDeleteQuestion={handleDeleteEssayQuestion}
            onDeleteSet={handleDeleteEssaySet}
            onDownloadSetMarkdown={handleDownloadEssaySetMarkdown}
            onRestoreVersion={handleRestoreEssayVersion}
            onSaveVersion={handleSaveEssayVersion}
            onSelectSet={setSelectedEssaySetId}
            onSelectQuestion={setSelectedEssayQuestionId}
            onCopySetMarkdown={handleCopyEssaySetMarkdown}
            onGuidePageChange={setPageGuideOverrideId}
            onUpdateSet={handleUpdateEssaySet}
            onUpdateQuestion={handleUpdateEssayQuestion}
            selectedQuestionId={selectedEssayQuestionId}
            selectedSetId={selectedEssaySetId}
            workItems={sortedEntities.workItems}
          />
        );
      case "interview-prep":
        return (
          <InterviewPrepPage
            interviewQuestions={entities.interviewQuestions}
            onAddFollowUp={handleAddInterviewFollowUp}
            onAddQuestion={handleAddInterviewQuestion}
            onCopyFollowUpPrompt={handleCopyInterviewFollowUpPrompt}
            onDeleteFollowUp={handleDeleteInterviewFollowUp}
            onDeleteQuestion={handleDeleteInterviewQuestion}
            onImportFollowUps={handleImportInterviewFollowUps}
            onSelectQuestion={setSelectedInterviewQuestionId}
            onUpdateFollowUp={handleUpdateInterviewFollowUp}
            onUpdateQuestion={handleUpdateInterviewQuestion}
            onUpdateUnderstanding={handleUpdateInterviewUnderstanding}
            selectedQuestionId={selectedInterviewQuestionId}
            workItems={sortedEntities.workItems}
          />
        );
      case "prompt-center":
      case "prompt-center-templates":
        return (
          <PromptCenterPage
            promptHistory={entities.promptHistory}
            templates={entities.promptTemplates}
            view="templates"
          />
        );
      case "prompt-center-history":
        return (
          <PromptCenterPage
            promptHistory={entities.promptHistory}
            templates={entities.promptTemplates}
            view="history"
          />
        );
      case "export-import":
        return (
          <ExportImportPage
            onConfirmImport={handleConfirmImport}
            onCreateCycleExport={handleCreateCycleExport}
            onCreateExport={handleCreateExport}
            onCreateMarkdownExport={handleCreateMarkdownExport}
            onMergeCycleImport={handleMergeCycleImport}
            onPreviewImport={(input) => careerLabRepository.previewImport(input)}
          />
        );
      default:
        return null;
    }
  }

  function renderPageActions() {
    const helpAction = currentPageGuide ? (
      <button
        aria-label={`${currentNavigation.label} 가이드 열기`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
        onClick={() => setPageGuideOpen(true)}
        type="button"
      >
        <HelpCircle aria-hidden="true" className="h-4 w-4" />
      </button>
    ) : null;

    if (activeItemId !== "work-understanding") {
      return helpAction;
    }

    return (
      <>
        {helpAction}
        <Button
          data-page-guide="ai-work-candidates"
          onClick={() => setDiscoverWorkItemsOpen(true)}
          size="sm"
        >
          AI로 업무 후보 만들기
        </Button>
        <Button
          data-page-guide="json-direct-import"
          onClick={() => setImportWorkItemsOpen(true)}
          size="sm"
        >
          JSON 직접 가져오기
        </Button>
        <Button
          data-page-guide="score-work-items"
          onClick={() => setScoreWorkItemsOpen(true)}
          size="sm"
        >
          점수 평가
        </Button>
        <Button
          data-page-guide="manual-work-add"
          onClick={() => setAddWorkItemOpen(true)}
          size="sm"
          variant="primary"
        >
          업무 추가
        </Button>
      </>
    );
  }

  return (
    <>
      <AppShell
        activeItemId={activeItemId}
        onNavigate={setActiveItemId}
        pageActions={renderPageActions()}
        title={currentNavigation.label}
      >
        {renderPage()}
      </AppShell>

      {currentPageGuide ? (
        <PageGuideOverlay
          onClose={() => setPageGuideOpen(false)}
          onDismiss={() => {
            dismissPageGuide(currentPageGuide.storageKey);
            setPageGuideOpen(false);
          }}
          open={pageGuideOpen}
          steps={currentPageGuide.steps}
        />
      ) : null}

      <ToastViewport
        messages={toasts}
        onDismiss={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
      />
    </>
  );
}

function replaceResumeStatement(
  entities: CareerLabEntities,
  updatedStatement: ResumeStatement
): CareerLabEntities {
  return {
    ...entities,
    resumeStatements: entities.resumeStatements.map((statement) =>
      statement.id === updatedStatement.id ? updatedStatement : statement
    )
  };
}

function shouldOpenPageGuide(storageKey: string | undefined) {
  if (!storageKey || import.meta.env.MODE === "test") {
    return false;
  }

  try {
    return window.localStorage.getItem(storageKey) !== "dismissed";
  } catch {
    return false;
  }
}

function dismissPageGuide(storageKey: string) {
  try {
    window.localStorage.setItem(storageKey, "dismissed");
  } catch {
    // localStorage can be unavailable in private or restricted browser contexts.
  }
}

function upsertResumePromptProfile(
  profiles: ResumePromptProfile[],
  savedProfile: ResumePromptProfile
) {
  const exists = profiles.some((profile) => profile.id === savedProfile.id);

  if (!exists) {
    return [...profiles, savedProfile];
  }

  return profiles.map((profile) =>
    profile.id === savedProfile.id ? savedProfile : profile
  );
}

function createUserWorkProject(
  name: string,
  activeCycleId: string,
  now: string
): WorkProject {
  return {
    id: `user-project-${crypto.randomUUID()}`,
    cycleIds: [activeCycleId],
    source: "user",
    name,
    system: deriveWorkSystemFromProjectName(name),
    periodNote: "기간과 근거 확인 필요",
    summary: "사용자가 직접 추가한 프로젝트입니다.",
    createdAt: now,
    updatedAt: now
  };
}

function deriveWorkSystemFromProjectName(name: string) {
  return name.trim() || "COMMON";
}

function createImportedWorkProject(
  name: string,
  system: WorkProject["system"],
  activeCycleId: string,
  now: string
): WorkProject {
  return {
    id: `import-project-${crypto.randomUUID()}`,
    cycleIds: [activeCycleId],
    source: "import",
    name,
    system,
    periodNote: "기간과 근거 확인 필요",
    summary: "업무 가져오기에서 생성된 프로젝트입니다.",
    createdAt: now,
    updatedAt: now
  };
}

function getFallbackWorkProjectId(
  importedProjects: WorkProject[],
  existingProjects: WorkProject[]
) {
  const project = importedProjects[0] ?? existingProjects[0];

  if (!project) {
    throw new Error("No work project is available for imported work items.");
  }

  return project.id;
}

function formatEssaySetMarkdownFilename(essaySet: EssaySet | undefined) {
  const parts = [
    essaySet?.companyName,
    essaySet?.roleTitle,
    essaySet?.title || "자기소개서"
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim());

  return sanitizeFilename(parts.join("_") || "자기소개서");
}

function sanitizeFilename(value: string) {
  return value
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function replaceWorkItem(
  entities: CareerLabEntities,
  updatedWorkItem: WorkItem
): CareerLabEntities {
  return {
    ...entities,
    workItems: entities.workItems.map((workItem) =>
      workItem.id === updatedWorkItem.id ? updatedWorkItem : workItem
    )
  };
}

function replaceEssayQuestion(
  entities: CareerLabEntities,
  updatedQuestion: EssayQuestion
): CareerLabEntities {
  return {
    ...entities,
    essayQuestions: entities.essayQuestions.map((question) =>
      question.id === updatedQuestion.id ? updatedQuestion : question
    )
  };
}

function replaceInterviewQuestion(
  entities: CareerLabEntities,
  updatedQuestion: InterviewQuestion
): CareerLabEntities {
  return {
    ...entities,
    interviewQuestions: entities.interviewQuestions.map((question) =>
      question.id === updatedQuestion.id ? updatedQuestion : question
    )
  };
}

function addFollowUpToTree(
  followUps: InterviewFollowUp[],
  parentId: string,
  newFollowUp: InterviewFollowUp
): InterviewFollowUp[] {
  let changed = false;
  const nextFollowUps = followUps.map((followUp) => {
    if (followUp.id === parentId) {
      changed = true;
      return {
        ...followUp,
        children: [...followUp.children, newFollowUp]
      };
    }

    const nextChildren = addFollowUpToTree(
      followUp.children,
      parentId,
      newFollowUp
    );
    if (nextChildren !== followUp.children) {
      changed = true;
      return {
        ...followUp,
        children: nextChildren
      };
    }

    return followUp;
  });

  return changed ? nextFollowUps : followUps;
}

function updateFollowUpInTree(
  followUps: InterviewFollowUp[],
  followUpId: string,
  update: (followUp: InterviewFollowUp) => InterviewFollowUp
): InterviewFollowUp[] {
  let changed = false;
  const nextFollowUps = followUps.map((followUp) => {
    if (followUp.id === followUpId) {
      changed = true;
      return update(followUp);
    }

    const nextChildren = updateFollowUpInTree(
      followUp.children,
      followUpId,
      update
    );
    if (nextChildren !== followUp.children) {
      changed = true;
      return {
        ...followUp,
        children: nextChildren
      };
    }

    return followUp;
  });

  return changed ? nextFollowUps : followUps;
}

function deleteFollowUpFromTree(
  followUps: InterviewFollowUp[],
  followUpId: string
): InterviewFollowUp[] {
  const filteredFollowUps = followUps.filter(
    (followUp) => followUp.id !== followUpId
  );
  let changed = filteredFollowUps.length !== followUps.length;
  const nextFollowUps = filteredFollowUps.map((followUp) => {
    const nextChildren = deleteFollowUpFromTree(followUp.children, followUpId);
    if (nextChildren !== followUp.children) {
      changed = true;
      return {
        ...followUp,
        children: nextChildren
      };
    }

    return followUp;
  });

  return changed ? nextFollowUps : followUps;
}
