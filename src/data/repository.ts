import { careerLabDb, type CareerLabDatabase } from "./db";
import {
  createExportBundle,
  parseJsonInput,
  validateCareerLabExportBundle,
  type ImportPreview
} from "./importExport";
import { runtimeSeedData } from "#career-lab-seed-data";
import type { CareerLabSeedData } from "./seed/seedData";
import type {
  AppSettings,
  CareerCycle,
  CareerLabEntities,
  CareerLabExportBundle,
  EssaySet,
  EssayQuestion,
  InterviewQuestion,
  PromptHistory,
  PromptTemplate,
  ResumePromptProfile,
  ResumeStatement,
  TransitionReasonCard,
  WorkItem,
  WorkProject
} from "./schema";

export class CareerLabRepository {
  constructor(
    private readonly db: CareerLabDatabase = careerLabDb,
    private readonly seedData: CareerLabSeedData = runtimeSeedData
  ) {}

  async ensureSeedData() {
    const settings = await this.db.settings.get("app-settings");

    if (!settings?.seedApplied) {
      await this.resetToSeed();
    }

    await this.ensureSupplementalSeedData();
  }

  async resetToSeed() {
    const { entities, settings } = this.seedData;

    await this.db.transaction(
      "rw",
      [
        this.db.settings,
        this.db.careerCycles,
        this.db.workProjects,
        this.db.workItems,
        this.db.resumeStatements,
        this.db.essaySets,
        this.db.essayQuestions,
        this.db.interviewQuestions,
        this.db.promptHistory,
        this.db.resumePromptProfiles,
        this.db.transitionReasonCards,
        this.db.promptTemplates
      ],
      async () => {
        await this.clearAllTables();
        await this.db.settings.add(settings);
        await this.db.careerCycles.bulkAdd(entities.careerCycles);
        await this.db.workProjects.bulkAdd(entities.workProjects);
        await this.db.workItems.bulkAdd(entities.workItems);
        await this.db.resumeStatements.bulkAdd(entities.resumeStatements);
        await this.db.essaySets.bulkAdd(entities.essaySets);
        await this.db.essayQuestions.bulkAdd(entities.essayQuestions);
        await this.db.interviewQuestions.bulkAdd(entities.interviewQuestions);
        await this.db.promptHistory.bulkAdd(entities.promptHistory);
        await this.db.resumePromptProfiles.bulkAdd(entities.resumePromptProfiles);
        await this.db.transitionReasonCards.bulkAdd(entities.transitionReasonCards);
        await this.db.promptTemplates.bulkAdd(entities.promptTemplates);
      }
    );
  }

  async getSettings() {
    return this.db.settings.get("app-settings");
  }

  async updateSettings(settings: AppSettings) {
    await this.db.settings.put(settings);
  }

  async listCareerCycles() {
    return this.db.careerCycles.toArray();
  }

  async saveCareerCycle(cycle: CareerCycle) {
    await this.db.careerCycles.put(cycle);
  }

  async listWorkProjects() {
    return this.db.workProjects.toArray();
  }

  async saveWorkProject(project: WorkProject) {
    await this.db.workProjects.put(project);
  }

  async deleteWorkProject(id: string) {
    await this.db.workProjects.delete(id);
  }

  async listWorkItems() {
    return this.db.workItems.toArray();
  }

  async getWorkItem(id: string) {
    return this.db.workItems.get(id);
  }

  async saveWorkItem(workItem: WorkItem) {
    await this.db.workItems.put(workItem);
  }

  async saveWorkProjectsAndItems(projects: WorkProject[], workItems: WorkItem[]) {
    await this.db.transaction(
      "rw",
      [this.db.workProjects, this.db.workItems],
      async () => {
        if (projects.length > 0) {
          await this.db.workProjects.bulkPut(projects);
        }

        if (workItems.length > 0) {
          await this.db.workItems.bulkPut(workItems);
        }
      }
    );
  }

  async deleteWorkItem(id: string) {
    await this.db.workItems.delete(id);
  }

