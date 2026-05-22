const promptTemplateLabels: Record<string, string> = {
  "essay-revision": "자기소개서 첨삭",
  "interview-followup": "꼬리질문 생성",
  "jd-resume-reorder": "JD 기반 경력기술서 재정렬",
  "resume-statement-evaluation": "경력기술서 문구 평가",
  "resume-statement-generation": "경력기술서 문구 생성",
  "transition-safety": "이직 사유 점검",
  "work-item-candidate-list": "업무 후보 리스팅",
  "work-item-selected-extraction": "선택 업무 JSON 추출"
};

const promptTargetLabels: Record<string, string> = {
  "essay-question": "자기소개서 문항",
  "interview-question": "면접 질문",
  "resume-statement": "경력기술서 문구",
  "transition-reason": "이직 사유",
  "work-item": "업무",
  "work-project": "프로젝트"
};

export function formatPromptTemplateType(templateType: string) {
  return promptTemplateLabels[templateType] ?? "기타 템플릿";
}

export function formatPromptTargetType(targetType: string) {
  return promptTargetLabels[targetType] ?? "기타 대상";
}
