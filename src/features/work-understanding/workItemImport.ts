import {
  type RiskLevel,
  type WorkItemResumeFit,
  type WorkItemScore,
  type WorkPriority,
  type WorkSystem,
  normalizeWorkSystem as normalizeSchemaWorkSystem,
  riskLevels,
  workPriorities
} from "../../data/schema";
import {
  COMMON_FACT_POLICY,
  COMMON_JSON_OUTPUT_RULES
} from "../prompt-center/promptPolicies";
import {
  createResumeFitFromScore,
  parseWorkItemScoreObject
} from "./workItemScoring";

export type ImportedWorkProject = {
  key: string;
  name: string;
  system: WorkSystem;
  periodNote: string;
  summary: string;
};

export type ImportedWorkItem = {
  projectKey: string;
  title: string;
  system: WorkSystem;
  startedAt: string;
  endedAt: string;
  periodNote: string;
  priority: WorkPriority;
  riskLevel: RiskLevel;
  categories: string[];
  problem: string;
  role: string;
  technologies: string[];
  actions: string[];
  difficulties: string[];
  solution: string;
  result: string;
  lessons: string[];
  resumeStatements: string[];
  essayPoints: string[];
  interviewPoints: string[];
  metricsToVerify: string[];
  dangerousClaims: string[];
  safeClaims: string[];
  evidenceRefs: string[];
  learningQuestions: string[];
  resumeFit?: WorkItemResumeFit;
  score?: WorkItemScore;
};

export type WorkItemImportDraft = {
  autoCreatedProjectKeys: string[];
  projects: ImportedWorkProject[];
  workItems: ImportedWorkItem[];
};

export type WorkItemImportParseResult =
  | {
      ok: true;
      draft: WorkItemImportDraft;
    }
  | {
      ok: false;
      message: string;
    };

export function buildWorkItemExtractionPrompt(sourceText: string) {
  return `# Career Lab Source Work Item Import

You are extracting project-level and work-item-level career data for a local-first Korean developer career preparation app.
Your job is not to make the experience sound impressive.
Your job is to preserve verified facts, separate interpretation, and structure the material so the user can later write resume bullets, essays, and interview answers safely.
Extract the meaningful work items present in the pasted source material.

${COMMON_JSON_OUTPUT_RULES}

${COMMON_FACT_POLICY}

${formatWorkItemExtractionRules()}

## Source Material
${sourceText.trim() || "[PASTE SOURCE MATERIAL HERE. Do not extract or invent work items until the user provides source material.]"}`;
}

export function buildWorkItemCandidateListingPrompt(sourceText: string) {
  return `# Career Lab Work Candidate Listing

You are working as a project-connected agent for a local-first Korean developer career preparation app.
Inspect the provided project context and list candidate work items the user may want to add to Career Lab.
Do not write final WorkItem JSON yet.
The user will choose which candidates to extract in step 2.

${COMMON_JSON_OUTPUT_RULES}

${COMMON_FACT_POLICY}

## Listing Rules
- Group candidates by project/system when possible.
- Prefer concrete implementation, operations, SQL, batch, file/message, data correctness, troubleshooting, or workflow work.
- Keep small support/documentation/mock work if it is useful for interview follow-up, but mark it as low confidence or support material.
- Do not merge unrelated projects, systems, or time periods into one candidate.
- Do not invent metrics, dates, production impact, ownership, or technologies.
- Extract timing evidence separately: if exact dates are unknown but a month is inferable, include that month and say what proves it.
- Use candidateStartedAt/candidateEndedAt in YYYY-MM-DD when possible; if only a month is known, use YYYY-MM.
- If the project-connected agent can inspect repository/docs/git history, use that context and cite the relevant file, commit, issue, or section in evidenceRefs.
- If evidence is thin, still list the candidate but add questions in questionsForUser.

## Required JSON Shape
{
  "projectSummary": "프로젝트 범위와 근거 요약",
  "candidateWorkItems": [
    {
      "candidateKey": "short-stable-key",
      "projectName": "프로젝트명",
      "title": "업무 후보명",
      "candidateStartedAt": "YYYY-MM-DD or YYYY-MM or empty string",
      "candidateEndedAt": "YYYY-MM-DD or YYYY-MM or empty string",
      "timeEvidence": "처리시점 근거와 불확실성",
      "whyCandidate": "왜 Career Lab 업무로 뽑을 만한지",
      "evidenceRefs": ["근거 파일/커밋/문서/섹션"],
      "riskNotes": ["과장 위험 또는 근거 부족"],
      "questionsForUser": ["사용자가 선택/보강 전 확인할 질문"]
    }
  ],
  "recommendedSelection": ["candidateKey"]
}

## Source Material Or Project-Agent Context
${sourceText.trim() || "[Ask the project-connected agent to inspect the current project repository, docs, git history, issue tracker, and implementation notes.]"}`;
}

