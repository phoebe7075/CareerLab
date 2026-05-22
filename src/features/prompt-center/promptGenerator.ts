import type {
  CareerLabEntities,
  EssayQuestion,
  EssaySet,
  InterviewQuestion,
  PromptTemplate,
  ResumeStatement,
  TransitionReasonCard,
  WorkItem,
  WorkProject
} from "../../data/schema";
import { formatWorkSystem } from "../../data/schema";
import { formatWorkItemPeriod } from "../../shared/lib/workItemPeriod";
import {
  COMMON_CAREER_TONE_POLICY,
  COMMON_FACT_POLICY,
  COMMON_JSON_OUTPUT_RULES
} from "./promptPolicies";

type BuildResumeStatementGenerationPromptInput = {
  excludedExpressions: string;
  emphasis: string;
  jdKeywords: string;
  statementCount: string;
  targetLength: string;
  tone: string;
  workItems: WorkItem[];
};

type BuildResumeStatementEvaluationPromptInput = {
  statement: ResumeStatement;
  workItem: WorkItem;
};


export function buildResumeStatementGenerationPrompt({
  excludedExpressions,
  emphasis,
  jdKeywords,
  statementCount,
  targetLength,
  tone,
  workItems
}: BuildResumeStatementGenerationPromptInput) {
  return `# Resume Statement Generation Prompt

## Goal
선택한 업무 이해 데이터를 바탕으로 실제 경력기술서에 넣을 문구 후보를 작성해줘.

## Output Options
- targetLength: 각 문구당 ${targetLength}자 내외
- tone: ${tone}
- statementCount: ${statementCount}
- emphasis: ${emphasis || "특별 지정 없음"}
- excludedExpressions: ${excludedExpressions || "특별 지정 없음"}
- jdKeywords: ${jdKeywords || "특별 지정 없음"}

## Required Output Format
- 번호 목록만 출력해.
- 정확히 ${statementCount}개 문구만 출력해.
- 각 번호는 실제 경력기술서에 그대로 붙여넣을 수 있는 단일 문단이어야 해.
- 각 문구는 제목, 소제목, 설명, 해설, 주석 없이 본문 문장만 작성해.
- "업로드한", "후보", "다음은", "중심", "강조형" 같은 메타 표현을 쓰지 마.
- Markdown heading(###), 굵게, 구분선(---), 표, 코드블록을 쓰지 마.
- 출력 예시는 아래 형태만 허용해.
1. 문구 본문
2. 문구 본문

## Selected Work Items
${workItems.map(formatWorkItemForResumeGeneration).join("\n\n")}

## Writing Rules
- 실제로 수행한 일과 확인 가능한 결과만 사용해.
- metricsToVerify와 dangerousClaims는 본문 claim으로 쓰지 마.
- 확인되지 않은 수치, 개선률, 운영 최종 성과는 쓰지 말고 수치 없는 정성 표현으로 대체해.
- 시니어급 과장 표현이나 아키텍처 전체 소유처럼 보이는 표현은 피하고, 본인 역할 중심으로 써.
- 서로 다른 프로젝트, 시스템, 기간, 근거를 섞지 마.
- 한 문구 안에서 서로 다른 프로젝트/시스템의 업무를 섞지 마. 여러 프로젝트/시스템 업무를 선택했다면 문구별로 분리해.
- 한 문구 안에 너무 많은 업무를 나열하지 말고, 서로 연결되는 2~4개 업무만 묶어.
- 출력은 바로 복사해 붙여넣을 수 있는 경력기술서 문구 목록으로 작성해.

## Scoring-Aware Writing Rules
If WorkItem scores are provided:
- Prefer hero and main items for stronger resume statements.
- Use support items as secondary evidence.
- Do not force interview-only or archive items into resume statements unless the user explicitly selected them.
- If evidenceConfidence is B+ or lower, write cautiously and avoid confirmed production impact unless proven.
- If the work item has caution or metricsToVerify, do not turn them into confirmed results.
- If a WorkItem has high interviewScore but low resumeScore, it may be better as an interview story than a resume bullet.`;
}

