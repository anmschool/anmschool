/**
 * 06_ops.gs — 운영 도구 (같은 Apps Script 프로젝트의 다섯 번째 파일)
 *  ① 텔레그램 알림   : tgConnect() 1회 → 오류·일일 요약이 텔레그램으로
 *  ② 로그인 빠르게    : buildLoginCache() 10분마다 → 로그인·내 정보가 시트를 읽지 않음
 *  ③ 매일 백업        : nightlyBackup() 매일 03시 → 'ANM 백업' 폴더에 사본, 14일 보관
 *  ④ 미래세대 전환(1회): migrateNextGen2027W() → 트랙 이름 '십대'를 '미래세대'로 (참가자 구분·요율 '십대'는 그대로)
 *  setupOpsTriggers() 한 번 실행하면 ②③과 일일 요약 트리거가 모두 걸림.
 *
 * 텔레그램 토큰은 코드에 쓰지 말 것: 프로젝트 설정 → 스크립트 속성 → TG_TOKEN 에 저장.
 */

/* ───────────── ① 텔레그램 ───────────── */

/** 스크립트 속성에 TG_TOKEN 저장 → 봇에게 아무 말이나 보낸 뒤 이 함수 실행 */
function tgConnect() {
  const p = PropertiesService.getScriptProperties();
  const token = p.getProperty('TG_TOKEN');
  if (!token) throw new Error('스크립트 속성에 TG_TOKEN 을 먼저 저장하세요');
  const r = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates', { muteHttpExceptions: true }).getContentText());
  const msgs = (r.result || []).filter(u => u.message && u.message.chat);
  if (!msgs.length) throw new Error('봇에게 먼저 아무 메시지나 보내고 다시 실행하세요');
  const chat = String(msgs[msgs.length - 1].message.chat.id);
  p.setProperty('TG_CHAT', chat);
  tg_('✅ ANM 알림이 연결되었습니다.');
  console.log('연결됨: chat ' + chat);
}

/** 텔레그램으로 보내기 (설정 안 됐으면 조용히 건너뜀) */
function tg_(text) {
  const p = PropertiesService.getScriptProperties();
  const token = p.getProperty('TG_TOKEN'), chat = p.getProperty('TG_CHAT');
  if (!token || !chat) return;
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage',
      { method: 'post', payload: { chat_id: chat, text: String(text).slice(0, 3500) }, muteHttpExceptions: true });
  } catch (e) { console.log('텔레그램 실패: ' + e.message); }
}

/** 같은 오류가 10분 안에 반복되면 한 번만 보냄 */
function alert_(where, msg) {
  const key = 'al_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, where + msg)).slice(0, 20);
  const c = CacheService.getScriptCache();
  if (c.get(key)) return;
  c.put(key, '1', 600);
  tg_('⚠️ ANM 오류 · ' + where + '\n' + msg);
}

/** 매일 아침 요약 */
function dailyReport() {
  const ss = openOps_();
  const reg = rows_(ss.getSheetByName(T.reg));
  const live = reg.filter(r => r.코드 && r.상태 !== '취소');
  const since = Date.now() - 864e5;
  const isNew = r => { const d = r.타임스탬프 instanceof Date ? r.타임스탬프 : new Date(r.타임스탬프); return !isNaN(d) && d.getTime() >= since; };
  const unpaid = live.filter(r => !/^O/.test(String(r.입금여부 || ''))).length;
  const logSh = ss.getSheetByName(T.log);
  const logs = logSh ? readTable_(logSh).filter(r => new Date(r[0]).getTime() >= since) : [];
  const fails = logs.filter(r => String(r[2]) === '실패').length, dupes = logs.filter(r => String(r[2]) === '중복');
  const grpSh = ss.getSheetByName(T.grp);
  const empty = grpSh ? readTable_(grpSh).filter(r => /명단 0명/.test(String(r[11] || ''))).length : 0;
  const byTrack = {};
  live.forEach(r => { const k = r['경배와찬양학교 구분'] || '기타'; byTrack[k] = (byTrack[k] || 0) + 1; });
  tg_('📋 ANM 일일 요약 (' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'M/d') + ')\n' +
    '어제 새 신청 ' + live.filter(isNew).length + '명 · 전체 ' + live.length + '명 · 미입금 ' + unpaid + '명\n' +
    Object.keys(byTrack).map(k => '· ' + k + ' ' + byTrack[k]).join('\n') +
    '\n어제 중복 ' + dupes.length + '건 · 실패 ' + fails + '건' +
    (dupes.length ? '\n· 중복: ' + dupes.slice(0, 5).map(r => String(r[3] || '').split(' → ')[0]).join(', ') + (dupes.length > 5 ? ' 외' : '') : '') +
    (empty ? '\n⚠️ 단체 명단 0명 ' + empty + '건 → 단체교회별 확인 표에서 수기 입력' : '') +
    (fails ? '\n⚠️ 실패는 접수 로그 확인' : ''));
  dropOldStatusTab_(ss);
}

