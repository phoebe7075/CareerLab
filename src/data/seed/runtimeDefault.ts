import {
  normalizeSeedSystemLabel,
  seedEntities,
  seedLegacyInterviewAnswers,
  seedSettings
} from ".";
import type { CareerLabSeedData } from "./seedData";

export const runtimeSeedData: CareerLabSeedData = {
  profile: "default",
  settings: seedSettings,
  entities: seedEntities,
  legacyInterviewAnswers: seedLegacyInterviewAnswers,
  normalizeLegacyPeriodNote: normalizeSeedSystemLabel
};
