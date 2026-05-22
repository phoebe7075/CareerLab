import type { AppSettings, CareerLabEntities } from "../schema";

export type SeedProfile = "default" | "demo";

export type CareerLabSeedData = {
  profile: SeedProfile;
  settings: AppSettings;
  entities: CareerLabEntities;
  legacyInterviewAnswers?: Record<string, string>;
  normalizeLegacyPeriodNote?: (value: string) => string;
};
