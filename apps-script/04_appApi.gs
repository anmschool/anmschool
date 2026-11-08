/**
 * ANM 앱 — 관리 시트 + API (Apps Script 웹앱)
 * ------------------------------------------------------------
 * 실행 계정: anmschool@anminspirational.com  /  01·02·03과 같은 프로젝트에 새 파일로 추가
 *
 * 함수
 *   setupApp      : 00_시스템/앱/'ANM 앱' 관리 시트 생성 (프로젝트·공지·시간표·안내·장소·관리자 탭) + 비밀키 생성 (1회)
 *   testApi       : 배포 전 점검 — 관리 시트·운영 시트를 읽어 앱이 받을 데이터를 실행 로그에 출력
 *   doGet/doPost  : 웹앱 진입점 (배포 → 웹 앱 → 실행: 나 / 액세스: 모든 사용자)
 *
 * API (앱이 부르는 것)
 *   GET  ?action=content                       → 공개 프로젝트·공지·시간표·안내·장소 (2분 캐시)
 *   POST {action:'login', project, name, phone} → {token, me}   이름 + 전화번호 전체 (단체는 인솔자·교역자 번호도 허용)
 *   POST {action:'me', token}                   → {me}          로그인 유지 (토큰 60일)
 *   POST {action:'admin', pin, project}         → {stats}       관리자 탭의 PIN
 *   POST {action:'apply', key, ops:[…]}          → 관리 시트 내용 일괄 반영 (시즌 세팅 도구용, ADMIN_KEY 필요)
 *   POST {action:'register', project, form}     → 웹 신청서 접수 → 운영 시트 '웹 신청' 탭에 한 줄 (03이 5분마다 등록으로 옮김)
 *
 * 원칙
 *   - 운영 시트는 공개하지 않는다. API가 본인 행만 골라 필요한 칸만 내보낸다 (주소·생년월일·기도제목·연락처는 절대 안 보냄)
 *   - 관리자는 'ANM 앱' 시트에서 프로젝트별로 상태(준비/진행/종료/숨김)와 공지·시간표·안내·장소를 관리한다
 */

const APP_SHEET_NAME = 'ANM 앱';
const APP_TABS = {
  프로젝트: ['ID', '종류', '제목', '부제', '시작일', '종료일', '장소', '상태', '순서', '신청 링크', '대표 이미지', '운영 시트 ID', '로그인', '색', '소개'],
  공지: ['프로젝트ID', '날짜', '제목', '내용', '고정', '대상 트랙', '공개'],
  시간표: ['프로젝트ID', '트랙', '날짜', '시작', '끝', '제목', '장소', '메모'],
  안내: ['프로젝트ID', '섹션', '제목', '내용', '순서'],
  장소: ['프로젝트ID', '이름', '종류', '설명', '지도 링크', '이미지', '영상', '순서'],
  관리자: ['이름', 'PIN', '프로젝트', '메모'],
  '접속 로그': ['시각', '프로젝트', '결과', '코드'],
};
const KIND_LIST = ['경배와찬양학교', '예배', '큰잔치', '훈련', '기타'];
const STATUS_VISIBLE = { 진행: 1, 준비: 1, 종료: 1 };   // 숨김은 앱에 안 나옴
const TOKEN_DAYS = 60;

/* ═════════════════════════ setup ═════════════════════════ */

function setupApp() {
  runSafely_('ANM 앱 관리 시트 만들기', () => {
    step_(1, 4, '00_시스템/앱 폴더에 관리 시트 찾기/만들기');
    const root = DriveApp.getFolderById(ROOT_ID);
    const sys = getOrCreate_(root, '00_시스템');
    LOG_FOLDER = getOrCreate_(sys, '로그');
    const ss = getOrCreateSheet_(getOrCreate_(sys, '앱'), APP_SHEET_NAME);

    step_(2, 4, '탭 만들기');
    Object.keys(APP_TABS).forEach(n => ensureTab_(ss, n, APP_TABS[n]));
    const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

    step_(3, 4, '기본 내용 채우기 (2027W · 큰잔치 · 훈련, 2027W 안내·장소)');
    let opsId = '';
    try { opsId = openOps_().getId(); } catch (e) { log_('운영 시트', '2027W 운영 시트를 못 찾음', '', '', '건너뜀', '나중에 프로젝트 탭에 ID 입력'); }
    seedApp_(ss, opsId);
    styleApp_(ss);

    step_(4, 4, '비밀키 · 관리자 PIN');
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('APP_SECRET')) props.setProperty('APP_SECRET', Utilities.getUuid() + Utilities.getUuid());
    props.setProperty('APP_SHEET_ID', ss.getId());
    const adm = ss.getSheetByName('관리자');
    if (adm.getLastRow() < 2) {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      adm.getRange(2, 1, 1, 4).setValues([['니들', pin, '전체', '앱 관리자 화면 PIN (6자리)']]);
      say_('관리자 PIN: ' + pin + '  (관리자 탭에서 바꿀 수 있음)');
    }
    say_('👉 관리 시트: ' + ss.getUrl());
    say_('다음: 배포 → 새 배포 → 유형 "웹 앱" → 실행: 나 / 액세스: 모든 사용자 → 웹 앱 URL을 앱 설정에 넣기');
  });
}

