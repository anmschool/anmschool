/**
 * ANM School 드라이브 구조 정리 (1회 실행용)
 * ------------------------------------------------------------
 * 실행 계정: anmschool@anminspirational.com  ← 반드시 이 계정으로 실행
 * 실행 방법: script.google.com → 새 프로젝트 → 이 코드 붙여넣기 → setupDriveStructure 실행
 *
 * - 새 폴더는 모두 실행 계정(anmschool) 소유로 만들어집니다.
 * - 파일은 '이동'만 합니다. 삭제하지 않습니다. (빈 폴더만 휴지통으로)
 * - 여러 번 실행해도 안전합니다. (있으면 재사용, 이미 옮겼으면 건너뜀)
 * - 모든 작업은 00_시스템/로그/드라이브 정리 로그 시트에 기록됩니다.
 */

const ROOT_ID = '15qsx7tUTFqyjck7xJPAgxc5dM7B_Fzkw'; // ANM School

// 현재 드라이브의 기존 항목 ID (2026-10-16 조사 기준)
const ID = {
  // 상위
  school: '1yI6jOhKsmDXjQDLnZcFBYFf2Wdc7mRck',       // 10_경배와찬양학교
  festival: '17E07xkkU1srLxS6L4rlWAsWSj9dXcyhj',     // 20_큰잔치·시편학교
  training: '1DQjmT7p_aGAhSRDwFduJcxnDuNKrm5X7',     // 30_훈련
  guideDoc: '1ajzYBnfEM_T248JpkMzIEDLFnNP1YC6IyestI58vcio',   // 설명서
  secretDoc: '1hjRRWGLOwcUm75-sS8tq5s_kPTaQTkyxj8ZX8TQb5j0',  // 계정 및 중요내용

  // 2027W
  w27: '1GWwddUHJISSBABN5Ew4gmFOwH7goLoI5',
  w27Memo: '1RP26nhwiXKF_fZWqv7ILrT3j99KTUBC7EiORvWjSFMA',
  w27Admin: '1zRFtysZy6KcHFPjDONm5jfFdRTvr1wdJ',
  w27Design: '1rg2vZ14vcI3dvtDJNERPx4N-HxlHWue4',
  w27DraftDoc: '15rJ2JATaMnHC3WuKEBMBDGptGKpxDLmyfnlMDe4xDzY', // 2026S 폴더에 있던 '2027W 경배와찬양학교' 문서

  // ADMIN
  admin: '194ZRHWjvMQ6lQHJBuM7QYsDrbCGvQaL7',
  prevSchools: '1L8VfWHoPn-vHBD9DkS9MIzU8hA5Scssx',
  stats: '1iPNKkbVfFmF1dcvpJHpBh8snvRqqkWET',            // 경배와찬양학교 통계.xlsx
  lectures26W: '1HGbQfmqzvcVXjPXe7f7qRLNakvBq7K-_',      // 강의안 자료 (2026 겨울)
  prevDesign: '1CcLGhnZs9RhZAq4FdZKd6my28OrDvryQ',       // 이전 경배와찬양학교 디자인
  floorplans: '1vD1ZKm0BiuuV8smsD1YI4sLW-B8mnE0c',       // 숙소 도면
  handover: '1jMSgjYGPhm6UxP1XIUkxiPHQ6z0OP3FaXnpn0RXlgM8', // 과거 인수인계 자료
  oldAcctShortcut: '1Lh9Z-73ttdnLRTvLS1AK1JnVaFMGwn-_',  // 이전자료 바로가기

  // 2026S
  s26: '1RhTQNIHcNraVR4j19ApVuKyb_oLZY_dI',
  s26Admin: '1CtM5JVFCFRsMS2W61qQxD39FzkkuYihn',
  s26Promo: '1zy4r16iZSzjC0qUe_7oXHoc40dqsOzod',
  s26Design: '16i1xscU42terHjfdmgb-k98SYAzsvn82',
  s26Lectures: '1uh0JDMqgNIl1XSgwxlOQeFxrzzjzggoZ',
  s26LearnCenter: '1zuBbcltts-he5cv1IDsE4oY_5Szo8Cio',
  s26Supplies: '19NROck0EqPQzsNFKid0VwsIu_rW4TbqB',
  s26Applications: '14m1Fda-mAipWa0e2r9o1XI7Eqi18ltLe',
  s26FacilityPhotos: '1VN6l2F3Phd84XuXcdo5M8IhgTWs28Wfo',
  s26Brochure: '1mzyhntl7wCMGsTJ1BIi_fzMB3s0CKOUjFRzIR6mrnTA',
  s26LodgeCheck: '1jLIE1jeuDZHMC0BGhshXpff4giByQLBMy2e-Lq3Jigc',
  s26LodgeGuide: '11v1SqW5CvaBczAwFYAGXOHzLS6Hvl9doSO9-IfaEeK8',
  s26LodgeGuideZh: '1P-Jzt9vOUAdv2WU2ey-O8OlDzR8DO0fMzSqJzmx3ww8',
  s26Meal: '1ghoGr0HFidwrtEgwzpmLgNqonkhc-8Ebm2JeN94u4Cc',
  s26KidsPrayer: '1F2O7cKZMd_BzEQJ0H5xncw9xTcz_JsTAPghi_8EQF2A',
  s26Memo: '1SJ4FzqP-rv1TGyO4nIXKXXfW2hNgkiQcMXkKmPZbkSo',
  s26SchedProposal: '1PDR25etyU9PFO3Y7DLfJOnFyxqT1ij_ruAHPjqXv8Kw',
  s26SchedFinal: '1-t-GBKQyg85VCIZ2_S1QwyAnPm_rRDTu',

  // 큰잔치
  fest08: '1_Hjw_4h9dmheVv7r51lkfH8aew8xl24w',
  fest11: '1y-6xtgQ7uxcVLHo8OkncMQeFaaNHbq9O',
  festAdmin: '1au0opsm3la3dPPcmgmH7OUH0l6OdfnCa',
};

