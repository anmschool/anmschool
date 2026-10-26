/**
 * ANM_DB 만들기 + 과거 통계 이관 (경배와찬양학교 원천 데이터베이스)
 * ------------------------------------------------------------
 * 실행 계정: anmschool@anminspirational.com
 * 넣는 곳: 01_setupDriveStructure 와 '같은 프로젝트'에 새 파일(+ → 스크립트)로 추가
 *          (진행 표시·로그 함수를 01 파일에서 같이 씁니다)
 *
 * 실행 순서
 *   1) buildAnmDb   : DB 시트 생성 + 통계.xlsx 이관 + 지표 계산 (1회)
 *   2) refreshDB    : 교회 상태·지표·재초청 대상 다시 계산 (데이터 바뀔 때마다, 여러 번 OK)
 *
 * 원칙
 *   - 참석 탭이 원천. 교회 탭의 첫/최근 참석, 상태, 지표, 재초청 대상은 refreshDB가 계산해서 덮어씀
 *   - 재초청 대상 탭의 '재초청 메모', '연락 여부'(손으로 쓰는 칸)는 다시 계산해도 보존
 *   - 이미 이관된 탭은 다시 이관하지 않음 (여러 번 실행해도 안전)
 */

const DB_NAME = 'ANM_DB';
const STATS_XLSX_ID = '1iPNKkbVfFmF1dcvpJHpBh8snvRqqkWET'; // 경배와찬양학교 통계.xlsx
const STATS_CONVERTED_NAME = '경배와찬양학교 통계 (구글시트 변환본)';

