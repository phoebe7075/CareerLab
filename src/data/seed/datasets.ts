import { demoSeedEntities, demoSeedSettings } from "./demo";
import {
  normalizeSeedSystemLabel,
  seedEntities,
  seedLegacyInterviewAnswers,
  seedSettings
} from ".";
import type { CareerLabSeedData } from "./seedData";

export const defaultSeedData: CareerLabSeedData = {
  profile: "default",
  settings: seedSettings,
  entities: seedEntities,
  legacyInterviewAnswers: seedLegacyInterviewAnswers,
  normalizeLegacyPeriodNote: normalizeSeedSystemLabel
};

export const demoSeedData: CareerLabSeedData = {
  profile: "demo",
  settings: demoSeedSettings,
  entities: demoSeedEntities
};

export function resolveSeedData(profile: string | undefined): CareerLabSeedData {
  return profile === "demo" ? demoSeedData : defaultSeedData;
}

export function getRuntimeSeedData(): CareerLabSeedData {
  const requestedProfile =
    import.meta.env.VITE_CAREER_LAB_SEED_PROFILE ||
    (import.meta.env.MODE === "demo" || import.meta.env.MODE === "demo-pages"
      ? "demo"
      : undefined);

  return resolveSeedData(requestedProfile);
}
