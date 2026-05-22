import type Dexie from "dexie";
import {
  formatWorkSystem,
  normalizeWorkSystem as normalizeSchemaWorkSystem
} from "./schema";

export const DATABASE_NAME = "career-lab";
export const DATABASE_VERSION = 9;
const DEFAULT_ESSAY_SET_ID = "essay-set-default";

const versionOneStores = {
  settings: "id",
  careerCycles: "id,status",
  workItems: "id,system,priority,riskLevel,source,*cycleIds",
  resumeBullets: "id,workItemId,status,positionMode,source,*cycleIds",
  essayQuestions: "id,source,*cycleIds,*linkedWorkItemIds",
  interviewQuestions: "id,understanding,source,*cycleIds,*linkedWorkItemIds",
  promptHistory: "id,cycleId,templateType,targetId,createdAt"
};

const versionTwoStores = {
  ...versionOneStores,
  transitionReasonCards: "id,tone,riskLevel,source,*cycleIds",
  weaknessTasks: "id,section,status,source,*cycleIds,*linkedWorkItemIds",
  factRecords: "id,kind,source,*cycleIds,*linkedWorkItemIds",
  claimRecords:
    "id,factRecordId,riskLevel,status,source,*cycleIds,*linkedWorkItemIds",
  promptTemplates: "id,templateType,source"
};

const versionThreeStores = {
  settings: "id",
  careerCycles: "id,status",
  workItems: "id,system,priority,riskLevel,source,*cycleIds",
  resumeStatements: "id,workItemId,status,positionMode,source,*cycleIds",
  essayQuestions: "id,source,*cycleIds,*linkedWorkItemIds",
  interviewQuestions: "id,understanding,source,*cycleIds,*linkedWorkItemIds",
  promptHistory: "id,cycleId,templateType,targetId,createdAt",
  transitionReasonCards: "id,tone,riskLevel,source,*cycleIds",
  weaknessTasks: "id,section,status,source,*cycleIds,*linkedWorkItemIds",
  factRecords: "id,kind,source,*cycleIds,*linkedWorkItemIds",
  claimRecords:
    "id,factRecordId,riskLevel,status,source,*cycleIds,*linkedWorkItemIds",
  promptTemplates: "id,templateType,source"
};

const versionFourStores = {
  ...versionThreeStores,
  resumePromptProfiles: "id,name,source,*cycleIds,updatedAt"
};

const versionFiveStores = versionFourStores;

const versionSixStores = {
  ...versionFiveStores,
  workProjects: "id,system,source,*cycleIds",
  workItems: "id,projectId,system,priority,riskLevel,source,*cycleIds"
};

const versionSevenStores = {
  ...versionSixStores,
  essaySets: "id,status,source,deadline,updatedAt,*cycleIds",
  essayQuestions: "id,essaySetId,source,*cycleIds,*linkedWorkItemIds"
};

const versionEightStores = {
  ...versionSevenStores,
  resumeStatements: "id,workItemId,status,source,*cycleIds",
  weaknessTasks: null,
  factRecords: null,
  claimRecords: null
};

const versionNineStores = {
  ...versionEightStores,
  workItems:
    "id,projectId,system,startedAt,endedAt,priority,riskLevel,source,*cycleIds"
};

