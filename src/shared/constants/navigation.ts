export type NavigationItem = {
  children?: NavigationItem[];
  id: string;
  label: string;
};

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "대시보드" },
  { id: "work-projects", label: "프로젝트" },
  { id: "work-understanding", label: "업무 이해" },
  { id: "resume-lab", label: "경력기술서 Lab" },
  { id: "essay-lab", label: "자기소개서 Lab" },
  { id: "interview-prep", label: "면접 Prep" },
  {
    id: "prompt-center",
    label: "프롬프트 센터",
    children: [
      { id: "prompt-center-templates", label: "템플릿" },
      { id: "prompt-center-history", label: "히스토리" }
    ]
  },
  { id: "export-import", label: "백업 / 가져오기" }
];

export function flattenNavigationItems(items: NavigationItem[] = navigationItems) {
  return items.flatMap((item) => [item, ...(item.children ?? [])]);
}
