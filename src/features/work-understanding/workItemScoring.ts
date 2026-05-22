import {
  formatWorkSystem,
  workItemEvidenceConfidenceLevels,
  workItemUseTiers,
  type ResumeFitLevel,
  type WorkItem,
  type WorkItemResumeFit,
  type WorkItemScore
} from "../../data/schema";
import {
  COMMON_FACT_POLICY,
  COMMON_JSON_OUTPUT_RULES
} from "../prompt-center/promptPolicies";

export type WorkItemScoreImportUpdate = {
  id: string;
  resumeFit: WorkItemResumeFit;
  score: WorkItemScore;
};

export type WorkItemScoringPromptOptions = {
  scopeLabel?: string;
  totalWorkItemCount?: number;
};

export type WorkItemScoreParseResult =
  | {
      ok: true;
      updates: WorkItemScoreImportUpdate[];
    }
  | {
      ok: false;
      message: string;
    };

export function buildWorkItemScoringPrompt(
  workItems: WorkItem[],
  options: WorkItemScoringPromptOptions = {}
) {
  const scopeLabel = options.scopeLabel ?? "전체 업무 평가";
  const totalWorkItemCount = options.totalWorkItemCount ?? workItems.length;

  return `# Work Item Multi-Use Scoring Prompt

You are evaluating work items for a Korean career document app.

Goal:
Score each WorkItem for how useful it is across resume/career statement, essay, and interview preparation, especially for a candidate who can apply as full-stack but wants to emphasize backend, SQL, data correctness, batch/file processing, and operational stability.

Evaluation scope:
- Current scope: ${scopeLabel}
- Input WorkItems in this prompt: ${workItems.length}
- Total WorkItems in the app: ${totalWorkItemCount}
- Score only the WorkItems included in this prompt. Return items only for the included ids.
- It is valid to return a partial score batch when this prompt was copied for a project or a manual selection.

Important interpretation:
- This is NOT a general importance score for the work itself.
- This is NOT a personal effort or difficulty score.
- This is a career-document usefulness score: "How strongly can this work item support believable, safe, differentiated hiring materials?"
- Resume scores may be shown in the resume prompt builder. Essay/interview/overall scores may later be used by other labs and dashboards.

${COMMON_JSON_OUTPUT_RULES}

${COMMON_FACT_POLICY}

Score scale:
- 90-100 = representative achievement. Use for dashboard top picks, resume top bullets, and major essay/interview material.
- 85-89 = main achievement. Use for core resume bullets and main interview answers.
- 80-84 = support achievement. Use for support resume bullets or secondary essay/interview examples.
- 75-79 = situational material. Use mainly for interview follow-ups, operations, collaboration, or documentation stories.
- 70-74 = appendix material. Keep in facts/evidence; use in resume only with caution.
- 0-69 = archive/limited material. Keep as context, not as a primary hiring material.

Score formula:
overallScore = resumeScore * 0.4 + essayScore * 0.3 + interviewScore * 0.3
Round to the nearest integer.

Scoring dimensions:
1. Position relevance, 25 points
   - High for backend, Java/Spring, Oracle/MyBatis SQL, batch, file processing, fixed-width message processing, DB Link, data consistency, operational stability.
   - Medium for full-stack admin screens where backend/data flow is visible.
   - Lower for UI-only, documentation-only, or test-data-only work.
2. End-to-end implementation scope, 20 points
   - High when the work connects multiple layers: screen -> controller/API -> service -> mapper/SQL -> file/excel/batch/output.
   - Medium when it changes a meaningful slice but not the full flow.
   - Lower when it is only a small UI/control/config/document change.
3. Operational impact and domain importance, 15 points
   - High for work affecting production operations, settlement, inventory, card/message processing, batch ingestion, file transfer, data reconciliation, or recurring operator workflow.
   - Medium for convenience or usability improvements with clear operational context.
   - Lower for one-off support tasks.
4. Technical depth and correctness, 15 points
   - High for SQL structure, result equivalence checks, charset/byte handling, count/trailer validation, DB Link/MERGE, aggregation correctness, validation rules, or failure handling.
   - Medium for standard CRUD or common screen/server wiring.
   - Lower for mostly descriptive or procedural work.
5. Evidence safety and claim control, 15 points
   - High if safeClaims are clear and dangerousClaims are avoidable.
   - Do not reward unverified metrics unless they are explicitly framed as to verify or pre-operation/direct execution only.
   - High riskLevel does not automatically mean low score; it means the cautions must be explicit.
6. Narrative distinctiveness, 10 points
   - High if the work creates a memorable hiring-material sentence and distinguishes the candidate beyond routine maintenance.
   - Medium if it is useful but common.
   - Lower if it is hard to explain without sounding inflated.

Score each use case separately:
- resumeScore: fit for concise career-statement bullets. Prioritize implementation scope, technical depth, safe measurable wording, and differentiated backend/SQL/operations evidence.
- essayScore: fit for self-introduction or problem-solving essays. Prioritize story clarity, learning, collaboration, readable business context, and growth narrative.
- interviewScore: fit for interview answers and follow-up questions. Prioritize explainability, technical depth, expected interviewer questions, troubleshooting detail, and scope/caution discussion.
- evidenceConfidence: evidence and overclaim safety only. It is not a task difficulty grade.

Penalty and cap rules:
- If the work is mainly documentation or operational guide material, cap the score at 72 unless there is clear implementation ownership.
- If the work is mainly test-data/mock support, cap the score at 65 unless it includes production implementation.
- If the only strong result depends on unverified metrics, score the underlying analysis but cap the metric-driven part. Add a caution.
- If "overall design", "complete automation", "total ownership", or external-system ownership would be misleading, add a caution and do not let the score rely on that claim.
- If the work is a standard CRUD but shows clear end-to-end implementation and team-pattern adaptation, it can be strong, but usually not above 89.
- If the work strongly supports backend/SQL/operational-stability positioning and can be worded safely without fake metrics, it can be 90+ even if it has risk cautions.
- Score all work items relatively, not in isolation.
- Do not put everything in the 80s. Separate hero, main, support, interview-only, and archive material.
- Documentation or guide work can have lower resumeScore but higher interviewScore if it is useful for explaining operations, troubleshooting, or team enablement.
- Standard CRUD can be useful basic evidence, but should not be hero material unless it has clear end-to-end scope, operational importance, and safe distinctiveness.

Expected output:
Return strict JSON only.

Output shape:
{
  "items": [
    {
      "id": "work-item-id",
      "score": {
        "resumeScore": 0,
        "essayScore": 0,
        "interviewScore": 0,
        "overallScore": 0,
        "evidenceConfidence": "A",
        "useTier": "hero",
        "scoreReason": "short Korean reason",
        "caution": "short Korean caution"
      }
    }
  ],
  "rankingNotes": [
    {
      "id": "work-item-id",
      "whyThisRank": "short Korean explanation of why it ranked here"
    }
  ],
  "scoringAssumptions": ["short Korean assumption"],
  "needsUserConfirmation": [
    {
      "id": "work-item-id",
      "question": "short Korean question needed before using this as a stronger resume claim"
    }
  ]
}

Output constraints:
- Scores must be integers from 0 to 100.
- overallScore must follow the weighted formula unless you explain a rounding issue in rankingNotes.
- useTier should generally match overallScore: 90-100 hero, 85-89 main, 80-84 support, 75-79 interview-only or support, 0-74 archive or interview-only.
- evidenceConfidence must reflect evidence and overclaim safety, not score quality.
- scoreReason and caution should each be one short Korean sentence.
- Do not invent metrics, ownership, dates, or production impact.
- If a work item is stronger for interview than resume, keep resumeScore lower and set useTier to interview-only when appropriate.

Input WorkItems:
${JSON.stringify(workItems.map(serializeWorkItemForScoring), null, 2)}`;
}

