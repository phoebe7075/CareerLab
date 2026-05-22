import type {
  ResumeStatement,
  ResumeStatementStatus,
  RiskLevel,
  WorkItem
} from "../../data/schema";

const statusOrder: Record<ResumeStatementStatus, number> = {
  final: 0,
  usable: 1,
  editing: 2,
  candidate: 3,
  "needs-review": 4
};

const riskOrder: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2
};

export function sortResumeStatements(
  statements: ResumeStatement[],
  workItemsById: Map<string, WorkItem>
) {
  return [...statements].sort((first, second) => {
    if (first.status !== second.status) {
      return statusOrder[first.status] - statusOrder[second.status];
    }

    const firstScore = first.evaluation?.fitScore ?? -1;
    const secondScore = second.evaluation?.fitScore ?? -1;

    if (firstScore !== secondScore) {
      return secondScore - firstScore;
    }

    const firstWork = workItemsById.get(first.workItemId);
    const secondWork = workItemsById.get(second.workItemId);
    const firstPriority = firstWork?.priority ?? 99;
    const secondPriority = secondWork?.priority ?? 99;

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    const firstRisk = firstWork ? riskOrder[firstWork.riskLevel] : 99;
    const secondRisk = secondWork ? riskOrder[secondWork.riskLevel] : 99;

    if (firstRisk !== secondRisk) {
      return firstRisk - secondRisk;
    }

    return first.text.localeCompare(second.text, "ko");
  });
}