// 학기 폴더 표준 하위 구조 (자동 생성 스크립트와 공유)
const TERM_SUBFOLDERS = [
  '01_기획', '02_홍보', '03_등록·재정', '04_숙소·식사·물품',
  '05_강의·프로그램', '06_현장·출력물', '07_정산·보고',
];

let LOG = [];
let LOG_FOLDER = null;       // 로그 시트를 둘 폴더 (만들어지는 즉시 지정)
let T0 = Date.now();         // 시작 시각
const TIME_LIMIT_MS = 5 * 60 * 1000; // Apps Script 6분 제한 전에 안전하게 멈춤
const COUNT = { '성공': 0, '건너뜀': 0, '실패': 0 };

/**
 * 진행 상황 보는 법
 *  - 실행 중: 편집기 아래 '실행 로그' 창에 [1/7] … 줄이 실시간으로 올라옵니다.
 *  - 실행 중/후: 00_시스템/로그/'드라이브 정리 로그' 시트를 열어 새로고침하면
 *    단계마다 ▶ 표시 줄과 작업 내역이 쌓여 있습니다. (단계가 끝날 때마다 저장)
 *  - 6분 제한에 가까워지면 스스로 멈추고 '다시 실행하세요'라고 알려줍니다.
 *    (여러 번 실행해도 안전, 이미 한 일은 건너뜁니다)
 */
function say_(msg) {
  const sec = Math.round((Date.now() - T0) / 1000);
  console.log('[' + sec + '초] ' + msg);
}

function step_(n, total, title) {
  flushLog_();                                   // 앞 단계까지 시트에 저장
  const el = Date.now() - T0;
  if (el > TIME_LIMIT_MS) {
    say_('⏱ 실행 시간 제한이 가까워 여기서 멈춥니다. 같은 함수를 한 번 더 실행하면 이어서 진행됩니다.');
    throw new Error('TIME_LIMIT');
  }
  const line = '[' + n + '/' + total + '] ' + title;
  say_('▶ ' + line + '  (누적: 성공 ' + COUNT['성공'] + ' · 건너뜀 ' + COUNT['건너뜀'] + ' · 실패 ' + COUNT['실패'] + ')');
  log_('▶ 단계', line, '', '', '시작');
}

function finish_(title, ok) {
  flushLog_();
  say_((ok ? '✅ ' : '⚠️ ') + title + ' — 성공 ' + COUNT['성공'] + ' · 건너뜀 ' + COUNT['건너뜀'] + ' · 실패 ' + COUNT['실패']
    + (COUNT['실패'] ? '  → 로그 시트에서 결과가 "실패"인 줄을 확인하세요' : ''));
}

