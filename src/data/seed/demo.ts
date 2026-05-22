import type {
  AppSettings,
  CareerCycle,
  CareerLabEntities,
  EssayQuestion,
  EssaySet,
  InterviewFollowUp,
  InterviewQuestion,
  PromptHistory,
  PromptTemplate,
  ResumeStatement,
  TransitionReasonCard,
  VersionRecord,
  WorkItem,
  WorkItemResumeFit,
  WorkItemScore,
  WorkProject
} from "../schema";

export const DEMO_ACTIVE_CYCLE_ID = "cycle-demo-backend-career";
export const DEMO_DEFAULT_ESSAY_SET_ID = "essay-set-demo-backend";

const DEMO_SEED_TIMESTAMP = "2026-05-22T00:00:00.000+09:00";
const demoCycleIds = [DEMO_ACTIVE_CYCLE_ID];

export const demoSeedCareerCycles: CareerCycle[] = [
  {
    id: DEMO_ACTIVE_CYCLE_ID,
    title: "Demo Backend Career Prep",
    goal:
      "익명화된 백엔드/운영 개선 경험을 경력기술서, 자기소개서, 면접 답변으로 연결해 보여준다.",
    status: "active",
    startedAt: "2026-05-22",
    notes:
      "공개 포트폴리오용 demo seed입니다. 실제 회사명, 내부 시스템명, 운영 수치는 포함하지 않습니다.",
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  }
];

export const demoSeedSettings: AppSettings = {
  id: "app-settings",
  activeCycleId: DEMO_ACTIVE_CYCLE_ID,
  seedApplied: true,
  createdAt: DEMO_SEED_TIMESTAMP,
  updatedAt: DEMO_SEED_TIMESTAMP
};

export const demoSeedWorkProjects: WorkProject[] = [
  {
    id: "demo-project-commerce-ops",
    cycleIds: demoCycleIds,
    source: "seed",
    name: "익명 커머스 운영 포털",
    system: "DEMO_COMMERCE",
    contextType: "회사 프로젝트",
    organizationName: "익명 제품팀",
    teamSize: "5~8명",
    myRole: "주니어 백엔드/풀스택 개발자",
    startedAt: "2025-09-01",
    endedAt: "2026-02-28",
    periodNote: "공개 데모용 익명 기간. 실제 회사/서비스 정보와 무관함.",
    summary:
      "운영자가 사용하는 주문, 상태 이력, 조회 화면의 성능과 추적 가능성을 개선한 데모 프로젝트.",
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-project-billing-data",
    cycleIds: demoCycleIds,
    source: "seed",
    name: "익명 정산 데이터 파이프라인",
    system: "DEMO_BILLING",
    contextType: "회사 프로젝트",
    organizationName: "익명 데이터 운영팀",
    teamSize: "4~6명",
    myRole: "백엔드 개발 및 검증 담당",
    startedAt: "2025-12-01",
    endedAt: "2026-04-30",
    periodNote: "CSV 업로드, 배치 재처리, 정산 검증 흐름을 보여주는 데모 기간.",
    summary:
      "정산 CSV 검증과 재고 알림 배치 재처리 정책을 익명 샘플 데이터로 구성한 프로젝트.",
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-project-support-automation",
    cycleIds: demoCycleIds,
    source: "seed",
    name: "익명 고객지원 자동화",
    system: "DEMO_SUPPORT",
    contextType: "회사 프로젝트",
    organizationName: "익명 운영지원팀",
    teamSize: "3~5명",
    myRole: "운영 도구 개발 및 문서화",
    startedAt: "2026-03-01",
    endedAt: "2026-05-15",
    periodNote: "관리 화면, 문의 태그, 장애 대응 문서화 흐름을 보여주는 데모 기간.",
    summary:
      "지원 담당자가 반복적으로 확인하던 태그, 상태, 장애 대응 기준을 정리한 데모 프로젝트.",
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  }
];

const demoWorkItems: Array<
  Omit<WorkItem, "resumeFit" | "score"> & { score: WorkItemScore }
