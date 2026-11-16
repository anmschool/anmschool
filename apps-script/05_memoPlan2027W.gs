/**
 * 05_memoPlan2027W.gs — 2027W 기획 Memo 정리
 *
 * 실행: putPlan2027W  (한 번만)
 *  1) Memo 문서를 같은 폴더에 백업 복사
 *  2) 「미래세대/대학청년 및 일반인」 탭 내용을 기획안으로 교체
 *     (확정 시간표 + 2026S 대비 바뀐 점)
 *  3) 문서 전체(모든 탭) 오타·표기 수정
 */

const MEMO_ID = '1RP26nhwiXKF_fZWqv7ILrT3j99KTUBC7EiORvWjSFMA';

function putPlan2027W() {
  const t0 = Date.now();
  const log = (m) => Logger.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

  log('1/4 Memo 백업 중…');
  const file = DriveApp.getFileById(MEMO_ID);
  const parent = file.getParents().hasNext() ? file.getParents().next() : DriveApp.getRootFolder();
  const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMdd_HHmm');
  const backup = file.makeCopy(`Memo 백업 (기획안 넣기 전 ${stamp})`, parent);
  log(`   백업 완료 → ${backup.getName()}`);

  log('2/4 탭 찾는 중…');
  const doc = DocumentApp.openById(MEMO_ID);
  const tabs = allTabs_(doc.getTabs());
  const tab = tabs.find(t => /(미래세대|십대)/.test(t.getTitle()) && /(대학|일반인)/.test(t.getTitle()));
  if (!tab) throw new Error('「미래세대/대학청년 및 일반인」 탭을 못 찾음. 탭 목록: ' + tabs.map(t => t.getTitle()).join(' | '));
  log(`   탭: ${tab.getTitle()}`);

  log('3/4 기획안 쓰는 중…');
  const body = tab.asDocumentTab().getBody();
  body.clear();
  writePlan_(body);
  // clear() 후 남는 맨 앞 빈 줄 제거
  const first = body.getChild(0);
  if (body.getNumChildren() > 1 && first.getType() === DocumentApp.ElementType.PARAGRAPH && first.asParagraph().getText() === '') first.removeFromParent();
  log('   기획안 완료');

  log('4/4 오타 수정 중 (모든 탭)…');
  let n = 0;
  for (const t of tabs) n += fixTypos_(t.asDocumentTab().getBody());
  doc.saveAndClose();
  log(`   수정 ${n}곳`);
  log('✅ 끝. Memo 문서를 새로고침해서 확인하세요.');
}

/* ───────── 기획안 내용 ───────── */

const WINE = '#6E1F3A', HEAD_BG = '#F3E9ED', SOFT_BG = '#FAF6F7';

