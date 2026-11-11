import { useLang, type Lang } from "../i18n";
import { Footer, Head, useContent, useMe, useSeason } from "../ui";
import { IndexLayout } from "./IndexLayout";

type L = Record<Lang, string>;
/** 장소 종류(시트 '종류') → 큰 제목. 장소 이름은 그 아래 작게 */
const GROUPS: { id: string; kinds: string[]; label: L }[] = [
  { id: "worship", kinds: ["예배", "강의"], label: { ko: "예배·강의", en: "Worship & Sessions", zh: "敬拜·讲座" } },
  { id: "dining", kinds: ["식당", "식사"], label: { ko: "식사", en: "Meals", zh: "用餐" } },
  { id: "lodging", kinds: ["숙소"], label: { ko: "숙소", en: "Rooms", zh: "宿舍" } },
];
const MAPT: L = { ko: "캠퍼스 약도", en: "Campus Map", zh: "校园示意图" };
const PARK: L = { ko: "주차", en: "Parking", zh: "停车" };
const PARK_ROWS: { t: L; img: string; naver: string; google: string }[] = [
  { t: { ko: "채플관 옆 주차장", en: "Parking lot next to the Chapel", zh: "礼拜堂旁停车场" }, img: "", naver: "https://map.naver.com/p/entry/coordinates/3zqqir,2AxGbq?c=18.00,0,0,0,dh", google: "https://www.google.com/maps/search/?api=1&query=37.224074,127.186787" },
  { t: { ko: "채플관 옆 오른쪽 길로 올라가 온실 앞", en: "Up the road on the right of the Chapel, in front of the greenhouse", zh: "沿礼拜堂右侧道路上行，温室前" }, img: "", naver: "https://map.naver.com/p/entry/coordinates/3zqnyx,2AxEK2?c=18.00,0,0,0,dh", google: "https://www.google.com/maps/search/?api=1&query=37.223520,127.185734" },
];
/** 장소별 지도 (시트 지도 칸보다 우선) */
const LINKS: Record<string, [string, string]> = {
  "60주년 기념 채플관": ["https://naver.me/GyYWndK8", "https://maps.app.goo.gl/H5193Vf8fMRFwHYw8"],
  "식당": ["https://naver.me/FlBWIDS1", "https://maps.app.goo.gl/htBX67Hg14YKs43L7"],
  "5동": ["https://naver.me/GJZ6k3oY", "https://maps.app.goo.gl/im9RUAJ1g4W9NiNc7"],
  "명덕관": ["https://naver.me/x9BeSraH", "https://www.google.com/maps/search/?api=1&query=37.224062,127.181884"],
};
/** 시트 이름이 언어별로 번역돼도 맞도록 종류·이름 일부로 지도 찾기 */
function linksOf(p: { name: string; kind?: string }): [string, string] | undefined {
  const n = p.name, k = p.kind ?? "";
  if (/예배|강의/.test(k) || /채플|Chapel|礼拜/i.test(n)) return LINKS["60주년 기념 채플관"];
  if (/식당|식사/.test(k) || /식당|Dining|食堂/i.test(n)) return LINKS["식당"];
  if (/5\s*동|Dorm\s*5|5栋/i.test(n)) return LINKS["5동"];
  if (/명덕|Myeongdeok|明德/i.test(n)) return LINKS["명덕관"];
  return undefined;
}
const PARK_NOTE: L = { ko: "주차할 수 있는 곳은 아래 두 곳입니다.", en: "You can park in these two areas.", zh: "可停车区域为以下两处。" };
/** 영상 파일 이름(course1_main_gate_to_chapel.mp4) → "정문 → 채플관" */
const SPOT: Record<string, L> = {
  main_gate: { ko: "정문", en: "Main gate", zh: "正门" }, chapel: { ko: "채플관", en: "Chapel", zh: "礼拜堂" },
  restaurant: { ko: "식당", en: "Dining hall", zh: "食堂" }, myeongdeok: { ko: "명덕관", en: "Myeongdeok Hall", zh: "明德馆" },
  dorm5: { ko: "생활관 5동 (식당 옆)", en: "Dorm 5 (next to the dining hall)", zh: "宿舍5栋（食堂旁）" },
};
function routeOf(v: string, lang: Lang, place = "") {
  const m = v.match(/([a-z0-9]+(?:_[a-z0-9]+)*?)_to_([a-z0-9_]+)\.\w+$/i);
  if (!m) return "";
  const a = m[1].replace(/^course\d+_/, ""), b = /5동/.test(place) && m[2] === "restaurant" ? "dorm5" : m[2]; // 5동은 식당 바로 옆 → 같은 영상
  return `${SPOT[a]?.[lang] ?? a} → ${SPOT[b]?.[lang] ?? b}`;
}
/** 캠퍼스 약도 — 네이버 지도(2026.11 캡처)의 도로를 따라 그린 그림. 좌표 단위는 캡처 화면 px(100m≈130) */
const ROADS = [
  "M729 790 L722 905 L700 903 L610 900 L560 912 L520 930 L460 945 L380 940 L300 937 L220 925 L150 913 L60 905 L20 905",
  "M722 905 L735 980 L750 1040 L820 1100 L900 1140",
  "M462 950 L470 1035 L530 1030 L525 945",
  "M470 1035 L550 1085 L600 1120",
  "M65 912 L80 960 L110 1072",
  "M20 1080 L60 1074 L300 1062 L400 1060 L460 1090 L500 1135",
  "M140 935 L135 1068",
];
/** 주 이동 동선(정문 → 채플관 / 채플관 → 식당·5동 / 정문 → 명덕관) */
const ROUTE = "M729 812 L722 905 L700 903 L628 901 L560 912 L520 930 L460 945 L380 940 L300 937 L220 925 L150 913 L95 908";
const SPURS = ["M628 901 L628 948", "M219 926 L219 962", "M180 921 L180 962", "M95 908 L92 920"];
const PTS: { id: string; x: number; y: number; t: L; kind: "b" | "p" | "g"; dx: number; dy: number; go: string }[] = [
  { id: "gate", x: 729, y: 812, kind: "g", t: { ko: "정문", en: "Main Gate", zh: "正门" }, dx: -58, dy: 0, go: "" },
  { id: "chapel", x: 628, y: 962, kind: "b", t: { ko: "60주년 채플관", en: "Chapel", zh: "礼拜堂" }, dx: 30, dy: 44, go: "worship" },
  { id: "p1", x: 621, y: 925, kind: "p", t: { ko: "", en: "", zh: "" }, dx: 0, dy: 0, go: "parking" },
  { id: "p2", x: 497, y: 990, kind: "p", t: { ko: "온실 앞", en: "Greenhouse", zh: "温室前" }, dx: 0, dy: 50, go: "parking" },
  { id: "dining", x: 219, y: 972, kind: "b", t: { ko: "식당", en: "Dining", zh: "食堂" }, dx: 40, dy: 46, go: "dining" },
  { id: "dorm5", x: 180, y: 970, kind: "b", t: { ko: "생활관 5동", en: "Dorm 5", zh: "宿舍5栋" }, dx: -40, dy: 46, go: "lodging" },
  { id: "md", x: 92, y: 930, kind: "b", t: { ko: "명덕관", en: "Myeongdeok", zh: "明德馆" }, dx: 20, dy: -50, go: "lodging" },
];
const tw = (s: string) => [...s].reduce((n, c) => n + (/[\x00-\x7f]/.test(c) ? 11 : 19), 0) + 26;
function CampusMap({ lang }: { lang: Lang }) {
  const jump = (id: string) => id && document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <figure className="cmap">
      <div className="cmap-wrap" ref={el => { if (el && !el.dataset.c) { el.dataset.c = "1"; el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; } }}>
      <svg viewBox="10 770 790 340" role="img" aria-label={MAPT[lang]}>
        <rect x="10" y="770" width="790" height="340" className="cmap-bg" />
        <path className="cmap-campus" d="M20 900 L150 905 L300 928 L460 936 L560 902 L700 893 L760 880 L800 870 L800 1160 L20 1160 Z" />
        <g className="cmap-bld"><circle cx="618" cy="978" r="24" /><rect x="476" y="962" width="22" height="14" rx="2" /><rect x="150" y="950" width="64" height="16" rx="2" /><rect x="205" y="978" width="40" height="22" rx="2" /><rect x="40" y="915" width="70" height="40" rx="3" /></g>
        {ROADS.map(d => <path key={d} d={d} className="cmap-road-c" />)}
        {ROADS.map(d => <path key={d + "w"} d={d} className="cmap-road" />)}
        <path d={ROUTE} className="cmap-route" />
        {SPURS.map(d => <path key={d} d={d} className="cmap-route" />)}
        <g className="cmap-n" transform="translate(40 800)"><path d="M0 -16 L7 6 L0 1 L-7 6 Z" /><text y="24">N</text></g>
        <g className="cmap-s" transform="translate(30 1092)"><path d="M0 -6 V0 H130 V-6" /><text x="138" y="0">100m</text></g>
        <g className="cmap-lg" transform="translate(600 1092)"><path d="M0 -5 H34" className="cmap-route" /><text x="42" y="0">{({ ko: "주요 동선", en: "Main route", zh: "主要动线" } as L)[lang]}</text></g>
        {PTS.map(p => {
          const { x, y } = p, cx = x + p.dx, cy = y + p.dy, w = tw(p.t[lang]);
          return (
            <g key={p.id} className={"cmap-pt " + p.kind} onClick={() => jump(p.go)} style={{ cursor: p.go ? "pointer" : undefined }}>
              {p.t[lang] && (p.dx || p.dy) ? <line x1={x} y1={y} x2={cx} y2={cy} /> : null}
              {p.kind === "p" ? <circle cx={x} cy={y} r="15" /> : <circle className="dot" cx={x} cy={y} r="7" />}
              {p.kind === "p" && <text x={x} y={y + 5} className="pin">P{p.id.slice(1)}</text>}
              {p.t[lang] && <><rect x={cx - w / 2} y={cy - 16} width={w} height="32" rx="16" /><text x={cx} y={cy + 6}>{p.t[lang]}</text></>}
            </g>
          );
        })}
      </svg>
      </div>
      <figcaption>{({ ko: "네이버 지도를 따라 그린 약도입니다. 이름을 누르면 해당 안내로 이동하고, 폰에서는 좌우로 밀어 볼 수 있어요.", en: "Traced from Naver Map. Tap a name to jump to its section; swipe sideways on a phone.", zh: "依据Naver地图绘制，点击名称可跳转到对应说明；手机上可左右滑动查看。" } as L)[lang]}</figcaption>
    </figure>
  );
}
const MAPS: L = { ko: "네이버지도", en: "Naver Map", zh: "Naver地图" };
const GMAP: L = { ko: "구글맵", en: "Google Maps", zh: "Google地图" };

