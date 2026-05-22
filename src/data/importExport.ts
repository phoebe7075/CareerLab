import {
  SCHEMA_VERSION,
  formatWorkSystem,
  normalizeWorkSystem as normalizeSchemaWorkSystem,
  type AppSettings,
  type CareerLabEntities,
  type CareerLabExportBundle,
  type ResumeStatementStatus
} from "./schema";

type EntityCollectionName = keyof CareerLabEntities;
const LEGACY_SCHEMA_VERSIONS = [2, 3, 4, 5, 6, 7, 8] as const;
const DEFAULT_ESSAY_SET_ID = "essay-set-default";

export type ImportIssueSeverity = "error" | "warning";

export type ImportPreviewIssue = {
  severity: ImportIssueSeverity;
  code: string;
  message: string;
  path?: string;
};

export type ImportPreview = {
  ok: boolean;
  bundle?: CareerLabExportBundle;
  issues: ImportPreviewIssue[];
  duplicateIds: Partial<Record<EntityCollectionName, string[]>>;
};

const entityCollectionNames = [
  "careerCycles",
  "workProjects",
  "workItems",
  "resumeStatements",
  "essaySets",
  "essayQuestions",
  "interviewQuestions",
  "promptHistory",
  "resumePromptProfiles",
  "transitionReasonCards",
  "promptTemplates"
] as const satisfies EntityCollectionName[];

export function createExportBundle(
  settings: Pick<AppSettings, "activeCycleId">,
  entities: CareerLabEntities,
  exportedAt = new Date().toISOString()
): CareerLabExportBundle {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    appName: "Career Lab",
    settings,
    entities
  };
}

export function parseJsonInput(input: string): unknown {
  const trimmed = input.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(withoutFence);
}

export function validateCareerLabExportBundle(
  input: unknown,
  existingEntities?: Partial<CareerLabEntities>
): ImportPreview {
  const issues: ImportPreviewIssue[] = [];
  const duplicateIds: ImportPreview["duplicateIds"] = {};

  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [
        {
          severity: "error",
          code: "invalid-root",
          message: "Import bundle must be a JSON object."
        }
      ],
      duplicateIds
    };
  }

  if (
    input.schemaVersion !== SCHEMA_VERSION &&
    !LEGACY_SCHEMA_VERSIONS.includes(
      input.schemaVersion as (typeof LEGACY_SCHEMA_VERSIONS)[number]
    )
  ) {
    issues.push({
      severity: "error",
      code: "schema-version",
      message: `Expected schemaVersion ${SCHEMA_VERSION}.`,
      path: "schemaVersion"
    });
  } else if (
    LEGACY_SCHEMA_VERSIONS.includes(
      input.schemaVersion as (typeof LEGACY_SCHEMA_VERSIONS)[number]
    )
  ) {
    issues.push({
      severity: "warning",
      code: "legacy-schema-version",
      message: `Import bundle will be upgraded from schemaVersion ${input.schemaVersion} to ${SCHEMA_VERSION}.`,
      path: "schemaVersion"
    });
  }

  if (input.appName !== "Career Lab") {
    issues.push({
      severity: "error",
      code: "app-name",
      message: "Import bundle appName must be Career Lab.",
      path: "appName"
    });
  }

  if (!isIsoLikeString(input.exportedAt)) {
    issues.push({
      severity: "error",
      code: "exported-at",
      message: "exportedAt must be a string.",
      path: "exportedAt"
    });
  }

  const settings = validateSettings(input.settings, issues);
  const entities = validateEntities(input.entities, issues, input.schemaVersion);

  if (entities) {
    for (const collectionName of entityCollectionNames) {
      const ids = collectIds(entities[collectionName]);
      const duplicateIdsInBundle = findDuplicates(ids);

      if (duplicateIdsInBundle.length > 0) {
        duplicateIds[collectionName] = duplicateIdsInBundle;
        issues.push({
          severity: "error",
          code: "duplicate-id",
          message: `${collectionName} contains duplicate ids.`,
          path: `entities.${collectionName}`
        });
      }

      const existingIds = existingEntities?.[collectionName]
        ? new Set(collectIds(existingEntities[collectionName]))
        : undefined;

      if (existingIds) {
        const duplicateExistingIds = ids.filter((id) => existingIds.has(id));
        if (duplicateExistingIds.length > 0) {
          issues.push({
            severity: "warning",
            code: "existing-id",
            message: `${collectionName} contains ids already present locally.`,
            path: `entities.${collectionName}`
          });
        }
      }
    }

    validateEntityReferences(entities, settings, issues);
  }

  const ok = issues.every((issue) => issue.severity !== "error");

  return {
    ok,
    bundle:
      ok && settings && entities
        ? {
            schemaVersion: SCHEMA_VERSION,
            exportedAt: input.exportedAt as string,
            appName: "Career Lab",
            settings,
            entities
          }
        : undefined,
    issues,
    duplicateIds
  };
}

