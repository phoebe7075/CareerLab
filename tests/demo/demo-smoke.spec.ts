import { expect, test, type Page } from "@playwright/test";

import { dismissPageGuides } from "../e2e/pageGuideTestUtils";

test.beforeEach(async ({ page }) => {
  await dismissPageGuides(page);
  await page.goto("/");
});

test("demo dashboard starts with anonymized data and prompt history", async ({
  page
}) => {
  await expect(page.getByText("공개 데모 샘플")).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "초기 샘플로 되돌리기" })
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("익명 커머스 운영 포털");
  await expect(page.locator("body")).toContainText("3개 이력");
  await expect(page.locator("body")).toContainText("자기소개서 첨삭");
  await expect(page.locator("body")).toContainText("꼬리질문 생성");
  await expect(page.locator("body")).toContainText("선택 업무 JSON 추출");
});

test("demo prompt history page shows seeded copyable workflow examples", async ({
  page
}) => {
  await page.getByRole("button", { exact: true, name: "프롬프트 센터" }).click();
  await page.getByRole("button", { exact: true, name: "히스토리" }).click();

  await expect(
    page.getByRole("heading", { exact: true, name: "프롬프트 히스토리" })
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("3개 이력");
  await expect(page.locator("body")).toContainText(
    "운영 대시보드 조회 지연 분석"
  );
  await expect(page.locator("body")).toContainText("자기소개서 답변을 검토한다.");
  await expect(page.locator("body")).toContainText("꼬리질문을 생성한다.");
});

test("demo visible pages render from the public seed", async ({ page }) => {
  const pages = [
    "대시보드",
    "프로젝트",
    "업무 이해",
    "경력기술서 Lab",
    "자기소개서 Lab",
    "면접 Prep",
    "백업 / 가져오기"
  ];

  for (const label of pages) {
    await navigate(page, label);
    await expectDemoPage(page);
  }

  await navigate(page, "프롬프트 센터");
  await navigate(page, "템플릿");
  await expectDemoPage(page);

  await navigate(page, "히스토리");
  await expectDemoPage(page);
});

async function navigate(page: Page, label: string) {
  await page.getByRole("button", { exact: true, name: label }).click();
}

async function expectDemoPage(page: Page) {
  await expect(page.getByRole("heading", { name: "Career Lab" })).toBeVisible();
}