export function parseWorkItemScoringJson(input: string): WorkItemScoreParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFence(input));
  } catch {
    return {
      ok: false,
      message: "JSON 형식이 아닙니다. 코드블록이 포함된 JSON은 허용됩니다."
    };
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.items)) {
    return {
      ok: false,
      message: "평가 결과는 items 배열을 가진 JSON object여야 합니다."
    };
  }

  const rankingNotesById = new Map<string, string>();

  for (const note of readObjectArray(parsed.rankingNotes)) {
    const id = readString(note.id);
    const rankingNote = readString(note.whyThisRank || note.reason);

    if (id && rankingNote) {
      rankingNotesById.set(id, rankingNote);
    }
  }
  const scoringAssumptions = readStringArray(parsed.scoringAssumptions);
  const confirmationQuestionsById = new Map<string, string[]>();

  for (const confirmation of readObjectArray(parsed.needsUserConfirmation)) {
    const id = readString(confirmation.id);
    const question = readString(confirmation.question);

    if (!id || !question) {
      continue;
    }

    confirmationQuestionsById.set(id, [
      ...(confirmationQuestionsById.get(id) ?? []),
      question
    ]);
  }

  const updates: WorkItemScoreImportUpdate[] = [];

  for (const [index, item] of parsed.items.entries()) {
    if (!isRecord(item) || typeof item.id !== "string" || !isRecord(item.score)) {
      return {
        ok: false,
        message: `items.${index}는 id와 score object를 포함해야 합니다.`
      };
    }

    const score = parseWorkItemScoreObject(item.score, `items.${index}.score`);
    if (!score.ok) {
      return score;
    }

    updates.push({
      id: item.id,
      resumeFit: createResumeFitFromScore(score.score),
      score: {
        ...score.score,
        confirmationQuestions: confirmationQuestionsById.get(item.id) ?? [],
        rankingNote: rankingNotesById.get(item.id) ?? "",
        scoringAssumptions
      }
    });
  }

  if (updates.length === 0) {
    return {
      ok: false,
      message: "items 배열에 최소 1개 평가 결과가 필요합니다."
    };
  }

  return { ok: true, updates };
}

