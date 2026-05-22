export type OverclaimSeverity = "warning" | "danger";

export type OverclaimSignal = {
  id: string;
  evidence: string;
  label: string;
  message: string;
  severity: OverclaimSeverity;
  suggestion: string;
};

export type OverclaimContext = {
  dangerousClaims?: string[];
  metricsToVerify?: string[];
};

const ownershipOverclaimPatterns = [
  "혼자",
  "단독",
  "전부",
  "모든",
  "전체 설계",
  "아키텍처 전체",
  "완전 자동화",
  "완벽"
];

const metricClaimPattern =
  /\d+(?:[.,]\d+)?\s*(?:%|퍼센트|건|개|명|회|시간|분|초|배|ms|sec)/i;

export function detectOverclaims(
  text: string,
  context: OverclaimContext = {}
): OverclaimSignal[] {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return [];
  }

  const signals: OverclaimSignal[] = [];

  (context.dangerousClaims ?? []).forEach((claim, index) => {
    const normalizedClaim = normalizeText(claim);
    if (normalizedClaim.length > 0 && normalizedText.includes(normalizedClaim)) {
      signals.push({
        id: `dangerous-claim-${index}`,
        evidence: claim,
        label: "등록된 위험 표현",
        message: "업무 이해에 위험 표현으로 등록된 문장이 포함되어 있습니다.",
        severity: "danger",
        suggestion: "안전 표현이나 역할 범위가 드러나는 문장으로 바꾸세요."
      });
    }
  });

  ownershipOverclaimPatterns.forEach((pattern) => {
    if (normalizedText.includes(normalizeText(pattern))) {
      signals.push({
        id: `ownership-${pattern}`,
        evidence: pattern,
        label: "역할 범위 과장 가능성",
        message: "본인 역할과 팀/기존 시스템 범위가 섞여 보일 수 있습니다.",
        severity: "warning",
        suggestion: "직접 구현한 범위, 협업 범위, 확인받은 기준을 분리해 쓰세요."
      });
    }
  });

  if ((context.metricsToVerify ?? []).length > 0 && metricClaimPattern.test(text)) {
    signals.push({
      id: "unverified-metric",
      evidence: context.metricsToVerify?.join(", ") ?? "",
      label: "확인 필요 수치",
      message: "확인 필요 수치가 남아 있는 업무에서 수치형 표현을 사용했습니다.",
      severity: "warning",
      suggestion: "검증 전에는 후보 수치, 확인 필요, 화면/SQL 기준처럼 보수적으로 표현하세요."
    });
  }

  return dedupeSignals(signals);
}

function dedupeSignals(signals: OverclaimSignal[]) {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = `${signal.label}:${signal.evidence}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}