/** 예전 '현황' 탭(#N/A로 깨짐, 지금은 '등록현황'이 대신함)을 한 번 지움 */
function dropOldStatusTab_(ss) {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('OLD_STATUS_DROPPED')) return;
  const sh = (ss || openOps_()).getSheetByName('현황');
  if (sh && T.dash !== '현황') { sh.getParent().deleteSheet(sh); console.log("예전 '현황' 탭 삭제"); }
  p.setProperty('OLD_STATUS_DROPPED', '1');
}

/* ───────────── ② 로그인 캐시 ───────────── */

const LC_TTL = 21600; // 6시간 (10분마다 갱신)
function lcKey_(proj, name, phone) {
  return 'lk_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, proj + '|' + name + '|' + phone));
}

/** 로그인용 요약본을 캐시에 미리 만들어 둠 (개인정보 원본은 넣지 않음: 해시 키 + 화면용 정보만) */
function buildLoginCache() {
  try { dropOldStatusTab_(); } catch (e) { console.log('현황 탭 정리 건너뜀: ' + e.message); }
  const cache = CacheService.getScriptCache();
  rows_(appSheet_().getSheetByName('프로젝트'))
    .filter(r => String(r.로그인).toUpperCase() === 'ON' && String(r['운영 시트 ID'] || '').trim())
    .forEach(r => {
      const proj = projectRow_(r.ID);
      const ops = readOps_(proj.opsId);
      const grpPhones = {};
      ops.grp.forEach(g => { grpPhones[g.단체ID] = [normDigits_(g['인솔자 연락처']), normDigits_(g['교역자 연락처'])].filter(x => x.length >= 9); });
      const put = {};
      ops.reg.filter(x => x.코드 && x.상태 !== '취소').forEach(x => {
        const me = buildMe_(ops, x.코드, proj);
        if (!me) return;
        put['me_' + proj.id + '_' + x.코드] = JSON.stringify(me);
        const phones = String(x.연락처 || '').split('/').map(normDigits_).concat(x.단체ID ? (grpPhones[x.단체ID] || []) : []);
        phones.filter(p => p.length >= 9).forEach(p => { put[lcKey_(proj.id, normName_(x.이름), p)] = String(x.코드); });
      });
      const keys = Object.keys(put);
      for (let i = 0; i < keys.length; i += 100) {
        const part = {}; keys.slice(i, i + 100).forEach(k => { part[k] = put[k]; });
        cache.putAll(part, LC_TTL);
      }
      cache.put('lc_ready_' + proj.id, String(Date.now()), LC_TTL);
      console.log(proj.id + ' 로그인 캐시 ' + keys.length + '개');
    });
}

/** apiLogin_/apiMe_ 에서 먼저 시도 — 없으면 null (기존 방식으로 진행) */
function cachedLogin_(projId, name, phone) {
  const c = CacheService.getScriptCache();
  if (!c.get('lc_ready_' + projId)) return null;
  const code = c.get(lcKey_(projId, name, phone));
  if (!code) return null;
  const m = c.get('me_' + projId + '_' + code);
  return m ? { code, me: JSON.parse(m) } : null;
}
function cachedMe_(projId, code) {
  const m = CacheService.getScriptCache().get('me_' + projId + '_' + code);
  return m ? JSON.parse(m) : null;
}

/* ───────────── ③ 백업 ───────────── */

function nightlyBackup() {
  const it = DriveApp.getFoldersByName('ANM 백업');
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder('ANM 백업');
  const day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const targets = [openOps_(), appSheet_()];
  targets.forEach(ss => DriveApp.getFileById(ss.getId()).makeCopy('[백업 ' + day + '] ' + ss.getName(), folder));
  const cut = Date.now() - 14 * 864e5;
  const files = folder.getFiles();
  while (files.hasNext()) { const f = files.next(); if (f.getDateCreated().getTime() < cut) f.setTrashed(true); }
}

/* ───────────── 트리거 한 번에 ───────────── */

