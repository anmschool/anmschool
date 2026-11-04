import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import type { Me } from "../types";
import { fmtRange, Footer, Icon, LangToggle, SiteNav, Skeleton, useContent, useMe, useSeason } from "../ui";
import { forTrack, payView } from "./shared";

const ANM_INTRO = [
  "올네이션스 경배와찬양(All Nations Worship & Praise Ministries)은 모든 민족과 열방을 향하신 하나님 아버지의 마음을 가지고 나아가는 경배와찬양의 국제명칭입니다.",
  "All Nations Worship & Praise Ministries는 20세기 말 이데올로기가 무너진 이후 급속히 진행되고 있는 세속화의 물결 속에서 타락해 가는 이 세대를 향하여 살아계신 하나님과 예수 그리스도의 복음을 선포하기 위하여 세워진 초교파적인 선교단체입니다.",
  "올네이션스 경배와찬양은 포스트모더니즘과 상대주의, 다원주의, 뉴에이지의 사회 속에서 교회의 예배 회복과 영적인 부흥을 위하여 1987년 하스데반 선교사님에 의해 설립되었습니다. 하나님은 경배와찬양을 사용하셔서 지난 20년 동안 한국교회의 예배 회복뿐 아니라 전 세계를 향한 복음의 행진을 하게 하셨습니다. 현재는 경배와찬양의 국제사역을 통해 개척된 대만, 홍콩, 몽골, 일본 등 13개국과 앞으로 개척될 베트남, 라오스, 인도네시아, 인도, 이탈리아, 프랑스 등 10개국에 천여 명의 선교사와 헌신된 사역자, 그리고 선교 후보생들이 나아가 각 나라의 선교사역을 감당하고 있습니다.",
];

const SCHOOL = [
  "국내와 해외 개척지에서 1년에 두 번, 여름과 겨울에 3박 4일에서 4박 5일간 구별된 장소에서 훈련을 갖습니다. 대학생을 포함한 일반인, 중고등부, 어린이, 예배예술인과 목회자 및 선교사 가정을 위한 경배와찬양학교를 진행합니다.",
  "첫날 훈련 안내 시간에 경배와찬양학교에 기대하는 기도제목을 적습니다. 이 시간부터 훈련이 시작되며, 감추어졌던 모든 기도의 제목을 기록하면서 자신의 삶을 돌아봅니다.",
  "다음 날 아침 7시부터 시작하는 침묵기도는 잠잠히 하나님의 음성을 듣고 자신의 삶을 조명하며 기도하는 시간입니다. 오전 강의와 오후 관심 분야별 선택강의와 학습활동을 통해 각 경배와찬양학교의 주제 말씀을 듣고 적용합니다.",
  "저녁 집회는 뜨거운 찬양과 기도 속에 성령을 경험하는 시간입니다. 먼저 하나님을 만나고, 둘째 자신의 삶을 헌신하고 전적으로 하나님의 뜻을 따라 살기로 결정합니다. 그리고 감추어졌던 모든 쓴 뿌리와 성품, 가정의 기도제목을 가지고 기도하면서 새로운 출발을 시작합니다.",
];

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
              {s.start && <div><dt>Date</dt><dd className="num">{fmtRange(s.start, s.end)}</dd></div>}
              {s.venue && <div><dt>Location</dt><dd>{venue ? <>{venue[1]}<br />{venue[2]}</> : s.venue}</dd></div>}
            </dl>
            <div className="mast-intro">{ANM_INTRO.map((x, i) => <p key={i}>{x}</p>)}</div>
            {me ? <Pass me={me} /> : (
              <div className="cta">
                {s.login && <Link className="btn" to="/login">{t("myInfo")}</Link>}
                {s.applyUrl && s.status !== "종료" && <a className="link-cta" href={s.applyUrl} target="_blank" rel="noreferrer">{t("apply")} <span aria-hidden>→</span></a>}
              </div>
            )}
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
        <section className="school">
          <span className="label">Worship &amp; Praise School</span>
          <p className="school-verse">“마음을 다하고 성품을 다하고 힘을 다하여 네 하나님 여호와를 사랑하라”<span className="ref">신 6:4–9, 11:13–21</span></p>
          {SCHOOL.map((x, i) => <p key={i}>{x}</p>)}
        </section>

        {others.length > 0 && (
          <section className="ministries">
            <div className="col-head"><span className="label">Ministries</span></div>
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
        )}
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
