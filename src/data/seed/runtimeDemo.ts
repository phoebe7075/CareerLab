import { demoSeedEntities, demoSeedSettings } from "./demo";
import type { CareerLabSeedData } from "./seedData";

export const runtimeSeedData: CareerLabSeedData = {
  profile: "demo",
  settings: demoSeedSettings,
  entities: demoSeedEntities
};
