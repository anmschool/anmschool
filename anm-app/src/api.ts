import type { Content, Me, Stats } from "./types";
import { DEMO_CONTENT, demoLogin, demoStats } from "./demo";

// Apps Script 웹앱 (anmschool). Vercel 환경변수 VITE_API_URL이 있으면 그것을 우선
const DEFAULT_API = "https://script.google.com/macros/s/AKfycbx0Ax91iMfBomb-KHNsf88DrHm9t3qpMLm-ng8QUYANxwkMmDF9kU6haQlJmm5rgXYx/exec";
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || DEFAULT_API;
export const DEMO = new URLSearchParams(location.search).has("demo") || (() => { try { return sessionStorage.getItem("anm.demo") === "1"; } catch { return false; } })();
if (DEMO) { try { sessionStorage.setItem("anm.demo", "1"); } catch { /* */ } }

type Fail = { ok: false; error: string; message?: string };

async function post<T>(body: object): Promise<({ ok: true } & T) | Fail> {
  // text/plain → 브라우저가 사전 요청(CORS preflight)을 하지 않음 (Apps Script 웹앱 규칙)
  const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
  if (!res.ok) return { ok: false, error: "network" };
  return res.json();
}

const KEY_CONTENT = "anm.content.v1";
const KEY_TOKENS = "anm.tokens.v1";
const KEY_ME = "anm.me.v1";

/** 로그인 정보(토큰·내 정보)는 sessionStorage: 탭·앱을 닫으면 자동 로그아웃 */
const store = (k: string) => (k === KEY_CONTENT ? localStorage : sessionStorage);
try { localStorage.removeItem(KEY_TOKENS); localStorage.removeItem(KEY_ME); } catch { /* */ }

function read<T>(k: string): T | null {
  try { const s = store(k).getItem(k); return s ? (JSON.parse(s) as T) : null; } catch { return null; }
}
function write(k: string, v: unknown) {
  try { store(k).setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경: 무시 */ }
}

export function cachedContent(): Content | null { return DEMO ? DEMO_CONTENT : read<Content>(KEY_CONTENT); }

export async function fetchContent(): Promise<Content> {
  if (DEMO) return DEMO_CONTENT;
  const res = await fetch(`${API_URL}?action=content`);
  const j = await res.json();
  if (!j.ok) throw new Error(j.message || j.error);
  write(KEY_CONTENT, j.data);
  return j.data as Content;
}

/* 프로젝트별 로그인 토큰 */
export function getToken(project: string): string | null { return read<Record<string, string>>(KEY_TOKENS)?.[project] ?? null; }
function setToken(project: string, token: string | null) {
  const all = read<Record<string, string>>(KEY_TOKENS) ?? {};
  if (token) all[project] = token; else delete all[project];
  write(KEY_TOKENS, all);
}
export function cachedMe(project: string): Me | null { return read<Record<string, Me>>(KEY_ME)?.[project] ?? null; }
function setMe(project: string, me: Me | null) {
  const all = read<Record<string, Me>>(KEY_ME) ?? {};
  if (me) all[project] = me; else delete all[project];
  write(KEY_ME, all);
}

/** 방금 받은 내 정보면 다시 묻지 않기 (로그인 직후 중복 요청 방지) */
const fetchedAt: Record<string, number> = {};
export function isFresh(project: string) { return Date.now() - (fetchedAt[project] || 0) < 60_000; }
/** 로그인 화면이 열리면 서버를 미리 깨워 둔다 (첫 요청 지연 줄이기) */
export function warmUp() { if (!DEMO) fetch(`${API_URL}?action=ping`).catch(() => {}); }

export async function login(project: string, name: string, phone: string): Promise<{ ok: true; me: Me } | Fail> {
  if (DEMO) {
    const me = demoLogin(name, phone);
    if (!me) return { ok: false, error: "not_found" };
    setToken(project, "demo"); setMe(project, me);
    return { ok: true, me };
  }
  const r = await post<{ token: string; me: Me }>({ action: "login", project, name, phone });
  if (r.ok) { setToken(project, r.token); setMe(project, r.me); fetchedAt[project] = Date.now(); return { ok: true, me: r.me }; }
  return r;
}

export async function refreshMe(project: string): Promise<{ ok: true; me: Me } | Fail> {
  const token = getToken(project);
  if (!token) return { ok: false, error: "no_token" };
  if (DEMO) { const me = cachedMe(project); return me ? { ok: true, me } : { ok: false, error: "no_token" }; }
  const r = await post<{ me: Me }>({ action: "me", token });
  if (r.ok) { setMe(project, r.me); fetchedAt[project] = Date.now(); return { ok: true, me: r.me }; }
  if (r.error === "bad_token" || r.error === "not_found") logout(project);
  return r;
}

export function logout(project: string) { setToken(project, null); setMe(project, null); }

export async function adminStats(pin: string, project: string): Promise<{ ok: true; admin: string; stats: Stats } | Fail> {
  if (DEMO) return pin === "000000" ? { ok: true, admin: "데모", stats: demoStats } : { ok: false, error: "bad_pin" };
  return post<{ admin: string; stats: Stats }>({ action: "admin", pin, project });
}

export const ERROR_TEXT: Record<string, string> = {
  not_found: "일치하는 등록 정보가 없습니다. 신청할 때 적은 이름과 전화번호를 확인해 주세요. 단체로 신청했다면 인솔자 전화번호로도 들어올 수 있습니다.",
  cancelled: "취소된 등록입니다. 문의: 7000school@gmail.com",
  too_many: "시도가 너무 많습니다. 10분 뒤에 다시 해 주세요.",
  invalid_input: "이름과 전화번호(숫자 전체)를 입력해 주세요.",
  no_project: "지금은 이 행사의 내 정보 확인이 열려 있지 않습니다.",
  network: "인터넷 연결을 확인해 주세요.",
  bad_pin: "PIN이 맞지 않습니다.",
  forbidden: "이 프로젝트를 볼 권한이 없습니다.",
  server: "잠시 후 다시 시도해 주세요.",
};
