/**
 * 2027W 등록 · 재정 · 숙소 운영 시트  (2026S 화면 구성을 최대한 유지)
 * ------------------------------------------------------------
 * 실행 계정: anmschool@anminspirational.com  /  01·02와 같은 프로젝트에 새 파일로 추가
 *
 * 함수
 *   setup2027W          : 운영 시트 생성/정비(10_경배와찬양학교/2027W/03_등록·재정) + 5분 자동 동기화 켜기
 *                         (이미 만든 시트에 다시 실행해도 됨: 데이터 없는 옛 탭은 새 이름으로 교체, 체크리스트·설정은 보존)
 *   syncResponses       : 폼 응답 → Master_DB(등록) (개인·단체 xlsx 자동 펼침) → 숙소 → ANM_DB  (5분마다 자동)
 *   rebuildNightTable   : 트랙 탭의 날짜를 바꾼 뒤 숙소 현황(박별) 표 다시 만들기
 *   stopAutoSync        : 5분 자동 동기화 끄기
 *
 * 2026S와 같은 것 : Master_DB(등록) · 훈련비 입금 · 단체교회별 확인 표 · 검색기(등록) · 등록현황 탭 이름과 주요 열 이름
 * 2026S와 다른 것 : 입금은 '훈련비 입금' 한 곳에만 입력 → Master_DB의 입금액·입금여부가 자동 (Master_DB에 직접 O 표시 안 함)
 *                   숙소는 사람 × 구간 목록에 동·호실 입력, '숙소 미배정'이 지금 넣어야 할 사람을 보여줌
 */

const OPS_NAME = '2027W 등록·재정·숙소';
const TERM_FOLDER_PATH = ['10_경배와찬양학교', '2027W', '03_등록·재정'];

const T = {
  reg: 'Master_DB(등록)', fin: '훈련비 입금', grp: '단체교회별 확인 표', search: '검색기(등록)', dash: '등록현황',
  lod: '숙소', un: '숙소 미배정', night: '숙소 현황', rooms: '방 목록', log: '접수 로그',
  cfg: '설정', trk: '트랙', fee: '금액', chk: '체크리스트', guide: '사용법',
};
// 웹 신청서(anmschool.vercel.app/apply) → 04 register가 운영 시트의 이 탭에 한 줄씩 쌓음. 03이 구글폼 응답과 같은 방식으로 읽음
const WEB_TAB = '웹 신청';
const WEB_HEADERS = ['접수번호', '타임스탬프', '신청 방법', '훈련받고자 하는 학교', '참여 방식', '이름', '성별', '생년월일', '연락처', 'E-mail', '주소',
  '참석 교회', '직분', '구분', '기존 훈련', '학교', '학과', '학년', '직장', '기도제목', '언어', '개인정보 동의',
  '교회명', '주소', '교역자명', '교역자 참석', '교역자 연락처', '인솔자명', '인솔자 연락처', 'E-mail', '기도제목', '단체 명단'];
// 1차 버전 탭 이름 → 새 이름 (데이터가 없으면 지우고 새로 만듦)
const OLD_TABS = { 등록: T.reg, 재정: T.fin, 단체: T.grp, 검색: T.search, 현황: T.dash, 안내: T.guide };

const OPS_TABS = {};
OPS_TABS[T.guide] = ['항목', '내용'];
OPS_TABS[T.cfg] = ['항목', '값', '설명'];
OPS_TABS[T.trk] = ['트랙', '코드 키워드', '폼 선택지에 들어가는 말 (+로 AND)', '형태', '계좌', '입실1', '퇴실1', '입실2', '퇴실2'];
OPS_TABS[T.fee] = ['트랙', '요율', '선등록', '일반등록'];
OPS_TABS[T.reg] = [
  // A~Z 입력 구역 (스크립트는 빈 칸만 채움)
  '코드', '경배와찬양학교 구분', '교회', '이름', '성별', '구분', '직분', '생년월일', 'E-mail', '연락처', '주소',
  '훈련비', '선등록', '타임스탬프', '단체ID', '등록경로', '기존 훈련', '학교', '학과', '학년', '직장', '기도제목',
  '계좌', '교회코드', 'DB개인코드', '원본',
  // AA~AE 자동 (수식)
  '입금액', '단체 훈련비', '단체 입금', '입금여부', '숙소배정',
  // AF~ 사람
  '상태', '현장등록 확인여부', '등록 문자 발송', '비고'];
OPS_TABS[T.fin] = ['날짜', '입금자명', '입금액', '계좌', '대상 코드', '구분', '비고', '입력자', '입력일', '반영액', '등록확인'];
OPS_TABS[T.grp] = ['단체ID', '타임스탬프', '교회/단체명', '경배와찬양학교 구분', '교역자명', '교역자 참석', '교역자 연락처', '인솔자명', '인솔자 연락처',
  'E-mail', '신청 파일', '처리 결과', '원본', '총 인원 수', '총 훈련비 합계', '현재 입금 총액', '단체별 입금 완료 여부'];
OPS_TABS[T.lod] = ['코드', '이름', '성별', '구분', '경배와찬양학교 구분', '교회', '구간', '입실', '퇴실', '동', '호실', '메모', '입금여부', '경고'];
OPS_TABS[T.un] = [];
OPS_TABS[T.night] = [];
OPS_TABS[T.rooms] = ['동', '호실', '성별', '정원', '메모', '키'];
OPS_TABS[T.search] = [];
OPS_TABS[T.dash] = [];
OPS_TABS[T.log] = ['시각', '원본행', '결과', '내용'];
OPS_TABS[T.chk] = ['구분', '항목', '내용', '기한', '담당', '완료', '메모'];

const REG_INPUT_COLS = 26;   // A~Z
const COL = {}; OPS_TABS[T.reg].forEach((h, i) => (COL[h] = i)); // 0-based
// 코드 안에서 쓰는 별칭
COL.트랙 = COL['경배와찬양학교 구분']; COL.이메일 = COL['E-mail']; COL.제출일시 = COL['타임스탬프'];

/** 탭의 열 이름 → 열 문자 (A, B, …, AA) */
function L_(tab, name) {
  const i = OPS_TABS[tab].indexOf(name);
  if (i < 0) throw new Error('열 없음: ' + tab + '/' + name);
  let n = i + 1, s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
/** 수식 템플릿: {reg} → 'Master_DB(등록)'  ,  [reg:훈련비] → 'Master_DB(등록)'!L2:L  ,  <reg:훈련비> → L2:L (같은 탭) */
function F_(s) {
  const key = { reg: T.reg, fin: T.fin, grp: T.grp, lod: T.lod, rooms: T.rooms, log: T.log };
  return s
    .replace(/\[(\w+):([^\]]+)\]/g, (_, t, c) => `'${key[t]}'!${L_(key[t], c)}2:${L_(key[t], c)}`)
    .replace(/<(\w+):([^>]+)>/g, (_, t, c) => `${L_(key[t], c)}2:${L_(key[t], c)}`)
    .replace(/\{(\w+)\}/g, (_, t) => `'${key[t]}'`);
}

const DEFAULT_SETTINGS = [
  ['학기코드', '2027W', '코드 앞자리'],
  ['응답 시트 ID', '1vVYACISbSKQgQRd9OlAb7PonD47qVErtdjE6ijdJfR0', '구글폼 응답 스프레드시트 ID (폼을 바꾸면 여기만 수정)'],
  ['선등록 마감', '2026-12-27', '폼 제출일이 이 날짜(포함) 이전이면 선등록'],
  ['계좌 목록', '우리 1005-604-700231, 우리 1005-404-679551', '훈련비 입금 탭 계좌 드롭다운'],
  ['자동 동기화', 'ON', 'OFF로 바꾸면 5분 자동 처리를 건너뜀'],
  ['DB 연동', 'ON', 'ANM_DB 사람·참석 탭에 기록'],
];
// 위에서부터 먼저 맞는 줄을 쓴다 → 온라인을 위에
const DEFAULT_TRACKS = [
  ['온라인 청지기', '온라인', '온라인+청지기', '온라인', '우리 1005-604-700231', '', '', '', ''],
  ['온라인 십대', '온라인', '온라인+십대', '온라인', '우리 1005-604-700231', '', '', '', ''],
  ['온라인 어린이', '온라인', '온라인+어린이', '온라인', '우리 1005-604-700231', '', '', '', ''],
  ['온라인 대학청년·일반', '온라인', '온라인+대학', '온라인', '우리 1005-604-700231', '', '', '', ''],
  ['청지기', '청지기', '청지기', '현장', '우리 1005-604-700231', '2027-01-06', '2027-01-16', '', ''],
  ['십대', '십대', '십대', '현장', '우리 1005-604-700231', '2027-01-11', '2027-01-14', '', ''],
  ['어린이', '어린이', '어린이', '현장', '우리 1005-404-679551', '2027-01-14', '2027-01-16', '', ''],
  ['대학청년·일반', '청년일반', '대학', '현장', '우리 1005-604-700231', '2027-01-06', '2027-01-09', '', ''],
];
const DEFAULT_FEES = [
  ['청지기', '전체', 190000, 220000],
  ['십대', '일반', 120000, 140000], ['십대', '십대', 100000, 120000], ['십대', '어린이', 80000, 100000],
  ['어린이', '일반', 100000, 120000], ['어린이', '십대', 80000, 100000], ['어린이', '어린이', 70000, 90000],
  ['대학청년·일반', '일반', 120000, 140000], ['대학청년·일반', '십대', 100000, 120000], ['대학청년·일반', '어린이', 80000, 100000],
  ['온라인 청지기', '전체', 75000, 75000], ['온라인 십대', '전체', 55000, 55000],
  ['온라인 어린이', '전체', 40000, 40000], ['온라인 대학청년·일반', '전체', 55000, 55000],
];

