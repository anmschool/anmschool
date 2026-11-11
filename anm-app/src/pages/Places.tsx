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
/** 캠퍼스 약도 — 네이버 좌표(위도·경도)를 그대로 옮긴 위치. 동서 1m=1, 남북 1m=1.3 으로 그림 */
/** 캠퍼스 약도 — 네이버 좌표를 그대로 옮긴 위치(동서 1m=1, 남북 1m=1.3). 점=실제 위치, 이름표는 옆으로 빼서 겹치지 않게 */
const PTS: { id: string; lat: number; lng: number; t: L; kind: "b" | "p" | "g"; dx: number; dy: number; go: string }[] = [
  { id: "gate", lat: 37.224858, lng: 127.187789, kind: "g", t: { ko: "정문", en: "Main gate", zh: "正门" }, dx: -62, dy: 0, go: "" },
  { id: "chapel", lat: 37.223813, lng: 127.186859, kind: "b", t: { ko: "60주년 채플관", en: "Chapel", zh: "礼拜堂" }, dx: 44, dy: 44, go: "worship" },
  { id: "p1", lat: 37.224074, lng: 127.186787, kind: "p", t: { ko: "", en: "", zh: "" }, dx: 0, dy: 0, go: "parking" },
  { id: "p2", lat: 37.22352, lng: 127.185734, kind: "p", t: { ko: "온실 앞", en: "Greenhouse", zh: "温室前" }, dx: 0, dy: 40, go: "parking" },
  { id: "dining", lat: 37.223738, lng: 127.183078, kind: "b", t: { ko: "식당", en: "Dining", zh: "食堂" }, dx: 56, dy: 46, go: "dining" },
  { id: "dorm5", lat: 37.223762, lng: 127.182734, kind: "b", t: { ko: "생활관 5동", en: "Dorm 5", zh: "宿舍5栋" }, dx: -24, dy: 46, go: "lodging" },
  { id: "md", lat: 37.224062, lng: 127.181884, kind: "b", t: { ko: "명덕관", en: "Myeongdeok", zh: "明德馆" }, dx: 10, dy: -44, go: "lodging" },
];
const px = (lng: number) => 40 + (lng - 127.1815) * 88700;
const py = (lat: number) => 20 + (37.225 - lat) * 111000 * 1.3;
const tw = (s: string) => [...s].reduce((n, c) => n + (/[\x00-\x7f]/.test(c) ? 11 : 19), 0) + 26;
function CampusMap({ lang }: { lang: Lang }) {
  const jump = (id: string) => id && document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <figure className="cmap">
      <svg viewBox="0 0 640 300" role="img" aria-label={({ ko: "캠퍼스 약도", en: "Campus map", zh: "校园示意图" } as L)[lang]}>
        <g className="cmap-n" transform="translate(30 40)"><path d="M0 -16 L7 6 L0 1 L-7 6 Z" /><text y="24">N</text></g>
        <g className="cmap-s" transform="translate(24 288)"><path d="M0 -6 V0 H100 V-6" /><text x="108" y="0">100m</text></g>
        {PTS.map(p => {
          const x = px(p.lng), y = py(p.lat), cx = x + p.dx, cy = y + p.dy, w = tw(p.t[lang]);
          return (
            <g key={p.id} className={"cmap-pt " + p.kind} onClick={() => jump(p.go)} style={{ cursor: p.go ? "pointer" : undefined }}>
              {p.t[lang] && (p.dx || p.dy) ? <line x1={x} y1={y} x2={cx} y2={cy} /> : null}
              {p.kind === "p" ? <circle cx={x} cy={y} r="17" /> : <circle className="dot" cx={x} cy={y} r="6" />}
              {p.kind === "p" && <text x={x} y={y + 5} className="pin">P{p.id.slice(1)}</text>}
              {p.t[lang] && <><rect x={cx - w / 2} y={cy - 16} width={w} height="32" rx="16" /><text x={cx} y={cy + 6}>{p.t[lang]}</text></>}
            </g>
          );
        })}
      </svg>
      <figcaption>{({ ko: "실제 위치 기준 약도입니다. 이름을 누르면 해당 안내로 이동합니다.", en: "Drawn to scale. Tap a name to jump to its section.", zh: "按实际位置绘制，点击名称可跳转到对应说明。" } as L)[lang]}</figcaption>
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