// 통계.xlsx '경배와찬양학교 인원 총계' 탭을 정규화한 값 (2026-10-16 추출, 개인정보 없음)
// t=학기, v=장소, n=총인원(원본 합계 셀 값), r=[과정, 세부, 구분, 성별, 인원]
const HEADCOUNT = [{"t":"2018W","v":"","n":689,"r":[["일반인 경찬학교","","일반인","형제",26],["일반인 경찬학교","","일반인","자매",41],["일반인 경찬학교","","학생","형제",16],["일반인 경찬학교","","학생","자매",19],["일반인 경찬학교","","어린이","형제",3],["일반인 경찬학교","","어린이","자매",4],["어린이 경찬학교","","일반인","형제",15],["어린이 경찬학교","","일반인","자매",50],["어린이 경찬학교","","어린이","형제",75],["어린이 경찬학교","","어린이","자매",93],["중고등부 경찬학교","","일반인","형제",21],["중고등부 경찬학교","","일반인","자매",33],["중고등부 경찬학교","","학생","형제",152],["중고등부 경찬학교","","학생","자매",137],["중고등부 경찬학교","","어린이","형제",1],["중고등부 경찬학교","","어린이","자매",1],["시편학교","","일반인","자매",2]]},{"t":"2018S","v":"","n":823,"r":[["일반인 경찬학교","","일반인","형제",23],["일반인 경찬학교","","일반인","자매",54],["일반인 경찬학교","","학생","형제",5],["일반인 경찬학교","","학생","자매",1],["일반인 경찬학교","","어린이","형제",1],["일반인 경찬학교","","어린이","자매",1],["일반인 추가","","일반인","형제",4],["일반인 추가","","일반인","자매",30],["일반인 추가","","학생","자매",4],["일반인 추가","","어린이","형제",2],["일반인 추가","","어린이","자매",3],["어린이 경찬학교","","일반인","형제",18],["어린이 경찬학교","","일반인","자매",60],["어린이 경찬학교","","학생","형제",3],["어린이 경찬학교","","학생","자매",4],["어린이 경찬학교","","어린이","형제",66],["어린이 경찬학교","","어린이","자매",76],["중고등부 경찬학교","","일반인","형제",61],["중고등부 경찬학교","","일반인","자매",109],["중고등부 경찬학교","","학생","형제",131],["중고등부 경찬학교","","학생","자매",133],["중고등부 경찬학교","","어린이","형제",18],["중고등부 경찬학교","","어린이","자매",16]]},{"t":"2019W","v":"","n":675,"r":[["대학청년 경찬학교","","일반인","형제",46],["대학청년 경찬학교","","일반인","자매",52],["대학청년 경찬학교","","학생","형제",4],["대학청년 경찬학교","","학생","자매",10],["대학청년 경찬학교","","어린이","형제",3],["대학청년 경찬학교","","어린이","자매",1],["어린이 경찬학교","","일반인","형제",14],["어린이 경찬학교","","일반인","자매",32],["어린이 경찬학교","","학생","형제",6],["어린이 경찬학교","","학생","자매",14],["어린이 경찬학교","","어린이","형제",68],["어린이 경찬학교","","어린이","자매",57],["중고등부 경찬학교","","일반인","형제",30],["중고등부 경찬학교","","일반인","자매",39],["중고등부 경찬학교","","학생","형제",154],["중고등부 경찬학교","","학생","자매",134],["중고등부 경찬학교","","어린이","형제",1],["중고등부 경찬학교","","어린이","자매",6],["시편학교","","일반인","형제",2],["시편학교","","일반인","자매",2]]},{"t":"2019S","v":"","n":1066,"r":[["일반인 경찬학교","첫번째","일반인","형제",27],["일반인 경찬학교","첫번째","일반인","자매",40],["일반인 경찬학교","첫번째","학생","형제",2],["일반인 경찬학교","첫번째","학생","자매",3],["일반인 경찬학교","첫번째","어린이","형제",1],["일반인 경찬학교","첫번째","어린이","자매",2],["일반인 경찬학교","두번째","일반인","형제",33],["일반인 경찬학교","두번째","일반인","자매",60],["일반인 경찬학교","두번째","학생","형제",4],["일반인 경찬학교","두번째","학생","자매",4],["일반인 경찬학교","두번째","어린이","형제",1],["일반인 경찬학교","두번째","어린이","자매",3],["중고등부 경찬학교","첫번째","일반인","형제",49],["중고등부 경찬학교","첫번째","일반인","자매",80],["중고등부 경찬학교","첫번째","학생","형제",104],["중고등부 경찬학교","첫번째","학생","자매",83],["중고등부 경찬학교","첫번째","어린이","형제",13],["중고등부 경찬학교","첫번째","어린이","자매",19],["중고등부 경찬학교","두번째","일반인","형제",20],["중고등부 경찬학교","두번째","일반인","자매",25],["중고등부 경찬학교","두번째","학생","형제",59],["중고등부 경찬학교","두번째","학생","자매",61],["중고등부 경찬학교","두번째","어린이","형제",1],["중고등부 경찬학교","두번째","어린이","자매",3],["어린이 경찬학교","첫번째","일반인","형제",8],["어린이 경찬학교","첫번째","일반인","자매",34],["어린이 경찬학교","첫번째","학생","형제",2],["어린이 경찬학교","첫번째","학생","자매",7],["어린이 경찬학교","첫번째","어린이","형제",25],["어린이 경찬학교","첫번째","어린이","자매",29],["어린이 경찬학교","두번째","일반인","형제",10],["어린이 경찬학교","두번째","일반인","자매",43],["어린이 경찬학교","두번째","학생","형제",4],["어린이 경찬학교","두번째","학생","자매",1],["어린이 경찬학교","두번째","어린이","형제",60],["어린이 경찬학교","두번째","어린이","자매",69],["시편학교","","일반인","형제",17],["시편학교","","일반인","자매",55],["시편학교","","학생","자매",2],["시편학교","","어린이","자매",3]]},{"t":"2024W","v":"명지대 함박관","n":88,"r":[["경찬학교","","일반인","형제",17],["경찬학교","","일반인","자매",50],["경찬학교","","학생","형제",6],["경찬학교","","학생","자매",8],["경찬학교","","어린이","형제",3],["경찬학교","","어린이","자매",4]]},{"t":"2024S","v":"명지대 채플관","n":400,"r":[["미래세대","","일반인","형제",73],["미래세대","","일반인","자매",203],["미래세대","","십대","형제",59],["미래세대","","십대","자매",44],["미래세대","","어린이","형제",6],["미래세대","","어린이","자매",5],["미래세대","","온라인 참여","",3],["어린이","","일반인","형제",34],["어린이","","일반인","자매",110],["어린이","","십대","형제",1],["어린이","","십대","자매",4],["어린이","","어린이","형제",8],["어린이","","어린이","자매",8],["어린이","","온라인 참여","",3],["중복인원","","일반인","형제",32],["중복인원","","일반인","자매",107],["중복인원","","십대","형제",1],["중복인원","","십대","자매",4],["중복인원","","어린이","형제",4],["중복인원","","어린이","자매",1]]},{"t":"2025W","v":"명지대 채플관","n":324,"r":[["5박6일","","일반인","형제",19],["5박6일","","일반인","자매",84],["5박6일","","십대","자매",4],["5박6일","","어린이","형제",2],["5박6일","","어린이","자매",3],["미래세대","","일반인","형제",24],["미래세대","","일반인","자매",49],["미래세대","","십대","형제",29],["미래세대","","십대","자매",21],["미래세대","","어린이","자매",1],["어린이","","일반인","형제",5],["어린이","","일반인","자매",22],["어린이","","십대","형제",6],["어린이","","십대","자매",8],["어린이","","어린이","형제",31],["어린이","","어린이","자매",16]]},{"t":"2025S","v":"명지대 채플관","n":643,"r":[["5박6일","","일반인","형제",132],["5박6일","","일반인","자매",51],["5박6일","","대학생","형제",10],["5박6일","","대학생","자매",16],["5박6일","","십대","형제",6],["5박6일","","십대","자매",1],["5박6일","","어린이","형제",2],["5박6일","","어린이","자매",3],["미래세대","","일반인","형제",35],["미래세대","","일반인","자매",71],["미래세대","","대학생","형제",13],["미래세대","","대학생","자매",30],["미래세대","","십대","형제",66],["미래세대","","십대","자매",61],["미래세대","","어린이","형제",8],["미래세대","","어린이","자매",20],["어린이","","일반인","형제",14],["어린이","","일반인","자매",35],["어린이","","대학생","형제",1],["어린이","","대학생","자매",2],["어린이","","십대","형제",3],["어린이","","십대","자매",5],["어린이","","어린이","형제",28],["어린이","","어린이","자매",30]]},{"t":"2026W","v":"명지대 채플관","n":418,"r":[["5박6일","","일반인","형제",9],["5박6일","","일반인","자매",39],["5박6일","","대학생","형제",6],["5박6일","","대학생","자매",6],["5박6일","","십대","형제",5],["5박6일","","십대","자매",5],["5박6일","","어린이","형제",6],["5박6일","","어린이","자매",4],["미래세대","","일반인","형제",42],["미래세대","","일반인","자매",58],["미래세대","","대학생","형제",13],["미래세대","","대학생","자매",23],["미래세대","","십대","형제",71],["미래세대","","십대","자매",46],["미래세대","","어린이","형제",3],["미래세대","","어린이","자매",6],["어린이","","일반인","형제",8],["어린이","","일반인","자매",21],["어린이","","대학생","자매",2],["어린이","","십대","형제",3],["어린이","","십대","자매",2],["어린이","","어린이","형제",23],["어린이","","어린이","자매",17]]}];

