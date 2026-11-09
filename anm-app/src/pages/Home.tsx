import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLang, type Lang } from "../i18n";
import type { Me } from "../types";
import { CopyButton, Footer, Icon, LangToggle, SiteNav, Skeleton, todayIso, useContent, useMe, useSeason } from "../ui";
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

type L = Record<Lang, string>;
const TRACKS: { key: string; start: string; name: L; dates: L; nights: L }[] = [
  { key: "청지기", start: "2027-01-06", name: { ko: "청지기를 위한 경배와찬양학교", en: "Worship & Praise School for Stewards", zh: "为管家的敬拜赞美学校" },
    dates: { ko: "1/6(수) ~ 1/16(토)", en: "Jan 6 (Wed) – 16 (Sat)", zh: "1月6日(周三) ~ 16日(周六)" },
    nights: { ko: "10박 11일", en: "10 nights · 11 days", zh: "10晚11天" } },
  { key: "십대", start: "2027-01-11", name: { ko: "십대를 위한 경배와찬양학교", en: "Worship & Praise School for Teens", zh: "为青少年的敬拜赞美学校" },
    dates: { ko: "1/11(월) ~ 1/14(목)", en: "Jan 11 (Mon) – 14 (Thu)", zh: "1月11日(周一) ~ 14日(周四)" },
    nights: { ko: "3박 4일", en: "3 nights · 4 days", zh: "3晚4天" } },
  { key: "어린이", start: "2027-01-14", name: { ko: "어린이를 위한 경배와찬양학교", en: "Worship & Praise School for Children", zh: "为儿童的敬拜赞美学校" },
    dates: { ko: "1/14(목) ~ 1/16(토)", en: "Jan 14 (Thu) – 16 (Sat)", zh: "1月14日(周四) ~ 16日(周六)" },
    nights: { ko: "2박 3일", en: "2 nights · 3 days", zh: "2晚3天" } },
  { key: "대학청년·일반", start: "2027-01-06", name: { ko: "대학 청년 및 일반인을 위한 경배와찬양학교", en: "Worship & Praise School for University Students, Young Adults & General Adults", zh: "为大学青年及一般成人的敬拜赞美学校" },
    dates: { ko: "1/6(수) ~ 1/9(토)", en: "Jan 6 (Wed) – 9 (Sat)", zh: "1月6日(周三) ~ 9日(周六)" },
    nights: { ko: "3박 4일", en: "3 nights · 4 days", zh: "3晚4天" } },
];
/** 운영 시트 트랙 탭의 입실·퇴실 → 날짜·박수 문구 (없으면 위 기본값) */
const WK: L[] = [["일", "Sun", "周日"], ["월", "Mon", "周一"], ["화", "Tue", "周二"], ["수", "Wed", "周三"], ["목", "Thu", "周四"], ["금", "Fri", "周五"], ["토", "Sat", "周六"]].map(([ko, en, zh]) => ({ ko, en, zh }));
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function pd(s: string) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function spanText(segs: [string, string][], lang: Lang) {
  return segs.map(([a, b]) => {
    const A = pd(a), B = pd(b), w = (x: Date) => WK[x.getDay()][lang];
    if (lang === "en") return `${MON[A.getMonth()]} ${A.getDate()} (${w(A)}) – ${A.getMonth() === B.getMonth() ? "" : MON[B.getMonth()] + " "}${B.getDate()} (${w(B)})`;
    if (lang === "zh") return `${A.getMonth() + 1}月${A.getDate()}日(${w(A)}) ~ ${A.getMonth() === B.getMonth() ? "" : B.getMonth() + 1 + "月"}${B.getDate()}日(${w(B)})`;
    return `${A.getMonth() + 1}/${A.getDate()}(${w(A)}) ~ ${B.getMonth() + 1}/${B.getDate()}(${w(B)})`;
  }).join(lang === "zh" ? "，" : ", ");
}
function nightsText(segs: [string, string][], lang: Lang) {
  const n = segs.reduce((t, [a, b]) => t + Math.round((pd(b).getTime() - pd(a).getTime()) / 864e5), 0), d = n + segs.length;
  return lang === "en" ? `${n} nights · ${d} days` : lang === "zh" ? `${n}晚${d}天` : `${n}박 ${d}일`;
}

