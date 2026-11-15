/**
 * 07_nametag.gs — 명찰 자동 생성 (입금 완료자만)
 *
 * 처음 한 번: setupNametag() 실행 → 템플릿 슬라이드 생성 · 운영 시트 메뉴 · 매일 밤 자동 생성 트리거
 * 이후:
 *   - 매일 01시: 새로 입금 완료된 사람이 6명(A4 한 장) 이상 모이면 6의 배수만큼만 PDF 생성. 남는 사람은 다음으로 넘김
 *   - 운영 시트 메뉴 [명찰]: 새로 입금한 사람만(남은 칸은 빈 명찰) / 전체 다시 / 빈 명찰
 * 결과: 2027W/06_현장·출력물/명찰 폴더에 PDF(인쇄용) + 슬라이드(수정용). 운영 시트 '명찰' 탭에 출력일 기록
 *
 * 디자인: 바뀌지 않는 부분(배경·행사명·주제·하단 문구·흰 판)은 '명찰배경_2027W.png' 한 장.
 *         바뀌는 부분(구분·이름·교회)만 글자로 넣음. 다음 시즌은 배경 그림만 교체.
 * 규격: 102.8×90.6mm, A4 한 장에 6개 (2026S와 같은 자리)
 */

const NT = {
  folder: ['10_경배와찬양학교', '2027W', '06_현장·출력물', '명찰'],
  bg: '명찰배경_2027W.png',
  tab: '명찰',
  prefix: '2027W_명찰',
  order: ['청지기', '대학청년·일반', '미래세대', '어린이'],
  font: 'Noto Sans KR',
};
const NT_MM = 72 / 25.4;                                   // mm → pt
const NT_TAG = { w: 102.8, h: 90.6 };
const NT_POS = [[0, 0], [107.2, 0], [0, 90.6], [107.2, 90.6], [0, 181.2], [107.2, 181.2]];
const NT_HEAD = ['코드', '과정', '교회', '구분', '이름', '입금여부', '출력일', '파일'];

/* ───────── 설치 (한 번) ───────── */

function setupNametag() {
  ntTemplate_(true);
  const ss = openOps_();
  ScriptApp.getProjectTriggers().filter(t => ['makeNewNametags', 'autoNametags', 'onOpsOpen'].indexOf(t.getHandlerFunction()) > -1).forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('autoNametags').timeBased().everyDays(1).atHour(1).create();
  ScriptApp.newTrigger('onOpsOpen').forSpreadsheet(ss).onOpen().create();
  ntSyncTab_();
  console.log('명찰 설치 완료: 템플릿 · 매일 01시 자동 생성 · 운영 시트 [명찰] 메뉴');
}

function onOpsOpen() {
  SpreadsheetApp.getUi().createMenu('명찰')
    .addItem('새로 입금한 사람만 만들기', 'makeNewNametags')
    .addItem('전체 다시 만들기', 'makeAllNametags')
    .addItem('빈 명찰 만들기…', 'makeBlankNametags')
    .addSeparator().addItem('명찰 탭 새로고침', 'refreshNametagTab')
    .addToUi();
}

/* ───────── 실행 ───────── */

function makeNewNametags() { return ntRun_('new'); }
function autoNametags() { return ntRun_('auto'); }
function refreshNametagTab() { ntSyncTab_(); }
function makeAllNametags() { return ntRun_('all'); }