/** 본 작업을 감싸 에러/시간초과 시에도 로그를 남긴다 */
function runSafely_(title, fn) {
  T0 = Date.now(); LOG = []; LOG_FOLDER = null;
  COUNT['성공'] = COUNT['건너뜀'] = COUNT['실패'] = 0;
  say_('🚀 시작: ' + title);
  try {
    fn();
    finish_(title + ' 완료', true);
  } catch (e) {
    log_('중단', title, '', '', '실패', e.message);
    flushLog_();
    if (e.message === 'TIME_LIMIT') say_('⏸ 일시 중단 (정상). 같은 함수를 다시 실행하세요.');
    else { say_('❌ 오류로 중단: ' + e.message); throw e; }
  }
}

function setupDriveStructure() {
  runSafely_('드라이브 구조 정리', setupDriveStructureBody_);
}

function setupDriveStructureBody_() {
  const N = 7;
  const root = DriveApp.getFolderById(ROOT_ID);

  // ── 1. 최상위 ───────────────────────────────────────────
  step_(1, N, '최상위 폴더(00_시스템, 90_공용자료) 만들기 · 10/20/30 이름 정리 · 설명서/통계 이동');
  const sys = getOrCreate_(root, '00_시스템');
  const sysTemplates = getOrCreate_(sys, '템플릿');
  const sysTermTemplate = getOrCreate_(sysTemplates, '학기 폴더 원판');
  TERM_SUBFOLDERS.forEach(n => getOrCreate_(sysTermTemplate, n));
  const sysRaw = getOrCreate_(sys, '원천데이터');
  getOrCreate_(sysRaw, '과거 등록명단');
  const sysLog = getOrCreate_(sys, '로그');
  LOG_FOLDER = sysLog;   // 이제부터 단계마다 로그 시트에 저장됨
  say_('로그 시트 위치: 00_시스템/로그/드라이브 정리 로그 (열어두고 새로고침하면 진행이 보입니다)');
  const sysSecure = getOrCreate_(sys, '🔒 보안');

  const school = renameFolder_(ID.school, '10_경배와찬양학교');
  renameFolder_(ID.festival, '20_큰잔치·시편학교');
  renameFolder_(ID.training, '30_훈련');
  const common = getOrCreate_(root, '90_공용자료');
  const commonHandover = getOrCreate_(common, '인수인계');
  const commonDesign = getOrCreate_(common, '디자인 아카이브');

  move_(ID.guideDoc, sys, '설명서');
  move_(ID.secretDoc, sysSecure, '계정 및 중요내용');
  move_(ID.stats, sysRaw, '경배와찬양학교 통계.xlsx');

  // ── 2. 2027W ────────────────────────────────────────────
  step_(2, N, '2027W 폴더 만들기 · 기존 행정/Design/Memo 흡수');
  const w27 = renameFolder_(ID.w27, '2027W');
  moveFolder_(ID.w27, school);
  const w27Sub = {};
  TERM_SUBFOLDERS.forEach(n => (w27Sub[n] = getOrCreate_(w27, n)));
  // 기존 폴더를 표준 이름으로 흡수: 행정 → 03, Design → 02/디자인
  absorbInto_(ID.w27Admin, w27Sub['03_등록·재정'], '2027W 행정');
  absorbInto_(ID.w27Design, getOrCreate_(w27Sub['02_홍보'], '디자인'), '2027W Design');
  move_(ID.w27Memo, w27Sub['01_기획'], '2027W Memo');
  move_(ID.w27DraftDoc, w27Sub['01_기획'], '2027W 경배와찬양학교 (초안)');

  // ── 3. 2026S ────────────────────────────────────────────
  step_(3, N, '2026S 폴더 정리 (신청서·홍보·강의안·물품·숙소 문서 등 이동)');
  const s26 = renameFolder_(ID.s26, '2026S');
  moveFolder_(ID.s26, school);
  const s26Sub = {};
  TERM_SUBFOLDERS.forEach(n => (s26Sub[n] = getOrCreate_(s26, n)));
  absorbInto_(ID.s26Admin, s26Sub['03_등록·재정'], '2026S 행정');
  moveFolder_(ID.s26Applications, s26Sub['03_등록·재정'], '2026S 신청서');
  absorbInto_(ID.s26Promo, s26Sub['02_홍보'], '2026S 홍보');
  moveFolder_(ID.s26Design, s26Sub['02_홍보'], '2026S Design');
  absorbInto_(ID.s26Lectures, s26Sub['05_강의·프로그램'], '2026S 강의안');
  moveFolder_(ID.s26LearnCenter, s26Sub['05_강의·프로그램'], '2026S 학습센터');
  absorbInto_(ID.s26Supplies, s26Sub['04_숙소·식사·물품'], '2026S 물품');
  moveFolder_(ID.s26FacilityPhotos, common, '시설 사진');

  move_(ID.s26Brochure, s26Sub['02_홍보'], '브로셔 내용');
  move_(ID.s26LodgeCheck, s26Sub['04_숙소·식사·물품'], '숙소 배정 더블첵');
  move_(ID.s26LodgeGuide, s26Sub['04_숙소·식사·물품'], '숙소 안내문');
  move_(ID.s26LodgeGuideZh, s26Sub['04_숙소·식사·물품'], '숙소 안내문 [5동] 중국어');
  move_(ID.s26Meal, s26Sub['04_숙소·식사·물품'], '2026 S 식사 제안');
  move_(ID.s26KidsPrayer, s26Sub['06_현장·출력물'], '26S 어린이 기도제목');
  move_(ID.s26Memo, s26Sub['01_기획'], '2026S Memo');
  move_(ID.s26SchedProposal, s26Sub['01_기획'], '일정표 제안서');
  move_(ID.s26SchedFinal, s26Sub['01_기획'], '일정표 확정.pdf');

  // ── 4. 아카이브 (과거 학기) ──────────────────────────────
  step_(4, N, '_아카이브 만들기 (2026W 강의안, _업로드 폴더)');
  const archive = getOrCreate_(school, '_아카이브');
  const w26 = getOrCreate_(archive, '2026W');
  const w26Lect = getOrCreate_(w26, '05_강의·프로그램');
  absorbInto_(ID.lectures26W, w26Lect, '2026W 강의안 자료');
  getOrCreate_(archive, '_업로드'); // 로컬 과거 자료를 여기에 올리면 정리 스크립트가 분류
  move_(ID.oldAcctShortcut, archive, '이전자료 바로가기');

  // ── 5. 공용자료 ─────────────────────────────────────────
  step_(5, N, '90_공용자료로 숙소 도면·디자인·인수인계 이동');
  moveFolder_(ID.floorplans, common, '숙소 도면');
  absorbInto_(ID.prevDesign, commonDesign, '이전 경배와찬양학교 디자인');
  move_(ID.handover, commonHandover, '과거 인수인계 자료');

  // ── 6. 큰잔치·시편학교 ─────────────────────────────────
  step_(6, N, '큰잔치·시편학교 폴더 이름 정리');
  renameFolder_(ID.fest08, '2026-08 양재 시편학교·큰잔치');
  renameFolder_(ID.fest11, '2026-11 시편학교·큰잔치');
  renameFolder_(ID.festAdmin, '_공용');

  // ── 7. 빈 폴더 정리 (휴지통, 복구 가능) ──────────────────
  step_(7, N, '비어 있는 옛 폴더(ADMIN, 이전 경배와찬양학교) 휴지통으로');
  trashIfEmpty_(ID.prevSchools, '이전 경배와찬양학교');
  trashIfEmpty_(ID.admin, 'ADMIN');
}