> = [
  {
    id: "demo-query-latency-analysis",
    cycleIds: demoCycleIds,
    source: "seed",
    projectId: "demo-project-commerce-ops",
    title: "운영 대시보드 조회 지연 분석",
    system: "DEMO_COMMERCE",
    startedAt: "2026-01-01",
    endedAt: "2026-02-15",
    periodNote: "익명 운영 포털의 조회 성능 개선 데모 사례.",
    priority: 1,
    riskLevel: "high",
    categories: ["백엔드", "SQL", "성능 개선", "운영 안정화"],
    categoryColors: {},
    problem:
      "운영 대시보드에서 기간과 상태 필터를 함께 사용할 때 조회가 느려지고, 사용자는 어떤 조건이 병목인지 알기 어려웠다.",
    role:
      "느린 조건 조합을 재현하고, 목록 조회와 집계 조회를 분리한 뒤 결과 동등성 검증 기준을 정리했다.",
    technologies: ["Java", "Spring", "MyBatis", "PostgreSQL", "Playwright"],
    actions: [
      "기간/상태/담당자 필터별 실행 시간을 비교",
      "목록 조회와 집계 조회를 분리해 과한 조인을 줄임",
      "정렬 기준과 페이징 조건을 명시적으로 고정",
      "결과 건수와 대표 행 샘플을 비교하는 검증 쿼리 작성",
      "운영자가 이해할 수 있는 확인 필요 지표를 별도 메모로 남김"
    ],
    difficulties: [
      "단순히 빠른 쿼리로 바꾸면 기존 화면의 집계 의미가 달라질 수 있었다.",
      "실제 운영 평균 지표는 배포 이후 별도 확인이 필요했다."
    ],
    solution:
      "목록/집계/상세 기준을 분리하고, 성능 개선 후보마다 결과 동등성 검증을 먼저 붙였다.",
    result:
      "운영 대시보드 조회 병목을 설명 가능한 단위로 나누고, 배포 후 확인할 지표를 명확히 했다.",
    lessons: [
      "성능 개선은 빠른 쿼리보다 업무 의미와 결과 동등성 검증이 먼저다.",
      "확인되지 않은 운영 평균은 성과 수치가 아니라 확인 필요 지표로 남겨야 한다."
    ],
    resumeStatements: [
      "운영 대시보드의 기간/상태 필터 조회 지연을 재현하고, 목록 조회와 집계 조회를 분리해 결과 동등성 검증 기준을 함께 정리했습니다.",
      "성능 개선 후보를 적용하기 전후의 건수, 대표 행, 정렬 기준을 비교하는 검증 쿼리를 작성했습니다."
    ],
    essayPoints: [
      "속도와 데이터 의미 보존을 함께 본 문제 해결 경험",
      "운영 지표를 확인 전 성과로 쓰지 않는 사실성 관리"
    ],
    interviewPoints: [
      "목록 조회와 집계 조회를 왜 분리했는가",
      "운영 반영 후 어떤 지표를 봐야 하는가",
      "결과 동등성 검증을 어떻게 설명할 것인가"
    ],
    metricsToVerify: [
      "배포 후 평균 응답 시간",
      "필터 조합별 p95 응답 시간",
      "DB CPU 또는 buffer read 변화"
    ],
    dangerousClaims: [
      "대시보드 성능을 90% 개선",
      "운영 장애를 완전히 제거",
      "전체 성능 구조를 단독 설계"
    ],
    safeClaims: [
      "느린 조회 조건을 재현하고 병목 후보를 분리",
      "목록/집계 조회 분리와 결과 동등성 검증 기준 정리",
      "운영 반영 후 확인 지표를 명확히 분리"
    ],
    evidenceRefs: ["demo/fact-pack.md#query-latency-analysis"],
    learningQuestions: [
      "어떤 필터 조합에서 지연이 커졌는가",
      "결과 동등성은 어떤 기준으로 확인했는가",
      "운영 평균 수치를 아직 확정하지 않는 이유는 무엇인가"
    ],
    score: {
      resumeScore: 94,
      essayScore: 91,
      interviewScore: 95,
      overallScore: 93,
      evidenceConfidence: "B+",
      useTier: "hero",
      scoreReason:
        "성능, SQL, 운영 지표, 사실성 관리가 함께 보여 포트폴리오 대표 흐름으로 적합함.",
      caution:
        "응답 시간 감소율은 실제 계측 전까지 성과 수치로 쓰지 않는다.",
      rankingNote: "백엔드/운영 안정성 포지션에서 첫 번째 대표 사례로 사용.",
      scoringAssumptions: [
        "실제 회사명과 운영 수치는 익명 데모 데이터로 대체됨"
      ],
      confirmationQuestions: [
        "배포 후 실제 측정값이 있다면 비공개 백업으로만 관리"
      ]
    },
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-audit-log-history",
    cycleIds: demoCycleIds,
    source: "seed",
    projectId: "demo-project-commerce-ops",
    title: "주문 상태 변경 이력 감사 로그 구축",
    system: "DEMO_COMMERCE",
    startedAt: "2025-11-01",
    endedAt: "2025-12-20",
    periodNote: "운영 문의 대응을 위한 상태 변경 추적 데모 사례.",
    priority: 1,
    riskLevel: "medium",
    categories: ["백엔드", "감사 로그", "운영 도구", "데이터 정합성"],
    categoryColors: {},
    problem:
      "주문 상태가 여러 화면과 배치에서 바뀌지만 변경 근거가 한곳에 남지 않아 문의 대응 시간이 길어졌다.",
    role:
      "상태 변경 이벤트 저장 구조, 조회 API, 관리자 화면 표시 기준을 구현하고 위험 표현을 정리했다.",
    technologies: ["Java", "Spring", "JPA", "PostgreSQL", "React"],
    actions: [
      "상태 변경 전후값과 변경 주체를 저장",
      "관리자 조회 API에 기간/상태/주체 필터 추가",
      "민감한 내부 사유는 화면 노출 문구에서 제외",
      "상태 이력 누락 가능성을 점검하는 테스트 데이터 작성"
    ],
    difficulties: [
      "모든 상태 변경을 완벽히 추적한다고 말하기에는 기존 레거시 경로가 남아 있었다."
    ],
    solution:
      "신규 변경 경로부터 감사 로그를 남기고, 레거시 경로는 확인 필요 범위로 분리했다.",
    result:
      "운영자가 상태 변경 이력을 조회하고 문의 대응 근거를 확인할 수 있는 흐름을 만들었다.",
    lessons: [
      "감사 로그는 저장 자체보다 누락 가능성과 노출 범위를 함께 관리해야 한다."
    ],
    resumeStatements: [
      "주문 상태 변경 전후값과 변경 주체를 감사 로그로 저장하고, 운영자가 기간/상태/주체 기준으로 조회할 수 있는 API와 관리자 화면을 구현했습니다."
    ],
    essayPoints: [
      "운영 문의 대응을 위해 추적 가능한 데이터를 설계한 경험",
      "민감 정보 노출 범위를 고려한 화면 설계"
    ],
    interviewPoints: [
      "감사 로그 누락 가능성은 어떻게 관리했는가",
      "상태 변경 주체를 어떻게 표현했는가"
    ],
    metricsToVerify: ["문의 대응 시간 변화", "로그 누락 건수", "조회 사용 빈도"],
    dangerousClaims: ["모든 상태 변경 추적 보장", "문의 대응 시간을 절반으로 단축"],
    safeClaims: [
      "신규 상태 변경 경로에 감사 로그 저장",
      "관리자 조회 API와 화면 구현",
      "레거시 경로는 확인 필요 범위로 분리"
    ],
    evidenceRefs: ["demo/fact-pack.md#audit-log-history"],
    learningQuestions: [
      "감사 로그가 꼭 필요한 업무 상황은 무엇인가",
      "민감 정보는 왜 화면에 그대로 노출하면 안 되는가"
    ],
    score: {
      resumeScore: 88,
      essayScore: 87,
      interviewScore: 90,
      overallScore: 88,
      evidenceConfidence: "B+",
      useTier: "main",
      scoreReason:
        "데이터 추적성, 운영 문의 대응, 보안성 판단을 함께 설명하기 좋은 사례.",
      caution: "전체 이력 보장처럼 말하지 말고 적용된 경로와 제외 범위를 분리."
    },
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-settlement-csv-validation",
    cycleIds: demoCycleIds,
    source: "seed",
    projectId: "demo-project-billing-data",
    title: "정산 CSV 업로드 검증 플로우 개선",
    system: "DEMO_BILLING",
    startedAt: "2026-02-01",
    endedAt: "2026-03-10",
    periodNote: "정산 파일 업로드 검증을 보여주는 익명 데모 사례.",
    priority: 1,
    riskLevel: "medium",
    categories: ["백엔드", "파일 처리", "정산", "검증"],
    categoryColors: {},
    problem:
      "정산 CSV 업로드 실패 시 오류 행과 원인을 바로 확인하기 어려워 운영자가 파일을 반복 수정해야 했다.",
    role:
      "CSV 파싱, 행 단위 validation, preview 결과, confirm 저장 흐름을 구현했다.",
    technologies: ["Java", "Spring Batch", "CSV", "PostgreSQL"],
    actions: [
      "헤더 누락과 컬럼 순서 오류를 먼저 검증",
      "행 단위 금액/날짜/필수값 오류를 preview로 표시",
      "저장 전 confirm 단계에서 오류 요약과 정상 건수를 분리",
      "잘못된 행은 저장하지 않고 사용자가 수정할 수 있게 안내"
    ],
    difficulties: [
      "정산 파일은 일부 행만 실패해도 전체 저장 기준을 명확히 해야 했다."
    ],
    solution:
      "업로드를 preview와 confirm으로 나누고, 저장 가능한 행과 차단된 행의 이유를 분리했다.",
    result:
      "운영자가 저장 전 오류 행과 원인을 확인한 뒤 정산 CSV를 반영할 수 있게 했다.",
    lessons: [
      "파일 import는 즉시 저장보다 preview/confirm 흐름이 안전하다.",
      "오류 메시지는 개발자용 예외가 아니라 사용자가 고칠 수 있는 단위여야 한다."
    ],
    resumeStatements: [
      "정산 CSV 업로드를 preview와 confirm 단계로 분리하고, 행 단위 오류 사유와 저장 가능 건수를 검증한 뒤 반영하는 흐름을 구현했습니다."
    ],
    essayPoints: [
      "AI JSON import preview와 같은 제품 원칙으로 설명 가능한 경험",
      "데이터 정합성을 위해 저장 전 검증을 설계한 경험"
    ],
    interviewPoints: [
      "왜 바로 저장하지 않았는가",
      "일부 행 실패 시 전체 파일을 어떻게 처리했는가"
    ],
    metricsToVerify: [
      "업로드 실패 재시도 횟수",
      "오류 유형별 빈도",
      "정산 반영 전 검증 소요 시간"
    ],
    dangerousClaims: ["정산 오류 완전 제거", "모든 CSV 포맷 자동 보정"],
    safeClaims: [
      "행 단위 검증과 저장 전 preview 구현",
      "오류 사유와 저장 가능 건수를 분리해 표시"
    ],
    evidenceRefs: ["demo/fact-pack.md#settlement-csv-validation"],
    learningQuestions: [
      "preview 단계에서 무엇을 보여줘야 하는가",
      "정상 행만 저장할지 전체 차단할지는 어떻게 결정하는가"
    ],
    score: {
      resumeScore: 91,
      essayScore: 90,
      interviewScore: 92,
      overallScore: 91,
      evidenceConfidence: "A",
      useTier: "hero",
      scoreReason:
        "Career Lab 자체의 preview/confirm 제품 철학과 연결해 설명하기 좋음.",
      caution: "정산 결과 개선 수치는 확인 전까지 쓰지 않는다."
    },
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-retryable-inventory-batch",
    cycleIds: demoCycleIds,
    source: "seed",
    projectId: "demo-project-billing-data",
    title: "재고 알림 배치 실패 재처리 기준 정리",
    system: "DEMO_BILLING",
    startedAt: "2026-03-01",
    endedAt: "2026-04-15",
    periodNote: "배치 실패 재처리와 중복 방지 정책을 보여주는 데모 사례.",
    priority: 2,
    riskLevel: "medium",
    categories: ["배치", "운영", "재처리", "데이터 정합성"],
    categoryColors: {},
    problem:
      "재고 알림 배치 실패 후 재실행 시 이미 처리된 알림이 중복 발송될 위험이 있었다.",
    role:
      "처리 키 기준, 실패 상태, 재처리 가능 조건을 정리하고 운영 확인 로그를 남겼다.",
    technologies: ["Java", "Spring Batch", "Scheduler", "PostgreSQL"],
    actions: [
      "알림 대상 생성 키와 발송 이력 키를 분리",
      "실패 상태별 재처리 가능 여부를 문서화",
      "중복 발송 방지를 위한 unique key 후보 정리",
      "운영자가 확인할 배치 결과 로그 필드를 정리"
    ],
    difficulties: [
      "재처리 편의성과 중복 방지 사이에서 안전한 기본값을 정해야 했다."
    ],
    solution:
      "처리 기준을 코드와 문서에 함께 남기고, 자동 재처리보다 확인 가능한 수동 재처리를 먼저 열었다.",
    result:
      "배치 실패 후 재처리 시 확인할 기준과 중복 방지 포인트가 명확해졌다.",
    lessons: [
      "운영 배치는 성공 경로보다 실패 후 재처리 기준이 더 중요할 수 있다."
    ],
    resumeStatements: [
      "재고 알림 배치의 실패 상태와 재처리 가능 조건을 정리하고, 중복 발송을 막기 위한 처리 키와 운영 확인 로그 기준을 설계했습니다."
    ],
    essayPoints: ["실패 이후를 고려한 운영 안정화 경험"],
    interviewPoints: [
      "자동 재처리 대신 수동 확인을 먼저 둔 이유",
      "중복 발송 방지 키를 어떻게 잡았는가"
    ],
    metricsToVerify: ["재처리 성공률", "중복 발송 발생 여부", "배치 실패 유형"],
    dangerousClaims: ["배치 장애 완전 방지", "재처리 자동화 완성"],
    safeClaims: [
      "실패 상태와 재처리 가능 조건 정리",
      "중복 방지 키 후보와 운영 로그 기준 설계"
    ],
    evidenceRefs: ["demo/fact-pack.md#retryable-inventory-batch"],
    learningQuestions: [
      "재처리 기준은 누가 확인해야 하는가",
      "중복 발송은 어떤 업무 리스크를 만드는가"
    ],
    score: {
      resumeScore: 86,
      essayScore: 84,
      interviewScore: 89,
      overallScore: 86,
      evidenceConfidence: "B+",
      useTier: "main",
      scoreReason:
        "배치, 운영 실패, 재처리 정책을 설명할 수 있는 백엔드 보조 사례.",
      caution: "자동화 완성보다 재처리 기준 정리로 표현."
    },
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-support-tag-admin",
    cycleIds: demoCycleIds,
    source: "seed",
    projectId: "demo-project-support-automation",
    title: "고객 문의 태그 관리 화면 개선",
    system: "DEMO_SUPPORT",
    startedAt: "2026-03-20",
    endedAt: "2026-04-20",
    periodNote: "운영 도구 UI/서버 검증을 보여주는 데모 사례.",
    priority: 2,
    riskLevel: "low",
    categories: ["풀스택", "운영 도구", "UI", "검증"],
    categoryColors: {},
    problem:
      "문의 태그가 늘어나면서 사용 중인 태그와 보관 태그를 구분하기 어렵고, 잘못 삭제하면 기존 문의 분류가 깨질 수 있었다.",
    role:
      "태그 검색, 보관 상태 전환, 삭제 차단, 색상 선택 UI와 서버 validation을 구현했다.",
    technologies: ["React", "TypeScript", "Java", "Spring"],
    actions: [
      "태그 검색과 상태 필터 추가",
      "사용 중인 태그 삭제 차단",
      "보관 상태 전환 후 목록 유지",
      "색상 선택 UI의 한 줄 유지와 접근성 라벨 점검"
    ],
    difficulties: [
      "작은 UI라도 삭제/보관 기준이 명확하지 않으면 운영 데이터가 깨질 수 있었다."
    ],
    solution:
      "UI 편의성보다 데이터 보호 조건을 먼저 두고, 위험한 삭제는 서버에서도 차단했다.",
    result:
      "지원 담당자가 태그를 검색, 보관, 수정하면서 기존 문의 분류를 보호할 수 있게 했다.",
    lessons: [
      "운영 도구의 삭제 버튼은 편의 기능이 아니라 데이터 보호 정책과 같이 설계해야 한다."
    ],
    resumeStatements: [
      "고객 문의 태그 관리 화면에 검색, 보관 상태, 색상 선택, 사용 중 태그 삭제 차단을 구현하고 서버 validation으로 데이터 보호 조건을 보강했습니다."
    ],
    essayPoints: ["작은 운영 도구에서도 데이터 보호 조건을 먼저 본 경험"],
    interviewPoints: [
      "삭제 차단 기준은 어떻게 잡았는가",
      "UI와 서버 validation을 왜 함께 두었는가"
    ],
    metricsToVerify: ["태그 수정 빈도", "삭제 차단 발생 건수"],
    dangerousClaims: ["고객지원 자동화 전체 구축"],
    safeClaims: [
      "태그 관리 화면 개선",
      "사용 중 태그 삭제 차단과 서버 validation 보강"
    ],
    evidenceRefs: ["demo/fact-pack.md#support-tag-admin"],
    learningQuestions: [
      "사용 중 태그를 삭제하면 어떤 문제가 생기는가",
      "클라이언트 validation만으로 부족한 이유는 무엇인가"
    ],
    score: {
      resumeScore: 83,
      essayScore: 82,
      interviewScore: 84,
      overallScore: 83,
      evidenceConfidence: "A",
      useTier: "support",
      scoreReason:
        "풀스택 운영 도구와 삭제 정책을 보여주는 보조 사례.",
      caution: "자동 분류 모델 구현처럼 과장하지 않는다."
    },
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-runbook-incident-response",
    cycleIds: demoCycleIds,
    source: "seed",
    projectId: "demo-project-support-automation",
    title: "장애 대응 Runbook 정리",
    system: "DEMO_SUPPORT",
    startedAt: "2026-04-01",
    endedAt: "2026-05-15",
    periodNote: "장애 원인 분리와 협업 문서화를 보여주는 데모 사례.",
    priority: 3,
    riskLevel: "low",
    categories: ["운영", "문서화", "장애 대응", "협업"],
    categoryColors: {},
    problem:
      "알림 실패나 관리자 화면 오류가 발생했을 때 앱, 배치, 외부 연동 중 어느 경계의 문제인지 빠르게 나누기 어려웠다.",
    role:
      "증상별 확인 순서, 로그 위치, 담당자 전달 템플릿을 Runbook으로 정리했다.",
    technologies: ["Markdown", "로그 분석", "운영 체크리스트"],
    actions: [
      "증상별 1차 확인 명령과 로그 위치 정리",
      "앱 오류/배치 지연/외부 연동 실패를 구분하는 질문 작성",
      "재현 정보와 요청 정보를 모으는 전달 템플릿 작성"
    ],
    difficulties: [
      "장애를 직접 해결했다고 말하기보다 원인 분리와 협업 기준으로 표현해야 했다."
    ],
    solution:
      "개발자가 확인 가능한 증거와 다른 담당자에게 넘길 정보를 분리했다.",
    result:
      "반복 장애 문의에서 무엇을 먼저 확인해야 하는지 팀 내 기준을 맞출 수 있게 했다.",
    lessons: [
      "문서화는 부가 작업이 아니라 운영 안정성을 높이는 개발 산출물이다."
    ],
    resumeStatements: [
      "운영 장애 발생 시 앱 오류, 배치 지연, 외부 연동 실패를 구분할 수 있도록 확인 순서와 로그 위치, 전달 템플릿을 Runbook으로 정리했습니다."
    ],
    essayPoints: ["협업자가 바로 확인할 수 있는 증거를 정리한 경험"],
    interviewPoints: [
      "장애를 직접 해결했다는 표현과 원인 분리 문서화의 차이",
      "Runbook이 실제 협업에 주는 가치"
    ],
    metricsToVerify: ["Runbook 사용 횟수", "반복 문의 감소 여부"],
    dangerousClaims: ["장애 대응 체계 전체 설계", "모든 장애 해결"],
    safeClaims: [
      "증상별 확인 순서와 로그 위치 정리",
      "담당자 전달 템플릿 작성"
    ],
    evidenceRefs: ["demo/fact-pack.md#runbook-incident-response"],
    learningQuestions: [
      "본인이 확인 가능한 범위는 어디까지인가",
      "다른 담당자에게 넘길 정보는 무엇인가"
    ],
    score: {
      resumeScore: 76,
      essayScore: 82,
      interviewScore: 88,
      overallScore: 82,
      evidenceConfidence: "A",
      useTier: "interview-only",
      scoreReason:
        "대표 bullet보다는 운영 협업과 장애 대응 태도를 설명할 때 유용함.",
      caution: "직접 장애 해결 성과로 과장하지 않는다."
    },
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  }
];