function makeBlankNametags() {
  let n = 12;
  try {
    const ui = SpreadsheetApp.getUi(), r = ui.prompt('빈 명찰', '몇 장 만들까요? (6의 배수 권장)', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    n = Math.max(1, parseInt(r.getResponseText(), 10) || 12);
  } catch (e) { /* 편집기에서 실행 시 12장 */ }
  const f = ntBuild_(Array.from({ length: n }, () => ({ label: '', name: '', church: '' })), `${NT.prefix}_빈명찰_${n}장`);
  ntNotify_(`빈 명찰 ${n}장을 만들었습니다.`, f);
}

/** mode: auto = 6명 단위로만(종이 낭비 없음) · new = 새로 입금한 사람 전부 · all = 전원. 수동은 남는 칸을 빈 명찰로 채움 */
function ntRun_(mode) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(30000)) return;
  try {
    const rows = ntSyncTab_();
    let todo = rows.filter(r => mode === 'all' || !r.printed);
    if (mode === 'auto') todo = todo.slice(0, Math.floor(todo.length / 6) * 6);
    if (!todo.length) { console.log('만들 명찰 없음 (자동은 6명 이상 모일 때만)'); return; }
    const tags = todo.map(r => r.tag);
    while (tags.length % 6) tags.push({ label: '', name: '', church: '' });
    const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd_HHmm');
    const f = ntBuild_(tags, `${NT.prefix}_${mode === 'all' ? '전체' : '추가'}_${stamp}_${todo.length}명`);
    // 출력일 기록
    const sh = openOps_().getSheetByName(NT.tab), v = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), NT_HEAD.length).getValues();
    const done = {}; todo.forEach(r => (done[r.code] = 1));
    const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    v.forEach(r => { if (done[r[0]]) { r[6] = now; r[7] = f.pdf.getName(); } });
    sh.getRange(2, 1, v.length, NT_HEAD.length).setValues(v);
    ntNotify_(`명찰 ${todo.length}명을 만들었습니다.`, f);
  } finally { lock.releaseLock(); }
}

function ntNotify_(msg, f) {
  console.log(msg + ' ' + f.pdf.getUrl());
  try { SpreadsheetApp.getUi().alert(msg + '\n\nPDF: ' + f.pdf.getName() + '\n(06_현장·출력물 / 명찰 폴더)'); } catch (e) { /* 트리거 실행 */ }
}

/* ───────── 명찰 탭: 입금 완료자 목록 (출력일 유지) ───────── */

function ntSyncTab_() {
  const ss = openOps_(), reg = ss.getSheetByName(T.reg);
  const v = reg.getDataRange().getValues(), h = v[0], c = n => h.indexOf(n);
  const I = { code: c('코드'), track: c('경배와찬양학교 구분'), church: c('교회'), name: c('이름'), gender: c('성별'), kind: c('구분'), pay: c('입금여부') };
  let sh = ss.getSheetByName(NT.tab);
  if (!sh) { sh = ss.insertSheet(NT.tab); sh.getRange(1, 1, 1, NT_HEAD.length).setValues([NT_HEAD]).setFontWeight('bold'); sh.setFrozenRows(1); }
  const prev = {}; readTable_(sh).forEach(r => (prev[r[0]] = [r[6], r[7]]));
  const rows = v.slice(1).filter(r => {
    const code = String(r[I.code] || ''), pay = String(r[I.pay] || ''), track = String(r[I.track] || '');
    return code && /^O/.test(pay) && track.indexOf('온라인') !== 0;
  }).map(r => {
    const tag = ntTag_(r[I.name], r[I.gender], r[I.kind], r[I.church]);
    const code = String(r[I.code]), p = prev[code] || ['', ''];
    return { code, track: String(r[I.track]), church: String(r[I.church] || ''), name: String(r[I.name] || ''), pay: String(r[I.pay]), printed: p[0], file: p[1], tag };
  }).sort((a, b) => ntOrd_(a.track) - ntOrd_(b.track) || a.church.localeCompare(b.church, 'ko') || a.name.localeCompare(b.name, 'ko'));
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, NT_HEAD.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, NT_HEAD.length).setValues(rows.map(r => [r.code, r.track, r.church, r.tag.label.replace(/ /g, ''), r.name, r.pay, r.printed, r.file]));
  return rows;
}

function ntOrd_(t) { const i = NT.order.indexOf(t); return i < 0 ? 99 : i; }