function setupOpsTriggers() {
  const want = { translateContent: b => b.everyHours(1), buildLoginCache: b => b.everyMinutes(10), nightlyBackup: b => b.everyDays(1).atHour(3), dailyReport: b => b.everyDays(1).atHour(8) };
  ScriptApp.getProjectTriggers().filter(t => want[t.getHandlerFunction()]).forEach(t => ScriptApp.deleteTrigger(t));
  Object.keys(want).forEach(fn => want[fn](ScriptApp.newTrigger(fn).timeBased()).create());
  buildLoginCache();
  console.log('트리거 설치: 로그인 캐시 10분 · 백업 매일 03시 · 요약 매일 08시');
}

/* ───────────── ④ 미래세대 → 십대 (1회) ───────────── */

function migrateTeen2027W() {
  const ops = openOps_();
  let n = 0;
  ops.getSheets().forEach(sh => { n += sh.createTextFinder('미래세대').replaceAllWith('십대'); });
  const app = appSheet_();
  ['시간표', '공지', '안내', '프로젝트'].forEach(name => { const sh = app.getSheetByName(name); if (sh) n += sh.createTextFinder('미래세대').replaceAllWith('십대'); });
  // ANM_DB는 지난 시즌 기록이 있으므로 2027W 코드만
  try { openDb_().getSheets().forEach(sh => { n += sh.createTextFinder('2027W-미래세대-').replaceAllWith('2027W-십대-'); }); }
  catch (e) { console.log('ANM_DB 건너뜀: ' + e.message); }
  CacheService.getScriptCache().remove('content_v1');
  buildLoginCache();
  console.log('십대 전환 완료: ' + n + '칸');
}


/* ───────────── ④-2 십대 → 미래세대 (트랙 이름만, 1회) ───────────── */
/** 트랙 이름만 바꾼다. 참가자 구분/요율의 '십대'(나이 구분)는 건드리지 않는다.
 *  - 모든 탭: '2027W-십대-'(코드) · '십대를 위한'(트랙 제목) · '온라인 십대'
 *  - 머리글이 '트랙'인 열: 칸 값이 정확히 '십대'인 것만
 *  - 앱 시트 시간표 '트랙' 열: 목록 안의 '십대' 토큰 */
function migrateNextGen2027W() {
  let n = 0;
  const fix = sh => {
    n += sh.createTextFinder('2027W-십대-').replaceAllWith('2027W-미래세대-');
    n += sh.createTextFinder('십대를 위한').replaceAllWith('미래세대를 위한');
    n += sh.createTextFinder('온라인 십대').replaceAllWith('온라인 미래세대');
    const lastR = sh.getLastRow(), lastC = sh.getLastColumn();
    if (lastR < 1 || lastC < 1) return;
    const head = sh.getRange(1, 1, Math.min(3, lastR), lastC).getValues();
    head.forEach((row, hi) => row.forEach((h, ci) => {
      if (String(h).trim() !== '트랙' || lastR <= hi + 1) return;
      const rg = sh.getRange(hi + 2, ci + 1, lastR - hi - 1, 1), v = rg.getValues();
      let ch = 0;
      v.forEach(r => {
        const parts = String(r[0]).split(/\s*,\s*/);
        if (parts.indexOf('십대') === -1) return;
        r[0] = parts.map(x => (x === '십대' ? '미래세대' : x)).join(', '); ch++;
      });
      if (ch) { rg.setValues(v); n += ch; }
    }));
  };
  const ops = openOps_();
  ops.getSheets().forEach(fix);
  // 트랙 탭: 키워드·폼 선택지 열도 '십대' → '미래세대'
  const trk = ops.getSheetByName('트랙');
  if (trk && trk.getLastRow() > 1) {
    const rg = trk.getRange(2, 2, trk.getLastRow() - 1, 2), v = rg.getValues();
    v.forEach(r => [0, 1].forEach(i => { r[i] = String(r[i]).replace(/(^|\+)십대(?=\+|$)/g, '$1미래세대'); }));
    rg.setValues(v);
  }
  const app = appSheet_();
  ['시간표', '프로젝트'].forEach(name => { const sh = app.getSheetByName(name); if (sh) fix(sh); });
  const pj = app.getSheetByName('프로젝트');
  if (pj) n += pj.createTextFinder('십대 1/11').replaceAllWith('미래세대 1/11');
  try { openDb_().getSheets().forEach(sh => { n += sh.createTextFinder('2027W-십대-').replaceAllWith('2027W-미래세대-'); n += sh.createTextFinder('십대를 위한').replaceAllWith('미래세대를 위한'); }); }
  catch (e) { console.log('ANM_DB 건너뜀: ' + e.message); }
  CacheService.getScriptCache().remove('content_v1');
  buildLoginCache();
  console.log('미래세대 전환 완료: ' + n + '칸');
}

