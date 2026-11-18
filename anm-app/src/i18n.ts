import { useSyncExternalStore } from "react";

export type Lang = "ko" | "en" | "zh";

/** UI 문구만 번역 (공지·안내 본문은 관리 시트에 쓴 그대로 표시) */
const T = {
  ko: {
    invitation: "초대의 글", onlineLink: "온라인 참여 링크", onlineOpen: "온라인 참여하기", onlineSoon: "온라인 참여 링크는 개강 전에 이곳과 문자로 안내됩니다.", groupRooms: "우리 단체 숙소", groupRoomsNote: "인솔자에게만 보입니다.", capInvite: "주제 말씀 · 초대의 글", noticesMinistries: "공지 · 사역 안내", myShort: "내 등록", seeAll: "전체 보기", schoolShort: "경배와찬양학교", capNoticesMin: "학교 소식 · 7000훈련학교 · 큰잔치", capNotices: "이번 학교 소식", capSchedule: "트랙별 일정", capSoon: "확정되면 공개", capMe: "숙소 · 훈련비 · 현장 QR", capLogin: "이름과 전화번호로", capGuide: "복장 · 식사 · 숙소 예절", capPlaces: "채플관 · 숙소 · 이동 영상", capMinistries: "큰잔치 · 훈련 안내", otherMinistries: "ANM 사역 안내", church: "교회", state: "상태", trackOnly: "과정 일정만 보여 드립니다", openMap: "지도 열기", theme: "주제",
    ministries: "사역", now: "진행 중", soon: "준비 중", past: "지난 사역", apply: "신청하기", myInfo: "내 등록 정보", checkReg: "신청 및 입금 여부 조회",
    notices: "공지", schedule: "시간표", guide: "안내", places: "장소·길찾기", home: "홈", back: "뒤로",
    loginTitle: "내 등록 정보", loginLede: "신청할 때 적은 이름과 전화번호로 확인합니다.", name: "이름", phone: "전화번호",
    phoneHint: "숫자만 전체 입력 (010…). 단체 신청은 인솔자 전화번호로도 됩니다.", enter: "확인", checking: "확인 중…",
    hello: "님, 환영합니다", payment: "훈련비", lodging: "숙소", paid: "입금 확인 완료", partial: "일부 입금", unpaid: "입금 전",
    checkingPay: "확인 중", cancelled: "취소됨", fee: "훈련비", account: "입금 계좌", depositor: "입금자명", copy: "복사", copied: "복사됨", copyAcc: "은행·계좌번호 복사", copyAccHint: "은행 이름과 계좌번호가 함께 복사됩니다", payCheck: "입금 전 꼭 확인", payRule1: "입금자명은 ", payRule2: "이름(교회)", payRule3: "로 적어 주세요", payEx: "예: 홍길동(○○교회)", feeToggle: "학교별 전체 금액 보기", myFee: "내 입금 금액 확인", seeTTs: "시간표", seeTT: "시간표 보기", stewardTT: "청지기를 위한 경배와찬양학교는 대학청년·미래세대·어린이 학교 일정에 함께합니다.", withAll: "대학청년·미래세대·어린이 학교 일정에 함께합니다.", onlineT: "온라인(비대면) 참여", onlineD: "모든 프로그램이 라이브로 송출되어, 위 일정과 시간표 그대로 함께하실 수 있습니다.", parking: "주차", route: "이동 경로", toc: "목차", early: "선등록", regular: "일반등록", onlineFee: "온라인 등록 · 비대면, 등록 시기·대상 구분 없음", allWho: "전체", fbTrack: "과정", fbWho: "대상", fbSep: "별도 계좌", family: "어린이 학교와 다른 과정을 함께 신청하셨다면, 계좌별로 나누어 입금해 주세요.",
    assigned: "배정 완료", pending: "배정 중", pendingNote: "숙소 배정이 끝나면 여기에 표시됩니다.", online: "온라인 참여 (숙소 없음)",
    segment: "구간", checkin: "현장 등록", checkinNote: "도착하면 등록 데스크에서 이 화면을 보여 주세요.", checkedIn: "현장 등록 완료",
    logout: "로그아웃", noSchedule: "시간표는 확정되면 이곳에 올라옵니다.", noNotice: "아직 공지가 없습니다.", today: "오늘",
    groupPaid: "단체 입금", offline: "오프라인 — 마지막으로 받은 정보입니다", period: "기간", venue: "장소", track: "과정",
    admin: "관리자", pin: "관리자 PIN", refresh: "새로고침", total: "등록", lodgingDone: "숙소 배정", groups: "단체", comingSoon: "곧 안내가 올라옵니다",
  },
  en: {
    invitation: "Invitation", onlineLink: "Online link", onlineOpen: "Join online", onlineSoon: "The online link will be posted here and sent by text before the school begins.", groupRooms: "My group's rooms", groupRoomsNote: "Visible to the group leader only.", capInvite: "Theme verse · invitation", noticesMinistries: "Notices & Ministries", myShort: "My Page", seeAll: "See all", schoolShort: "Worship & Praise School", capNoticesMin: "School news · training · celebrations", capNotices: "News for this school", capSchedule: "By course", capSoon: "Coming soon", capMe: "Room · fee · check-in QR", capLogin: "With name and phone", capGuide: "Dress · meals · rooms", capPlaces: "Chapel · rooms · route videos", capMinistries: "Celebrations · training", otherMinistries: "ANM Ministries", church: "Church", state: "Status", trackOnly: "schedule only", openMap: "Open map", theme: "Theme",
    ministries: "Ministries", now: "Now", soon: "Coming up", past: "Past", apply: "Apply", myInfo: "My registration", checkReg: "Registration status",
    notices: "Notices", schedule: "Schedule", guide: "Guide", places: "Places & routes", home: "Home", back: "Back",
    loginTitle: "My registration", loginLede: "Use the name and phone number you registered with.", name: "Name", phone: "Phone",
    phoneHint: "Full number, digits only. Group members may use the leader's number.", enter: "Continue", checking: "Checking…",
    hello: ", welcome", payment: "Fee", lodging: "Room", paid: "Payment confirmed", partial: "Partly paid", unpaid: "Not paid yet",
    checkingPay: "Checking", cancelled: "Cancelled", fee: "Fee", account: "Bank account", depositor: "Depositor name", copy: "Copy", copied: "Copied", copyAcc: "Copy bank & account", copyAccHint: "Bank name and account number are copied together", payCheck: "Before you pay", payRule1: "Use ", payRule2: "Name (Church)", payRule3: " as the depositor name", payEx: "e.g. Hong Gildong (OO Church)", feeToggle: "All fees by school", myFee: "See my amount", seeTTs: "Times", seeTT: "Timetable", stewardTT: "The Stewards’ School joins the full schedule of all three schools.", withAll: "Joins the full schedule of every school.", onlineT: "Online participation", onlineD: "Every program is streamed live — join online on the same schedule.", parking: "Parking", route: "Route", toc: "Contents", early: "Early", regular: "Regular", onlineFee: "Online (all ages)", allWho: "All", fbTrack: "Course", fbWho: "Who", fbSep: "Separate account", family: "If your family also applied for the Children's school, please pay each account separately.",
    assigned: "Assigned", pending: "Pending", pendingNote: "Your room will appear here once assigned.", online: "Online (no room)",
    segment: "Stay", checkin: "Check-in", checkinNote: "Show this screen at the registration desk.", checkedIn: "Checked in",
    logout: "Log out", noSchedule: "The schedule will appear here once confirmed.", noNotice: "No notices yet.", today: "Today",
    groupPaid: "Group payment", offline: "Offline — showing last saved info", period: "Dates", venue: "Venue", track: "Course",
    admin: "Admin", pin: "Admin PIN", refresh: "Refresh", total: "Registered", lodgingDone: "Rooms assigned", groups: "Groups", comingSoon: "Details coming soon",
  },
  zh: {
    invitation: "邀请函", onlineLink: "线上参与链接", onlineOpen: "线上参与", onlineSoon: "线上参与链接将在开学前公布于此，并以短信通知。", groupRooms: "本团体宿舍", groupRoomsNote: "仅领队可见。", capInvite: "主题经文 · 邀请函", noticesMinistries: "公告与事工", myShort: "我的", seeAll: "全部", schoolShort: "敬拜赞美学校", capNoticesMin: "学校消息 · 培训 · 大聚会", capNotices: "本期学校消息", capSchedule: "按课程", capSoon: "确定后公布", capMe: "宿舍 · 培训费 · 报到码", capLogin: "姓名和电话", capGuide: "着装 · 用餐 · 宿舍", capPlaces: "礼拜堂 · 宿舍 · 路线视频", capMinistries: "大聚会 · 培训", otherMinistries: "ANM 事工", church: "教会", state: "状态", trackOnly: "的日程", openMap: "打开地图", theme: "主题",
    ministries: "事工", now: "进行中", soon: "即将举行", past: "往期", apply: "报名", myInfo: "我的报名", checkReg: "查询报名状态",
    notices: "公告", schedule: "日程", guide: "须知", places: "场所与路线", home: "首页", back: "返回",
    loginTitle: "我的报名信息", loginLede: "请输入报名时填写的姓名和电话号码。", name: "姓名", phone: "电话",
    phoneHint: "请输入完整号码（仅数字）。团体报名可使用领队的号码。", enter: "确认", checking: "确认中…",
    hello: "，欢迎您", payment: "培训费", lodging: "宿舍", paid: "已确认付款", partial: "部分付款", unpaid: "未付款",
    checkingPay: "确认中", cancelled: "已取消", fee: "培训费", account: "汇款账户", depositor: "汇款人姓名", copy: "复制", copied: "已复制", copyAcc: "复制银行及账号", copyAccHint: "银行名称和账号会一起复制", payCheck: "汇款前请确认", payRule1: "汇款人姓名请写", payRule2: "姓名(教会)", payRule3: "", payEx: "例：洪吉童(○○教会)", feeToggle: "各学校全部费用", myFee: "查看我的金额", seeTTs: "日程", seeTT: "查看日程", stewardTT: "管家敬拜赞美学校参加以上三所学校的全部日程。", withAll: "参加所有学校的全部日程。", onlineT: "线上参加", onlineD: "所有课程均有直播，可按相同日程线上参加。", parking: "停车", route: "路线", toc: "目录", early: "早鸟", regular: "一般", onlineFee: "线上报名（不分对象）", allWho: "全部", fbTrack: "课程", fbWho: "对象", fbSep: "单独账户", family: "如同时报名儿童学校，请按账户分别汇款。",
    assigned: "已分配", pending: "分配中", pendingNote: "分配完成后将显示在这里。", online: "线上参加（无宿舍）",
    segment: "入住", checkin: "现场报到", checkinNote: "到达后请在报到处出示此页面。", checkedIn: "已报到",
    logout: "退出", noSchedule: "日程确定后将在此公布。", noNotice: "暂无公告。", today: "今天",
    groupPaid: "团体付款", offline: "离线 — 显示最后保存的信息", period: "日期", venue: "地点", track: "课程",
    admin: "管理员", pin: "管理员 PIN", refresh: "刷新", total: "已报名", lodgingDone: "已分配宿舍", groups: "团体", comingSoon: "详情即将公布",
  },
} as const;

