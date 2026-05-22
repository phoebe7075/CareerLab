export const SCHEMA_VERSION = 9;

export const entitySources = ["seed", "user", "import"] as const;
export type EntitySource = (typeof entitySources)[number];

export const careerCycleStatuses = ["active", "archived"] as const;
export type CareerCycleStatus = (typeof careerCycleStatuses)[number];

export const workSystems = ["ECMS", "IPS", "COMMON"] as const;
export type WorkSystem = string;
export const workSystemLabels: Record<string, string> = {
  ECMS: "자재 운영(ECMS)",
  IPS: "공정 운영(IPS)",
  COMMON: "공통(COMMON)"
};

export function formatWorkSystem(system: WorkSystem) {
  return workSystemLabels[system] ?? system;
}

export function normalizeWorkSystem(input: unknown, fallback: WorkSystem = "COMMON") {
  return typeof input === "string" && input.trim() ? input.trim() : fallback;
}

export const workPriorities = [1, 2, 3] as const;
export type WorkPriority = (typeof workPriorities)[number];

export const resumeFitLevels = ["core", "strong", "supporting", "limited"] as const;
export type ResumeFitLevel = (typeof resumeFitLevels)[number];

export const workItemEvidenceConfidenceLevels = ["A", "B+", "B", "C"] as const;
export type WorkItemEvidenceConfidence =
  (typeof workItemEvidenceConfidenceLevels)[number];

export const workItemUseTiers = [
  "hero",
  "main",
  "support",
  "interview-only",
  "archive"
] as const;
export type WorkItemUseTier = (typeof workItemUseTiers)[number];

export const riskLevels = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof riskLevels)[number];

export const resumeStatementStatuses = [
  "candidate",
  "needs-review",
  "editing",
  "usable",
  "final"
] as const;
export type ResumeStatementStatus = (typeof resumeStatementStatuses)[number];

export const interviewUnderstandingLevels = [
  "unknown",
  "readable",
  "keyword",
  "natural"
] as const;
export type InterviewUnderstanding =
  (typeof interviewUnderstandingLevels)[number];

export const transitionReasonTones = [
  "short-interview",
  "essay",
  "honest-safe",
  "growth"
] as const;
export type TransitionReasonTone = (typeof transitionReasonTones)[number];

export const essaySetStatuses = [
  "drafting",
  "ready",
  "submitted",
  "archived"
] as const;
export type EssaySetStatus = (typeof essaySetStatuses)[number];

export type TimestampFields = {
  createdAt: string;
  updatedAt: string;
};

export type CareerCycle = TimestampFields & {
  id: string;
  title: string;
  goal: string;
  status: CareerCycleStatus;
  startedAt: string;
  endedAt?: string;
  notes: string;
};

export type WorkProject = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  name: string;
  system: WorkSystem;
  contextType?: string;
  organizationName?: string;
  teamSize?: string;
  myRole?: string;
  startedAt?: string;
  endedAt?: string;
  periodNote: string;
  summary: string;
};

export type WorkItem = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  projectId: string;
  title: string;
  system: WorkSystem;
  startedAt?: string;
  endedAt?: string;
  periodNote: string;
  priority: WorkPriority;
  score?: WorkItemScore;
  resumeFit?: WorkItemResumeFit;
  riskLevel: RiskLevel;
  categories: string[];
  categoryColors?: Record<string, number>;
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
};

export type WorkItemScore = {
  resumeScore: number;
  essayScore: number;
  interviewScore: number;
  overallScore: number;
  evidenceConfidence: WorkItemEvidenceConfidence;
  useTier: WorkItemUseTier;
  scoreReason: string;
  caution: string;
  rankingNote?: string;
  scoringAssumptions?: string[];
  confirmationQuestions?: string[];
};

export type WorkItemResumeFit = {
  score: number;
  level: ResumeFitLevel;
  reasons: string[];
  cautions: string[];
};