function writePlan_(b) {
  const H = DocumentApp.ParagraphHeading;
  const h = (text, level) => b.appendParagraph(text).setHeading(level);
  const p = (text) => rich_(b.appendParagraph(''), text);

  h('2027 WINTER 경배와찬양학교 프로그램 기획안', H.TITLE);
  p('미래세대를 위한 경배와찬양학교 · 대학청년 및 일반인을 위한 경배와찬양학교').editAsText().setForegroundColor(WINE);
  p('작성 2026. 10. 28. · 확정 시간표 반영 2026. 11. 16.').editAsText().setFontSize(9).setForegroundColor('#777777');

  /* 1. 개요 */
  h('1. 개요', H.HEADING1);
  p('두 트랙은 같은 주제 ‘얽매이지 않는 삶’(히 12:1)과 같은 강의로 운영하고, 대상에 맞춰 시간표만 달리합니다. 각 3박 4일입니다.');
  table_(b, [
    ['구분', '미래세대를 위한 경배와찬양학교', '대학청년 및 일반인을 위한 경배와찬양학교'],
    ['기간', '2027년 1월 11일(월) - 14일(목), 3박 4일', '2027년 1월 6일(수) - 9일(토), 3박 4일'],
    ['초점 대상', '십대', '대학청년, 일반인'],
    ['함께 참여 가능', '어린이, 대학청년, 교사, 교역자, 사역자, 직장인', '어린이, 십대, 교사, 교역자, 사역자'],
    ['장소', '명지대학교 자연캠퍼스 60주년 기념 채플관 (경기도 용인시 처인구 명지로 116)', '같음'],
    ['훈련비 (선등록 ~12/23 / 일반 12/24~)', '대학청년·일반 12만 / 14만, 십대 10만 / 12만, 어린이 8만 / 10만 원', '같음'],
    ['온라인 등록', '55,000원', '55,000원'],
    ['함께 진행', '청지기를 위한 경배와찬양학교 (1/6-9, 1/11-16)', '같음'],
    ['훈련 후', '목요모임 (1/14 19:00 예배, 17:00 중보기도)', '7000모임 (1/9 16:00, 서빙고 경배와찬양 훈련원)'],
  ], { firstCol: true });
  p('인도: 하스데반 선교사와 경배와찬양 국제사역팀');

  /* 2. 프로그램 구성 */
  h('2. 프로그램 구성', H.HEADING1);
  p('강의는 지난 2026 SUMMER와 같은 이름·같은 순서로 진행합니다. 강의 세 축(오전·오후 I·오후 II)은 이틀 동안 각 2회씩, 모두 6회입니다. 저녁성회와 침묵기도는 각 3회입니다.');
  table_(b, [
    ['축', '프로그램', '시간', '횟수'],
    ['오전 강의', '청지기의 삶과 고난의 축복 I·II', '10:30-12:30', '2회'],
    ['오후 강의 I', '가나안 전쟁을 모르는 세대 I·II', '14:00-15:30', '2회'],
    ['오후 강의 II', '만국을 향하여 I·II', '16:00-17:00 (미래세대) / 16:00-17:30 (대학청년)', '2회'],
    ['저녁성회', '새 예루살렘을 향하여 Celebration I·II·III', '19:30-22:30', '3회'],
    ['침묵기도', '침묵기도 I·II·III', '08:00-10:30', '3회'],
    ['성경통독묵상', '성경통독묵상', '06:00-07:00', '3회'],
    ['영감 예술 예배', '영감 예술 예배 I·II', '13:30-14:00 (미래세대만)', '2회'],
    ['결단과 연결', '소감문 작성 및 7000훈련 안내', '마지막 날 10:30-12:30', '1회'],
    ['여는 시간', '등록 · 훈련 안내 및 기도 제목 쓰기', '첫날 15:30-', '1회'],
  ]);

  /* 3. 강의별 상세 */
  h('3. 강의별 상세', H.HEADING1);
  p('강의 본문·목표·소개문은 리더에게 받는 대로 채웁니다.');
  [['오전 강의 — 청지기의 삶과 고난의 축복 I·II'], ['오후 강의 I — 가나안 전쟁을 모르는 세대 I·II'], ['오후 강의 II — 만국을 향하여 I·II'], ['저녁성회 — 새 예루살렘을 향하여 Celebration I·II·III']].forEach(([t]) => {
    h(t, H.HEADING2);
    p('**본문:** (리더 전달 예정)');
    p('**강의 목표 / 소개문:** (리더 전달 예정)');
  });
  h('함께 돌아가는 프로그램', H.HEADING2);
  [
    '**침묵기도 I·II·III** — 매일 아침, 잠잠히 하나님의 음성을 듣습니다.',
    '**성경통독묵상** — 하루를 말씀으로 시작합니다.',
    '**영감 예술 예배 I·II (미래세대)** — 점심 후 오후 강의 전 30분입니다. 내용은 아직 정해지지 않았습니다.',
  ].forEach(listItem_(b, DocumentApp.GlyphType.BULLET));

  /* 4. 시간표 */
  h('4. 시간표', H.HEADING1);
  p('모두 한국 시간입니다. 확정 시간표 기준이며, 각 시간표 아래에 2026 SUMMER 대비 바뀐 점을 적었습니다.');

  h('2027 WINTER ‘미래세대를 위한 경배와찬양학교’ 일정표', H.HEADING2);
  timetable_(b, ['1월 11일 (월)', '1월 12일 (화)', '1월 13일 (수)', '1월 14일 (목)'], [
    ["06:00-07:00", "", "성경통독묵상", "성경통독묵상", "성경통독묵상"],
    ["07:00-08:00", "", "아침식사", "아침식사", "아침식사"],
    ["08:00-10:30", "", "침묵기도 I", "침묵기도 II", "침묵기도 III"],
    ["10:30-12:30", "", "오전 강의\n청지기의 삶과 고난의 축복 I", "오전 강의\n청지기의 삶과 고난의 축복 II", "소감문 작성 및 7000훈련 안내"],
    ["12:30-13:30", "", "점심식사", "점심식사", "귀가"],
    ["13:30-14:00", "", "영감 예술 예배 I", "영감 예술 예배 II", ""],
    ["14:00-15:30", "", "오후 강의 I\n가나안 전쟁을 모르는 세대 I", "오후 강의 I\n가나안 전쟁을 모르는 세대 II", ""],
    ["15:30-16:00", "등록", "휴식", "휴식", ""],
    ["16:00-17:00", "훈련 안내 및 기도 제목 쓰기", "오후 강의 II\n만국을 향하여 I", "오후 강의 II\n만국을 향하여 II", ""],
    ["17:00-18:30", "저녁식사", "저녁식사", "저녁식사", ""],
    ["18:30-19:30", "휴식", "휴식", "휴식", "목요모임 (19:00)\n온누리교회 · 17:00 중보기도"],
    ["19:30-22:30", "새 예루살렘을 향하여\nCelebration I", "새 예루살렘을 향하여\nCelebration II", "새 예루살렘을 향하여\nCelebration III", ""],
    ["22:30-23:00", "개인 기도", "개인 기도", "개인 기도", ""],
    ["23:00-06:00", "취침", "취침", "취침", ""],
  ]);
  p('**바뀐 점 (2026 SUMMER 미래세대 시간표 대비)**');
  changes_(b, [
    ['항목', '2026 SUMMER', '2027 WINTER', '변경'],
    ['점심식사', '12:30-14:00', '12:30-13:30', '30분 줄어듦'],
    ['영감 예술 예배', '없음', '13:30-14:00 (화·수)', '신설'],
    ['만국을 향하여', '16:00-17:30', '16:00-17:00', '30분 줄어듦'],
    ['저녁식사', '17:30-18:30', '17:00-18:30', '30분 늘어남'],
    ['강의', '청지기의 삶과 고난의 축복 · 가나안 전쟁을 모르는 세대', '같음', '변경 없음'],
  ]);

  h('2027 WINTER ‘대학청년 및 일반인을 위한 경배와찬양학교’ 일정표', H.HEADING2);
  timetable_(b, ['1월 6일 (수)', '1월 7일 (목)', '1월 8일 (금)', '1월 9일 (토)'], [
    ["06:00-07:00", "", "성경통독묵상", "성경통독묵상", "성경통독묵상"],
    ["07:00-08:00", "", "아침식사", "아침식사", "아침식사"],
    ["08:00-10:30", "", "침묵기도 I", "침묵기도 II", "침묵기도 III"],
    ["10:30-12:30", "", "오전 강의\n청지기의 삶과 고난의 축복 I", "오전 강의\n청지기의 삶과 고난의 축복 II", "소감문 작성 및 7000훈련 안내"],
    ["12:30-14:00", "", "점심식사", "점심식사", "귀가"],
    ["14:00-15:30", "", "오후 강의 I\n가나안 전쟁을 모르는 세대 I", "오후 강의 I\n가나안 전쟁을 모르는 세대 II", ""],
    ["15:30-16:00", "등록", "휴식", "휴식", ""],
    ["16:00-17:30", "훈련 안내 및 기도 제목 쓰기", "오후 강의 II\n만국을 향하여 I", "오후 강의 II\n만국을 향하여 II", "7000모임\n서빙고 경배와찬양 훈련원"],
    ["17:30-18:30", "저녁식사", "저녁식사", "저녁식사", ""],
    ["18:30-19:30", "휴식", "휴식", "휴식", ""],
    ["19:30-22:30", "새 예루살렘을 향하여\nCelebration I", "새 예루살렘을 향하여\nCelebration II", "새 예루살렘을 향하여\nCelebration III", ""],
    ["22:30-23:00", "개인 기도", "개인 기도", "개인 기도", ""],
    ["23:00-06:00", "취침", "취침", "취침", ""],
  ]);
  p('**바뀐 점 (2026 SUMMER 대비)**');
  changes_(b, [
    ['항목', '2026 SUMMER', '2027 WINTER', '변경'],
    ['시간 · 강의', '—', '같음', '변경 없음'],
    ['마지막 날', '—', '1/9(토) 16:00 7000모임', '훈련 후 7000모임으로 연결'],
  ]);

  h('두 트랙의 차이', H.HEADING2);
  changes_(b, [
    ['항목', '미래세대', '대학청년 및 일반인'],
    ['점심', '12:30-13:30 (60분)', '12:30-14:00 (90분)'],
    ['영감 예술 예배', '13:30-14:00, 화·수', '없음'],
    ['만국을 향하여', '16:00-17:00 (60분)', '16:00-17:30 (90분)'],
    ['저녁식사', '17:00-18:30', '17:30-18:30'],
    ['훈련 후', '목요모임 (목 19:00)', '7000모임 (토 16:00)'],
  ]);

  /* 5. 남은 일 */
  h('5. 아직 정해지지 않은 것', H.HEADING1);
  [
    '강사 배정: 오전 강의, 오후 강의 I, 오후 강의 II를 각각 누가 맡는지',
    '강의별 본문과 소개문 (브로셔·카드뉴스·앱에 들어갈 설명글) — 리더 전달 예정',
    '영감 예술 예배 I·II의 내용과 인도자',
    '저녁성회 ‘새 예루살렘을 향하여’의 2027W 핵심 말씀과 소개문',
  ].forEach(s => p('☐  ' + s));
}