  async deleteWorkItemWithResumeStatements(id: string) {
    return this.db.transaction(
      "rw",
      [this.db.workItems, this.db.resumeStatements],
      async () => {
        const workItem = await this.db.workItems.get(id);

        if (!workItem) {
          return { deleted: false, deletedResumeStatementCount: 0 };
        }

        const deletedResumeStatementCount = await this.db.resumeStatements
          .where("workItemId")
          .equals(id)
          .delete();
        await this.db.workItems.delete(id);

        return { deleted: true, deletedResumeStatementCount };
      }
    );
  }

  async listResumeStatements() {
    return this.db.resumeStatements.toArray();
  }

  async getResumeStatement(id: string) {
    return this.db.resumeStatements.get(id);
  }

  async saveResumeStatement(statement: ResumeStatement) {
    await this.db.resumeStatements.put(statement);
  }

  async deleteResumeStatement(id: string) {
    await this.db.resumeStatements.delete(id);
  }

  async listEssayQuestions() {
    return this.db.essayQuestions.toArray();
  }

  async listEssaySets() {
    return this.db.essaySets.toArray();
  }

  async getEssaySet(id: string) {
    return this.db.essaySets.get(id);
  }

  async saveEssaySet(set: EssaySet) {
    await this.db.essaySets.put(set);
  }

  async deleteEssaySetWithQuestions(id: string) {
    return this.db.transaction(
      "rw",
      [this.db.essaySets, this.db.essayQuestions],
      async () => {
        const essaySet = await this.db.essaySets.get(id);

        if (!essaySet) {
          return { deleted: false, deletedQuestionCount: 0 };
        }

        const deletedQuestionCount = await this.db.essayQuestions
          .where("essaySetId")
          .equals(id)
          .delete();
        await this.db.essaySets.delete(id);

        return { deleted: true, deletedQuestionCount };
      }
    );
  }

  async getEssayQuestion(id: string) {
    return this.db.essayQuestions.get(id);
  }

  async saveEssayQuestion(question: EssayQuestion) {
    await this.db.essayQuestions.put(question);
  }

  async deleteEssayQuestion(id: string) {
    await this.db.essayQuestions.delete(id);
  }

  async listInterviewQuestions() {
    return this.db.interviewQuestions.toArray();
  }

  async getInterviewQuestion(id: string) {
    return this.db.interviewQuestions.get(id);
  }

  async saveInterviewQuestion(question: InterviewQuestion) {
    await this.db.interviewQuestions.put(question);
  }

  async deleteInterviewQuestion(id: string) {
    await this.db.interviewQuestions.delete(id);
  }

  async listPromptHistory() {
    return this.db.promptHistory.toArray();
  }

  async savePromptHistory(prompt: PromptHistory) {
    await this.db.promptHistory.put(prompt);
  }

  async listResumePromptProfiles() {
    return this.db.resumePromptProfiles.toArray();
  }

  async saveResumePromptProfile(profile: ResumePromptProfile) {
    await this.db.resumePromptProfiles.put(profile);
  }

  async deleteResumePromptProfile(id: string) {
    await this.db.resumePromptProfiles.delete(id);
  }

  async listTransitionReasonCards() {
    return this.db.transitionReasonCards.toArray();
  }

  async getTransitionReasonCard(id: string) {
    return this.db.transitionReasonCards.get(id);
  }

  async saveTransitionReasonCard(card: TransitionReasonCard) {
    await this.db.transitionReasonCards.put(card);
  }

  async deleteTransitionReasonCard(id: string) {
    await this.db.transitionReasonCards.delete(id);
  }

  async listPromptTemplates() {
    return this.db.promptTemplates.toArray();
  }

  async getPromptTemplate(id: string) {
    return this.db.promptTemplates.get(id);
  }

  async savePromptTemplate(template: PromptTemplate) {
    await this.db.promptTemplates.put(template);
  }

  async deletePromptTemplate(id: string) {
    await this.db.promptTemplates.delete(id);
  }

  async exportAllData(exportedAt?: string): Promise<CareerLabExportBundle> {
    const settings = await this.db.settings.get("app-settings");
    const entities = await this.getAllEntities();

    return createExportBundle(
      {
        activeCycleId: settings?.activeCycleId ?? this.seedData.settings.activeCycleId
      },
      entities,
      exportedAt
    );
  }