/* ───────────── ⑤ 개인 계정 파일 → anmschool 이관 (1회) ───────────── */
/** 개인 계정이 anmschool에 공유해 둔 파일을 anmschool 소유 사본으로 만든다. 확인 후 원본은 개인 계정에서 삭제 */
function adoptPersonalFiles() {
  const root = DriveApp.createFolder('웹·Linkhub 소스 (2026-11)');
  copyTree_(DriveApp.getFolderById('1lL7A-EPwSWFVmq0YEoPbktxShSXveDkL'), root);
  DriveApp.getFileById('1M802hMRpnwwR212x7caMS9U4AZzmDKb6_MV9n6PrxoA').makeCopy('올네이션스 경배와찬양(ANM) 사역 소개 정리', DriveApp.getRootFolder());
  console.log('이관 완료: ' + root.getUrl());
}
function copyTree_(src, dst) {
  const fs = src.getFiles(); while (fs.hasNext()) { const f = fs.next(); f.makeCopy(f.getName(), dst); }
  const ds = src.getFolders(); while (ds.hasNext()) { const d = ds.next(); copyTree_(d, dst.createFolder(d.getName())); }
}

/* ───────────── ⑥ 웹 사진 내려받기용 (공개해도 되는 사진 3장만) ───────────── */
const PUBLIC_ASSETS = ['1LS8kohsuirFakmJN5kvrrIlV04-y8HpG', '1D_n7l6HRlDuE0OmtSwS6qi4_wDjsHysW', '1vF_xYfKgIHLnQSdyMD83NM1fA65iAAym'];
function assetB64_(id, w) {
  if (PUBLIC_ASSETS.indexOf(id) === -1) return { ok: false, error: 'not_allowed' };
  const width = Math.min(Number(w) || 1200, 2000);
  const r = UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + id + '&sz=w' + width,
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  const b = r.getBlob();
  return { ok: r.getResponseCode() === 200, type: b.getContentType(), data: Utilities.base64Encode(b.getBytes()) };
}

/* ───────────── ⑦ 자동 번역 ('ANM 앱' 시트) ───────────── */
/** 번역 열(…(en), …(zh))이 없으면 만들고, 빈칸만 구글 번역으로 채움. 사람이 고친 칸은 덮어쓰지 않음. 매시간 자동 */
function translateContent() {
  const ss = appSheet_();
  let n = 0;
  Object.keys(TR_FIELDS).forEach(tab => {
    const sh = ss.getSheetByName(tab);
    if (!sh || sh.getLastRow() < 2) return;
    let head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    const need = [];
    Object.keys(TR_FIELDS[tab]).forEach(c => ['en', 'zh'].forEach(L => { if (head.indexOf(c + '(' + L + ')') === -1) need.push(c + '(' + L + ')'); }));
    if (need.length) { sh.getRange(1, head.length + 1, 1, need.length).setValues([need]).setBackground('#EFE8EA'); head = head.concat(need); }
    const rg = sh.getRange(2, 1, sh.getLastRow() - 1, head.length), v = rg.getValues();
    let changed = false;
    v.forEach(row => Object.keys(TR_FIELDS[tab]).forEach(c => {
      const src = String(row[head.indexOf(c)] || '').trim();
      if (!src || /^[\x00-\x7F]*$/.test(src)) return; // 비었거나 이미 영문·숫자뿐이면 건너뜀
      [['en', 'en'], ['zh', 'zh-CN']].forEach(([L, code]) => {
        const i = head.indexOf(c + '(' + L + ')');
        if (row[i]) return;
        try { row[i] = LanguageApp.translate(src, 'ko', code); n++; changed = true; } catch (e) { console.log('번역 실패: ' + e.message); }
      });
    }));
    if (changed) rg.setValues(v);
  });
  CacheService.getScriptCache().remove('content_v1');
  console.log('번역 ' + n + '칸 채움');
}


