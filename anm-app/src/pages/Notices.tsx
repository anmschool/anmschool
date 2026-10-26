import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../i18n";
import { fmtRange, Footer, Head, Icon, RichText, Section, useContent, useMe, useSeason } from "../ui";
import { forTrack } from "./shared";

export default function Notices() {
  const { content } = useContent();
  const s = useSeason();
  const { me } = useMe(s?.id);
  const { t } = useLang();
  const loc = useLocation();
  const notices = (content?.notices ?? []).filter(n => (n.project === s?.id || n.project === "전체") && forTrack(n.track, me?.track));
  const others = (content?.projects ?? []).filter(p => p.id !== s?.id);

  useEffect(() => {
    if (loc.hash === "#ministries") document.getElementById("ministries")?.scrollIntoView({ behavior: "smooth" });
  }, [loc.hash, content]);

  return (
    <div className="app">
      <Head label="Notices & Ministries" title={t("noticesMinistries")} />
      <main className="body">
        <div className="split">
        <div>
          {notices.length === 0 && <div className="empty">{t("noNotice")}</div>}
          {notices.map((n, i) => (
            <article key={i} className="notice">
              <span className="when">{n.pinned && <span className="pin">Pinned</span>}{n.date.replace(/-/g, ".")}{n.track !== "전체" && <span className="pin kr">{n.track}</span>}</span>
              <h3>{n.title}</h3>
              <RichText text={n.body} />
            </article>
          ))}
        </div>

        {others.length > 0 && (
          <div id="ministries">
            <Section label="Ministries" title={t("otherMinistries")}>
              <div>
                {others.map(p => (
                  <Link key={p.id} to={`/p/${encodeURIComponent(p.id)}`} className="ministry" style={{ ["--c" as string]: p.color }}>
                    <span className="bar-c" />
                    <span>
                      <span className="label kr mute" style={{ display: "block", fontSize: 12 }}>{p.kind} · {p.status === "진행" ? t("now") : p.status === "준비" ? t("soon") : t("past")}</span>
                      <span className="t">{p.title}</span>
                      {(p.start || p.subtitle) && <span className="small" style={{ display: "block" }}>{p.start ? fmtRange(p.start, p.end) : p.subtitle}</span>}
                    </span>
                    <span className="arrow">{Icon.arrow}</span>
                  </Link>
                ))}
              </div>
            </Section>
          </div>
        )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