/* ═════════════════════════ setup ═════════════════════════ */

function setup2027W() {
  runSafely_('2027W 운영 시트 만들기/정비', () => {
    const N = 6;
    step_(1, N, '2027W/03_등록·재정 폴더에 운영 시트 찾기/만들기');
    const root = DriveApp.getFolderById(ROOT_ID);
    LOG_FOLDER = getOrCreate_(getOrCreate_(root, '00_시스템'), '로그');
    let folder = root;
    TERM_FOLDER_PATH.forEach(n => (folder = getOrCreate_(folder, n)));
    const ss = getOrCreateSheet_(folder, OPS_NAME);
    say_('운영 시트: ' + ss.getUrl());

    step_(2, N, '1차 버전 탭 정리 (데이터 없는 탭만 새 이름으로 교체)');
    migrateOldTabs_(ss);

    step_(3, N, '탭 · 머리글 · 기본값 (설정 · 트랙 · 금액표 · 체크리스트 · 사용법)');
    Object.keys(OPS_TABS).forEach(n => ensureTab_(ss, n, OPS_TABS[n]));
    const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
    fillIfEmpty_(ss.getSheetByName(T.cfg), DEFAULT_SETTINGS);
    fillIfEmpty_(ss.getSheetByName(T.trk), DEFAULT_TRACKS);
    fillIfEmpty_(ss.getSheetByName(T.fee), DEFAULT_FEES);
    ss.getSheetByName(T.trk).getRange('F2:I50').setNumberFormat('yyyy-mm-dd');
    fillOpsReadme_(ss);
    seedChecklist_(ss);

    step_(4, N, '수식 넣기 (입금액 · 입금여부 · 숙소배정 · 등록확인 · 단체 집계 · 숙소 경고)');
    installFormulas_(ss);

    step_(5, N, '보기 탭 (숙소 미배정 · 숙소 현황 · 검색기 · 등록현황) + 서식');
    installViews_(ss);
    styleOps_(ss);

    step_(6, N, '5분 자동 동기화 켜기');
    ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncResponses').forEach(t => ScriptApp.deleteTrigger(t));
    ScriptApp.newTrigger('syncResponses').timeBased().everyMinutes(5).create();
    log_('트리거', 'syncResponses 5분마다', '', '', '성공');
    say_('👉 운영 시트: ' + ss.getUrl());
  });
}

function migrateOldTabs_(ss) {
  Object.keys(OLD_TABS).forEach(old => {
    const sh = ss.getSheetByName(old);
    if (!sh) return;
    const hasData = old === '안내' ? false : readTable_(sh).length > 0;
    if (hasData) {
      log_('탭 정리', old, '', '', '건너뜀', '데이터가 있어 그대로 둠 → 새 탭(' + OLD_TABS[old] + ')으로 옮긴 뒤 옛 탭 삭제');
      return;
    }
    if (ss.getSheets().length > 1) { ss.deleteSheet(sh); log_('탭 정리', old + ' → ' + OLD_TABS[old], '', '', '성공'); }
  });
}

function stopAutoSync() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncResponses').forEach(t => ScriptApp.deleteTrigger(t));
  console.log('자동 동기화 꺼짐');
}

