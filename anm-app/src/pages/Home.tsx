import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import type { Me } from "../types";
import { fmtRange, Footer, LangToggle, Skeleton, useContent, useMe, useSeason } from "../ui";
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

  return (
    <div className="app">
      <header className="cover">
        <div className="cover-wash">
          <div className="cover-top">
            <span className="label light">All Nations</span>
            <LangToggle />
          </div>
          {s && (
            <div className="cover-mark">
              <span className="cover-year">{year}</span>
              {season && <span className="cover-season">{season.charAt(0) + season.slice(1).toLowerCase()}</span>}
            </div>
          )}
        </div>
        <div className="cover-paper">
          {!s && loading && <Skeleton lines={4} />}
          {s && (
            <>
              <h1 className="cover-title">{title || s.title}</h1>
              {themeText && <div className="theme"><span className="q">‘{themeText}’</span>{themeRef && <span className="ref">{themeRef}</span>}</div>}
              <dl className="facts">
                {s.start && <><dt>Date</dt><dd className="num">{fmtRange(s.start, s.end)}</dd></>}
                {s.venue && <><dt>Venue</dt><dd>{s.venue}</dd></>}
              </dl>
            </>
          )}
        </div>
      </header>

      <main className="body">
        {me ? <Pass me={me} /> : s && (
          <div className="cta">
            {s.login && <Link className="btn" to="/login"><small>My Page</small>{t("myInfo")}</Link>}
            {s.applyUrl && s.status !== "종료" && <a className={s.login ? "btn line" : "btn"} href={s.applyUrl} target="_blank" rel="noreferrer">{t("apply")}</a>}
          </div>
        )}

        <nav className="menu" aria-label="menu">
          {menu.map(([to, en, kr, cap, badge]) => (
            <Link key={to} to={to}>
              <span className="label mute">{en}</span>
              <span className="t">{kr}</span>
              <span className="c">{cap}</span>
              {badge && <span className="badge">{badge}</span>}
            </Link>
          ))}
        </nav>

        {notices[0] && (
          <Link to="/notices" className="notice" style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <span className="when"><span className="pin">Latest</span>{notices[0].date.replace(/-/g, ".")}</span>
            <h3>{notices[0].title}</h3>
          </Link>
        )}
        <Footer />
      </main>
    </div>
  );
}