function seedApp_(ss, opsId) {
  const P = ss.getSheetByName('프로젝트');
  if (P.getLastRow() < 2) {
    P.getRange(2, 1, 4, APP_TABS.프로젝트.length).setValues([
      ['2027W', '경배와찬양학교', '2027 WINTER 새 예루살렘을 향한 경배와찬양학교 및 7000학교', '얽매이지 않는 삶 (고전 6:12)', '2027-01-06', '2027-01-16',
        '명지대학교 자연캠퍼스 60주년 기념 채플관', '진행', 1, 'https://forms.gle/rdfXzXvHyYnkXaQv7', '', opsId, 'ON', '#6E1F3A',
        '하스데반 선교사와 경배와찬양 국제사역팀이 인도합니다. 십대 1/11~14 · 어린이 1/14~16 · 대학 청년 및 일반인 1/6~9 · 청지기 1/6~16'],
      ['매주예배', '예배', '매주 예배 · 목요모임 · 7000모임', '목요일 오후 7시 · 토요일 오후 4시', '', '', '온누리교회 · 서빙고 경배와찬양 훈련원', '진행', 2, '', '', '', 'OFF', '#6E1F3A', '목요모임\n- 일시: 매주 목요일 오후 7시 (18:30부터 기도모임으로 시작합니다)\n- 장소: 온누리교회 (서울 용산구 이촌로 347-11)\n7000모임\n- 일시: 매주 토요일 오후 4시\n- 장소: 서빙고 경배와찬양 훈련원 (서울 용산구 서빙고로59길 21-2)'],
      ['2026-11-큰잔치', '큰잔치', '경배와찬양 큰잔치 · 시편학교', '', '', '', '', '준비', 2, '', '', '', 'OFF', '#3A1022', ''],
      ['7000훈련', '훈련', '7000훈련학교 및 어린이·십대 훈련', '매주 토요일 · 서빙고 경배와찬양 훈련원', '', '', '서빙고 경배와찬양 훈련원 (서울 용산구 서빙고로59길 21-2)', '진행', 3, '', '', '', 'OFF', '#8A3554', '7000훈련학교\n- 일시: 매주 토요일 오전 9시\n- 장소: 서빙고 경배와찬양 훈련원\n어린이·십대 훈련\n- 일시: 매주 토요일 오후 2시\n- 장소: 서빙고 경배와찬양 훈련원\n주소: 서울 용산구 서빙고로59길 21-2 (서빙고동)'],
    ]);
    P.getRange('E2:F50').setNumberFormat('yyyy-mm-dd');
  }
  const G = ss.getSheetByName('안내');
  if (G.getLastRow() < 2) {
    const rows = [
      ['훈련 안내', '경배와찬양학교를 기도로 준비하며', '- 훈련 가운데 하나님의 임재해주시기를 간절히 기도합니다.\n- 모든 훈련은 시작 전에 미리 와서, 기도로 준비해 주십시오.\n- 훈련 기간 중에는 언어 사용과 행동에 주의하여 주시기 바랍니다.'],
      ['훈련 안내', '복장', '- 형제는 운동복이 아닌 긴바지, 자매는 긴 치마를 준비해 주시기 바랍니다.\n- 예배에 동참할 때 운동화를 착용해 주시기 바랍니다.'],
      ['훈련 안내', '식사예절', '- 식탁의 모든 자리가 채워지면 함께 식사 기도를 드린 다음 식사합니다.\n- 같은 식탁의 지체들이 식사를 마칠 때까지 기다렸다가 질서 있게 식기를 반납해 주십시오.\n- 큰 소리나 주변을 흩트리는 언어에 주의해 주십시오.'],
      ['훈련 안내', '숙소에서', '- 서로 안식할 수 있도록 배려해 주십시오.\n- 취침 및 기상 시간을 지켜 주십시오.\n- 잠옷 차림으로 숙소 내를 다니지 않도록 주의해 주십시오.\n- 숙소를 나가실 때는 항상 소등해 주십시오.\n- 훈련이 끝나는 날은 숙소 정리를 함께 해 주십시오.'],
      ['훈련비', '입금 계좌', '- 청지기·십대·대학 청년 및 일반인·온라인: 우리은행 1005-604-700231 경배와찬양\n- 어린이: 우리은행 1005-404-679551 경배와찬양\n- 입금자명은 "이름(교회)"로 적어 주세요.'],
      ['훈련비', '환불 규정', '- 훈련 시작 2주 전까지 100% 환불\n- 훈련 시작 2주 전부터 전날까지 50% 환불\n- 훈련 당일 환불 불가\n- 모든 환불은 훈련이 마무리된 후 계좌이체로 진행됩니다 (수수료 공제).'],
      ['문의', '연락처', '- 이메일 7000school@gmail.com\n- 한국 +82 (0)2 796 9700\n- 독일 +49 (0)179 5705756'],
    ];
    G.getRange(2, 1, rows.length, 5).setValues(rows.map((r, i) => ['2027W', r[0], r[1], r[2], i + 1]));
  }
  const L = ss.getSheetByName('장소');
  if (L.getLastRow() < 2) {
    const rows = [
      ['60주년 기념 채플관', '예배', '모든 예배와 강의가 열리는 곳', '/images/facility/chapel_back-to-stage.jpg', '/videos/course1_main_gate_to_chapel.mp4'],
      ['식당', '식당', '채플관에서 걸어서 이동', '/images/facility/dining_interior.jpg', '/videos/course2_chapel_to_restaurant.mp4'],
      ['5동', '숙소', '생활관 5동', '/images/facility/dorm5_entrance.jpg', '/videos/course2_chapel_to_restaurant.mp4'],
      ['명덕관', '숙소', '명덕관 숙소', '/images/facility/myeongdeok_entrance.jpg', '/videos/course3_main_gate_to_myeongdeok.mp4'],
    ];
    L.getRange(2, 1, rows.length, 8).setValues(rows.map((r, i) => ['2027W', r[0], r[1], r[2], 'https://map.naver.com/p/search/명지대학교%20자연캠퍼스', r[3], r[4], i + 1]));
  }
  const N = ss.getSheetByName('공지');
  if (N.getLastRow() < 2) {
    N.getRange(2, 1, 1, 7).setValues([['2027W', new Date(), '2027 WINTER 경배와찬양학교 신청이 열렸습니다', '선등록은 12월 23일(수)까지입니다. 신청 후 안내된 계좌로 훈련비를 입금해 주세요.', true, '전체', true]]);
  }
}

