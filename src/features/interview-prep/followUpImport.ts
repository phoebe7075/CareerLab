import type {
  InterviewFollowUp,
  InterviewFollowUpAnchor
} from "../../data/schema";
import { parseJsonInput } from "../../data/importExport";

export type ImportedInterviewFollowUp = {
  question: string;
  parentQuestionId?: string;
  anchor?: InterviewFollowUpAnchor;
  intent: string;
  answerDirection: string;
  myAnswer: string;
  exampleAnswer: string;
  riskWarnings: string[];
  tags: string[];
  children: ImportedInterviewFollowUp[];
};

export type InterviewFollowUpImportResult =
  | {
      ok: true;
      followUps: ImportedInterviewFollowUp[];
    }
  | {
      ok: false;
      error: string;
    };

export function parseInterviewFollowUpImport(
  input: string
): InterviewFollowUpImportResult {
  if (!input.trim()) {
    return {
      ok: false,
      error: "AI JSON을 붙여넣어야 합니다."
    };
  }

  let parsed: unknown;
  try {
    parsed = parseJsonInput(input);
  } catch {
    return {
      ok: false,
      error: "JSON 형식이 아닙니다. Markdown 설명을 제거하거나 ```json fence만 남겨주세요."
    };
  }

  const candidates = getFollowUpCandidates(parsed);
  if (!candidates) {
    return {
      ok: false,
      error: "newFollowUps, followUps, questions 배열 또는 단일 question 객체가 필요합니다."
    };
  }

  const followUps: ImportedInterviewFollowUp[] = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const followUp = normalizeFollowUp(candidates[index], `newFollowUps.${index}`);
    if (!followUp.ok) {
      return followUp;
    }
    followUps.push(followUp.followUp);
  }

  if (countImportedFollowUps(followUps) === 0) {
    return {
      ok: false,
      error: "추가할 꼬리질문이 없습니다."
    };
  }

  return {
    ok: true,
    followUps
  };
}

export function countImportedFollowUps(
  followUps: ImportedInterviewFollowUp[]
): number {
  return followUps.reduce(
    (count, followUp) => count + 1 + countImportedFollowUps(followUp.children),
    0
  );
}

export function materializeImportedFollowUps(
  followUps: ImportedInterviewFollowUp[],
  createId: () => string,
  parentId: string | null = null,
  fallbackAnchor: InterviewFollowUpAnchor = { type: "main-question" }
): InterviewFollowUp[] {
  return followUps.map((followUp) => {
    const id = createId();
    return {
      id,
      parentId,
      anchor: followUp.anchor ?? fallbackAnchor,
      question: followUp.question,
      intent: followUp.intent || "면접관 의도 확인 필요",
      answerDirection: followUp.answerDirection || "답변 방향 확인 필요",
      myAnswer: followUp.myAnswer,
      exampleAnswer: followUp.exampleAnswer,
      riskWarnings: followUp.riskWarnings,
      tags: ensureAiImportTag(followUp.tags),
      children: materializeImportedFollowUps(
        followUp.children,
        createId,
        id,
        followUp.anchor ?? fallbackAnchor
      )
    };
  });
}

function getFollowUpCandidates(input: unknown): unknown[] | null {
  if (Array.isArray(input)) {
    return input;
  }

  if (!isRecord(input)) {
    return null;
  }

  if (Array.isArray(input.newFollowUps)) {
    return input.newFollowUps;
  }

  if (Array.isArray(input.followUps)) {
    return input.followUps;
  }

  if (Array.isArray(input.questions)) {
    return input.questions;
  }

  if (typeof input.question === "string") {
    return [input];
  }

  return null;
}

function normalizeFollowUp(
  input: unknown,
  path: string
):
  | {
      ok: true;
      followUp: ImportedInterviewFollowUp;
    }
  | {
      ok: false;
      error: string;
    } {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: `${path} 항목은 객체여야 합니다.`
    };
  }

  const question = readString(input.question).trim();
  if (!question) {
    return {
      ok: false,
      error: `${path}.question은 필수입니다.`
    };
  }

  const childrenInput = Array.isArray(input.children) ? input.children : [];
  const children: ImportedInterviewFollowUp[] = [];
  for (let index = 0; index < childrenInput.length; index += 1) {
    const child = normalizeFollowUp(childrenInput[index], `${path}.children.${index}`);
    if (!child.ok) {
      return child;
    }
    children.push(child.followUp);
  }

  return {
    ok: true,
    followUp: {
      question,
      parentQuestionId: readOptionalString(input.parentQuestionId),
      anchor: normalizeAnchor(input.anchor),
      intent: readString(input.intent).trim(),
      answerDirection: readString(input.answerDirection).trim(),
      myAnswer: readString(input.myAnswer).trim(),
      exampleAnswer: readString(input.exampleAnswer).trim(),
      riskWarnings: readStringArray(input.riskWarnings),
      tags: readStringArray(input.tags),
      children
    }
  };
}

function normalizeAnchor(input: unknown): InterviewFollowUpAnchor | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  if (input.type === "main-question") {
    return {
      type: "main-question",
      label: readOptionalString(input.label)
    };
  }

  if (input.type === "answer-paragraph") {
    const paragraphIndex = readNumber(input.paragraphIndex);
    return {
      type: "answer-paragraph",
      paragraphIndex: paragraphIndex ?? 0,
      label: readOptionalString(input.label),
      quote: readOptionalString(input.quote)
    };
  }

  if (input.type === "selected-text") {
    return {
      type: "selected-text",
      paragraphIndex: readNumber(input.paragraphIndex),
      label: readOptionalString(input.label),
      quote: readString(input.quote).trim()
    };
  }

  return undefined;
}

function readString(input: unknown) {
  return typeof input === "string" ? input : "";
}

function readNumber(input: unknown) {
  return typeof input === "number" && Number.isFinite(input) ? input : null;
}

function readOptionalString(input: unknown) {
  const value = readString(input).trim();
  return value || undefined;
}

function readStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ensureAiImportTag(tags: string[]) {
  return Array.from(new Set([...tags, "ai-import"]));
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
