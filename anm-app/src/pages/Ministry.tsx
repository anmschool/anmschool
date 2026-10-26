import { Navigate, useParams } from "react-router-dom";
import { useLang } from "../i18n";
import { fmtRange, Footer, Head, RichText, Section, Skeleton, useContent, useProject } from "../ui";

/** 다른 사역(큰잔치·훈련 등) 안내 — 공지 > 사역 안내에서 들어옴 */
export default function Ministry() {
  const { id } = useParams();
  const { content, loading } = useContent();
  const p = useProject(id);
  const { t } = useLang();
  if (!p) return content && !loading ? <Navigate to="/notices" replace /> : <div className="app"><Head title="" /><main className="body"><Skeleton /></main></div>;
  const notices = content!.notices.filter(n => n.project === p.id);
  const guides = content!.guides.filter(g => g.project === p.id);
  const places = content!.places.filter(x => x.project === p.id);
  return (
    <div className="app">
      <Head label={({ 경배와찬양학교: "Worship & Praise School", 큰잔치: "Great Celebration", 훈련: "Training" } as Record<string, string>)[p.kind] ?? "Ministry"} title={p.title} back="/notices" />
      <main className="body">
        {!p.about && (p.subtitle || p.start || p.venue) && (
          <dl className="rows">
            {p.subtitle && <><dt>{t("theme")}</dt><dd>{p.subtitle}</dd></>}
            {p.start && <><dt>{t("period")}</dt><dd className="num">{fmtRange(p.start, p.end)}</dd></>}
            {p.venue && <><dt>{t("venue")}</dt><dd>{p.venue}</dd></>}
          </dl>
        )}
        {p.about && <div className="about"><RichText text={p.about} /></div>}
        {!p.about && !p.start && <div className="empty">{t("comingSoon")}</div>}
        {p.applyUrl && p.status !== "종료" && <a className="btn" href={p.applyUrl} target="_blank" rel="noreferrer">{t("apply")}</a>}
        {notices.length > 0 && (
          <Section label="Notices" title={t("notices")}>
            <div>{notices.map((n, i) => <article key={i} className="notice"><span className="when">{n.date.replace(/-/g, ".")}</span><h3>{n.title}</h3><RichText text={n.body} /></article>)}</div>
          </Section>
        )}
        {guides.length > 0 && (
          <Section label="Guide" title={t("guide")}>
            <div>{guides.map(g => <details key={g.title} className="acc"><summary>{g.title}</summary><RichText text={g.body} /></details>)}</div>
          </Section>
        )}
        {places.map(pl => (
          <div key={pl.name} className="place">
            <div className="place-head"><span className="t">{pl.name}</span><span className="label mute">Location</span></div>
            {pl.image && <img src={pl.image} alt={pl.name} loading="lazy" />}
            {pl.body && <span className="sub">{pl.body}</span>}
            {pl.map && <a className="link-cta" style={{ alignSelf: "flex-start" }} href={pl.map} target="_blank" rel="noreferrer">{t("openMap")} ↗</a>}
          </div>
        ))}
        <Footer />
      </main>
    </div>
  );
}
