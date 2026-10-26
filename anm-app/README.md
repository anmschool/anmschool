# ANM 앱 (올네이션스 경배와찬양)

경배와찬양학교 · 큰잔치 · 훈련 안내 + 참가자 "내 등록" 대시보드. 설치 가능한 웹앱(PWA).

## 구조
- **화면**: 이 레포 (Vite + React + TS). Vercel에 배포
- **데이터**: Apps Script 웹앱 API (`04_appApi.gs`, anmschool 계정). 운영 시트는 비공개로 두고 API가 본인 정보만 돌려줌
- **관리**: 드라이브 `00_시스템/앱/ANM 앱` 시트 — 프로젝트(상태: 준비/진행/종료/숨김) · 공지 · 시간표 · 안내 · 장소 · 관리자 PIN

## 주소
| 주소 | 화면 |
|---|---|
| `/` | 사역 목록 (진행 중 / 준비 중 / 지난) |
| `/p/2027W` | 행사 안내 (공지·시간표·안내·장소, 신청하기) |
| `/q/2027W` | **QR용** → 로그인(이름 + 전화번호) → 내 대시보드 |
| `/p/2027W/me` | 내 훈련비·숙소·시간표·공지·현장 등록 QR |
| `/admin` | 관리자 현황 (PIN) |

## 개발
```bash
npm install
cp .env.example .env.local   # VITE_API_URL=<Apps Script 웹앱 URL>
npm run dev                   # URL 없으면 데모 데이터 (홍길동 / 01012345678, 관리자 PIN 000000)
npm run build
```

## 배포 (Vercel)
1. 이 폴더를 GitHub 레포로 올림 (anmschool 소유 계정)
2. Vercel → New Project → 레포 선택 → Environment Variables에 `VITE_API_URL` 입력 → Deploy
3. 시트 내용을 바꾸면 2분 안에 앱에 반영 (재배포 불필요). 코드를 바꿨을 때만 git push
