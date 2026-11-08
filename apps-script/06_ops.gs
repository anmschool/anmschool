/**
 * 06_ops.gs — 운영 도구 (같은 Apps Script 프로젝트의 다섯 번째 파일)
 *  ① 텔레그램 알림   : tgConnect() 1회 → 오류·일일 요약이 텔레그램으로
 *  ② 로그인 빠르게    : buildLoginCache() 10분마다 → 로그인·내 정보가 시트를 읽지 않음
 *  ③ 매일 백업        : nightlyBackup() 매일 03시 → 'ANM 백업' 폴더에 사본, 14일 보관
 *  ④ 십대 전환(1회)   : migrateTeen2027W() → 운영 시트·앱 시트의 '미래세대'를 '십대'로
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
  const fails = logSh ? readTable_(logSh).filter(r => String(r[2]) === '실패' && new Date(r[0]).getTime() >= since).length : 0;
  const byTrack = {};
  live.forEach(r => { const k = r['경배와찬양학교 구분'] || '기타'; byTrack[k] = (byTrack[k] || 0) + 1; });
  tg_('📋 ANM 일일 요약 (' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'M/d') + ')\n' +
    '어제 새 신청 ' + live.filter(isNew).length + '명 · 전체 ' + live.length + '명 · 미입금 ' + unpaid + '명\n' +
    Object.keys(byTrack).map(k => '· ' + k + ' ' + byTrack[k]).join('\n') +
    (fails ? '\n⚠️ 처리 실패 ' + fails + '건 (처리 로그 확인)' : '\n동기화 정상'));
}

/* ───────────── ② 로그인 캐시 ───────────── */

const LC_TTL = 21600; // 6시간 (10분마다 갱신)
function lcKey_(proj, name, phone) {
  return 'lk_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, proj + '|' + name + '|' + phone));
}

/** 로그인용 요약본을 캐시에 미리 만들어 둠 (개인정보 원본은 넣지 않음: 해시 키 + 화면용 정보만) */
function buildLoginCache() {
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
  const want = { buildLoginCache: b => b.everyMinutes(10), nightlyBackup: b => b.everyDays(1).atHour(3), dailyReport: b => b.everyDays(1).atHour(8) };
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