/* ───────────── ⑤ 테스트 신청 정리 + 남은 '십대' 트랙값 정리 (1회) ───────────── */
/** 운영 시트·ANM_DB에서 아래 코드의 테스트 신청을 지운다.
 *  - Master_DB(등록)·숙소 줄 삭제, 단체(G) 줄 삭제
 *  - 웹 신청 원본 줄은 내용만 비움(줄 번호가 처리 기록과 묶여 있어 삭제하면 다른 신청이 다시 들어감)
 *  - ANM_DB: 이 신청으로 새로 생긴 사람·참석 줄, 다른 데서 안 쓰는 신규(자동) 교회 줄 삭제
 *  - 덤: '경배와찬양학교 구분' 열의 '십대' → '미래세대', 등록현황 다시 만들기 */
const TEST_CODES_2027W = ['2027W-미래세대-0029', '2027W-미래세대-0030', '2027W-미래세대-0031', '2027W-어린이-0001', '2027W-어린이-0002',
  '2027W-청지기-0003', '2027W-청지기-0004', '2027W-온라인-0001'];
const TEST_GROUPS_2027W = ['2027W-G003', '2027W-G004', '2027W-G005'];

function purgeTest2027W() {
  const ss = openOps_(), codes = {}, out = [];
  TEST_CODES_2027W.forEach(c => (codes[c] = 1));
  const delRows = (sh, keep) => {      // keep(row) === false 인 줄을 아래에서부터 삭제
    if (!sh || sh.getLastRow() < 2) return 0;
    const v = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    let n = 0;
    for (let i = v.length - 1; i >= 0; i--) if (!keep(v[i])) { sh.deleteRow(i + 2); n++; }
    return n;
  };
  // 1) 등록: 지우기 전에 원본행·개인코드·교회코드 모아 두기
  const reg = ss.getSheetByName(T.reg);
  const rv = reg.getRange(2, 1, Math.max(1, reg.getLastRow() - 1), REG_INPUT_COLS).getValues();
  const srcs = {}, pcs = {}, ccs = {}, keepP = {}, keepC = {};
  rv.forEach(r => {
    if (codes[r[COL.코드]]) { srcs[r[COL.원본]] = 1; if (r[COL.DB개인코드]) pcs[r[COL.DB개인코드]] = 1; if (r[COL.교회코드]) ccs[r[COL.교회코드]] = 1; }
    else if (r[COL.코드]) { keepP[r[COL.DB개인코드]] = 1; keepC[r[COL.교회코드]] = 1; }
  });
  out.push('등록 ' + delRows(reg, r => !codes[r[0]]));
  out.push('숙소 ' + delRows(ss.getSheetByName(T.lod), r => !codes[r[0]]));
  const g = ss.getSheetByName(T.grp);
  g && g.getRange(2, 1, Math.max(1, g.getLastRow() - 1), 13).getValues().forEach(r => { if (TEST_GROUPS_2027W.indexOf(r[0]) > -1) srcs[r[12]] = 1; });
  out.push('단체 ' + delRows(g, r => TEST_GROUPS_2027W.indexOf(r[0]) === -1));
  // 2) 웹 신청 원본 줄 비우기 (W행번호)
  const web = ss.getSheetByName(WEB_TAB); let w = 0;
  Object.keys(srcs).forEach(s => { const m = String(s).match(/^W(\d+)$/); if (m && web) { web.getRange(Number(m[1]), 1, 1, web.getLastColumn()).clearContent(); w++; } });
  out.push('웹 신청 비움 ' + w);
  // 3) ANM_DB
  try {
    const db = openDb_();
    const P = Object.keys(pcs).filter(p => !keepP[p]), Pset = {}; P.forEach(p => (Pset[p] = 1));
    out.push('DB 참석 ' + delRows(db.getSheetByName('참석'), r => !(Pset[r[3]] && String(r[1]) === '2027W')));
    // 이번 학기 신청으로 처음 생긴 사람만 (메모 열에 '2027W' 표시)
    out.push('DB 사람 ' + delRows(db.getSheetByName('사람'), r => !(Pset[r[0]] && String(r[14]).indexOf('2027W') === 0)));
    const usedC = {}; readTable_(db.getSheetByName('사람')).forEach(r => (usedC[r[6]] = 1));
    out.push('DB 교회 ' + delRows(db.getSheetByName('교회'), r => !(ccs[r[0]] && !keepC[r[0]] && !usedC[r[0]] && String(r[15]) === '신규(자동)')));
  } catch (e) { out.push('DB 건너뜀: ' + e.message); }
  // 4) 남은 '십대' 트랙값 → '미래세대' (머리글이 '경배와찬양학교 구분'인 열)
  let t = 0;
  ss.getSheets().forEach(sh => {
    if (sh.getLastRow() < 2) return;
    sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].forEach((h, ci) => {
      if (String(h).indexOf('경배와찬양학교 구분') !== 0) return;
      const rg = sh.getRange(2, ci + 1, sh.getLastRow() - 1, 1), v = rg.getValues();
      let ch = 0; v.forEach(r => { if (r[0] === '십대') { r[0] = '미래세대'; ch++; } else if (r[0] === '온라인 십대') { r[0] = '온라인 미래세대'; ch++; } });
      if (ch) { rg.setValues(v); t += ch; }
    });
  });
  out.push('십대→미래세대 ' + t);
  buildDashboard_(ss);
  SpreadsheetApp.flush();
  console.log('테스트 정리 완료: ' + out.join(' · '));
}