export const demoSeedWorkItems: WorkItem[] = demoWorkItems.map(
  ({ score, ...workItem }) => ({
    ...workItem,
    score,
    resumeFit: createResumeFitFromScore(score)
  })
);

export const demoSeedResumeStatements: ResumeStatement[] = [
  {
    id: "demo-resume-query-latency-final",
    cycleIds: demoCycleIds,
    source: "seed",
    workItemId: "demo-query-latency-analysis",
    text:
      "운영 대시보드의 기간/상태 필터 조회 지연을 재현하고, 목록 조회와 집계 조회를 분리해 결과 건수와 대표 행 동등성을 검증하는 기준을 정리했습니다.",
    draftBaseline:
      "운영 대시보드의 기간/상태 필터 조회 지연을 재현하고, 목록 조회와 집계 조회를 분리해 결과 건수와 대표 행 동등성을 검증하는 기준을 정리했습니다.",
    status: "final",
    evaluation: {
      evaluatedAt: DEMO_SEED_TIMESTAMP,
      fitScore: 91,
      factSafetyScore: 93,
      specificityScore: 88,
      jdMatchScore: 86,
      distinctivenessScore: 84,
      summary:
        "성능 개선을 과장하지 않고 재현, 분리, 검증 기준으로 설명해 안전합니다.",
      riskWarnings: [
        "응답 시간 개선율은 실제 계측 전까지 본문에 넣지 않습니다."
      ],
      improvementSuggestions: [
        "지원 JD가 데이터 엔지니어링에 가까우면 집계 조회 분리와 검증 쿼리를 더 앞에 둡니다."
      ],
      recommendedStatus: "final"
    },
    versions: [
      createDemoVersion({
        id: "version-demo-resume-query-latency-candidate",
        before: "운영 대시보드 조회 성능을 개선했습니다.",
        after:
          "운영 대시보드의 기간/상태 필터 조회 지연을 재현하고 목록 조회와 집계 조회를 분리했습니다.",
        rationale:
          "성과 수치 없이도 문제 재현과 구현 범위가 드러나도록 확장했습니다.",
        tags: ["seed", "candidate"]
      }),
      createDemoVersion({
        id: "version-demo-resume-query-latency-final",
        before:
          "운영 대시보드의 기간/상태 필터 조회 지연을 재현하고 목록 조회와 집계 조회를 분리했습니다.",
        after:
          "운영 대시보드의 기간/상태 필터 조회 지연을 재현하고, 목록 조회와 집계 조회를 분리해 결과 건수와 대표 행 동등성을 검증하는 기준을 정리했습니다.",
        rationale:
          "성능 개선 후보뿐 아니라 결과 동등성 검증 기준까지 포함해 사실성을 높였습니다.",
        tags: ["seed", "final"]
      })
    ],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-resume-settlement-csv-usable",
    cycleIds: demoCycleIds,
    source: "seed",
    workItemId: "demo-settlement-csv-validation",
    text:
      "정산 CSV 업로드를 preview와 confirm 단계로 분리하고, 행 단위 오류 사유와 저장 가능 건수를 검증한 뒤 반영하는 흐름을 구현했습니다.",
    draftBaseline:
      "정산 CSV 업로드를 preview와 confirm 단계로 분리하고, 행 단위 오류 사유와 저장 가능 건수를 검증한 뒤 반영하는 흐름을 구현했습니다.",
    status: "usable",
    evaluation: {
      evaluatedAt: DEMO_SEED_TIMESTAMP,
      fitScore: 89,
      factSafetyScore: 92,
      specificityScore: 87,
      jdMatchScore: 84,
      distinctivenessScore: 82,
      summary:
        "데이터 검증과 저장 전 확인 흐름이 명확해 백엔드 포지션에 바로 활용 가능합니다.",
      riskWarnings: ["정산 오류 감소 수치는 확인 전까지 쓰지 않습니다."],
      improvementSuggestions: [
        "CSV 검증 규칙 예시를 하나 더 넣으면 구체성이 올라갑니다."
      ],
      recommendedStatus: "usable"
    },
    versions: [
      createDemoVersion({
        id: "version-demo-resume-settlement-csv-usable",
        before: "정산 CSV 업로드 검증 기능을 구현했습니다.",
        after:
          "정산 CSV 업로드를 preview와 confirm 단계로 분리하고, 행 단위 오류 사유와 저장 가능 건수를 검증한 뒤 반영하는 흐름을 구현했습니다.",
        rationale:
          "단순 구현 표현을 저장 전 검증 흐름과 데이터 정합성 중심으로 다듬었습니다.",
        tags: ["seed", "usable"]
      })
    ],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-resume-audit-log-editing",
    cycleIds: demoCycleIds,
    source: "seed",
    workItemId: "demo-audit-log-history",
    text:
      "주문 상태 변경 전후값과 변경 주체를 감사 로그로 저장하고, 운영자가 기간/상태/주체 기준으로 조회할 수 있는 API와 관리자 화면을 구현했습니다.",
    draftBaseline:
      "주문 상태 변경 전후값과 변경 주체를 감사 로그로 저장하고, 운영자가 기간/상태/주체 기준으로 조회할 수 있는 API와 관리자 화면을 구현했습니다.",
    status: "editing",
    evaluation: {
      evaluatedAt: DEMO_SEED_TIMESTAMP,
      fitScore: 84,
      factSafetyScore: 86,
      specificityScore: 82,
      jdMatchScore: 80,
      distinctivenessScore: 78,
      summary:
        "흐름은 좋지만 전체 이력 보장처럼 읽히지 않게 적용 범위를 더 좁혀야 합니다.",
      riskWarnings: ["모든 상태 변경 추적 보장으로 읽히지 않게 주의합니다."],
      improvementSuggestions: [
        "신규 상태 변경 경로부터 적용했다는 제한을 추가합니다."
      ],
      recommendedStatus: "editing"
    },
    versions: [
      createDemoVersion({
        id: "version-demo-resume-audit-log-editing",
        before: "주문 상태 변경 이력을 추적하는 기능을 만들었습니다.",
        after:
          "주문 상태 변경 전후값과 변경 주체를 감사 로그로 저장하고, 운영자가 기간/상태/주체 기준으로 조회할 수 있는 API와 관리자 화면을 구현했습니다.",
        rationale: "조회 조건과 구현 범위를 드러내도록 구체화했습니다.",
        tags: ["seed", "editing"]
      })
    ],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  }
];