const TERM_META = {
  '2020W': ['온라인', 'COVID-19 온라인'], '2020S': ['온라인', 'COVID-19 온라인'],
  '2021W': ['온라인', 'COVID-19 온라인'], '2021S': ['온라인', 'COVID-19 온라인'],
  '2022W': ['온라인', 'COVID-19 온라인 · 기록 없음'], '2022S': ['온라인', 'COVID-19 온라인 · 기록 없음'],
  '2023W': ['온라인', 'COVID-19 온라인 · 기록 없음'],
  '2023S': ['현장', '팀수양관 진행 · 등록시트 유실'],
  '2026S': ['현장', '총인원은 2026S Master_DB 이관 시 채움'],
  '2027W': ['예정', '4트랙 (미래세대·어린이·대학청년/일반·청지기)'],
};

const TABS = {
  README: ['항목', '내용'],
  설정: ['항목', '값', '설명'],
  학기: ['학기코드', '순번', '연도', '시즌', '형태', '장소', '기간', '총인원', '참여 교회 수', '비고'],
  교회: ['교회코드', '교회명', '매칭키', '별칭', '지역', '주소', '연락처', '이메일', '연락처 메모',
         '첫 참석', '최근 참석', '참석 횟수', '참석 학기', '상태', '출처', '비고'],
  사람: ['개인코드', '이름', '생년월일', '성별', '연락처', '이메일', '교회코드', '교회명(입력값)',
         '첫 참석', '최근 참석', '참석 횟수', '수신 동의', '동의일', '보호자 동의', '출처', '비고'],
  참석: ['참석ID', '학기코드', '교회코드', '개인코드', '트랙', '인원', '등록 경로', '출처', '입력일', '비고'],
  '학기별 인원': ['학기코드', '과정', '세부', '구분', '성별', '인원'],
  지표: [],
  '재초청 대상': ['교회코드', '교회명', '지역', '상태', '최근 참석', '참석 횟수', '참석 학기',
                 '연락처', '이메일', '연락처 메모', '재초청 메모', '연락 여부'],
  '확인 필요': ['유형', '교회코드', '교회명', '내용'],
};
const TEXT_COLS = { 교회: ['연락처'], 사람: ['연락처', '생년월일'], 참석: ['학기코드'] };

/* ═════════════════════════ 1. buildAnmDb ═════════════════════════ */

function buildAnmDb() {
  runSafely_('ANM_DB 만들기', buildAnmDbBody_);
}

function buildAnmDbBody_() {
  const N = 6;
  step_(1, N, 'DB 시트 찾기/만들기 (00_시스템/원천데이터/ANM_DB)');
  const root = DriveApp.getFolderById(ROOT_ID);
  const sys = getOrCreate_(root, '00_시스템');
  LOG_FOLDER = getOrCreate_(sys, '로그');
  const rawFolder = getOrCreate_(sys, '원천데이터');
  const ss = getOrCreateSheet_(rawFolder, DB_NAME);
  say_('DB 주소: ' + ss.getUrl());

  step_(2, N, '탭 만들기 (README·설정·학기·교회·사람·참석·학기별 인원·지표·재초청 대상·확인 필요)');
  Object.keys(TABS).forEach(name => ensureTab_(ss, name, TABS[name]));
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  fillReadme_(ss);
  fillSettings_(ss);

  step_(3, N, '학기 탭 + 학기별 인원 채우기 (2018W~2027W)');
  fillTerms_(ss);

  step_(4, N, '통계.xlsx → 구글시트 변환 (원본은 그대로 둠)');
  const conv = convertStatsXlsx_(rawFolder);

  step_(5, N, '교회 · 참석 이관 (이전참여교회 + 2025W 홍보교회)');
  importChurches_(ss, conv);

  step_(6, N, '상태 · 지표 · 재초청 대상 계산');
  refreshDbCore_(ss);
  say_('👉 DB 열기: ' + ss.getUrl());
}

/* ═════════════════════════ 2. refreshDB ═════════════════════════ */

function refreshDB() {
  runSafely_('ANM_DB 다시 계산', () => {
    step_(1, 1, '교회 상태 · 지표 · 재초청 대상 다시 계산');
    const ss = openDb_();
    LOG_FOLDER = getOrCreate_(getOrCreate_(DriveApp.getFolderById(ROOT_ID), '00_시스템'), '로그');
    refreshDbCore_(ss);
    say_('👉 DB 열기: ' + ss.getUrl());
  });
}