  async exportActiveCycleData(exportedAt?: string): Promise<CareerLabExportBundle> {
    const settings = await this.db.settings.get("app-settings");
    const activeCycleId =
      settings?.activeCycleId ?? this.seedData.settings.activeCycleId;
    const entities = filterEntitiesForCycle(await this.getAllEntities(), activeCycleId);

    return createExportBundle(
      {
        activeCycleId
      },
      entities,
      exportedAt
    );
  }

  async previewImport(input: string | unknown): Promise<ImportPreview> {
    try {
      const parsed = typeof input === "string" ? parseJsonInput(input) : input;
      return validateCareerLabExportBundle(parsed, await this.getAllEntities());
    } catch (error) {
      return {
        ok: false,
        issues: [
          {
            severity: "error",
            code: "json-parse",
            message:
              error instanceof Error ? error.message : "Invalid JSON input."
          }
        ],
        duplicateIds: {}
      };
    }
  }

  async replaceWithImportBundle(bundle: CareerLabExportBundle) {
    const preview = validateCareerLabExportBundle(bundle);

    if (!preview.ok || !preview.bundle) {
      throw new Error("Import bundle validation failed.");
    }

    const validatedBundle = preview.bundle;
    const importedSettings: AppSettings = {
      id: "app-settings",
      activeCycleId: validatedBundle.settings.activeCycleId,
      seedApplied: false,
      createdAt: validatedBundle.exportedAt,
      updatedAt: new Date().toISOString()
    };

    await this.db.transaction(
      "rw",
      [
        this.db.settings,
        this.db.careerCycles,
        this.db.workProjects,
        this.db.workItems,
        this.db.resumeStatements,
        this.db.essaySets,
        this.db.essayQuestions,
        this.db.interviewQuestions,
        this.db.promptHistory,
        this.db.resumePromptProfiles,
        this.db.transitionReasonCards,
        this.db.promptTemplates
      ],
      async () => {
        await this.clearAllTables();
        await this.db.settings.add(importedSettings);
        await this.db.careerCycles.bulkAdd(validatedBundle.entities.careerCycles);
        await this.db.workProjects.bulkAdd(validatedBundle.entities.workProjects);
        await this.db.workItems.bulkAdd(validatedBundle.entities.workItems);
        await this.db.resumeStatements.bulkAdd(validatedBundle.entities.resumeStatements);
        await this.db.essaySets.bulkAdd(validatedBundle.entities.essaySets);
        await this.db.essayQuestions.bulkAdd(
          validatedBundle.entities.essayQuestions
        );
        await this.db.interviewQuestions.bulkAdd(
          validatedBundle.entities.interviewQuestions
        );
        await this.db.promptHistory.bulkAdd(validatedBundle.entities.promptHistory);
        await this.db.resumePromptProfiles.bulkAdd(
          validatedBundle.entities.resumePromptProfiles
        );
        await this.db.transitionReasonCards.bulkAdd(
          validatedBundle.entities.transitionReasonCards
        );
        await this.db.promptTemplates.bulkAdd(
          validatedBundle.entities.promptTemplates
        );
      }
    );
  }