export const demoSeedEssaySets: EssaySet[] = [
  {
    id: DEMO_DEFAULT_ESSAY_SET_ID,
    cycleIds: demoCycleIds,
    source: "seed",
    title: "Demo Backend 지원 묶음",
    companyName: "익명 커머스 플랫폼",
    roleTitle: "백엔드 개발자",
    status: "drafting",
    deadline: "",
    jdKeywords: "Spring, SQL, 운영 안정화, 데이터 정합성",
    formatNotes: "공개 데모용 자기소개서 묶음. 실제 지원 회사 정보 없음.",
    notes:
      "업무 이해 -> 자기소개서 답변 -> AI 첨삭 프롬프트 복사 흐름을 보여주는 샘플입니다.",
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  }
];

const demoEssayQuestionDrafts: EssayQuestion[] = [
  {
    id: "demo-essay-ops-quality",
    cycleIds: demoCycleIds,
    source: "seed",
    essaySetId: DEMO_DEFAULT_ESSAY_SET_ID,
    question: "운영 품질을 개선한 경험을 설명해주세요.",
    answer:
      "운영 품질을 개선할 때는 빠르게 수정하는 것보다 문제가 다시 설명 가능한 상태로 남는지가 중요하다고 생각합니다. 익명 운영 포털의 대시보드 조회 지연 사례에서는 먼저 어떤 필터 조합에서 느려지는지 재현하고, 목록 조회와 집계 조회가 서로 다른 책임을 갖도록 분리했습니다. 기존 화면은 사용자가 기간, 상태, 담당 조직을 바꿀 때마다 같은 조건으로 여러 집계가 반복 실행되는 구조였고, 느린 구간을 단순히 인덱스 문제로만 보기 어려웠습니다. 저는 실행 계획과 샘플 데이터를 함께 확인해 자주 쓰는 조회 조건을 우선 정리했고, 화면에 필요한 대표 행과 총계가 서로 다른 기준으로 계산되지 않도록 SQL 책임을 나눴습니다. 이후 결과 건수, 정렬 순서, 대표 금액, 빈 결과 처리 기준을 체크리스트로 만들어 수정 전후를 비교했습니다. 검증 결과는 이슈 댓글과 변경 메모에 남겨 QA 담당자가 같은 조건으로 다시 확인할 수 있게 했고, 운영 문의가 들어왔을 때도 어떤 기준으로 정상 여부를 판단했는지 바로 설명할 수 있었습니다. 아직 운영 반영 후 평균 응답 시간은 확인 필요 지표로 분리했지만, 이 과정에서 성능 개선도 사실성과 데이터 의미 보존을 함께 봐야 한다는 점을 배웠습니다.",
    targetLength: { min: 600, max: 900 },
    linkedWorkItemIds: ["demo-query-latency-analysis"],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-essay-data-integrity",
    cycleIds: demoCycleIds,
    source: "seed",
    essaySetId: DEMO_DEFAULT_ESSAY_SET_ID,
    question: "데이터 정합성을 지키기 위해 어떤 노력을 했나요?",
    answer:
      "정산 CSV 업로드 개선 사례에서는 사용자가 파일을 올리는 즉시 저장하지 않고 preview와 confirm 단계를 분리했습니다. 이전 흐름은 업로드 실패 시 전체 오류만 보여주어 담당자가 어떤 행을 고쳐야 하는지 다시 파일을 열어 추적해야 했고, 일부 값은 화면 표시와 저장 기준이 달라 검토 시간이 길어졌습니다. 저는 헤더 누락, 컬럼 순서, 날짜와 금액 형식, 필수값 누락을 먼저 확인하고, 행 단위 오류 사유와 저장 가능 건수를 나누어 보여주도록 정리했습니다. 또한 preview 화면에서 원본 값, 변환 값, 제외 사유를 함께 볼 수 있게 하여 사용자가 저장 전에 스스로 판단할 근거를 갖게 했습니다. 저장 전후 총액과 처리 건수가 달라지는 경우에는 confirm을 막고 원인 메시지를 먼저 보여주도록 하여, 정상 행만 일부 저장되는 애매한 상태를 피했습니다. QA 검증용 샘플 파일도 정상, 부분 오류, 전체 실패로 나누어 남겼습니다. 이 방식은 잘못된 행이 조용히 저장되는 위험을 줄이고, 운영자가 개발자에게 문의할 때도 재현 가능한 파일명과 행 번호를 함께 전달하게 만들었습니다. 저는 import 기능에서 중요한 것은 자동 처리보다 저장 전 사용자가 검토할 수 있는 근거를 제공하는 것이라고 배웠습니다.",
    targetLength: { min: 600, max: 900 },
    linkedWorkItemIds: ["demo-settlement-csv-validation"],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  }
];

