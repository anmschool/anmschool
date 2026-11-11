import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLang } from "../i18n";

export type IndexItem = { id: string; title: string; group?: string };

/** 목차형 화면(안내·공지·장소 공통): 컴퓨터는 왼쪽 목차, 폰은 위쪽 탭. 스크롤하면 지금 읽는 곳 표시 */
export function IndexLayout({ items, children }: { items: IndexItem[]; children: ReactNode }) {
  const { t } = useLang();
  const [active, setActive] = useState(items[0]?.id ?? "");
  const lock = useRef(0);
  const groups = Array.from(new Set(items.map(i => i.group ?? "")));
  const key = items.map(i => i.id).join("|");

  useEffect(() => {
    const ids = key.split("|");
    const spy = () => {
      if (Date.now() < lock.current) return;
      let cur = ids[0];
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= 160) cur = id; }
      if (cur) setActive(a => (a === cur ? a : cur));
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
    return () => window.removeEventListener("scroll", spy);
  }, [key]);

  useEffect(() => {
    const a = document.querySelector<HTMLElement>(`.gidx-m a[data-id="${active}"]`), bar = a?.parentElement;
    if (a && bar) bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2 });
  }, [active]);

  const go = (id: string) => {
    setActive(id);
    lock.current = Date.now() + 900;
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  const link = (g: IndexItem, cls: string) => (
    <a key={g.id} href={`#${g.id}`} data-id={g.id} className={cls + (active === g.id ? " on" : "")} aria-current={active === g.id ? "true" : undefined}
      onClick={e => { e.preventDefault(); go(g.id); }}>{g.title}</a>
  );

  return (
    <div className="guide">
      <nav className="gidx-m" aria-label={t("toc")}>{items.map(g => link(g, "chip"))}</nav>
      <nav className="gidx" aria-label={t("toc")}>
        {groups.map(gr => (
          <div key={gr}>{gr && <span className="gidx-h">{gr}</span>}{items.filter(i => (i.group ?? "") === gr).map(g => link(g, "gidx-a"))}</div>
        ))}
      </nav>
      <div className="gbody">{children}</div>
    </div>
  );
}