export type Key = keyof typeof T.ko;

let lang: Lang = (() => {
  try { const s = localStorage.getItem("anm.lang"); if (s === "en" || s === "zh" || s === "ko") return s; } catch { /* */ }
  const n = navigator.language || "ko";
  return n.startsWith("zh") ? "zh" : n.startsWith("ko") ? "ko" : n.startsWith("en") ? "en" : "ko";
})();
const subs = new Set<() => void>();
export function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem("anm.lang", l); } catch { /* */ }
  document.documentElement.lang = l;
  subs.forEach(f => f());
}
export const curLang = () => lang;
export function useLang() {
  const l = useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => lang);
  return { lang: l, t: (k: Key) => T[l][k] ?? T.ko[k] };
}

/** 트랙 이름(시트 값: 청지기·십대·어린이·대학청년…) → 화면 언어 */
const TRACK_NAMES: Record<string, Record<Lang, string>> = {
  "청지기": { ko: "청지기", en: "Stewards", zh: "管家" },
  "미래세대": { ko: "미래세대", en: "Next Generation", zh: "下一代" },
  "십대": { ko: "미래세대", en: "Next Generation", zh: "下一代" }, // 옛 값
  "어린이": { ko: "어린이", en: "Children", zh: "儿童" },
  "대학청년": { ko: "대학청년·일반", en: "University & Adults", zh: "大学青年·一般" },
};
export function trackName(k: string | undefined, lang: Lang) {
  if (!k) return "";
  const key = Object.keys(TRACK_NAMES).find(n => k.replace(/\s/g, "").startsWith(n));
  return key ? TRACK_NAMES[key][lang] : k;
}