export function buildResumeStatementEvaluationPrompt({
  statement,
  workItem
}: BuildResumeStatementEvaluationPromptInput) {
  return `# Resume Statement Evaluation Prompt

너는 한국 개발자 채용 시장을 잘 아는 시니어 개발자 겸 경력기술서 리뷰어다.

## Goal
현재 경력기술서 문구가 실제 지원서 bullet로 적합한지 0~100점 기준으로 평가해줘.

${COMMON_JSON_OUTPUT_RULES}

${COMMON_FACT_POLICY}

${COMMON_CAREER_TONE_POLICY}

## Current Statement
${statement.text}

## Linked Work Context
${formatWorkItemForResumeGeneration(workItem)}

## Evaluation Rules
- 확인되지 않은 수치나 위험 표현은 점수를 낮춰.
- 본인 역할, 문제, 행동, 결과가 문장 안에 드러나는지 봐.
- 경력 대비 과장되어 보이는 표현이 있으면 riskWarnings에 적어.
- 직접 수행하지 않은 범위, 아키텍처 전체 소유, 시니어급 책임처럼 보이는 표현은 감점해.
- statusRecommendation은 후보, 검토 필요, 수정 중, 사용 가능, 최종 중 하나로 추천해.
- JD가 제공되지 않았으면 jdMatchScore는 일반 한국 백엔드/풀스택 개발자 채용 기준으로 평가하고, JD 요구사항을 만들어내지 마.
- recommendedText는 Linked Work Context의 verified facts와 safeClaims만 사용해.

## Score Definitions
- fitScore: 실제 경력기술서 문구로 쓸 수 있는 종합 적합도.
- factSafetyScore: 확인되지 않은 수치, 소유권, 기간, 기술, 성과를 만들지 않았는지.
- specificityScore: 문제, 역할, 기술, 행동, 결과가 구체적인지.
- jdMatchScore: JD 또는 일반 지원 포지션과 맞는 정도. JD가 없으면 일반 백엔드/풀스택 기준으로 평가.
- distinctivenessScore: 다른 주니어 지원자와 비교했을 때 차별성이 있는지.

## Required JSON Format
{
  "fitScore": 0,
  "factSafetyScore": 0,
  "specificityScore": 0,
  "jdMatchScore": 0,
  "distinctivenessScore": 0,
  "summary": "",
  "statusRecommendation": "사용 가능",
  "riskWarnings": [],
  "improvementSuggestions": [],
  "recommendedText": ""
}

Allowed statusRecommendation values:
- "후보"
- "검토 필요"
- "수정 중"
- "사용 가능"
- "최종"`;
}

export type PromptTargetType =
  | "work-item"
  | "resume-statement"
  | "essay-question"
  | "interview-question"
  | "transition-reason"
  | "work-project";

export type PromptContextTarget = {
  key: string;
  entityId: string;
  cycleId: string | null;
  label: string;
  targetType: PromptTargetType;
  summary: string;
  body: string;
  riskNotes: string[];
};

type RenderPromptTemplateInput = {
  includeRiskNotes: boolean;
  target: PromptContextTarget;
  template: PromptTemplate;
};

const compatibleTargetTypes: Record<string, PromptTargetType[]> = {
  "essay-revision": ["essay-question", "work-item"],
  "interview-followup": ["interview-question", "work-item"],
  "transition-safety": ["interview-question", "transition-reason"],
  "jd-resume-reorder": ["resume-statement", "work-item"],
  "work-item-candidate-list": ["work-project"],
  "work-item-selected-extraction": ["work-project"]
};

export function buildPromptTargets(
  entities: CareerLabEntities
): PromptContextTarget[] {
  const workItemsById = new Map(
    entities.workItems.map((workItem) => [workItem.id, workItem])
  );
  const essaySetsById = new Map(
    entities.essaySets.map((essaySet) => [essaySet.id, essaySet])
  );

  return [
    ...entities.workProjects.map((project) =>
      buildWorkProjectTarget(
        project,
        entities.workItems.filter((workItem) => workItem.projectId === project.id)
      )
    ),
    ...entities.resumeStatements.map((statement) =>
      buildResumeStatementTarget(statement, workItemsById.get(statement.workItemId))
    ),
    ...entities.essayQuestions.map((question) =>
      buildEssayQuestionTarget(
        question,
        workItemsById,
        essaySetsById.get(question.essaySetId)
      )
    ),
    ...entities.interviewQuestions.map((question) =>
      buildInterviewQuestionTarget(question, workItemsById)
    ),
    ...entities.transitionReasonCards.map(buildTransitionReasonTarget),
    ...entities.workItems.map(buildWorkItemTarget)
  ];
}

