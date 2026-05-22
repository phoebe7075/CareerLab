# Portfolio Demo Strategy

## 목적

Career Lab은 먼저 local-first 이직 준비 작업대로 빠르게 완성한다. 이후 채용자나 외부 사용자가 URL로 접속해 기능 흐름을 확인할 수 있도록 정적 배포와 공개 데모 데이터를 준비한다.

이 문서는 현재 local-first 원칙을 유지하면서, 공개 포트폴리오와 나중의 다중 사용자 확장까지 어떻게 이어갈지 정한다.

## 기본 방향

1. 현재 MVP는 서버 백엔드 없이 유지한다.
2. 앱은 GitHub Pages, Vercel, Netlify 같은 정적 호스팅에 배포할 수 있다.
3. 정적 배포된 앱도 각 사용자 브라우저의 IndexedDB에 데이터를 저장한다.
4. 공개 배포에는 실제 개인 이직 데이터나 회사 내부 맥락을 포함하지 않는다.
5. 계정, 서버 DB, 동기화는 MVP 이후 별도 단계로 다룬다.

정적 배포 구조:

```text
Static hosting
  - HTML, CSS, JS 파일 제공

User browser
  - IndexedDB에 개인 데이터 저장
  - prompt copy -> external AI -> JSON paste/import 흐름 사용
  - export/import로 백업과 이동 처리
```

## 채용자에게 보여줄 핵심 메시지

Career Lab은 단순히 AI에게 문장을 대신 쓰게 하는 앱이 아니다.

보여주고 싶은 역량은 아래에 가깝다.

- 실제 업무 경험을 구조화된 데이터로 정리하는 능력
- AI 결과를 그대로 저장하지 않고 preview, validation, confirm으로 통제하는 능력
- 경력기술서, 자기소개서, 면접 답변을 하나의 근거 데이터에서 파생시키는 제품 설계
- 민감한 이직 데이터를 다루기 위해 local-first 저장을 선택한 판단
- version history, diff, fact policy, risk warning metadata로 품질과 사실성을 관리하는 습관
- build, test, lint, Playwright check, CI/CD로 검증 가능한 개발 흐름을 만드는 능력

따라서 1차 목표는 "수익성 있는 서비스"나 "많은 사용자 수"가 아니라, AI 활용과 제품화 능력을 짧은 시간 안에 이해할 수 있는 공개 데모를 만드는 것이다.

## 데이터 분리 원칙

공개 데모와 개인 이직 준비 데이터는 반드시 분리한다.

```text
demo seed
  - 공개 repo와 정적 배포에 포함 가능
  - 익명화된 회사명, 프로젝트명, 업무명 사용
  - 기능 흐름을 보여주는 샘플 데이터

비공개 개인 데이터
  - 실제 이직 준비 데이터
  - 실제 회사명, 업무명, 기간, 수치 후보, 역할 범위 포함 가능
  - 공개 repo와 정적 배포에 포함하지 않음
  - 앱 export JSON으로 로컬 백업하거나 비공개 저장소에서만 관리
```

공개 repo에는 demo seed만 포함하는 방식을 우선한다. 실제 개인 데이터는 앱의 export/import 기능으로 관리하고, 코드 seed에 직접 넣지 않는다.

## Demo Seed 구성

채용자가 접속했을 때 빈 앱을 보지 않도록, 기능 흐름을 설명하는 샘플 시나리오를 제공한다.

권장 구성:

- 익명 프로젝트 2~3개
- 업무 경험 5~8개
- 경력기술서 문구 3~5개
- 자기소개서 문항 2개
- 면접 질문과 꼬리질문 5~8개
- 확인 필요 수치, 위험 표현, 안전한 대체 표현
- version history 예시
- AI JSON import preview에 사용할 샘플 응답

데이터 양은 많을 필요가 없다. 핵심은 "업무 이해 -> 문장 생성 -> AI 피드백 -> preview/confirm -> version history -> 각 Lab의 위험 경고" 흐름이 한 번에 보이는 것이다.

현재 구현:

- `src/data/seed/demo.ts`에 공개 포트폴리오용 익명 demo seed를 둔다.
- `npm run dev:demo`와 `npm run build:demo`는 `demo` mode로 실행되어 demo seed profile을 사용한다.
- demo mode는 기본 로컬 DB와 섞이지 않도록 `career-lab-demo` IndexedDB를 사용한다.
- `npm run build:demo:pages`는 GitHub Pages project site용 `/CareerLab/` base path로 demo build를 만든다.
- 일반 `npm run dev` / `npm run build`는 기존 로컬 작업용 seed profile을 유지한다.

현재 공개 상태:

- public GitHub repo는 `https://github.com/phoebe7075/CareerLab`이다.
- GitHub Pages URL은 `https://phoebe7075.github.io/CareerLab/`이다.
- `main` 브랜치에 push하면 GitHub Actions가 lint와 demo build를 실행한 뒤 Pages를 갱신한다.
- 이 repo는 공개 demo seed만 포함해야 하며, 실제 개인 데이터, 내부 수치, 민감 docs/report를 추가하지 않는다.

## 공개 배포 단계

### Phase 1. Local-first MVP

- 현재 앱의 핵심 워크플로우를 local-first로 닫는다.
- private 데이터는 로컬 export/import로 관리한다.
- 외부 AI는 계속 prompt copy와 JSON paste/import 방식으로 사용한다.
- build, test, lint, UI check를 통과하는 상태를 유지한다.

### Phase 2. Static Demo

- demo seed를 별도로 만든다.
- 실제 회사명과 개인 정보를 제거한다.
- GitHub Pages로 정적 배포한다.
- 배포 URL에서 IndexedDB 저장과 백업/가져오기 흐름이 동작하는지 확인한다.
- README에 demo URL, 실행 방법, 검증 명령, 핵심 사용자 흐름을 정리한다.

### Phase 3. CI/CD

- public repo는 GitHub Actions에서 아래 명령을 자동 실행한다.
  - `npm run lint`
  - `npm run build:demo`
- 공개 demo 회귀 확인이 필요하면 수동 또는 로컬에서 `npm run ui:check:demo`를 실행한다.
- `main` 브랜치에 push될 때 정적 배포가 갱신된다.
- Playwright는 실행 시간이 길 수 있으므로 별도 job이나 수동 trigger로 분리할 수 있다.

### Phase 4. Optional Cloud Sync

다중 사용자, 계정, 서버 저장은 이 단계에서 별도 제품 결정으로 다룬다.

추가될 수 있는 기능:

- 사용자 계정
- 사용자별 workspace
- 서버 DB 저장
- 여러 기기 간 동기화
- 공유 가능한 포트폴리오 링크
- 민감 데이터 암호화 또는 최소 저장 정책

이 단계는 local-first MVP를 대체하는 것이 아니라, 선택적 cloud sync 모드로 확장하는 방향이 좋다.

```text
Local-only mode
  - 데이터는 브라우저에만 저장
  - 계정 없이 사용
  - 민감 데이터 관리에 적합

Cloud sync mode
  - 사용자가 명시적으로 선택
  - 로그인 필요
  - 여러 기기 동기화
  - 보안, 삭제, 백업 정책 필요
```

## 서버 확장 판단 기준

서버를 붙이는 것이 좋은 평가로 이어지려면 단순 로그인 CRUD가 아니라 아래 질문에 답해야 한다.

- 왜 이 민감한 데이터를 서버에 저장해야 하는가?
- 사용자가 local-only와 cloud sync 중 선택할 수 있는가?
- 사용자별 데이터 격리와 삭제 정책이 있는가?
- export/import와 cloud sync 사이의 충돌을 어떻게 처리하는가?
- AI 결과는 여전히 preview/confirm을 거치는가?
- 서버 장애나 네트워크 실패 시 로컬 데이터가 안전한가?

이 질문에 답하기 전에는 서버 구현보다 정적 배포와 demo seed 완성의 우선순위가 높다.

## 구현 후보

가까운 작업 후보:

- `demo` 전용 seed 데이터 작성 - 완료
- `private` 데이터가 공개 seed에 섞이지 않도록 seed 로딩 구조 정리 - 완료
- demo reset 버튼 또는 demo seed reset 문구 정리 - 완료
- demo prompt history 샘플 구성 - 완료
- GitHub Pages용 Vite `base` 설정 검토 - 완료
- demo 전용 Playwright smoke check 추가 - 완료
- GitHub Actions Pages workflow 추가 - 완료
- README에 portfolio demo URL과 핵심 흐름 추가
- 공개 데모용 스크린샷 또는 짧은 walkthrough 작성

후순위 작업 후보:

- repository 계층을 `LocalRepository`와 future `RemoteRepository`로 분리할 수 있는지 점검
- sync conflict 정책 초안 작성
- 계정/워크스페이스 schema 초안 작성
- 민감 데이터 암호화나 삭제 정책 문서화

## 공개 금지 데이터

아래 데이터는 공개 demo seed, screenshot, README, 배포 URL에 포함하지 않는다.

- 실제 회사 내부 시스템명 중 공개가 조심스러운 값
- 실제 운영 수치 또는 운영 DB 근거가 그대로 드러나는 값
- 내부 파일명, API명, 테이블명, 계정, URL, IP, 환경명
- 개인 신상 정보
- 실제 지원 회사별 맞춤 자기소개서
- 검증되지 않은 성과 수치
- 본인 역할 범위를 과장할 수 있는 표현

공개 데모는 기능과 설계 판단을 보여주는 용도다. 실제 이직 준비 데이터의 원문을 보여주는 용도가 아니다.