  async mergeCycleImportBundle(bundle: CareerLabExportBundle) {
    const preview = validateCareerLabExportBundle(bundle);

    if (!preview.ok || !preview.bundle) {
      throw new Error("Cycle import bundle validation failed.");
    }

    const validatedBundle = preview.bundle;
    const importedSettings: AppSettings = {
      id: "app-settings",
      activeCycleId: validatedBundle.settings.activeCycleId,
      seedApplied: false,
      createdAt: validatedBundle.exportedAt,
      updatedAt: new Date().toISOString()
    };

    await this.db.transaction(
      "rw",
      [
        this.db.settings,
        this.db.careerCycles,
        this.db.workProjects,
        this.db.workItems,
        this.db.resumeStatements,
        this.db.essaySets,
        this.db.essayQuestions,
        this.db.interviewQuestions,
        this.db.promptHistory,
        this.db.resumePromptProfiles,
        this.db.transitionReasonCards,
        this.db.promptTemplates
      ],
      async () => {
        await this.db.settings.put(importedSettings);
        await this.db.careerCycles.bulkPut(validatedBundle.entities.careerCycles);
        await this.db.workProjects.bulkPut(validatedBundle.entities.workProjects);
        await this.db.workItems.bulkPut(validatedBundle.entities.workItems);
        await this.db.resumeStatements.bulkPut(validatedBundle.entities.resumeStatements);
        await this.db.essaySets.bulkPut(validatedBundle.entities.essaySets);
        await this.db.essayQuestions.bulkPut(
          validatedBundle.entities.essayQuestions
        );
        await this.db.interviewQuestions.bulkPut(
          validatedBundle.entities.interviewQuestions
        );
        await this.db.promptHistory.bulkPut(validatedBundle.entities.promptHistory);
        await this.db.resumePromptProfiles.bulkPut(
          validatedBundle.entities.resumePromptProfiles
        );
        await this.db.transitionReasonCards.bulkPut(
          validatedBundle.entities.transitionReasonCards
        );
        await this.db.promptTemplates.bulkPut(
          validatedBundle.entities.promptTemplates
        );
      }
    );
  }

  async getAllEntities(): Promise<CareerLabEntities> {
    const [
      careerCycles,
      workProjects,
      workItems,
      resumeStatements,
      essaySets,
      essayQuestions,
      interviewQuestions,
      promptHistory,
      resumePromptProfiles,
      transitionReasonCards,
      promptTemplates
    ] = await Promise.all([
      this.db.careerCycles.toArray(),
      this.db.workProjects.toArray(),
      this.db.workItems.toArray(),
      this.db.resumeStatements.toArray(),
      this.db.essaySets.toArray(),
      this.db.essayQuestions.toArray(),
      this.db.interviewQuestions.toArray(),
      this.db.promptHistory.toArray(),
      this.db.resumePromptProfiles.toArray(),
      this.db.transitionReasonCards.toArray(),
      this.db.promptTemplates.toArray()
    ]);

    return {
      careerCycles,
      workProjects,
      workItems,
      resumeStatements,
      essaySets,
      essayQuestions,
      interviewQuestions,
      promptHistory,
      resumePromptProfiles,
      transitionReasonCards,
      promptTemplates
    };
  }

  async clearAllData() {
    await this.db.transaction(
      "rw",
      [
        this.db.settings,
        this.db.careerCycles,
        this.db.workProjects,
        this.db.workItems,
        this.db.resumeStatements,
        this.db.essaySets,
        this.db.essayQuestions,
        this.db.interviewQuestions,
        this.db.promptHistory,
        this.db.resumePromptProfiles,
        this.db.transitionReasonCards,
        this.db.promptTemplates
      ],
      async () => {
        await this.clearAllTables();
      }
    );
  }

  private async clearAllTables() {
    await Promise.all([
      this.db.settings.clear(),
      this.db.careerCycles.clear(),
      this.db.workProjects.clear(),
      this.db.workItems.clear(),
      this.db.resumeStatements.clear(),
      this.db.essaySets.clear(),
      this.db.essayQuestions.clear(),
      this.db.interviewQuestions.clear(),
      this.db.promptHistory.clear(),
      this.db.resumePromptProfiles.clear(),
      this.db.transitionReasonCards.clear(),
      this.db.promptTemplates.clear()
    ]);
  }