export function buildSelectedWorkItemExtractionPrompt(
  sourceText: string,
  selectedCandidates: string
) {
  return `# Career Lab Work Item Extraction

You are extracting selected project-level and work-item-level career data for a local-first Korean developer career preparation app.
Your job is not to make the experience sound impressive.
Your job is to preserve verified facts, separate interpretation, and structure the material so the user can later write resume bullets, essays, and interview answers safely.
This is step 2 of a two-step workflow:
1. A project-connected agent listed candidate work items.
2. The user selected which candidates to add.
Only extract the selected candidates. Do not extract every possible project task.

${COMMON_JSON_OUTPUT_RULES}

${COMMON_FACT_POLICY}

${formatWorkItemExtractionRules()}

## Selected Candidates
${selectedCandidates.trim() || "[PASTE SELECTED candidateKey/title LIST HERE]"}

## Source Material
${sourceText.trim() || "[Ask the project-connected agent to use the selected candidates and available project context.]"}`;
}

function formatWorkItemExtractionRules() {
  return `## Core Rules
- Extract project groups first.
- Then assign every work item to exactly one projectKey.
- Do not upgrade a guide, mock file, test support, or analysis document into confirmed production implementation.
- If a value is uncertain, keep the field conservative and add a learningQuestions item.
- Put uncertain numbers in metricsToVerify, not in result.
- Put risky or overclaiming phrases in dangerousClaims.
- Put safe, evidence-backed wording in safeClaims.
- Use evidenceRefs whenever the source gives a commit, document name, section title, date, or clear hint.
- The app derives its internal system grouping from projectName when system is omitted. Do not force predefined system labels for side projects or future projects.
- Use COMMON only when the work cannot be tied to a named project/system.
- Include initial score only when the evidence is enough to make a conservative estimate.
- If scoring is uncertain, still include a score with evidenceConfidence "C", conservative numbers, and clear confirmationQuestions.
- Scores are hiring-material usefulness scores, not task difficulty scores.

## Field Guidance
periodNote:
- Mention source limitations or date uncertainty that cannot be represented in startedAt/endedAt.
- If the source mixes projects or periods, explicitly warn about it.

startedAt / endedAt:
- Use YYYY-MM-DD when a work-item processing date or month can be inferred.
- If only a month is known, use the first day for startedAt and the last day of that month for endedAt.
- Leave empty only when no usable time evidence exists.
- Do not put vague text such as "early 2026" into startedAt/endedAt; keep that uncertainty in periodNote.

result:
- Only include confirmed result or direct deliverable.
- Do not include "reduced time", "improved productivity", or "decreased errors" unless the source proves it.

metricsToVerify:
- Include useful numbers the user should check later.
- Examples: usage count, response time after production rollout, error count, processing time, monthly frequency.

dangerousClaims:
- Include phrases that would overstate the work.
- Examples: "전체 설계", "완전 자동화", "장애 완전 해결", "운영 성능 확정 개선", "아키텍처 오너".

safeClaims:
- Include conservative statements the user can safely reuse.

learningQuestions:
- Include questions needed to make the work item stronger or safer.

score:
- resumeScore, essayScore, interviewScore, and overallScore must be numbers from 0 to 100.
- overallScore should follow resumeScore * 0.4 + essayScore * 0.3 + interviewScore * 0.3, rounded.
- evidenceConfidence must be one of "A", "B+", "B", "C".
- useTier must be one of "hero", "main", "support", "interview-only", "archive".
- scoreReason and caution must be short Korean sentences.

## Required JSON Shape
{
  "projects": [
    {
      "key": "short-stable-project-key",
      "name": "프로젝트명",
      "system": "optional; omit or use the project name unless there is a clearer system name",
      "periodNote": "기간과 근거 주의사항",
      "summary": "프로젝트 요약"
    }
  ],
  "workItems": [
    {
      "projectKey": "matching-project-key",
      "title": "업무명",
      "system": "optional; omit or use the project name unless there is a clearer system name",
      "startedAt": "YYYY-MM-DD or empty string",
      "endedAt": "YYYY-MM-DD or empty string",
      "periodNote": "처리 기간 근거 또는 불확실성 메모",
      "priority": 1,
      "riskLevel": "low | medium | high",
      "categories": ["백엔드", "SQL"],
      "problem": "문제/배경",
      "role": "본인 역할",
      "technologies": ["Java", "Oracle"],
      "actions": ["수행 행동"],
      "difficulties": ["어려웠던 점"],
      "solution": "해결 방식",
      "result": "결과",
      "lessons": ["배운 점"],
      "resumeStatements": ["경력기술서 후보 문장"],
      "essayPoints": ["자기소개서 포인트"],
      "interviewPoints": ["면접 포인트"],
      "metricsToVerify": ["확인 필요 수치"],
      "dangerousClaims": ["과장 위험 표현"],
      "safeClaims": ["안전 표현"],
      "evidenceRefs": ["근거 문서 또는 원문 위치"],
      "learningQuestions": ["추가로 확인할 질문"],
      "score": {
        "resumeScore": 0,
        "essayScore": 0,
        "interviewScore": 0,
        "overallScore": 0,
        "evidenceConfidence": "B",
        "useTier": "support",
        "scoreReason": "채용 문서 활용도 판단 근거",
        "caution": "확인 필요 또는 과장 방지 메모",
        "rankingNote": "선택 업무 안에서의 상대 순위 판단",
        "scoringAssumptions": ["평가 가정"],
        "confirmationQuestions": ["점수 확정 전 사용자 확인 질문"]
      }
    }
  ]
}`;
}