function styleApp_(ss) {
  ss.getSheetByName('공지').getRange('E2:E500').insertCheckboxes();
  ss.getSheetByName('공지').getRange('G2:G500').insertCheckboxes();
  ss.getSheetByName('공지').getRange('B2:B500').setNumberFormat('yyyy-mm-dd');
  ss.getSheetByName('시간표').getRange('C2:C2000').setNumberFormat('yyyy-mm-dd');
  ss.getSheetByName('시간표').getRange('D2:E2000').setNumberFormat('@');
  const st = SpreadsheetApp.newDataValidation().requireValueInList(['준비', '진행', '종료', '숨김'], true).build();
  ss.getSheetByName('프로젝트').getRange('H2:H100').setDataValidation(st);
  const on = SpreadsheetApp.newDataValidation().requireValueInList(['ON', 'OFF'], true).build();
  ss.getSheetByName('프로젝트').getRange('M2:M100').setDataValidation(on);
  const kind = SpreadsheetApp.newDataValidation().requireValueInList(KIND_LIST, true).setAllowInvalid(true).build();
  ss.getSheetByName('프로젝트').getRange('B2:B100').setDataValidation(kind);
  ['프로젝트', '공지', '안내'].forEach(n => ss.getSheetByName(n).getRange('A1:Z1000').setWrap(true).setVerticalAlignment('top'));
  ss.getSheetByName('관리자').setTabColor('#999999');
}

/* ═════════════════════════ 웹앱 진입점 ═════════════════════════ */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'content' || !p.action) return json_({ ok: true, data: getContent_() });
    if (p.action === 'ping') return json_({ ok: true, time: new Date().toISOString() });
    if (p.action === 'asset') return json_(assetB64_(p.id, p.w));
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) { return json_({ ok: false, error: 'server', message: String(err.message || err) }); }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return json_({ ok: false, error: 'bad_json' }); }
  try {
    if (body.action === 'login') return json_(apiLogin_(body));
    if (body.action === 'me') return json_(apiMe_(body));
    if (body.action === 'admin') return json_(apiAdmin_(body));
    if (body.action === 'content') return json_({ ok: true, data: getContent_() });
    if (body.action === 'apply') return json_(apiApply_(body));
    if (body.action === 'register') return json_(apiRegister_(body));
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) { alert_('앱 API ' + (body.action || ''), String(err.message || err)); return json_({ ok: false, error: 'server', message: String(err.message || err) }); }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ═════════════════════════ 콘텐츠 ═════════════════════════ */

function appSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('APP_SHEET_ID');
  if (!id) throw new Error('setupApp을 먼저 실행하세요');
  return SpreadsheetApp.openById(id);
}

function getContent_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('content_v1');
  if (hit) return JSON.parse(hit);
  const ss = appSheet_();
  const projRows = rows_(ss.getSheetByName('프로젝트'));
  const data = buildContent_({
    projects: projRows, notices: rows_(ss.getSheetByName('공지')),
    schedule: rows_(ss.getSheetByName('시간표')), guides: rows_(ss.getSheetByName('안내')), places: rows_(ss.getSheetByName('장소')),
  });
  // 트랙 날짜·요금·선등록 마감은 운영 시트 한 곳에서 (신청서·메인 앱이 함께 씀)
  data.tracks = {};
  projRows.filter(r => r.ID && STATUS_VISIBLE[r.상태] && String(r['운영 시트 ID'] || '').trim()).forEach(r => {
    try { data.tracks[String(r.ID)] = tracksFor_(String(r['운영 시트 ID']).trim()); } catch (e) { console.log('트랙 읽기 실패 ' + r.ID + ': ' + e.message); }
  });
  const s = JSON.stringify(data);
  if (s.length < 95000) cache.put('content_v1', s, 120);
  return data;
}

/** 순수 함수: 관리 시트 행 → 앱용 JSON (숨김 프로젝트·비공개 공지 제외) */
function buildContent_(t) {
  const d = v => (v instanceof Date ? Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd') : String(v || '').trim());
  const tm = v => (v instanceof Date ? Utilities.formatDate(v, 'Asia/Seoul', 'HH:mm') : String(v || '').trim());
  const projects = t.projects.filter(r => r.ID && STATUS_VISIBLE[r.상태]).map(r => ({
    id: String(r.ID), kind: r.종류, title: r.제목, subtitle: r.부제, start: d(r.시작일), end: d(r.종료일), venue: r.장소,
    status: r.상태, order: Number(r.순서) || 99, applyUrl: r['신청 링크'], image: r['대표 이미지'], login: String(r.로그인).toUpperCase() === 'ON' && !!r['운영 시트 ID'],
    color: r.색 || '#6E1F3A', about: r.소개,
  })).sort((a, b) => a.order - b.order);
  const ok = {}; projects.forEach(p => (ok[p.id] = 1));
  const inScope = id => id === '전체' || ok[id];
  const truthy = v => v === true || String(v).toUpperCase() === 'TRUE';
  return {
    updatedAt: new Date().toISOString(),
    projects,
    notices: t.notices.filter(r => r.제목 && inScope(String(r.프로젝트ID)) && (r.공개 === '' || truthy(r.공개))).map(r => ({
      project: String(r.프로젝트ID), date: d(r.날짜), title: r.제목, body: r.내용, pinned: truthy(r.고정), track: r['대상 트랙'] || '전체',
    })).sort((a, b) => (b.pinned - a.pinned) || (a.date < b.date ? 1 : -1)),
    schedule: t.schedule.filter(r => r.제목 && inScope(String(r.프로젝트ID))).map(r => ({
      project: String(r.프로젝트ID), track: r.트랙 || '전체', date: d(r.날짜), start: tm(r.시작), end: tm(r.끝), title: r.제목, place: r.장소, note: r.메모,
    })).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1)),
    guides: t.guides.filter(r => r.제목 && inScope(String(r.프로젝트ID))).map(r => ({
      project: String(r.프로젝트ID), section: r.섹션, title: r.제목, body: r.내용, order: Number(r.순서) || 99,
    })).sort((a, b) => a.order - b.order),
    places: t.places.filter(r => r.이름 && inScope(String(r.프로젝트ID))).map(r => ({
      project: String(r.프로젝트ID), name: r.이름, kind: r.종류, body: r.설명, map: r['지도 링크'], image: r.이미지, video: r.영상, order: Number(r.순서) || 99,
    })).sort((a, b) => a.order - b.order),
  };
}

/* ═════════════════════════ 로그인 · 내 정보 ═════════════════════════ */