/* ───────────── ⑥ 2027W 확정 시간표 넣기 (1회 · 다시 실행해도 2027W 줄만 바꿈) ───────────── */
/** 'ANM 앱' 시간표 탭의 2027W 줄을 확정 시간표로 교체. 트랙 칸의 '청지기'는 청지기가 함께하는 일정 */
const SCHEDULE_2027W = [["대학청년·일반, 청지기", "2027-01-06", "15:30", "16:00", "등록", ""], ["대학청년·일반, 청지기", "2027-01-06", "16:00", "17:30", "훈련 안내 및 기도 제목 쓰기", ""], ["대학청년·일반, 청지기", "2027-01-06", "17:30", "18:30", "저녁식사", ""], ["대학청년·일반, 청지기", "2027-01-06", "18:30", "19:30", "휴식", ""], ["대학청년·일반, 청지기", "2027-01-06", "19:30", "22:30", "새 예루살렘을 향하여 Celebration I", "저녁성회"], ["대학청년·일반, 청지기", "2027-01-06", "22:30", "23:00", "개인 기도", ""], ["대학청년·일반, 청지기", "2027-01-06", "23:00", "", "취침", ""], ["대학청년·일반, 청지기", "2027-01-07", "06:00", "07:00", "성경통독묵상", ""], ["대학청년·일반, 청지기", "2027-01-07", "07:00", "08:00", "아침식사", ""], ["대학청년·일반, 청지기", "2027-01-07", "08:00", "10:30", "침묵기도 I", ""], ["대학청년·일반, 청지기", "2027-01-07", "10:30", "12:30", "청지기의 삶과 고난의 축복 I", "오전 강의"], ["대학청년·일반, 청지기", "2027-01-07", "12:30", "14:00", "점심식사", ""], ["대학청년·일반, 청지기", "2027-01-07", "14:00", "15:30", "가나안 전쟁을 모르는 세대 I", "오후 강의 I"], ["대학청년·일반, 청지기", "2027-01-07", "15:30", "16:00", "휴식", ""], ["대학청년·일반, 청지기", "2027-01-07", "16:00", "17:30", "만국을 향하여 I", "오후 강의 II"], ["대학청년·일반, 청지기", "2027-01-07", "17:30", "18:30", "저녁식사", ""], ["대학청년·일반, 청지기", "2027-01-07", "18:30", "19:30", "휴식", ""], ["대학청년·일반, 청지기", "2027-01-07", "19:30", "22:30", "새 예루살렘을 향하여 Celebration II", "저녁성회"], ["대학청년·일반, 청지기", "2027-01-07", "22:30", "23:00", "개인 기도", ""], ["대학청년·일반, 청지기", "2027-01-07", "23:00", "", "취침", ""], ["대학청년·일반, 청지기", "2027-01-08", "06:00", "07:00", "성경통독묵상", ""], ["대학청년·일반, 청지기", "2027-01-08", "07:00", "08:00", "아침식사", ""], ["대학청년·일반, 청지기", "2027-01-08", "08:00", "10:30", "침묵기도 II", ""], ["대학청년·일반, 청지기", "2027-01-08", "10:30", "12:30", "청지기의 삶과 고난의 축복 II", "오전 강의"], ["대학청년·일반, 청지기", "2027-01-08", "12:30", "14:00", "점심식사", ""], ["대학청년·일반, 청지기", "2027-01-08", "14:00", "15:30", "가나안 전쟁을 모르는 세대 II", "오후 강의 I"], ["대학청년·일반, 청지기", "2027-01-08", "15:30", "16:00", "휴식", ""], ["대학청년·일반, 청지기", "2027-01-08", "16:00", "17:30", "만국을 향하여 II", "오후 강의 II"], ["대학청년·일반, 청지기", "2027-01-08", "17:30", "18:30", "저녁식사", ""], ["대학청년·일반, 청지기", "2027-01-08", "18:30", "19:30", "휴식", ""], ["대학청년·일반, 청지기", "2027-01-08", "19:30", "22:30", "새 예루살렘을 향하여 Celebration III", "저녁성회"], ["대학청년·일반, 청지기", "2027-01-08", "22:30", "23:00", "개인 기도", ""], ["대학청년·일반, 청지기", "2027-01-08", "23:00", "", "취침", ""], ["대학청년·일반, 청지기", "2027-01-09", "06:00", "07:00", "성경통독묵상", ""], ["대학청년·일반, 청지기", "2027-01-09", "07:00", "08:00", "아침식사", ""], ["대학청년·일반, 청지기", "2027-01-09", "08:00", "10:30", "침묵기도 III", ""], ["대학청년·일반, 청지기", "2027-01-09", "10:30", "12:30", "소감문 작성 및 7000훈련 안내", ""], ["대학청년·일반, 청지기", "2027-01-09", "12:30", "", "귀가", ""], ["대학청년·일반, 청지기", "2027-01-09", "16:00", "", "7000모임", "서빙고 경배와찬양 훈련원"], ["미래세대, 청지기", "2027-01-11", "15:30", "16:00", "등록", ""], ["미래세대, 청지기", "2027-01-11", "16:00", "17:00", "훈련 안내 및 기도 제목 쓰기", ""], ["미래세대, 청지기", "2027-01-11", "17:00", "18:30", "저녁식사", ""], ["미래세대, 청지기", "2027-01-11", "18:30", "19:30", "휴식", ""], ["미래세대, 청지기", "2027-01-11", "19:30", "22:30", "새 예루살렘을 향하여 Celebration I", "저녁성회"], ["미래세대, 청지기", "2027-01-11", "22:30", "23:00", "개인 기도", ""], ["미래세대, 청지기", "2027-01-11", "23:00", "", "취침", ""], ["미래세대, 청지기", "2027-01-12", "06:00", "07:00", "성경통독묵상", ""], ["미래세대, 청지기", "2027-01-12", "07:00", "08:00", "아침식사", ""], ["미래세대, 청지기", "2027-01-12", "08:00", "10:30", "침묵기도 I", ""], ["미래세대, 청지기", "2027-01-12", "10:30", "12:30", "청지기의 삶과 고난의 축복 I", "오전 강의"], ["미래세대, 청지기", "2027-01-12", "12:30", "13:30", "점심식사", ""], ["미래세대, 청지기", "2027-01-12", "13:30", "14:00", "영감 예술 예배 I", ""], ["미래세대, 청지기", "2027-01-12", "14:00", "15:30", "가나안 전쟁을 모르는 세대 I", "오후 강의 I"], ["미래세대, 청지기", "2027-01-12", "15:30", "16:00", "휴식", ""], ["미래세대, 청지기", "2027-01-12", "16:00", "17:00", "만국을 향하여 I", "오후 강의 II"], ["미래세대, 청지기", "2027-01-12", "17:00", "18:30", "저녁식사", ""], ["미래세대, 청지기", "2027-01-12", "18:30", "19:30", "휴식", ""], ["미래세대, 청지기", "2027-01-12", "19:30", "22:30", "새 예루살렘을 향하여 Celebration II", "저녁성회"], ["미래세대, 청지기", "2027-01-12", "22:30", "23:00", "개인 기도", ""], ["미래세대, 청지기", "2027-01-12", "23:00", "", "취침", ""], ["미래세대, 청지기", "2027-01-13", "06:00", "07:00", "성경통독묵상", ""], ["미래세대, 청지기", "2027-01-13", "07:00", "08:00", "아침식사", ""], ["미래세대, 청지기", "2027-01-13", "08:00", "10:30", "침묵기도 II", ""], ["미래세대, 청지기", "2027-01-13", "10:30", "12:30", "청지기의 삶과 고난의 축복 II", "오전 강의"], ["미래세대, 청지기", "2027-01-13", "12:30", "13:30", "점심식사", ""], ["미래세대, 청지기", "2027-01-13", "13:30", "14:00", "영감 예술 예배 II", ""], ["미래세대, 청지기", "2027-01-13", "14:00", "15:30", "가나안 전쟁을 모르는 세대 II", "오후 강의 I"], ["미래세대, 청지기", "2027-01-13", "15:30", "16:00", "휴식", ""], ["미래세대, 청지기", "2027-01-13", "16:00", "17:00", "만국을 향하여 II", "오후 강의 II"], ["미래세대, 청지기", "2027-01-13", "17:00", "18:30", "저녁식사", ""], ["미래세대, 청지기", "2027-01-13", "18:30", "19:30", "휴식", ""], ["미래세대, 청지기", "2027-01-13", "19:30", "22:30", "새 예루살렘을 향하여 Celebration III", "저녁성회"], ["미래세대, 청지기", "2027-01-13", "22:30", "23:00", "개인 기도", ""], ["미래세대, 청지기", "2027-01-13", "23:00", "", "취침", ""], ["미래세대, 청지기", "2027-01-14", "06:00", "07:00", "성경통독묵상", ""], ["미래세대, 청지기", "2027-01-14", "07:00", "08:00", "아침식사", ""], ["미래세대, 청지기", "2027-01-14", "08:00", "10:30", "침묵기도 III", ""], ["미래세대, 청지기", "2027-01-14", "10:30", "12:30", "소감문 작성 및 7000훈련 안내", ""], ["미래세대", "2027-01-14", "12:30", "", "귀가", ""], ["미래세대", "2027-01-14", "19:00", "", "목요모임", "온누리교회 · 17:00 중보기도"], ["어린이", "2027-01-14", "14:00", "16:00", "등록", ""], ["어린이, 청지기", "2027-01-14", "16:00", "17:30", "훈련 안내 및 기도 제목 쓰기", ""], ["어린이, 청지기", "2027-01-14", "17:30", "18:30", "저녁식사", ""], ["어린이, 청지기", "2027-01-14", "18:30", "19:30", "휴식", ""], ["어린이, 청지기", "2027-01-14", "19:30", "22:30", "새 예루살렘을 향하여 Celebration I", "저녁성회"], ["어린이, 청지기", "2027-01-14", "22:30", "23:00", "개인 기도", ""], ["어린이, 청지기", "2027-01-14", "23:00", "", "취침", ""], ["어린이, 청지기", "2027-01-15", "07:00", "08:00", "성경통독묵상", ""], ["어린이, 청지기", "2027-01-15", "08:00", "09:00", "아침식사", ""], ["어린이, 청지기", "2027-01-15", "09:00", "11:00", "침묵기도 I", ""], ["어린이, 청지기", "2027-01-15", "11:00", "12:30", "성경통독묵상 I", ""], ["어린이, 청지기", "2027-01-15", "12:30", "14:00", "점심식사", ""], ["어린이, 청지기", "2027-01-15", "14:00", "17:30", "달란트 재발견", ""], ["어린이, 청지기", "2027-01-15", "17:30", "18:30", "저녁식사", ""], ["어린이, 청지기", "2027-01-15", "18:30", "19:30", "휴식", ""], ["어린이, 청지기", "2027-01-15", "19:30", "22:30", "새 예루살렘을 향하여 Celebration II", "저녁성회"], ["어린이, 청지기", "2027-01-15", "22:30", "23:00", "개인 기도", ""], ["어린이, 청지기", "2027-01-15", "23:00", "", "취침", ""], ["어린이, 청지기", "2027-01-16", "07:00", "08:00", "성경통독묵상", ""], ["어린이, 청지기", "2027-01-16", "08:00", "09:00", "아침식사", ""], ["어린이, 청지기", "2027-01-16", "09:00", "11:00", "침묵기도 II", ""], ["어린이, 청지기", "2027-01-16", "11:00", "12:30", "성경통독묵상 II", ""], ["어린이, 청지기", "2027-01-16", "12:30", "14:00", "소감문 작성 및 7000훈련 안내", ""], ["어린이, 청지기", "2027-01-16", "14:00", "", "귀가", ""], ["어린이, 청지기", "2027-01-16", "16:00", "", "7000모임", "서빙고 경배와찬양 훈련원"]];

function seedSchedule2027W() {
  const sh = appSheet_().getSheetByName('시간표');
  const v = sh.getDataRange().getValues(), keep = v.slice(1).filter(r => String(r[0]) && String(r[0]) !== '2027W');
  const rows = keep.concat(SCHEDULE_2027W.map(r => ['2027W', r[0], r[1], r[2], r[3], r[4], '', r[5]]));
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, v[0].length).clearContent();
  sh.getRange(2, 1, rows.length, 8).setValues(rows);
  CacheService.getScriptCache().remove('content_v1');
  console.log('2027W 시간표 ' + SCHEDULE_2027W.length + '줄을 넣었습니다');
}