/* ───────────────────────── helpers ───────────────────────── */

function getOrCreate_(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  const f = parent.createFolder(name);
  log_('폴더 생성', name, f.getId(), parent.getName(), '성공');
  return f;
}

function renameFolder_(id, newName) {
  try {
    const f = DriveApp.getFolderById(id);
    const old = f.getName();
    if (old !== newName) { f.setName(newName); log_('이름 변경', old + ' → ' + newName, id, '', '성공'); }
    return f;
  } catch (e) { log_('이름 변경', newName, id, '', '실패', e.message); return null; }
}

function moveFolder_(id, dest, label) {
  try {
    const f = DriveApp.getFolderById(id);
    if (isIn_(f, dest)) return f;
    f.moveTo(dest);
    log_('폴더 이동', label || f.getName(), id, dest.getName(), '성공');
    return f;
  } catch (e) { log_('폴더 이동', label || id, id, dest.getName(), '실패', e.message); return null; }
}

function move_(id, dest, label) {
  try {
    const f = DriveApp.getFileById(id);
    if (isIn_(f, dest)) return;
    f.moveTo(dest);
    log_('파일 이동', label || f.getName(), id, dest.getName(), '성공');
  } catch (e) { log_('파일 이동', label || id, id, dest.getName(), '실패', e.message); }
}