export type VersionRecord = {
  id: string;
  createdAt: string;
  before: string;
  after: string;
  rationale: string;
  diffText: string;
  tags: string[];
};

export type ResumeStatementEvaluation = {
  evaluatedAt: string;
  fitScore: number;
  factSafetyScore: number;
  specificityScore: number;
  jdMatchScore: number;
  distinctivenessScore: number;
  summary: string;
  riskWarnings: string[];
  improvementSuggestions: string[];
  recommendedStatus?: ResumeStatementStatus;
  recommendedText?: string;
};

export type ResumeStatement = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  workItemId: string;
  text: string;
  draftBaseline?: string;
  status: ResumeStatementStatus;
  evaluation?: ResumeStatementEvaluation;
  versions: VersionRecord[];
};

export type EssaySet = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  title: string;
  companyName: string;
  roleTitle: string;
  status: EssaySetStatus;
  deadline: string;
  jdKeywords: string;
  formatNotes: string;
  notes: string;
};

export type EssayQuestion = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  essaySetId: string;
  question: string;
  answer: string;
  targetLength: {
    min: number;
    max: number;
  };
  linkedWorkItemIds: string[];
  versions: VersionRecord[];
};

export type InterviewFollowUp = {
  id: string;
  parentId: string | null;
  anchor?: InterviewFollowUpAnchor;
  question: string;
  intent: string;
  answerDirection: string;
  myAnswer: string;
  exampleAnswer: string;
  riskWarnings: string[];
  tags: string[];
  children: InterviewFollowUp[];
};

export type InterviewFollowUpAnchor =
  | {
      type: "main-question";
      label?: string;
    }
  | {
      type: "answer-paragraph";
      paragraphIndex: number;
      label?: string;
      quote?: string;
    }
  | {
      type: "selected-text";
      paragraphIndex: number | null;
      label?: string;
      quote: string;
    };

export type InterviewQuestion = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  question: string;
  intent: string;
  answerDirection: string;
  myAnswer: string;
  exampleAnswer: string;
  linkedWorkItemIds: string[];
  understanding: InterviewUnderstanding;
  followUps: InterviewFollowUp[];
  versions: VersionRecord[];
};

export type PromptHistory = {
  id: string;
  cycleId: string | null;
  createdAt: string;
  templateType: string;
  targetId: string;
  prompt: string;
};

export type ResumePromptProfile = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  name: string;
  targetLength: string;
  tone: string;
  statementCount: string;
  emphasis: string;
  excludedExpressions: string;
  jdKeywords: string;
};

export type TransitionReasonCard = TimestampFields & {
  id: string;
  cycleIds: string[];
  source: EntitySource;
  tone: TransitionReasonTone;
  title: string;
  body: string;
  riskLevel: RiskLevel;
  riskWarnings: string[];
  jdKeywordNotes: string;
  versions: VersionRecord[];
};

export type PromptTemplate = TimestampFields & {
  id: string;
  source: EntitySource;
  templateType: string;
  title: string;
  description: string;
  body: string;
  requiredJsonShape: string;
};

export type AppSettings = TimestampFields & {
  id: "app-settings";
  activeCycleId: string;
  seedApplied: boolean;
};

export type CareerLabEntities = {
  careerCycles: CareerCycle[];
  workProjects: WorkProject[];
  workItems: WorkItem[];
  resumeStatements: ResumeStatement[];
  essaySets: EssaySet[];
  essayQuestions: EssayQuestion[];
  interviewQuestions: InterviewQuestion[];
  promptHistory: PromptHistory[];
  resumePromptProfiles: ResumePromptProfile[];
  transitionReasonCards: TransitionReasonCard[];
  promptTemplates: PromptTemplate[];
};

export type CareerLabExportBundle = {
  schemaVersion: typeof SCHEMA_VERSION;
  exportedAt: string;
  appName: "Career Lab";
  settings: Pick<AppSettings, "activeCycleId">;
  entities: CareerLabEntities;
};
