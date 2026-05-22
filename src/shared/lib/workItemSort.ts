import {
  formatWorkSystem,
  type RiskLevel,
  type WorkItem,
  type WorkProject
} from "../../data/schema";

const riskOrder: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2
};

export function sortWorkItemsByGeneralScore(workItems: WorkItem[]) {
  return [...workItems].sort(compareWorkItemsByGeneralScore);
}

export function compareWorkItemsByGeneralScore(
  first: WorkItem,
  second: WorkItem
) {
  return (
    compareNumberDescending(getOverallScore(first), getOverallScore(second)) ||
    compareNumberDescending(getResumeScore(first), getResumeScore(second)) ||
    compareNumberDescending(getEssayScore(first), getEssayScore(second)) ||
    compareNumberDescending(getInterviewScore(first), getInterviewScore(second)) ||
    compareWorkItemFallback(first, second)
  );
}

export function compareWorkItemsForResume(first: WorkItem, second: WorkItem) {
  return (
    compareNumberDescending(getResumeScore(first), getResumeScore(second)) ||
    compareNumberDescending(getOverallScore(first), getOverallScore(second)) ||
    compareWorkItemFallback(first, second)
  );
}

export function getProjectActivityTimestamp(
  project: WorkProject | undefined,
  workItems: WorkItem[]
) {
  return [project?.updatedAt, ...workItems.map((item) => item.updatedAt)]
    .filter((value): value is string => Boolean(value))
    .sort((first, second) => second.localeCompare(first))[0] ?? "";
}

function compareWorkItemFallback(first: WorkItem, second: WorkItem) {
  if (first.priority !== second.priority) {
    return first.priority - second.priority;
  }

  const firstRisk = riskOrder[first.riskLevel];
  const secondRisk = riskOrder[second.riskLevel];

  if (firstRisk !== secondRisk) {
    return firstRisk - secondRisk;
  }

  if (first.system !== second.system) {
    return formatWorkSystem(first.system).localeCompare(
      formatWorkSystem(second.system),
      "ko"
    );
  }

  return first.title.localeCompare(second.title, "ko");
}

function getOverallScore(workItem: WorkItem) {
  return workItem.score?.overallScore ?? workItem.resumeFit?.score ?? -1;
}

function getResumeScore(workItem: WorkItem) {
  return workItem.score?.resumeScore ?? workItem.resumeFit?.score ?? -1;
}

function getEssayScore(workItem: WorkItem) {
  return workItem.score?.essayScore ?? -1;
}

function getInterviewScore(workItem: WorkItem) {
  return workItem.score?.interviewScore ?? -1;
}

function compareNumberDescending(first: number, second: number) {
  return first === second ? 0 : second - first;
}
