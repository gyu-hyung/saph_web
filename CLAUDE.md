# Web Service — CLAUDE.md

React 18 + TypeScript + Vite 프론트엔드. 영상 업로드 → 번역 요청 → 실시간 진행률 → 자막 플레이어 화면을 제공한다.

> **현재 상태:** Phase 4 구현 시작 전. `src/App.tsx`는 Vite 기본 보일러플레이트.

---

## 실행

```bash
npm install
npm run dev    # 포트 5173 (개발)
```

프로덕션(Docker): Nginx가 `3000` 포트로 서비스하고 `/api/*` 요청을 `http://api:8080`으로 프록시한다.

---

## 화면 구성 (구현 대상)

| 라우트 | 화면 | 설명 |
|---|---|---|
| `/` | 메인(업로드) | 드래그앤드롭 업로드, 제약 사항 안내 (5분 / 100MB) |
| `/processing/:jobId` | 진행 화면 | 실시간 단계별 진행률 (SSE), "창 닫지 마세요" 안내 |
| `/result/:jobId` | 결과 플레이어 | 영상 재생 + 자막 토글 + SRT 다운로드 |
| `/login`, `/signup` | 인증 | 이메일/비밀번호 |

목업 이미지: `../../docs/bako_ui_mockup_*.png` (업로드/플레이어/결제 팝업/영상 라이브러리)

---

## API 통신

API 베이스: `http://localhost:8080` (dev) / `/api` (Docker Nginx 프록시)

**2-Step 업로드 흐름 (핵심):**
```
1. POST /api/video/upload    → { videoId, durationSec, requiredCreditMin }
2. 크레딧 잔액 확인 → 부족 시 결제 팝업
3. POST /api/video/translate → { jobId, status: "QUEUED" }
4. GET /api/video/status/:jobId (SSE) → 진행률 수신
5. 완료 후 /result/:jobId 로 이동
```

**JWT 처리:**
- Access Token: 메모리(or 로컬스토리지)에 보관, `Authorization: Bearer {token}` 헤더로 전송
- Refresh Token: 30일. `401 UNAUTHORIZED` 응답 시 `POST /api/auth/refresh` 후 원 요청 재시도

---

## 핵심 설계 결정 (WHY)

### SSE로 진행률 수신
`EventSource` API로 `GET /api/video/status/:jobId`에 연결한다.
`event: progress` → 진행률 갱신, `event: completed` → 결과 화면 이동, `event: failed` → 에러 처리.
Job이 `QUEUED` 상태일 때는 `event: queued`로 대기 순번과 예상 대기 시간을 안내한다.

### 영상 플레이어: SRT → 자막 오버레이
API가 WebVTT(.vtt)를 생성하지 않는다 (MVP 제외). SRT 파일을 JS로 파싱해 `<video>` 위에 자막을 오버레이한다.
`<track>` 태그 대신 커스텀 자막 레이어를 구현해야 한다.

**자막 모드 3가지:** `translated`(한국어만) / `original`(원본만) / `dual`(동시)

각 모드별로 다른 SRT를 다운로드하는 게 아니라, `dual` SRT를 파싱하거나 두 SRT를 동시에 로드해 토글로 전환한다.

### 창 닫힘 방어
진행 화면에서 `beforeunload` 이벤트로 사용자에게 경고한다.
재접속 시: `GET /api/jobs`로 진행 중/완료된 Job을 복구해 처리 결과 화면으로 이동한다.

### 크레딧 부족 → 결제 팝업
업로드 후 `requiredCreditMin > creditBalance`이면 즉시 결제 팝업을 띄운다.
결제 완료(`POST /api/credits/purchase/confirm` 응답) 후 번역 요청을 이어서 실행한다.
토스페이먼츠 결제창은 `orderId`와 `price`를 받아 클라이언트에서 직접 호출한다.

---

## 금지 패턴

- **SRT 파운드 없이 `<track>` 태그 사용 금지** — API가 .vtt를 생성하지 않는다.
- **영상 파일을 클라이언트에서 직접 스트리밍 URL로 처리 금지** — `GET /api/video/stream/:jobId` API를 통해 서버에서 Range 스트리밍한다. `<video src="/api/video/stream/:jobId">` 형태로 사용.
- **Access Token을 httpOnly 쿠키에 넣지 않는다** — XSS 방어는 별도 처리, MVP에서는 메모리/로컬스토리지 사용.

---

## 의존성

현재 설치된 주요 패키지:
- `axios` — HTTP 클라이언트
- `react-router-dom` — 라우팅

추가 설치 가능: 자막 파싱 라이브러리(`srt-parser-2` 등), UI 컴포넌트 라이브러리는 팀 결정 사항.