function apiLogin_(b) {
  const name = normName_(b.name), phone = normDigits_(b.phone);
  if (!name || phone.length < 9) return { ok: false, error: 'invalid_input' };
  const cache = CacheService.getScriptCache();
  const fk = 'fail_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, name + '|' + b.project)).slice(0, 20);
  const fails = Number(cache.get(fk) || 0);
  if (fails >= 8) return { ok: false, error: 'too_many' };
  const proj = projectRow_(b.project);
  if (!proj || !proj.login) return { ok: false, error: 'no_project' };
  const fast = cachedLogin_(proj.id, name, phone);
  if (fast) { cache.remove(fk); return { ok: true, token: signToken_({ p: proj.id, c: fast.code, x: Date.now() + TOKEN_DAYS * 864e5 }), me: fast.me }; }
  const ops = readOps_(proj.opsId);
  const hit = findPerson_(ops, name, phone);
  appLog_(b.project, hit.ok ? '성공' : hit.error, hit.ok ? hit.code : '');
  if (!hit.ok) { cache.put(fk, String(fails + 1), 600); return { ok: false, error: hit.error }; }
  cache.remove(fk);
  return { ok: true, token: signToken_({ p: proj.id, c: hit.code, x: Date.now() + TOKEN_DAYS * 864e5 }), me: buildMe_(ops, hit.code, proj) };
}

function apiMe_(b) {
  const t = verifyToken_(b.token);
  if (!t) return { ok: false, error: 'bad_token' };
  const fastMe = cachedMe_(t.p, t.c);
  if (fastMe) return { ok: true, me: fastMe };
  const proj = projectRow_(t.p);
  if (!proj || !proj.login) return { ok: false, error: 'no_project' };
  const ops = readOps_(proj.opsId);
  const me = buildMe_(ops, t.c, proj);
  if (!me) return { ok: false, error: 'not_found' };
  return { ok: true, me };
}

function apiAdmin_(b) {
  const ss = appSheet_();
  const admins = rows_(ss.getSheetByName('관리자'));
  const a = admins.find(r => String(r.PIN).trim() && String(r.PIN).trim() === String(b.pin || '').trim());
  if (!a) return { ok: false, error: 'bad_pin' };
  if (a.프로젝트 !== '전체' && String(a.프로젝트) !== String(b.project)) return { ok: false, error: 'forbidden' };
  const proj = projectRow_(b.project);
  if (!proj || !proj.opsId) return { ok: false, error: 'no_project' };
  return { ok: true, admin: a.이름, stats: buildStats_(readOps_(proj.opsId)) };
}

function projectRow_(id) {
  const r = rows_(appSheet_().getSheetByName('프로젝트')).find(x => String(x.ID) === String(id));
  if (!r) return null;
  return { id: String(r.ID), title: r.제목, status: String(r.상태 || ''), opsId: String(r['운영 시트 ID'] || '').trim(), login: String(r.로그인).toUpperCase() === 'ON' && !!r['운영 시트 ID'] };
}

/** 운영 시트에서 필요한 탭만 읽기 (머리글 이름 기준) */
/** 운영 시트의 트랙·금액·설정 → 공개해도 되는 트랙 정보만 */
function tracksFor_(opsId) {
  const ss = SpreadsheetApp.openById(opsId);
  const d = v => (v instanceof Date ? Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd') : String(v || '').trim());
  const get = n => { const sh = ss.getSheetByName(n); return sh ? rows_(sh) : []; };
  const fee = get('금액');
  const dl = (get('설정').find(r => r.항목 === '선등록 마감') || {}).값;
  return {
    deadline: d(dl),
    list: get('트랙').filter(r => r.트랙).map(r => {
      const f = {};
      fee.filter(x => x.트랙 === r.트랙).forEach(x => { f[x.요율] = [Number(x.선등록) || 0, Number(x.일반등록) || 0]; });
      return { name: String(r.트랙), mode: String(r.형태 || ''), account: String(r.계좌 || ''), in1: d(r.입실1), out1: d(r.퇴실1), in2: d(r.입실2), out2: d(r.퇴실2), fees: f };
    }),
  };
}

function readOps_(opsId) {
  const ss = SpreadsheetApp.openById(opsId);
  const get = (n) => { const sh = ss.getSheetByName(n); return sh ? rows_(sh) : []; };
  return { reg: get('Master_DB(등록)'), lod: get('숙소'), grp: get('단체교회별 확인 표'), trk: get('트랙') };
}

/** 순수 함수: 이름 + 전화(본인 / 단체 인솔자 / 교역자)로 찾기 */
function findPerson_(ops, name, phone) {
  const grpPhones = {};
  ops.grp.forEach(g => { grpPhones[g.단체ID] = [normDigits_(g['인솔자 연락처']), normDigits_(g['교역자 연락처'])].filter(x => x.length >= 9); });
  const cands = ops.reg.filter(r => r.코드 && normName_(r.이름) === name);
  if (!cands.length) return { ok: false, error: 'not_found' };
  const match = cands.filter(r => {
    const own = String(r.연락처 || '').split('/').map(normDigits_);
    return own.indexOf(phone) !== -1 || (r.단체ID && (grpPhones[r.단체ID] || []).indexOf(phone) !== -1);
  });
  if (!match.length) return { ok: false, error: 'not_found' };
  const live = match.filter(r => r.상태 !== '취소');
  if (!live.length) return { ok: false, error: 'cancelled' };
  return { ok: true, code: String(live[0].코드) };
}

/** 순수 함수: 본인 화면에 보낼 정보만 (연락처·주소·생년월일·기도제목 제외) */
function buildMe_(ops, code, proj) {
  const r = ops.reg.find(x => String(x.코드) === String(code));
  if (!r) return null;
  const d = v => (v instanceof Date ? Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd') : String(v || ''));
  const pay = String(r.입금여부 || '');
  const state = /^O/.test(pay) ? 'paid' : /부분/.test(pay) ? 'partial' : /미납/.test(pay) ? 'unpaid' : /취소/.test(pay) ? 'cancelled' : 'checking';
  const track = String(r['경배와찬양학교 구분'] || '');
  const t = ops.trk.find(x => x.트랙 === track) || {};
  const g = r.단체ID ? ops.grp.find(x => x.단체ID === r.단체ID) : null;
  const lodging = ops.lod.filter(x => String(x.코드) === String(code) && x.입금여부 !== '취소').map(x => ({
    segment: String(x.구간 || '1'), checkIn: d(x.입실), checkOut: d(x.퇴실), building: String(x.동 || ''), room: String(x.호실 || ''),
  })).sort((a, b) => (a.segment < b.segment ? -1 : 1));
  return {
    project: proj.id, projectTitle: proj.title, code: String(r.코드), name: r.이름, church: r.교회, track, kind: r.구분, gender: r.성별,
    online: t.형태 === '온라인' || /온라인/.test(track),
    period: [[d(t.입실1), d(t.퇴실1)], [d(t.입실2), d(t.퇴실2)]].filter(p => p[0]),
    payment: { state, label: pay || '확인 중', fee: Number(r.훈련비) || null, account: r.계좌 || t.계좌 || '', depositorHint: r.이름 + (r.교회 ? '(' + r.교회 + ')' : ''), groupPaid: !!r.단체ID },
    group: g ? { id: g.단체ID, name: g['교회/단체명'], status: g['단체별 입금 완료 여부'] } : null,
    lodging,
    checkedIn: r['현장등록 확인여부'] === true,
    cancelled: r.상태 === '취소',
  };
}

/** 순수 함수: 관리자 화면 숫자 */
function buildStats_(ops) {
  const live = ops.reg.filter(r => r.코드 && r.상태 !== '취소');
  const by = {};
  live.forEach(r => {
    const k = r['경배와찬양학교 구분'] || '기타';
    const o = by[k] = by[k] || { track: k, total: 0, paid: 0, partial: 0, unpaid: 0, brother: 0, sister: 0 };
    o.total++;
    const p = String(r.입금여부 || '');
    if (/^O/.test(p)) o.paid++; else if (/부분/.test(p)) o.partial++; else o.unpaid++;
    if (r.성별 === '형제') o.brother++; else if (r.성별 === '자매') o.sister++;
  });
  const lod = ops.lod.filter(x => x.코드 && x.입금여부 !== '취소');
  return {
    total: live.length, cancelled: ops.reg.filter(r => r.상태 === '취소').length,
    tracks: Object.keys(by).map(k => by[k]),
    lodging: { lines: lod.length, assigned: lod.filter(x => x.호실 !== '' && x.호실 != null).length },
    groups: ops.grp.filter(g => g.단체ID).length,
    checkedIn: live.filter(r => r['현장등록 확인여부'] === true).length,
    updatedAt: new Date().toISOString(),
  };
}

/* ═════════════════════════ 토큰 · 도우미 ═════════════════════════ */

function signToken_(payload) {
  const secret = PropertiesService.getScriptProperties().getProperty('APP_SECRET');
  const body = Utilities.base64EncodeWebSafe(JSON.stringify(payload), Utilities.Charset.UTF_8).replace(/=+$/, '');
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret)).replace(/=+$/, '');
  return body + '.' + sig;
}

