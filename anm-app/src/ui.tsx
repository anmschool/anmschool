import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
  useEffect(() => {
    // 시즌 대표 이미지(관리 시트 '대표 이미지')를 워터컬러 배경으로
    const img = season?.image;
    if (img) document.documentElement.style.setProperty("--hero", `url("${img}")`);
    else document.documentElement.style.removeProperty("--hero");
  }, [season?.image]);
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
/** 아이패드·컴퓨터용 상단 내비 (폰에서는 숨김) */
export function SiteNav() {
  const s = useSeason();
  const { t } = useLang();
  const loggedIn = !!(s && getToken(s.id));
  const me = s ? cachedMe(s.id) : null;
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links: [string, string][] = [["/notices", t("noticesMinistries")], ["/schedule", t("schedule")], ["/guide", t("guide")], ["/places", t("places")]];
  return (
    <nav className={"sitenav" + (solid ? " solid" : "")} aria-label="site">
      <div className="sitenav-in">
        <Link to="/" className="sitenav-brand"><span className="anm">ANM</span>{s && <span className="season">{s.title.match(/^\d{4}\s+\w+/)?.[0] ?? ""} {t("schoolShort")}</span>}</Link>
        <div className="sitenav-links">{links.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</div>
        <div className="sitenav-right">
          <LangToggle />
          <Link to={loggedIn ? "/me" : "/login"} className="btn small">{loggedIn && me ? me.name : t("myInfo")}</Link>
        </div>
      </div>
    </nav>
  );
}

export function Head({ label, title, back = "/" }: { label?: string; title: string; back?: string }) {
  const nav = useNavigate();
  const { t } = useLang();
  const { pathname } = useLocation();
  const isTab = TAB_PATHS.includes(pathname);
  return (
    <>
    <SiteNav />
    <header className="head">
      <div className="bar">
        {isTab ? <span className="brand">ANM</span> : <button className="icon-btn" aria-label={t("back")} onClick={() => (history.length > 1 ? nav(-1) : nav(back))}>{Icon.back}</button>}
        <LangToggle />
      </div>
      <div className="head-in">
        {label && <span className="label light">{label}</span>}
        <h1>{title}</h1>
      </div>
    </header>
    </>
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
      <span className="org">All Nations Worship &amp; Praise Ministries</span>
      <span className="small">7000school@gmail.com · +82 (0)2 796 9700</span>
      <Link to="/admin" className="small" style={{ opacity: 0.5 }}>admin</Link>
    </footer>
  );
}

/* ── 폰 전용 하단 탭 바 (앱처럼) ── */
const TAB_PATHS = ["/", "/notices", "/schedule", "/me", "/login"];
const tabIcon = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" /></svg>,
  notice: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></svg>,
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="5.5" width="16" height="14.5" rx="1.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>,
  me: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4.5" y="3.5" width="15" height="17" rx="1.5" /><circle cx="12" cy="10" r="2.6" /><path d="M8 17c.8-2 2.2-3 4-3s3.2 1 4 3" /></svg>,
};
export function TabBar() {
  const { pathname } = useLocation();
  const { t } = useLang();
  const s = useSeason();
  if (!TAB_PATHS.includes(pathname)) return null;
  const meTo = s && getToken(s.id) ? "/me" : "/login";
  const tabs: [string, string, JSX.Element, boolean][] = [
    ["/", t("home"), tabIcon.home, pathname === "/"],
    ["/notices", t("notices"), tabIcon.notice, pathname === "/notices"],
    ["/schedule", t("schedule"), tabIcon.cal, pathname === "/schedule"],
    [meTo, t("myShort"), tabIcon.me, pathname === "/me" || pathname === "/login"],
  ];
  return (
    <nav className="tabbar" aria-label="tabs">
      {tabs.map(([to, label, icon, on]) => (
        <Link key={label} to={to} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>{icon}<span>{label}</span></Link>
      ))}
    </nav>
  );
}
