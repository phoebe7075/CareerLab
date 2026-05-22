import Dexie, { type Table } from "dexie";

import {
  DATABASE_NAME,
  configureSchema
} from "./migrations";
import type {
  AppSettings,
  CareerCycle,
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

export class CareerLabDatabase extends Dexie {
  settings!: Table<AppSettings, string>;
  careerCycles!: Table<CareerCycle, string>;
  workProjects!: Table<WorkProject, string>;
  workItems!: Table<WorkItem, string>;
  resumeStatements!: Table<ResumeStatement, string>;
  essaySets!: Table<EssaySet, string>;
  essayQuestions!: Table<EssayQuestion, string>;
  interviewQuestions!: Table<InterviewQuestion, string>;
  promptHistory!: Table<PromptHistory, string>;
  resumePromptProfiles!: Table<ResumePromptProfile, string>;
  transitionReasonCards!: Table<TransitionReasonCard, string>;
  promptTemplates!: Table<PromptTemplate, string>;

  constructor(name = DATABASE_NAME) {
    super(name);
    configureSchema(this);
  }
}

export function createCareerLabDatabase(name?: string) {
  return new CareerLabDatabase(name);
}

export const careerLabDb = createCareerLabDatabase(getRuntimeDatabaseName());

function getRuntimeDatabaseName() {
  const isDemoProfile =
    import.meta.env.VITE_CAREER_LAB_SEED_PROFILE === "demo" ||
    import.meta.env.MODE === "demo" ||
    import.meta.env.MODE === "demo-pages";

  return isDemoProfile ? `${DATABASE_NAME}-demo` : DATABASE_NAME;
}