function openDb_() {
  const sys = DriveApp.getFolderById(ROOT_ID).getFoldersByName('00_시스템').next();
  const raw = sys.getFoldersByName('원천데이터').next();
  const it = raw.getFilesByName(DB_NAME);
  if (!it.hasNext()) throw new Error('ANM_DB가 없습니다. buildAnmDb를 먼저 실행하세요.');
  return SpreadsheetApp.open(it.next());
}

/* ═════════════════════════ 만들기 단계 ═════════════════════════ */

function getOrCreateSheet_(folder, name) {
  const it = folder.getFilesByName(name);
  if (it.hasNext()) { log_('DB', name, '', folder.getName(), '건너뜀', '이미 있음 → 재사용'); return SpreadsheetApp.open(it.next()); }
  const ss = SpreadsheetApp.create(name);
  const file = DriveApp.getFileById(ss.getId());
  file.moveTo(folder);
  try { file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE); } catch (e) {}
  ss.setSpreadsheetTimeZone('Asia/Seoul');
  log_('DB 생성', name, ss.getId(), folder.getName(), '성공');
  return ss;
}

function ensureTab_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); log_('탭 생성', name, '', DB_NAME, '성공'); }
  if (header.length && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header])
      .setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    (TEXT_COLS[name] || []).forEach(col => {
      const c = header.indexOf(col) + 1;
      if (c > 0) sh.getRange(2, c, sh.getMaxRows() - 1, 1).setNumberFormat('@');
    });
  }
  return sh;
}

function fillReadme_(ss) {
  const sh = ss.getSheetByName('README');
  if (sh.getLastRow() > 1) return;
  const rows = [
    ['이 시트는', '경배와찬양학교 원천 데이터베이스. 누가·어느 교회에서·언제 왔는지의 단일 원본'],
    ['원천 탭', '참석 (한 줄 = 한 학기 × 한 교회(× 한 사람)). 모든 지표는 여기서 계산'],
    ['이름표 탭', '학기 · 교회 · 사람 (코드가 키. 이름은 표시용)'],
    ['자동 탭', '지표 · 재초청 대상 · 확인 필요 · 교회의 첫/최근 참석·상태 → refreshDB가 덮어씀. 직접 고치지 말 것'],
    ['손으로 쓰는 칸', '재초청 대상의 재초청 메모 · 연락 여부 (다시 계산해도 보존)'],
    ['데이터 수준', '2018W~2026W: 교회 단위(참석 여부) + 학기 총인원. 개인 단위는 2026S부터'],
    ['교회 목록 한계', '이전참여교회 리스트는 홍보용으로 모은 것이라 개인 참가자의 교회는 빠져 있을 수 있음'],
    ['같은 교회 합치기', '교회 탭에서 남길 행의 별칭 칸에 다른 이름을 쓰고, 참석 탭의 교회코드를 남길 코드로 바꾼 뒤, 남은 행 삭제 → refreshDB'],
    ['상태 기준', '설정 탭의 기준학기 대비 마지막 참석이 몇 학기 전인가 (최근 참석 / 주의 / 이탈 / 미참여)'],
    ['개인정보', '미성년자 다수. 공유는 제한됨 유지, 링크 공유 금지. 홍보 연락은 수신 동의자 · 교회 담당자 단위로'],
  ];
  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 720);
}

function fillSettings_(ss) {
  const sh = ss.getSheetByName('설정');
  if (sh.getLastRow() > 1) return;
  const rows = [
    ['기준학기', '2026S', '가장 최근에 끝난 학기. 학기가 끝나면 바꾸고 refreshDB'],
    ['주의 기준', 1, '마지막 참석이 기준학기보다 이 학기 수 이상 전이면 "주의"'],
    ['이탈 기준', 3, '마지막 참석이 기준학기보다 이 학기 수 이상 전이면 "이탈" (3 = 1년 반)'],
  ];
  sh.getRange(2, 1, rows.length, 3).setValues(rows);
  sh.getRange('B2').setNumberFormat('@');
}

function fillTerms_(ss) {
  const sh = ss.getSheetByName('학기');
  if (sh.getLastRow() > 1) { log_('학기 탭', '이미 채워짐', '', '', '건너뜀'); }
  else {
    const hc = {}; HEADCOUNT.forEach(b => (hc[b.t] = b));
    const rows = [];
    for (let y = 2018; y <= 2027; y++) ['W', 'S'].forEach(s => {
      const code = y + s;
      if (code === '2027S') return;
      const meta = TERM_META[code] || ['현장', ''];
      const b = hc[code];
      rows.push([code, termIdx_(code), y, s === 'W' ? '겨울' : '여름', meta[0], b ? b.v : '', '', b ? b.n : '', '', meta[1]]);
    });
    sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    sh.getRange(2, 1, rows.length, 1).setNumberFormat('@');
    log_('학기 탭', rows.length + '개 학기', '', '', '성공');
  }
  const sh2 = ss.getSheetByName('학기별 인원');
  if (sh2.getLastRow() > 1) { log_('학기별 인원', '이미 채워짐', '', '', '건너뜀'); return; }
  const rows2 = [];
  HEADCOUNT.forEach(b => b.r.forEach(r => rows2.push([b.t].concat(r))));
  sh2.getRange(2, 1, rows2.length, 6).setValues(rows2);
  log_('학기별 인원', rows2.length + '행 (' + HEADCOUNT.length + '개 학기)', '', '', '성공');
}

