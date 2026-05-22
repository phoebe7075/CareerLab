import type { PageGuideStep } from "../ui/PageGuideOverlay";

export type PageGuide = {
  storageKey: string;
  steps: PageGuideStep[];
};

export const pageGuides: Record<string, PageGuide> = {
  dashboard: {
    storageKey: "career-lab:page-guide:dashboard:v2",
    steps: [
      {
        body: "프로젝트, 경력기술서, 자기소개서, 프롬프트 센터 통계를 보는 시작 지점입니다.",
        target: '[data-page-guide="dashboard-overview"]',
        title: "작업공간 개요"
      },
      {
        body: "프로젝트별 업무 수, 최근 수정 프로젝트, 평균 활용 점수, 기간 미입력 프로젝트를 확인합니다.",
        target: '[data-page-guide="dashboard-project"]',
        title: "프로젝트 통계"
      },
      {
        body: "최종 확정, 사용 후보, 평가 완료율만 확인합니다.",
        target: '[data-page-guide="dashboard-resume"]',
        title: "경력기술서 통계"
      },
      {
        body: "자기소개서 답변이 목표 글자 수 범위에 들어왔는지 확인합니다.",
        target: '[data-page-guide="dashboard-essay"]',
        title: "자기소개서 통계"
      },
      {
        body: "저장된 프롬프트 이력을 템플릿 종류별 비율로 확인합니다.",
        target: '[data-page-guide="dashboard-prompt"]',
        title: "프롬프트 센터 통계"
      }
    ]
  },
  "work-projects": {
    storageKey: "career-lab:page-guide:work-projects:v1",
    steps: [
      {
        body: "프로젝트를 선택하거나 새 프로젝트를 만들 수 있는 목록입니다.",
        target: '[data-page-guide="project-list"]',
        title: "프로젝트 목록"
      },
      {
        body: "새 프로젝트는 목록 카드가 아니라 상단의 추가 버튼으로 시작합니다. 프로젝트가 하나도 없어도 이 버튼과 오른쪽 생성 폼이 먼저 보입니다.",
        target: '[data-page-guide="project-new"]',
        title: "새 프로젝트 추가"
      },
      {
        body: "프로젝트명, 조직, 역할, 팀 규모처럼 여러 업무가 공유하는 맥락을 정리합니다.",
        target: '[data-page-guide="project-form"]',
        title: "프로젝트 정보"
      },
      {
        body: "시작일과 종료일은 같은 영역에서 선택합니다. 진행 중인 프로젝트는 종료일을 비워둡니다.",
        target: '[data-page-guide="project-date-range"]',
        title: "프로젝트 기간"
      }
    ]
  },
  "work-understanding": {
    storageKey: "career-lab:page-guide:work-understanding:v1",
    steps: [
      {
        body: "프로젝트별로 묶인 업무 목록입니다. 필터로 시스템과 중요도를 좁히고, 항목을 선택하면 오른쪽에서 상세 내용을 수정합니다.",
        target: '[data-page-guide="work-list"]',
        title: "업무 목록"
      },
      {
        body: "선택한 업무의 문제, 역할, 행동, 결과, 점수, 근거를 관리하는 편집 영역입니다.",
        target: '[data-page-guide="work-detail"]',
        title: "업무 상세 편집"
      },
      {
        body: "프로젝트명, 저장소, 문서, 커밋 범위를 AI 에이전트에게 넘겨 후보 업무를 먼저 뽑고, 선택한 업무만 Career Lab JSON으로 가져오는 권장 흐름입니다.",
        target: '[data-page-guide="ai-work-candidates"]',
        title: "AI로 업무 후보 만들기"
      },
      {
        body: "이미 정리된 JSON이 있을 때만 쓰는 고급 가져오기입니다. 프로젝트 매핑과 중복 위험은 저장 전에 경고로 확인합니다.",
        target: '[data-page-guide="json-direct-import"]',
        title: "JSON 직접 가져오기"
      },
      {
        body: "현재 업무 목록을 AI에게 다시 평가하게 하는 흐름입니다. 경력기술서, 자기소개서, 면접 활용도 점수를 JSON으로 받아 업무 데이터에 반영합니다.",
        target: '[data-page-guide="score-work-items"]',
        title: "점수 평가"
      },
      {
        body: "AI 없이 업무를 하나씩 직접 추가합니다. 프로젝트가 없으면 새 프로젝트명을 입력하고, 점수와 근거는 상세 편집에서 이어서 채웁니다.",
        target: '[data-page-guide="manual-work-add"]',
        title: "업무 직접 추가"
      }
    ]
  },
  "resume-lab": {
    storageKey: "career-lab:page-guide:resume-lab:v1",
    steps: [
      {
        body: "현재 선택한 업무를 기준으로 새 경력기술서 문구를 직접 추가합니다.",
        target: '[data-page-guide="resume-add-statement"]',
        title: "새 문구"
      },
      {
        body: "상태별 경력기술서 문구를 고르고 최종 문구부터 확인합니다.",
        target: '[data-page-guide="resume-list"]',
        title: "문구 목록"
      },
      {
        body: "선택한 문구를 편집하고 상태, 평가 프롬프트, 평가 JSON을 관리합니다.",
        target: '[data-page-guide="resume-editor"]',
        title: "문구 편집"
      },
      {
        body: "선택 업무 기반으로 외부 AI에 줄 경력기술서 생성 프롬프트를 만듭니다.",
        target: '[data-page-guide="resume-prompt-builder"]',
        title: "프롬프트 생성"
      }
    ]
  },
  "essay-lab": {
    storageKey: "career-lab:page-guide:essay-lab:v1",
    steps: [
      {
        body: "회사나 지원 포지션 단위로 자기소개서 묶음을 관리합니다.",
        target: '[data-page-guide="essay-set-list"]',
        title: "자기소개서 묶음"
      },
      {
        body: "선택한 묶음의 회사명, 직무, 마감일, 양식 메모 같은 맥락을 정리합니다.",
        target: '[data-page-guide="essay-set-metadata"]',
        title: "묶음 정보"
      },
      {
        body: "묶음을 고른 뒤 작성 버튼으로 문항 작성 화면에 들어갑니다.",
        target: '[data-page-guide="essay-open-editor"]',
        title: "작성 시작"
      }
    ]
  },
  "essay-lab-editor": {
    storageKey: "career-lab:page-guide:essay-lab-editor:v1",
    steps: [
      {
        body: "현재 작성 중인 자기소개서 묶음과 마감, Markdown 내보내기 동작을 확인합니다.",
        target: '[data-page-guide="essay-editor-header"]',
        title: "작성 묶음"
      },
      {
        body: "묶음 안의 문항을 선택하거나 새 문항을 추가합니다.",
        target: '[data-page-guide="essay-question-list"]',
        title: "문항 목록"
      },
      {
        body: "선택한 문항과 목표 글자 수를 조정하고 답변 본문을 작성합니다.",
        target: '[data-page-guide="essay-answer-editor"]',
        title: "답변 편집"
      },
      {
        body: "AI 첨삭 프롬프트, 분량, 연결 업무, 과장 위험을 오른쪽에서 점검합니다.",
        target: '[data-page-guide="essay-inspector"]',
        title: "답변 점검"
      }
    ]
  },
  "interview-prep": {
    storageKey: "career-lab:page-guide:interview-prep:v1",
    steps: [
      {
        body: "현재 연습할 면접 질문과 답변 방향을 확인하는 중심 영역입니다.",
        target: '[data-page-guide="interview-main"]',
        title: "질문 연습"
      },
      {
        body: "질문 인덱스와 꼬리질문을 열어 질문 흐름을 이동합니다.",
        target: '[data-page-guide="interview-navigator"]',
        title: "질문 이동"
      },
      {
        body: "AI에게 꼬리질문 후보를 만들게 하고 JSON으로 가져옵니다.",
        target: '[data-page-guide="interview-follow-up"]',
        title: "꼬리질문 생성"
      }
    ]
  },
  "prompt-center": {
    storageKey: "career-lab:page-guide:prompt-center:v1",
    steps: [
      {
        body: "저장된 프롬프트 템플릿을 확인합니다.",
        target: '[data-page-guide="prompt-template-list"]',
        title: "템플릿 목록"
      },
      {
        body: "템플릿 본문과 요구 JSON 형태를 읽기 전용으로 확인합니다.",
        target: '[data-page-guide="prompt-template-detail"]',
        title: "템플릿 상세"
      }
    ]
  },
  "prompt-center-templates": {
    storageKey: "career-lab:page-guide:prompt-center:v1",
    steps: [
      {
        body: "저장된 프롬프트 템플릿을 확인합니다.",
        target: '[data-page-guide="prompt-template-list"]',
        title: "템플릿 목록"
      },
      {
        body: "템플릿 본문과 요구 JSON 형태를 읽기 전용으로 확인합니다.",
        target: '[data-page-guide="prompt-template-detail"]',
        title: "템플릿 상세"
      }
    ]
  },
  "prompt-center-history": {
    storageKey: "career-lab:page-guide:prompt-center-history:v1",
    steps: [
      {
        body: "각 Lab에서 복사하거나 저장한 프롬프트 이력을 확인합니다.",
        target: '[data-page-guide="prompt-history"]',
        title: "히스토리"
      }
    ]
  },
  "export-import": {
    storageKey: "career-lab:page-guide:export-import:v1",
    steps: [
      {
        body: "현재 로컬 데이터를 JSON 또는 Markdown으로 내보냅니다.",
        target: '[data-page-guide="export-panel"]',
        title: "내보내기"
      },
      {
        body: "가져올 JSON은 먼저 미리보기로 검증하고, 문제가 없을 때만 반영합니다.",
        target: '[data-page-guide="import-panel"]',
        title: "가져오기"
      }
    ]
  }
};

export function getPageGuide(pageId: string) {
  return pageGuides[pageId] ?? null;
}