function fillIfEmpty_(sh, rows) {
  if (sh.getLastRow() > 1 || !rows.length) return;
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function fillOpsReadme_(ss) {
  const sh = ss.getSheetByName(T.guide);
  if (sh.getLastRow() > 1) return;
  const rows = [
    ['전체 흐름', '구글폼 → (5분마다 자동) Master_DB(등록) → 숙소 대상 명단 → ANM_DB. 사람은 입금 입력과 숙소 배정만'],
    ['등록 담당', '① Master_DB(등록)는 자동으로 쌓임. 코드·훈련비·선등록이 자동으로 채워짐\n② 이메일·전화·현장 신청: 맨 아래 빈 줄에 경배와찬양학교 구분·교회·이름·성별·구분·연락처를 입력하고 코드는 비워 둠 → 5분 안에 코드·훈련비가 채워짐\n③ 취소: 상태 열에 "취소" (행은 지우지 않음)\n④ 단체: 단체교회별 확인 표의 처리 결과가 "⚠️ 명단 0명"이면 신청 파일을 열어 Master_DB에 직접 입력(단체ID 칸에 같은 단체ID)\n⑤ 접수 로그의 "중복"은 같은 이름+전화가 이미 있어서 건너뛴 것'],
    ['재정 담당', '① 통장 내역을 보며 훈련비 입금 탭에 1건 = 1줄 (날짜·입금자명·입금액·계좌)\n② 대상 코드: 검색기(등록)에서 이름/교회로 찾아 코드 복사. 단체 합산 입금은 단체ID(2027W-G001)\n③ 등록확인 열에 이름·교회·입금여부가 바로 뜸. "⚠️ 없는 코드"면 오타\n④ Master_DB(등록)의 입금액·입금여부는 자동. 거기에 직접 O를 쓰지 않음\n⑤ 환불: 구분 "환불"로 한 줄 추가(금액은 양수). 헌금 등 훈련비 아닌 돈은 구분 "기타"\n⑥ 한 사람이 여러 번 나눠 내면 줄을 여러 개 (합산됨)'],
    ['숙소 담당', '① 숙소 미배정 탭 = 지금 방을 넣어야 할 사람 (입실일·성별·교회 순)\n② 숙소 탭에서 그 사람 줄의 동·호실만 입력 → 미배정 탭에서 사라지고 Master_DB 숙소배정에 표시\n③ 청지기는 1/6~16 연속 숙박(한 줄)\n④ 경고 열: ⚠️정원초과·⚠️성별(방 목록 입력 시), 💰미납\n⑤ 숙소 현황 탭: 밤별 필요 인원 vs 배정 인원'],
    ['코드', '개인 2027W-십대-0001 / 단체 2027W-G001. 이름이 같아도 코드는 다름 → 입금·숙소는 반드시 코드로'],
    ['바꾸면 안 되는 것', 'Master_DB(등록)의 초록 열(입금액~숙소배정), 훈련비 입금의 반영액·등록확인 열, 1행 머리글'],
    ['날짜·금액 변경', '설정·트랙·금액 탭만 고치면 됨 (트랙 날짜를 바꾸면 rebuildNightTable 실행)'],
  ];
  sh.getRange(2, 1, rows.length, 2).setValues(rows).setWrap(true).setVerticalAlignment('top');
  sh.setColumnWidth(1, 120); sh.setColumnWidth(2, 820);
}

function installFormulas_(ss) {
  const reg = ss.getSheetByName(T.reg);
  const R = (c) => L_(T.reg, c);
  reg.getRange(R('입금액') + '1').setFormula(F_('={"입금액";ARRAYFORMULA(IF(<reg:코드>="",,SUMIF([fin:대상 코드],<reg:코드>,[fin:반영액])))}'));
  reg.getRange(R('단체 훈련비') + '1').setFormula(F_('={"단체 훈련비";ARRAYFORMULA(IF((<reg:코드>="")+(<reg:단체ID>=""),,SUMIFS(<reg:훈련비>,<reg:단체ID>,<reg:단체ID>,<reg:상태>,"<>취소")))}'));
  reg.getRange(R('단체 입금') + '1').setFormula(F_('={"단체 입금";ARRAYFORMULA(IF((<reg:코드>="")+(<reg:단체ID>=""),,SUMIF([fin:대상 코드],<reg:단체ID>,[fin:반영액])+SUMIF(<reg:단체ID>,<reg:단체ID>,<reg:입금액>)))}'));
  reg.getRange(R('입금여부') + '1').setFormula(F_('={"입금여부";ARRAYFORMULA(IF(<reg:코드>="",,IF(<reg:상태>="취소","취소",IF(<reg:훈련비>="","금액 확인",' +
    'IF(<reg:단체ID>="",IF(<reg:입금액>>=<reg:훈련비>,"O",IF(<reg:입금액>>0,"부분","미납")),IF(<reg:단체 입금>>=<reg:단체 훈련비>,"O (단체)",IF(<reg:단체 입금>>0,"부분 (단체)","미납 (단체)")))))))}'));
  reg.getRange(R('숙소배정') + '1').setFormula(F_('={"숙소배정";BYROW(<reg:코드>,LAMBDA(c,IF(c="",,IF(COUNTIF([lod:코드],c)=0,"-",' +
    'IFERROR(TEXTJOIN(" / ",TRUE,FILTER([lod:동]&" "&[lod:호실],[lod:코드]=c,[lod:호실]<>"")),"대기")))))}'));

  const fin = ss.getSheetByName(T.fin);
  fin.getRange(L_(T.fin, '반영액') + '1').setFormula(F_('={"반영액";ARRAYFORMULA(IF(<fin:입금액>="",,IF(<fin:구분>="환불",-ABS(<fin:입금액>),IF(<fin:구분>="기타",0,<fin:입금액>))))}'));
  fin.getRange(L_(T.fin, '등록확인') + '1').setFormula(F_('={"등록확인";ARRAYFORMULA(IF(<fin:대상 코드>="",,IFERROR(VLOOKUP(TRIM(<fin:대상 코드>),{[reg:코드],[reg:이름]&" · "&[reg:교회]&" · "&[reg:입금여부]},2,0),' +
    'IFERROR(VLOOKUP(TRIM(<fin:대상 코드>),{[grp:단체ID],[grp:교회/단체명]&" (단체 "&[grp:총 인원 수]&"명) · "&[grp:단체별 입금 완료 여부]},2,0),"⚠️ 없는 코드"))))}'));

  const grp = ss.getSheetByName(T.grp);
  grp.getRange(L_(T.grp, '총 인원 수') + '1').setFormula(F_('={"총 인원 수";ARRAYFORMULA(IF(<grp:단체ID>="",,COUNTIFS([reg:단체ID],<grp:단체ID>,[reg:상태],"<>취소")))}'));
  grp.getRange(L_(T.grp, '총 훈련비 합계') + '1').setFormula(F_('={"총 훈련비 합계";ARRAYFORMULA(IF(<grp:단체ID>="",,SUMIFS([reg:훈련비],[reg:단체ID],<grp:단체ID>,[reg:상태],"<>취소")))}'));
  grp.getRange(L_(T.grp, '현재 입금 총액') + '1').setFormula(F_('={"현재 입금 총액";ARRAYFORMULA(IF(<grp:단체ID>="",,SUMIF([fin:대상 코드],<grp:단체ID>,[fin:반영액])+SUMIF([reg:단체ID],<grp:단체ID>,[reg:입금액])))}'));
  grp.getRange(L_(T.grp, '단체별 입금 완료 여부') + '1').setFormula(F_('={"단체별 입금 완료 여부";ARRAYFORMULA(IF(<grp:단체ID>="",,IF(<grp:총 인원 수>=0,"명단 없음",' +
    'IF(<grp:현재 입금 총액>>=<grp:총 훈련비 합계>,"O",IF(<grp:현재 입금 총액>>0,"미납 ("&TEXT(<grp:총 훈련비 합계>-<grp:현재 입금 총액>,"#,##0")&"원)","미납")))))}'));

  const lod = ss.getSheetByName(T.lod);
  lod.getRange(L_(T.lod, '입금여부') + '1').setFormula(F_('={"입금여부";ARRAYFORMULA(IF(<lod:코드>="",,IFERROR(VLOOKUP(<lod:코드>,{[reg:코드],[reg:입금여부]},2,0),"⚠️ 등록에 없음")))}'));
  const key = F_('<lod:동>&"-"&<lod:호실>');
  const cap = `VLOOKUP(${key},{'${T.rooms}'!F2:F,'${T.rooms}'!D2:D},2,0)`;
  const gen = `VLOOKUP(${key},{'${T.rooms}'!F2:F,'${T.rooms}'!C2:C},2,0)`;
  lod.getRange(L_(T.lod, '경고') + '1').setFormula(F_('={"경고";ARRAYFORMULA(IF((<lod:코드>="")+(<lod:호실>=""),,TRIM(' +
    `IF(IFERROR(${cap},0)>0,IF(COUNTIFS(<lod:동>,<lod:동>,<lod:호실>,<lod:호실>,<lod:입실>,"<"&<lod:퇴실>,<lod:퇴실>,">"&<lod:입실>,<lod:입금여부>,"<>취소")>${cap},"⚠️정원초과 ",""),"")` +
    `&IF(IFERROR(${gen},"")="","",IF(${gen}<><lod:성별>,"⚠️성별 ",""))` +
    '&IF(REGEXMATCH(<lod:입금여부>&"","^O|취소"),"","💰"&<lod:입금여부>))))}'));
  ss.getSheetByName(T.rooms).getRange('F1').setFormula('={"키";ARRAYFORMULA(IF(A2:A="",,A2:A&"-"&B2:B))}');
}

function installViews_(ss) {
  // 숙소 미배정
  const un = ss.getSheetByName(T.un);
  un.clear();
  un.getRange('A1').setValue('🛏 지금 방을 넣어야 할 사람 (숙소 탭에서 동·호실을 입력하면 여기서 사라짐) — 입실일 · 성별 · 교회 순').setFontWeight('bold');
  un.getRange('A2:I2').setValues([OPS_TABS[T.lod].slice(0, 9)]).setFontWeight('bold').setBackground('#f4cccc');
  un.getRange('A3').setFormula(F_(`=IFERROR(SORT(FILTER('${T.lod}'!A2:I,[lod:코드]<>"",[lod:호실]="",[lod:입금여부]<>"취소"),8,TRUE,3,TRUE,6,TRUE),"✅ 미배정 없음")`));
  un.getRange('H3:I').setNumberFormat('m/d(ddd)');
  un.setFrozenRows(2);
  // 검색기 (2026S와 같은 배치: C2에 검색어)
  const se = ss.getSheetByName(T.search);
  se.clear();
  se.getRange('B2').setValue('🔍 검색할 이름 또는 교회명을 입력하세요 :').setFontWeight('bold');
  se.getRange('C2').setBackground('#fff2cc');
  se.getRange('D2').setValue('(전화번호·코드 일부도 가능)');
  const cols = ['코드', '이름', '경배와찬양학교 구분', '교회', '구분', '연락처', '훈련비', '입금여부', '숙소배정', '단체ID', '비고'];
  se.getRange(4, 1, 1, cols.length).setValues([cols.map(c => c === '코드' ? '고유코드' : c)]).setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
  const pick = '{' + cols.map(c => F_(`[reg:${c}]`)).join(',') + '}';
  const hay = ['코드', '단체ID', '이름', '교회', '연락처'].map(c => F_(`[reg:${c}]`)).join('&" "&') + '&" "&SUBSTITUTE(' + F_('[reg:연락처]') + ',"-","")';
  se.getRange('A5').setFormula(`=IF(C2="","",IFERROR(FILTER(${pick},ISNUMBER(SEARCH(C2,${hay}))),"결과 없음"))`);
  se.getRange('G5:G').setNumberFormat('#,##0');
  buildDashboard_(ss);
  rebuildNightTableFor_(ss);
}

function buildDashboard_(ss) {
  const sh = ss.getSheetByName(T.dash);
  sh.clear();
  const tracks = readTable_(ss.getSheetByName(T.trk)).map(r => String(r[0])).filter(Boolean);
  const accts = String(getSetting_(ss, '계좌 목록', '')).split(',').map(s => s.trim()).filter(Boolean);
  const C = (c) => F_(`[reg:${c}]`);
  const NC = `${C('상태')},"<>취소"`;
  // 표 1: 2026S와 같은 구분 × 성별 인원표
  const kinds = [['일반인', null], ['대학청년', ['대학']], ['십대', ['십대', '중고등']], ['어린이', ['어린이']]];
  const ALLKW = ['대학', '십대', '중고등', '어린이'];
  const rows = [['경배와찬양학교 등록 현황', '', '', '', '', '', '', '', '', '', ''],
    ['', '일반인', '', '대학청년', '', '십대', '', '어린이', '', '합계', ''],
    ['', '형제', '자매', '형제', '자매', '형제', '자매', '형제', '자매', '', '']];
  tracks.forEach((t, i) => {
    const r = 4 + i, row = [t];
    kinds.forEach(([k, kw]) => ['형제', '자매'].forEach(g => {
      const base = `COUNTIFS(${C('경배와찬양학교 구분')},$A${r},${C('성별')},"${g}",${NC}`;
      row.push(kw ? '=' + kw.map(k => `${base},${C('구분')},"*${k}*")`).join('+')
        : `=${base})` + ALLKW.map(k => `-${base},${C('구분')},"*${k}*")`).join(''));
    }));
    row.push(`=COUNTIFS(${C('경배와찬양학교 구분')},$A${r},${NC})`, '');
    rows.push(row);
  });
  const e1 = 4 + tracks.length;
  rows.push(['합계'].concat('BCDEFGHIJ'.split('').map(c => `=SUM(${c}4:${c}${e1 - 1})`)).concat(['']));
  rows.push(new Array(11).fill(''));
  // 표 2: 등록 · 재정 · 숙소
  const s2 = rows.length + 1;
  rows.push(['구분', '신청', '선등록', '입금 완료', '부분·미납', '훈련비 합계', '숙소 대기(줄)', '', '', '', '']);
  tracks.forEach((t, i) => {
    const r = s2 + 1 + i;
    rows.push([t, `=COUNTIFS(${C('경배와찬양학교 구분')},$A${r},${NC})`,
      `=COUNTIFS(${C('경배와찬양학교 구분')},$A${r},${C('선등록')},"O",${NC})`,
      `=COUNTIFS(${C('경배와찬양학교 구분')},$A${r},${C('입금여부')},"O*")`,
      `=B${r}-D${r}`,
      `=SUMIFS(${C('훈련비')},${C('경배와찬양학교 구분')},$A${r},${NC})`,
      `=COUNTIFS(${F_('[lod:경배와찬양학교 구분]')},$A${r},${F_('[lod:호실]')},"",${F_('[lod:입금여부]')},"<>취소")`, '', '', '', '']);
  });
  const e2 = s2 + 1 + tracks.length;
  rows.push(['합계'].concat('BCDEFG'.split('').map(c => `=SUM(${c}${s2 + 1}:${c}${e2 - 1})`)).concat(['', '', '', '']));
  rows.push(new Array(11).fill(''));
  const s3 = rows.length + 1;
  const fin = (c) => F_(`[fin:${c}]`);
  rows.push(['재정', '금액', '', '', '', '', '', '', '', '', '']);
  rows.push(['총 입금액 (훈련비 입금 탭)', `=SUMIF(${fin('구분')},"<>환불",${fin('반영액')})`].concat(new Array(9).fill('')));
  accts.forEach(a => rows.push(['└ ' + a, `=SUMIFS(${fin('반영액')},${fin('계좌')},"${a}",${fin('구분')},"<>환불")`].concat(new Array(9).fill(''))));
  rows.push(['환불 합계', `=-SUMIF(${fin('구분')},"환불",${fin('반영액')})`].concat(new Array(9).fill('')));
  rows.push(['훈련비 합계 (청구)', `=F${e2}`].concat(new Array(9).fill('')));
  rows.push(['미수금', `=F${e2}-SUM(${fin('반영액')})`].concat(new Array(9).fill('')));
  rows.push(['⚠️ 대상 코드 오류', `=COUNTIF(${fin('등록확인')},"⚠️*")`].concat(new Array(9).fill('')));
  rows.push(['단체 수', F_('=COUNTA([grp:단체ID])')].concat(new Array(9).fill('')));
  rows.push(['마지막 접수', `=IFERROR(INDEX(SORT('${T.log}'!A2:A,1,FALSE),1),"-")`].concat(new Array(9).fill('')));
  sh.getRange(1, 1, rows.length, 11).setValues(rows);
  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  sh.getRange('B2:J3').setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
  [[1, 2, 2], [3, 2, 2], [5, 2, 2], [7, 2, 2]].forEach(([c]) => sh.getRange(2, c + 1, 1, 2).merge());
  sh.getRange(`A${e1}:K${e1}`).setFontWeight('bold');
  sh.getRange(s2, 1, 1, 7).setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
  sh.getRange(`A${e2}:G${e2}`).setFontWeight('bold');
  sh.getRange(`F${s2 + 1}:F${e2}`).setNumberFormat('#,##0');
  sh.getRange(s3, 1, 1, 2).setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
  sh.getRange(s3 + 1, 2, rows.length - s3 - 1, 1).setNumberFormat('#,##0');
  sh.getRange(rows.length, 2).setNumberFormat('yyyy-mm-dd hh:mm');
  sh.setColumnWidth(1, 200);
}

function rebuildNightTable() {
  const ss = openOps_();
  rebuildNightTableFor_(ss);
  console.log('숙소 현황 표 다시 만듦');
}

function rebuildNightTableFor_(ss) {
  const sh = ss.getSheetByName(T.night);
  sh.clear();
  const tracks = readTable_(ss.getSheetByName(T.trk));
  let min = null, max = null;
  tracks.forEach(r => [[5, 6], [7, 8]].forEach(([a, b]) => {
    const s = toDate_(r[a]), e = toDate_(r[b]);
    if (s && e) { if (!min || s < min) min = s; if (!max || e > max) max = e; }
  }));
  sh.getRange('A1').setValue('🌙 박별 숙소 인원 (그날 밤 자는 사람, 취소 제외)').setFontWeight('bold');
  sh.getRange(2, 1, 1, 6).setValues([['밤', '형제 필요', '형제 배정', '자매 필요', '자매 배정', '대기']]).setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
  if (!min) return;
  const out = [];
  for (let d = new Date(min); d < max; d.setDate(d.getDate() + 1)) {
    const r = 3 + out.length;
    const base = g => F_(`COUNTIFS([lod:성별],"${g}",[lod:입실],"<="&A${r},[lod:퇴실],">"&A${r},[lod:입금여부],"<>취소"`);
    out.push([new Date(d), `=${base('형제')})`, `=${base('형제')},${F_('[lod:호실]')},"<>")`, `=${base('자매')})`, `=${base('자매')},${F_('[lod:호실]')},"<>")`, `=B${r}-C${r}+D${r}-E${r}`]);
  }
  sh.getRange(3, 1, out.length, 6).setValues(out);
  sh.getRange(3, 1, out.length, 1).setNumberFormat('m/d(ddd)');
}

function styleOps_(ss) {
  const reg = ss.getSheetByName(T.reg);
  const R = (c) => L_(T.reg, c);
  reg.getRange(`${R('입금액')}1:${R('숙소배정')}1`).setBackground('#38761d');
  reg.getRange(`${R('상태')}1:${R('비고')}1`).setBackground('#b45f06');
  reg.getRange(`${R('연락처')}2:${R('연락처')}`).setNumberFormat('@');
  reg.getRange(`${R('생년월일')}2:${R('생년월일')}`).setNumberFormat('@');
  reg.getRange(`${R('훈련비')}2:${R('훈련비')}`).setNumberFormat('#,##0');
  reg.getRange(`${R('입금액')}2:${R('단체 입금')}`).setNumberFormat('#,##0');
  reg.getRange(`${R('타임스탬프')}2:${R('타임스탬프')}`).setNumberFormat('yyyy-mm-dd hh:mm');
  reg.setFrozenColumns(4);
  reg.getRange(`${R('상태')}2:${R('상태')}`).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['정상', '취소'], true).setAllowInvalid(true).build());
  reg.getRange(`${R('등록 문자 발송')}2:${R('등록 문자 발송')}1000`).insertCheckboxes();
  reg.getRange(`${R('현장등록 확인여부')}2:${R('현장등록 확인여부')}1000`).insertCheckboxes();
  const fin = ss.getSheetByName(T.fin);
  const Fc = (c) => L_(T.fin, c);
  fin.getRange(`${Fc('반영액')}1:${Fc('등록확인')}1`).setBackground('#38761d');
  fin.getRange(`${Fc('날짜')}2:${Fc('날짜')}`).setNumberFormat('yyyy-mm-dd');
  fin.getRange(`${Fc('입력일')}2:${Fc('입력일')}`).setNumberFormat('yyyy-mm-dd');
  fin.getRange(`${Fc('입금액')}2:${Fc('입금액')}`).setNumberFormat('#,##0');
  fin.getRange(`${Fc('반영액')}2:${Fc('반영액')}`).setNumberFormat('#,##0');
  const accts = String(getSetting_(ss, '계좌 목록', '')).split(',').map(s => s.trim()).filter(Boolean);
  if (accts.length) fin.getRange(`${Fc('계좌')}2:${Fc('계좌')}`).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(accts, true).setAllowInvalid(false).build());
  fin.getRange(`${Fc('구분')}2:${Fc('구분')}`).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['입금', '환불', '기타'], true).setAllowInvalid(false).build());
  fin.setFrozenRows(1);
  fin.setColumnWidth(L_n_(T.fin, '등록확인'), 320);
  const lod = ss.getSheetByName(T.lod);
  lod.getRange('A1:I1').setBackground('#666666');
  lod.getRange('J1:L1').setBackground('#b45f06');
  lod.getRange('M1:N1').setBackground('#38761d');
  lod.getRange('H2:I').setNumberFormat('m/d(ddd)');
  lod.getRange('J2:L').setBackground('#fff2cc');
  lod.setFrozenRows(1);
  const grp = ss.getSheetByName(T.grp);
  grp.getRange(`${L_(T.grp, '총 인원 수')}1:${L_(T.grp, '단체별 입금 완료 여부')}1`).setBackground('#38761d');
  grp.getRange(`${L_(T.grp, '총 훈련비 합계')}2:${L_(T.grp, '현재 입금 총액')}`).setNumberFormat('#,##0');
  // 탭 순서 (2026S와 비슷하게: 현황 → 등록 → 입금 → 단체 → 검색 → 숙소)
  [T.dash, T.reg, T.fin, T.grp, T.search, T.un, T.lod, T.night, T.rooms, T.chk, T.guide, T.log, T.cfg, T.trk, T.fee].forEach((n, i) => {
    const s = ss.getSheetByName(n); if (s) { ss.setActiveSheet(s); ss.moveActiveSheet(i + 1); }
  });
  ss.setActiveSheet(ss.getSheetByName(T.dash));
}

