import { Link } from "react-router-dom";
import { getToken } from "../api";
import { useLang } from "../i18n";
import type { Project } from "../types";
import { Footer, fmtRange, Section, Skeleton, useContent, Wash } from "../ui";

const KIND_EN: Record<string, string> = { 경배와찬양학교: "Worship & Praise School", 큰잔치: "Great Celebration", 훈련: "Training" };

function ProjectCard({ p }: { p: Project }) {
  const { t } = useLang();
  const mine = getToken(p.id);
  return (
    <Link className="card link stripe" style={{ ["--c" as string]: p.color }} to={mine ? `/p/${p.id}/me` : `/p/${p.id}`}>
      <span className="kind" style={{ color: p.color }}>{KIND_EN[p.kind] ?? p.kind}</span>
      <span className="title">{p.title}</span>
      {p.subtitle && <span className="sub">{p.subtitle}</span>}
      <div className="row">
        {p.start && <span className="pill plain dim num">{fmtRange(p.start, p.end)}</span>}
        {mine && <span className="pill ok">{t("myInfo")}</span>}
        {!p.start && p.status === "준비" && <span className="pill plain dim">{t("comingSoon")}</span>}
      </div>
    </Link>
  );
}

export default function Home() {
  const { content, loading } = useContent();
  const { t } = useLang();
  const ps = content?.projects ?? [];
  const groups: [string, Project[]][] = [
    [t("now"), ps.filter(p => p.status === "진행")],
    [t("soon"), ps.filter(p => p.status === "준비")],
    [t("past"), ps.filter(p => p.status === "종료")],
  ];
  const pinned = (content?.notices ?? []).filter(n => n.pinned && n.track === "전체").slice(0, 2);
  return (
    <main className="page">
      <Wash>
        <h1>올네이션스 경배와찬양</h1>
        <p className="lede">경배와찬양학교 · 큰잔치 · 훈련 안내와 내 등록 정보</p>
      </Wash>
      {!content && loading && <Skeleton lines={4} />}
      {pinned.map(n => (
        <Link key={n.title} className="card link" to={`/p/${n.project}`}>
          <span className="kind" style={{ color: "var(--wine)" }}>Notice</span>
          <span className="title">{n.title}</span>
          {n.body && <span className="sub">{n.body}</span>}
        </Link>
      ))}
      {groups.filter(([, list]) => list.length).map(([label, list]) => (
        <Section key={label} title={label} eyebrow={t("ministries")}>
          <div className="stack">{list.map(p => <ProjectCard key={p.id} p={p} />)}</div>
        </Section>
      ))}
      <Footer />
    </main>
  );
}