function validateSettings(
  input: unknown,
  issues: ImportPreviewIssue[]
): Pick<AppSettings, "activeCycleId"> | undefined {
  if (!isRecord(input)) {
    issues.push({
      severity: "error",
      code: "settings",
      message: "settings must be an object.",
      path: "settings"
    });
    return undefined;
  }

  if (typeof input.activeCycleId !== "string" || input.activeCycleId.length === 0) {
    issues.push({
      severity: "error",
      code: "active-cycle-id",
      message: "settings.activeCycleId is required.",
      path: "settings.activeCycleId"
    });
  }

  if (issues.some((issue) => issue.path?.startsWith("settings"))) {
    return undefined;
  }

  return {
    activeCycleId: input.activeCycleId as string
  };
}

function validateEntities(
  input: unknown,
  issues: ImportPreviewIssue[],
  schemaVersion: unknown
): CareerLabEntities | undefined {
  if (!isRecord(input)) {
    issues.push({
      severity: "error",
      code: "entities",
      message: "entities must be an object.",
      path: "entities"
    });
    return undefined;
  }

  const careerCycles = readEntityCollection(input, "careerCycles", issues);
  const workItems = readEntityCollection(input, "workItems", issues).map(
    normalizeWorkItem
  );
  const workProjects = readWorkProjectCollection(
    input,
    workItems,
    issues,
    schemaVersion
  );
  const resumeStatements = readResumeStatementCollection(input, issues);
  const essayQuestions = readEntityCollection(input, "essayQuestions", issues).map(
    normalizeEssayQuestion
  );
  const essaySets = readEssaySetCollection(
    input,
    essayQuestions,
    issues,
    schemaVersion
  );
  const interviewQuestions = readEntityCollection(
    input,
    "interviewQuestions",
    issues
  );
  const promptHistory = readEntityCollection(input, "promptHistory", issues);
  const resumePromptProfiles = readResumePromptProfileCollection(
    input,
    issues,
    schemaVersion
  );
  const transitionReasonCards = readEntityCollection(
    input,
    "transitionReasonCards",
    issues
  );
  const promptTemplates = readEntityCollection(input, "promptTemplates", issues);

  if (issues.some((issue) => issue.path?.startsWith("entities"))) {
    return undefined;
  }

  return {
    careerCycles: careerCycles as CareerLabEntities["careerCycles"],
    workProjects: workProjects as CareerLabEntities["workProjects"],
    workItems: workItems as CareerLabEntities["workItems"],
    resumeStatements: resumeStatements.map(normalizeResumeStatement) as CareerLabEntities["resumeStatements"],
    essaySets: essaySets as CareerLabEntities["essaySets"],
    essayQuestions: essayQuestions as CareerLabEntities["essayQuestions"],
    interviewQuestions:
      interviewQuestions as CareerLabEntities["interviewQuestions"],
    promptHistory: promptHistory as CareerLabEntities["promptHistory"],
    resumePromptProfiles:
      resumePromptProfiles as CareerLabEntities["resumePromptProfiles"],
    transitionReasonCards:
      transitionReasonCards as CareerLabEntities["transitionReasonCards"],
    promptTemplates: promptTemplates as CareerLabEntities["promptTemplates"]
  };
}