/** 등록비 — 신청서(public/apply)의 FEE·ONLINE과 같은 값 */
const FEE: Record<string, { acc: "A" | "B"; one?: [number, number]; early?: number[]; reg?: number[]; online: number }> = {
  "청지기": { acc: "A", one: [190000, 220000], online: 75000 },
  "대학청년·일반": { acc: "A", early: [120000, 100000, 80000], reg: [140000, 120000, 100000], online: 55000 },
  "십대": { acc: "A", early: [120000, 100000, 80000], reg: [140000, 120000, 100000], online: 55000 },
  "어린이": { acc: "B", early: [100000, 80000, 70000], reg: [120000, 100000, 90000], online: 40000 },
};
const CATS: Record<Lang, string[]> = { ko: ["일반·대학청년", "십대", "어린이"], en: ["Adults · University", "Teens", "Children"], zh: ["一般·大学青年", "青少年", "儿童"] };
const SHORT: Record<string, L> = { "청지기": { ko: "청지기", en: "Stewards", zh: "管家" }, "대학청년·일반": { ko: "대학청년·일반", en: "Adults", zh: "大学青年·一般" }, "십대": { ko: "십대", en: "Teens", zh: "青少年" }, "어린이": { ko: "어린이", en: "Children", zh: "儿童" } };
const wonT = (n: number, lang: Lang) => lang === "ko" ? `${n.toLocaleString("en-US")}원` : `₩${n.toLocaleString("en-US")}`;
const DEADLINE: L = { ko: "~12/23", en: "to Dec 23", zh: "~12月23日" };
const AFTER: L = { ko: "12/24~", en: "from Dec 24", zh: "12月24日~" };

