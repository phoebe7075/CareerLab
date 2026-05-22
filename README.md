# Career Lab

Career Lab은 이직 준비용 local-first SPA다. 외부 AI API, 서버 백엔드, 원격 DB 없이 브라우저와 로컬 IndexedDB를 중심으로 동작한다.

이 공개 repo는 포트폴리오 데모용으로 익명 샘플 데이터만 포함한다. 실제 개인 이직 준비 데이터, 회사명, 내부 시스템명, 운영 수치는 포함하지 않는다.

## 핵심 사용자 흐름

1. `대시보드`에서 프로젝트, 경력기술서, 자기소개서, 프롬프트 이력 상태를 먼저 확인한다.
2. `프로젝트`와 `업무 이해`에서 경력 소재를 프로젝트/업무 단위로 정리하고, 활용 점수와 위험 표현을 확인한다.
3. `경력기술서 Lab`에서 업무 근거를 문장으로 바꾸고, 상태와 버전 이력으로 최종 문구를 관리한다.
4. `자기소개서 Lab`에서 회사/JD 묶음별 문항과 답변을 작성하고, 연결 업무 근거를 유지한다.
5. `면접 Prep`에서 대표 질문, 내 답변, 꼬리질문 thread를 연습한다. 이직 사유도 별도 카드가 아니라 일반 면접 질문으로 관리한다.
6. `프롬프트 센터`에서 저장된 프롬프트 템플릿과 각 Lab에서 만든 프롬프트 이력을 확인한다. 프롬프트 복사와 JSON 가져오기는 `업무 이해`, `경력기술서 Lab`, `자기소개서 Lab`, `면접 Prep` 안에서 진행한다.
7. `백업 / 가져오기`에서 JSON 백업, 현재 준비 데이터 export, Markdown export, 검증 후 import를 처리한다.

공개 데모 모드에서는 `대시보드`에 `초기 샘플로 되돌리기`가 표시된다. 이 버튼은 현재 브라우저의 demo IndexedDB만 초기 익명 샘플로 되돌린다.

## 실행 방법

의존성이 없거나 `node_modules`가 없으면 먼저 설치한다.

```powershell
npm install
```

개발 서버를 실행한다.

```powershell
npm run dev
```

Vite 기본 주소는 아래와 같다.

```text
http://localhost:5173/
```

공개 포트폴리오용 익명 demo seed로 실행하려면 demo mode를 사용한다. 이 모드는
일반 로컬 DB와 분리된 `career-lab-demo` IndexedDB를 사용한다.

```powershell
npm run dev:demo
```

정적 배포용 demo build:

```powershell
npm run build:demo
```

GitHub Pages의 project site(`/CareerLab/`)로 올릴 demo build:

```powershell
npm run build:demo:pages
```

서버를 끌 때는 `npm run dev`를 실행한 터미널에서 `Ctrl+C`를 누른다.

## 백그라운드 실행

터미널을 계속 열어두기 싫으면 PowerShell에서 백그라운드로 실행할 수 있다.

```powershell
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
  "-NoProfile",
  "-Command",
  "cd '<repo-root>'; npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"
)
```

상태 확인:

```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
```

백그라운드 서버 종료:

```powershell
$serverPid = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($serverPid) { Stop-Process -Id $serverPid }
```

## 검증 명령

```powershell
npm run build
npm test
npm run lint
```

UI 확인이 필요할 때:

```powershell
npm run ui:check
```

공개 demo seed 전용 스모크 체크:

```powershell
npm run ui:check:demo
```

## 문서

프로젝트 문서 인덱스는 `docs/README.md`에서 확인한다.