function readEssaySetCollection(
  input: Record<string, unknown>,
  essayQuestions: unknown[],
  issues: ImportPreviewIssue[],
  schemaVersion: unknown
) {
  if (Array.isArray(input.essaySets)) {
    return readEntityCollection(input, "essaySets", issues);
  }

  if (
    LEGACY_SCHEMA_VERSIONS.includes(
      schemaVersion as (typeof LEGACY_SCHEMA_VERSIONS)[number]
    )
  ) {
    return [deriveLegacyEssaySet(essayQuestions)];
  }

  issues.push({
    severity: "error",
    code: "entity-collection",
    message: "entities.essaySets must be an array.",
    path: "entities.essaySets"
  });

  return [];
}

function readWorkProjectCollection(
  input: Record<string, unknown>,
  workItems: unknown[],
  issues: ImportPreviewIssue[],
  schemaVersion: unknown
) {
  if (Array.isArray(input.workProjects)) {
    return readEntityCollection(input, "workProjects", issues);
  }

  if (
    LEGACY_SCHEMA_VERSIONS.includes(
      schemaVersion as (typeof LEGACY_SCHEMA_VERSIONS)[number]
    )
  ) {
    return deriveLegacyWorkProjects(workItems);
  }

  issues.push({
    severity: "error",
    code: "entity-collection",
    message: "entities.workProjects must be an array.",
    path: "entities.workProjects"
  });

  return [];
}

function readResumePromptProfileCollection(
  input: Record<string, unknown>,
  issues: ImportPreviewIssue[],
  schemaVersion: unknown
) {
  if (Array.isArray(input.resumePromptProfiles)) {
    return readEntityCollection(input, "resumePromptProfiles", issues);
  }

  if (
    LEGACY_SCHEMA_VERSIONS.includes(
      schemaVersion as (typeof LEGACY_SCHEMA_VERSIONS)[number]
    )
  ) {
    return [];
  }

  issues.push({
    severity: "error",
    code: "entity-collection",
    message: "entities.resumePromptProfiles must be an array.",
    path: "entities.resumePromptProfiles"
  });

  return [];
}

function readResumeStatementCollection(
  input: Record<string, unknown>,
  issues: ImportPreviewIssue[]
) {
  if (Array.isArray(input.resumeStatements)) {
    return readEntityCollection(input, "resumeStatements", issues);
  }

  if (Array.isArray(input.resumeBullets)) {
    return readEntityCollectionByPath(input, "resumeBullets", issues);
  }

  issues.push({
    severity: "error",
    code: "entity-collection",
    message: "entities.resumeStatements must be an array.",
    path: "entities.resumeStatements"
  });

  return [];
}

function normalizeResumeStatement(input: unknown) {
  if (!isRecord(input)) {
    return input;
  }

  return {
    ...input,
    status: normalizeResumeStatementStatus(input.status)
  };
}

function normalizeEssayQuestion(input: unknown) {
  if (!isRecord(input)) {
    return input;
  }

  return {
    ...input,
    essaySetId:
      typeof input.essaySetId === "string" && input.essaySetId.length > 0
        ? input.essaySetId
        : DEFAULT_ESSAY_SET_ID
  };
}

function normalizeResumeStatementStatus(input: unknown): ResumeStatementStatus {
  if (input === "draft") {
    return "candidate";
  }

  if (input === "reviewing") {
    return "needs-review";
  }

  if (
    input === "candidate" ||
    input === "needs-review" ||
    input === "editing" ||
    input === "usable" ||
    input === "final"
  ) {
    return input;
  }

  return "candidate";
}

function readEntityCollection(
  input: Record<string, unknown>,
  collectionName: EntityCollectionName,
  issues: ImportPreviewIssue[]
) {
  return readEntityCollectionByPath(input, collectionName, issues);
}

function readEntityCollectionByPath(
  input: Record<string, unknown>,
  collectionName: EntityCollectionName | "resumeBullets",
  issues: ImportPreviewIssue[]
) {
  const value = input[collectionName];

  if (!Array.isArray(value)) {
    issues.push({
      severity: "error",
      code: "entity-collection",
      message: `entities.${collectionName} must be an array.`,
      path: `entities.${collectionName}`
    });
    return [];
  }

  const invalidIndex = value.findIndex((item) => !hasStringId(item));
  if (invalidIndex >= 0) {
    issues.push({
      severity: "error",
      code: "entity-id",
      message: `entities.${collectionName} items must include string id.`,
      path: `entities.${collectionName}.${invalidIndex}.id`
    });
  }

  return value;
}