function L_n_(tab, name) { return OPS_TABS[tab].indexOf(name) + 1; }

/* ═════════════════════════ sync ═════════════════════════ */


function openOps_() {
  let folder = DriveApp.getFolderById(ROOT_ID);
  TERM_FOLDER_PATH.forEach(n => { const it = folder.getFoldersByName(n); if (!it.hasNext()) throw new Error('폴더 없음: ' + n); folder = it.next(); });
  const it = folder.getFilesByName(OPS_NAME);
  if (!it.hasNext()) throw new Error('운영 시트가 없습니다. setup2027W를 먼저 실행하세요.');
  return SpreadsheetApp.open(it.next());
}

function syncResponses() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) { console.log('다른 동기화가 실행 중 → 건너뜀'); return; }
  const t0 = Date.now();
  try {
    const ss = openOps_();
    if (String(getSetting_(ss, '자동 동기화', 'ON')).toUpperCase() === 'OFF') { console.log('자동 동기화 OFF'); return; }
    const ctx = loadCtx_(ss);
    console.log('▶ 동기화 시작 (등록 ' + ctx.regRows.length + '명, 처리된 응답 ' + Object.keys(ctx.done).length + '줄)');

    // 1) 응답: 웹 신청 탭(W) + 구글폼 응답 시트(R, 설정에 ID가 있을 때만)
    const sources = [];
    const web = ss.getSheetByName(WEB_TAB);
    if (web) sources.push(['W', web]);
    if (ctx.respId) {
      try { sources.push(['R', SpreadsheetApp.openById(ctx.respId).getSheets()[0]]); }
      catch (e) { console.log('구글폼 응답 시트를 못 엶 (건너뜀): ' + e.message); }
    }
    const newRegs = [], newGroups = [], logs = [];
    let timeUp = false;
    for (const [pfx, sh] of sources) {
      if (timeUp) break;
      const vals = sh.getDataRange().getValues();
      if (vals.length < 2) continue;
      const H = mapResponseHeader_(vals[0]);
      for (let i = 1; i < vals.length; i++) {
        const src = pfx + (i + 1);
        if (ctx.done[src]) continue;
        if (Date.now() - t0 > 4.5 * 60 * 1000) { console.log('⏱ 시간 제한 → 나머지는 다음 동기화'); timeUp = true; break; }
        const row = vals[i];
        if (!row[H.ts]) continue;
        try {
          const r = processResponseRow_(row, H, src, ctx);
          r.regs.forEach(x => newRegs.push(x));
          if (r.group) newGroups.push(r.group);
          logs.push([new Date(), src, r.result, r.note]);
          console.log('   ' + src + ' ' + r.result + ' ' + r.note);
        } catch (e) {
          logs.push([new Date(), src, '실패', e.message]);
          console.log('   ' + src + ' 실패 ' + e.message);
        }
      }
    }
    const reg = ss.getSheetByName(T.reg);
    if (newRegs.length) reg.getRange(lastInputRow_(reg) + 1, 1, newRegs.length, REG_INPUT_COLS).setValues(newRegs);
    if (newGroups.length) { const g = ss.getSheetByName(T.grp); g.getRange(lastFilled_(g, 1) + 1, 1, newGroups.length, 13).setValues(newGroups); }
    if (logs.length) { const l = ss.getSheetByName(T.log); l.getRange(lastFilled_(l, 1) + 1, 1, logs.length, 4).setValues(logs); }

    // 2) 수기 행 보정 (코드·훈련비·선등록·계좌 빈 칸만)
    const fixed = fillManualRows_(ss, ctx);

    // 3) 숙소 대상 줄 추가
    const lodAdded = syncLodging_(ss, ctx);

    // 4) ANM_DB
    let db = 0;
    if (String(getSetting_(ss, 'DB 연동', 'ON')).toUpperCase() !== 'OFF') {
      try { db = syncToDb_(ss, ctx); } catch (e) { console.log('DB 연동 실패(다음에 재시도): ' + e.message); }
    }
    SpreadsheetApp.flush();
    const failed = logs.filter(l => l[2] === '실패');
    if (failed.length) alert_('신청 동기화', failed.map(l => l[1] + ' ' + l[3]).join('\n'));
    console.log('✅ 끝: 새 등록 ' + newRegs.length + '명 · 단체 ' + newGroups.length + ' · 수기 보정 ' + fixed + ' · 숙소 줄 +' + lodAdded + ' · DB +' + db +
      ' (' + Math.round((Date.now() - t0) / 1000) + '초)');
  } finally { lock.releaseLock(); }
}

