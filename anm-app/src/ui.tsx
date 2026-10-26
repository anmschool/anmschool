import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cachedContent, fetchContent } from "./api";
import type { Content, Project } from "./types";
import { setLang, useLang, type Lang } from "./i18n";

/* ── 콘텐츠 (관리 시트) ── */
interface ContentState { content: Content | null; loading: boolean; offline: boolean; reload: () => void }
const Ctx = createContext<ContentState>({ content: null, loading: true, offline: false, reload: () => {} });

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content | null>(cachedContent());
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const load = () => {
    setLoading(true);
    fetchContent().then(c => { setContent(c); setOffline(false); }).catch(() => setOffline(true)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  return <Ctx.Provider value={{ content, loading, offline, reload: load }}>{children}</Ctx.Provider>;
}
export const useContent = () => useContext(Ctx);
export const useProject = (id?: string): Project | undefined => useContent().content?.projects.find(p => p.id === id);

/* ── 화면 틀 ── */
export function Wash({ project, back, children }: { project?: Project; back?: string; children?: ReactNode }) {
  const { t } = useLang();
  const style = project?.image ? { backgroundImage: `url(${project.image})` } : undefined;
  return (
    <header className={"wash" + (project?.image ? " has-img" : "")} style={style}>
      <div className="topbar">
        {back ? <Link className="back" to={back}>← {t("back")}</Link> : (
          <Link className="brand" to="/"><img src="/ANM-logo-circle.png" alt="" /><span className="eyebrow">All Nations</span></Link>
        )}
        <LangToggle />
      </div>
      {children}
    </header>
  );
}

export function LangToggle() {
  const { lang } = useLang();
  const opts: [Lang, string][] = [["ko", "한"], ["en", "EN"], ["zh", "中"]];
  return (
    <div className="lang" role="group" aria-label="Language">
      {opts.map(([l, label]) => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{label}</button>)}
    </div>
  );
}

export function Section({ title, eyebrow, action, children }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head"><h2>{title}</h2>{action ?? (eyebrow && <span className="label">{eyebrow}</span>)}</div>
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
  return <div className="stack" aria-busy="true">{Array.from({ length: lines }, (_, i) => <div key={i} className="skeleton" style={{ width: `${90 - i * 15}%` }} />)}</div>;
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
  return <div className="guide-body">{blocks}</div>;
}

export function CopyButton({ text }: { text: string }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  return (
    <button className="btn ghost small" onClick={() => {
      navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }).catch(() => {});
    }}>{done ? t("copied") : t("copy")}</button>
  );
}

const KO_DAY = ["일", "월", "화", "수", "목", "금", "토"];
export function fmtDate(iso?: string, withDay = true) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const day = KO_DAY[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}${withDay ? `(${day})` : ""}`;
}
export function fmtRange(a?: string, b?: string) {
  if (!a) return "";
  return b && b !== a ? `${fmtDate(a)} – ${fmtDate(b)}` : fmtDate(a);
}
export const won = (n: number | null | undefined) => (n == null ? "" : n.toLocaleString("ko-KR") + "원");
export const todayIso = () => {
  const d = new Date(Date.now() + 9 * 3600e3);
  return d.toISOString().slice(0, 10);
};

export function Footer() {
  return <div className="footer">ANM · All Nations Worship &amp; Praise Ministries · 7000school@gmail.com</div>;
}