/** src 폴더의 내용물을 dest로 모두 옮기고, 비면 src를 휴지통으로 */
function absorbInto_(srcId, dest, label) {
  let src;
  try { src = DriveApp.getFolderById(srcId); } catch (e) { log_('흡수', label, srcId, dest.getName(), '실패', e.message); return; }
  if (src.getId() === dest.getId()) return;
  const files = src.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    try { f.moveTo(dest); log_('파일 이동', f.getName(), f.getId(), dest.getName(), '성공'); }
    catch (e) { log_('파일 이동', f.getName(), f.getId(), dest.getName(), '실패', e.message); }
  }
  const folders = src.getFolders();
  while (folders.hasNext()) {
    const sf = folders.next();
    try { sf.moveTo(dest); log_('폴더 이동', sf.getName(), sf.getId(), dest.getName(), '성공'); }
    catch (e) { log_('폴더 이동', sf.getName(), sf.getId(), dest.getName(), '실패', e.message); }
  }
  trashIfEmpty_(srcId, label + ' (원래 폴더)');
}

function trashIfEmpty_(id, label) {
  try {
    const f = DriveApp.getFolderById(id);
    const live = 'trashed = false';
    if (!f.searchFiles(live).hasNext() && !f.searchFolders(live).hasNext()) {
      f.setTrashed(true);
      log_('빈 폴더 휴지통', label, id, '', '성공');
    } else {
      log_('빈 폴더 휴지통', label, id, '', '건너뜀', '내용물이 남아 있음');
    }
  } catch (e) { log_('빈 폴더 휴지통', label, id, '', '실패', e.message); }
}

function isIn_(item, folder) {
  const ps = item.getParents();
  while (ps.hasNext()) if (ps.next().getId() === folder.getId()) return true;
  return false;
}

function log_(action, name, id, to, result, note) {
  LOG.push([new Date(), action, name, id, result, to || '', note || '']);
  if (action.indexOf('단계') === -1 && COUNT[result] !== undefined) COUNT[result]++;
  const icon = { '성공': '✔', '건너뜀': '➖', '실패': '✖' }[result] || '•';
  if (action.indexOf('단계') === -1) {
    say_('   ' + icon + ' ' + action + ': ' + name + (to ? ' → ' + to : '') + (note ? '  (' + note + ')' : ''));
  }
}

/** 쌓인 LOG를 시트에 추가하고 비운다 (여러 번 호출해도 중복 없음) */
function flushLog_() {
  if (!LOG_FOLDER || !LOG.length) return;
  try {
    const name = '드라이브 정리 로그';
    const it = LOG_FOLDER.getFilesByName(name);
    let ss;
    if (it.hasNext()) ss = SpreadsheetApp.open(it.next());
    else {
      ss = SpreadsheetApp.create(name);
      DriveApp.getFileById(ss.getId()).moveTo(LOG_FOLDER);
      ss.getSheets()[0].appendRow(['시각', '작업', '대상', 'ID', '결과', '이동 위치', '비고']);
      ss.getSheets()[0].setFrozenRows(1);
    }
    const sh = ss.getSheets()[0];
    sh.getRange(sh.getLastRow() + 1, 1, LOG.length, LOG[0].length).setValues(LOG);
    SpreadsheetApp.flush();
    LOG = [];
  } catch (e) { console.log('로그 시트 저장 실패(작업은 계속): ' + e.message); }
}

/* ═════════════════════════════════════════════════════════════
 * 2단계: 로컬 과거 자료 업로드 후 분류
 * ─────────────────────────────────────────────────────────────
 * 1) anmschool 계정으로 로그인한 브라우저에서
 *    Downloads/'경배와찬양학교 및 7000학교' 폴더 안의 폴더들을
 *    10_경배와찬양학교/_아카이브/_업로드 에 통째로 끌어다 놓는다.
 * 2) 업로드가 끝나면 sortArchiveUploads 실행.
 * ═════════════════════════════════════════════════════════════ */