export function parseWorkItemExtractionJson(
  input: string
): WorkItemImportParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFence(input));
  } catch {
    return {
      ok: false,
      message: "JSON 형식이 아닙니다. 코드블록이 포함된 JSON은 허용됩니다."
    };
  }

  if (!isRecord(parsed)) {
    return { ok: false, message: "가져오기 결과는 JSON object여야 합니다." };
  }

  const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
  const rawWorkItems = Array.isArray(parsed.workItems) ? parsed.workItems : [];

  if (rawWorkItems.length === 0) {
    return { ok: false, message: "workItems 배열에 최소 1개 업무가 필요합니다." };
  }

  const projects = rawProjects
    .filter(isRecord)
    .map((project) => normalizeProject(project))
    .filter((project): project is ImportedWorkProject => Boolean(project));
  const projectMap = new Map(projects.map((project) => [project.key, project]));
  const fallbackProjectKey = projects[0]?.key ?? "imported-project";
  const autoCreatedProjectKeys = new Set<string>();
  const workItems: ImportedWorkItem[] = [];

  for (const [index, rawWorkItem] of rawWorkItems.entries()) {
    if (!isRecord(rawWorkItem)) {
      return {
        ok: false,
        message: `workItems.${index}는 JSON object여야 합니다.`
      };
    }

    const title = readString(rawWorkItem.title).trim();
    if (!title) {
      return {
        ok: false,
        message: `workItems.${index}.title은 필수입니다.`
      };
    }

    const projectKey =
      readString(rawWorkItem.projectKey).trim() ||
      readString(rawWorkItem.projectId).trim() ||
      slugify(readString(rawWorkItem.projectName)) ||
      fallbackProjectKey;
    const system = normalizeWorkSystem(
      rawWorkItem.system,
      projectMap.get(projectKey)?.system ||
        readString(rawWorkItem.projectName).trim() ||
        projectKey
    );

    if (!projectMap.has(projectKey)) {
      const project: ImportedWorkProject = {
        key: projectKey,
        name:
          readString(rawWorkItem.projectName).trim() ||
          readString(rawWorkItem.project).trim() ||
          projectKey,
        system,
        periodNote: "",
        summary: "업무 가져오기 결과에서 자동 생성된 프로젝트입니다."
      };
      projects.push(project);
      projectMap.set(project.key, project);
      autoCreatedProjectKeys.add(project.key);
    }

    const score =
      isRecord(rawWorkItem.score)
        ? parseWorkItemScoreObject(rawWorkItem.score, `workItems.${index}.score`)
        : null;

    if (score && !score.ok) {
      return score;
    }

    const parsedScore = score?.ok ? score.score : undefined;

    workItems.push({
      projectKey,
      title,
      system,
      startedAt: normalizeImportedDate(rawWorkItem.startedAt, "start"),
      endedAt: normalizeImportedDate(rawWorkItem.endedAt, "end"),
      periodNote:
        readString(rawWorkItem.periodNote).trim() || "기간과 근거 확인 필요",
      priority: normalizePriority(rawWorkItem.priority),
      riskLevel: normalizeRiskLevel(rawWorkItem.riskLevel),
      categories: readStringArray(rawWorkItem.categories),
      problem: readString(rawWorkItem.problem),
      role: readString(rawWorkItem.role),
      technologies: readStringArray(rawWorkItem.technologies),
      actions: readStringArray(rawWorkItem.actions),
      difficulties: readStringArray(rawWorkItem.difficulties),
      solution: readString(rawWorkItem.solution),
      result: readString(rawWorkItem.result),
      lessons: readStringArray(rawWorkItem.lessons),
      resumeStatements: readStringArray(rawWorkItem.resumeStatements),
      essayPoints: readStringArray(rawWorkItem.essayPoints),
      interviewPoints: readStringArray(rawWorkItem.interviewPoints),
      metricsToVerify: readStringArray(rawWorkItem.metricsToVerify),
      dangerousClaims: readStringArray(rawWorkItem.dangerousClaims),
      safeClaims: readStringArray(rawWorkItem.safeClaims),
      evidenceRefs: readStringArray(rawWorkItem.evidenceRefs),
      learningQuestions: readStringArray(rawWorkItem.learningQuestions),
      resumeFit: parsedScore ? createResumeFitFromScore(parsedScore) : undefined,
      score: parsedScore
    });
  }

  return {
    ok: true,
    draft: {
      autoCreatedProjectKeys: [...autoCreatedProjectKeys],
      projects,
      workItems
    }
  };
}