function normalizeWorkItem(input: unknown) {
  if (!isRecord(input)) {
    return input;
  }

  const { resumeBullets: legacyStatements, ...rest } = input;
  const system = normalizeWorkSystem(input.system);
  const projectId =
    typeof input.projectId === "string" && input.projectId.length > 0
      ? input.projectId
      : getLegacyProjectId(system);

  return {
    ...rest,
    projectId,
    system,
    resumeStatements: Array.isArray(input.resumeStatements)
      ? input.resumeStatements
      : Array.isArray(legacyStatements)
        ? legacyStatements
        : []
  };
}

function deriveLegacyWorkProjects(workItems: unknown[]) {
  const projectsById = new Map<string, Record<string, unknown>>();

  for (const item of workItems) {
    if (!isRecord(item)) {
      continue;
    }

    const system = normalizeWorkSystem(item.system);
    const projectId =
      typeof item.projectId === "string" && item.projectId.length > 0
        ? item.projectId
        : getLegacyProjectId(system);

    if (projectsById.has(projectId)) {
      continue;
    }

    const now =
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : new Date().toISOString();
    const cycleIds = Array.isArray(item.cycleIds)
      ? item.cycleIds.filter((id): id is string => typeof id === "string")
      : [];

    projectsById.set(projectId, {
      id: projectId,
      cycleIds,
      source: "import",
      name: formatLegacyProjectName(system),
      system,
      periodNote: "",
      summary: "Legacy import에서 업무 분류 기준으로 생성된 프로젝트입니다.",
      createdAt: now,
      updatedAt: now
    });
  }

  return [...projectsById.values()];
}

function deriveLegacyEssaySet(essayQuestions: unknown[]) {
  const firstQuestion = essayQuestions.find(isRecord);
  const now =
    typeof firstQuestion?.updatedAt === "string"
      ? firstQuestion.updatedAt
      : new Date().toISOString();
  const cycleIds = Array.from(
    new Set(
      essayQuestions
        .filter(isRecord)
        .flatMap((question) =>
          Array.isArray(question.cycleIds)
            ? question.cycleIds.filter((id): id is string => typeof id === "string")
            : []
        )
    )
  );

  return {
    id: DEFAULT_ESSAY_SET_ID,
    cycleIds,
    source: "import",
    title: "기본 자기소개서 묶음",
    companyName: "",
    roleTitle: "",
    status: "drafting",
    deadline: "",
    jdKeywords: "",
    formatNotes: "",
    notes: "Legacy import에서 기존 자기소개서 문항 기준으로 생성된 묶음입니다.",
    createdAt: now,
    updatedAt: now
  };
}

function normalizeWorkSystem(input: unknown) {
  return normalizeSchemaWorkSystem(input);
}

function getLegacyProjectId(system: string) {
  const legacyProjectIds: Record<string, string> = {
    COMMON: "project-common-operations",
    ECMS: "project-nh-ecms",
    IPS: "project-nh-ips"
  };

  return legacyProjectIds[system] ?? `project-${slugify(system) || "common"}`;
}