export function configureSchema(db: Dexie) {
  db.version(1).stores(versionOneStores);
  db.version(2).stores(versionTwoStores);
  db.version(3)
    .stores({
      ...versionThreeStores,
      resumeBullets: null
    })
    .upgrade(async (transaction) => {
      const legacyStatements = await transaction.table("resumeBullets").toArray();

      if (legacyStatements.length > 0) {
        await transaction.table("resumeStatements").bulkPut(legacyStatements);
      }

      const workItems = await transaction.table("workItems").toArray();
      const normalizedWorkItems = workItems.map((item) => {
        if (!isRecord(item) || Array.isArray(item.resumeStatements)) {
          return item;
        }

        const { resumeBullets: legacyStatements, ...rest } = item;

        return {
          ...rest,
          resumeStatements: Array.isArray(legacyStatements)
            ? legacyStatements
            : []
        };
      });

      if (normalizedWorkItems.length > 0) {
        await transaction.table("workItems").bulkPut(normalizedWorkItems);
      }

      const promptHistory = await transaction.table("promptHistory").toArray();
      const normalizedPromptHistory = promptHistory.map((item) =>
        isRecord(item)
          ? {
              ...item,
              templateType: normalizeTemplateType(item.templateType)
            }
          : item
      );

      if (normalizedPromptHistory.length > 0) {
        await transaction.table("promptHistory").bulkPut(normalizedPromptHistory);
      }

      const promptTemplates = await transaction.table("promptTemplates").toArray();
      const normalizedPromptTemplates = promptTemplates.map((item) =>
        isRecord(item)
          ? {
              ...item,
              id: item.id,
              templateType: normalizeTemplateType(item.templateType)
            }
          : item
      );

      if (normalizedPromptTemplates.length > 0) {
        await transaction.table("promptTemplates").bulkPut(normalizedPromptTemplates);
        await transaction.table("promptTemplates").delete("prompt-resume-bullet-feedback");
      }
    });
  db.version(4).stores(versionFourStores);
  db.version(5)
    .stores(versionFiveStores)
    .upgrade(async (transaction) => {
      const statements = await transaction.table("resumeStatements").toArray();
      const normalizedStatements = statements.map((statement) =>
        isRecord(statement)
          ? {
              ...statement,
              status: normalizeResumeStatementStatus(statement.status)
            }
          : statement
      );

      if (normalizedStatements.length > 0) {
        await transaction.table("resumeStatements").bulkPut(normalizedStatements);
      }
    });
  db.version(6)
    .stores(versionSixStores)
    .upgrade(async (transaction) => {
      const workItems = await transaction.table("workItems").toArray();
      const projectsById = new Map<string, Record<string, unknown>>();
      const normalizedWorkItems = workItems.map((item) => {
        if (!isRecord(item)) {
          return item;
        }

        const system = normalizeWorkSystem(item.system);
        const projectId =
          typeof item.projectId === "string" && item.projectId.length > 0
            ? item.projectId
            : getLegacyProjectId(system);

        if (!projectsById.has(projectId)) {
          projectsById.set(projectId, createLegacyProject(system, item));
        }

        return {
          ...item,
          projectId,
          system
        };
      });

      if (projectsById.size > 0) {
        await transaction.table("workProjects").bulkPut([...projectsById.values()]);
      }

      if (normalizedWorkItems.length > 0) {
        await transaction.table("workItems").bulkPut(normalizedWorkItems);
      }
    });
  db.version(7)
    .stores(versionSevenStores)
    .upgrade(async (transaction) => {
      const essayQuestions = await transaction.table("essayQuestions").toArray();
      const normalizedQuestions = essayQuestions.map((question) =>
        isRecord(question)
          ? {
              ...question,
              essaySetId:
                typeof question.essaySetId === "string" &&
                question.essaySetId.length > 0
                  ? question.essaySetId
                  : DEFAULT_ESSAY_SET_ID
            }
          : question
      );
      const firstQuestion = normalizedQuestions.find(isRecord);
      const now =
        typeof firstQuestion?.updatedAt === "string"
          ? firstQuestion.updatedAt
          : new Date().toISOString();
      const cycleIds = Array.from(
        new Set(
          normalizedQuestions
            .filter(isRecord)
            .flatMap((question) =>
              Array.isArray(question.cycleIds)
                ? question.cycleIds.filter(
                    (id): id is string => typeof id === "string"
                  )
                : []
            )
        )
      );

      if (normalizedQuestions.length > 0) {
        await transaction.table("essayQuestions").bulkPut(normalizedQuestions);
      }

      await transaction.table("essaySets").put({
        id: DEFAULT_ESSAY_SET_ID,
        cycleIds,
        source: "seed",
        title: "기본 자기소개서 묶음",
        companyName: "",
        roleTitle: "",
        status: "drafting",
        deadline: "",
        jdKeywords: "",
        formatNotes: "",
        notes: "기존 자기소개서 문항에서 자동 생성된 묶음입니다.",
        createdAt: now,
        updatedAt: now
      });
    });
  db.version(8)
    .stores(versionEightStores)
    .upgrade(async (transaction) => {
      const settings = await transaction.table("settings").toArray();
      const normalizedSettings = settings.map((item) =>
        isRecord(item) ? omitKeys(item, ["positionMode"]) : item
      );

      if (normalizedSettings.length > 0) {
        await transaction.table("settings").bulkPut(normalizedSettings);
      }

      const statements = await transaction.table("resumeStatements").toArray();
      const normalizedStatements = statements.map((item) =>
        isRecord(item) ? omitKeys(item, ["positionMode"]) : item
      );

      if (normalizedStatements.length > 0) {
        await transaction.table("resumeStatements").bulkPut(normalizedStatements);
      }
    });
  db.version(DATABASE_VERSION).stores(versionNineStores);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function omitKeys(input: Record<string, unknown>, keys: string[]) {
  const copy = { ...input };

  for (const key of keys) {
    delete copy[key];
  }

  return copy;
}

function normalizeTemplateType(input: unknown) {
  if (input === "resume-bullet-feedback") {
    return "resume-bullet-feedback";
  }

  if (input === "resume-bullet-generation") {
    return "resume-statement-generation";
  }

  return input;
}

function normalizeResumeStatementStatus(input: unknown) {
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

function createLegacyProject(
  system: string,
  item: Record<string, unknown>
) {
  const now =
    typeof item.updatedAt === "string"
      ? item.updatedAt
      : new Date().toISOString();
  const cycleIds = Array.isArray(item.cycleIds)
    ? item.cycleIds.filter((id): id is string => typeof id === "string")
    : [];

  return {
    id: getLegacyProjectId(system),
    cycleIds,
    source: "seed",
    name: formatLegacyProjectName(system),
    system,
    periodNote: "",
    summary: "기존 업무 분류에서 생성된 프로젝트입니다.",
    createdAt: now,
    updatedAt: now
  };
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