export const demoSeedEssayQuestions: EssayQuestion[] =
  demoEssayQuestionDrafts.map((question) => ({
    ...question,
    versions: [createDemoEssayVersion(question.id, question.answer)]
  }));

export const demoSeedInterviewQuestions: InterviewQuestion[] = [
  {
    id: "demo-interview-query-analysis",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "조회가 느렸던 화면을 어떻게 분석했나요?",
    intent: "성능 문제를 재현, 분리, 검증하는 사고 과정을 확인한다.",
    answerDirection:
      "필터 조합 재현, 목록/집계 분리, 결과 동등성 검증, 확인 필요 지표를 순서대로 말한다.",
    myAnswer:
      "먼저 어떤 조건에서 느려지는지 재현했습니다. 기간, 상태, 담당자 필터를 조합해 보고, 목록 조회와 집계 조회가 같은 쿼리에서 과하게 묶여 있는지 확인했습니다. 이후 목록은 화면에 필요한 행 중심으로, 집계는 별도 기준으로 분리하는 후보를 만들었습니다. 다만 빠르게 만드는 것만으로는 부족해서 결과 건수와 대표 행, 정렬 기준이 기존과 같은지 검증했습니다. 운영 반영 후 평균 응답 시간은 확인 필요 지표로 남기고, 이력서에는 재현과 검증 기준 중심으로 표현합니다.",
    exampleAnswer:
      "느린 필터 조합을 재현한 뒤 목록 조회와 집계 조회를 분리하고, 건수와 대표 행 동등성을 검증했습니다.",
    linkedWorkItemIds: ["demo-query-latency-analysis"],
    understanding: "readable",
    followUps: [
      createDemoFollowUp({
        id: "demo-followup-query-metric",
        question: "응답 시간 수치는 왜 성과로 바로 쓰지 않았나요?",
        intent: "확인 전 수치를 성과로 포장하지 않는지 확인한다.",
        answerDirection:
          "직접 재현 수치와 운영 반영 후 평균 지표를 구분한다고 답한다.",
        exampleAnswer:
          "직접 재현한 조건의 수치는 참고 근거이고, 운영 평균이나 p95는 배포 후 별도 계측이 필요하기 때문에 확인 필요 지표로 분리했습니다.",
        tags: ["metric", "fact-safety"]
      }),
      createDemoFollowUp({
        id: "demo-followup-query-equivalence",
        question: "결과 동등성은 어떻게 확인했나요?",
        intent: "성능 개선이 데이터 의미를 깨지 않는지 확인한다.",
        answerDirection:
          "총건수, 대표 행, 정렬 기준, 집계값을 비교했다고 답한다.",
        exampleAnswer:
          "목록 건수, 대표 행 샘플, 정렬 기준, 집계값을 비교해 기존 화면 의미가 유지되는지 봤습니다.",
        tags: ["sql", "validation"]
      })
    ],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-interview-csv-validation",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "CSV 업로드에서 데이터가 잘못 저장되지 않게 어떻게 막았나요?",
    intent: "파일 import의 데이터 정합성 리스크를 이해하는지 확인한다.",
    answerDirection:
      "부분 실패, 오류 행 저장 차단, preview/confirm, 사용자 수정 가능 메시지를 설명한다.",
    myAnswer:
      "가장 위험한 부분은 잘못된 행이 일부만 섞여 있을 때 전체 파일을 어떻게 처리할지 기준이 애매해지는 점입니다. 그래서 업로드 즉시 저장하지 않고 preview 단계에서 헤더, 컬럼 순서, 날짜와 금액 형식, 필수값을 먼저 검사했습니다. 오류 행과 저장 가능 건수를 나누어 보여주고, confirm 단계에서만 반영했습니다. 정산 파일은 잘못 저장되면 이후 확인 비용이 커지기 때문에 자동 보정보다 명확한 차단과 수정 가능 메시지를 우선했습니다.",
    exampleAnswer:
      "CSV import는 저장 전 preview/confirm을 거치고, 행 단위 오류 사유를 보여주는 방식이 안전합니다.",
    linkedWorkItemIds: ["demo-settlement-csv-validation"],
    understanding: "keyword",
    followUps: [],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-interview-runbook",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "장애 대응 문서를 만든 경험은 개발자로서 어떤 의미가 있었나요?",
    intent: "문서화를 단순 부가 작업이 아니라 운영 품질로 설명하는지 본다.",
    answerDirection:
      "장애 직접 해결 과장 대신 증상 분리, 로그 위치, 협업 전달 기준으로 말한다.",
    myAnswer:
      "Runbook은 장애를 모두 해결했다는 의미가 아니라, 반복되는 증상을 빠르게 분리하고 협업자에게 정확히 전달하기 위한 개발 산출물이라고 설명합니다. 앱 오류인지, 배치 지연인지, 외부 연동 실패인지에 따라 확인할 로그와 담당자가 달라집니다. 그래서 증상별 확인 순서, 로그 위치, 재현 정보 템플릿을 정리했습니다. 개발자가 모든 인프라 문제를 해결한다는 표현은 피하고, 제가 확인 가능한 증거를 정리해 협업 시간을 줄이는 역할이었다고 말합니다.",
    exampleAnswer:
      "장애 Runbook은 앱, 배치, 외부 연동 경계를 나누고 로그 위치와 전달 템플릿을 정리한 운영 협업 산출물입니다.",
    linkedWorkItemIds: ["demo-runbook-incident-response"],
    understanding: "readable",
    followUps: [],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-interview-backend-priority",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "백엔드 포지션이라면 어떤 경험을 가장 먼저 이야기하시겠어요?",
    intent: "지원 직무에 맞춰 같은 경험을 재정렬할 수 있는지 확인한다.",
    answerDirection:
      "SQL 성능, import 검증, 감사 로그, 배치 재처리 순서로 근거를 배치한다.",
    myAnswer:
      "백엔드 직무라면 화면 개선보다 데이터와 서버 처리 기준이 분명한 경험을 앞에 두겠습니다. 첫 번째는 운영 대시보드 조회 지연 분석입니다. SQL 구조, 목록/집계 분리, 결과 동등성 검증을 설명할 수 있기 때문입니다. 두 번째는 정산 CSV 업로드 검증입니다. preview/confirm과 행 단위 오류 차단이 데이터 정합성과 직접 연결됩니다. 그 다음 감사 로그와 배치 재처리 기준을 보조 사례로 두어 운영 안정성을 함께 보여주겠습니다.",
    exampleAnswer:
      "SQL 성능 분석, CSV import 검증, 감사 로그, 배치 재처리 기준 순서로 배치하겠습니다.",
    linkedWorkItemIds: [
      "demo-query-latency-analysis",
      "demo-settlement-csv-validation",
      "demo-audit-log-history",
      "demo-retryable-inventory-batch"
    ],
    understanding: "readable",
    followUps: [],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-interview-transition-short",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "왜 지금 이직을 생각하고 있나요?",
    intent:
      "현재 조직 비판 없이 이직 이유를 다음 역할과 성장 방향으로 설명하는지 확인한다.",
    answerDirection:
      "현재 경험을 부정하지 않고 운영 도구와 데이터 검증 경험을 백엔드 성장 방향으로 연결한다.",
    myAnswer:
      "운영 도구와 데이터 검증 경험을 바탕으로, 더 큰 트래픽과 명확한 품질 기준을 가진 백엔드 환경에서 성장하고 싶습니다.",
    exampleAnswer:
      "지금까지 쌓은 운영 품질 경험을 더 큰 백엔드 환경에서 깊게 확장하고 싶다고 답합니다.",
    linkedWorkItemIds: [
      "demo-query-latency-analysis",
      "demo-settlement-csv-validation"
    ],
    understanding: "keyword",
    followUps: [
      createDemoFollowUp({
        id: "demo-followup-transition-current-company",
        question: "현재 회사에서 더 시도해볼 수 있는 건 없나요?",
        intent: "조기 이직이 회피처럼 들리지 않는지 확인한다.",
        answerDirection:
          "현재 경험에서 배운 점을 인정하고 다음 단계의 품질 기준을 구체화한다.",
        exampleAnswer:
          "현재 경험을 부정하지 않고, 더 큰 백엔드 환경에서 코드 리뷰, 테스트, 운영 지표를 체계적으로 경험하고 싶다고 답합니다.",
        riskWarnings: ["현재 조직 비판으로 들리는 표현은 피합니다."],
        tags: ["transition", "risk-control"]
      })
    ],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-interview-transition-essay",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "지원 동기와 이직 사유를 연결해서 말해보세요.",
    intent:
      "불만성 이직처럼 보이지 않게 지원 직무, 경험, 성장 방향을 한 흐름으로 연결하는지 본다.",
    answerDirection:
      "운영 화면, 서버 로직, SQL, 파일 import 경험을 데이터 정합성과 운영 안정성으로 묶는다.",
    myAnswer:
      "저는 운영 화면, 서버 로직, SQL, 파일 import가 실제 업무 결과와 어떻게 연결되는지 확인하며 개발해 왔습니다. 앞으로는 이 경험을 기반으로 데이터 정합성, 성능 검증, 장애 대응 기준을 더 체계적으로 다루는 백엔드 개발자로 성장하고 싶습니다.",
    exampleAnswer:
      "운영 기능 구현 경험을 바탕으로 데이터 정합성과 성능 검증을 더 깊게 다루는 백엔드 개발자로 성장하고 싶다고 정리합니다.",
    linkedWorkItemIds: [
      "demo-query-latency-analysis",
      "demo-settlement-csv-validation",
      "demo-runbook-incident-response"
    ],
    understanding: "readable",
    followUps: [],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-interview-transition-safe",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "경력이 짧은데 이직을 준비하는 이유가 뭔가요?",
    intent: "짧은 재직 기간을 변명하거나 현재 환경 탓으로 돌리지 않는지 확인한다.",
    answerDirection:
      "현재까지의 경험을 인정하고, 코드 리뷰, 테스트, 운영 지표 기반 성장 욕구로 좁힌다.",
    myAnswer:
      "현재까지는 운영 도구와 데이터 검증 중심의 경험을 쌓았습니다. 다음 단계에서는 더 명확한 코드 리뷰, 테스트, 운영 지표 기반 개발 문화를 경험하며 백엔드 역량을 넓히고 싶습니다.",
    exampleAnswer:
      "짧은 경력은 인정하되, 현재 경험 위에서 코드 리뷰와 테스트, 운영 지표를 더 체계적으로 경험하고 싶다고 말합니다.",
    linkedWorkItemIds: ["demo-settlement-csv-validation"],
    understanding: "keyword",
    followUps: [],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  },
  {
    id: "demo-interview-transition-growth",
    cycleIds: demoCycleIds,
    source: "seed",
    question: "다음 회사에서는 어떤 부분을 더 깊게 해보고 싶나요?",
    intent: "성장이라는 표현이 막연하지 않고 구체적인 백엔드 품질 영역으로 좁혀지는지 본다.",
    answerDirection:
      "SQL 성능, import 검증, 배치 재처리처럼 실제 경험과 연결되는 성장 방향을 말한다.",
    myAnswer:
      "저는 기능을 구현하는 데서 끝나지 않고, 사용자가 확인할 수 있는 결과와 실패 시 복구 기준까지 고려하는 개발자로 성장하고 싶습니다. 특히 SQL 성능, import 검증, 배치 재처리 같은 백엔드 품질 영역을 더 깊게 다루고 싶습니다.",
    exampleAnswer:
      "성장 방향을 백엔드 품질로 좁히고, SQL 성능과 import 검증, 배치 재처리 같은 실제 사례와 연결합니다.",
    linkedWorkItemIds: [
      "demo-query-latency-analysis",
      "demo-settlement-csv-validation",
      "demo-retryable-inventory-batch"
    ],
    understanding: "readable",
    followUps: [],
    versions: [],
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  }
];