const WEEKLY: { name: L; when: L; where: L }[] = [
  { name: { ko: "목요모임", en: "Thursday Worship", zh: "周四聚会" },
    when: { ko: "매주 목요일 오후 6시 30분", en: "Every Thursday, 6:30 PM", zh: "每周四 下午6:30" },
    where: { ko: "온누리교회", en: "Onnuri Church", zh: "온누리教会" } },
  { name: { ko: "7000모임", en: "7000 Gathering", zh: "7000聚会" },
    when: { ko: "매주 토요일 오후 4시", en: "Every Saturday, 4:00 PM", zh: "每周六 下午4:00" },
    where: { ko: "서빙고 경배와찬양 훈련원", en: "Seobinggo Worship & Praise Training Center", zh: "西冰库敬拜赞美训练院" } },
];
const ACCOUNTS: { who: L; bank: L; no: string }[] = [
  { who: { ko: "청지기 · 십대 · 대학 청년 및 일반인 · 온라인", en: "Stewards · Teens · University Students, Young Adults & General · Online", zh: "管家 · 青少年 · 大学青年及一般成人 · 线上" },
    bank: { ko: "우리은행", en: "Woori Bank", zh: "友利银行" }, no: "1005-604-700231" },
  { who: { ko: "어린이", en: "Children", zh: "儿童" },
    bank: { ko: "우리은행", en: "Woori Bank", zh: "友利银行" }, no: "1005-404-679551" },
];
const ACC_TEXT = {
  title: { ko: "훈련비 입금 계좌", en: "Fee payment accounts", zh: "培训费汇款账户" } as L,
  holder: { ko: "예금주 경배와찬양", en: "Account holder: 경배와찬양 (Worship & Praise)", zh: "户名：경배와찬양 (敬拜赞美)" } as L,
  note: { ko: "입금자명은 ‘이름(교회)’로 적어 주세요. 금액은 신청서와 ‘내 등록 확인’에서 볼 수 있습니다.", en: "Please write the depositor name as ‘Name (Church)’. The amount is shown on the application and in My registration.", zh: "汇款人姓名请填写“姓名(教会)”。金额可在报名页和“我的报名”中查看。" } as L,
};

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
  const { t, lang } = useLang();
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
          {!s && loading && <div id="boot"><b>ANM</b><i></i></div>}
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
                {s.applyUrl && s.status !== "종료" && <a className="btn" href={s.applyUrl}>{t("apply")}</a>}
                <Link className="btn line" to={loggedIn ? "/me" : "/login"}>{t("checkReg")}</Link>
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
            <div className="col-head"><span className="label">Worship &amp; Praise School</span></div>
            <div className="prog-list">
              {TRACKS.map(x => {
                const r = content?.tracks?.[s.id]?.list.find(t => t.name === x.key && t.mode !== "온라인");
                const segs = (r ? [[r.in1, r.out1], [r.in2, r.out2]].filter(([a, b]) => a && b) : []) as [string, string][];
                return { x, segs, start: segs[0]?.[0] || x.start };
              }).sort((a, b) => a.start.localeCompare(b.start)).map(({ x, segs, start }) => {
                const D = pd(start);
                return (
                <Link key={x.key} to={`/schedule?track=${encodeURIComponent(x.key)}`} className="prog">
                  <span className="prog-date" aria-hidden="true">
                    <span>{lang === "en" ? MON[D.getMonth()] : lang === "zh" ? `${D.getMonth() + 1}月` : `${D.getMonth() + 1}월`}</span>
                    <b>{D.getDate()}</b>
                    <span>{WK[D.getDay()][lang]}</span>
                  </span>
                  <span className="prog-main">
                    <span className="t">{x.name[lang]}</span>
                    <span className="d">{segs.length ? spanText(segs, lang) : x.dates[lang]} · {segs.length ? nightsText(segs, lang) : x.nights[lang]}</span>
                    {x.key === "청지기" && <span className="w">{t("withAll")}</span>}
                  </span>
                  <span className="go"><span className="go-t">{t("seeTT")}</span>{Icon.arrow}</span>
                </Link>
                );
              })}
            </div>
            <p className="prog-online"><b>{t("onlineT")}</b> · {t("onlineD")}</p>
          </section>
        )}
        {s?.id === "2027W" && (
          <section className="home-sec" id="payment">
            <div className="col-head"><span className="label">Payment</span></div>
            <div className="pay-note">
              <span className="chip">{t("payCheck")}</span>
              <span>{t("payRule1")}<b>{t("payRule2")}</b>{t("payRule3")}</span>
              <span className="ex">{t("payEx")}</span>
            </div>
            <div className="acc-grid">
              {ACCOUNTS.map(x => (
                <div key={x.no} className="acc-card">
                  <span className="n">{x.who[lang]}</span>
                  <span className="d">{x.bank[lang]} · {ACC_TEXT.holder[lang]}</span>
                  <span className="t num">{x.no}</span>
                  <div className="acc-copy"><CopyButton acc text={`${x.bank[lang]} ${x.no}`} /></div>
                </div>
              ))}
            </div>
            <p className="acc-note">ⓘ {t("copyAccHint")} · {t("family")}</p>
            <details className="fee-tg">
              <summary>{t("feeToggle")}</summary>
              <div className="fee-tbl">
                <div className="fee-h"><span /><span>{t("early")}<small>{DEADLINE[lang]}</small></span><span>{t("regular")}<small>{AFTER[lang]}</small></span></div>
                {TRACKS.map(x => {
                  const f = FEE[x.key];
                  const rows: [string, number, number][] = f.one ? [[t("allWho"), f.one[0], f.one[1]]] : CATS[lang].map((c, i) => [c, f.early![i], f.reg![i]]);
                  return (
                    <div key={x.key} className="fee-g">
                      <div className="fee-n">{x.name[lang]}{f.acc === "B" && <small>{ACCOUNTS[1].bank[lang]} {ACCOUNTS[1].no}</small>}</div>
                      {rows.map(([c, a, b]) => <div key={c} className="fee-r"><span>{c}</span><b>{wonT(a, lang)}</b><span>{wonT(b, lang)}</span></div>)}
                    </div>
                  );
                })}
                <div className="fee-g">
                  <div className="fee-n">{t("onlineFee")}</div>
                  {TRACKS.map(x => <div key={x.key} className="fee-r"><span>{SHORT[x.key][lang]} · {x.nights[lang]}</span><b>{wonT(FEE[x.key].online, lang)}</b><span /></div>)}
                </div>
              </div>
            </details>
            {loggedIn && <Link to="/me" className="more-link">{t("myFee")} →</Link>}
          </section>
        )}
        <section className="home-sec">
          <div className="col-head"><span className="label">Every week</span><Link to="/notices#ministries" className="more">{t("otherMinistries")} →</Link></div>
          <div className="week-grid">
            {WEEKLY.map(x => (
              <Link key={x.name.ko} to="/notices#ministries" className="week-card">
                <span className="t">{x.name[lang]}</span>
                <span className="d">{x.when[lang]}</span>
                <span className="w">{x.where[lang]}</span>
              </Link>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