function verifyToken_(tok) {
  if (!tok || String(tok).indexOf('.') < 0) return null;
  const [body, sig] = String(tok).split('.');
  const secret = PropertiesService.getScriptProperties().getProperty('APP_SECRET');
  const want = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret)).replace(/=+$/, '');
  if (want !== sig) return null;
  try {
    const p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(body + '==='.slice((body.length + 3) % 4))).getDataAsString());
    return p.x > Date.now() ? p : null;
  } catch (e) { return null; }
}

function normName_(s) { return String(s || '').replace(/\s/g, '').trim(); }
function normDigits_(s) {
  let d = String(s == null ? '' : (typeof s === 'number' ? Math.round(s) : s)).replace(/\(?\+82\)?/, '').replace(/\D/g, '');
  if (d && d[0] !== '0') d = '0' + d;
  return d;
}

/** 머리글 → 객체 배열 (빈 행 제외) */
function rows_(sh) {
  const v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  const h = v[0].map(x => String(x).trim());
  return v.slice(1).filter(r => r.some(x => x !== '' && x !== null)).map(r => { const o = {}; h.forEach((k, i) => { if (k && !(k in o)) o[k] = r[i]; }); return o; });
}

function appLog_(project, result, code) {
  try {
    const sh = appSheet_().getSheetByName('접속 로그');
    sh.appendRow([new Date(), project, result, code]);
  } catch (e) {}
}

/* ═════════════════════════ 웹 신청 (register) ═════════════════════════ */

const REG_TRACK_NAMES = {
  청지기: '청지기들을 위한 경배와찬양학교',
  십대: '십대를 위한 경배와찬양학교',
  미래세대: '십대를 위한 경배와찬양학교', // 옛 신청서 호환
  어린이: '어린이를 위한 경배와찬양학교',
  대학청년: '대학 청년 및 일반인을 위한 경배와찬양학교',
};
const REG_LIMITS = { short: 200, long: 3000, members: 300 };

function apiRegister_(b) {
  if (b.hp) return { ok: true, receipt: '-' };                      // 봇이 채우는 숨은 칸
  const f = b.form || {};
  const v = validateRegistration_(f);
  if (!v.ok) return v;
  const proj = projectRow_(b.project);
  if (!proj || !proj.opsId) return { ok: false, error: 'no_project' };
  if (proj.status === '종료' || proj.status === '숨김') return { ok: false, error: 'closed' };

  const cache = CacheService.getScriptCache();
  const who = normDigits_(f.type === '단체' ? f.repPhone : f.phone);
  const rk = 'reg_' + who;
  const cnt = Number(cache.get(rk) || 0);
  if (cnt >= 5) return { ok: false, error: 'too_many' };
  // 같은 내용 연속 제출(두 번 클릭) → 같은 접수번호
  const dk = 'regdup_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(f))).slice(0, 22);
  const prev = cache.get(dk);
  if (prev) return { ok: true, receipt: prev, duplicate: true };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'busy' };
  try {
    const ss = SpreadsheetApp.openById(proj.opsId);
    const sh = ensureWebTab_(ss);
    const row = buildWebRow_(f, new Date(), b.lang);
    const at = sh.getLastRow() + 1;
    const receipt = proj.id + '-W' + String(at - 1).padStart(4, '0');
    row[0] = receipt;
    sh.getRange(at, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    cache.put(rk, String(cnt + 1), 600);
    cache.put(dk, receipt, 300);
    return { ok: true, receipt };
  } finally { lock.releaseLock(); }
}

