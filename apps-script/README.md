# Apps Script (anmschool 계정의 한 프로젝트에 4개 파일)

| 파일 | 하는 일 | 실행할 함수 |
|---|---|---|
| 01_setupDriveStructure.gs | ANM School 드라이브 폴더 구조 정리 (+ 진행 표시·로그 공통 함수) | setupDriveStructure |
| 02_buildAnmDb.gs | ANM_DB(교회·사람·참석·지표) 생성, 과거 통계 이관, 재초청 대상 계산 | buildAnmDb · refreshDB · mergeSameNameChurches |
| 03_term2027W.gs | 2027W 등록·재정·숙소 운영 시트, 폼 응답 5분 자동 처리 | setup2027W · syncResponses |
| 04_appApi.gs | ANM 앱 관리 시트 + 앱 API (웹 앱으로 배포) | setupApp · testApi |

이 폴더는 기록용 사본입니다. 실제 실행 코드는 script.google.com의 프로젝트에 붙여넣은 것.
코드를 고치면 여기와 Apps Script 양쪽을 같이 바꿉니다.
