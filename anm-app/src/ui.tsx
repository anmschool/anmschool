import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cachedContent, cachedMe, fetchContent, getToken, refreshMe } from "./api";
import type { Content, Me, Project } from "./types";
import { setLang, useLang, type Lang } from "./i18n";

/* ── 콘텐츠 (관리 시트) + 현재 시즌 ── */
interface State { content: Content | null; loading: boolean; offline: boolean; season?: Project; reload: () => void }
const Ctx = createContext<State>({ content: null, loading: true, offline: false, reload: () => {} });

/** 앱이 여는 시즌: ?s=ID 로 지정했던 값 → 진행 중인 경배와찬양학교 → 진행 중인 첫 프로젝트 */
function pickSeason(c: Content | null): Project | undefined {
  if (!c) return undefined;
  let want: string | null = null;
  try { want = new URLSearchParams(location.search).get("s") || localStorage.getItem("anm.season"); } catch { /* */ }
  return c.projects.find(p => p.id === want)
    ?? c.projects.find(p => p.status === "진행" && p.kind === "경배와찬양학교")
    ?? c.projects.find(p => p.status === "진행") ?? c.projects[0];
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content | null>(cachedContent());
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    fetchContent().then(c => { setContent(c); setOffline(false); }).catch(() => setOffline(true)).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  const season = pickSeason(content);
  return <Ctx.Provider value={{ content, loading, offline, season, reload: load }}>{children}</Ctx.Provider>;
}
export const useContent = () => useContext(Ctx);
export const useSeason = () => useContext(Ctx).season;
export const useProject = (id?: string): Project | undefined => useContent().content?.projects.find(p => p.id === id);

/** 현재 시즌의 내 정보 (로그인했으면) — 캐시를 먼저 보여 주고 뒤에서 새로 받음 */
export function useMe(seasonId?: string) {
  const [me, setMe] = useState<Me | null>(seasonId ? cachedMe(seasonId) : null);
  const [stale, setStale] = useState(false);
  const loggedIn = !!(seasonId && getToken(seasonId));
  useEffect(() => {
    if (!seasonId || !getToken(seasonId)) { setMe(null); return; }
    setMe(cachedMe(seasonId));
    refreshMe(seasonId).then(r => {
      if (r.ok) { setMe(r.me); setStale(false); }
      else if (r.error === "network" || r.error === "server") setStale(true);
      else setMe(null);
    }).catch(() => setStale(true));
  }, [seasonId]);
  return { me, loggedIn, stale };
}

/* ── 아이콘 (선 한 줄) ── */
export const Icon = {
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>,
  arrow: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>,
};

export function LangToggle() {
  const { lang } = useLang();
  const opts: [Lang, string][] = [["ko", "KO"], ["en", "EN"], ["zh", "中"]];
  return (
    <div className="lang" role="group" aria-label="Language">
      {opts.map(([l, label]) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{label}</button>)}
    </div>
  );
}

/** 하위 화면 머리: 시즌 워터컬러 띠 + 뒤로 + 제목 */
export function Head({ label, title, back = "/" }: { label?: string; title: string; back?: string }) {
  const nav = useNavigate();
  const { t } = useLang();
  return (
    <header className="head">
      <div className="bar">
        <button className="icon-btn" aria-label={t("back")} onClick={() => (history.length > 1 ? nav(-1) : nav(back))}>{Icon.back}</button>
        <LangToggle />
      </div>
      {label && <span className="label light">{label}</span>}
      <h1>{title}</h1>
    </header>
  );
}

export function Section({ label, title, children }: { label?: string; title: string; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">{label && <span className="label">{label}</span>}<h2>{title}</h2></div>
      {children}
    </section>
  );
}

export function Offline() {
  const { offline } = useContent();
  const { t } = useLang();
  return offline ? <div className="offline" role="status">{t("offline")}</div> : null;
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true">{Array.from({ length: lines }, (_, i) => <div key={i} className="skeleton" style={{ width: `${92 - i * 14}%` }} />)}</div>;
}

/** 관리 시트에 쓴 글: "- " 로 시작하는 줄은 목록으로 */
export function RichText({ text }: { text?: string }) {
  if (!text) return null;
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={blocks.length}>{list.map((l, i) => <li key={i}>{l}</li>)}</ul>); list = []; } };
  text.split("\n").forEach(line => {
    const s = line.trim();
    if (/^[-•·]\s*/.test(s)) list.push(s.replace(/^[-•·]\s*/, ""));
    else { flush(); if (s) blocks.push(<p key={blocks.length}>{s}</p>); }
  });
  flush();
  return <div className="prose">{blocks}</div>;
}

export function CopyButton({ text }: { text: string }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  return (
    <button className="btn tiny" onClick={() => {
      navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }).catch(() => {});
    }}>{done ? t("copied") : t("copy")}</button>
  );
}

const KO_DAY = ["일", "월", "화", "수", "목", "금", "토"];
export function dayOf(iso: string) { const [y, m, d] = iso.split("-").map(Number); return KO_DAY[new Date(y, m - 1, d).getDay()]; }
export function fmtDate(iso?: string, withDay = true) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${m}.${d}${withDay ? ` (${dayOf(iso)})` : ""}`;
}
export function fmtRange(a?: string, b?: string) { return !a ? "" : b && b !== a ? `${fmtDate(a)} – ${fmtDate(b)}` : fmtDate(a); }
export const won = (n: number | null | undefined) => (n == null ? "" : n.toLocaleString("ko-KR") + "원");
export const todayIso = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

export function Footer() {
  return (
    <footer className="footer">
      <span className="label mute">All Nations Worship &amp; Praise</span>
      <span className="small">7000school@gmail.com · +82 (0)2 796 9700</span>
      <Link to="/admin" className="small" style={{ opacity: 0.5 }}>admin</Link>
    </footer>
  );
}