/** 순수 함수: 입력 검사 → {ok} 또는 {ok:false, error:'invalid', fields:[…]} */
function validateRegistration_(f) {
  const bad = [];
  const s = (k, max) => { const x = String(f[k] == null ? '' : f[k]).trim(); if (x.length > (max || REG_LIMITS.short)) bad.push(k); return x; };
  const need = (k, max) => { if (!s(k, max)) bad.push(k); };
  const phoneOk = (x) => normDigits_(x).length >= 9;
  if (f.type !== '개인' && f.type !== '단체') return { ok: false, error: 'invalid', fields: ['type'] };
  if (!REG_TRACK_NAMES[f.track]) bad.push('track');
  if (f.mode !== '현장' && f.mode !== '온라인') bad.push('mode');
  if (f.consent !== true) bad.push('consent');
  if (f.type === '개인') {
    ['name', 'gender', 'birth', 'phone', 'email', 'address', 'church', 'category', 'training'].forEach(k => need(k));
    need('prayer', REG_LIMITS.long);
    ['role', 'school', 'major', 'grade', 'job'].forEach(k => s(k));
    if (f.phone && !phoneOk(f.phone)) bad.push('phone');
  } else {
    ['churchName', 'address', 'pastorName', 'pastorAttend', 'pastorPhone', 'repName', 'repPhone', 'repEmail'].forEach(k => need(k));
    s('prayer', REG_LIMITS.long);
    if (f.repPhone && !phoneOk(f.repPhone)) bad.push('repPhone');
    const ms = Array.isArray(f.members) ? f.members : [];
    if (!ms.length || ms.length > REG_LIMITS.members) bad.push('members');
    ms.forEach((m, i) => {
      ['name', 'gender', 'phone', 'birth', 'category', 'training'].forEach(k => { const x = String((m || {})[k] || '').trim(); if (!x || x.length > REG_LIMITS.short) bad.push('m' + i + '.' + k); });
      ['email', 'note'].forEach(k => { if (String((m || {})[k] || '').length > REG_LIMITS.short) bad.push('m' + i + '.' + k); });
    });
  }
  return bad.length ? { ok: false, error: 'invalid', fields: Array.from(new Set(bad)) } : { ok: true };
}