  private async ensureSupplementalSeedData() {
    const { entities } = this.seedData;

    await this.db.transaction(
      "rw",
      [
        this.db.workProjects,
        this.db.workItems,
        this.db.resumeStatements,
        this.db.essaySets,
        this.db.essayQuestions,
        this.db.interviewQuestions,
        this.db.promptHistory,
        this.db.resumePromptProfiles,
        this.db.transitionReasonCards,
        this.db.promptTemplates
      ],
      async () => {
        await addSeedsIfEmpty(this.db.workProjects, entities.workProjects);
        await syncSeedWorkProjects(this.db.workProjects, entities.workProjects);
        await syncSeedWorkItemSystemLabels(
          this.db.workItems,
          entities.workItems,
          this.seedData.normalizeLegacyPeriodNote
        );
        await syncSeedResumeStatements(
          this.db.resumeStatements,
          entities.resumeStatements
        );
        await addSeedsIfEmpty(this.db.essaySets, entities.essaySets);
        await syncSeedEssayQuestions(this.db.essayQuestions, entities.essayQuestions);
        await syncSeedInterviewQuestions(
          this.db.interviewQuestions,
          entities.interviewQuestions,
          this.seedData.legacyInterviewAnswers
        );
        await addSeedsIfEmpty(this.db.promptHistory, entities.promptHistory);
        await addSeedsIfEmpty(
          this.db.resumePromptProfiles,
          entities.resumePromptProfiles
        );
        await migrateSeedTransitionReasonCardsToInterviewQuestions(
          this.db.interviewQuestions,
          this.db.transitionReasonCards,
          entities.interviewQuestions
        );
        await syncSeedTransitionReasonCards(
          this.db.transitionReasonCards,
          entities.transitionReasonCards
        );
        await addSeedsIfEmpty(this.db.promptTemplates, entities.promptTemplates);
        await syncSeedPromptTemplates(this.db.promptTemplates, entities.promptTemplates);
      }
    );
  }
}

export const careerLabRepository = new CareerLabRepository();

export function createSeedSnapshot(
  seedData: CareerLabSeedData = runtimeSeedData
): CareerLabEntities {
  return structuredClone(seedData.entities);
}

function filterEntitiesForCycle(
  entities: CareerLabEntities,
  cycleId: string
): CareerLabEntities {
  return {
    careerCycles: entities.careerCycles.filter((cycle) => cycle.id === cycleId),
    workProjects: entities.workProjects.filter((project) =>
      project.cycleIds.includes(cycleId)
    ),
    workItems: entities.workItems.filter((item) =>
      item.cycleIds.includes(cycleId)
    ),
    resumeStatements: entities.resumeStatements.filter((statement) =>
      statement.cycleIds.includes(cycleId)
    ),
    essaySets: entities.essaySets.filter((set) => set.cycleIds.includes(cycleId)),
    essayQuestions: entities.essayQuestions.filter((question) =>
      question.cycleIds.includes(cycleId)
    ),
    interviewQuestions: entities.interviewQuestions.filter((question) =>
      question.cycleIds.includes(cycleId)
    ),
    promptHistory: entities.promptHistory.filter(
      (history) => history.cycleId === cycleId
    ),
    resumePromptProfiles: entities.resumePromptProfiles.filter((profile) =>
      profile.cycleIds.includes(cycleId)
    ),
    transitionReasonCards: entities.transitionReasonCards.filter((card) =>
      card.cycleIds.includes(cycleId)
    ),
    promptTemplates: entities.promptTemplates
  };
}

async function addSeedsIfEmpty<T extends { id: string }>(
  table: { count: () => Promise<number>; bulkAdd: (items: T[]) => Promise<unknown> },
  items: T[]
) {
  if (items.length === 0 || (await table.count()) > 0) {
    return;
  }

  await table.bulkAdd(items);
}

async function syncSeedWorkProjects(table: {
  get: (id: string) => Promise<WorkProject | undefined>;
  put: (item: WorkProject) => Promise<unknown>;
}, seedWorkProjects: WorkProject[]) {
  for (const seed of seedWorkProjects) {
    const current = await table.get(seed.id);

    if (!current || current.source !== "seed") {
      continue;
    }

    if (
      current.contextType !== seed.contextType ||
      current.organizationName !== seed.organizationName ||
      current.startedAt !== seed.startedAt ||
      current.endedAt !== seed.endedAt
    ) {
      await table.put({
        ...current,
        contextType: seed.contextType,
        endedAt: seed.endedAt,
        organizationName: seed.organizationName,
        startedAt: seed.startedAt,
        updatedAt: seed.updatedAt
      });
    }
  }
}

