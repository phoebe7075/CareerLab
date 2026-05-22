import type { WorkProject } from "../../data/schema";

type ProjectContextFields = Pick<
  WorkProject,
  "contextType" | "myRole" | "organizationName" | "teamSize"
>;

function compactParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean) as string[];
}

export function formatProjectContext(project: ProjectContextFields) {
  return (
    compactParts([project.organizationName, project.contextType])[0] ??
    "소속/맥락 미지정"
  );
}

export function formatProjectMeta(project: ProjectContextFields) {
  return (
    compactParts([
      project.contextType,
      project.organizationName,
      project.myRole,
      project.teamSize
    ]).join(" / ") || "프로젝트 맥락 없음"
  );
}