export function getCompatiblePromptTargets(
  template: PromptTemplate | undefined,
  targets: PromptContextTarget[]
) {
  if (!template) {
    return [];
  }

  const compatibleTypes =
    compatibleTargetTypes[template.templateType] ??
    ([
      "work-item",
      "resume-statement",
      "essay-question",
      "interview-question",
      "transition-reason"
    ] satisfies PromptTargetType[]);

  const compatibleTargets = targets.filter((target) =>
    compatibleTypes.includes(target.targetType)
  );

  if (template.templateType === "transition-safety") {
    return compatibleTargets.filter(isTransitionSafetyTarget);
  }

  return compatibleTargets;
}

export function renderPromptTemplate({
  includeRiskNotes,
  target,
  template
}: RenderPromptTemplateInput) {
  const riskNotes = includeRiskNotes
    ? target.riskNotes.map((note) => `- ${note}`).join("\n") || "- 없음"
    : "- 위험 노트 제외";

  return `# Career Lab Prompt

You are helping the user prepare Korean developer career documents and interviews.
When a Required JSON Shape is provided, return strict JSON only.

${COMMON_JSON_OUTPUT_RULES}

## Template
- templateId: ${template.id}
- templateType: ${formatTemplateTypeForPrompt(template.templateType)}
- title: ${template.title}
- description: ${template.description}

## Task Type
${formatTaskType(template.templateType)}

## Target
- targetType: ${formatTargetTypeForPrompt(target.targetType)}
- targetId: ${target.entityId}
- label: ${target.label}
- summary: ${target.summary}

## Target Context
${target.body}

## Risk Notes
${riskNotes}

${COMMON_FACT_POLICY}

${COMMON_CAREER_TONE_POLICY}

## Template Instruction
${template.body}

## Success Criteria
${formatList(getPromptSuccessCriteria(template.templateType))}

## Failure Cases
${formatList(getPromptFailureCases(template.templateType))}

## Output Contract
- Follow the Required JSON Shape exactly.
- Keep existing target ids when the shape asks for ids.
- Put uncertain or risky content into warning/question fields instead of inventing facts.

## Required JSON Shape
${template.requiredJsonShape}`;
}

function buildWorkProjectTarget(
  project: WorkProject,
  workItems: WorkItem[]
): PromptContextTarget {
  return {
    key: `work-project:${project.id}`,
    entityId: project.id,
    cycleId: project.cycleIds[0] ?? null,
    label: project.name,
    targetType: "work-project",
    summary: [
      project.contextType,
      project.organizationName,
      project.myRole,
      project.periodNote
    ]
      .filter(Boolean)
      .join(" / "),
    body: [
      `Project: ${project.name}`,
      `Project type: ${project.contextType ?? ""}`,
      `Organization: ${project.organizationName ?? ""}`,
      `Team size: ${project.teamSize ?? ""}`,
      `My role: ${project.myRole ?? ""}`,
      `Period: ${[project.startedAt, project.endedAt].filter(Boolean).join(" - ")}`,
      `Period note: ${project.periodNote}`,
      `Summary: ${project.summary}`,
      `Internal grouping: ${formatWorkSystem(project.system)}`,
      `Existing Career Lab work items:\n${formatList(
        workItems.map((workItem) => `${workItem.id}: ${workItem.title}`)
      )}`
    ].join("\n\n"),
    riskNotes: workItems.flatMap((workItem) => [
      ...workItem.metricsToVerify.map(
        (metric) => `${workItem.title} / Needs Metric: ${metric}`
      ),
      ...workItem.dangerousClaims.map(
        (claim) => `${workItem.title} / Do Not Say: ${claim}`
      )
    ])
  };
}

function buildWorkItemTarget(workItem: WorkItem): PromptContextTarget {
  return {
    key: `work-item:${workItem.id}`,
    entityId: workItem.id,
    cycleId: workItem.cycleIds[0] ?? null,
    label: workItem.title,
    targetType: "work-item",
    summary: `${formatWorkSystem(workItem.system)} / ${formatWorkItemPeriod(workItem)}`,
    body: [
      `Problem: ${workItem.problem}`,
      `Role: ${workItem.role}`,
      `Actions:\n${formatList(workItem.actions)}`,
      `Result: ${workItem.result}`,
      `Safe claims:\n${formatList(workItem.safeClaims)}`,
      `Evidence refs:\n${formatList(workItem.evidenceRefs)}`
    ].join("\n\n"),
    riskNotes: [
      ...workItem.metricsToVerify.map((metric) => `Needs Metric: ${metric}`),
      ...workItem.dangerousClaims.map((claim) => `Do Not Say: ${claim}`)
    ]
  };
}