export const demoSeedTransitionReasonCards: TransitionReasonCard[] = [];

export const demoSeedPromptTemplates: PromptTemplate[] = [
  createDemoPromptTemplate({
    id: "prompt-essay-revision",
    templateType: "essay-revision",
    title: "자기소개서 첨삭",
    description: "자기소개서 답변의 설득력, 과장 위험, 문단 흐름 점검.",
    body: `자기소개서 답변의 설득력, 과장 위험, 구조, 면접 방어 가능성을 점검한다.
- 한국 개발자 이직 자기소개서 기준으로 평가한다.
- 톤은 실무적이고 솔직하게 유지한다.
- revisedAnswer는 첫 문장 결론, 실제 경험, 문제 상황, 내가 한 행동, 결과와 배운 점, 지원 직무와 연결되는 강점 흐름을 따른다.
- 없는 수치, 없는 협업, 확인되지 않은 기술 경험을 만들지 않는다.
- metricsToVerify는 confirmed result처럼 쓰지 않는다.
- 위험하거나 애매한 표현은 riskWarnings에 적고, 면접에서 공격받을 질문은 followUpInterviewQuestions에 넣는다.`,
    requiredJsonShape:
      "{\"score\":0,\"strengths\":[],\"riskWarnings\":[],\"revisedAnswer\":\"\",\"whyThisIsBetter\":\"\",\"followUpInterviewQuestions\":[]}"
  }),
  createDemoPromptTemplate({
    id: "prompt-interview-followup",
    templateType: "interview-followup",
    title: "면접 꼬리질문 생성",
    description: "메인 질문과 현재 답변을 기반으로 추가 꼬리질문 생성.",
    body: `메인 질문, 현재 답변, 기존 꼬리질문 thread, 연결 업무 근거를 보고 새로운 꼬리질문을 생성한다.
- 6~8개의 새 꼬리질문을 만든다.
- 쉬운 확인 질문, 기술 디테일 질문, 소유권/범위 압박 질문, 안정성/성능 질문, 회고/개선 질문을 섞는다.
- 기존 질문과 중복하지 않는다.
- exampleAnswer에는 원문 근거에 없는 사실을 추가하지 않는다.
- 답변에서 조심해야 할 지점은 riskWarnings에 넣는다.
- 현재 앱은 가져온 질문을 현재 질문의 꼬리질문으로 추가하므로 parentQuestionId를 만들지 않는다.`,
    requiredJsonShape:
      "{\"mainQuestionId\":\"\",\"newFollowUps\":[{\"question\":\"\",\"intent\":\"\",\"answerDirection\":\"\",\"exampleAnswer\":\"\",\"riskWarnings\":[],\"tags\":[]}]}"
  }),
  createDemoPromptTemplate({
    id: "prompt-transition-safety",
    templateType: "transition-safety",
    title: "이직 사유 안전성 점검",
    description: "이직 사유가 부정적으로 들릴 위험을 점검.",
    body: `이직 사유가 한국 개발자 면접에서 부정적으로 들릴 위험을 평가하고 더 안전한 대안을 제안한다.
- 현 회사, 팀, 관리자, 고객사, 프로세스를 비판하지 않는다.
- 책임 회피나 도피처럼 들리지 않게 한다.
- 성장 방향, 역할 적합성, 기술 깊이, 다음 단계 정렬로 재구성한다.
- 너무 꾸며낸 답변보다 초년 개발자에게 자연스러운 솔직한 톤을 유지한다.`,
    requiredJsonShape:
      "{\"riskLevel\":\"low\",\"riskWarnings\":[],\"safeAlternatives\":[],\"interviewerConcerns\":[]}"
  }),
  createDemoPromptTemplate({
    id: "prompt-jd-resume-reorder",
    templateType: "jd-resume-reorder",
    title: "JD 기반 경력기술서 재정렬",
    description: "지원 JD 키워드 기준으로 문구 우선순위를 점검.",
    body: `JD와 현재 경력기술서 문구를 비교해 검증된 관련성이 높은 순서로 재정렬한다.
- JD에 맞추기 위해 없는 경험이나 기술을 만들지 않는다.
- 확인되지 않은 프레임워크 경험을 다른 기술 경험처럼 과장하지 않는다.
- JD 요구사항 중 근거가 없는 항목은 missingEvidence에 넣는다.
- 키워드 매칭보다 verified relevance와 evidence strength를 우선한다.
- 위험한 문구나 unsupported claim은 riskWarnings에 넣는다.
- recommendedOrder에는 statementId, rank, reason을 포함한 객체 배열을 사용한다.`,
    requiredJsonShape:
      "{\"recommendedOrder\":[{\"statementId\":\"\",\"rank\":1,\"reason\":\"\"}],\"missingEvidence\":[],\"riskWarnings\":[]}"
  }),
  createDemoPromptTemplate({
    id: "prompt-work-item-candidate-list",
    templateType: "work-item-candidate-list",
    title: "업무 후보 리스팅",
    description:
      "프로젝트 연결 에이전트에게 먼저 어떤 업무를 뽑을지 후보 목록을 요청.",
    body: `프로젝트 context, 기존 Career Lab 업무 목록, 접근 가능한 저장소/문서/git history를 보고 Career Lab에 추가할 업무 후보를 먼저 리스팅한다.
- 아직 최종 WorkItem JSON을 만들지 않는다.
- 사용자가 고를 수 있도록 candidateKey, 업무명, 근거, 위험 노트, 확인 질문을 분리한다.
- 구현, 운영 안정화, SQL, 배치, 파일 처리, 데이터 정합성, 장애 대응, 반복 업무 개선 소재를 우선한다.
- 서로 다른 프로젝트, 시스템, 기간, 근거를 섞지 않는다.
- 없는 수치, 소유권, 기술, 운영 효과를 만들지 않는다.
- 근거 파일, commit, 문서명, 섹션, 명령 결과가 있으면 evidenceRefs에 적는다.`,
    requiredJsonShape:
      "{\"projectSummary\":\"\",\"candidateWorkItems\":[{\"candidateKey\":\"\",\"projectName\":\"\",\"title\":\"\",\"candidateStartedAt\":\"\",\"candidateEndedAt\":\"\",\"timeEvidence\":\"\",\"whyCandidate\":\"\",\"evidenceRefs\":[],\"riskNotes\":[],\"questionsForUser\":[]}],\"recommendedSelection\":[]}"
  }),
  createDemoPromptTemplate({
    id: "prompt-work-item-selected-extraction",
    templateType: "work-item-selected-extraction",
    title: "선택 업무 JSON 추출",
    description:
      "사용자가 고른 후보 업무만 Career Lab WorkProject/WorkItem JSON으로 변환.",
    body: `사용자가 선택한 후보 업무만 Career Lab의 WorkProject/WorkItem import JSON으로 변환한다.
- 선택하지 않은 후보는 추출하지 않는다.
- 프로젝트 그룹을 먼저 만들고 모든 업무를 projectKey에 연결한다.
- 확인되지 않은 수치는 result가 아니라 metricsToVerify에 넣는다.
- 과장 위험 표현은 dangerousClaims에 넣고, 재사용 가능한 보수적 표현은 safeClaims에 넣는다.
- score가 불확실하면 evidenceConfidence를 C로 두고 confirmationQuestions와 caution에 확인 사항을 적는다.
- strict JSON만 반환하고 Markdown 설명을 붙이지 않는다.`,
    requiredJsonShape:
      "{\"projects\":[{\"key\":\"\",\"name\":\"\",\"system\":\"\",\"periodNote\":\"\",\"summary\":\"\"}],\"workItems\":[{\"projectKey\":\"\",\"title\":\"\",\"system\":\"\",\"startedAt\":\"\",\"endedAt\":\"\",\"periodNote\":\"\",\"priority\":2,\"riskLevel\":\"medium\",\"categories\":[],\"problem\":\"\",\"role\":\"\",\"technologies\":[],\"actions\":[],\"difficulties\":[],\"solution\":\"\",\"result\":\"\",\"lessons\":[],\"resumeStatements\":[],\"essayPoints\":[],\"interviewPoints\":[],\"metricsToVerify\":[],\"dangerousClaims\":[],\"safeClaims\":[],\"evidenceRefs\":[],\"learningQuestions\":[],\"score\":{\"resumeScore\":0,\"essayScore\":0,\"interviewScore\":0,\"overallScore\":0,\"evidenceConfidence\":\"C\",\"useTier\":\"support\",\"scoreReason\":\"\",\"caution\":\"\",\"rankingNote\":\"\",\"scoringAssumptions\":[],\"confirmationQuestions\":[]}}]}"
  })
];