function sortArchiveUploads() {
  runSafely_('업로드 자료 분류', sortArchiveUploadsBody_);
}

function sortArchiveUploadsBody_() {
  const N = 4;
  step_(1, N, '준비: 폴더 확인 (_업로드, 원천데이터, 템플릿)');
  const root = DriveApp.getFolderById(ROOT_ID);
  const school = DriveApp.getFolderById(ID.school);
  const archive = getOrCreate_(school, '_아카이브');
  const inbox = getOrCreate_(archive, '_업로드');
  const sys = getOrCreate_(root, '00_시스템');
  const rawRegs = getOrCreate_(getOrCreate_(sys, '원천데이터'), '과거 등록명단');
  const tmplAdmin = getOrCreate_(getOrCreate_(sys, '템플릿'), '행정 원판');
  const tmplPromo = getOrCreate_(getOrCreate_(sys, '템플릿'), '홍보 원판');
  LOG_FOLDER = getOrCreate_(sys, '로그');

  step_(2, N, '_업로드 안을 훑어 학기 폴더 / 이전 등록명단 / 형식 폴더 찾기');
  // 업로드 폴더 안을 2단계까지 훑어서 학기 폴더를 찾는다 ('2023 SUMMER ~' 같은 묶음 폴더 대응)
  const queue = [];
  const top = inbox.searchFolders('trashed = false');
  while (top.hasNext()) {
    const f = top.next();
    const name = f.getName();
    if (termCode_(name)) { queue.push(f); continue; }
    if (name.indexOf('이전 등록명단') !== -1) { absorbInto_(f.getId(), rawRegs, '이전 등록명단'); continue; }
    if (name === '형식') {
      const sub = f.searchFolders('trashed = false');
      while (sub.hasNext()) {
        const s = sub.next();
        if (s.getName() === '행정') absorbInto_(s.getId(), tmplAdmin, '형식/행정');
        else if (s.getName() === '홍보') absorbInto_(s.getId(), tmplPromo, '형식/홍보');
      }
      trashIfEmpty_(f.getId(), '형식');
      continue;
    }
    // 묶음 폴더: 안쪽에서 학기 폴더 찾기
    const inner = f.searchFolders('trashed = false');
    while (inner.hasNext()) {
      const g = inner.next();
      if (termCode_(g.getName())) queue.push(g);
    }
  }

  step_(3, N, '학기 폴더 ' + queue.length + '개를 학기 코드(2024S 등)로 정리');
  queue.forEach((f, i) => {
    say_('   (' + (i + 1) + '/' + queue.length + ') ' + f.getName());
    if (Date.now() - T0 > TIME_LIMIT_MS) { flushLog_(); say_('⏱ 시간 제한 임박, 중단. 다시 실행하면 이어서 합니다.'); throw new Error('TIME_LIMIT'); }
    const code = termCode_(f.getName());
    const target = archive.getFoldersByName(code);
    if (target.hasNext()) {
      // 이미 같은 학기 폴더가 있으면(예: 2026W) 내용물을 '원본자료' 하위로 합침
      const dest = getOrCreate_(target.next(), '원본자료');
      absorbInto_(f.getId(), dest, f.getName());
    } else {
      try {
        f.moveTo(archive);
        const old = f.getName();
        f.setName(code);
        log_('학기 폴더 정리', old + ' → ' + code, f.getId(), archive.getName(), '성공');
      } catch (e) { log_('학기 폴더 정리', f.getName(), f.getId(), archive.getName(), '실패', e.message); }
    }
  });

  step_(4, N, '남은 빈 묶음 폴더 정리');
  const rest = inbox.searchFolders('trashed = false');
  while (rest.hasNext()) { const r = rest.next(); trashIfEmpty_(r.getId(), r.getName()); }
}

/** '2024 SUMMER 경배와찬양학교 …' → '2024S', '2026 Winter …' → '2026W' */
function termCode_(name) {
  if (/~/.test(String(name))) return null; // '2023 SUMMER ~' 같은 묶음 폴더 제외
  const m = String(name).match(/(20\d\d)\s*(SUMMER|WINTER|Summer|Winter|summer|winter|S|W)\b/);
  if (!m) return null;
  return m[1] + (/^s/i.test(m[2]) ? 'S' : 'W');
}
