import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import type { Me } from "../types";
import { fmtRange, Footer, Icon, LangToggle, Skeleton, useContent, useMe, useSeason } from "../ui";
import { forTrack, payView } from "./shared";

function Pass({ me }: { me: Me }) {
  const { t } = useLang();
  const pv = payView(me, t);
  const room = me.lodging.find(l => l.room);
  return (
    <Link to="/me" className="pass" aria-label={t("myInfo")}>
      <div className="pass-top">
        <div>
          <div className="label">My Registration</div>
          <div className="pass-name">{me.name}</div>
          <div className="pass-meta">{[me.church, me.kind].filter(Boolean).join(" · ")}</div>
        </div>
        <span className="track-chip">{me.track}</span>
      </div>
      <div className="pass-cells">
        <div>
          <span className="label mute">Fee</span>
          <span className={`state ${pv.cls}`}>{pv.label}</span>
        </div>
        <div>
          <span className="label mute">Room</span>
          {me.online ? <span className="sub">{t("online")}</span>
            : room ? <span className="big"><span className="kr">{room.building}</span> {room.room}</span>
            : <span className="state dim">{t("pending")}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { content, loading } = useContent();
  const s = useSeason();
  const { t } = useLang();
  const { me, loggedIn } = useMe(s?.id);
  const [year, season] = (s?.title.match(/^(\d{4})\s+(\w+)/)?.slice(1) ?? [s?.start?.slice(0, 4) ?? "", ""]) as [string, string];
  const title = s?.title.replace(/^\d{4}\s+\w+\s*/, "") ?? "";
  const [themeText, themeRef] = (s?.subtitle?.match(/^(.*?)\s*\(([^)]+)\)\s*$/)?.slice(1) ?? [s?.subtitle ?? "", ""]) as [string, string];
  const notices = (content?.notices ?? []).filter(n => (n.project === s?.id || n.project === "전체") && forTrack(n.track, me?.track));
  const schedCount = (content?.schedule ?? []).filter(x => x.project === s?.id && forTrack(x.track, me?.track)).length;

  const menu: [string, string, string, string, string?][] = [
    ["/notices", "Notices", t("notices"), t("capNotices"), notices.length ? String(notices.length) : undefined],
    ["/schedule", "Schedule", t("schedule"), schedCount ? (me ? me.track : t("capSchedule")) : t("capSoon")],
    ...(loggedIn ? [["/me", "Room & Fee", t("myInfo"), t("capMe")] as [string, string, string, string]] : [["/login", "My Page", t("myInfo"), t("capLogin")] as [string, string, string, string]]),
    ["/guide", "Guide", t("guide"), t("capGuide")],
    ["/places", "Campus", t("places"), t("capPlaces")],
    ["/notices#ministries", "Ministries", t("ministries"), t("capMinistries")],
  ];

  const lead = title.match(/^(.*?향한)\s+(.+)$/);
  const venue = s?.venue?.match(/^(.*?캠퍼스)\s+(.+)$/);

  return (
    <div className="app">
      <header className="cover">
        <div className="cover-wash">
          <div className="cover-top">
            <Link to="/" className="brand"><img src="/ANM-logo-circle.png" alt="" /><span>ANM</span></Link>
            <LangToggle />
          </div>
          {s && (
            <div className="cover-mark" aria-label={`${year} ${season}`}>
              <span className="cover-year">{year}</span>
              {season && <span className="cover-season">{season.charAt(0) + season.slice(1).toLowerCase()}</span>}
            </div>
          )}
        </div>
        <div className="cover-paper">
          {!s && loading && <Skeleton lines={4} />}
          {s && (
            <>
              <span className="label">Worship &amp; Praise School</span>
              <h1 className="cover-title">
                {lead ? <><span className="lead">{lead[1]}</span>{lead[2]}</> : (title || s.title)}
              </h1>
              {themeText && (
                <div className="theme">
                  <span className="q">‘{themeText}’</span>
                  {themeRef && <span className="ref">{themeRef}</span>}
                </div>
              )}
              <dl className="facts">
                {s.start && <div><dt>Date</dt><dd className="num">{fmtRange(s.start, s.end)}</dd></div>}
                {s.venue && <div><dt>Location</dt><dd>{venue ? <>{venue[1]}<br />{venue[2]}</> : s.venue}</dd></div>}
              </dl>
            </>
          )}
        </div>
      </header>

      <main className="body">
        {me ? <Pass me={me} /> : s && (
          <div className="cta">
            {s.login && <Link className="btn" to="/login">{t("myInfo")}</Link>}
            {s.applyUrl && s.status !== "종료" && <a className="link-cta" href={s.applyUrl} target="_blank" rel="noreferrer">{t("apply")} <span aria-hidden>→</span></a>}
          </div>
        )}

        <nav className="toc" aria-label="menu">
          {menu.map(([to, en, kr, cap, badge]) => (
            <Link key={to} to={to}>
              <span className="toc-main">
                <span className="t">{kr}{badge && <sup>{badge}</sup>}</span>
                <span className="c">{cap}</span>
              </span>
              <span className="toc-en">{en}</span>
              <span className="toc-arrow">{Icon.arrow}</span>
            </Link>
          ))}
        </nav>

        {notices[0] && (
          <Link to="/notices" className="latest">
            <span className="label">Latest</span>
            <span className="latest-t">{notices[0].title}</span>
            <span className="small num">{notices[0].date.replace(/-/g, ". ")}</span>
          </Link>
        )}
        <Footer />
      </main>
    </div>
  );
}