function serializeWorkItemForScoring(workItem: WorkItem) {
  return {
    id: workItem.id,
    title: workItem.title,
    system: formatWorkSystem(workItem.system),
    startedAt: workItem.startedAt ?? "",
    endedAt: workItem.endedAt ?? "",
    periodNote: workItem.periodNote,
    priority: workItem.priority,
    riskLevel: workItem.riskLevel,
    categories: workItem.categories,
    problem: workItem.problem,
    role: workItem.role,
    technologies: workItem.technologies,
    actions: workItem.actions,
    difficulties: workItem.difficulties,
    solution: workItem.solution,
    result: workItem.result,
    lessons: workItem.lessons,
    resumeStatements: workItem.resumeStatements,
    essayPoints: workItem.essayPoints,
    interviewPoints: workItem.interviewPoints,
    metricsToVerify: workItem.metricsToVerify,
    dangerousClaims: workItem.dangerousClaims,
    safeClaims: workItem.safeClaims,
    evidenceRefs: workItem.evidenceRefs,
    learningQuestions: workItem.learningQuestions
  };
}

export function parseWorkItemScoreObject(
  input: Record<string, unknown>,
  path: string
) {
  const resumeScore = readScore(input.resumeScore, `${path}.resumeScore`);
  const essayScore = readScore(input.essayScore, `${path}.essayScore`);
  const interviewScore = readScore(input.interviewScore, `${path}.interviewScore`);
  const overallScore = readScore(input.overallScore, `${path}.overallScore`);

  if (!resumeScore.ok) {
    return resumeScore;
  }
  if (!essayScore.ok) {
    return essayScore;
  }
  if (!interviewScore.ok) {
    return interviewScore;
  }
  if (!overallScore.ok) {
    return overallScore;
  }
  if (
    !workItemEvidenceConfidenceLevels.includes(
      input.evidenceConfidence as WorkItemScore["evidenceConfidence"]
    )
  ) {
    return {
      ok: false as const,
      message: `${path}.evidenceConfidence 값이 올바르지 않습니다.`
    };
  }
  if (!workItemUseTiers.includes(input.useTier as WorkItemScore["useTier"])) {
    return {
      ok: false as const,
      message: `${path}.useTier 값이 올바르지 않습니다.`
    };
  }

  return {
    ok: true as const,
    score: {
      caution: typeof input.caution === "string" ? input.caution : "",
      essayScore: essayScore.value,
      evidenceConfidence: input.evidenceConfidence as WorkItemScore["evidenceConfidence"],
      interviewScore: interviewScore.value,
      overallScore: overallScore.value,
      confirmationQuestions: readStringArray(input.confirmationQuestions),
      rankingNote: readString(input.rankingNote),
      scoringAssumptions: readStringArray(input.scoringAssumptions),
      resumeScore: resumeScore.value,
      scoreReason: typeof input.scoreReason === "string" ? input.scoreReason : "",
      useTier: input.useTier as WorkItemScore["useTier"]
    }
  };
}

function readScore(input: unknown, fieldName: string) {
  const value = typeof input === "number" ? input : Number(input);

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return {
      ok: false as const,
      message: `${fieldName}는 0에서 100 사이 숫자여야 합니다.`
    };
  }

  return { ok: true as const, value: Math.round(value) };
}

function readObjectArray(input: unknown) {
  return Array.isArray(input) ? input.filter(isRecord) : [];
}

function readStringArray(input: unknown) {
  return Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string")
    : [];
}

function readString(input: unknown) {
  return typeof input === "string" ? input : "";
}

export function createResumeFitFromScore(
  score: WorkItemScore
): WorkItemResumeFit {
  return {
    cautions: score.caution ? [score.caution] : [],
    level: getResumeFitLevel(score.resumeScore),
    reasons: score.scoreReason ? [score.scoreReason] : [],
    score: score.resumeScore
  };
}

function getResumeFitLevel(score: number): ResumeFitLevel {
  if (score >= 90) {
    return "core";
  }
  if (score >= 85) {
    return "strong";
  }
  if (score >= 75) {
    return "supporting";
  }
  return "limited";
}

function stripJsonFence(input: string) {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