function formatWorkItemForResumeGeneration(workItem: WorkItem) {
  const scoreLines = workItem.score
    ? [
        `- score.resumeScore: ${workItem.score.resumeScore}`,
        `- score.essayScore: ${workItem.score.essayScore}`,
        `- score.interviewScore: ${workItem.score.interviewScore}`,
        `- score.overallScore: ${workItem.score.overallScore}`,
        `- score.evidenceConfidence: ${workItem.score.evidenceConfidence}`,
        `- score.useTier: ${workItem.score.useTier}`,
        `- score.reason: ${workItem.score.scoreReason || "없음"}`,
        `- score.caution: ${workItem.score.caution || "없음"}`,
        `- score.rankingNote: ${workItem.score.rankingNote || "없음"}`,
        `- score.scoringAssumptions:\n${formatList(
          workItem.score.scoringAssumptions ?? []
        )}`,
        `- score.confirmationQuestions:\n${formatList(
          workItem.score.confirmationQuestions ?? []
        )}`
      ]
    : [
        `- resumeFit.score: ${workItem.resumeFit?.score ?? "not evaluated"}`,
        `- resumeFit.level: ${workItem.resumeFit?.level ?? "not evaluated"}`
      ];

  return [
    `### ${workItem.title}`,
    `- id: ${workItem.id}`,
    `- system: ${formatWorkSystem(workItem.system)}`,
    `- startedAt: ${workItem.startedAt ?? ""}`,
    `- endedAt: ${workItem.endedAt ?? ""}`,
    `- period: ${formatWorkItemPeriod(workItem)}`,
    `- periodNote: ${workItem.periodNote}`,
    `- priority: P${workItem.priority}`,
    `- riskLevel: ${workItem.riskLevel}`,
    ...scoreLines,
    `- categories: ${workItem.categories.join(", ") || "없음"}`,
    `- problem: ${workItem.problem}`,
    `- role: ${workItem.role}`,
    `- actions:\n${formatList(workItem.actions)}`,
    `- solution: ${workItem.solution}`,
    `- result: ${workItem.result}`,
    `- safeClaims:\n${formatList(workItem.safeClaims)}`,
    `- metricsToVerify:\n${formatList(workItem.metricsToVerify)}`,
    `- dangerousClaims:\n${formatList(workItem.dangerousClaims)}`,
    `- evidenceRefs:\n${formatList(workItem.evidenceRefs)}`
  ].join("\n");
}

function buildResumeStatementTarget(
  statement: ResumeStatement,
  workItem: WorkItem | undefined
): PromptContextTarget {
  return {
    key: `resume-statement:${statement.id}`,
    entityId: statement.id,
    cycleId: statement.cycleIds[0] ?? null,
    label: workItem ? `${workItem.title} 문구` : statement.id,
    targetType: "resume-statement",
    summary: statement.status,
    body: [
      `Current statement: ${statement.text}`,
      workItem ? `Linked work: ${workItem.title}` : "Linked work: missing",
      workItem ? `Verified facts:\n${formatList(workItem.safeClaims)}` : ""
    ]
      .filter(Boolean)
      .join("\n\n"),
    riskNotes: workItem
      ? [
          ...workItem.metricsToVerify.map((metric) => `Needs Metric: ${metric}`),
          ...workItem.dangerousClaims.map((claim) => `Do Not Say: ${claim}`)
        ]
      : []
  };
}

function buildEssayQuestionTarget(
  question: EssayQuestion,
  workItemsById: Map<string, WorkItem>,
  essaySet: EssaySet | undefined
): PromptContextTarget {
  const linkedWorkItems = question.linkedWorkItemIds
    .map((id) => workItemsById.get(id))
    .filter((item): item is WorkItem => Boolean(item));

  return {
    key: `essay-question:${question.id}`,
    entityId: question.id,
    cycleId: question.cycleIds[0] ?? null,
    label: essaySet ? `${essaySet.title} / ${question.question}` : question.question,
    targetType: "essay-question",
    summary: [
      `${question.targetLength.min}-${question.targetLength.max}자`,
      essaySet?.companyName || "",
      essaySet?.roleTitle || ""
    ]
      .filter(Boolean)
      .join(" / "),
    body: [
      essaySet ? formatEssaySetForPrompt(essaySet) : "",
      `Question: ${question.question}`,
      `Current answer:\n${question.answer || "(empty)"}`,
      `Linked work evidence:\n${formatLinkedWorkEvidence(linkedWorkItems)}`
    ]
      .filter(Boolean)
      .join("\n\n"),
    riskNotes: linkedWorkItems.flatMap((item) => [
      ...item.metricsToVerify.map((metric) => `Needs Metric: ${metric}`),
      ...item.dangerousClaims.map((claim) => `Do Not Say: ${claim}`)
    ])
  };
}