export default function Places() {
  const { content } = useContent();
  const s = useSeason();
  const { me } = useMe(s?.id);
  const { t, lang } = useLang();
  const mine = (me?.lodging ?? []).map(l => l.building).filter(Boolean);
  const isMine = (name: string) => mine.some(b => name.includes(b) || b.includes(name));
  const places = (content?.places ?? []).filter(p => p.project === s?.id).sort((a, b) => a.order - b.order);
  const groups = [
    ...GROUPS.map(g => ({ ...g, items: places.filter(p => g.kinds.includes(p.kind ?? "")) })),
    { id: "etc", label: { ko: "기타", en: "Other", zh: "其他" }, items: places.filter(p => !GROUPS.some(g => g.kinds.includes(p.kind ?? ""))) },
  ].filter(g => g.items.length);
  const park = s?.id === "2027W";

  return (
    <div className="app">
      <Head label="Campus" title={t("places")} />
      <main className="body guide-body">
        {places.length === 0 && <div className="empty">{t("comingSoon")}</div>}
        {places.length > 0 && (
        <IndexLayout items={[...(park ? [{ id: "campus-map", title: MAPT[lang] }] : []), ...groups.map(g => ({ id: g.id, title: g.label[lang] })), ...(park ? [{ id: "parking", title: PARK[lang] }] : [])]}>
        {park && <section id="campus-map" className="pl-sec"><h2>{MAPT[lang]}</h2><CampusMap lang={lang} /></section>}
        {groups.map(g => (
          <section key={g.id} id={g.id} className="pl-sec">
            <h2>{g.label[lang]}</h2>
            <div className={"pl-list" + (g.items.length > 1 ? " two" : "")}>
              {g.items.map(p => (
                <article key={p.name} className="pl">
                  <div className="pl-head"><h3>{p.name}</h3>{isMine(p.name) && <span className="mine">My Room</span>}</div>
                  {p.body && <p className="sub">{p.body}</p>}
                  {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
                  {p.video && (
                    <figure className="pl-video">
                      <figcaption><span className="rt">{t("route")}</span>{routeOf(p.video, lang, p.name)}</figcaption>
                      <video src={p.video} controls preload="none" playsInline poster={p.image} />
                    </figure>
                  )}
                  <div className="pl-btns">
                    {(linksOf(p)?.[0] || p.map) && <a className="pill" href={linksOf(p)?.[0] || p.map} target="_blank" rel="noreferrer">{MAPS[lang]} ↗</a>}
                    {linksOf(p)?.[1] && <a className="pill" href={linksOf(p)![1]} target="_blank" rel="noreferrer">{GMAP[lang]} ↗</a>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {park && (
          <section id="parking" className="pl-sec">
            <h2>{PARK[lang]}</h2>
            <p className="sub" style={{ margin: 0 }}>{PARK_NOTE[lang]}</p>
            <div className="pl-list two">
              {PARK_ROWS.map((r, i) => (
                <article key={r.naver} className="pl">
                  <div className="pl-head"><h3><span className="pk">P{i + 1}</span>{r.t[lang]}</h3></div>
                  {r.naver && <div className="pl-btns"><a className="pill" href={r.naver} target="_blank" rel="noreferrer">{MAPS[lang]} ↗</a><a className="pill" href={r.google} target="_blank" rel="noreferrer">{GMAP[lang]} ↗</a></div>}
                </article>
              ))}
            </div>
          </section>
        )}
        </IndexLayout>
        )}
        <Footer />
      </main>
    </div>
  );
}
