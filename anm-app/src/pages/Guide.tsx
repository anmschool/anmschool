import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { Footer, Head, RichText, useContent, useSeason } from "../ui";

/** 안내: 모두 펼쳐 두고, 목차(컴퓨터 왼쪽 · 폰 위쪽)로 이동 + 지금 읽는 곳 표시 */
export default function Guide() {
  const { content } = useContent();
  const s = useSeason();
  const { t } = useLang();
  const guides = (content?.guides ?? []).filter(g => g.project === s?.id).map((g, i) => ({ ...g, id: `g${i}` }));
  const sections = Array.from(new Set(guides.map(g => g.section)));
  const [active, setActive] = useState("g0");
  const lock = useRef(0);

  useEffect(() => {
    const ids = guides.map(g => g.id);
    const spy = () => {
      if (Date.now() < lock.current) return;
      let cur = ids[0];
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= 160) cur = id; }
      if (cur) setActive(a => (a === cur ? a : cur));
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
    return () => window.removeEventListener("scroll", spy);
  }, [guides.length]);

  useEffect(() => {
    const a = document.querySelector<HTMLElement>(`.gidx-m a[data-id="${active}"]`), bar = a?.parentElement;
    if (a && bar) bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2 });
  }, [active]);

  const go = (id: string) => {
    setActive(id);
    lock.current = Date.now() + 900;
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  const link = (g: { id: string; title: string }, cls: string) => (
    <a key={g.id} href={`#${g.id}`} data-id={g.id} className={cls + (active === g.id ? " on" : "")} aria-current={active === g.id ? "true" : undefined}
      onClick={e => { e.preventDefault(); go(g.id); }}>{g.title}</a>
  );

  return (
    <div className="app">
      <Head label="Guide" title={t("guide")} />
      <main className="body guide-body">
        {guides.length === 0 && <div className="empty">{t("comingSoon")}</div>}
        {guides.length > 0 && (
          <div className="guide">
            <nav className="gidx-m" aria-label={t("toc")}>{guides.map(g => link(g, "chip"))}</nav>
            <nav className="gidx" aria-label={t("toc")}>
              {sections.map(sec => (
                <div key={sec}><span className="gidx-h">{sec}</span>{guides.filter(g => g.section === sec).map(g => link(g, "gidx-a"))}</div>
              ))}
            </nav>
            <div className="gbody">
              {sections.map(sec => (
                <section key={sec} className="gsec">
                  <h2>{sec}</h2>
                  {guides.filter(g => g.section === sec).map(g => (
                    <div key={g.id} id={g.id} className="gitem"><h3>{g.title}</h3><RichText text={g.body} /></div>
                  ))}
                </section>
              ))}
            </div>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}