async function syncSeedEssayQuestions(table: {
  get: (id: string) => Promise<EssayQuestion | undefined>;
  put: (item: EssayQuestion) => Promise<unknown>;
}, seedEssayQuestions: EssayQuestion[]) {
  for (const seed of seedEssayQuestions) {
    const current = await table.get(seed.id);

    if (!current || current.source !== "seed") {
      continue;
    }

    const missingSetId = !current.essaySetId;
    const missingVersions = current.versions.length === 0;

    if (missingSetId || missingVersions) {
      await table.put({
        ...current,
        essaySetId: current.essaySetId || seed.essaySetId,
        versions: missingVersions ? seed.versions : current.versions,
        updatedAt: current.updatedAt
      });
    }
  }
}

async function syncSeedInterviewQuestions(table: {
  get: (id: string) => Promise<InterviewQuestion | undefined>;
  put: (item: InterviewQuestion) => Promise<unknown>;
}, seedInterviewQuestions: InterviewQuestion[], legacyInterviewAnswers: Record<string, string> = {}) {
  for (const seed of seedInterviewQuestions) {
    const current = await table.get(seed.id);

    if (!current || current.source !== "seed") {
      continue;
    }

    if (current.myAnswer !== legacyInterviewAnswers[seed.id]) {
      continue;
    }

    await table.put({
      ...current,
      myAnswer: seed.myAnswer,
      updatedAt: seed.updatedAt
    });
  }
}

async function migrateSeedTransitionReasonCardsToInterviewQuestions(
  interviewTable: {
    get: (id: string) => Promise<InterviewQuestion | undefined>;
    bulkAdd: (items: InterviewQuestion[]) => Promise<unknown>;
  },
  transitionTable: {
    where: (index: string) => {
      equals: (value: string) => {
        toArray: () => Promise<TransitionReasonCard[]>;
      };
    };
  },
  seedInterviewQuestions: InterviewQuestion[]
) {
  const currentSeedCards = await transitionTable
    .where("source")
    .equals("seed")
    .toArray();

  if (currentSeedCards.length === 0) {
    return;
  }

  const transitionQuestionSeeds = seedInterviewQuestions.filter((question) =>
    question.id.startsWith("demo-interview-transition-")
  );
  const missingSeeds: InterviewQuestion[] = [];

  for (const seed of transitionQuestionSeeds) {
    if (!(await interviewTable.get(seed.id))) {
      missingSeeds.push(seed);
    }
  }

  if (missingSeeds.length > 0) {
    await interviewTable.bulkAdd(missingSeeds);
  }
}

async function syncSeedTransitionReasonCards(table: {
  delete: (id: string) => Promise<void>;
  get: (id: string) => Promise<TransitionReasonCard | undefined>;
  where: (index: string) => {
    equals: (value: string) => {
      toArray: () => Promise<TransitionReasonCard[]>;
    };
  };
  bulkAdd: (items: TransitionReasonCard[]) => Promise<unknown>;
}, seedTransitionReasonCards: TransitionReasonCard[]) {
  const seedIds = new Set(seedTransitionReasonCards.map((seed) => seed.id));
  const currentSeedCards = await table.where("source").equals("seed").toArray();

  for (const current of currentSeedCards) {
    if (!seedIds.has(current.id)) {
      await table.delete(current.id);
    }
  }

  const missingSeeds: TransitionReasonCard[] = [];

  for (const seed of seedTransitionReasonCards) {
    if (!(await table.get(seed.id))) {
      missingSeeds.push(seed);
    }
  }

  if (missingSeeds.length > 0) {
    await table.bulkAdd(missingSeeds);
  }
}

async function syncSeedResumeStatements(table: {
  get: (id: string) => Promise<ResumeStatement | undefined>;
  delete: (id: string) => Promise<void>;
  where: (index: string) => {
    equals: (value: string) => {
      toArray: () => Promise<ResumeStatement[]>;
    };
  };
  bulkAdd: (items: ResumeStatement[]) => Promise<unknown>;
}, seedResumeStatements: ResumeStatement[]) {
  const seedIds = new Set(seedResumeStatements.map((seed) => seed.id));
  const currentSeedStatements = await table.where("source").equals("seed").toArray();

  for (const current of currentSeedStatements) {
    if (!seedIds.has(current.id)) {
      await table.delete(current.id);
    }
  }

  const missingSeeds: ResumeStatement[] = [];

  for (const seed of seedResumeStatements) {
    if (!(await table.get(seed.id))) {
      missingSeeds.push(seed);
    }
  }

  if (missingSeeds.length > 0) {
    await table.bulkAdd(missingSeeds);
  }
}