export const demoSeedPromptHistory: PromptHistory[] = [
  createDemoPromptHistory({
    id: "prompt-history-demo-work-extraction",
    templateType: "work-item-selected-extraction",
    targetId: "demo-query-latency-analysis",
    createdAt: "2026-05-22T09:10:00.000+09:00",
    prompt: `선택한 업무 후보를 Career Lab WorkItem JSON으로 변환한다.

Target work:
- title: 운영 대시보드 조회 지연 분석
- project: 익명 커머스 운영 포털
- evidence: demo/fact-pack.md#query-latency-analysis

Rules:
- 확인되지 않은 성능 수치는 result가 아니라 metricsToVerify에 둔다.
- dangerousClaims에는 과장 위험 표현을 넣는다.
- strict JSON만 반환한다.`
  }),
  createDemoPromptHistory({
    id: "prompt-history-demo-essay-revision",
    templateType: "essay-revision",
    targetId: "demo-essay-ops-quality",
    createdAt: "2026-05-22T09:25:00.000+09:00",
    prompt: `자기소개서 답변을 검토한다.

Question:
운영 품질을 높이기 위해 문제를 구조화했던 경험을 설명해주세요.

Review focus:
- 첫 문장이 결론으로 시작하는가
- 업무 근거가 운영 대시보드 조회 지연 분석과 연결되는가
- 배포 후 확인 전 수치를 성과처럼 쓰지 않는가
- 면접에서 받을 수 있는 꼬리질문을 함께 제안한다.`
  }),
  createDemoPromptHistory({
    id: "prompt-history-demo-interview-followup",
    templateType: "interview-followup",
    targetId: "demo-interview-query-analysis",
    createdAt: "2026-05-22T09:40:00.000+09:00",
    prompt: `면접 메인 질문과 현재 답변을 보고 꼬리질문을 생성한다.

Main question:
운영 대시보드 조회 지연을 어떻게 분석했나요?

Linked evidence:
- 목록 조회와 집계 조회 분리
- 결과 동등성 검증 기준
- 배포 후 평균 응답 시간은 확인 필요 지표

Return JSON with newFollowUps only.`
  })
];

