import {
  formatWorkSystem,
  type InterviewQuestion,
  type WorkItem
} from "../../data/schema";

const stopWords = new Set([
  "그리고",
  "기반",
  "답변",
  "설명",
  "확인",
  "필요",
  "어떻게",
  "무엇",
  "왜",
  "있는지",
  "합니다",
  "했습니다"
]);

export function buildInterviewPracticeKeywords(
  question: InterviewQuestion,
  linkedWorkItems: WorkItem[]
) {
  const rawKeywords = [
    ...linkedWorkItems.flatMap((item) => [
      formatWorkSystem(item.system),
      ...item.categories,
      ...item.technologies,
      ...item.metricsToVerify,
      ...item.safeClaims
    ]),
    ...question.answerDirection.split(/[\s/.,()[\]{}:;'"`]+/),
    ...question.intent.split(/[\s/.,()[\]{}:;'"`]+/),
    ...question.question.split(/[\s/.,()[\]{}:;'"`]+/)
  ];

  const keywords = rawKeywords
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 2)
    .filter((keyword) => !stopWords.has(keyword))
    .filter((keyword) => !/^[0-9]+$/.test(keyword));

  return Array.from(new Set(keywords)).slice(0, 16);
}