/** 통계.xlsx를 구글시트로 변환한 사본을 원천데이터 폴더에 만든다 (이미 있으면 재사용) */
function convertStatsXlsx_(folder) {
  const it = folder.getFilesByName(STATS_CONVERTED_NAME);
  if (it.hasNext()) { log_('xlsx 변환', STATS_CONVERTED_NAME, '', folder.getName(), '건너뜀', '이미 있음'); return SpreadsheetApp.open(it.next()); }
  const res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + STATS_XLSX_ID + '/copy?supportsAllDrives=true', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ name: STATS_CONVERTED_NAME, mimeType: MimeType.GOOGLE_SHEETS, parents: [folder.getId()] }),
  });
  if (res.getResponseCode() !== 200) throw new Error('xlsx 변환 실패 (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 300));
  const id = JSON.parse(res.getContentText()).id;
  log_('xlsx 변환', STATS_CONVERTED_NAME, id, folder.getName(), '성공');
  // 변환 직후 바로 열면 가끔 실패해서 잠깐 대기
  Utilities.sleep(2000);
  return SpreadsheetApp.openById(id);
}

function importChurches_(ss, conv) {
  const shC = ss.getSheetByName('교회'), shA = ss.getSheetByName('참석');
  if (shC.getLastRow() > 1) { log_('교회 이관', '교회 탭에 이미 데이터 있음', '', '', '건너뜀', '다시 이관하려면 교회·참석 탭 내용을 지우고 실행'); return; }
  const prev = conv.getSheetByName('이전참여교회');
  const promo = conv.getSheetByName('2025W 홍보교회 연락처');
  if (!prev) throw new Error('변환본에 "이전참여교회" 탭이 없습니다');
  const out = buildChurchRows_(prev.getDataRange().getValues(), promo ? promo.getDataRange().getValues() : [], todayStr_());
  shC.getRange(2, 1, out.churches.length, TABS.교회.length).setValues(out.churches);
  if (out.attend.length) shA.getRange(2, 1, out.attend.length, TABS.참석.length).setValues(out.attend);
  log_('교회 이관', out.churches.length + '개 교회 (참여 ' + out.stat.participated + ' · 홍보만 ' + out.stat.promoOnly + ')', '', DB_NAME, '성공');
  log_('참석 이관', out.attend.length + '건 (교회×학기)', '', DB_NAME, '성공');
  out.warnings.forEach(w => log_('확인 필요', w, '', '', '건너뜀'));
}

/* ═══════════════════ 순수 로직 (시트 없이 테스트 가능) ═══════════════════ */

function cleanHeader_(s) { return String(s).replace(/_x[0-9A-Fa-f]{4}_/g, '').replace(/[\u0000-\u001F​]/g, '').trim(); }
function nameKey_(s) { return String(s || '').replace(/[\s ]/g, '').replace(/[()（）]/g, '').toLowerCase(); }
function todayStr_() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'); }

/** 학기 순번: 2018W=1, 2018S=2, 2019W=3 … */
function termIdx_(code) {
  const m = String(code).match(/^(20\d\d)([WS])$/);
  return m ? (Number(m[1]) - 2018) * 2 + (m[2] === 'W' ? 1 : 2) : null;
}

function parseTerms_(s) {
  const ok = [], bad = [];
  String(s || '').toUpperCase().split(/[\s,./·]+/).filter(Boolean).forEach(t => {
    if (/^20\d\d[WS]$/.test(t)) { if (ok.indexOf(t) === -1) ok.push(t); } else bad.push(t);
  });
  ok.sort((a, b) => termIdx_(a) - termIdx_(b));
  return { ok, bad };
}