/** 순수 함수: 신청서 → '웹 신청' 탭 한 줄 (03 WEB_HEADERS 순서) */
function buildWebRow_(f, now, lang) {
  const safe = (x) => { const t = String(x == null ? '' : x).trim(); return /^[=+@]/.test(t) ? "'" + t : t; };
  const H = WEB_HEADERS, row = new Array(H.length).fill('');
  const put = (header, val, nth) => {
    let c = 0;
    for (let i = 0; i < H.length; i++) if (H[i] === header) { if (c === (nth || 0)) { row[i] = val; return; } c++; }
    throw new Error('머리글 없음: ' + header);
  };
  const trackText = (f.mode === '온라인' ? '온라인 ' : '') + REG_TRACK_NAMES[f.track];
  put('타임스탬프', now);
  put('신청 방법', f.type);
  put('훈련받고자 하는 학교', trackText);
  put('참여 방식', f.mode);
  put('언어', String(lang || 'ko').slice(0, 5));
  put('개인정보 동의', 'O ' + Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm'));
  if (f.type === '개인') {
    put('이름', safe(f.name)); put('성별', safe(f.gender)); put('생년월일', safe(f.birth)); put('연락처', safe(f.phone));
    put('E-mail', safe(f.email)); put('주소', safe(f.address)); put('참석 교회', safe(f.church)); put('직분', safe(f.role));
    put('구분', safe(f.category)); put('기존 훈련', safe(f.training)); put('학교', safe(f.school)); put('학과', safe(f.major));
    put('학년', safe(f.grade)); put('직장', safe(f.job)); put('기도제목', safe(f.prayer));
  } else {
    put('교회명', safe(f.churchName)); put('주소', safe(f.address), 1); put('교역자명', safe(f.pastorName));
    put('교역자 참석', safe(f.pastorAttend)); put('교역자 연락처', safe(f.pastorPhone)); put('인솔자명', safe(f.repName));
    put('인솔자 연락처', safe(f.repPhone)); put('E-mail', safe(f.repEmail), 1); put('기도제목', safe(f.prayer), 1);
    const ms = f.members.map(m => ({ name: String(m.name || '').trim(), gender: m.gender || '', phone: String(m.phone || '').trim(),
      email: String(m.email || '').trim(), birth: String(m.birth || '').trim(), category: m.category || '', training: m.training || '', note: String(m.note || '').trim() }));
    put('단체 명단', JSON.stringify(ms));
  }
  return row;
}

function ensureWebTab_(ss) {
  let sh = ss.getSheetByName(WEB_TAB);
  if (sh) return sh;
  sh = ss.insertSheet(WEB_TAB);
  sh.getRange(1, 1, 1, WEB_HEADERS.length).setValues([WEB_HEADERS]).setFontWeight('bold').setBackground('#F3E9ED');
  sh.getRange(1, 1, sh.getMaxRows(), WEB_HEADERS.length).setNumberFormat('@');
  sh.getRange(2, 2, sh.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sh.setFrozenRows(1);
  sh.getRange('A1').setNote('웹 신청서(anmschool.vercel.app/apply)가 자동으로 쌓는 탭입니다. 직접 고치지 마세요. 5분마다 Master_DB(등록)으로 옮겨집니다 (접수 로그의 W행 번호).');
  return sh;
}

/** 배포 전 점검: 가짜 신청 2건(개인·단체)을 검사만 하고 줄 모양을 로그에 출력 (시트에 쓰지 않음) */
function testRegister() {
  const ind = { type: '개인', track: '십대', mode: '현장', consent: true, name: '테스트', gender: '여', birth: '100512', phone: '010-1234-5678',
    email: 't@t.t', address: '서울', church: '테스트교회', category: '중고등부', training: '처음 참석', prayer: '기도' };
  console.log(JSON.stringify(validateRegistration_(ind)));
  const row = buildWebRow_(ind, new Date(), 'ko');
  WEB_HEADERS.forEach((h, i) => { if (row[i] !== '') console.log(h + ' = ' + row[i]); });
  console.log(JSON.stringify(validateRegistration_({ type: '단체', track: '어린이', mode: '현장', consent: true, members: [{ name: 'a' }] })));
}

function testApi() {
  const c = getContent_();
  console.log('프로젝트 ' + c.projects.length + '개: ' + c.projects.map(p => p.id + '(' + p.status + (p.login ? ', 로그인' : '') + ')').join(' · '));
  console.log('공지 ' + c.notices.length + ' · 시간표 ' + c.schedule.length + ' · 안내 ' + c.guides.length + ' · 장소 ' + c.places.length);
  const p = c.projects.find(x => x.login);
  if (!p) { console.log('로그인 켜진 프로젝트 없음'); return; }
  const proj = projectRow_(p.id);
  const ops = readOps_(proj.opsId);
  console.log(p.id + ' 운영 시트: 등록 ' + ops.reg.length + '명 · 숙소 ' + ops.lod.length + '줄 · 단체 ' + ops.grp.length);
  console.log('관리자 통계: ' + JSON.stringify(buildStats_(ops)));
  const tok = signToken_({ p: p.id, c: 'TEST', x: Date.now() + 1000 });
  console.log('토큰 서명·검증: ' + (verifyToken_(tok) ? 'OK' : '실패'));
}

/* ═════════════════════════ 1회성 내용 수정 (2026-10-26) ═════════════════════════ */

/** 이미 만든 'ANM 앱' 시트에 10/26 수정 반영: 2027W 제목, 7000훈련학교 및 어린이·십대 훈련, 매주 예배(목요모임·7000모임), 장소 — 여러 번 실행해도 안전 */
function applyUpdate1026() {
  const ss = appSheet_();
  const P = ss.getSheetByName('프로젝트');
  const v = P.getDataRange().getValues(), h = v[0];
  const c = n => h.indexOf(n);
  for (let i = 1; i < v.length; i++) {
    const id = String(v[i][c('ID')]);
    if (id === '2027W') v[i][c('제목')] = '2027 WINTER 새 예루살렘을 향한 경배와찬양학교 및 7000학교';
    if (id === '7000훈련') {
      v[i][c('제목')] = '7000훈련학교 및 어린이·십대 훈련';
      v[i][c('부제')] = '매주 토요일 · 서빙고 경배와찬양 훈련원';
      v[i][c('장소')] = '서빙고 경배와찬양 훈련원 (서울 용산구 서빙고로59길 21-2)';
      v[i][c('상태')] = '진행';
      v[i][c('소개')] = '7000훈련학교\n- 일시: 매주 토요일 오전 9시\n- 장소: 서빙고 경배와찬양 훈련원\n어린이·십대 훈련\n- 일시: 매주 토요일 오후 2시\n- 장소: 서빙고 경배와찬양 훈련원\n주소: 서울 용산구 서빙고로59길 21-2 (서빙고동)';
    }
    if (id === '어린이훈련') v[i][c('상태')] = '숨김';
  }
  P.getRange(1, 1, v.length, h.length).setValues(v);
  if (!v.some(r => String(r[c('ID')]) === '매주예배')) {
    const nr = new Array(h.length).fill('');
    const vals = ['매주예배', '예배', '매주 예배 · 목요모임 · 7000모임', '목요일 오후 7시 · 토요일 오후 4시', '', '', '온누리교회 · 서빙고 경배와찬양 훈련원', '진행', 2, '', '', '', 'OFF', '#6E1F3A', '목요모임\n- 일시: 매주 목요일 오후 7시 (18:30부터 기도모임으로 시작합니다)\n- 장소: 온누리교회 (서울 용산구 이촌로 347-11)\n7000모임\n- 일시: 매주 토요일 오후 4시\n- 장소: 서빙고 경배와찬양 훈련원 (서울 용산구 서빙고로59길 21-2)'];
    APP_TABS.프로젝트.forEach((k, i) => { if (c(k) >= 0) nr[c(k)] = vals[i]; });
    P.appendRow(nr);
  }
  const L = ss.getSheetByName('장소');
  const has = L.getDataRange().getValues().some(r => String(r[0]) === '7000훈련');
  const rowsL = L.getDataRange().getValues();
  if (!rowsL.some(r => String(r[0]) === '매주예배')) {
    L.appendRow(['매주예배', '온누리교회', '목요모임', '서울 용산구 이촌로 347-11', 'https://map.naver.com/p/search/서빙고%20온누리교회', '', '', 1]);
    L.appendRow(['매주예배', '서빙고 경배와찬양 훈련원', '7000모임', '서울 용산구 서빙고로59길 21-2 (서빙고동)', 'https://map.naver.com/p/search/서울%20용산구%20서빙고로59길%2021-2', '', '', 2]);
  }
  if (!has) L.appendRow(['7000훈련', '서빙고 경배와찬양 훈련원', '훈련원', '서울 용산구 서빙고로59길 21-2 (서빙고동)', 'https://map.naver.com/p/search/서울%20용산구%20서빙고로59길%2021-2', '', '', 1]);
  CacheService.getScriptCache().remove('content_v1');
  console.log('✅ 반영 완료 — 앱에 바로 보입니다 (캐시 비움)');
}

/* ═════════════════════════ 시즌 세팅 도구용: 관리 시트 일괄 반영 ═════════════════════════
 * 실행은 anmschool(이 웹앱의 소유자)로 일어나고, 호출하는 쪽은 ADMIN_KEY만 가지면 된다.
 * → 개인 계정으로 작업해도 시트·파일은 전부 anmschool 소유로 바뀜.
 *
 * ops 예:
 *   {op:'upsert', tab:'프로젝트', keys:['ID'], rows:[{ID:'2027W', 제목:'…'}]}     키가 같으면 준 칸만 고침, 없으면 추가
 *   {op:'replace', tab:'안내', where:{프로젝트ID:'2027W'}, rows:[{…}, …]}          조건에 맞는 줄을 지우고 새로 채움
 *   {op:'update', tab:'프로젝트', where:{종류:'경배와찬양학교', 상태:'진행'}, except:{ID:'2027W'}, set:{상태:'종료'}}
 *   {op:'delete', tab:'공지', where:{프로젝트ID:'2027W', 제목:'…'}}
 */
const APPLY_TABS = { 프로젝트: 1, 공지: 1, 시간표: 1, 안내: 1, 장소: 1 };

/** 시즌 세팅 도구가 쓸 비밀키 만들기/보기 (실행 로그에 출력) */
function showAdminKey() {
  const props = PropertiesService.getScriptProperties();
  let k = props.getProperty('ADMIN_KEY');
  if (!k) { k = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); props.setProperty('ADMIN_KEY', k); }
  // 00_시스템/🔒 보안/앱 관리 키.txt 로 저장 → 맥의 Drive 앱에서 Claude가 읽어 시즌 도구에 연결
  const sys = DriveApp.getFolderById(ROOT_ID).getFoldersByName('00_시스템').next();
  const it = sys.getFoldersByName('🔒 보안');
  const sec = it.hasNext() ? it.next() : sys.createFolder('🔒 보안');
  const body = JSON.stringify({ api: ScriptApp.getService().getUrl() || '', key: k }, null, 2);
  const f = sec.getFilesByName('앱 관리 키.txt');
  if (f.hasNext()) f.next().setContent(body); else sec.createFile('앱 관리 키.txt', body, MimeType.PLAIN_TEXT);
  console.log('✅ 관리 키 저장: 00_시스템/🔒 보안/앱 관리 키.txt (공유 금지)');
}

function apiApply_(b) {
  const want = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!want || String(b.key || '') !== want) return { ok: false, error: 'bad_key' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'busy' };
  try {
    const ss = appSheet_();
    const report = (b.ops || []).map(op => applyOp_(ss, op));
    CacheService.getScriptCache().remove('content_v1');
    return { ok: true, report };
  } finally { lock.releaseLock(); }
}

