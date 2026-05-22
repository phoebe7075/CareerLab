import type { Page } from "@playwright/test";

export const pageGuideStorageKeys = [
  "career-lab:page-guide:dashboard:v2",
  "career-lab:page-guide:work-projects:v1",
  "career-lab:page-guide:work-understanding:v1",
  "career-lab:page-guide:resume-lab:v1",
  "career-lab:page-guide:essay-lab:v1",
  "career-lab:page-guide:essay-lab-editor:v1",
  "career-lab:page-guide:interview-prep:v1",
  "career-lab:page-guide:prompt-center:v1",
  "career-lab:page-guide:prompt-center-history:v1",
  "career-lab:page-guide:export-import:v1"
];

export async function dismissPageGuides(
  page: Page,
  exceptKeys: string[] = []
) {
  await page.addInitScript(
    ({ keys, except }) => {
      for (const key of keys) {
        if (!except.includes(key)) {
          window.localStorage.setItem(key, "dismissed");
        }
      }
    },
    { except: exceptKeys, keys: pageGuideStorageKeys }
  );
}