function loadCtx_(ss) {
  const reg = ss.getSheetByName(T.reg);
  const n = lastInputRow_(reg) - 1;
  const regRows = n > 0 ? reg.getRange(2, 1, n, REG_INPUT_COLS).getValues() : [];
  const logSh = ss.getSheetByName(T.log);
  const done = {};
  readTable_(logSh).forEach(r => { if (r[1]) done[r[1]] = 1; });
  const seq = {}, dupe = {};
  regRows.forEach(r => {
    const m = String(r[COL.코드]).match(/-(.+)-(\d{4})$/);
    if (m) seq[m[1]] = Math.max(seq[m[1]] || 0, Number(m[2]));
    const k = personKey_(r[COL.이름], r[COL.연락처], r[COL.생년월일]);
    if (k) dupe[k] = r[COL.코드] || '(코드 없음)';
  });
  let gseq = 0;
  readTable_(ss.getSheetByName(T.grp)).forEach(r => { const m = String(r[0]).match(/-G(\d+)$/); if (m) gseq = Math.max(gseq, Number(m[1])); });
  return {
    term: String(getSetting_(ss, '학기코드', '2027W')),
    respId: String(getSetting_(ss, '응답 시트 ID', '')),
    deadline: toDate_(getSetting_(ss, '선등록 마감', '')),
    tracks: readTable_(ss.getSheetByName(T.trk)),
    fees: readTable_(ss.getSheetByName(T.fee)),
    regRows, done, seq, dupe, gseq,
  };
}

/* ── 응답 한 줄 처리 (순수 로직: ctx만 사용) ── */

