import {
  DEMO_ACTIVE_CYCLE_ID,
  demoSeedEntities,
  demoSeedEssayQuestions,
  demoSeedEssaySets,
  demoSeedPromptTemplates,
  demoSeedSettings,
  demoSeedWorkItems
} from "./demo";

export const ACTIVE_CYCLE_ID = DEMO_ACTIVE_CYCLE_ID;
export const DEFAULT_ESSAY_SET_ID = "essay-set-demo-backend";
export const seedSettings = demoSeedSettings;
export const seedEntities = demoSeedEntities;
export const seedWorkItems = demoSeedWorkItems;
export const seedEssaySets = demoSeedEssaySets;
export const seedEssayQuestions = demoSeedEssayQuestions;
export const seedPromptTemplates = demoSeedPromptTemplates;
export const seedLegacyInterviewAnswers: Record<string, string> = {};

export function normalizeSeedSystemLabel(value: string) {
  return value;
}
