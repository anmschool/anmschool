import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import type { Me } from "../types";
import { fmtRange, Footer, Icon, LangToggle, SiteNav, Skeleton, useContent, useMe, useSeason } from "../ui";
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
    ["/notices", "Notices", t("noticesMinistries"), t("capNoticesMin"), notices.length ? String(notices.length) : undefined],
    ["/schedule", "Schedule", t("schedule"), schedCount ? (me ? me.track : t("capSchedule")) : t("capSoon")],
    ...(loggedIn ? [["/me", "Room & Fee", t("myInfo"), t("capMe")] as [string, string, string, string]] : [["/login", "My Page", t("myInfo"), t("capLogin")] as [string, string, string, string]]),
    ["/guide", "Guide", t("guide"), t("capGuide")],
    ["/places", "Campus", t("places"), t("capPlaces")],
  ];

  const lead = title.match(/^(.*?향한)\s+(.+)$/);
  const venue = s?.venue?.match(/^(.*?캠퍼스)\s+(.+)$/);

  const others = (content?.projects ?? []).filter(p => p.id !== s?.id);
  const tiles: [string, string, string, string][] = [
    ["/schedule", "Schedule", t("schedule"), schedCount ? (me ? me.track : t("capSchedule")) : t("capSoon")],
    ["/guide", "Guide", t("guide"), t("capGuide")],
    ["/places", "Campus", t("places"), t("capPlaces")],
  ];

  return (
    <div className="app home">
      <SiteNav />
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
              {s.start && <div><dt>Date</dt><dd className="num">{fmtRange(s.start, s.end)}</dd></div>}
              {s.venue && <div><dt>Location</dt><dd>{venue ? <>{venue[1]}<br />{venue[2]}</> : s.venue}</dd></div>}
            </dl>
            {me ? <Pass me={me} /> : (
              <div className="cta">
                {s.login && <Link className="btn" to="/login">{t("myInfo")}</Link>}
                {s.applyUrl && s.status !== "종료" && <a className="link-cta" href={s.applyUrl} target="_blank" rel="noreferrer">{t("apply")} <span aria-hidden>→</span></a>}
              </div>
            )}
          </aside>
        )}
      </section>

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
        {notices[0] && (
          <Link to="/notices" className="latest narrow-only">
            <span className="label">Latest</span>
            <span className="latest-t">{notices[0].title}</span>
            <span className="small num">{notices[0].date.replace(/-/g, ". ")}</span>
          </Link>
        )}

        {/* 아이패드·컴퓨터: 공지 | 사역 안내, 아래 바로가기 */}
        <div className="wide-only wide-grid">
          <section className="col">
            <div className="col-head"><span className="label">Notices</span><Link to="/notices" className="more">{t("seeAll")} →</Link></div>
            {notices.length === 0 && <div className="empty">{t("noNotice")}</div>}
            {notices.slice(0, 3).map((n, i) => (
              <Link key={i} to="/notices" className="notice">
                <span className="when">{n.pinned && <span className="pin">Pinned</span>}{n.date.replace(/-/g, ".")}</span>
                <h3>{n.title}</h3>
                {n.body && <span className="sub clamp">{n.body}</span>}
              </Link>
            ))}
          </section>
          <section className="col">
            <div className="col-head"><span className="label">Ministries</span><Link to="/notices#ministries" className="more">{t("otherMinistries")} →</Link></div>
            {others.map(p => (
              <Link key={p.id} to={`/p/${encodeURIComponent(p.id)}`} className="ministry" style={{ ["--c" as string]: p.color }}>
                <span className="bar-c" />
                <span>
                  <span className="t">{p.title}</span>
                  {(p.start || p.subtitle) && <span className="small" style={{ display: "block" }}>{p.start ? fmtRange(p.start, p.end) : p.subtitle}</span>}
                </span>
                <span className="arrow">{Icon.arrow}</span>
              </Link>
            ))}
          </section>
        </div>
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