function formatEssaySetForPrompt(essaySet: EssaySet) {
  return [
    `Essay set: ${essaySet.title}`,
    `Company: ${essaySet.companyName || "not specified"}`,
    `Role: ${essaySet.roleTitle || "not specified"}`,
    `Status: ${essaySet.status}`,
    `Deadline: ${essaySet.deadline || "not specified"}`,
    `JD keywords: ${essaySet.jdKeywords || "not specified"}`,
    `Company format notes: ${essaySet.formatNotes || "not specified"}`,
    `Notes: ${essaySet.notes || "not specified"}`
  ].join("\n");
}

function buildInterviewQuestionTarget(
  question: InterviewQuestion,
  workItemsById: Map<string, WorkItem>
): PromptContextTarget {
  const linkedWorkItems = question.linkedWorkItemIds
    .map((id) => workItemsById.get(id))
    .filter((item): item is WorkItem => Boolean(item));

  return {
    key: `interview-question:${question.id}`,
    entityId: question.id,
    cycleId: question.cycleIds[0] ?? null,
    label: question.question,
    targetType: "interview-question",
    summary: `${question.understanding} / ${question.intent}`,
    body: [
      `Question: ${question.question}`,
      `Intent: ${question.intent}`,
      `Answer direction: ${question.answerDirection}`,
      `Current answer:\n${question.myAnswer || "(empty)"}`,
      `Existing follow-ups:\n${formatList(
        question.followUps.map((followUp) => followUp.question)
      )}`,
      `Linked work evidence:\n${formatLinkedWorkEvidence(linkedWorkItems)}`
    ].join("\n\n"),
    riskNotes: linkedWorkItems.flatMap((item) => [
      ...item.metricsToVerify.map((metric) => `Needs Metric: ${metric}`),
      ...item.dangerousClaims.map((claim) => `Do Not Say: ${claim}`)
    ])
  };
}

function buildTransitionReasonTarget(
  card: TransitionReasonCard
): PromptContextTarget {
  return {
    key: `transition-reason:${card.id}`,
    entityId: card.id,
    cycleId: card.cycleIds[0] ?? null,
    label: card.title,
    targetType: "transition-reason",
    summary: `${card.tone} / ${card.riskLevel}`,
    body: [
      `Current transition reason:\n${card.body}`,
      `JD keyword notes: ${card.jdKeywordNotes}`
    ].join("\n\n"),
    riskNotes: card.riskWarnings
  };
}

function isTransitionSafetyTarget(target: PromptContextTarget) {
  if (target.targetType === "transition-reason") {
    return true;
  }

  if (target.targetType !== "interview-question") {
    return false;
  }

  const searchableText = [
    target.entityId,
    target.label,
    target.summary,
    target.body
  ].join("\n");

  return /transition|이직|퇴사|조기 이직|짧은 경력/.test(searchableText);
}

function formatLinkedWorkEvidence(workItems: WorkItem[]) {
  if (workItems.length === 0) {
    return "- 없음";
  }

  return workItems
    .map((workItem) =>
      [
        `### ${workItem.title}`,
        `- id: ${workItem.id}`,
        `- problem: ${workItem.problem}`,
        `- role: ${workItem.role}`,
        `- actions:\n${formatList(workItem.actions)}`,
        `- result: ${workItem.result}`,
        `- safeClaims:\n${formatList(workItem.safeClaims)}`,
        `- metricsToVerify:\n${formatList(workItem.metricsToVerify)}`,
        `- dangerousClaims:\n${formatList(workItem.dangerousClaims)}`,
        `- evidenceRefs:\n${formatList(workItem.evidenceRefs)}`
      ].join("\n")
    )
    .join("\n\n");
}

function formatList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- 없음";
}