function processResponseRow_(row, H, src, ctx) {
  const trackRaw = String(row[H.track] || '');
  const track = matchTrack_(trackRaw, ctx.tracks);
  const isGroup = /단체/.test(String(row[H.method] || ''));
  const ts = row[H.ts] instanceof Date ? row[H.ts] : new Date(row[H.ts]);
  if (!isGroup) {
    const p = {
      트랙: track ? track[0] : trackRaw, 등록경로: src.charAt(0) === 'W' ? '웹 개인' : '개인폼', 이름: str_(row[H.name]), 성별: normGender_(row[H.gender]),
      생년월일: normBirth_(row[H.birth]), 구분: str_(row[H.type]), 직분: str_(row[H.role]),
      연락처: normPhone_(row[H.phone]).phone, 이메일: str_(row[H.email]), 주소: str_(row[H.addr]), 교회: str_(row[H.church]),
      '기존 훈련': str_(row[H.prior]), 학교: str_(row[H.school]), 학과: str_(row[H.major]), 학년: str_(row[H.grade]),
      직장: str_(row[H.job]), 기도제목: str_(row[H.prayer]), 제출일시: ts, 원본: src,
    };
    const k = personKey_(p.이름, p.연락처, p.생년월일);
    if (k && ctx.dupe[k]) return { regs: [], result: '중복', note: p.이름 + ' → 이미 ' + ctx.dupe[k] };
    const r = buildRegRow_(p, '', track, ctx);
    if (k) ctx.dupe[k] = r[COL.코드];
    return { regs: [r], result: '추가', note: r[COL.코드] + ' ' + p.이름 + (track ? '' : ' ⚠️트랙 인식 실패') };
  }
  // 단체
  const gid = ctx.term + '-G' + String(++ctx.gseq).padStart(3, '0');
  const church = str_(row[H.g_church]);
  const files = H.g_file < 0 ? [] : String(row[H.g_file] || '').split(/[,\s]+/).map(u => (u.match(/[-\w]{25,}/) || [])[0]).filter(Boolean);
  let inline = null;   // 웹 신청서: 명단을 JSON으로 받음
  if (H.g_members !== undefined && H.g_members >= 0 && String(row[H.g_members] || '').trim()) {
    try { inline = JSON.parse(String(row[H.g_members])); } catch (e) { inline = null; }
  }
  const group = [gid, ts, church, track ? track[0] : trackRaw, str_(row[H.g_pastor]), str_(row[H.g_pastorAttend]),
    normPhone_(row[H.g_pastorPhone]).phone, str_(row[H.g_leader]), normPhone_(row[H.g_leaderPhone]).phone,
    str_(row[H.g_email]), inline ? '웹 신청 명단 ' + inline.length + '명' : files.map(id => 'https://drive.google.com/open?id=' + id).join('\n'), '', src];
  const regs = []; const notes = []; let dup = 0;
  const addMember = (m) => {
    const p = Object.assign(m, { 트랙: track ? track[0] : trackRaw, 등록경로: inline ? '웹 단체' : '단체폼', 교회: church, 제출일시: ts, 원본: src });
    const k = personKey_(p.이름, p.연락처, p.생년월일);
    if (k && ctx.dupe[k]) { dup++; notes.push(p.이름 + '(중복 ' + ctx.dupe[k] + ')'); return; }
    const r = buildRegRow_(p, gid, track, ctx);
    if (k) ctx.dupe[k] = r[COL.코드];
    regs.push(r);
  };
  if (inline) {
    inline.forEach(m => {
      const name = str_(m.name);
      if (!name) return;
      addMember({ 이름: name, 성별: normGender_(m.gender), 연락처: normPhone_(m.phone).phone, 이메일: str_(m.email),
        생년월일: normBirth_(m.birth), 구분: str_(m.category), '기존 훈련': str_(m.training), 비고: str_(m.note) });
    });
  } else {
    files.forEach(id => {
      try { readGroupFile_(id).forEach(addMember); } catch (e) { notes.push('파일 읽기 실패: ' + e.message); }
    });
  }
  group[11] = (regs.length ? '✔ ' + regs.length + '명 등록' : '⚠️ 명단 0명 → 수기 입력 필요') + (dup ? ' · 중복 ' + dup : '') + (notes.length ? ' · ' + notes.join(', ') : '');
  return { regs, group, result: regs.length ? '추가(단체)' : '실패', note: gid + ' ' + church + ' ' + regs.length + '명' + (notes.length ? ' · ' + notes.join(', ') : '') };
}

function buildRegRow_(p, gid, track, ctx) {
  const key = track ? String(track[1]) : '기타';
  ctx.seq[key] = (ctx.seq[key] || 0) + 1;
  const code = ctx.term + '-' + key + '-' + String(ctx.seq[key]).padStart(4, '0');
  const pre = isPre_(p.제출일시, ctx.deadline);
  const fee = track ? calcFee_(track[0], p.구분, pre, ctx.fees) : '';
  const r = new Array(REG_INPUT_COLS).fill('');
  Object.keys(p).forEach(h => { if (COL[h] !== undefined && COL[h] < REG_INPUT_COLS) r[COL[h]] = p[h]; });
  r[COL.코드] = code; r[COL.단체ID] = gid; r[COL.선등록] = pre ? 'O' : 'X'; r[COL.훈련비] = fee; r[COL.계좌] = track ? track[4] : '';
  return r;
}

function fillManualRows_(ss, ctx) {
  const reg = ss.getSheetByName(T.reg);
  const n = lastInputRow_(reg) - 1;
  if (n < 1) return 0;
  const rg = reg.getRange(2, 1, n, REG_INPUT_COLS), v = rg.getValues();
  let changed = 0;
  v.forEach(r => {
    if (!str_(r[COL.이름])) return;
    let c = false;
    const track = ctx.tracks.find(t => t[0] === str_(r[COL.트랙])) || matchTrack_(str_(r[COL.트랙]), ctx.tracks);
    if (!r[COL.코드]) {
      const key = track ? String(track[1]) : '기타';
      ctx.seq[key] = (ctx.seq[key] || 0) + 1;
      r[COL.코드] = ctx.term + '-' + key + '-' + String(ctx.seq[key]).padStart(4, '0');
      if (!r[COL.등록경로]) r[COL.등록경로] = '수기';
      if (!r[COL.제출일시]) r[COL.제출일시] = new Date();
      c = true;
    }
    if (track && r[COL.트랙] !== track[0]) { r[COL.트랙] = track[0]; c = true; }
    if (r[COL.선등록] === '') { r[COL.선등록] = isPre_(r[COL.제출일시], ctx.deadline) ? 'O' : 'X'; c = true; }
    if (r[COL.훈련비] === '' && track) { r[COL.훈련비] = calcFee_(track[0], r[COL.구분], r[COL.선등록] === 'O', ctx.fees); c = true; }
    if (r[COL.계좌] === '' && track) { r[COL.계좌] = track[4]; c = true; }
    if (r[COL.연락처] !== '' && typeof r[COL.연락처] === 'number') { r[COL.연락처] = normPhone_(r[COL.연락처]).phone; c = true; }
    if (c) changed++;
  });
  if (changed) rg.setValues(v);
  ctx.regRows = v;
  return changed;
}

function syncLodging_(ss, ctx) {
  const lod = ss.getSheetByName(T.lod);
  const have = {};
  readTable_(lod).forEach(r => (have[r[0] + '|' + r[6]] = 1));
  const out = [];
  ctx.regRows.forEach(r => {
    const code = r[COL.코드]; if (!code) return;
    const t = ctx.tracks.find(x => x[0] === r[COL.트랙]);
    if (!t || t[3] !== '현장') return;
    [[5, 6, '1'], [7, 8, '2']].forEach(([a, b, seg]) => {
      const s = toDate_(t[a]), e = toDate_(t[b]);
      if (!s || !e || have[code + '|' + seg]) return;
      out.push([code, r[COL.이름], r[COL.성별], r[COL.구분], r[COL.트랙], r[COL.교회], seg, s, e]);
      have[code + '|' + seg] = 1;
    });
  });
  if (out.length) lod.getRange(lastFilled_(lod, 1) + 1, 1, out.length, 9).setValues(out);
  return out.length;
}

/* ── ANM_DB 연동: 교회 매칭 · 사람 · 참석 ── */

function syncToDb_(ss, ctx) {
  const reg = ss.getSheetByName(T.reg);
  const n = lastInputRow_(reg) - 1;
  if (n < 1) return 0;
  const rg = reg.getRange(2, 1, n, REG_INPUT_COLS), v = rg.getValues();
  const todo = v.filter(r => r[COL.코드] && r[COL.이름] && !r[COL.DB개인코드]);
  if (!todo.length) return 0;
  const db = openDb_();
  const shC = db.getSheetByName('교회'), shP = db.getSheetByName('사람'), shA = db.getSheetByName('참석');
  const churches = readTable_(shC), people = readTable_(shP), attend = readTable_(shA);
  const res = planDbSync_(v, churches, people, attend, ctx.term, todayStr_());
  if (res.newChurches.length) shC.getRange(lastFilled_(shC, 1) + 1, 1, res.newChurches.length, res.newChurches[0].length).setValues(res.newChurches);
  if (res.newPeople.length) shP.getRange(lastFilled_(shP, 1) + 1, 1, res.newPeople.length, res.newPeople[0].length).setValues(res.newPeople);
  if (res.newAttend.length) shA.getRange(lastFilled_(shA, 1) + 1, 1, res.newAttend.length, res.newAttend[0].length).setValues(res.newAttend);
  rg.setValues(v); // 교회코드·DB개인코드 채워진 v
  return res.newAttend.length;
}

