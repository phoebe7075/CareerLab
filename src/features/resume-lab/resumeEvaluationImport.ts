import type {
  ResumeStatementEvaluation,
  ResumeStatementStatus
} from "../../data/schema";

export type ResumeEvaluationImportResult =
  | {
      ok: true;
      evaluation: ResumeStatementEvaluation;
    }
  | {
      ok: false;
      message: string;
    };

const statusAliases: Record<string, ResumeStatementStatus> = {
  candidate: "candidate",
  "needs-review": "needs-review",
  editing: "editing",
  usable: "usable",
  final: "final",
  후보: "candidate",
  "검토 필요": "needs-review",
  "수정 중": "editing",
  "사용 가능": "usable",
  최종: "final"
};

export function parseResumeEvaluationJson(
  input: string,
  evaluatedAt = new Date().toISOString()
): ResumeEvaluationImportResult {
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
    return {
      ok: false,
      message: "평가 결과는 JSON object여야 합니다."
    };
  }

  const fitScore = readScore(parsed.fitScore, "fitScore");
  const factSafetyScore = readScore(parsed.factSafetyScore, "factSafetyScore");
  const specificityScore = readScore(parsed.specificityScore, "specificityScore");
  const jdMatchScore = readScore(parsed.jdMatchScore, "jdMatchScore");
  const distinctivenessScore = readScore(
    parsed.distinctivenessScore,
    "distinctivenessScore"
  );

  if (!fitScore.ok) {
    return { ok: false, message: fitScore.message };
  }
  if (!factSafetyScore.ok) {
    return { ok: false, message: factSafetyScore.message };
  }
  if (!specificityScore.ok) {
    return { ok: false, message: specificityScore.message };
  }
  if (!jdMatchScore.ok) {
    return { ok: false, message: jdMatchScore.message };
  }
  if (!distinctivenessScore.ok) {
    return {
      ok: false,
      message: distinctivenessScore.message
    };
  }

  return {
    ok: true,
    evaluation: {
      distinctivenessScore: distinctivenessScore.value,
      evaluatedAt,
      factSafetyScore: factSafetyScore.value,
      fitScore: fitScore.value,
      improvementSuggestions: readStringArray(parsed.improvementSuggestions),
      jdMatchScore: jdMatchScore.value,
      recommendedStatus: readRecommendedStatus(parsed.statusRecommendation),
      recommendedText:
        typeof parsed.recommendedText === "string" ? parsed.recommendedText : "",
      riskWarnings: readStringArray(parsed.riskWarnings),
      specificityScore: specificityScore.value,
      summary: typeof parsed.summary === "string" ? parsed.summary : ""
    }
  };
}

function stripJsonFence(input: string) {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

function readScore(input: unknown, fieldName: string) {
  const value = typeof input === "number" ? input : Number(input);

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return {
      ok: false as const,
      message: `${fieldName}는 0에서 100 사이 숫자여야 합니다.`
    };
  }

  return {
    ok: true as const,
    value: Math.round(value)
  };
}

function readStringArray(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((item): item is string => typeof item === "string");
}

function readRecommendedStatus(input: unknown) {
  if (typeof input !== "string") {
    return undefined;
  }

  return statusAliases[input.trim()] ?? undefined;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