/* ───────── 오타·표기 수정 (모든 탭) ───────── */

function fixTypos_(body) {
  const rules = [
    // 청지기 일정 연도
    ['2026년 1월 11일\\(월\\) - 1월 16일\\(토\\)', '2027년 1월 11일(월) - 1월 16일(토)'],
    ['Hompage', 'Homepage'],
    ['미래세대들을 위한', '미래세대를 위한'],
    ['어린이들을 위한', '어린이를 위한'],
    ['교사, 교역자, 및 사역자들도', '교사, 교역자 및 사역자들도'],
    ['개인기도', '개인 기도'],
    ['2027년 Winter  ', '2027년 Winter '],
    // 겨울 학교 시차 (독일 서머타임 없음: 한국 +8, 대만·홍콩 +7)
    ['여름 경배와찬양학교의 경우, 한국 시간은 독일 시간에 7시간을', '겨울 경배와찬양학교의 경우, 한국 시간은 독일 시간에 8시간을'],
    ['대만, 홍콩 시간은 독일 시간에 6시간을', '대만, 홍콩 시간은 독일 시간에 7시간을'],
  ];
  let n = 0;
  for (const [from, to] of rules) {
    let r = body.findText(from);
    while (r) { n++; r = body.findText(from, r); }
    body.replaceText(from, to);
  }
  // 이메일 링크가 'm' 앞에서 끊긴 것: 주소 전체에 링크
  let r = body.findText('7000school@gmail\\.com');
  while (r) {
    r.getElement().asText().setLinkUrl(r.getStartOffset(), r.getEndOffsetInclusive(), 'mailto:7000school@gmail.com');
    n++;
    r = body.findText('7000school@gmail\\.com', r);
  }
  return n;
}