function formatLegacyProjectName(system: string) {
  return formatWorkSystem(system);
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateEntityReferences(
  entities: CareerLabEntities,
  settings: Pick<AppSettings, "activeCycleId"> | undefined,
  issues: ImportPreviewIssue[]
) {
  const cycleIds = new Set(entities.careerCycles.map((cycle) => cycle.id));
  const workProjectIds = new Set(
    entities.workProjects.map((project) => project.id)
  );
  const essaySetIds = new Set(entities.essaySets.map((set) => set.id));
  const workItemIds = new Set(entities.workItems.map((workItem) => workItem.id));

  if (settings && !cycleIds.has(settings.activeCycleId)) {
    issues.push({
      severity: "error",
      code: "missing-active-cycle",
      message: "settings.activeCycleId does not exist in careerCycles.",
      path: "settings.activeCycleId"
    });
  }

  for (const [index, statement] of entities.resumeStatements.entries()) {
    validateCycleIds(
      statement.cycleIds,
      cycleIds,
      issues,
      `entities.resumeStatements.${index}.cycleIds`
    );
    if (!workItemIds.has(statement.workItemId)) {
      issues.push({
        severity: "error",
        code: "missing-work-item",
        message: "Resume statement references a missing work item.",
        path: `entities.resumeStatements.${index}.workItemId`
      });
    }
  }

  for (const [index, essay] of entities.essayQuestions.entries()) {
    validateCycleIds(
      essay.cycleIds,
      cycleIds,
      issues,
      `entities.essayQuestions.${index}.cycleIds`
    );
    if (!essaySetIds.has(essay.essaySetId)) {
      issues.push({
        severity: "error",
        code: "missing-essay-set",
        message: "Essay question references a missing essay set.",
        path: `entities.essayQuestions.${index}.essaySetId`
      });
    }
    validateWorkItemIds(
      essay.linkedWorkItemIds,
      workItemIds,
      issues,
      `entities.essayQuestions.${index}.linkedWorkItemIds`
    );
  }

  for (const [index, question] of entities.interviewQuestions.entries()) {
    validateCycleIds(
      question.cycleIds,
      cycleIds,
      issues,
      `entities.interviewQuestions.${index}.cycleIds`
    );
    validateWorkItemIds(
      question.linkedWorkItemIds,
      workItemIds,
      issues,
      `entities.interviewQuestions.${index}.linkedWorkItemIds`
    );
  }

  for (const [index, project] of entities.workProjects.entries()) {
    validateCycleIds(
      project.cycleIds,
      cycleIds,
      issues,
      `entities.workProjects.${index}.cycleIds`
    );
  }

  for (const [index, set] of entities.essaySets.entries()) {
    validateCycleIds(
      set.cycleIds,
      cycleIds,
      issues,
      `entities.essaySets.${index}.cycleIds`
    );
  }

  for (const [index, workItem] of entities.workItems.entries()) {
    validateCycleIds(
      workItem.cycleIds,
      cycleIds,
      issues,
      `entities.workItems.${index}.cycleIds`
    );
    if (!workProjectIds.has(workItem.projectId)) {
      issues.push({
        severity: "error",
        code: "missing-work-project",
        message: "Work item references a missing work project.",
        path: `entities.workItems.${index}.projectId`
      });
    }
  }

  for (const [index, profile] of entities.resumePromptProfiles.entries()) {
    validateCycleIds(
      profile.cycleIds,
      cycleIds,
      issues,
      `entities.resumePromptProfiles.${index}.cycleIds`
    );
  }

  for (const [index, card] of entities.transitionReasonCards.entries()) {
    validateCycleIds(
      card.cycleIds,
      cycleIds,
      issues,
      `entities.transitionReasonCards.${index}.cycleIds`
    );
  }

}

function validateCycleIds(
  ids: string[],
  validIds: Set<string>,
  issues: ImportPreviewIssue[],
  path: string
) {
  for (const id of ids) {
    if (!validIds.has(id)) {
      issues.push({
        severity: "error",
        code: "missing-cycle",
        message: "Entity references a missing career cycle.",
        path
      });
    }
  }
}

function validateWorkItemIds(
  ids: string[],
  validIds: Set<string>,
  issues: ImportPreviewIssue[],
  path: string
) {
  for (const id of ids) {
    if (!validIds.has(id)) {
      issues.push({
        severity: "error",
        code: "missing-work-item",
        message: "Entity references a missing work item.",
        path
      });
    }
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isIsoLikeString(input: unknown): input is string {
  return typeof input === "string" && input.length > 0;
}

function hasStringId(input: unknown): input is { id: string } {
  return isRecord(input) && typeof input.id === "string" && input.id.length > 0;
}

function collectIds(items: Array<{ id: string }>) {
  return items.map((item) => item.id);
}

function findDuplicates(ids: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }

  return [...duplicates];
}