export const demoSeedEntities: CareerLabEntities = {
  careerCycles: demoSeedCareerCycles,
  workProjects: demoSeedWorkProjects,
  workItems: demoSeedWorkItems,
  resumeStatements: demoSeedResumeStatements,
  essaySets: demoSeedEssaySets,
  essayQuestions: demoSeedEssayQuestions,
  interviewQuestions: demoSeedInterviewQuestions,
  promptHistory: demoSeedPromptHistory,
  resumePromptProfiles: [],
  transitionReasonCards: demoSeedTransitionReasonCards,
  promptTemplates: demoSeedPromptTemplates
};

function createResumeFitFromScore(score: WorkItemScore): WorkItemResumeFit {
  return {
    score: score.resumeScore,
    level: getResumeFitLevel(score.resumeScore),
    reasons: [score.scoreReason],
    cautions: [score.caution]
  };
}

function getResumeFitLevel(score: number) {
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

function createDemoVersion({
  after,
  before,
  id,
  rationale,
  tags
}: {
  after: string;
  before: string;
  id: string;
  rationale: string;
  tags: string[];
}): VersionRecord {
  return {
    id,
    after,
    before,
    createdAt: DEMO_SEED_TIMESTAMP,
    diffText: `- ${before}\n+ ${after}`,
    rationale,
    tags
  };
}

function createDemoEssayVersion(questionId: string, after: string): VersionRecord {
  return {
    id: `version-demo-${questionId}`,
    after,
    before: "",
    createdAt: DEMO_SEED_TIMESTAMP,
    diffText: after ? `- \n+ ${after}` : "No changes",
    rationale: "공개 데모용 자기소개서 초기 버전",
    tags: ["seed", "essay", "demo"]
  };
}

function createDemoFollowUp({
  answerDirection,
  exampleAnswer,
  id,
  intent,
  question,
  riskWarnings = [],
  tags
}: {
  answerDirection: string;
  exampleAnswer: string;
  id: string;
  intent: string;
  question: string;
  riskWarnings?: string[];
  tags: string[];
}): InterviewFollowUp {
  return {
    id,
    parentId: null,
    question,
    intent,
    answerDirection,
    myAnswer: "",
    exampleAnswer,
    riskWarnings,
    tags,
    children: []
  };
}

function createDemoPromptTemplate({
  body,
  description,
  id,
  requiredJsonShape,
  templateType,
  title
}: {
  body: string;
  description: string;
  id: string;
  requiredJsonShape: string;
  templateType: string;
  title: string;
}): PromptTemplate {
  return {
    id,
    source: "seed",
    templateType,
    title,
    description,
    body,
    requiredJsonShape,
    createdAt: DEMO_SEED_TIMESTAMP,
    updatedAt: DEMO_SEED_TIMESTAMP
  };
}

function createDemoPromptHistory({
  createdAt,
  id,
  prompt,
  targetId,
  templateType
}: {
  createdAt: string;
  id: string;
  prompt: string;
  targetId: string;
  templateType: string;
}): PromptHistory {
  return {
    id,
    cycleId: DEMO_ACTIVE_CYCLE_ID,
    createdAt,
    templateType,
    targetId,
    prompt
  };
}
