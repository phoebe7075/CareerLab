import type {
  CareerLabEntities,
  EssaySet,
  WorkItem
} from "../../data/schema";

export const markdownExportKinds = [
  "resume",
  "essay",
  "interview"
] as const;

export type MarkdownExportKind = (typeof markdownExportKinds)[number];

export function createMarkdownExport(
  kind: MarkdownExportKind,
  entities: CareerLabEntities
) {
  switch (kind) {
    case "resume":
      return createResumeMarkdown(entities);
    case "essay":
      return createEssayMarkdown(entities);
    case "interview":
      return createInterviewMarkdown(entities);
  }
}

export function createResumeMarkdown(entities: CareerLabEntities) {
  const workItemsById = createWorkItemMap(entities.workItems);
  const sections = entities.resumeStatements.map((statement) => {
    const workItem = workItemsById.get(statement.workItemId);

    return [
      `## ${workItem?.title ?? statement.workItemId}`,
      `- status: ${statement.status}`,
      "",
      statement.text,
      "",
      "### Safe Claims",
      formatList(workItem?.safeClaims ?? []),
      "",
      "### Needs Metric",
      formatList(workItem?.metricsToVerify ?? []),
      "",
      "### Do Not Say",
      formatList(workItem?.dangerousClaims ?? [])
    ].join("\n");
  });

  return joinMarkdown(["# 경력기술서 문구", ...sections]);
}

export function createEssayMarkdown(entities: CareerLabEntities) {
  const sections = entities.essaySets.map((set) =>
    createEssaySetSection(entities, set, "##", "###", "####")
  );

  return joinMarkdown(["# 자기소개서 답변", ...sections]);
}

export function createEssaySetMarkdown(
  entities: CareerLabEntities,
  essaySetId: string
) {
  const essaySet = entities.essaySets.find((set) => set.id === essaySetId);

  if (!essaySet) {
    return "# 자기소개서 묶음\n\n묶음을 찾을 수 없습니다.\n";
  }

  return joinMarkdown([
    `# ${essaySet.title}`,
    createEssaySetSection(entities, essaySet, "##", "###", "####")
  ]);
}

export function createInterviewMarkdown(entities: CareerLabEntities) {
  const workItemsById = createWorkItemMap(entities.workItems);
  const sections = entities.interviewQuestions.map((question) => {
    const linkedWorkItems = question.linkedWorkItemIds
      .map((id) => workItemsById.get(id))
      .filter((item): item is WorkItem => Boolean(item));

    return [
      `## ${question.question}`,
      `- understanding: ${question.understanding}`,
      `- intent: ${question.intent}`,
      `- linkedWork: ${linkedWorkItems.map((item) => item.title).join(", ") || "없음"}`,
      "",
      "### Answer Direction",
      question.answerDirection,
      "",
      "### My Answer",
      question.myAnswer || "(empty)",
      "",
      "### Example Answer",
      question.exampleAnswer || "(empty)",
      "",
      "### Follow Ups",
      formatList(
        question.followUps.map(
          (followUp) => `${followUp.question} | ${followUp.answerDirection}`
        )
      )
    ].join("\n");
  });

  return joinMarkdown(["# 면접 질문", ...sections]);
}

function createWorkItemMap(workItems: WorkItem[]) {
  return new Map(workItems.map((workItem) => [workItem.id, workItem]));
}

function createEssaySetSection(
  entities: CareerLabEntities,
  set: EssaySet,
  setHeading: string,
  questionHeading: string,
  nestedHeading: string
) {
  const workItemsById = createWorkItemMap(entities.workItems);
  const questions = entities.essayQuestions.filter(
    (question) => question.essaySetId === set.id
  );
  const questionSections = questions.map((question) => {
    const linkedWorkItems = question.linkedWorkItemIds
      .map((id) => workItemsById.get(id))
      .filter((item): item is WorkItem => Boolean(item));

    return [
      `${questionHeading} ${question.question}`,
      `- targetLength: ${question.targetLength.min}-${question.targetLength.max}`,
      `- linkedWork: ${linkedWorkItems.map((item) => item.title).join(", ") || "없음"}`,
      "",
      question.answer || "(empty)",
      "",
      `${nestedHeading} Evidence`,
      formatList(linkedWorkItems.flatMap((item) => item.safeClaims)),
      "",
      `${nestedHeading} Risk Notes`,
      formatList(
        linkedWorkItems.flatMap((item) => [
          ...item.metricsToVerify.map((metric) => `Needs Metric: ${metric}`),
          ...item.dangerousClaims.map((claim) => `Do Not Say: ${claim}`)
        ])
      )
    ].join("\n");
  });

  return [
    `${setHeading} ${set.title}`,
    `- company: ${set.companyName || "미지정"}`,
    `- role: ${set.roleTitle || "미지정"}`,
    `- status: ${set.status}`,
    `- deadline: ${set.deadline || "미정"}`,
    `- jdKeywords: ${set.jdKeywords || "없음"}`,
    `- formatNotes: ${set.formatNotes || "없음"}`,
    "",
    questionSections.length > 0 ? questionSections.join("\n\n") : "문항 없음"
  ].join("\n");
}

function formatList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- 없음";
}

function joinMarkdown(sections: string[]) {
  return `${sections.map((section) => section.trim()).join("\n\n")}\n`;
}