function applyOp_(ss, op) {
  if (!APPLY_TABS[op.tab]) return { tab: op.tab, error: 'tab_not_allowed' };
  const sh = ss.getSheetByName(op.tab);
  const v = sh.getDataRange().getValues();
  const h = v[0].map(x => String(x).trim());
  let rows = v.slice(1);
  const norm = x => (x instanceof Date ? Utilities.formatDate(x, 'Asia/Seoul', 'yyyy-MM-dd') : String(x == null ? '' : x).trim());
  const match = (r, where) => Object.keys(where || {}).every(k => h.indexOf(k) >= 0 && norm(r[h.indexOf(k)]) === norm(where[k]));
  const toRow = (obj, base) => { const r = base ? base.slice() : new Array(h.length).fill(''); Object.keys(obj).forEach(k => { const i = h.indexOf(k); if (i >= 0) r[i] = obj[k]; }); return r; };
  let added = 0, changed = 0, removed = 0;
  if (op.op === 'upsert') {
    (op.rows || []).forEach(o => {
      const where = {}; (op.keys || []).forEach(k => (where[k] = o[k]));
      const i = rows.findIndex(r => match(r, where));
      if (i >= 0) { rows[i] = toRow(o, rows[i]); changed++; } else { rows.push(toRow(o)); added++; }
    });
  } else if (op.op === 'replace') {
    const before = rows.length;
    rows = rows.filter(r => !match(r, op.where));
    removed = before - rows.length;
    (op.rows || []).forEach(o => { rows.push(toRow(o)); added++; });
  } else if (op.op === 'update') {
    rows = rows.map(r => { if (match(r, op.where) && !(op.except && match(r, op.except))) { changed++; return toRow(op.set || {}, r); } return r; });
  } else if (op.op === 'delete') {
    const before = rows.length;
    rows = rows.filter(r => !match(r, op.where));
    removed = before - rows.length;
  } else return { tab: op.tab, error: 'unknown_op' };
  // 다시 쓰기 (머리글 아래 전체)
  const n = Math.max(v.length - 1, rows.length);
  if (n > 0) {
    const out = rows.concat(new Array(Math.max(0, n - rows.length)).fill(0).map(() => new Array(h.length).fill('')));
    sh.getRange(2, 1, n, h.length).setValues(out.map(r => r.slice(0, h.length)));
  }
  return { tab: op.tab, op: op.op, added, changed, removed };
}

/** 11/04: 매주 예배(목요모임) 소개·시간 갱신 — 편집기에서 한 번 실행. 여러 번 실행해도 안전 */
function applyUpdate1104() {
  const P = appSheet_().getSheetByName('프로젝트');
  const v = P.getDataRange().getValues(), h = v[0];
  const c = n => h.indexOf(n);
  const about = [
    '목요모임',
    '하나님의 임재를 경험하는 예배, 영적 회복과 치유가 있는 예배, 십자가의 길과 순교자의 삶을 살기로 결단하는 예배.',
    '하나님께서는 이 세대에 ‘교회는 선교’임을 깨닫고 하나님의 부르심을 따라갈 수 있는 사람들을 찾고 계십니다. 주님을 위해 생명을 바치겠다는 결단으로 열방을 향해 행진하기 원하는 모든 하나님의 사람들을 주님의 이름으로 경배와찬양 목요모임에 초대합니다.',
    '- 일시: 매주 목요일 오후 6시 30분',
    '- 오후 5시부터 6시까지 중보기도로 예배를 준비합니다',
    '- 장소: 온누리교회 (서울 용산구 이촌로 347-11)',
    '7000모임',
    '- 일시: 매주 토요일 오후 4시',
    '- 장소: 서빙고 경배와찬양 훈련원 (서울 용산구 서빙고로59길 21-2)',
  ].join('\n');
  let hit = false;
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][c('ID')]) !== '매주예배') continue;
    v[i][c('부제')] = '목요일 오후 6시 30분 · 토요일 오후 4시';
    v[i][c('소개')] = about;
    hit = true;
  }
  if (!hit) throw new Error('프로젝트 탭에 매주예배 줄이 없습니다. applyUpdate1026을 먼저 실행하세요');
  P.getRange(1, 1, v.length, h.length).setValues(v);
  CacheService.getScriptCache().remove('content_v1');
  console.log('✅ 목요모임 안내 반영 완료 — 앱에 바로 보입니다');
}