function normalizeProject(input: Record<string, unknown>) {
  const name = readString(input.name).trim();
  const key =
    readString(input.key).trim() ||
    readString(input.id).trim() ||
    slugify(name);

  if (!key || !name) {
    return null;
  }

  return {
    key,
    name,
    system: normalizeWorkSystem(input.system, name),
    periodNote: readString(input.periodNote),
    summary: readString(input.summary)
  };
}

function stripJsonFence(input: string) {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

function normalizeWorkSystem(input: unknown, fallback?: WorkSystem): WorkSystem {
  return normalizeSchemaWorkSystem(input, fallback);
}

function normalizePriority(input: unknown): WorkPriority {
  const value = typeof input === "number" ? input : Number(input);
  return workPriorities.includes(value as WorkPriority)
    ? (value as WorkPriority)
    : 3;
}

function normalizeImportedDate(input: unknown, boundary: "end" | "start") {
  const value = readString(input).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return boundary === "start"
      ? `${value}-01`
      : `${value}-${getLastDayOfMonth(value)}`;
  }

  return "";
}

function getLastDayOfMonth(value: string) {
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return "01";
  }

  return String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0");
}

function normalizeRiskLevel(input: unknown): RiskLevel {
  return riskLevels.includes(input as RiskLevel) ? (input as RiskLevel) : "medium";
}

function readString(input: unknown) {
  return typeof input === "string" ? input : "";
}

function readStringArray(input: unknown) {
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === "string");
  }

  if (typeof input === "string" && input.trim()) {
    return input
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