/** v(등록 행들)를 직접 수정해 교회코드·DB개인코드를 채우고, DB에 추가할 행들을 돌려준다 */
function planDbSync_(v, churches, people, attend, term, today) {
  const ckey = {}; let cmax = 0;
  churches.forEach(r => {
    const m = String(r[0]).match(/^C(\d+)$/); if (m) cmax = Math.max(cmax, Number(m[1]));
    [r[1], r[2]].concat(String(r[3] || '').split(' / ')).forEach(x => { const k = nameKey_(x); if (k) ckey[k] = ckey[k] || r[0]; });
  });
  const pkey = {}; let pmax = 0;
  people.forEach(r => {
    const m = String(r[0]).match(/^P(\d+)$/); if (m) pmax = Math.max(pmax, Number(m[1]));
    const k = personKey_(r[1], r[4], r[2]); if (k) pkey[k] = r[0];
  });
  const seen = {}; let amax = 0;
  attend.forEach(r => {
    const m = String(r[0]).match(/^A(\d+)$/); if (m) amax = Math.max(amax, Number(m[1]));
    if (r[3]) seen[r[1] + '|' + r[3]] = 1;
  });
  const JUNK = { '': 1, '없음': 1, '무': 1, 'x': 1, '-': 1, '.': 1, '무교회': 1, '해당없음': 1 };
  const newChurches = [], newPeople = [], newAttend = [];
  v.forEach(r => {
    if (!r[COL.코드] || !r[COL.이름] || r[COL.DB개인코드]) return;
    const ck = nameKey_(r[COL.교회]);
    let cc = r[COL.교회코드] || '';
    if (!cc && !JUNK[ck]) {
      cc = ckey[ck];
      if (!cc) {
        cc = 'C' + String(++cmax).padStart(4, '0'); ckey[ck] = cc;
        newChurches.push([cc, str_(r[COL.교회]), ck, '', '', '', '', '', '', '', '', '', '', '', term + ' 신청', '신규(자동)']);
      }
    }
    r[COL.교회코드] = cc;
    const pk = personKey_(r[COL.이름], r[COL.연락처], r[COL.생년월일]);
    let pc = pk && pkey[pk];
    if (!pc) {
      pc = 'P' + String(++pmax).padStart(5, '0'); if (pk) pkey[pk] = pc;
      newPeople.push([pc, str_(r[COL.이름]), str_(r[COL.생년월일]), str_(r[COL.성별]), str_(r[COL.연락처]), str_(r[COL.이메일]),
        cc, str_(r[COL.교회]), '', '', '', '', '', '', term + ' ' + r[COL.등록경로], '']);
    }
    r[COL.DB개인코드] = pc;
    if (!seen[term + '|' + pc]) {
      seen[term + '|' + pc] = 1;
      newAttend.push(['A' + String(++amax).padStart(5, '0'), term, cc, pc, str_(r[COL.트랙]), 1, str_(r[COL.등록경로]), term + ' 등록 ' + r[COL.코드], today, '']);
    }
  });
  return { newChurches, newPeople, newAttend };
}

/* ── 단체 신청 파일 → 사람 목록 ── */

function readGroupFile_(fileId) {
  const f = DriveApp.getFileById(fileId);
  let ssId = fileId, temp = null;
  if (f.getMimeType() !== MimeType.GOOGLE_SHEETS) {
    const res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '/copy?supportsAllDrives=true', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({ name: '_tmp_단체신청_' + fileId, mimeType: MimeType.GOOGLE_SHEETS }),
    });
    if (res.getResponseCode() !== 200) throw new Error('변환 실패 ' + res.getResponseCode());
    ssId = temp = JSON.parse(res.getContentText()).id;
    Utilities.sleep(1500);
  }
  try {
    return parseGroupValues_(SpreadsheetApp.openById(ssId).getSheets()[0].getDataRange().getValues());
  } finally { if (temp) try { DriveApp.getFileById(temp).setTrashed(true); } catch (e) {} }
}

function parseGroupValues_(values) {
  let hr = -1;
  for (let i = 0; i < Math.min(values.length, 15); i++) if (values[i].some(x => cleanHeader_(x) === '이름')) { hr = i; break; }
  if (hr < 0) throw new Error('"이름" 머리글 없음');
  const h = values[hr].map(cleanHeader_);
  const find = (...keys) => { for (const k of keys) { const i = h.findIndex(x => x === k || x.indexOf(k) === 0); if (i !== -1) return i; } return -1; };
  const c = { name: find('이름'), gender: find('성별'), phone: find('연락처', '전화'), email: find('E-mail', '이메일', 'Email'),
    birth: find('생년월일'), type: find('구분'), prior: find('기존훈련', '기존 훈련'), note: find('비고') };
  const g = (r, i) => (i < 0 ? '' : r[i]);
  const out = [];
  for (let i = hr + 1; i < values.length; i++) {
    const r = values[i]; const name = str_(g(r, c.name));
    if (!name || /^(예시|ex|홍길동)/i.test(name)) continue;
    out.push({ 이름: name, 성별: normGender_(g(r, c.gender)), 연락처: normPhone_(g(r, c.phone)).phone, 이메일: str_(g(r, c.email)),
      생년월일: normBirth_(g(r, c.birth)), 구분: str_(g(r, c.type)), '기존 훈련': str_(g(r, c.prior)), 비고: str_(g(r, c.note)) });
  }
  return out;
}

/* ── 작은 도우미 (순수) ── */

function mapResponseHeader_(hdr) {
  const h = hdr.map(cleanHeader_);
  const gStart = h.findIndex(x => x === '교회명');
  const lim = gStart === -1 ? h.length : gStart;
  const find = (key, from, to) => {
    for (let i = from; i < to; i++) if (h[i] === key) return i;
    for (let i = from; i < to; i++) if (h[i].indexOf(key) === 0) return i;
    return -1;
  };
  const P = (k) => find(k, 0, lim), G = (k) => (gStart === -1 ? -1 : find(k, gStart, h.length));
  return {
    ts: P('타임스탬프'), track: P('훈련받고자'), method: P('신청 방법'), name: P('이름'), gender: P('성별'), birth: P('생년월일'),
    email: P('E-mail'), phone: P('연락처'), addr: P('주소'), church: P('참석 교회'), role: P('직분'), school: P('학교'),
    major: P('학과'), grade: P('학년'), job: P('직장'), type: P('구분'), prior: P('기존 훈련'), prayer: P('기도제목'),
    g_church: gStart, g_pastor: G('교역자명'), g_pastorAttend: G('교역자 참석'), g_pastorPhone: G('교역자 연락처'),
    g_leader: G('인솔자명'), g_leaderPhone: G('인솔자 연락처'), g_email: G('E-mail'), g_addr: G('주소'), g_prayer: G('기도제목'),
    g_file: G('단체 신청'), g_members: G('단체 명단'),
  };
}

function matchTrack_(text, tracks) {
  const t = String(text || '');
  if (!t) return null;
  for (const r of tracks) {
    const keys = String(r[2] || '').split('+').map(s => s.trim()).filter(Boolean);
    if (!keys.length) continue;
    if (keys.every(k => t.indexOf(k) !== -1) && (r[3] === '온라인' || t.indexOf('온라인') === -1)) return r;
  }
  return null;
}

function feeGroup_(type) {
  const s = String(type || '');
  if (s.indexOf('어린이') !== -1) return '어린이';
  if (s.indexOf('십대') !== -1 || s.indexOf('청소년') !== -1 || s.indexOf('중고등') !== -1 || /중학|고등/.test(s)) return '십대';
  return '일반';
}

function calcFee_(trackName, type, pre, fees) {
  const g = feeGroup_(type);
  const row = fees.find(r => r[0] === trackName && r[1] === g) || fees.find(r => r[0] === trackName && r[1] === '전체') ||
              fees.find(r => r[0] === trackName && r[1] === '일반');
  return row ? Number(pre ? row[2] : row[3]) : '';
}

function isPre_(when, deadline) {
  if (!deadline || !when) return false;
  const d = when instanceof Date ? when : new Date(when);
  if (isNaN(d)) return false;
  const k = Utilities.formatDate(d, 'Asia/Seoul', 'yyyyMMdd');
  const dl = Utilities.formatDate(deadline, 'Asia/Seoul', 'yyyyMMdd');
  return k <= dl;
}

function toDate_(v) {
  if (v instanceof Date) return v;
  const m = String(v || '').match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function normGender_(v) {
  const s = str_(v);
  if (/^(형|남)/.test(s)) return '형제';
  if (/^(자|여)/.test(s)) return '자매';
  return s;
}

function normBirth_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  const d = String(v == null ? '' : (typeof v === 'number' ? Math.round(v) : v)).replace(/\D/g, '');
  if (/^(19|20)\d{6}$/.test(d)) return d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6);
  if (/^\d{6}$/.test(d)) { const y = Number(d.slice(0, 2)); return (y > 30 ? '19' : '20') + d.slice(0, 2) + '-' + d.slice(2, 4) + '-' + d.slice(4); }
  return str_(v);
}

