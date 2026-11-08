export type ProjectStatus = "준비" | "진행" | "종료";

export interface Project extends Tr {
  id: string;
  kind: string; // 경배와찬양학교 | 큰잔치 | 훈련 | 기타
  title: string;
  subtitle?: string;
  start?: string;
  end?: string;
  venue?: string;
  status: ProjectStatus;
  order: number;
  applyUrl?: string;
  image?: string;
  login: boolean;
  color: string;
  about?: string;
}

type Tr = { tr?: Partial<Record<"ko" | "en" | "zh", Record<string, string>>> };
export interface Notice extends Tr { project: string; date: string; title: string; body?: string; pinned: boolean; track: string }
export interface ScheduleItem extends Tr { project: string; track: string; date: string; start: string; end: string; title: string; place?: string; note?: string }
export interface Guide extends Tr { project: string; section: string; title: string; body: string; order: number }
export interface Place extends Tr { project: string; name: string; kind?: string; body?: string; map?: string; image?: string; video?: string; order: number }

export interface Content {
  updatedAt: string;
  projects: Project[];
  notices: Notice[];
  schedule: ScheduleItem[];
  guides: Guide[];
  places: Place[];
  /** 운영 시트 트랙 탭 (날짜·요금·선등록 마감) — 시트 한 곳만 고치면 반영 */
  tracks?: Record<string, { deadline: string; list: { name: string; mode: string; in1: string; out1: string; in2: string; out2: string }[] }>;
}

export type PayState = "paid" | "partial" | "unpaid" | "checking" | "cancelled";

export interface Me {
  project: string;
  projectTitle: string;
  code: string;
  name: string;
  church: string;
  track: string;
  kind: string;
  gender: string;
  online: boolean;
  period: [string, string][];
  payment: { state: PayState; label: string; fee: number | null; account: string; depositorHint: string; groupPaid: boolean };
  group: { id: string; name: string; status: string } | null;
  lodging: { segment: string; checkIn: string; checkOut: string; building: string; room: string }[];
  checkedIn: boolean;
  cancelled: boolean;
}

export interface Stats {
  total: number;
  cancelled: number;
  tracks: { track: string; total: number; paid: number; partial: number; unpaid: number; brother: number; sister: number }[];
  lodging: { lines: number; assigned: number };
  groups: number;
  checkedIn: number;
  updatedAt: string;
}