/** 참가자 구분(시트 값) → 화면 언어 */
const KINDS: Record<string, [string, string]> = {
  "대학생 청년": ["University · Young adult", "大学生·青年"], "대학청년": ["University · Young adult", "大学生·青年"], "중고등부": ["Middle/High school", "初高中生"],
  "어린이": ["Child", "儿童"], "교사 교역자": ["Teacher · Pastor", "教师·传道人"], "교사": ["Teacher", "教师"], "교역자": ["Pastor", "传道人"], "전도사": ["Evangelist", "传道"],
  "선교사": ["Missionary", "宣教士"], "일반": ["Adult", "一般"], "직장인": ["Working adult", "上班族"], "평신도": ["Layperson", "平信徒"],
};
export function kindName(k: string | undefined, l: Lang) {
  if (!k || l === "ko") return k ?? "";
  const v = KINDS[k.trim()]; return v ? v[l === "en" ? 0 : 1] : k;
}

/** 로그인·관리 오류 문구 */
const ERR: Record<string, [string, string, string]> = {
  not_found: ["일치하는 등록 정보가 없습니다. 신청할 때 적은 이름과 전화번호를 확인해 주세요. 단체로 신청했다면 인솔자 전화번호로도 들어올 수 있습니다.", "No matching registration. Please check the name and phone number you applied with. Group members can also use the leader's phone number.", "找不到相符的报名信息。请确认报名时填写的姓名和电话号码。团体报名者也可使用领队的电话号码。"],
  cancelled: ["취소된 등록입니다. 문의: 7000school@gmail.com", "This registration was cancelled. Contact: 7000school@gmail.com", "该报名已取消。咨询：7000school@gmail.com"],
  too_many: ["시도가 너무 많습니다. 10분 뒤에 다시 해 주세요.", "Too many attempts. Please try again in 10 minutes.", "尝试次数过多，请10分钟后再试。"],
  invalid_input: ["이름과 전화번호(숫자 전체)를 입력해 주세요.", "Please enter your name and full phone number.", "请输入姓名和完整电话号码。"],
  no_project: ["지금은 이 행사의 내 정보 확인이 열려 있지 않습니다.", "Registration lookup is not open for this event right now.", "目前尚未开放此活动的报名查询。"],
  network: ["인터넷 연결을 확인해 주세요.", "Please check your internet connection.", "请检查网络连接。"],
  bad_pin: ["PIN이 맞지 않습니다.", "Incorrect PIN.", "PIN 不正确。"],
  forbidden: ["이 프로젝트를 볼 권한이 없습니다.", "You don't have access to this project.", "您没有查看此项目的权限。"],
  server: ["잠시 후 다시 시도해 주세요.", "Please try again shortly.", "请稍后再试。"],
};
export function errText(k: string, l: Lang = lang) { const v = ERR[k] ?? ERR.server; return v[l === "en" ? 1 : l === "zh" ? 2 : 0]; }