/** 중복 판정 키: 이름+전화(숫자) → 전화가 없으면 이름+생년월일 → 둘 다 없으면 판정 안 함 */
function personKey_(name, phone, birth) {
  const n = String(name || '').replace(/\s/g, '');
  if (!n) return '';
  let d = String(phone || '').split('/')[0].replace(/\D/g, '');
  if (d && d[0] !== '0') d = '0' + d;
  if (d.length >= 9) return n + '_' + d;
  const b = String(birth || '').replace(/\D/g, '');
  return b.length >= 6 ? n + '_b' + b : '';
}

function str_(v) { return v == null ? '' : String(v).trim(); }

function getSetting_(ss, key, def) {
  const r = readTable_(ss.getSheetByName(T.cfg)).find(x => x[0] === key);
  return r && r[1] !== '' ? r[1] : def;
}

function readTable_(sh) {
  const n = sh.getLastRow();
  return n > 1 ? sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues().filter(r => r.some(x => x !== '')) : [];
}

/** 열 c(1-based) 기준 마지막으로 값이 있는 행 번호 (수식 열이 아래까지 차 있어도 정확) */
function lastFilled_(sh, c) {
  const n = sh.getLastRow(); if (n < 2) return 1;
  const v = sh.getRange(1, c, n, 1).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (v[i][0] !== '') return i + 1;
  return 1;
}

/** 등록 탭 입력 구역(A~Z)에서 마지막으로 값이 있는 행 */
function lastInputRow_(reg) {
  const n = reg.getLastRow(); if (n < 2) return 1;
  const v = reg.getRange(1, 1, n, REG_INPUT_COLS).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (v[i].some(x => x !== '')) return i + 1;
  return 1;
}

/* ═════════════════════════ 체크리스트 (2026-10-16 기준) ═════════════════════════ */

const CHECKLIST = [
  // 결정 필요
  ['① 결정 필요', '폼 소유 계정', '2027W 폼·응답시트가 7000school 소유. 단체 신청 xlsx 업로드 파일은 폼 소유자 드라이브에 저장돼 anmschool 스크립트가 못 읽을 수 있음 → anmschool에서 폼 사본을 만들어 교체(링크 바뀜) 또는 업로드 폴더를 anmschool에 공유', '신청 오픈 전'],
  ['① 결정 필요', '선등록 판정 기준', '현재 폼 제출일(12/27 포함) 기준. 마감일만 바뀌면 설정 탭 수정, 입금일 기준으로 바뀌면 스크립트 수정 필요', '신청 오픈 전'],
  ['① 결정 필요', '4트랙 일정표', 'Memo의 일정표가 아직 2026S(7/27~8/2). 십대·어린이·대학청년·청지기 2027W 일정표 확정', ''],
  ['① 결정 필요', '초대의 글', '본문 "미정"', ''],
  ['① 결정 필요', '주제 성경구절', '표지는 ‘얽매이지 않는 삶’ (엡 3:8), 초대의 글은 (고전 6:12). 엡 3:8은 2026S 주제 구절 → 하나로 확정', ''],
  ['① 결정 필요', '청지기 주말 이동', '1/6~16 연속 숙박(주말 귀가 없음) 확정', ''],
  ['① 결정 필요', '폼 트랙 선택지 문구', '트랙 탭 키워드(청지기/십대/어린이/대학/온라인)가 선택지에 들어가야 자동 인식. 온라인 선택지는 "온라인 + 트랙명" 형태로', '신청 오픈 전'],
  ['① 결정 필요', '구분별 요율', '선교사·교사 교역자·자영업자 등은 "일반" 요율로 계산(2026S와 동일). 다르면 금액 탭 수정', ''],
  ['① 결정 필요', '개인정보 동의 문항', '폼에 수집·이용 동의 + 홍보 연락 동의(선택) + 14세 미만 보호자 동의 문항 추가 여부', '신청 오픈 전'],
  ['① 결정 필요', '등록 완료 안내 방식', '입금 확인 후 문자(수동) / 메일 자동 발송 중 선택', ''],
  ['① 결정 필요', '참가자 웹앱', '2026S Vercel 웹앱을 2027W에도 쓸지 (쓰면 운영 시트 직접 공개 대신 API 방식 필수)', ''],
  ['① 결정 필요', '숙소 배정 담당·방 목록', '배정 담당자, 사용할 동·호실·정원·성별 (방 목록 탭에 넣으면 정원 초과·성별 경고 자동)', '12월 중'],
  ['① 결정 필요', '재정 입력 담당', '재정 탭 수기 입력 담당자와 입력 주기(매일 등)', '신청 오픈 전'],
  // 준비
  ['② 준비', '운영 시트 테스트', '폼 테스트 제출 3건(개인·단체·온라인) → syncResponses → 등록·숙소·현황·ANM_DB 확인 → 테스트 행·접수 로그·DB 행 삭제', '신청 오픈 전'],
  ['② 준비', '단체 신청 양식 정비', '2026S 양식: 성별 드롭다운이 "형제,자"(자매 오타)·예시 데이터가 실제 명단으로 남아 있음 → 빈 2027W 양식으로 새로 만들고 폼·홈페이지 링크 교체', '신청 오픈 전'],
  ['② 준비', '브로셔 확정·디자인', '아래 ③ 점검 항목 반영 후 디자인 → 인쇄 업체', ''],
  ['② 준비', '신청 링크·QR 갱신', '폼 링크가 바뀌면 브로셔·QR·링크트리·카카오 채널 모두 교체', ''],
  ['② 준비', '이탈 교회 재초청', 'ANM_DB 재초청 대상 탭: "주의" 37곳(2025~2026 참석 후 2026S 미참석)부터 연락, 연락 여부 체크', '선등록 마감 전'],
  ['② 준비', '보안 정리', '2026S 운영 시트 링크 공유 해제 · Memo 평문 비밀번호 삭제·변경 · 인쇄 업체 비밀번호 변경', ''],
  ['② 준비', '7000school 소유 파일 이관', '2027W 폴더 안 7000school·개인계정 소유 파일 → anmschool 사본으로 교체', ''],
  // 점검 내역
  ['③ 점검 (브로셔)', '연도 오기', '청지기 일정·훈련비 안내 1~5번 날짜가 "2026년 1월"로 표기 → 2027년', ''],
  ['③ 점검 (브로셔)', '청지기 기간', '훈련 안내 4번 "5박 6일" → 10박 11일 (1/6~16)', ''],
  ['③ 점검 (브로셔)', '학기명', '훈련 안내 5번 "2026년 WINTER" → 2027년 WINTER', ''],
  ['③ 점검 (브로셔)', '정숙 시간', '"24:00 이후 정숙" ↔ 일정표 22:30 개인기도·23:00 취침. 하나로 맞추기', ''],
  ['③ 점검 (브로셔)', '온라인 계좌', '브로셔 표 1005-404-679551 → 1005-604-700231 (확정)', ''],
  ['③ 점검 (브로셔)', '이메일 오타', '"7000school@gmail.co m" 링크·표기 깨짐', ''],
  ['③ 점검 (브로셔)', '프로그램 설명', '침묵기도·저녁성회·주제강의·학습센터 설명이 2026S 주제(엡 3:8 지극히 작은 자) 그대로', ''],
  ['③ 점검 (브로셔)', '오타', '7000모임 설명 "예빼" → 예배, "개다감" → 기대감', ''],
  ['③ 점검 (브로셔)', '환불 규정 경계', '"12/27까지 100%"와 "12/27~1/10 50%"가 12/27에서 겹침 → 12/28~1/10 50%', ''],
];

function seedChecklist_(ss) {
  const sh = ss.getSheetByName(T.chk);
  if (sh.getLastRow() > 1) return;
  const rows = CHECKLIST.map(r => [r[0], r[1], r[2], r[3], '', false, '']);
  sh.getRange(2, 1, rows.length, 7).setValues(rows);
  sh.getRange(2, 6, rows.length, 1).insertCheckboxes();
  sh.getRange(2, 3, rows.length, 1).setWrap(true);
  sh.setColumnWidth(1, 120); sh.setColumnWidth(2, 150); sh.setColumnWidth(3, 560); sh.setColumnWidth(4, 100);
  sh.setFrozenRows(1);
  const rule = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$F2=TRUE')
    .setFontColor('#999999').setStrikethrough(true).setRanges([sh.getRange('A2:G200')]).build();
  sh.setConditionalFormatRules([rule]);
}
