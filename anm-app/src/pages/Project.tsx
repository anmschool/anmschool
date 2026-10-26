import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getToken } from "../api";
import { useLang } from "../i18n";
import { Footer, fmtDate, fmtRange, RichText, Section, Skeleton, useContent, useProject, Wash } from "../ui";
import { NoticeList, PlaceList, ScheduleList } from "./parts";

type Tab = "notices" | "schedule" | "guide" | "places";

export default function ProjectPage() {
  const { id } = useParams();
  const { content, loading } = useContent();
  const p = useProject(id);
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("notices");
  if (!p) return content && !loading ? <Navigate to="/" replace /> : <main className="page"><Wash back="/" /><Skeleton lines={5} /></main>;
  const notices = content!.notices.filter(n => n.project === p.id || n.project === "전체");
  const schedule = content!.schedule.filter(s => s.project === p.id);
  const guides = content!.guides.filter(g => g.project === p.id);
  const places = content!.places.filter(x => x.project === p.id);
  const sections = Array.from(new Set(guides.map(g => g.section)));
  const tabs: [Tab, string, number][] = [["notices", t("notices"), notices.length], ["schedule", t("schedule"), schedule.length], ["guide", t("guide"), guides.length], ["places", t("places"), places.length]];
  const loggedIn = !!getToken(p.id);

  return (
    <main className="page">
      <Wash project={p} back="/">
        <span className="label wine">{p.kind}</span>
        <h1 style={{ marginTop: 6 }}>{p.title}</h1>
        {p.subtitle && <p className="lede">{p.subtitle}</p>}
        <div className="meta">
          {p.start && <span className="num">{fmtRange(p.start, p.end)}</span>}
          {p.venue && <span>{p.venue}</span>}
        </div>
      </Wash>

      <div className="stack">
        {p.login && (
          <Link className="btn" to={loggedIn ? `/p/${p.id}/me` : `/p/${p.id}/login`}>{t("myInfo")}</Link>
        )}
        {p.applyUrl && p.status !== "종료" && (
          <a className={"btn" + (p.login ? " ghost" : "")} href={p.applyUrl} target="_blank" rel="noreferrer">{t("apply")} ↗</a>
        )}
        {p.about && <p className="lede" style={{ fontSize: 14 }}>{p.about}</p>}
      </div>

      <div className="tabs" role="tablist">
        {tabs.filter(([, , n]) => n > 0 || tab === "notices").map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "notices" && <Section title={t("notices")}><NoticeList items={notices} /></Section>}
      {tab === "schedule" && <Section title={t("schedule")}><ScheduleList items={schedule} /></Section>}
      {tab === "guide" && sections.map(sec => (
        <Section key={sec} title={sec}>
          <div>{guides.filter(g => g.section === sec).map(g => (
            <details key={g.title} className="acc"><summary>{g.title}</summary><RichText text={g.body} /></details>
          ))}</div>
        </Section>
      ))}
      {tab === "places" && <Section title={t("places")}><PlaceList items={places} /></Section>}
      {content && <p className="hint" style={{ textAlign: "center" }}>{fmtDate(content.updatedAt.slice(0, 10), false)} 기준</p>}
      <Footer />
    </main>
  );
}