function formatTemplateTypeForPrompt(templateType: string) {
  const labels: Record<string, string> = {
    "essay-revision": "essay-revision",
    "interview-followup": "interview-followup",
    "jd-resume-reorder": "jd-resume-reorder",
    "resume-statement-generation": "resume-statement-generation",
    "transition-safety": "transition-safety",
    "work-item-candidate-list": "work-item-candidate-list",
    "work-item-selected-extraction": "work-item-selected-extraction"
  };

  return labels[templateType] ?? templateType;
}

function formatTargetTypeForPrompt(targetType: PromptTargetType) {
  return targetType === "resume-statement" ? "resume-statement" : targetType;
}

function formatTaskType(templateType: string) {
  const labels: Record<string, string> = {
    "essay-revision": "Self-introduction revision and risk review",
    "interview-followup": "Interview follow-up question generation",
    "jd-resume-reorder": "JD-based resume statement relevance review",
    "transition-safety": "Transition reason safety review",
    "work-item-candidate-list": "Project work candidate listing",
    "work-item-selected-extraction": "Selected work item extraction"
  };

  return labels[templateType] ?? "Career document review";
}

function getPromptSuccessCriteria(templateType: string) {
  const criteria: Record<string, string[]> = {
    "essay-revision": [
      "The revised answer uses only verified linked evidence.",
      "The structure has a clear conclusion, experience, action, result, learning, and role-fit connection.",
      "Risk warnings identify overclaims, missing evidence, or negative company framing."
    ],
    "interview-followup": [
      "Questions include easy clarification, technical depth, ownership/scope pressure, stability/performance, and retrospective angles.",
      "Questions do not duplicate the existing thread.",
      "Example answers stay inside verified evidence and include cautious wording when needed."
    ],
    "jd-resume-reorder": [
      "Recommended order is based on verified relevance, not keyword stuffing.",
      "Missing JD evidence is separated from supported experience.",
      "Risk warnings flag any attempt to inflate JSP/jQuery or operations work into unsupported technologies."
    ],
    "work-item-candidate-list": [
      "Candidate work items are grouped by project or system.",
      "The response helps the user choose only a subset for extraction.",
      "Evidence refs and uncertainty questions are separated from claims."
    ],
    "work-item-selected-extraction": [
      "Only user-selected candidates are converted into WorkItem JSON.",
      "The output includes project data, work item fields, and conservative initial score metadata.",
      "Uncertain facts stay in metricsToVerify, learningQuestions, dangerousClaims, caution, or confirmationQuestions."
    ],
    "transition-safety": [
      "The answer reframes around growth direction and next-step fit.",
      "Risk warnings identify blame, escape framing, vague growth claims, or short-tenure concerns.",
      "Alternatives sound honest for an early-career developer."
    ]
  };

  return criteria[templateType] ?? [
    "The response follows the requested output shape.",
    "The response preserves verified facts and separates uncertain information.",
    "The response avoids inflated career claims."
  ];
}

function getPromptFailureCases(templateType: string) {
  const failureCases: Record<string, string[]> = {
    "essay-revision": [
      "Invents collaboration, metrics, business impact, or technologies.",
      "Turns metricsToVerify into confirmed results.",
      "Makes the current company sound negative."
    ],
    "interview-followup": [
      "Creates duplicate follow-up questions.",
      "Adds unsupported facts in exampleAnswer.",
      "Returns fields the app does not store instead of putting caution notes into riskWarnings."
    ],
    "jd-resume-reorder": [
      "Adds unsupported experience to match the JD.",
      "Reframes JSP/jQuery as React/Vue/Next experience without evidence.",
      "Ranks weak evidence above strong evidence because of keyword overlap."
    ],
    "work-item-candidate-list": [
      "Writes final WorkItem JSON before the user selects candidates.",
      "Merges unrelated project or system work into one candidate.",
      "Invents missing repository evidence or production impact."
    ],
    "work-item-selected-extraction": [
      "Extracts every possible task instead of the selected candidates.",
      "Omits required fields or returns Markdown instead of strict JSON.",
      "Turns uncertain metrics or ownership into confirmed results."
    ],
    "transition-safety": [
      "Criticizes the current company, team, client, or process.",
      "Frames the move as escape or dissatisfaction.",
      "Invents personal circumstances."
    ]
  };

  return failureCases[templateType] ?? [
    "Returns non-JSON when JSON is required.",
    "Renames required fields.",
    "Invents metrics, ownership, dates, technologies, or production impact."
  ];
}