async function syncSeedWorkItemSystemLabels(table: {
  get: (id: string) => Promise<WorkItem | undefined>;
  put: (item: WorkItem) => Promise<unknown>;
}, seedWorkItems: WorkItem[], normalizeLegacyPeriodNote = (value: string) => value) {
  for (const seed of seedWorkItems) {
    const current = await table.get(seed.id);

    if (!current || current.source !== "seed") {
      continue;
    }

    const isReassignedProcessItem =
      seed.id === "common-ezgator-file-message-guide" ||
      seed.id === "common-scms-return-mock-guide";
    const shouldSyncMetricEvidence =
      seed.id === "ips-order-yet-attended-sql" &&
      (current.result.includes("반영 전 검증") ||
        current.dangerousClaims.includes("500배 개선"));
    const periodNote =
      isReassignedProcessItem || shouldSyncMetricEvidence
        ? seed.periodNote
        : normalizeLegacyPeriodNote(current.periodNote);
    const system = isReassignedProcessItem ? seed.system : current.system;

    const resumeFitChanged =
      JSON.stringify(current.resumeFit) !== JSON.stringify(seed.resumeFit);
    const scoreChanged =
      JSON.stringify(current.score) !== JSON.stringify(seed.score);
    if (
      current.projectId !== seed.projectId ||
      current.system !== system ||
      current.startedAt !== seed.startedAt ||
      current.endedAt !== seed.endedAt ||
      current.periodNote !== periodNote ||
      resumeFitChanged ||
      scoreChanged ||
      shouldSyncMetricEvidence
    ) {
      await table.put({
        ...current,
        ...(shouldSyncMetricEvidence
          ? {
              dangerousClaims: seed.dangerousClaims,
              evidenceRefs: seed.evidenceRefs,
              learningQuestions: seed.learningQuestions,
              metricsToVerify: seed.metricsToVerify,
              result: seed.result,
              safeClaims: seed.safeClaims
            }
          : {}),
        periodNote,
        projectId: seed.projectId,
        score: seed.score,
        startedAt: seed.startedAt,
        endedAt: seed.endedAt,
        resumeFit: seed.resumeFit,
        system,
        updatedAt: seed.updatedAt
      });
    }
  }
}

async function syncSeedPromptTemplates(table: {
  delete: (id: string) => Promise<unknown>;
  get: (id: string) => Promise<PromptTemplate | undefined>;
  put: (item: PromptTemplate) => Promise<unknown>;
}, seedPromptTemplates: PromptTemplate[]) {
  for (const retiredId of retiredPromptTemplateIds) {
    await table.delete(retiredId);
  }

  for (const seed of seedPromptTemplates) {
    const legacyId = getLegacyPromptTemplateId(seed.id);
    const currentById = await table.get(seed.id);
    const legacy = legacyId ? await table.get(legacyId) : undefined;
    const current = currentById ?? legacy;

    if (currentById && legacy) {
      await table.delete(legacy.id);
    }

    if (!current) {
      await table.put(seed);
      continue;
    }

    if (current.source !== "seed") {
      continue;
    }

    if (legacyId && current.id === legacyId) {
      await table.delete(legacyId);
    }

    if (
      current.id !== seed.id ||
      current.templateType !== seed.templateType ||
      current.title !== seed.title ||
      current.description !== seed.description ||
      current.body !== seed.body ||
      current.requiredJsonShape !== seed.requiredJsonShape
    ) {
      await table.put({
        ...current,
        id: seed.id,
        templateType: seed.templateType,
        title: seed.title,
        description: seed.description,
        body: seed.body,
        requiredJsonShape: seed.requiredJsonShape,
        updatedAt: seed.updatedAt
      });
    }
  }
}

const retiredPromptTemplateIds = [
  "prompt-resume-bullet-feedback",
  "prompt-resume-statement-feedback"
];

function getLegacyPromptTemplateId(id: string) {
  const legacyIds: Record<string, string> = {};

  return legacyIds[id];
}
