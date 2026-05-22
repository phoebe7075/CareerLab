import {
  type CareerLabEntities,
  type WorkItem,
  type WorkProject
} from "../../data/schema";
import { getProjectActivityTimestamp } from "../../shared/lib/workItemSort";

export type ProjectStatsRow = {
  averageUseScore: number | null;
  id: string;
  latestActivity: string;
  name: string;
  periodMissing: boolean;
  workItemCount: number;
};

export type PromptTemplateUsageRow = {
  count: number;
  ratio: number;
  templateType: string;
};

export type DashboardStats = {
  essay: {
    targetLengthMet: number;
    targetLengthRate: number;
    totalQuestions: number;
  };
  project: {
    periodMissingCount: number;
    rows: ProjectStatsRow[];
  };
  prompt: {
    templateUsage: PromptTemplateUsageRow[];
    totalPrompts: number;
  };
  resume: {
    evaluatedStatements: number;
    evaluationRate: number;
    finalStatements: number;
    totalStatements: number;
    usableStatements: number;
  };
};

export function getDashboardStats(entities: CareerLabEntities): DashboardStats {
  const projectRows = getProjectRows(entities.workProjects, entities.workItems);
  const evaluatedStatements = entities.resumeStatements.filter(
    (statement) => statement.evaluation
  ).length;
  const targetLengthMet = entities.essayQuestions.filter((question) => {
    const length = question.answer.trim().length;

    return (
      length >= question.targetLength.min && length <= question.targetLength.max
    );
  }).length;
  const templateCounts = new Map<string, number>();

  for (const prompt of entities.promptHistory) {
    templateCounts.set(
      prompt.templateType,
      (templateCounts.get(prompt.templateType) ?? 0) + 1
    );
  }

  return {
    essay: {
      targetLengthMet,
      targetLengthRate: getPercent(targetLengthMet, entities.essayQuestions.length),
      totalQuestions: entities.essayQuestions.length
    },
    project: {
      periodMissingCount: projectRows.filter((row) => row.periodMissing).length,
      rows: projectRows
    },
    prompt: {
      templateUsage: [...templateCounts.entries()]
        .map(([templateType, count]) => ({
          count,
          ratio: getPercent(count, entities.promptHistory.length),
          templateType
        }))
        .sort(
          (first, second) =>
            second.count - first.count ||
            first.templateType.localeCompare(second.templateType)
        ),
      totalPrompts: entities.promptHistory.length
    },
    resume: {
      evaluatedStatements,
      evaluationRate: getPercent(
        evaluatedStatements,
        entities.resumeStatements.length
      ),
      finalStatements: entities.resumeStatements.filter(
        (statement) => statement.status === "final"
      ).length,
      totalStatements: entities.resumeStatements.length,
      usableStatements: entities.resumeStatements.filter(
        (statement) => statement.status === "usable"
      ).length
    }
  };
}

function getProjectRows(workProjects: WorkProject[], workItems: WorkItem[]) {
  return workProjects
    .map((project) => {
      const linkedWorkItems = workItems.filter(
        (item) => item.projectId === project.id
      );

      return {
        averageUseScore: getAverageUseScore(linkedWorkItems),
        id: project.id,
        latestActivity: getProjectActivityTimestamp(project, linkedWorkItems),
        name: project.name,
        periodMissing: !project.startedAt && !project.endedAt,
        workItemCount: linkedWorkItems.length
      };
    })
    .sort(
      (first, second) =>
        second.latestActivity.localeCompare(first.latestActivity) ||
        second.workItemCount - first.workItemCount ||
        first.name.localeCompare(second.name, "ko")
    );
}

function getAverageUseScore(workItems: WorkItem[]) {
  const scores = workItems
    .map((item) => item.score?.overallScore ?? item.resumeFit?.score)
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) {
    return null;
  }

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
