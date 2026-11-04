import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import type { Me } from "../types";
import { Footer, Icon, LangToggle, SiteNav, Skeleton, todayIso, useContent, useMe, useSeason } from "../ui";
import { forTrack, payView } from "./shared";

const SLIDES = [1, 2, 3, 4, 5].map(n => `/images/slides/${n}.jpg`);

/** 현장 사진 슬라이드: 5초마다 자동으로 넘어가고, 점·좌우 스와이프로 직접 넘길 수 있음. 모션 줄이기 설정이면 자동 넘김 없음 */
function Slides() {
  const [i, setI] = useState(0);
  const x0 = useRef<number | null>(null);
  const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => { if (!document.hidden) setI(v => (v + 1) % SLIDES.length); }, 5000);
    return () => clearInterval(id);
  }, [still, i]);
  const go = (d: number) => setI(v => (v + d + SLIDES.length) % SLIDES.length);
  return (
    <figure className="slides" aria-roledescription="carousel"
      onTouchStart={e => { x0.current = e.touches[0].clientX; }}
      onTouchEnd={e => { if (x0.current == null) return; const dx = e.changedTouches[0].clientX - x0.current; x0.current = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }}>
      {SLIDES.map((src, n) => (
        <img key={src} src={src} alt="" className={n === i ? "on" : ""} loading={n === 0 ? "eager" : "lazy"} decoding="async" />
      ))}
      <div className="dots" role="tablist">
        {SLIDES.map((_, n) => <button key={n} role="tab" aria-selected={n === i} aria-label={`${n + 1} / ${SLIDES.length}`} className={n === i ? "on" : ""} onClick={() => setI(n)} />)}
      </div>
    </figure>
  );
}

const TRACKS: { name: string; dates: string; nights: string }[] = [
  { name: "청지기를 위한 경배와찬양학교", dates: "1/11(월) ~ 1/16(토), 1/18(월) ~ 1/21(목)", nights: "8박 10일" },
  { name: "미래세대를 위한 경배와찬양학교", dates: "1/11(월) ~ 1/14(목)", nights: "3박 4일" },
  { name: "어린이를 위한 경배와찬양학교", dates: "1/14(목) ~ 1/16(토)", nights: "2박 3일" },
  { name: "대학 청년 및 일반인을 위한 경배와찬양학교", dates: "1/18(월) ~ 1/21(목)", nights: "3박 4일" },
];
const WEEKLY: { name: string; when: string; where: string }[] = [
  { name: "목요모임", when: "매주 목요일 오후 6시 30분", where: "온누리교회 서빙고성전" },
  { name: "7000모임", when: "매주 토요일 오후 4시", where: "서빙고 경배와찬양 훈련원" },
];

const WD = ["일", "월", "화", "수", "목", "금", "토"];
function krDate(iso: string, year = true) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${year ? y + "년 " : ""}${m}월 ${d}일(${WD[new Date(y, m - 1, d).getDay()]})`;
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
    ["/notices", "Notices", t("noticesMinistries"), t("capNoticesMin")],
    ["/schedule", "Schedule", t("schedule"), schedCount ? (me ? me.track : t("capSchedule")) : t("capSoon")],
    ...(loggedIn ? [["/me", "Room & Fee", t("myInfo"), t("capMe")] as [string, string, string, string]] : [["/login", "My Page", t("myInfo"), t("capLogin")] as [string, string, string, string]]),
    ["/guide", "Guide", t("guide"), t("capGuide")],
    ["/places", "Campus", t("places"), t("capPlaces")],
  ];

  const dday = (() => {
    if (!s?.start) return "";
    const d = Math.round((Date.parse(s.start) - Date.parse(todayIso())) / 864e5);
    if (d > 0) return `D-${d}`;
    if (s.end && Date.parse(todayIso()) <= Date.parse(s.end)) return t("now");
    return "";
  })();
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
        <div className="cover-paper mast-text">
          {!s && loading && <Skeleton lines={4} />}
          {s && (
            <>
              <span className="label">{year} {season.toUpperCase()}{dday && <span className="dday">{dday}</span>}</span>
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
          {s && (
            <>
              <dl className="facts">
                {s.start && <div><dt>Date</dt><dd>{krDate(s.start)}{s.end && s.end !== s.start ? ` ~ ${krDate(s.end, s.end.slice(0, 4) !== s.start.slice(0, 4))}` : ""}</dd></div>}
                {s.venue && <div><dt>Location</dt><dd>{s.venue}</dd></div>}
              </dl>
              <div className="cta">
                <Link className="btn" to={loggedIn ? "/me" : "/login"}>{t("myInfo")}</Link>
                {s.applyUrl && s.status !== "종료" && <a className="btn line" href={s.applyUrl}>{t("apply")}</a>}
              </div>
              {me && <Pass me={me} />}
            </>
          )}
        </div>
        <Slides />
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
        {s?.id === "2027W" && (
          <section className="home-sec">
            <div className="col-head"><span className="label">Programs</span></div>
            <div className="track-grid">
              {TRACKS.map(x => (
                <Link key={x.name} to="/schedule" className="track-card">
                  <span className="n">{x.nights}</span>
                  <span className="t">{x.name}</span>
                  <span className="d">{x.dates}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section className="home-sec">
          <div className="col-head"><span className="label">Every week</span><Link to="/notices#ministries" className="more">{t("otherMinistries")} →</Link></div>
          <div className="week-grid">
            {WEEKLY.map(x => (
              <Link key={x.name} to="/notices#ministries" className="week-card">
                <span className="t">{x.name}</span>
                <span className="d">{x.when}</span>
                <span className="w">{x.where}</span>
              </Link>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