/** 시트 한 줄 → 명찰 글자: 구분(형 제 / 자 매 / 어 린 이 / 교 역 자 / 男子·女子) · 이름(한 글자씩 띄움) · 교회 */
function ntTag_(name, gender, kind, church) {
  name = String(name || '').trim(); kind = String(kind || ''); gender = String(gender || '');
  const latin = /^[A-Za-z .'\-]+$/.test(name);
  const label = latin ? (gender === '형제' ? '男子' : '女子')
    : /어린이/.test(kind) ? '어린이' : /교역자|전도사|목사/.test(kind) ? '교역자' : gender;
  return {
    latin,
    label: latin ? label : label.split('').join(' '),
    name: latin ? name.toUpperCase().replace(/\s+/g, ' ') : name.replace(/\s/g, '').split('').join(' '),
    church: String(church || '').trim(),
  };
}

function ntNameSize_(t) {
  const n = t.name.replace(/ /g, '').length;
  if (t.latin) return t.name.length <= 10 ? 22 : t.name.length <= 14 ? 18 : 15;
  return n <= 3 ? 31 : n === 4 ? 27 : 22;
}

/* ───────── 슬라이드 → PDF ───────── */

function ntFolder_() {
  let f = DriveApp.getFolderById(ROOT_ID);
  NT.folder.forEach(n => { const it = f.getFoldersByName(n); f = it.hasNext() ? it.next() : f.createFolder(n); });
  return f;
}

/** 템플릿: A4(209.9×297mm) 한 장에 배경 6개 + 칸마다 {{L1}} {{N1}} {{C1}} … */
function ntTemplate_(force) {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('NAMETAG_TPL');
  const folder = ntFolder_(), bgIt = folder.getFilesByName(NT.bg);
  if (!bgIt.hasNext()) throw new Error(`명찰 폴더에 ${NT.bg} 가 없습니다`);
  const bgFile = bgIt.next(), ver = bgFile.getId() + '@' + bgFile.getLastUpdated().getTime();
  // 배경 그림이 바뀌면 템플릿을 새로 만듦
  if (id && !force && props.getProperty('NAMETAG_BG') === ver) { try { DriveApp.getFileById(id); return id; } catch (e) { /* 다시 만듦 */ } }
  if (id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* 이미 없음 */ } }
  const bg = bgFile.getBlob(), E = mm => Math.round(mm * 36000);
  const pres = Slides.Presentations.create({ title: '명찰 템플릿 (지우지 마세요)', pageSize: { width: { magnitude: E(209.9), unit: 'EMU' }, height: { magnitude: E(297), unit: 'EMU' } } });
  DriveApp.getFileById(pres.presentationId).moveTo(folder);
  const deck = SlidesApp.openById(pres.presentationId), s = deck.getSlides()[0];
  s.getPageElements().forEach(e => e.remove());
  const P = v => v * NT_MM;
  const box = (txt, title, x, y, w, h, size, color, bold, middle) => {
    const sh = s.insertTextBox(txt, P(x), P(y), P(w), P(h));
    sh.setTitle(title);
    if (middle) sh.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
    const tr = sh.getText();
    tr.getTextStyle().setFontFamily(NT.font).setFontSize(size).setBold(bold).setForegroundColor(color);
    tr.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  };
  NT_POS.forEach(([x, y], i) => {
    const k = i + 1;
    s.insertImage(bg, P(x), P(y), P(NT_TAG.w), P(NT_TAG.h));
    box(`{{L${k}}}`, 'L' + k, x + 12, y + 42.4, 78.8, 9, 11.5, '#6E1F3A', true, true);
    box(`{{N${k}}}`, 'N' + k, x + 12, y + 49.6, 78.8, 16, 31, '#1E1A1D', true, true);
    box(`{{C${k}}}`, 'C' + k, x + 12, y + 64.4, 78.8, 8, 9, '#75696D', false, true);
  });
  deck.saveAndClose();
  props.setProperty('NAMETAG_TPL', pres.presentationId); props.setProperty('NAMETAG_BG', ver);
  return pres.presentationId;
}

/** tags: [{label,name,church,latin}] → 슬라이드 + PDF */
function ntBuild_(tags, title) {
  const folder = ntFolder_(), copy = DriveApp.getFileById(ntTemplate_(false)).makeCopy(title, folder);
  const deck = SlidesApp.openById(copy.getId()), tpl = deck.getSlides()[0];
  for (let i = 0; i < tags.length; i += 6) {
    const s = tpl.duplicate(), part = tags.slice(i, i + 6);
    for (let k = 1; k <= 6; k++) {
      const t = part[k - 1] || { label: '', name: '', church: '' };
      s.replaceAllText(`{{L${k}}}`, t.label || ' ');
      s.replaceAllText(`{{N${k}}}`, t.name || ' ');
      s.replaceAllText(`{{C${k}}}`, t.church || ' ');
      if (t.name) s.getShapes().filter(sh => sh.getTitle() === 'N' + k).forEach(sh => sh.getText().getTextStyle().setFontSize(ntNameSize_(t)));
    }
  }
  tpl.remove(); deck.saveAndClose();
  const pdf = folder.createFile(copy.getAs('application/pdf')).setName(title + '.pdf');
  return { pdf, slides: copy };
}
