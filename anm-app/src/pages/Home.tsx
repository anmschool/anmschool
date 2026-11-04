import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import type { Me } from "../types";
import { Footer, Icon, LangToggle, SiteNav, Skeleton, useContent, useMe, useSeason } from "../ui";
import { forTrack, payView } from "./shared";

const WD = ["일", "월", "화", "수", "목", "금", "토"];
function krDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${y}년 ${m}월 ${d}일(${WD[new Date(y, m - 1, d).getDay()]})`;
}

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
    ["/notices", "Notices", t("noticesMinistries"), t("capNoticesMin"), notices.length ? String(notices.length) : undefined],
    ["/schedule", "Schedule", t("schedule"), schedCount ? (me ? me.track : t("capSchedule")) : t("capSoon")],
    ...(loggedIn ? [["/me", "Room & Fee", t("myInfo"), t("capMe")] as [string, string, string, string]] : [["/login", "My Page", t("myInfo"), t("capLogin")] as [string, string, string, string]]),
    ["/guide", "Guide", t("guide"), t("capGuide")],
    ["/places", "Campus", t("places"), t("capPlaces")],
  ];

  const lead = title.match(/^(.*?향한)\s+(.+)$/);

  const others = (content?.projects ?? []).filter(p => p.id !== s?.id);
  const tiles: [string, string, string, string][] = [
    ["/schedule", "Schedule", t("schedule"), schedCount ? (me ? me.track : t("capSchedule")) : t("capSoon")],
    ["/guide", "Guide", t("guide"), t("capGuide")],
    ["/places", "Campus", t("places"), t("capPlaces")],
  ];

  return (
    <div className="app home">
      <SiteNav />
      <div className="top">
      <header className="cover">
        <div className="cover-wash">
          <div className="cover-top">
            <Link to="/" className="brand">ANM</Link>
            <LangToggle />
          </div>
        </div>
      </header>

      <section className="masthead">
        <div className="cover-paper">
          {!s && loading && <Skeleton lines={4} />}
          {s && (
            <>
              <span className="label">{year} {season.toUpperCase()}</span>
              <h1 className="cover-title">
                {lead ? <><span className="lead">{lead[1]}</span>{lead[2]}</> : (title || s.title)}
              </h1>
              {themeText && (
                <div className="theme">
                  <span className="q">‘{themeText}’</span>
                  {themeRef && <span className="ref">{themeRef}</span>}
                </div>
              )}
            </>
          )}
        </div>
        {s && (
          <aside className="mast-aside">
            <dl className="facts">
              {s.start && <div><dt>Date</dt><dd>{krDate(s.start)}{s.end && s.end !== s.start ? ` ~ ${krDate(s.end)}` : ""}</dd></div>}
              {s.venue && <div><dt>Location</dt><dd>{s.venue}</dd></div>}
            </dl>
            <div className="cta">
              <Link className="btn" to={loggedIn ? "/me" : "/login"}>{t("myInfo")}</Link>
              {s.applyUrl && s.status !== "종료" && <a className="link-cta" href={s.applyUrl}>{t("apply")} <span aria-hidden>→</span></a>}
            </div>
            {me && <Pass me={me} />}
          </aside>
        )}
      </section>
      </div>

      <main className="body">
        {/* 폰: 목차형 메뉴 */}
        <nav className="toc narrow-only" aria-label="menu">
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
        <div className="wide-only tiles">
          {tiles.map(([to, en, kr, cap]) => (
            <Link key={to} to={to} className="tile">
              <span className="label mute">{en}</span>
              <span className="t">{kr}</span>
              <span className="c">{cap}</span>
              <span className="tile-arrow">{Icon.arrow}</span>
            </Link>
          ))}
        </div>
        <Footer />
      </main>
    </div>
  );
}