function normPhone_(v) {
  if (v === '' || v === null || v === undefined) return { phone: '', bad: false };
  const raw = typeof v === 'number' ? String(Math.round(v)) : String(v).trim();
  const parts = raw.replace(/["']/g, '').split(/[\n\/,;]+/).map(x => x.trim()).filter(Boolean);
  let bad = false;
  const out = parts.map(x => {
    const d = x.replace(/\(?\+82\)?/, '').replace(/\D/g, '');
    if (!d) { bad = true; return x; }
    const n = d[0] === '0' ? d : '0' + d;
    if (/^01[016789]/.test(n) && n.length !== 11 && !/^01[16789]\d{7}$/.test(n)) { bad = true; return x; } // 휴대폰 자릿수 오류
    if (/^02\d{7,8}$/.test(n)) return n.replace(/^(02)(\d{3,4})(\d{4})$/, '$1-$2-$3');
    if (/^0\d{2}\d{7,8}$/.test(n)) return n.replace(/^(0\d{2})(\d{3,4})(\d{4})$/, '$1-$2-$3');
    bad = true; return x;
  });
  return { phone: out.join(' / '), bad };
}

function headerMap_(values, mustHave) {
  for (let r = 0; r < Math.min(values.length, 10); r++) {
    const h = values[r].map(cleanHeader_);
    if (h.indexOf(mustHave) !== -1) { const m = {}; h.forEach((x, i) => { if (x && !(x in m)) m[x] = i; }); return { row: r, map: m }; }
  }
  return null;
}

/** 이전참여교회 + 홍보교회 시트 값 → 교회 행, 참석 행 */
function buildChurchRows_(prevValues, promoValues, today) {
  const churches = [], attend = [], warnings = [];
  const byKey = {};
  let seq = 0, aseq = 0, participated = 0, promoOnly = 0;
  const H = headerMap_(prevValues, '교회명');
  if (!H) throw new Error('이전참여교회: "교회명" 머리글을 못 찾음');
  const col = (r, name) => (H.map[name] !== undefined ? r[H.map[name]] : '');
  for (let i = H.row + 1; i < prevValues.length; i++) {
    const r = prevValues[i];
    const name = String(col(r, '교회명') || '').trim();
    if (!name) continue;
    const code = 'C' + String(++seq).padStart(4, '0');
    const p = normPhone_(col(r, '연락처'));
    const t = parseTerms_(col(r, '이전참여'));
    const key = nameKey_(name);
    let note = String(col(r, '비고') || '');
    if (p.bad) warnings.push('연락처 형식 확인: ' + name + ' (' + p.phone + ')');
    if (t.bad.length) warnings.push('이전참여 표기 확인: ' + name + ' (' + t.bad.join(',') + ')');
    if (byKey[key]) note = (note ? note + ' / ' : '') + '동명 교회 있음 → ' + byKey[key].join(',');
    (byKey[key] = byKey[key] || []).push(code);
    churches.push([code, name, key, '', String(col(r, '지역') || '').trim(), String(col(r, '주소') || '').trim(),
      p.phone, String(col(r, '이메일') || '').trim(), String(col(r, '연락처 특이사항') || '').trim(),
      '', '', '', '', '', '통계.xlsx/이전참여교회', note]);
    if (t.ok.length) participated++;
    t.ok.forEach(term => attend.push(['A' + String(++aseq).padStart(5, '0'), term, code, '', '', '', '', '통계.xlsx/이전참여교회', today, '교회 단위 (인원 미상)']));
  }
  if (promoValues && promoValues.length) {
    const P = headerMap_(promoValues, '교회명');
    if (P) {
      const pc = (r, n) => (P.map[n] !== undefined ? r[P.map[n]] : '');
      for (let i = P.row + 1; i < promoValues.length; i++) {
        const r = promoValues[i];
        const name = String(pc(r, '교회명') || '').trim();
        if (!name) continue;
        const key = nameKey_(name);
        if (byKey[key]) continue; // 이미 있는 교회
        const code = 'C' + String(++seq).padStart(4, '0');
        const p = normPhone_(pc(r, '전화번호'));
        if (p.bad) warnings.push('연락처 형식 확인: ' + name + ' (' + p.phone + ')');
        byKey[key] = [code];
        promoOnly++;
        churches.push([code, name, key, '', String(pc(r, '지역') || '').trim(), '', p.phone, String(pc(r, '이메일') || '').trim(), '',
          '', '', '', '', '', '통계.xlsx/2025W 홍보교회', '홍보 연락만 함 (참석 기록 없음)']);
      }
    }
  }
  return { churches, attend, warnings, stat: { participated, promoOnly } };
}

/**
 * 계산 핵심: 교회/참석/학기/설정 값 → 교회 통계 열, 학기 참여교회수, 지표 표, 재초청 대상, 확인 필요
 * (시트 없이 테스트 가능하도록 배열만 다룸)
 */
function computeDb_(churchRows, attendRows, termRows, cfg) {
  const base = termIdx_(cfg.baseTerm);
  const C = {}; churchRows.forEach(r => (C[r[0]] = { terms: {} }));
  const termChurches = {};       // 학기 → {교회코드:1}
  attendRows.forEach(a => {
    const term = String(a[1]).trim(), code = String(a[2]).trim();
    if (!termIdx_(term) || !code) return;
    if (C[code]) C[code].terms[term] = 1;
    (termChurches[term] = termChurches[term] || {})[code] = 1;
  });

  const stats = churchRows.map(r => {
    const ts = Object.keys(C[r[0]].terms).sort((a, b) => termIdx_(a) - termIdx_(b));
    if (!ts.length) return ['', '', 0, '', '미참여'];
    const last = ts[ts.length - 1], gap = base - termIdx_(last);
    let st = gap <= 0 ? '최근 참석' : gap >= cfg.lapse ? '이탈' : gap >= cfg.warn ? '주의' : '최근 참석';
    if (ts.length === 1 && gap <= 0) st = '신규';
    return [ts[0], last, ts.length, ts.join(', '), st];
  });

  // 학기별 지표
  const seen = {}; const metric = [];
  const terms = termRows.map(t => String(t[0])).filter(t => termIdx_(t)).sort((a, b) => termIdx_(a) - termIdx_(b));
  let prevSet = null;
  terms.forEach(t => {
    const set = termChurches[t] || {};
    const codes = Object.keys(set);
    const total = (termRows.find(x => String(x[0]) === t) || [])[7];
    if (!codes.length && !total) { metric.push([t, '', '', '', '', '', '']); return; }
    let nNew = 0, nBack = 0, kept = 0;
    codes.forEach(c => { if (seen[c]) nBack++; else nNew++; });
    if (prevSet) Object.keys(prevSet).forEach(c => { if (set[c]) kept++; });
    const retention = prevSet && Object.keys(prevSet).length && termIdx_(t) > termIdx_('2024W') ? kept / Object.keys(prevSet).length : '';
    metric.push([t, total === undefined ? '' : total, codes.length, nNew, nBack, retention, codes.length && total ? total / codes.length : '']);
    codes.forEach(c => (seen[c] = 1));
    if (codes.length) prevSet = set;
  });

  // 재초청 대상: 이탈·주의, 참석 횟수 많은 순
  const targets = [];
  churchRows.forEach((r, i) => {
    const s = stats[i];
    if (s[4] === '이탈' || s[4] === '주의') targets.push([r[0], r[1], r[4], s[4], s[1], s[2], s[3], r[6], r[7], r[8]]);
  });
  targets.sort((a, b) => (a[3] === b[3] ? 0 : a[3] === '주의' ? -1 : 1) || b[5] - a[5] || termIdx_(b[4]) - termIdx_(a[4]));

  // 확인 필요
  const issues = [];
  const byKey = {};
  churchRows.forEach(r => (byKey[r[2] || nameKey_(r[1])] = (byKey[r[2] || nameKey_(r[1])] || []).concat([r])));
  Object.keys(byKey).forEach(k => {
    if (byKey[k].length > 1) issues.push(['동명 교회', byKey[k].map(r => r[0]).join(', '), byKey[k][0][1],
      '지역: ' + byKey[k].map(r => r[4] || '(없음)').join(' / ') + ' → 같은 교회면 합치기, 다르면 비고에 구분 표시']);
  });
  churchRows.forEach((r, i) => {
    if (!r[6] && !r[7] && stats[i][4] !== '미참여') issues.push(['연락처 없음', r[0], r[1], '연락처·이메일 모두 비어 있음']);
    if (r[6] && !/^0\d{1,2}-\d{3,4}-\d{4}( \/ 0\d{1,2}-\d{3,4}-\d{4})*$/.test(r[6])) issues.push(['연락처 형식', r[0], r[1], r[6]]);
  });
  attendRows.forEach(a => {
    if (a[2] && !C[String(a[2]).trim()]) issues.push(['참석-교회 연결 끊김', a[2], '', '참석ID ' + a[0] + ': 교회 탭에 없는 코드']);
  });

  const termCount = {}; Object.keys(termChurches).forEach(t => (termCount[t] = Object.keys(termChurches[t]).length));
  return { stats, metric, targets, issues, termCount };
}

/* ═════════════════════════ 계산 결과 쓰기 ═════════════════════════ */

function refreshDbCore_(ss) {
  const get = (name) => { const sh = ss.getSheetByName(name); const n = sh.getLastRow(); return n > 1 ? sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues() : []; };
  const cfgRows = get('설정');
  const cfgVal = (k, d) => { const r = cfgRows.find(x => x[0] === k); return r && r[1] !== '' ? r[1] : d; };
  const cfg = { baseTerm: String(cfgVal('기준학기', '2026S')).trim(), warn: Number(cfgVal('주의 기준', 1)), lapse: Number(cfgVal('이탈 기준', 3)) };
  if (!termIdx_(cfg.baseTerm)) throw new Error('설정 탭 기준학기 형식 오류: ' + cfg.baseTerm);

  const churches = get('교회'), attend = get('참석'), terms = get('학기');
  const res = computeDb_(churches, attend, terms, cfg);

  // 교회 탭 J~N (첫 참석 ~ 상태)
  const shC = ss.getSheetByName('교회');
  if (churches.length) {
    shC.getRange(2, 10, churches.length, 5).setValues(res.stats);
    shC.getRange(2, 10, churches.length, 2).setNumberFormat('@');
  }
  log_('교회 상태', churches.length + '개 교회 (기준학기 ' + cfg.baseTerm + ')', '', DB_NAME, '성공');

  // 학기 탭 I열 (참여 교회 수)
  const shT = ss.getSheetByName('학기');
  if (terms.length) shT.getRange(2, 9, terms.length, 1).setValues(terms.map(t => [res.termCount[String(t[0])] || '']));

  // 지표 탭
  const shM = ss.getSheetByName('지표');
  shM.clear();
  const cnt = {}; res.stats.forEach(s => (cnt[s[4]] = (cnt[s[4]] || 0) + 1));
  const top = [
    ['📊 경배와찬양학교 지표', '', '', '', '', '', ''],
    ['기준학기', cfg.baseTerm, '갱신', Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'), '', '', ''],
    ['교회 상태', '최근 참석 ' + (cnt['최근 참석'] || 0) + ' · 신규 ' + (cnt['신규'] || 0) + ' · 주의 ' + (cnt['주의'] || 0) + ' · 이탈 ' + (cnt['이탈'] || 0) + ' · 미참여 ' + (cnt['미참여'] || 0), '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['학기', '총인원', '참여 교회 수', '신규 교회', '재참여 교회', '직전 진행 학기 교회 유지율', '교회당 평균 인원'],
  ];
  const all = top.concat(res.metric);
  shM.getRange(1, 1, all.length, 7).setValues(all);
  shM.getRange('A1').setFontSize(14).setFontWeight('bold');
  shM.getRange(5, 1, 1, 7).setFontWeight('bold').setBackground('#1f3a5f').setFontColor('#ffffff');
  if (res.metric.length) {
    shM.getRange(6, 6, res.metric.length, 1).setNumberFormat('0%');
    shM.getRange(6, 7, res.metric.length, 1).setNumberFormat('0.0');
  }
  shM.getRange(6 + res.metric.length + 1, 1).setValue('※ 교회 수는 이전참여교회 리스트 기준 (개인 참가자의 교회는 빠져 있을 수 있음). 2020~2023은 온라인/기록 없음. 유지율은 2024S부터만 표시 (이전 리스트는 교회당 참여 학기가 1개만 적힌 경우가 많아 의미 없음). 교회당 평균 인원은 참고용');
  shM.setFrozenRows(5);
  log_('지표', res.metric.length + '개 학기', '', DB_NAME, '성공');

  // 재초청 대상 (손으로 쓴 메모 보존)
  const shR = ss.getSheetByName('재초청 대상');
  const old = get('재초청 대상'); const memo = {};
  old.forEach(r => { if (r[10] || r[11]) memo[r[0]] = [r[10], r[11]]; });
  if (shR.getLastRow() > 1) shR.getRange(2, 1, shR.getLastRow() - 1, TABS['재초청 대상'].length).clearContent();
  const rows = res.targets.map(t => t.concat(memo[t[0]] || ['', '']));
  if (rows.length) shR.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  log_('재초청 대상', rows.length + '개 교회 (주의 ' + (cnt['주의'] || 0) + ' · 이탈 ' + (cnt['이탈'] || 0) + ')', '', DB_NAME, '성공');

  // 확인 필요
  const shI = ss.getSheetByName('확인 필요');
  if (shI.getLastRow() > 1) shI.getRange(2, 1, shI.getLastRow() - 1, 4).clearContent();
  if (res.issues.length) shI.getRange(2, 1, res.issues.length, 4).setValues(res.issues);
  log_('확인 필요', res.issues.length + '건', '', DB_NAME, res.issues.length ? '건너뜀' : '성공', res.issues.length ? '확인 필요 탭에서 정리' : '');
}

/* ═════════════════════════ 3. 같은 이름 교회 합치기 ═════════════════════════ */

/**
 * 매칭키(공백 제거한 교회명)가 같은 교회를 하나로 합친다.
 *  - 가장 앞 코드만 남김. 빈 칸은 다른 행 값으로 채우고, 서로 다른 값은 ' / '로 이어 붙임
 *  - 참석 탭·사람 탭의 교회코드를 남는 코드로 바꿈 → 나머지 행 삭제 → refreshDB 계산
 *  - 합친 기록은 비고에 남김 (예: "C0199 합침")
 */
function mergeSameNameChurches() {
  runSafely_('같은 이름 교회 합치기', () => {
    step_(1, 2, '같은 이름 교회 찾아서 합치기');
    const ss = openDb_();
    LOG_FOLDER = getOrCreate_(getOrCreate_(DriveApp.getFolderById(ROOT_ID), '00_시스템'), '로그');
    const shC = ss.getSheetByName('교회');
    const n = shC.getLastRow() - 1;
    if (n < 1) return;
    const rows = shC.getRange(2, 1, n, TABS.교회.length).getValues();
    const res = mergeChurchRows_(rows);
    if (!Object.keys(res.remap).length) { log_('교회 합치기', '같은 이름 교회 없음', '', '', '건너뜀'); }
    else {
      shC.getRange(2, 1, n, TABS.교회.length).clearContent();
      shC.getRange(2, 1, res.rows.length, TABS.교회.length).setValues(res.rows);
      ['참석', '사람'].forEach(tab => {
        const sh = ss.getSheetByName(tab), h = TABS[tab], col = h.indexOf('교회코드') + 1, m = sh.getLastRow() - 1;
        if (m < 1) return;
        const rg = sh.getRange(2, col, m, 1), v = rg.getValues();
        let changed = 0;
        v.forEach(r => { if (res.remap[r[0]]) { r[0] = res.remap[r[0]]; changed++; } });
        rg.setValues(v);
        log_('코드 바꾸기', tab + ' 탭 ' + changed + '건', '', DB_NAME, '성공');
      });
      res.merged.forEach(m => log_('교회 합치기', m, '', DB_NAME, '성공'));
    }
    step_(2, 2, '상태 · 지표 · 재초청 대상 다시 계산');
    refreshDbCore_(ss);
  });
}

function mergeChurchRows_(rows) {
  const groups = {}, order = [];
  rows.forEach(r => {
    const k = r[2] || nameKey_(r[1]);
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(r);
  });
  const remap = {}, merged = [], out = [];
  const join = (a, b) => {
    a = String(a || '').trim(); b = String(b || '').trim();
    if (!b || a === b || a.split(' / ').indexOf(b) !== -1) return a;
    return a ? a + ' / ' + b : b;
  };
  order.forEach(k => {
    const g = groups[k], keep = g[0].slice();
    if (g.length > 1) {
      g.slice(1).forEach(o => {
        remap[o[0]] = keep[0];
        [4, 5, 6, 7, 8, 14].forEach(i => (keep[i] = join(keep[i], o[i])));   // 지역 주소 연락처 이메일 메모 출처
        if (o[1] !== keep[1]) keep[3] = join(keep[3], o[1]);                  // 다른 표기는 별칭으로
        keep[3] = join(keep[3], o[3]);
      });
      keep[15] = join(String(keep[15] || '').replace(/동명 교회 있음 → [C0-9,]+/g, '').replace(/^ \/ | \/ $/g, '').trim(),
        g.slice(1).map(o => o[0]).join(',') + ' 합침');
      merged.push(keep[1] + ': ' + g.map(o => o[0]).join(', ') + ' → ' + keep[0]);
    }
    out.push(keep);
  });
  return { rows: out, remap, merged };
}
