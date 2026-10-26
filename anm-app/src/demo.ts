import type { Content, Me, Stats } from "./types";

/** 데모 데이터 — VITE_API_URL이 없거나 ?demo 일 때만 사용. 실제 참가자 정보 아님 */
export const DEMO_CONTENT: Content = {
  updatedAt: new Date().toISOString(),
  projects: [
    {
      id: "2027W", kind: "경배와찬양학교", title: "2027 WINTER 경배와찬양학교 및 7000학교", subtitle: "얽매이지 않는 삶 (고전 6:12)",
      start: "2027-01-11", end: "2027-01-21", venue: "명지대학교 자연캠퍼스 60주년 기념 채플관", status: "진행", order: 1,
      applyUrl: "https://forms.gle/rdfXzXvHyYnkXaQv7", login: true, color: "#6E1F3A",
      about: "하스데반 선교사와 경배와찬양 국제사역팀이 인도합니다. 미래세대 1/11~14 · 어린이 1/14~16 · 대학 청년 및 일반인 1/18~21 · 청지기 1/11~16, 18~21",
    },
    { id: "2026-11-큰잔치", kind: "큰잔치", title: "경배와찬양 큰잔치 · 시편학교", status: "준비", order: 2, login: false, color: "#3A1022" },
    { id: "7000훈련", kind: "훈련", title: "7000훈련", status: "준비", order: 3, login: false, color: "#8A3554" },
  ],
  notices: [
    { project: "2027W", date: "2026-10-26", title: "2027 WINTER 경배와찬양학교 신청이 열렸습니다", body: "선등록은 12월 27일(주일)까지입니다. 신청 후 안내된 계좌로 훈련비를 입금해 주세요.", pinned: true, track: "전체" },
    { project: "2027W", date: "2027-01-10", title: "청지기 주말 귀가 안내", body: "1/16(토) 파송 예배 후 퇴실, 1/18(월) 14:00까지 다시 입실합니다.", pinned: false, track: "청지기" },
  ],
  schedule: [
    { project: "2027W", track: "미래세대, 청지기", date: "2027-01-11", start: "14:00", end: "15:30", title: "등록", place: "채플관 로비" },
    { project: "2027W", track: "미래세대, 청지기", date: "2027-01-11", start: "19:30", end: "22:30", title: "새 예루살렘을 향하여 Celebration I", place: "60주년 기념 채플관" },
    { project: "2027W", track: "전체", date: "2027-01-12", start: "08:00", end: "10:30", title: "침묵기도 I", place: "60주년 기념 채플관" },
  ],
  guides: [
    { project: "2027W", section: "훈련 안내", title: "복장", body: "- 형제는 운동복이 아닌 긴바지, 자매는 긴 치마를 준비해 주시기 바랍니다.\n- 예배에 동참할 때 운동화를 착용해 주시기 바랍니다.", order: 1 },
    { project: "2027W", section: "훈련 안내", title: "숙소에서", body: "- 서로 안식할 수 있도록 배려해 주십시오.\n- 숙소를 나가실 때는 항상 소등해 주십시오.", order: 2 },
    { project: "2027W", section: "훈련비", title: "환불 규정", body: "- 12월 27일까지 100% 환불\n- 12월 28일 ~ 1월 10일 50% 환불\n- 당일 환불 불가", order: 3 },
  ],
  places: [
    { project: "2027W", name: "60주년 기념 채플관", kind: "예배", body: "모든 예배와 강의가 열리는 곳", image: "/images/facility/chapel_back-to-stage.jpg", video: "/videos/course1_main_gate_to_chapel.mp4", order: 1 },
    { project: "2027W", name: "5동", kind: "숙소", body: "생활관 5동", image: "/images/facility/dorm5_entrance.jpg", video: "/videos/course2_chapel_to_restaurant.mp4", order: 2 },
    { project: "2027W", name: "명덕관", kind: "숙소", body: "명덕관 숙소", image: "/images/facility/myeongdeok_entrance.jpg", video: "/videos/course3_main_gate_to_myeongdeok.mp4", order: 3 },
  ],
};

const DEMO_ME: Me = {
  project: "2027W", projectTitle: "2027 WINTER 경배와찬양학교 및 7000학교", code: "2027W-청지기-0001", name: "홍길동", church: "예시교회",
  track: "청지기", kind: "대학청년", gender: "형제", online: false,
  period: [["2027-01-11", "2027-01-16"], ["2027-01-18", "2027-01-21"]],
  payment: { state: "partial", label: "부분", fee: 190000, account: "우리 1005-604-700231", depositorHint: "홍길동(예시교회)", groupPaid: false },
  group: null,
  lodging: [
    { segment: "1", checkIn: "2027-01-11", checkOut: "2027-01-16", building: "5동", room: "301" },
    { segment: "2", checkIn: "2027-01-18", checkOut: "2027-01-21", building: "", room: "" },
  ],
  checkedIn: false, cancelled: false,
};

export function demoLogin(name: string, phone: string): Me | null {
  return name.replace(/\s/g, "") === "홍길동" && phone.replace(/\D/g, "") === "01012345678" ? DEMO_ME : null;
}

export const demoStats: Stats = {
  total: 312, cancelled: 4, groups: 21, checkedIn: 0, updatedAt: new Date().toISOString(),
  lodging: { lines: 341, assigned: 220 },
  tracks: [
    { track: "청지기", total: 58, paid: 41, partial: 6, unpaid: 11, brother: 21, sister: 37 },
    { track: "미래세대", total: 141, paid: 102, partial: 9, unpaid: 30, brother: 60, sister: 81 },
    { track: "어린이", total: 63, paid: 50, partial: 2, unpaid: 11, brother: 30, sister: 33 },
    { track: "대학청년·일반", total: 50, paid: 22, partial: 3, unpaid: 25, brother: 18, sister: 32 },
  ],
};