/* ───────── 도우미 ───────── */

function allTabs_(tabs) {
  const out = [];
  for (const t of tabs) { out.push(t); out.push(...allTabs_(t.getChildTabs())); }
  return out;
}

// '**굵게**' 표기를 굵은 글씨로
function rich_(para, src) {
  const parts = String(src).split('**');
  const text = parts.join('');
  para.setText(text);
  const t = para.editAsText();
  let pos = 0;
  parts.forEach((s, i) => {
    if (i % 2 === 1 && s.length) t.setBold(pos, pos + s.length - 1, true);
    pos += s.length;
  });
  return para;
}

function listItem_(b, glyph) {
  let firstItem = null;
  return (text) => {
    const li = b.appendListItem('');
    rich_(li, text);
    if (firstItem) li.setListId(firstItem); else firstItem = li;
    li.setGlyphType(glyph);
    return li;
  };
}

function table_(b, rows, opt) {
  opt = Object.assign({ header: true, firstCol: false }, opt || {});
  const tb = b.appendTable(rows);
  tb.setBorderColor('#D9CCD1');
  tb.editAsText().setFontSize(9.5);
  if (opt.header) {
    const r0 = tb.getRow(0);
    for (let c = 0; c < r0.getNumCells(); c++) r0.getCell(c).setBackgroundColor(HEAD_BG).editAsText().setBold(true);
  }
  if (opt.firstCol) {
    for (let r = opt.header ? 1 : 0; r < tb.getNumRows(); r++) tb.getRow(r).getCell(0).editAsText().setBold(true);
  }
  return tb;
}

function styleFlow_(tb, extra) {
  const row = tb.getRow(0);
  for (let c = 0; c < row.getNumCells(); c++) {
    const cell = row.getCell(c);
    cell.setBackgroundColor(c === 3 ? HEAD_BG : SOFT_BG);
    const C = DocumentApp.HorizontalAlignment.CENTER;
    cell.getChild(0).asParagraph().setAlignment(C).editAsText().setFontSize(8.5).setBold(false).setForegroundColor('#777777');
    cell.appendParagraph(extra[c][0]).setAlignment(C).editAsText().setFontSize(13).setBold(true).setForegroundColor(WINE);
    cell.appendParagraph(extra[c][1]).setAlignment(C).editAsText().setFontSize(9.5).setBold(false).setForegroundColor('#222222');
  }
}

function timetable_(b, days, rows) {
  const tb = table_(b, [['한국 시간'].concat(days)].concat(rows), { firstCol: true });
  tb.editAsText().setFontSize(8.5);
  tb.setColumnWidth(0, 72);
  return tb;
}

function changes_(b, rows) {
  const tb = table_(b, rows, { firstCol: true });
  tb.editAsText().setFontSize(9);
  return tb;
}